import { defineForm, identityTranslator, type I18nTranslator } from '@golemui/core';
import { type MountComponentFn } from '../utils';

// Behavior tests for the rating widget: a number of stars, from 1 to the integer validator's
// maximum, with no value until the user picks one.
export const runRatingComponentTests = (mountFn: MountComponentFn) => {
  describe('Rating Component', () => {
    const uid = 'testSubject';
    const sel = {
      star: (count: number) => `[data-cy="${uid}_rating_${count}"]`,
      stars: 'gui-rating input[type="radio"]',
      error: `[data-cy="${uid}_validator-error"]`,
    };

    const mountRating = (settings?: {
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
              type: 'rating',
              path: 'myField',
              label: 'Service',
              ...(settings?.props ? { props: settings.props } : {}),
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

    /** Picks a star as a click on it does. The radios are hidden on screen under the stars. */
    const clickStar = (count: number) => cy.get(sel.star(count)).click({ force: true });

    const submitAndGetData = () => {
      cy.get('[data-cy="submitBtn_button"]').click({ force: true });
      return cy.get('@formSubmit').then((stub: any) => stub.getCall(0).args[0].data);
    };

    describe('value', () => {
      it('should have no value until a star is picked, then submit its number', () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountRating({ formSubmit });

        cy.get(sel.stars).should('have.length', 5);
        cy.get('gui-rating input:checked').should('not.exist');
        clickStar(4);
        cy.get('gui-rating .gui-rating__star--filled').should('have.length', 4);

        submitAndGetData().then((data) => {
          expect(data.myField).to.equal(4);
        });
      });

      it('should show the value from the data', () => {
        mountRating({ data: { myField: 3 } });

        cy.get(sel.star(3)).should('be.checked');
      });

      it('should clear with a click on the picked star', () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountRating({ data: { myField: 3 }, formSubmit });

        clickStar(3);
        cy.get('gui-rating input:checked').should('not.exist');

        submitAndGetData().then((data) => {
          expect(data.myField).to.equal(undefined);
        });
      });
    });

    describe('validation', () => {
      it("should take its number of stars from the validator's maximum", () => {
        mountRating({ validator: { type: 'integer', maximum: 10 } });

        cy.get(sel.stars).should('have.length', 10);
      });

      it('should show the required error once touched, and again once cleared', () => {
        mountRating({
          validator: { type: 'integer', required: true, messages: { invalid: 'Rate the service' } },
        });

        cy.get(sel.error).should('not.exist');
        cy.get(sel.star(1)).focus().blur();
        cy.get(sel.error).should('contain.text', 'Rate the service');
        clickStar(2);
        cy.get(sel.error).should('not.exist');
        clickStar(2);
        cy.get('gui-rating input:checked').should('not.exist');
        cy.get(sel.error).should('contain.text', 'Rate the service');
      });
    });

    describe('props', () => {
      it('should translate its hint', () => {
        const translations: Record<string, string> = { howWasIt: '¿Qué tal fue?' };
        const translator = identityTranslator('es-ES');
        mountRating({
          localization: { ...translator, translate: (key: string) => translations[key] ?? key },
          props: { hint: { key: 'howWasIt' } },
        });

        cy.get('gui-rating .gui-widget-hint').should('contain.text', '¿Qué tal fue?');
      });
    });

    describe('state', () => {
      it('should disable its stars when disabled', () => {
        mountRating({ disabled: true, data: { myField: 2 } });

        cy.get(sel.stars).should('have.length', 5).and('be.disabled');
      });

      it('should keep its value when readonly', () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountRating({ readonly: true, data: { myField: 2 }, formSubmit });

        cy.get('gui-rating [role="radiogroup"]').should('have.attr', 'aria-readonly', 'true');
        clickStar(4);
        cy.get(sel.star(2)).should('be.checked');

        submitAndGetData().then((data) => {
          expect(data.myField).to.equal(2);
        });
      });
    });
  });
};
