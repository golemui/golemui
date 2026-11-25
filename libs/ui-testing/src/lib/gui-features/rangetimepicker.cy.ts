import { defineForm, identityTranslator, type I18nTranslator } from '@golemui/core';
import { type MountComponentFn, withTestFormName } from '../utils';

// Behavior tests for the rangeTimePicker widget: one { start, end } picked from two time lists, which close when the range is complete.
export const runRangeTimePickerComponentTests = (baseMountFn: MountComponentFn) => {
  const mountFn = withTestFormName(baseMountFn);
  describe('RangeTimePicker Component', () => {
    const uid = 'testSubject';
    const error = `[data-cy="${uid}_validator-error"]`;
    const part = (group: 'start' | 'end', type: string) =>
      `gui-range-time input[data-group="${group}"][data-type="${type}"]`;
    const toggle = 'gui-range-time-picker button[aria-haspopup="dialog"]';
    const panel = 'gui-range-time-picker .gui-range-time-picker__panel';
    const option = (group: 'start' | 'end', time: string) =>
      `gui-range-time-picker .gui-range-time-picker__column:${group === 'start' ? 'first' : 'last'}-child .gui-time-list__option[data-value="${time}"]`;
    const morning = { start: '09:00:00', end: '12:00:00' };

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
              type: 'rangeTimePicker',
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

    it('should set the range from the lists, close them and submit it', () => {
      const formSubmit = cy.stub().as('formSubmit');
      mountWidget({ props: { hourFormat: '24', minuteStep: 30 }, formSubmit });

      cy.get(toggle).click();
      cy.get(option('start', '13:00:00')).click();
      cy.get(panel).should('exist');
      cy.get(option('end', '17:30:00')).click();
      cy.get(panel).should('not.exist');

      submitAndGetData().then((data) =>
        expect(data.range).to.deep.equal({ start: '13:00:00', end: '17:30:00' }),
      );
    });

    it('should start at its defaultValue and show it in the lists', () => {
      mountWidget({ props: { hourFormat: '24', minuteStep: 30 }, defaultValue: morning });

      cy.get(part('end', 'hour')).should('have.value', '12');
      cy.get(toggle).click();
      cy.get(option('start', '09:00:00')).should('have.attr', 'aria-selected', 'true');
    });

    it('should show the disabled-range message for a range over a disabled time', () => {
      mountWidget({
        props: {
          hourFormat: '24',
          minuteStep: 60,
          disabledRanges: [{ start: '13:00:00', end: '14:00:00' }],
          disabledRangeMessage: 'Closed for lunch',
        },
        data: { range: morning },
      });

      cy.get(toggle).click();
      cy.get(option('start', '12:00:00')).click();
      cy.get(option('end', '15:00:00')).click();

      cy.get(error).should('be.visible').and('contain', 'Closed for lunch');
    });

    it('should translate its list labels', () => {
      mountWidget({
        localization: translated({ opens: 'Abre', closes: 'Cierra' }),
        props: { startTimeLabel: { key: 'opens' }, endTimeLabel: { key: 'closes' } },
      });

      cy.get(toggle).click();
      cy.get('gui-range-time-picker .gui-range-time-picker__column-label')
        .first()
        .should('have.text', 'Abre');
      cy.get('gui-range-time-picker .gui-range-time-picker__column-label')
        .last()
        .should('have.text', 'Cierra');
    });

    it('should disable its toggle when disabled', () => {
      mountWidget({ disabled: true, data: { range: morning } });

      cy.get(toggle).should('be.disabled');
    });

    it('should keep its value when readonly', () => {
      const formSubmit = cy.stub().as('formSubmit');
      mountWidget({ readonly: true, data: { range: morning }, formSubmit });

      submitAndGetData().then((data) => expect(data.range).to.deep.equal(morning));
    });
  });
};
