import { defineForm } from '@golemui/core';
import { type FormHandle, type MountComponentFn } from '../utils';

export const runRenderIdentityComponentTests = (mountFn: MountComponentFn) => {
  describe('Render identity', () => {
    const rememberedNodes = new Map<string, HTMLElement>();

    const input = (uid: string) => `[data-cy="${uid}_textinput"]`;

    const rememberNodes = (...uids: string[]) => {
      uids.forEach((uid) => {
        cy.get(input(uid)).then(($element) => {
          rememberedNodes.set(uid, $element[0]);
        });
      });
    };

    const expectSameNodes = (...uids: string[]) => {
      uids.forEach((uid) => {
        cy.get(input(uid)).should(($element) => {
          expect($element[0], `${uid} input node`).to.equal(rememberedNodes.get(uid));
        });
      });
    };

    const expectNewNodes = (...uids: string[]) => {
      uids.forEach((uid) => {
        cy.get(input(uid)).should(($element) => {
          expect($element[0], `${uid} input node`).not.to.equal(rememberedNodes.get(uid));
        });
      });
    };

    const expectFocused = (uid: string) => {
      cy.focused().should(($element) => {
        expect($element[0], `focused element`).to.equal(rememberedNodes.get(uid));
      });
    };

    // `.type()` focuses its subject first, which would hide a lost focus. Typing into the
    // focused element instead sends the keys to the body when the input lost focus.
    const typeIntoFocused = (text: string) => {
      cy.focused().type(text);
    };

    const expectInputOrder = (uids: string[]) => {
      cy.get('gui-textinput input[data-cy$="_textinput"]').should(($elements) => {
        const order = $elements.toArray().map((element) => element.getAttribute('data-cy'));
        expect(order).to.deep.equal(uids.map((uid) => `${uid}_textinput`));
      });
    };

    beforeEach(() => {
      rememberedNodes.clear();
    });

    describe('Typing', () => {
      it('keeps the same input node and focus while the user types', () => {
        mountFn({
          formDef: defineForm({
            form: [{ uid: 'name', kind: 'input', type: 'textinput', path: 'name', label: 'Name' }],
          }),
        });

        rememberNodes('name');
        cy.get(input('name')).focus();
        typeIntoFocused('abc');

        cy.get(input('name')).should('have.value', 'abc');
        expectSameNodes('name');
        expectFocused('name');
      });

      it('keeps the input node and focus when the typed value shows and hides a sibling', () => {
        mountFn({
          formDef: defineForm({
            form: [
              { uid: 'code', kind: 'input', type: 'textinput', path: 'code', label: 'Code' },
              {
                uid: 'details',
                kind: 'input',
                type: 'textinput',
                path: 'details',
                label: 'Details',
                include: { when: "$form.code === 'abc'" },
              },
            ],
          }),
        });

        rememberNodes('code');
        cy.get(input('code')).focus();
        typeIntoFocused('ab');
        cy.get(input('details')).should('not.exist');

        typeIntoFocused('c');
        cy.get(input('details')).should('exist');
        expectSameNodes('code');
        expectFocused('code');

        typeIntoFocused('{backspace}');
        cy.get(input('details')).should('not.exist');
        cy.get(input('code')).should('have.value', 'ab');
        expectSameNodes('code');
        expectFocused('code');
      });

      it('keeps the input node and focus while the user types in a repeater row', () => {
        mountFn({
          formDef: defineForm({
            form: [
              {
                uid: 'users',
                kind: 'input',
                type: 'repeater',
                path: 'users',
                props: {
                  template: {
                    kind: 'layout',
                    type: 'grid',
                    children: [
                      {
                        uid: 'name',
                        kind: 'input',
                        type: 'textinput',
                        label: 'Name',
                        path: 'users.items.name',
                      },
                    ],
                  },
                },
              },
            ],
          }),
          data: { users: [{ name: 'Ada' }, { name: 'Linus' }] },
        });

        rememberNodes('name[0]', 'name[1]');
        cy.get(input('name[0]')).focus();
        typeIntoFocused('xyz');

        cy.get(input('name[0]')).should('have.value', 'Adaxyz');
        expectSameNodes('name[0]', 'name[1]');
        expectFocused('name[0]');
      });

      it('keeps the focused input node when setData changes another field', () => {
        let handle!: FormHandle;
        mountFn({
          formDef: defineForm({
            form: [
              { uid: 'first', kind: 'input', type: 'textinput', path: 'first', label: 'First' },
              { uid: 'second', kind: 'input', type: 'textinput', path: 'second', label: 'Second' },
            ],
          }),
          onFormReady: (formHandle) => {
            handle = formHandle;
          },
        });

        rememberNodes('first', 'second');
        cy.get(input('first')).focus();
        typeIntoFocused('abc');
        cy.then(() => handle.setData({ first: 'abc', second: 'from host' }));

        cy.get(input('second')).should('have.value', 'from host');
        cy.get(input('first')).should('have.value', 'abc');
        expectSameNodes('first', 'second');
        expectFocused('first');
      });
    });

    describe('Layout children shown or hidden', () => {
      const childrenWithOptionalMiddle = (pathPrefix = '', toggleExpression = '$form.show') => [
        {
          uid: 'a',
          kind: 'input' as const,
          type: 'textinput',
          path: `${pathPrefix}a`,
          label: 'A',
        },
        {
          uid: 'b',
          kind: 'input' as const,
          type: 'textinput',
          path: `${pathPrefix}b`,
          label: 'B',
          include: { when: `${toggleExpression} === true` },
        },
        {
          uid: 'c',
          kind: 'input' as const,
          type: 'textinput',
          path: `${pathPrefix}c`,
          label: 'C',
        },
      ];

      const showCheckbox = {
        uid: 'show',
        kind: 'input' as const,
        type: 'checkbox',
        path: 'show',
        label: 'Show B',
      };

      it('inserts a child shown in a grid between its siblings and keeps the sibling nodes', () => {
        mountFn({
          formDef: defineForm({
            form: [
              showCheckbox,
              {
                uid: 'section',
                kind: 'layout',
                type: 'grid',
                children: childrenWithOptionalMiddle(),
              },
            ],
          }),
          data: { a: 'first', b: 'second', c: 'third' },
        });

        expectInputOrder(['a', 'c']);
        rememberNodes('a', 'c');

        cy.get('[data-cy="show_checkbox"]').click();
        expectInputOrder(['a', 'b', 'c']);
        cy.get(input('b')).should('have.value', 'second');
        expectSameNodes('a', 'c');

        cy.get('[data-cy="show_checkbox"]').click();
        expectInputOrder(['a', 'c']);
        expectSameNodes('a', 'c');
        cy.get(input('a')).should('have.value', 'first');
        cy.get(input('c')).should('have.value', 'third');
      });

      it('inserts a child shown in a nested grid between its siblings and keeps the sibling nodes', () => {
        mountFn({
          formDef: defineForm({
            form: [
              showCheckbox,
              {
                uid: 'outer',
                kind: 'layout',
                type: 'grid',
                children: [
                  {
                    uid: 'inner',
                    kind: 'layout',
                    type: 'grid',
                    children: childrenWithOptionalMiddle(),
                  },
                  { uid: 'd', kind: 'input', type: 'textinput', path: 'd', label: 'D' },
                ],
              },
            ],
          }),
          data: { a: 'first', b: 'second', c: 'third', d: 'fourth' },
        });

        expectInputOrder(['a', 'c', 'd']);
        rememberNodes('a', 'c', 'd');

        cy.get('[data-cy="show_checkbox"]').click();
        expectInputOrder(['a', 'b', 'c', 'd']);
        cy.get(input('b')).should('have.value', 'second');
        expectSameNodes('a', 'c', 'd');

        cy.get('[data-cy="show_checkbox"]').click();
        expectInputOrder(['a', 'c', 'd']);
        expectSameNodes('a', 'c', 'd');
      });

      it('shows and hides a child in one repeater row without changing the other rows', () => {
        mountFn({
          formDef: defineForm({
            form: [
              {
                uid: 'rows',
                kind: 'input',
                type: 'repeater',
                path: 'rows',
                props: {
                  template: {
                    kind: 'layout',
                    type: 'grid',
                    children: [
                      {
                        uid: 'show',
                        kind: 'input',
                        type: 'checkbox',
                        path: 'rows.items.show',
                        label: 'Show B',
                      },
                      ...childrenWithOptionalMiddle('rows.items.', '$item.show'),
                    ],
                  },
                },
              },
            ],
          }),
          data: {
            rows: [
              { a: 'a0', b: 'b0', c: 'c0' },
              { a: 'a1', b: 'b1', c: 'c1' },
            ],
          },
        });

        expectInputOrder(['a[0]', 'c[0]', 'a[1]', 'c[1]']);
        rememberNodes('a[0]', 'c[0]', 'a[1]', 'c[1]');

        cy.get('[data-cy="show[0]_checkbox"]').click();
        expectInputOrder(['a[0]', 'b[0]', 'c[0]', 'a[1]', 'c[1]']);
        cy.get(input('b[0]')).should('have.value', 'b0');
        expectSameNodes('a[0]', 'c[0]', 'a[1]', 'c[1]');

        cy.get('[data-cy="show[0]_checkbox"]').click();
        expectInputOrder(['a[0]', 'c[0]', 'a[1]', 'c[1]']);
        expectSameNodes('a[0]', 'c[0]', 'a[1]', 'c[1]');
        cy.get(input('a[1]')).should('have.value', 'a1');
        cy.get(input('c[1]')).should('have.value', 'c1');
      });
    });

    describe('Widgets hidden and shown again', () => {
      it('shows the typed value again in a new input node and sends load again', () => {
        const formEventHandler = cy.stub().as('formEventHandler');
        const loadCallCount = () =>
          formEventHandler.getCalls().filter((call) => call.args[0].name === 'detailsLoaded')
            .length;

        mountFn({
          formDef: defineForm({
            form: [
              { uid: 'hide', kind: 'input', type: 'checkbox', path: 'hide', label: 'Hide' },
              {
                uid: 'details',
                kind: 'input',
                type: 'textinput',
                path: 'details',
                label: 'Details',
                exclude: { when: '$form.hide === true' },
                on: { load: 'detailsLoaded' },
              },
            ],
          }),
          formEvent: formEventHandler,
        });

        cy.get(input('details')).type('kept');
        rememberNodes('details');
        cy.get('@formEventHandler').should(() => expect(loadCallCount()).to.equal(1));

        cy.get('[data-cy="hide_checkbox"]').click();
        cy.get(input('details')).should('not.exist');

        cy.get('[data-cy="hide_checkbox"]').click();
        cy.get(input('details')).should('have.value', 'kept');
        expectNewNodes('details');
        cy.get('@formEventHandler').should(() => expect(loadCallCount()).to.equal(2));
      });

      it('removes the children of a hidden layout and renders new ones with their values when shown again', () => {
        mountFn({
          formDef: defineForm({
            form: [
              { uid: 'show', kind: 'input', type: 'checkbox', path: 'show', label: 'Show' },
              {
                uid: 'section',
                kind: 'layout',
                type: 'grid',
                include: { when: '$form.show === true' },
                children: [
                  { uid: 'first', kind: 'input', type: 'textinput', path: 'first', label: 'First' },
                  {
                    uid: 'second',
                    kind: 'input',
                    type: 'textinput',
                    path: 'second',
                    label: 'Second',
                  },
                ],
              },
            ],
          }),
          data: { show: true, first: 'one', second: 'two' },
        });

        cy.get(input('second')).type('x');
        rememberNodes('first', 'second');

        cy.get('[data-cy="show_checkbox"]').click();
        cy.get(input('first')).should('not.exist');
        cy.get(input('second')).should('not.exist');

        cy.get('[data-cy="show_checkbox"]').click();
        cy.get(input('first')).should('have.value', 'one');
        cy.get(input('second')).should('have.value', 'twox');
        expectNewNodes('first', 'second');
      });
    });
  });
};
