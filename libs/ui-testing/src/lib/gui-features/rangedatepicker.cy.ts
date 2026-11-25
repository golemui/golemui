import { defineForm, identityTranslator, type I18nTranslator } from '@golemui/core';
import { type MountComponentFn, withTestFormName } from '../utils';

// Behavior tests for the rangeDatePicker widget: one { start, end }, typed or picked with two
// clicks. The popup closes when the range is complete; a range outside the bounds or over a
// disabled day is shown with its error and the value stays.
export const runRangeDatePickerComponentTests = (baseMountFn: MountComponentFn) => {
  const mountFn = withTestFormName(baseMountFn);
  describe('RangeDatePicker Component', () => {
    const uid = 'testSubject';
    const sel = {
      part: (group: 'start' | 'end', type: string) =>
        `gui-range-date input[data-group="${group}"][data-type="${type}"]`,
      toggle: 'gui-range-date-picker button[aria-haspopup="dialog"]',
      calendar: 'gui-range-calendar',
      day: (date: string) => `gui-range-calendar button[data-date="${date}"]`,
      error: `[data-cy="${uid}_validator-error"]`,
    };
    const march = { start: '2026-03-02', end: '2026-03-06' };
    const closedDays = [{ start: '2026-03-09', end: '2026-03-11' }];

    const mountRangeDatePicker = (settings?: {
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
              type: 'rangeDatePicker',
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

    describe('picking', () => {
      it('should set the range with two clicks, close the calendar and submit it', () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountRangeDatePicker({ data: { stay: march }, formSubmit });

        cy.get(sel.toggle).click();
        cy.get(sel.day('2026-03-16')).click();
        cy.get(sel.part('start', 'day')).should('have.value', '16');
        cy.get(sel.part('end', 'day')).should('have.value', '');
        cy.get(sel.calendar).should('exist');
        cy.get(sel.day('2026-03-19')).click();
        cy.get(sel.calendar).should('not.exist');

        submitAndGetData().then((data) => {
          expect(data.stay).to.deep.equal({ start: '2026-03-16', end: '2026-03-19' });
        });
      });

      it('should drop an unfinished pick with Escape and keep its value', () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountRangeDatePicker({ data: { stay: march }, formSubmit });

        cy.get(sel.toggle).click();
        cy.get(sel.day('2026-03-16')).click();
        cy.focused().type('{esc}');
        cy.get(sel.part('start', 'day')).should('have.value', '02');

        submitAndGetData().then((data) => expect(data.stay).to.deep.equal(march));
      });

      it('should show a range over a disabled day with its message and keep the value', () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountRangeDatePicker({
          data: { stay: march },
          props: { disabledRanges: closedDays, disabledDateRangeMessage: 'We are closed' },
          formSubmit,
        });

        cy.get(sel.toggle).click();
        cy.get(sel.day('2026-03-05')).click();
        cy.get(sel.day('2026-03-12')).click();

        cy.get(sel.error).should('be.visible').and('contain', 'We are closed');
        cy.get(sel.part('end', 'day')).should('have.value', '12');
      });
    });

    describe('typing', () => {
      it('should submit a typed range', () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountRangeDatePicker({ formSubmit });

        typeDate('start', '03', '16', '2026');
        typeDate('end', '03', '19', '2026');

        submitAndGetData().then((data) => {
          expect(data.stay).to.deep.equal({ start: '2026-03-16', end: '2026-03-19' });
        });
      });

      it('should show a typed range before min-date with its message', () => {
        mountRangeDatePicker({
          props: { minDate: '2026-03-10', minDateMessage: 'We open on March 10' },
        });

        typeDate('start', '03', '02', '2026');
        typeDate('end', '03', '16', '2026');

        cy.get(sel.error).should('be.visible').and('contain', 'We open on March 10');
      });

      it('should report a half-typed range when focus leaves', () => {
        mountRangeDatePicker({ props: { incompleteMessage: 'Type both dates' } });

        typeDate('start', '03', '16', '2026');
        cy.get('[data-cy="submitBtn_button"]').focus();

        cy.get(sel.error).should('be.visible').and('contain', 'Type both dates');
      });
    });

    describe('validation', () => {
      it('should show the required message when submitted empty', () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountRangeDatePicker({
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

      it('should start at its defaultValue', () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountRangeDatePicker({ defaultValue: march, formSubmit });

        cy.get(sel.part('end', 'day')).should('have.value', '06');
        submitAndGetData().then((data) => expect(data.stay).to.deep.equal(march));
      });
    });

    describe('props', () => {
      it('should translate its disabled-range message', () => {
        const translations: Record<string, string> = { closed: 'Cerramos esos días' };
        const translator = identityTranslator('es-ES');
        mountRangeDatePicker({
          localization: { ...translator, translate: (key: string) => translations[key] ?? key },
          data: { stay: march },
          props: { disabledRanges: closedDays, disabledDateRangeMessage: { key: 'closed' } },
        });

        cy.get(sel.toggle).click();
        cy.get(sel.day('2026-03-05')).click();
        cy.get(sel.day('2026-03-12')).click();
        cy.get(sel.error).should('contain', 'Cerramos esos días');
      });
    });

    describe('state', () => {
      it('should disable its parts and its toggle when disabled', () => {
        mountRangeDatePicker({ disabled: true, data: { stay: march } });

        cy.get(sel.toggle).should('be.disabled');
        cy.get('gui-range-date input').should('have.length', 6).and('be.disabled');
      });

      it('should keep its value when readonly', () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountRangeDatePicker({ readonly: true, data: { stay: march }, formSubmit });

        cy.get(sel.toggle).click();
        cy.get(sel.day('2026-03-16')).click();
        cy.get(sel.day('2026-03-19')).click();

        submitAndGetData().then((data) => expect(data.stay).to.deep.equal(march));
      });
    });
  });
};
