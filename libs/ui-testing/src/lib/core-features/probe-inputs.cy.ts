import { defineForm } from '@golemui/core';
import { eventsNamed, type FormHandle, type MountComponentFn } from '../utils';

const submitButton = {
  uid: 'submit',
  kind: 'action',
  type: 'button',
  label: 'Submit',
  actionType: 'submit',
} as const;

/**
 * The data of one submit call as JSON would send it. A key that was never set can be missing or
 * hold `undefined`, and both send the same JSON.
 */
const submittedJson = (stub: any, callIndex: number) =>
  JSON.parse(JSON.stringify(stub.getCall(callIndex).args[0].data));

/**
 * Registers the tests for the data and the events of textinput, checkbox, toggle and textarea.
 *
 * @param mountFn - Mounts a form with the options and the framework of the calling package.
 */
export const runProbeInputsComponentTests = (mountFn: MountComponentFn) => {
  describe('Basic inputs: data and events', () => {
    describe('data', () => {
      it('should submit an empty string for a textinput that was typed in and cleared', () => {
        mountFn({
          formDef: defineForm({
            form: [{ uid: 'name', kind: 'input', type: 'textinput', path: 'name' }, submitButton],
          }),
          formSubmit: cy.stub().as('formSubmit'),
        });

        cy.get('[data-cy="name_textinput"]').type('abc').clear();
        cy.get('[data-cy="submit_button"]').click();
        cy.get('@formSubmit').should('have.been.calledOnce');
        cy.get('@formSubmit').should((stub: any) => {
          expect(stub.getCall(0).args[0].data).to.deep.equal({ name: '' });
        });
      });

      it('should empty a textinput when the data is replaced with an empty object', () => {
        let handle!: FormHandle;
        mountFn({
          formDef: defineForm({
            form: [{ uid: 'name', kind: 'input', type: 'textinput', path: 'name' }],
          }),
          onFormReady: (h) => {
            handle = h;
          },
        });

        cy.get('[data-cy="name_textinput"]').type('xyz');
        cy.get('[data-cy="name_textinput"]').should('have.value', 'xyz');
        cy.then(() => handle.setData({}));
        cy.get('[data-cy="name_textinput"]').should('have.value', '');
      });

      it('should leave a checkbox and a toggle out of the data until the user changes them', () => {
        mountFn({
          formDef: defineForm({
            form: [
              { uid: 'agree', kind: 'input', type: 'checkbox', path: 'agree' },
              { uid: 'notify', kind: 'input', type: 'toggle', path: 'notify' },
              submitButton,
            ],
          }),
          formSubmit: cy.stub().as('formSubmit'),
        });

        cy.get('[data-cy="submit_button"]').click();
        cy.get('@formSubmit').should('have.been.calledOnce');
        cy.get('@formSubmit').should((stub: any) => {
          expect(submittedJson(stub, 0)).to.deep.equal({});
        });

        cy.get('[data-cy="notify_toggle"]').click();
        cy.get('[data-cy="agree_checkbox"]').click();
        cy.get('[data-cy="submit_button"]').click();
        cy.get('@formSubmit').should('have.been.calledTwice');
        cy.get('@formSubmit').should((stub: any) => {
          expect(submittedJson(stub, 1)).to.deep.equal({ agree: true, notify: true });
        });
      });

      it('should check a toggle and a checkbox from the data and uncheck them when the data is replaced', () => {
        let handle!: FormHandle;
        mountFn({
          data: { agree: true, notify: true },
          formDef: defineForm({
            form: [
              { uid: 'agree', kind: 'input', type: 'checkbox', path: 'agree' },
              { uid: 'notify', kind: 'input', type: 'toggle', path: 'notify' },
            ],
          }),
          onFormReady: (h) => {
            handle = h;
          },
        });

        cy.get('[data-cy="agree_checkbox"]').should('be.checked');
        cy.get('[data-cy="notify_toggle"]').should('be.checked');

        cy.then(() => handle.setData({}));
        cy.get('[data-cy="agree_checkbox"]').should('not.be.checked');
        cy.get('[data-cy="notify_toggle"]').should('not.be.checked');
      });

      it('should keep a new line typed in a textarea and show the data that is set', () => {
        let handle!: FormHandle;
        mountFn({
          formDef: defineForm({
            form: [{ uid: 'bio', kind: 'input', type: 'textarea', path: 'bio' }, submitButton],
          }),
          formSubmit: cy.stub().as('formSubmit'),
          onFormReady: (h) => {
            handle = h;
          },
        });

        cy.get('[data-cy="bio_textarea"]').type('a{enter}b');
        cy.get('[data-cy="submit_button"]').click();
        cy.get('@formSubmit').should('have.been.calledOnce');
        cy.get('@formSubmit').should((stub: any) => {
          expect(stub.getCall(0).args[0].data).to.deep.equal({ bio: 'a\nb' });
        });

        cy.then(() => handle.setData({ bio: 'x' }));
        cy.get('[data-cy="bio_textarea"]').should('have.value', 'x');

        cy.get('[data-cy="bio_textarea"]').clear();
        cy.get('[data-cy="submit_button"]').click();
        cy.get('@formSubmit').should('have.been.calledTwice');
        cy.get('@formSubmit').should((stub: any) => {
          expect(stub.getCall(1).args[0].data).to.deep.equal({ bio: '' });
        });
      });

      it('should send a change event with the new value for each basic input', () => {
        const formEventHandler = cy.stub().as('formEventHandler');
        mountFn({
          formDef: defineForm({
            form: [
              {
                uid: 'name',
                kind: 'input',
                type: 'textinput',
                path: 'name',
                on: { change: 'nameChanged' },
              },
              {
                uid: 'agree',
                kind: 'input',
                type: 'checkbox',
                path: 'agree',
                on: { change: 'agreeChanged' },
              },
              {
                uid: 'notify',
                kind: 'input',
                type: 'toggle',
                path: 'notify',
                on: { change: 'notifyChanged' },
              },
              {
                uid: 'bio',
                kind: 'input',
                type: 'textarea',
                path: 'bio',
                on: { change: 'bioChanged' },
              },
            ],
          }),
          formEvent: formEventHandler,
        });

        cy.get('[data-cy="name_textinput"]').type('Ada');
        cy.get('[data-cy="agree_checkbox"]').click();
        cy.get('[data-cy="notify_toggle"]').click();
        cy.get('[data-cy="bio_textarea"]').type('Hi');

        cy.get('@formEventHandler').should(() => {
          const lastData = (name: string) => {
            const events = eventsNamed(formEventHandler, name);
            expect(events, name).to.not.have.length(0);
            return events[events.length - 1].data;
          };
          expect(lastData('nameChanged')['name']).to.equal('Ada');
          expect(lastData('agreeChanged')['agree']).to.equal(true);
          expect(lastData('notifyChanged')['notify']).to.equal(true);
          expect(lastData('bioChanged')['bio']).to.equal('Hi');
        });
      });
    });

    describe('readonly', () => {
      it('should not change a readonly checkbox or toggle when the user clicks it', () => {
        mountFn({
          data: { lockedBox: true },
          formDef: defineForm({
            form: [
              {
                uid: 'lockedBox',
                kind: 'input',
                type: 'checkbox',
                path: 'lockedBox',
                readonly: true,
              },
              {
                uid: 'lockedSwitch',
                kind: 'input',
                type: 'toggle',
                path: 'lockedSwitch',
                readonly: true,
              },
              { uid: 'openBox', kind: 'input', type: 'checkbox', path: 'openBox' },
              submitButton,
            ],
          }),
          formSubmit: cy.stub().as('formSubmit'),
        });

        // The checkbox without the flag is the control: the same click changes it.
        cy.get('[data-cy="openBox_checkbox"]').click();
        cy.get('[data-cy="openBox_checkbox"]').should('be.checked');

        cy.get('[data-cy="lockedBox_checkbox"]').click();
        cy.get('[data-cy="lockedSwitch_toggle"]').click();
        cy.get('[data-cy="lockedBox_checkbox"]').should('be.checked');
        cy.get('[data-cy="lockedSwitch_toggle"]').should('not.be.checked');

        cy.get('[data-cy="submit_button"]').click();
        cy.get('@formSubmit').should('have.been.calledOnce');
        cy.get('@formSubmit').should((stub: any) => {
          expect(submittedJson(stub, 0)).to.deep.equal({ lockedBox: true, openBox: true });
        });
      });

      it('should show the data in a readonly textarea and mark it readonly', () => {
        mountFn({
          data: { bio: 'fixed text' },
          formDef: defineForm({
            form: [
              { uid: 'bio', kind: 'input', type: 'textarea', path: 'bio', readonly: true },
              { uid: 'note', kind: 'input', type: 'textarea', path: 'note' },
            ],
          }),
        });

        cy.get('[data-cy="bio_textarea"]').should('have.attr', 'readonly');
        cy.get('[data-cy="bio_textarea"]').should('have.value', 'fixed text');
        cy.get('[data-cy="note_textarea"]').should('not.have.attr', 'readonly');
      });
    });

    describe('blur and event payload', () => {
      const basicInputs = [
        { type: 'textinput', suffix: 'textinput' },
        { type: 'checkbox', suffix: 'checkbox' },
        { type: 'toggle', suffix: 'toggle' },
        { type: 'textarea', suffix: 'textarea' },
      ] as const;

      basicInputs.forEach(({ type, suffix }) => {
        it(`should send one blur event when the focus leaves a ${type}`, () => {
          const formEventHandler = cy.stub().as('formEventHandler');
          mountFn({
            formDef: defineForm({
              form: [
                { uid: 'field', kind: 'input', type, path: 'field', on: { blur: 'left' } },
                { uid: 'other', kind: 'input', type: 'textinput', path: 'other' },
              ],
            }),
            formEvent: formEventHandler,
          });

          cy.get(`[data-cy="field_${suffix}"]`).focus();
          cy.get(`[data-cy="field_${suffix}"]`).should('have.focus');
          cy.get('@formEventHandler').should(() => {
            expect(eventsNamed(formEventHandler, 'left')).to.have.length(0);
          });

          cy.get('[data-cy="other_textinput"]').focus();
          cy.get('@formEventHandler').should(() => {
            expect(eventsNamed(formEventHandler, 'left')).to.have.length(1);
          });
        });
      });

      it('should send the name, the pruned data and no row key with an event outside a repeater', () => {
        const formEventHandler = cy.stub().as('formEventHandler');
        mountFn({
          data: { secret: 'hidden value' },
          formDef: defineForm({
            form: [
              {
                uid: 'name',
                kind: 'input',
                type: 'textinput',
                path: 'name',
                on: { change: 'nameChanged' },
              },
              {
                uid: 'secret',
                kind: 'input',
                type: 'textinput',
                path: 'secret',
                include: { when: 'false' },
              },
            ],
          }),
          formEvent: formEventHandler,
        });

        cy.get('[data-cy="name_textinput"]').type('A');
        cy.get('@formEventHandler').should(() => {
          const events = eventsNamed(formEventHandler, 'nameChanged');
          expect(events).to.have.length(1);
          expect(events[0].data).to.deep.equal({ name: 'A' });
          expect(events[0].detail).to.equal(undefined);
          expect(events[0]).to.not.have.property('row');
          expect(events[0].callback).to.be.a('function');
        });
      });
    });

    describe('form submit callback', () => {
      it('should show the prop that a submit callback overrides', () => {
        mountFn({
          formDef: defineForm({
            form: [
              { uid: 'name', kind: 'input', type: 'textinput', path: 'name', label: 'Name' },
              submitButton,
            ],
          }),
          formSubmit: (event) => {
            event.callback?.({
              type: 'OVERRIDE_WIDGET_PROP',
              payload: { path: 'name', prop: 'label', value: 'Name from the server' },
            });
          },
        });

        cy.contains('Name from the server').should('not.exist');
        cy.get('[data-cy="submit_button"]').click();
        cy.contains('Name from the server').should('be.visible');
      });

      it('should show an error under the field when a submit callback injects one', () => {
        mountFn({
          formDef: defineForm({
            form: [{ uid: 'name', kind: 'input', type: 'textinput', path: 'name' }, submitButton],
          }),
          formSubmit: (event) => {
            event.callback?.({
              type: 'INJECT_VALIDATION_ISSUES',
              payload: { path: 'name', issues: ['Name is taken'] },
            });
          },
        });

        cy.contains('Name is taken').should('not.exist');
        cy.get('[data-cy="submit_button"]').click();
        cy.contains('Name is taken').should('be.visible');
      });
    });
  });
};
