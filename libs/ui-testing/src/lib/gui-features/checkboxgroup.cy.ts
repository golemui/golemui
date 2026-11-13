import { defineForm, identityTranslator, type I18nTranslator } from '@golemui/core';
import { type MountComponentFn } from '../utils';

// Behavior tests for the checkbox group widget: any number of options, as a list of their values
// in the options' order.
export const runCheckboxGroupComponentTests = (mountFn: MountComponentFn) => {
  describe('Checkbox Group Component', () => {
    const uid = 'testSubject';
    const sel = {
      box: (index: number) => `[data-cy="${uid}_checkbox_${index}"]`,
      group: 'gui-checkbox-group [role="group"]',
      error: `[data-cy="${uid}_validator-error"]`,
    };

    const options = [
      { label: 'Cheese', value: 'cheese' },
      { label: 'Ham', value: 'ham' },
      { label: 'Olives', value: 'olives' },
    ];

    const mountGroup = (settings?: {
      data?: Record<string, any>;
      props?: Record<string, unknown>;
      validator?: Record<string, unknown>;
      formSubmit?: (event: any) => void;
      localization?: I18nTranslator;
      disabled?: boolean;
      readonly?: boolean;
    }) => {
      mountFn({
        localization: settings?.localization ?? identityTranslator('en-US'),
        data: settings?.data,
        formDef: defineForm({
          form: [
            {
              uid,
              kind: 'input',
              type: 'checkboxGroup',
              path: 'myField',
              label: 'Toppings',
              props: { options, ...settings?.props },
              ...(settings?.validator ? { validator: settings.validator } : {}),
              ...(settings?.disabled !== undefined ? { disabled: settings.disabled } : {}),
              ...(settings?.readonly !== undefined ? { readonly: settings.readonly } : {}),
            },
            {
              uid: 'submitBtn',
              kind: 'action',
              type: 'button',
              label: 'Submit',
              actionType: 'submit',
            },
          ],
        }),
        formSubmit: settings?.formSubmit,
      });
    };

    const submitAndGetData = () => {
      cy.get('[data-cy="submitBtn_button"]').click({ force: true });
      return cy.get('@formSubmit').then((stub: any) => stub.getCall(0).args[0].data);
    };

    describe('value', () => {
      it("should submit the checked values in the options' order", () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountGroup({ formSubmit });

        cy.get(sel.box(2)).check();
        cy.get(sel.box(0)).check();

        submitAndGetData().then((data) => {
          expect(data.myField).to.deep.equal(['cheese', 'olives']);
        });
      });

      it('should check the values from the data', () => {
        mountGroup({ data: { myField: ['ham'] } });

        cy.get(sel.box(0)).should('not.be.checked');
        cy.get(sel.box(1)).should('be.checked');
      });
    });

    describe('validation', () => {
      it('should show the required error once touched, and the maxItems error past it', () => {
        mountGroup({
          validator: {
            type: 'array',
            required: true,
            maxItems: 2,
            messages: {
              invalid: 'Pick a topping',
              required: 'Pick a topping',
              maxItems: 'Pick at most two',
            },
          },
        });

        cy.get(sel.error).should('not.exist');
        cy.get(sel.box(0)).focus().blur();
        cy.get(sel.error).should('contain.text', 'Pick a topping');
        cy.get(sel.box(0)).check();
        cy.get(sel.error).should('not.exist');
        cy.get(sel.box(1)).check();
        cy.get(sel.box(2)).check();
        cy.get(sel.error).should('contain.text', 'Pick at most two');
      });
    });

    describe('props', () => {
      it('should lay its options out in a row with direction: row', () => {
        mountGroup({ props: { direction: 'row' } });

        cy.get(sel.group).should('have.class', 'gui-widget--horizontal');
      });

      it('should translate its hint', () => {
        const translations: Record<string, string> = { pickAny: 'Elige los que quieras' };
        const translator = identityTranslator('es-ES');
        mountGroup({
          localization: { ...translator, translate: (key: string) => translations[key] ?? key },
          props: { hint: { key: 'pickAny' } },
        });

        cy.get('gui-checkbox-group .gui-widget-hint').should(
          'contain.text',
          'Elige los que quieras',
        );
      });
    });

    describe('state', () => {
      it('should disable its checkboxes when disabled', () => {
        mountGroup({ disabled: true, data: { myField: ['ham'] } });

        cy.get('gui-checkbox-group input').should('have.length', 3).and('be.disabled');
      });

      it('should keep its value when readonly', () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountGroup({ readonly: true, data: { myField: ['ham'] }, formSubmit });

        cy.get(sel.box(0)).should('have.attr', 'aria-readonly', 'true').click();
        cy.get(sel.box(0)).should('not.be.checked');

        submitAndGetData().then((data) => {
          expect(data.myField).to.deep.equal(['ham']);
        });
      });
    });
  });
};
