import { defineForm, identityTranslator } from '@golemui/core';
import { type FormHandle, type MountComponentFn } from '../utils';

export const runSetDataSetMetaTests = (mountFn: MountComponentFn) => {
  describe('setData / setMeta', () => {
    describe('setData', () => {
      it('should update field value when setData is called after init', () => {
        let handle!: FormHandle;
        mountFn({
          data: { name: 'initial' },
          formDef: defineForm({
            form: [{ uid: 'name', kind: 'input', type: 'textinput', path: 'name' }],
          }),
          onFormReady: (h) => {
            handle = h;
          },
        });
        cy.get('[data-cy="name_textinput"]').should('have.value', 'initial');
        cy.then(() => handle.setData({ name: 'updated' }));
        cy.get('[data-cy="name_textinput"]').should('have.value', 'updated');
      });

      it('should replace all data when setData is called', () => {
        let handle!: FormHandle;
        mountFn({
          data: { firstName: 'John', lastName: 'Doe' },
          formDef: defineForm({
            form: [
              { uid: 'firstName', kind: 'input', type: 'textinput', path: 'firstName' },
              { uid: 'lastName', kind: 'input', type: 'textinput', path: 'lastName' },
            ],
          }),
          onFormReady: (h) => {
            handle = h;
          },
        });
        cy.get('[data-cy="firstName_textinput"]').should('have.value', 'John');
        cy.get('[data-cy="lastName_textinput"]').should('have.value', 'Doe');
        cy.then(() => handle.setData({ firstName: 'Jane', lastName: 'Smith' }));
        cy.get('[data-cy="firstName_textinput"]').should('have.value', 'Jane');
        cy.get('[data-cy="lastName_textinput"]').should('have.value', 'Smith');
      });
    });

    describe('setData reaches controls the user already changed', () => {
      // One input per case. Interact first so the native control is dirty, then setData
      // and assert the store value replaced what the user did.
      const mountControl = (options: {
        type: string;
        data: Record<string, any>;
        props?: Record<string, any>;
        onFormReady: (handle: FormHandle) => void;
      }) => {
        mountFn({
          localization: identityTranslator('en-US'),
          data: options.data,
          formDef: defineForm({
            form: [
              {
                uid: 'field',
                kind: 'input',
                type: options.type as any,
                path: 'value',
                ...(options.props ? { props: options.props } : {}),
              },
            ],
          }),
          onFormReady: options.onFormReady,
        });
      };

      it('textinput', () => {
        let handle!: FormHandle;
        mountControl({
          type: 'textinput',
          data: { value: 'initial' },
          onFormReady: (h) => (handle = h),
        });
        cy.get('[data-cy="field_textinput"]').clear().type('abc');
        cy.then(() => handle.setData({ value: 'from store' }));
        cy.get('[data-cy="field_textinput"]').should('have.value', 'from store');
      });

      it('password', () => {
        let handle!: FormHandle;
        mountControl({
          type: 'password',
          data: { value: 'initial' },
          onFormReady: (h) => (handle = h),
        });
        cy.get('[data-cy="field_password"]').clear().type('abc');
        cy.then(() => handle.setData({ value: 'from store' }));
        cy.get('[data-cy="field_password"]').should('have.value', 'from store');
      });

      it('number', () => {
        let handle!: FormHandle;
        mountControl({ type: 'number', data: { value: 1 }, onFormReady: (h) => (handle = h) });
        cy.get('[data-cy="field_number"]').clear().type('12').blur();
        cy.then(() => handle.setData({ value: 5 }));
        cy.get('[data-cy="field_number"]').should('have.value', '5');
      });

      it('number leaves a focused draft alone and syncs it on blur', () => {
        let handle!: FormHandle;
        mountControl({ type: 'number', data: { value: 3 }, onFormReady: (h) => (handle = h) });
        cy.get('[data-cy="field_number"]').clear().type('12');
        cy.then(() => handle.setData({ value: 5 }));
        cy.get('[data-cy="field_number"]').should('have.value', '12');
        cy.get('[data-cy="field_number"]').blur();
        cy.get('[data-cy="field_number"]').should('have.value', '5');
      });

      it('number syncs a deferred value on a blur that changes no form state', () => {
        let handle!: FormHandle;
        mountControl({ type: 'number', data: { value: 3 }, onFormReady: (h) => (handle = h) });
        // First blur marks the field touched so the next blur is a store no-op:
        // the sync must not depend on the blur coincidentally causing a
        // store change and re-render.
        cy.get('[data-cy="field_number"]').clear().type('12').blur();
        cy.get('[data-cy="field_number"]').focus().clear().type('99');
        cy.then(() => handle.setData({ value: 7 }));
        cy.get('[data-cy="field_number"]').should('have.value', '99');
        cy.get('[data-cy="field_number"]').blur();
        cy.get('[data-cy="field_number"]').should('have.value', '7');
      });

      it('number clears when the store value is removed', () => {
        let handle!: FormHandle;
        mountControl({ type: 'number', data: { value: 1 }, onFormReady: (h) => (handle = h) });
        cy.get('[data-cy="field_number"]').clear().type('12').blur();
        cy.then(() => handle.setData({}));
        cy.get('[data-cy="field_number"]').should('have.value', '');
      });

      it('checkbox', () => {
        let handle!: FormHandle;
        mountControl({
          type: 'checkbox',
          data: { value: false },
          onFormReady: (h) => (handle = h),
        });
        cy.get('[data-cy="field_checkbox"]').click().should('be.checked');
        cy.then(() => handle.setData({ value: false }));
        cy.get('[data-cy="field_checkbox"]').should('not.be.checked');
      });

      it('toggle', () => {
        let handle!: FormHandle;
        mountControl({ type: 'toggle', data: { value: false }, onFormReady: (h) => (handle = h) });
        cy.get('[data-cy="field_toggle"]').click({ force: true }).should('be.checked');
        cy.then(() => handle.setData({ value: false }));
        cy.get('[data-cy="field_toggle"]').should('not.be.checked');
      });

      it('radiogroup', () => {
        let handle!: FormHandle;
        mountControl({
          type: 'radiogroup',
          data: { value: 'a' },
          props: { options: ['a', 'b'] },
          onFormReady: (h) => (handle = h),
        });
        cy.get('[data-cy="field_radiogroup_1"]').click().should('be.checked');
        cy.then(() => handle.setData({ value: 'a' }));
        cy.get('[data-cy="field_radiogroup_0"]').should('be.checked');
        cy.get('[data-cy="field_radiogroup_1"]').should('not.be.checked');
      });

      it('select', () => {
        let handle!: FormHandle;
        mountControl({
          type: 'select',
          data: { value: 'a' },
          props: { options: ['a', 'b'] },
          onFormReady: (h) => (handle = h),
        });
        cy.get('[data-cy="field_select"]').select('b').should('have.value', 'b');
        cy.then(() => handle.setData({ value: 'a' }));
        cy.get('[data-cy="field_select"]').should('have.value', 'a');
      });

      it('textarea', () => {
        let handle!: FormHandle;
        mountControl({
          type: 'textarea',
          data: { value: 'initial' },
          onFormReady: (h) => (handle = h),
        });
        cy.get('[data-cy="field_textarea"]').clear().type('abc');
        cy.then(() => handle.setData({ value: 'from store' }));
        cy.get('[data-cy="field_textarea"]').should('have.value', 'from store');
      });

      it('currency', () => {
        let handle!: FormHandle;
        mountControl({ type: 'currency', data: { value: 1 }, onFormReady: (h) => (handle = h) });
        cy.get('[data-cy="field_currency"]').clear().type('12').blur();
        cy.then(() => handle.setData({ value: 5 }));
        cy.get('[data-cy="field_currency"]').should('have.value', '5');
      });

      it('currency leaves a focused draft alone and syncs it on blur', () => {
        let handle!: FormHandle;
        mountControl({ type: 'currency', data: { value: 3 }, onFormReady: (h) => (handle = h) });
        cy.get('[data-cy="field_currency"]').clear().type('12');
        cy.then(() => handle.setData({ value: 5 }));
        cy.get('[data-cy="field_currency"]').should('have.value', '12');
        cy.get('[data-cy="field_currency"]').blur();
        cy.get('[data-cy="field_currency"]').should('have.value', '5');
      });

      it('currency clears when the store value is removed', () => {
        let handle!: FormHandle;
        mountControl({ type: 'currency', data: { value: 1 }, onFormReady: (h) => (handle = h) });
        cy.get('[data-cy="field_currency"]').clear().type('12').blur();
        cy.then(() => handle.setData({}));
        cy.get('[data-cy="field_currency"]').should('have.value', '');
      });

      it('markdown', () => {
        let handle!: FormHandle;
        mountControl({
          type: 'markdown',
          data: { value: 'initial' },
          onFormReady: (h) => (handle = h),
        });
        cy.get('textarea[id="field"]').clear().type('abc');
        cy.then(() => handle.setData({ value: 'from store' }));
        cy.get('textarea[id="field"]').should('have.value', 'from store');
      });

      it('tags', () => {
        let handle!: FormHandle;
        mountControl({ type: 'tags', data: { value: ['one'] }, onFormReady: (h) => (handle = h) });
        cy.get('[data-cy="field_tags-input"]').type('two{enter}');
        cy.get('gui-tags .gui-pills__pill-text').should('have.length', 2);
        cy.then(() => handle.setData({ value: ['three'] }));
        cy.get('gui-tags .gui-pills__pill-text').should('have.length', 1).and('contain', 'three');
      });

      it('list', () => {
        let handle!: FormHandle;
        mountControl({
          type: 'list',
          data: { value: 'React' },
          props: { items: ['React', 'Angular', 'Vue'] },
          onFormReady: (h) => (handle = h),
        });
        cy.get('gui-list .gui-list__item-wrapper').eq(1).click();
        cy.get('gui-list .gui-list__item-wrapper')
          .eq(1)
          .should('have.attr', 'aria-selected', 'true');
        cy.then(() => handle.setData({ value: 'Vue' }));
        cy.get('gui-list .gui-list__item-wrapper')
          .eq(2)
          .should('have.attr', 'aria-selected', 'true');
        cy.get('gui-list .gui-list__item-wrapper')
          .eq(1)
          .should('have.attr', 'aria-selected', 'false');
      });

      it('dateInput', () => {
        let handle!: FormHandle;
        mountControl({
          type: 'dateInput',
          data: { value: '2026-06-15' },
          onFormReady: (h) => (handle = h),
        });
        cy.get('gui-date input[data-type="day"]').clear().type('20');
        cy.get('gui-date input[data-type="day"]').should('have.value', '20');
        cy.then(() => handle.setData({ value: '2025-01-02' }));
        cy.get('gui-date input[data-type="month"]').should('have.value', '01');
        cy.get('gui-date input[data-type="day"]').should('have.value', '02');
        cy.get('gui-date input[data-type="year"]').should('have.value', '2025');
      });

      it('timeInput', () => {
        let handle!: FormHandle;
        mountControl({
          type: 'timeInput',
          data: { value: '14:30:00' },
          onFormReady: (h) => (handle = h),
        });
        cy.get('gui-time input[data-type="hour"]').clear().type('09');
        cy.get('gui-time input[data-type="hour"]').should('have.value', '09');
        cy.then(() => handle.setData({ value: '11:45:00' }));
        cy.get('gui-time input[data-type="hour"]').should('have.value', '11');
        cy.get('gui-time input[data-type="minute"]').should('have.value', '45');
      });

      it('dateTimeInput', () => {
        let handle!: FormHandle;
        mountControl({
          type: 'dateTimeInput',
          data: { value: '2026-06-15T14:30:00' },
          onFormReady: (h) => (handle = h),
        });
        cy.get('gui-date-time input[data-type="day"]').clear().type('20');
        cy.then(() => handle.setData({ value: '2025-01-02T11:45:00' }));
        cy.get('gui-date-time input[data-type="month"]').should('have.value', '01');
        cy.get('gui-date-time input[data-type="day"]').should('have.value', '02');
        cy.get('gui-date-time input[data-type="year"]').should('have.value', '2025');
        cy.get('gui-date-time input[data-type="hour"]').should('have.value', '11');
        cy.get('gui-date-time input[data-type="minute"]').should('have.value', '45');
      });

      it('rangeDateInput', () => {
        let handle!: FormHandle;
        mountControl({
          type: 'rangeDateInput',
          data: { value: [{ start: '2026-06-15', end: '2026-06-18' }] },
          onFormReady: (h) => (handle = h),
        });
        cy.get('gui-range-date input[data-group="start"][data-type="month"]').type('07');
        cy.focused().type('01');
        cy.focused().type('2026');
        cy.get('gui-range-date .gui-pills__pill-text').should('have.length', 1);
        cy.then(() => handle.setData({ value: [{ start: '2025-01-02', end: '2025-01-05' }] }));
        cy.get('gui-range-date .gui-pills__pill-text')
          .should('have.length', 1)
          .and('contain.text', '01/02/2025 - 01/05/2025');
      });

      it('rangeTimeInput', () => {
        let handle!: FormHandle;
        mountControl({
          type: 'rangeTimeInput',
          data: { value: [{ start: '09:00:00', end: '11:00:00' }] },
          onFormReady: (h) => (handle = h),
        });
        cy.get('gui-range-time input[data-group="start"][data-type="hour"]').type('10');
        cy.get('gui-range-time .gui-pills__pill-text').should('have.length', 1);
        cy.then(() => handle.setData({ value: [{ start: '02:00:00', end: '03:30:00' }] }));
        cy.get('gui-range-time .gui-pills__pill-text')
          .should('have.length', 1)
          .and('contain.text', '02:00')
          .and('contain.text', '03:30');
      });

      it('rangeDateTimeInput', () => {
        let handle!: FormHandle;
        mountControl({
          type: 'rangeDateTimeInput',
          data: { value: [{ start: '2026-06-15T09:00:00', end: '2026-06-15T11:00:00' }] },
          onFormReady: (h) => (handle = h),
        });
        cy.get('gui-range-date-time input[data-group="start"][data-type="month"]').type('07');
        cy.get('gui-range-date-time .gui-pills__pill-text').should('have.length', 1);
        cy.then(() =>
          handle.setData({
            value: [{ start: '2025-01-02T09:30:00', end: '2025-01-02T11:00:00' }],
          }),
        );
        cy.get('gui-range-date-time .gui-pills__pill-text')
          .should('have.length', 1)
          .and('contain.text', '01/02/2025');
      });

      it('datePicker', () => {
        let handle!: FormHandle;
        mountControl({
          type: 'datePicker',
          data: { value: '2026-06-15' },
          onFormReady: (h) => (handle = h),
        });
        cy.get('gui-date-picker gui-date input[data-type="day"]').click();
        cy.get('gui-calendar button[data-date="2026-06-20"]').click();
        cy.get('gui-date-picker gui-date input[data-type="day"]').should('have.value', '20');
        cy.then(() => handle.setData({ value: '2025-01-02' }));
        cy.get('gui-date-picker gui-date input[data-type="month"]').should('have.value', '01');
        cy.get('gui-date-picker gui-date input[data-type="day"]').should('have.value', '02');
        cy.get('gui-date-picker gui-date input[data-type="year"]').should('have.value', '2025');
      });

      it('dateTimePicker', () => {
        let handle!: FormHandle;
        mountControl({
          type: 'dateTimePicker',
          data: { value: '2026-06-15T09:30:00' },
          onFormReady: (h) => (handle = h),
        });
        cy.get('gui-date-time-picker gui-date-time input[data-type="day"]').click();
        cy.get('gui-date-time-picker gui-date-time-calendar').should('exist');
        cy.get('gui-date-time-calendar button[data-date="2026-06-20"]').click();
        cy.then(() => handle.setData({ value: '2025-01-02T11:45:00' }));
        cy.get('gui-date-time-picker gui-date-time input[data-type="month"]').should(
          'have.value',
          '01',
        );
        cy.get('gui-date-time-picker gui-date-time input[data-type="day"]').should(
          'have.value',
          '02',
        );
        cy.get('gui-date-time-picker gui-date-time input[data-type="year"]').should(
          'have.value',
          '2025',
        );
        cy.get('gui-date-time-picker gui-date-time input[data-type="hour"]').should(
          'have.value',
          '11',
        );
        cy.get('gui-date-time-picker gui-date-time input[data-type="minute"]').should(
          'have.value',
          '45',
        );
      });

      it('timePicker', () => {
        let handle!: FormHandle;
        mountControl({
          type: 'timePicker',
          data: { value: '09:30:00' },
          props: { allowCustomTime: true },
          onFormReady: (h) => (handle = h),
        });
        cy.get('gui-time-picker gui-time input[data-type="hour"]').clear().type('10');
        cy.get('gui-time-picker gui-time input[data-type="hour"]').blur();
        cy.then(() => handle.setData({ value: '11:45:00' }));
        cy.get('gui-time-picker gui-time input[data-type="hour"]').should('have.value', '11');
        cy.get('gui-time-picker gui-time input[data-type="minute"]').should('have.value', '45');
      });

      it('rangeDatePicker', () => {
        let handle!: FormHandle;
        mountControl({
          type: 'rangeDatePicker',
          data: { value: [{ start: '2026-06-15', end: '2026-06-18' }] },
          onFormReady: (h) => (handle = h),
        });
        cy.get('gui-range-date input[data-group="start"][data-type="month"]').click();
        cy.get('gui-range-calendar button[data-date="2026-06-20"]').click();
        cy.get('gui-range-calendar button[data-date="2026-06-22"]').click();
        cy.get('gui-range-date .gui-pills__pill-text').should('have.length', 2);
        cy.then(() => handle.setData({ value: [{ start: '2025-01-02', end: '2025-01-05' }] }));
        cy.get('gui-range-date .gui-pills__pill-text')
          .should('have.length', 1)
          .and('contain.text', '01/02/2025 - 01/05/2025');
      });

      it('rangeTimePicker', () => {
        let handle!: FormHandle;
        mountControl({
          type: 'rangeTimePicker',
          data: { value: [{ start: '09:00:00', end: '11:00:00' }] },
          props: { allowCustomTime: true },
          onFormReady: (h) => (handle = h),
        });
        cy.get('gui-range-time-picker input[data-group="start"][data-type="hour"]').type('10');
        cy.get('gui-range-time-picker .gui-pills__pill-text').should('have.length', 1);
        cy.then(() => handle.setData({ value: [{ start: '02:00:00', end: '03:30:00' }] }));
        cy.get('gui-range-time-picker .gui-pills__pill-text')
          .should('have.length', 1)
          .and('contain.text', '02:00')
          .and('contain.text', '03:30');
      });

      it('rangeDateTimePicker', () => {
        let handle!: FormHandle;
        mountControl({
          type: 'rangeDateTimePicker',
          data: { value: [{ start: '2026-06-15T09:00:00', end: '2026-06-15T11:00:00' }] },
          onFormReady: (h) => (handle = h),
        });
        cy.get('gui-range-date-time-picker input[data-group="start"][data-type="month"]').type(
          '07',
        );
        cy.get('gui-range-date-time-picker .gui-pills__pill-text').should('have.length', 1);
        cy.then(() =>
          handle.setData({
            value: [{ start: '2025-01-02T09:30:00', end: '2025-01-02T11:00:00' }],
          }),
        );
        cy.get('gui-range-date-time-picker .gui-pills__pill-text')
          .should('have.length', 1)
          .and('contain.text', '01/02/2025');
      });

      it('calendar', () => {
        let handle!: FormHandle;
        mountControl({
          type: 'calendar',
          data: { value: '2026-06-15' },
          onFormReady: (h) => (handle = h),
        });
        cy.get('gui-calendar button[data-date="2026-06-20"]').click();
        cy.get('gui-calendar button[data-date="2026-06-20"]').should(
          'have.attr',
          'aria-selected',
          'true',
        );
        cy.then(() => handle.setData({ value: '2026-06-10' }));
        cy.get('gui-calendar button[data-date="2026-06-10"]').should(
          'have.attr',
          'aria-selected',
          'true',
        );
        cy.get('gui-calendar button[data-date="2026-06-20"]').should(
          'have.attr',
          'aria-selected',
          'false',
        );
      });
    });

    describe('setMeta', () => {
      it('should update interpolated meta value when setMeta is called after init', () => {
        let handle!: FormHandle;
        mountFn({
          meta: { status: 'offline' },
          formDef: defineForm({
            form: [
              {
                uid: 'status-display',
                kind: 'display',
                type: 'alert',
                props: { text: 'Status: {{$meta.status}}' },
              },
            ],
          }),
          onFormReady: (h) => {
            handle = h;
          },
        });
        cy.get('.gui-alert [role="alert"]').should('contain', 'Status: offline');
        cy.then(() => handle.setMeta({ status: 'online' }));
        cy.get('.gui-alert [role="alert"]').should('contain', 'Status: online');
      });

      it('should toggle meta-driven conditional field when setMeta is called', () => {
        let handle!: FormHandle;
        mountFn({
          meta: { showField: false },
          formDef: defineForm({
            states: { visible: '$meta.showField === true' },
            form: [
              {
                uid: 'conditionalField',
                kind: 'input',
                type: 'textinput',
                path: 'name',
                include: { in: ['visible'] },
              },
            ],
          }),
          onFormReady: (h) => {
            handle = h;
          },
        });
        cy.get('[data-cy="conditionalField_textinput"]').should('not.exist');
        cy.then(() => handle.setMeta({ showField: true }));
        cy.get('[data-cy="conditionalField_textinput"]').should('exist');
      });
    });
  });
};
