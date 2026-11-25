import { defineForm, identityTranslator, type I18nTranslator } from '@golemui/core';
import { type MountComponentFn, withTestFormName } from '../utils';

// Behavior tests for the rangeDateInput widget: one { start, end } typed as two dates. The value
// is set when both are complete, in order, and a half-typed range is reported when focus leaves.
export const runRangeDateInputComponentTests = (baseMountFn: MountComponentFn) => {
  const mountFn = withTestFormName(baseMountFn);
  describe('RangeDateInput Component', () => {
    const uid = 'testSubject';
    const sel = {
      part: (group: 'start' | 'end', type: string) =>
        `gui-range-date input[data-group="${group}"][data-type="${type}"]`,
      error: `[data-cy="${uid}_validator-error"]`,
    };
    const march = { start: '2026-03-02', end: '2026-03-06' };

    const mountRangeDateInput = (settings?: {
      data?: Record<string, any>;
      props?: Record<string, unknown>;
      validator?: Record<string, unknown>;
      defaultValue?: unknown;
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
              type: 'rangeDateInput',
              path: 'stay',
              label: 'Stay',
              ...(settings?.props ? { props: settings.props } : {}),
              ...(settings?.validator ? { validator: settings.validator } : {}),
              ...(settings?.defaultValue ? { defaultValue: settings.defaultValue } : {}),
              ...(settings?.disabled !== undefined ? { disabled: settings.disabled } : {}),
              ...(settings?.readonly !== undefined ? { readonly: settings.readonly } : {}),
            } as never,
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

    // en-US orders the parts month/day/year, and each fill moves to the next part.
    const typeDate = (group: 'start' | 'end', month: string, day: string, year: string) => {
      cy.get(sel.part(group, 'month')).click();
      cy.focused().type(month);
      cy.focused().type(day);
      cy.focused().type(year);
    };

    const submitAndGetData = () => {
      cy.get('[data-cy="submitBtn_button"]').click({ force: true });
      return cy.get('@formSubmit').then((stub: any) => stub.lastCall.args[0].data);
    };

    describe('value', () => {
      it('should submit the range once both dates are typed', () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountRangeDateInput({ formSubmit });

        typeDate('start', '03', '16', '2026');
        typeDate('end', '03', '19', '2026');

        submitAndGetData().then((data) => {
          expect(data.stay).to.deep.equal({ start: '2026-03-16', end: '2026-03-19' });
        });
      });

      it('should store a reversed pair in order', () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountRangeDateInput({ formSubmit });

        typeDate('start', '03', '19', '2026');
        typeDate('end', '03', '16', '2026');

        cy.get(sel.part('start', 'day')).should('have.value', '16');
        submitAndGetData().then((data) => {
          expect(data.stay).to.deep.equal({ start: '2026-03-16', end: '2026-03-19' });
        });
      });

      it('should show its data in the parts', () => {
        mountRangeDateInput({ data: { stay: march } });
        cy.get(sel.part('end', 'day')).should('have.value', '06');
      });

      it('should show its defaultValue in the parts', () => {
        mountRangeDateInput({ defaultValue: { start: '2026-04-01', end: '2026-04-03' } });
        cy.get(sel.part('start', 'month')).should('have.value', '04');
        cy.get(sel.part('end', 'day')).should('have.value', '03');
      });
    });

    describe('validation', () => {
      it('should report a range with one date typed when focus leaves, and submit no value', () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountRangeDateInput({ props: { incompleteMessage: 'Type both dates' }, formSubmit });

        typeDate('start', '03', '16', '2026');
        cy.get('[data-cy="submitBtn_button"]').focus();

        cy.get(sel.error).should('be.visible').and('contain', 'Type both dates');
      });

      it('should show the required message when submitted empty', () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountRangeDateInput({
          validator: {
            type: 'range',
            required: true,
            messages: { required: 'Type your stay', invalid: 'Type your stay' },
          },
          formSubmit,
        });

        cy.get('[data-cy="submitBtn_button"]').click({ force: true });
        cy.get(sel.error).should('be.visible').and('contain', 'Type your stay');
      });
    });

    describe('props', () => {
      it('should translate its incomplete message', () => {
        const translations: Record<string, string> = { bothDates: 'Escribe las dos fechas' };
        const translator = identityTranslator('es-ES');
        mountRangeDateInput({
          localization: { ...translator, translate: (key: string) => translations[key] ?? key },
          props: { incompleteMessage: { key: 'bothDates' } },
        });

        cy.get(sel.part('start', 'day')).click();
        cy.focused().type('16');
        cy.get('[data-cy="submitBtn_button"]').focus();
        cy.get(sel.error).should('contain', 'Escribe las dos fechas');
      });
    });

    describe('state', () => {
      it('should disable its parts when disabled', () => {
        mountRangeDateInput({ disabled: true, data: { stay: march } });

        cy.get('gui-range-date input').should('have.length', 6).and('be.disabled');
      });

      it('should keep its value when readonly', () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountRangeDateInput({ readonly: true, data: { stay: march }, formSubmit });

        cy.get('gui-range-date input').each(($input) =>
          cy.wrap($input).should('have.attr', 'readonly'),
        );
        submitAndGetData().then((data) => expect(data.stay).to.deep.equal(march));
      });
    });
  });
};
