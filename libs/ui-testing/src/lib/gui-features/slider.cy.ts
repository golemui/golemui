import { defineForm, identityTranslator, type I18nTranslator } from '@golemui/core';
import { type MountComponentFn } from '../utils';

// Behavior tests for the slider widget: a number picked on a track, with no value until the
// user moves the thumb.
export const runSliderComponentTests = (mountFn: MountComponentFn) => {
  describe('Slider Component', () => {
    const uid = 'testSubject';
    const sel = {
      input: `[data-cy="${uid}_slider"]`,
      value: 'gui-slider .gui-slider__value',
      error: `[data-cy="${uid}_validator-error"]`,
    };

    const mountSlider = (options?: {
      data?: Record<string, any>;
      props?: Record<string, unknown>;
      validator?: Record<string, unknown>;
      formSubmit?: (event: any) => void;
      localization?: I18nTranslator;
      disabled?: boolean;
      readonly?: boolean;
    }) => {
      mountFn({
        localization: options?.localization ?? identityTranslator('en-US'),
        data: options?.data,
        formDef: defineForm({
          form: [
            {
              uid,
              kind: 'input',
              type: 'slider',
              path: 'myField',
              label: 'Volume',
              ...(options?.props ? { props: options.props } : {}),
              ...(options?.validator ? { validator: options.validator } : {}),
              ...(options?.disabled !== undefined ? { disabled: options.disabled } : {}),
              ...(options?.readonly !== undefined ? { readonly: options.readonly } : {}),
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
        formSubmit: options?.formSubmit,
      });
    };

    /** Moves the thumb the way the browser reports a drag: `input` while it moves, `change` after. */
    const drag = (value: number) =>
      cy.get<HTMLInputElement>(sel.input).then(([range]) => {
        range.value = String(value);
        range.dispatchEvent(new Event('input', { bubbles: true }));
        range.dispatchEvent(new Event('change', { bubbles: true }));
      });

    const submitAndGetData = () => {
      cy.get('[data-cy="submitBtn_button"]').click({ force: true });
      return cy.get('@formSubmit').then((stub: any) => stub.getCall(0).args[0].data);
    };

    describe('value', () => {
      it('should have no value until the thumb moves, then submit the number', () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountSlider({ formSubmit });

        cy.get(sel.value).should('have.text', '–');
        cy.get(sel.input).should('have.value', '0');
        drag(30);
        cy.get(sel.value).should('have.text', '30');

        submitAndGetData().then((data) => {
          expect(data.myField).to.equal(30);
        });
      });

      it('should show the value from the data', () => {
        mountSlider({ data: { myField: 40 } });

        cy.get(sel.input).should('have.value', '40');
        cy.get(sel.value).should('have.text', '40');
      });
    });

    describe('validation', () => {
      it('should show the required error once touched, and clear it once the thumb moves', () => {
        mountSlider({
          validator: { type: 'number', required: true, messages: { invalid: 'Pick a volume' } },
        });

        cy.get(sel.error).should('not.exist');
        cy.get(sel.input).focus().blur();
        cy.get(sel.error).should('contain.text', 'Pick a volume');
        drag(20);
        cy.get(sel.error).should('not.exist');
      });
    });

    describe('props', () => {
      it('should draw its marks and bounds', () => {
        mountSlider({ props: { minimum: 10, maximum: 50, step: 10, marks: true } });

        cy.get(sel.input)
          .should('have.attr', 'min', '10')
          .and('have.attr', 'max', '50')
          .and('have.attr', 'step', '10');
        cy.get('gui-slider .gui-slider__tick').should('have.length', 5);
      });

      it('should format its value in the form language, and read it to screen readers', () => {
        mountSlider({
          localization: identityTranslator('de-DE'),
          data: { myField: 1500 },
          props: {
            maximum: 5000,
            format: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 },
          },
        });

        cy.get(sel.value)
          .invoke('text')
          .should('match', /^1\.500\s€$/);
        cy.get(sel.input)
          .invoke('attr', 'aria-valuetext')
          .should('match', /^1\.500\s€$/);
      });

      it('should show the value only in a bubble with valuePlacement: bubble', () => {
        mountSlider({ data: { myField: 40 }, props: { valuePlacement: 'bubble' } });

        cy.get(sel.value).should('not.exist');
        cy.get('gui-slider .gui-slider__bubble').should('have.text', '40');
      });

      it('should translate the labels of its marks', () => {
        const translations: Record<string, string> = { quiet: 'Leise', loud: 'Laut' };
        const translator = identityTranslator('de-DE');
        mountSlider({
          localization: { ...translator, translate: (key: string) => translations[key] ?? key },
          props: {
            marks: [
              { value: 0, label: { key: 'quiet' } },
              { value: 100, label: { key: 'loud' } },
            ],
          },
        });

        cy.get('gui-slider .gui-slider__tick-label').should(($labels) => {
          expect([...$labels].map((label) => label.textContent)).to.deep.equal(['Leise', 'Laut']);
        });
      });
    });

    describe('state', () => {
      it('should disable its thumb when disabled', () => {
        mountSlider({ disabled: true, data: { myField: 40 } });

        cy.get(sel.input).should('be.disabled');
      });

      it('should mark its thumb read-only when readonly', () => {
        mountSlider({ readonly: true, data: { myField: 40 } });

        cy.get(sel.input).should('have.attr', 'aria-readonly', 'true').and('not.be.disabled');
      });
    });
  });
};
