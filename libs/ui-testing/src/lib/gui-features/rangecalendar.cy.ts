import { defineForm, identityTranslator, type I18nTranslator } from '@golemui/core';
import { type MountComponentFn, withTestFormName } from '../utils';

// Behavior tests for the rangeCalendar widget: one { start, end } picked with two clicks. The
// first click starts a new range and stops painting the old one; the second sets the value.
export const runRangeCalendarComponentTests = (baseMountFn: MountComponentFn) => {
  const mountFn = withTestFormName(baseMountFn);
  describe('RangeCalendar Component', () => {
    const uid = 'testSubject';
    const sel = {
      day: (date: string) => `gui-range-calendar button[data-date="${date}"]`,
      painted: 'gui-range-calendar :is(.range-start, .in-range, .range-end)',
      error: `[data-cy="${uid}_validator-error"]`,
    };
    const march = { start: '2026-03-02', end: '2026-03-06' };

    const mountRangeCalendar = (settings?: {
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
              type: 'rangeCalendar',
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

    const submitAndGetData = () => {
      cy.get('[data-cy="submitBtn_button"]').click({ force: true });
      return cy.get('@formSubmit').then((stub: any) => stub.lastCall.args[0].data);
    };

    describe('value', () => {
      it('should set the range with two clicks and submit it', () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountRangeCalendar({ data: { stay: march }, formSubmit });

        cy.get(sel.painted).should('have.length', 5);
        cy.get(sel.day('2026-03-16')).click();
        cy.get(sel.painted).should('have.length', 0);
        cy.get(sel.day('2026-03-19')).click();
        cy.get(sel.painted).should('have.length', 4);

        submitAndGetData().then((data) => {
          expect(data.stay).to.deep.equal({ start: '2026-03-16', end: '2026-03-19' });
        });
      });

      it('should start at its defaultValue', () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountRangeCalendar({ defaultValue: march, formSubmit });

        cy.get(sel.day('2026-03-02')).should('have.class', 'range-start');
        submitAndGetData().then((data) => expect(data.stay).to.deep.equal(march));
      });
    });

    describe('validation', () => {
      it('should show the required message when submitted without a range', () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountRangeCalendar({
          validator: {
            type: 'range',
            required: true,
            messages: { required: 'Pick your stay', invalid: 'Pick your stay' },
          },
          formSubmit,
        });

        cy.get('[data-cy="submitBtn_button"]').click({ force: true });
        cy.get(sel.error).should('be.visible').and('contain', 'Pick your stay');
      });

      it('should reject a range over a disabled day with its message and keep the value', () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountRangeCalendar({
          data: { stay: march },
          props: {
            disabledRanges: [{ start: '2026-03-09', end: '2026-03-11' }],
            disabledDateRangeMessage: 'We are closed those days',
          },
          formSubmit,
        });

        cy.get(sel.day('2026-03-05')).click();
        cy.get(sel.day('2026-03-12')).click();

        cy.get(sel.error).should('be.visible').and('contain', 'We are closed those days');
        cy.get(sel.day('2026-03-12')).should('have.class', 'invalid-range-end');
      });
    });

    describe('props', () => {
      it('should translate its disabled-range message', () => {
        const translations: Record<string, string> = { closedDays: 'Cerramos esos días' };
        const translator = identityTranslator('es-ES');
        mountRangeCalendar({
          localization: { ...translator, translate: (key: string) => translations[key] ?? key },
          data: { stay: march },
          props: {
            disabledRanges: [{ start: '2026-03-09', end: '2026-03-11' }],
            disabledDateRangeMessage: { key: 'closedDays' },
          },
        });

        cy.get(sel.day('2026-03-05')).click();
        cy.get(sel.day('2026-03-12')).click();
        cy.get(sel.error).should('contain', 'Cerramos esos días');
      });
    });

    describe('state', () => {
      it('should disable its days when disabled', () => {
        mountRangeCalendar({ disabled: true, data: { stay: march } });

        cy.get(sel.day('2026-03-16')).should('be.disabled');
      });

      it('should keep its value when readonly', () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountRangeCalendar({ readonly: true, data: { stay: march }, formSubmit });

        cy.get(sel.day('2026-03-16')).click();
        cy.get(sel.day('2026-03-19')).click();

        submitAndGetData().then((data) => expect(data.stay).to.deep.equal(march));
      });
    });
  });
};
