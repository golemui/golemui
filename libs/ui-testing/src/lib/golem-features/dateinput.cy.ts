import { defineForm, identityTranslator } from '@golemui/core';
import { type MountComponentFn } from '../utils';

// Characterization tests for the current gui-date behavior. They pin the exact
// interaction model (auto-advance wrap, clamping with write-back, null emit on
// empty blur) so refactors of the input internals must not change any of it.
export const runDateInputComponentTests = (mountFn: MountComponentFn) => {
  describe('DateInput Component', () => {
    const uid = 'testSubject';
    const sel = {
      day: 'gui-date input[data-type="day"]',
      month: 'gui-date input[data-type="month"]',
      year: 'gui-date input[data-type="year"]',
    };

    const mountDateInput = (options?: {
      data?: Record<string, any>;
      lang?: string;
      formSubmit?: (event: any) => void;
      readonly?: boolean;
      disabled?: boolean;
    }) => {
      mountFn({
        localization: identityTranslator(options?.lang ?? 'en-US'),
        data: options?.data,
        formDef: defineForm({
          form: [
            {
              uid,
              kind: 'input',
              type: 'dateInput',
              path: 'myDate',
              ...(options?.readonly !== undefined ? { readonly: options.readonly } : {}),
              ...(options?.disabled !== undefined ? { disabled: options.disabled } : {}),
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

    const submitAndGetData = (formSubmitAlias: string) => {
      cy.get('[data-cy="submitBtn_button"]').click();
      return cy.get(formSubmitAlias).then((stub: any) => stub.getCall(0).args[0].data);
    };

    describe('rendering', () => {
      it('should render padded parts in locale order with locale placeholders', () => {
        mountDateInput({ data: { myDate: '2026-06-15' } });

        // en-US orders parts month/day/year
        cy.get('gui-date input').should(($inputs) => {
          const types = $inputs.toArray().map((el) => el.getAttribute('data-type'));
          expect(types).to.deep.equal(['month', 'day', 'year']);
        });

        cy.get(sel.month).should('have.value', '06').and('have.attr', 'placeholder', 'mm');
        cy.get(sel.day).should('have.value', '15').and('have.attr', 'placeholder', 'dd');
        cy.get(sel.year).should('have.value', '2026').and('have.attr', 'placeholder', 'yyyy');
      });
    });

    describe('typing', () => {
      it('should block non-digit keys', () => {
        mountDateInput();

        cy.get(sel.day).type('ab-');
        cy.get(sel.day).should('have.value', '');
      });

      it('should auto-advance to the next part when a part is filled', () => {
        mountDateInput();

        cy.get(sel.month).type('06');
        cy.focused().should('have.attr', 'data-type', 'day');

        cy.focused().type('15');
        cy.focused().should('have.attr', 'data-type', 'year');
      });

      it('should wrap auto-advance from the last part to the first', () => {
        mountDateInput();

        cy.get(sel.year).type('2026');
        cy.focused().should('have.attr', 'data-type', 'month');
      });

      it('should submit the typed date as an ISO date string', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountDateInput({ formSubmit: formSubmitHandler });

        cy.get(sel.month).type('06');
        cy.focused().type('15');
        cy.focused().type('2026');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myDate: '2026-06-15' });
        });
      });
    });

    describe('clamping typed values', () => {
      it('should clamp a too-large day to 31', () => {
        mountDateInput();

        cy.get(sel.day).type('35');
        cy.get(sel.day).should('have.value', '31');
      });

      it('should clamp month to the 1-12 range', () => {
        mountDateInput();

        cy.get(sel.month).type('15');
        cy.get(sel.month).should('have.value', '12');
      });

      it('should clear all parts when 00 is typed (zero commits as an empty value)', () => {
        // Typing 00 clamps to 01 in state, but the blur handler sees the raw 0,
        // emits change {value: null}, and the null value resets every part.
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountDateInput({ formSubmit: formSubmitHandler });

        cy.get(sel.month).type('00');
        cy.get(sel.month).should('have.value', '');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myDate: null });
        });
      });

      it('should clamp a year below 1000 up to 1000', () => {
        mountDateInput();

        cy.get(sel.year).type('0500');
        cy.get(sel.year).should('have.value', '1000');
      });

      it('should show an error and not emit for a complete but invalid date (Feb 31)', () => {
        mountDateInput();

        const changeSpy = cy.spy().as('changeSpy');
        cy.get('gui-date').then(($el) => {
          $el[0].addEventListener('change', changeSpy as unknown as EventListener);
        });

        cy.get(sel.month).type('02');
        cy.focused().type('31');
        cy.focused().type('2026');

        cy.get(`[data-cy="${uid}_validator-error"]`).should('contain.text', 'Invalid date');
        cy.get('@changeSpy').should('not.have.been.called');
      });
    });

    describe('arrow up/down', () => {
      it('should increment and decrement a part and emit the new value', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountDateInput({ data: { myDate: '2026-06-15' }, formSubmit: formSubmitHandler });

        cy.get(sel.day).type('{upArrow}');
        cy.get(sel.day).should('have.value', '16');

        cy.get(sel.day).type('{downArrow}{downArrow}');
        cy.get(sel.day).should('have.value', '14');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myDate: '2026-06-14' });
        });
      });

      it('should set an empty part to 01 on ArrowUp', () => {
        mountDateInput();

        cy.get(sel.day).type('{upArrow}');
        cy.get(sel.day).should('have.value', '01');
      });

      it('should stop at the max year limit instead of wrapping', () => {
        mountDateInput({ data: { myDate: '9999-06-15' } });

        cy.get(sel.year).type('{upArrow}');
        cy.get(sel.year).should('have.value', '9999');
      });

      it('should stop at the min year limit instead of wrapping', () => {
        mountDateInput({ data: { myDate: '1000-06-15' } });

        cy.get(sel.year).type('{downArrow}');
        cy.get(sel.year).should('have.value', '1000');
      });
    });

    describe('arrow left/right navigation', () => {
      it('should move focus between parts and stop at the bounds', () => {
        mountDateInput({ data: { myDate: '2026-06-15' } });

        cy.get(sel.month).click();
        cy.focused().type('{rightArrow}');
        cy.focused().should('have.attr', 'data-type', 'day');

        cy.focused().type('{rightArrow}');
        cy.focused().should('have.attr', 'data-type', 'year');

        // Right bound: stays on the last part
        cy.focused().type('{rightArrow}');
        cy.focused().should('have.attr', 'data-type', 'year');

        cy.focused().type('{leftArrow}');
        cy.focused().should('have.attr', 'data-type', 'day');

        cy.focused().type('{leftArrow}');
        cy.focused().should('have.attr', 'data-type', 'month');

        // Left bound: stays on the first part
        cy.focused().type('{leftArrow}');
        cy.focused().should('have.attr', 'data-type', 'month');
      });

      it('should flip arrow navigation in RTL', () => {
        mountDateInput({ data: { myDate: '2026-06-15' }, lang: 'ar' });

        cy.get('form').should('have.attr', 'dir', 'rtl');

        // ar orders parts day/month/year in DOM order
        cy.get('gui-date input').should(($inputs) => {
          const types = $inputs.toArray().map((el) => el.getAttribute('data-type'));
          expect(types).to.deep.equal(['day', 'month', 'year']);
        });

        // ArrowLeft moves to the NEXT DOM input when RTL
        cy.get(sel.day).click();
        cy.focused().type('{leftArrow}');
        cy.focused().should('have.attr', 'data-type', 'month');

        // ArrowRight moves back to the previous DOM input
        cy.focused().type('{rightArrow}');
        cy.focused().should('have.attr', 'data-type', 'day');
      });
    });

    describe('blur', () => {
      it('should keep a single digit part on blur (optionally padded)', () => {
        // The blur handler pads the raw input value ('9' -> '09'), but the pad
        // is cosmetic: a framework re-render triggered by the blur (touched
        // state) can restore the unpadded state value. Angular re-renders after
        // the blur, the other frameworks before, so both outcomes are current
        // behavior. We pin that the digit is never lost or corrupted.
        mountDateInput();

        cy.get(sel.day).type('9');
        cy.get(sel.day).blur();
        cy.get(sel.day).invoke('val').should('match', /^0?9$/);
      });

      it('should emit a null value when a part is emptied and blurred', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountDateInput({ data: { myDate: '2026-06-15' }, formSubmit: formSubmitHandler });

        cy.get(sel.day).type('{selectAll}{backspace}');
        cy.get(sel.day).blur();

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myDate: null });
        });
      });
    });

    describe('readonly and disabled', () => {
      it('should ignore typing and arrows when readonly', () => {
        mountDateInput({ data: { myDate: '2026-06-15' }, readonly: true });

        cy.get(sel.day).should('have.attr', 'readonly');
        cy.get(sel.day).type('{upArrow}', { force: true });
        cy.get(sel.day).should('have.value', '15');
      });

      it('should render disabled inputs when disabled', () => {
        mountDateInput({ data: { myDate: '2026-06-15' }, disabled: true });

        cy.get(sel.day).should('be.disabled');
        cy.get(sel.month).should('be.disabled');
        cy.get(sel.year).should('be.disabled');
      });
    });
  });
};
