import { defineForm, identityTranslator, type I18nTranslator } from '@golemui/core';
import { type MountComponentFn, withTestFormName } from '../utils';

// Behavior tests for the rangeTimeInput widget: one { start, end } typed as two times, the end strictly after the start.
export const runRangeTimeInputComponentTests = (baseMountFn: MountComponentFn) => {
  const mountFn = withTestFormName(baseMountFn);
  describe('RangeTimeInput Component', () => {
    const uid = 'testSubject';
    const error = `[data-cy="${uid}_validator-error"]`;
    const part = (group: 'start' | 'end', type: string) =>
      `gui-range-time input[data-group="${group}"][data-type="${type}"]`;
    const morning = { start: '09:00:00', end: '12:30:00' };
    const typeTime = (group: 'start' | 'end', hour: string, minute: string) => {
      cy.get(part(group, 'hour')).click();
      cy.focused().type(hour);
      cy.focused().type(minute);
    };

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
              type: 'rangeTimeInput',
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

    it('should submit a typed range', () => {
      const formSubmit = cy.stub().as('formSubmit');
      mountWidget({ props: { hourFormat: '24' }, formSubmit });

      typeTime('start', '09', '00');
      typeTime('end', '12', '30');

      submitAndGetData().then((data) => expect(data.range).to.deep.equal(morning));
    });

    it('should show its data and its defaultValue in the parts', () => {
      mountWidget({ props: { hourFormat: '24' }, defaultValue: morning });

      cy.get(part('end', 'hour')).should('have.value', '12');
      cy.get(part('end', 'minute')).should('have.value', '30');
    });

    it('should show the order message for an end before the start', () => {
      mountWidget({ props: { hourFormat: '24', rangeOrderMessage: 'Closes before it opens' } });

      typeTime('start', '12', '30');
      typeTime('end', '09', '00');

      cy.get(error).should('be.visible').and('contain', 'Closes before it opens');
    });

    it('should translate its order message', () => {
      mountWidget({
        localization: translated({ order: 'Cierra antes de abrir' }),
        props: { hourFormat: '24', rangeOrderMessage: { key: 'order' } },
      });

      typeTime('start', '12', '30');
      typeTime('end', '09', '00');
      cy.get(error).should('contain', 'Cierra antes de abrir');
    });

    it('should disable its parts when disabled, and keep its value when readonly', () => {
      const formSubmit = cy.stub().as('formSubmit');
      mountWidget({ readonly: true, data: { range: morning }, formSubmit });

      cy.get('gui-range-time input').each(($input) =>
        cy.wrap($input).should('have.attr', 'readonly'),
      );
      submitAndGetData().then((data) => expect(data.range).to.deep.equal(morning));
    });
  });
};
