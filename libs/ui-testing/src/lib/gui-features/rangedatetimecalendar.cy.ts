import { defineForm, identityTranslator, type I18nTranslator } from '@golemui/core';
import { type MountComponentFn, withTestFormName } from '../utils';

// Behavior tests for the rangeDateTimeCalendar widget: one { start, end } of date-times; two clicks pick new days with the times the calendar shows.
export const runRangeDateTimeCalendarComponentTests = (baseMountFn: MountComponentFn) => {
  const mountFn = withTestFormName(baseMountFn);
  describe('RangeDateTimeCalendar Component', () => {
    const uid = 'testSubject';
    const error = `[data-cy="${uid}_validator-error"]`;
    const june = { start: '2026-06-10T09:00:00', end: '2026-06-12T17:00:00' };
    const closed = [{ start: '2026-06-17T12:00:00', end: '2026-06-17T13:00:00' }];
    const day = (date: string) => `gui-range-date-time-calendar button[data-date="${date}"]`;
    const timePicker = (endpoint: 'start' | 'end') =>
      `gui-range-date-time-calendar gui-time-picker.gui-range-date-time-calendar__${endpoint}`;

    const mountWidget = (settings?: {
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
              type: 'rangeDateTimeCalendar',
              path: 'range',
              label: 'Range',
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

    const translated = (translations: Record<string, string>): I18nTranslator => {
      const translator = identityTranslator('es-ES');
      return { ...translator, translate: (key: string) => translations[key] ?? key };
    };

    it('should show the required message when submitted without a range', () => {
      const formSubmit = cy.stub().as('formSubmit');
      mountWidget({
        validator: {
          type: 'range',
          required: true,
          messages: { required: 'Pick a range', invalid: 'Pick a range' },
        },
        formSubmit,
      });

      cy.get('[data-cy="submitBtn_button"]').click({ force: true });
      cy.get(error).should('be.visible').and('contain', 'Pick a range');
    });

    it('should pick new days with the times it shows, and submit the range', () => {
      const formSubmit = cy.stub().as('formSubmit');
      mountWidget({ data: { range: june }, formSubmit });

      cy.get(timePicker('start')).should('have.prop', 'value', '09:00:00');
      cy.get(day('2026-06-16')).click();
      cy.get(day('2026-06-18')).click();

      submitAndGetData().then((data) =>
        expect(data.range).to.deep.equal({
          start: '2026-06-16T09:00:00',
          end: '2026-06-18T17:00:00',
        }),
      );
    });

    it('should start at its defaultValue', () => {
      const formSubmit = cy.stub().as('formSubmit');
      mountWidget({ defaultValue: june, formSubmit });

      cy.get(day('2026-06-10')).should('have.class', 'range-start');
      submitAndGetData().then((data) => expect(data.range).to.deep.equal(june));
    });

    it('should show the disabled-range message for a range over a disabled span', () => {
      mountWidget({
        data: { range: june },
        props: { disabledRanges: closed, disabledRangeMessage: 'The shop is closed then' },
      });

      cy.get(day('2026-06-16')).click();
      cy.get(day('2026-06-18')).click();
      cy.get(error).should('be.visible').and('contain', 'The shop is closed then');
    });

    it('should translate its time labels', () => {
      mountWidget({
        localization: translated({ pickUp: 'Recogida' }),
        data: { range: june },
        props: { startTimeLabel: { key: 'pickUp' } },
      });

      cy.get(timePicker('start')).should('contain.text', 'Recogida');
    });

    it('should keep its value when readonly', () => {
      const formSubmit = cy.stub().as('formSubmit');
      mountWidget({ readonly: true, data: { range: june }, formSubmit });

      cy.get(day('2026-06-16')).click();
      cy.get(day('2026-06-18')).click();
      submitAndGetData().then((data) => expect(data.range).to.deep.equal(june));
    });
  });
};
