import { defineForm, identityTranslator } from '@golemui/core';
import { type MountComponentFn } from '../utils';

// Behavior tests for the rangeSlider widget: a `{ start, end }` range picked with two thumbs on
// one track, with no value until the user moves one.
export const runRangeSliderComponentTests = (mountFn: MountComponentFn) => {
  describe('RangeSlider Component', () => {
    const uid = 'testSubject';
    const sel = {
      thumb: (which: 'start' | 'end') => `[data-cy="${uid}_slider_${which}"]`,
      value: 'gui-range-slider .gui-slider__value',
      error: `[data-cy="${uid}_validator-error"]`,
    };

    const mountRangeSlider = (options?: {
      data?: Record<string, any>;
      props?: Record<string, unknown>;
      validator?: Record<string, unknown>;
      formSubmit?: (event: any) => void;
    }) => {
      mountFn({
        localization: identityTranslator('en-US'),
        data: options?.data,
        formDef: defineForm({
          form: [
            {
              uid,
              kind: 'input',
              type: 'rangeSlider',
              path: 'myRange',
              label: 'Price',
              ...(options?.props ? { props: options.props } : {}),
              ...(options?.validator ? { validator: options.validator } : {}),
            },
            { uid: 'other', kind: 'input', type: 'textinput', path: 'other', label: 'Other' },
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

    /** Moves a thumb the way the browser reports a drag: `input` while it moves, `change` after. */
    const drag = (which: 'start' | 'end', value: number) =>
      cy.get<HTMLInputElement>(sel.thumb(which)).then(([range]) => {
        range.value = String(value);
        range.dispatchEvent(new Event('input', { bubbles: true }));
        range.dispatchEvent(new Event('change', { bubbles: true }));
      });

    const submitAndGetData = () => {
      cy.get('[data-cy="submitBtn_button"]').click({ force: true });
      return cy.get('@formSubmit').then((stub: any) => stub.getCall(0).args[0].data);
    };

    describe('value', () => {
      it('should have no value until a thumb moves, then submit the range', () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountRangeSlider({ formSubmit, props: { maximum: 500, step: 10 } });

        cy.get(sel.value).should('have.text', '–');
        cy.get(sel.thumb('start')).should('have.value', '0');
        cy.get(sel.thumb('end')).should('have.value', '500');
        drag('start', 120);
        cy.get(sel.value).should('have.text', '120 – 500');

        submitAndGetData().then((data) => {
          expect(data.myRange).to.deep.equal({ start: 120, end: 500 });
        });
      });

      it('should show the range from the data, and keep the thumbs from crossing', () => {
        mountRangeSlider({ data: { myRange: { start: 20, end: 60 } } });

        cy.get(sel.thumb('start')).should('have.value', '20');
        cy.get(sel.thumb('end')).should('have.value', '60');
        cy.get(sel.value).should('have.text', '20 – 60');
        drag('start', 80);
        cy.get(sel.thumb('start')).should('have.value', '60');
        cy.get(sel.value).should('have.text', '60 – 60');
      });
    });

    describe('validation', () => {
      it('should show the required error once focus leaves, not when it moves between the thumbs', () => {
        mountRangeSlider({
          validator: { type: 'range', required: true, messages: { required: 'Pick a range' } },
        });

        cy.get(sel.thumb('start')).focus();
        cy.get(sel.thumb('end')).focus();
        cy.get(sel.error).should('not.exist');
        cy.get('[data-cy="other_textinput"]').focus();
        cy.get(sel.error).should('contain.text', 'Pick a range');
        drag('end', 70);
        cy.get(sel.error).should('not.exist');
      });
    });

    describe('props', () => {
      it('should name its thumbs after startLabel and endLabel', () => {
        mountRangeSlider({ props: { startLabel: 'From', endLabel: 'To' } });

        cy.get('gui-range-slider .gui-visually-hidden').should(($names) => {
          expect([...$names].map((name) => name.textContent?.trim())).to.deep.equal(['From', 'To']);
        });
      });
    });
  });
};
