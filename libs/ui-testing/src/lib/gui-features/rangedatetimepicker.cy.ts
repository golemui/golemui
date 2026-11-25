import { defineForm, identityTranslator, type I18nTranslator } from '@golemui/core';
import { type MountComponentFn, withTestFormName } from '../utils';

// Behavior tests for the rangeDateTimePicker widget: one { start, end } of date-times, typed or picked; the popup closes when the range is complete.
export const runRangeDateTimePickerComponentTests = (baseMountFn: MountComponentFn) => {
  const mountFn = withTestFormName(baseMountFn);
  describe('RangeDateTimePicker Component', () => {
    const uid = 'testSubject';
    const error = `[data-cy="${uid}_validator-error"]`;
    const june = { start: '2026-06-10T09:00:00', end: '2026-06-12T17:00:00' };
    const closed = [{ start: '2026-06-17T12:00:00', end: '2026-06-17T13:00:00' }];
    const toggle = 'gui-range-date-time-picker button[aria-haspopup="dialog"]';
    const calendar = 'gui-range-date-time-picker gui-range-date-time-calendar';
    const day = (date: string) => `${calendar} button[data-date="${date}"]`;
    const part = (group: 'start' | 'end', type: string) =>
      `gui-range-date-time input[data-group="${group}"][data-type="${type}"]`;

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
              type: 'rangeDateTimePicker',
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

    it('should pick new days with the shown times, close the calendar and submit', () => {
      const formSubmit = cy.stub().as('formSubmit');
      mountWidget({ props: { hourFormat: '24' }, data: { range: june }, formSubmit });

      cy.get(toggle).click();
      cy.get(day('2026-06-16')).click();
      cy.get(calendar).should('exist');
      cy.get(day('2026-06-18')).click();
      cy.get(calendar).should('not.exist');

      submitAndGetData().then((data) =>
        expect(data.range).to.deep.equal({
          start: '2026-06-16T09:00:00',
          end: '2026-06-18T17:00:00',
        }),
      );
    });

    it('should start at its defaultValue', () => {
      const formSubmit = cy.stub().as('formSubmit');
      mountWidget({ props: { hourFormat: '24' }, defaultValue: june, formSubmit });

      cy.get(part('end', 'day')).should('have.value', '12');
      submitAndGetData().then((data) => expect(data.range).to.deep.equal(june));
    });

    it('should show the disabled-range message for a range over a disabled span', () => {
      mountWidget({
        data: { range: june },
        props: { disabledRanges: closed, disabledRangeMessage: 'The shop is closed then' },
      });

      cy.get(toggle).click();
      cy.get(day('2026-06-16')).click();
      cy.get(day('2026-06-18')).click();
      cy.get(error).should('be.visible').and('contain', 'The shop is closed then');
    });

    it('should translate its disabled-range message', () => {
      mountWidget({
        localization: translated({ closed: 'Está cerrado' }),
        data: { range: june },
        props: { disabledRanges: closed, disabledRangeMessage: { key: 'closed' } },
      });

      cy.get(toggle).click();
      cy.get(day('2026-06-16')).click();
      cy.get(day('2026-06-18')).click();
      cy.get(error).should('contain', 'Está cerrado');
    });

    it('should disable its toggle when disabled', () => {
      mountWidget({ disabled: true, data: { range: june } });

      cy.get(toggle).should('be.disabled');
    });
  });
};
