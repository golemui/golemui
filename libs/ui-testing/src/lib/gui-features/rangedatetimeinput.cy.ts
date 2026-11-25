import { defineForm, identityTranslator, type I18nTranslator } from '@golemui/core';
import { type MountComponentFn, withTestFormName } from '../utils';

// Behavior tests for the rangeDateTimeInput widget: one { start, end } typed as two date-times, a reversed pair stored in order.
export const runRangeDateTimeInputComponentTests = (baseMountFn: MountComponentFn) => {
  const mountFn = withTestFormName(baseMountFn);
  describe('RangeDateTimeInput Component', () => {
    const uid = 'testSubject';
    const error = `[data-cy="${uid}_validator-error"]`;
    const june = { start: '2026-06-10T09:00:00', end: '2026-06-12T17:00:00' };
    const closed = [{ start: '2026-06-17T12:00:00', end: '2026-06-17T13:00:00' }];
    const part = (group: 'start' | 'end', type: string) =>
      `gui-range-date-time input[data-group="${group}"][data-type="${type}"]`;
    const typeEnd = (group: 'start' | 'end', digits: string[]) => {
      cy.get(part(group, 'month')).click();
      for (const value of digits) cy.focused().type(value);
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
              type: 'rangeDateTimeInput',
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

    it('should submit a typed range, swapping a reversed pair', () => {
      const formSubmit = cy.stub().as('formSubmit');
      mountWidget({ props: { hourFormat: '24' }, formSubmit });

      typeEnd('start', ['06', '12', '2026', '17', '00']);
      typeEnd('end', ['06', '10', '2026', '09', '00']);

      submitAndGetData().then((data) => expect(data.range).to.deep.equal(june));
    });

    it('should show its defaultValue in the parts', () => {
      mountWidget({ props: { hourFormat: '24' }, defaultValue: june });

      cy.get(part('end', 'day')).should('have.value', '12');
      cy.get(part('end', 'hour')).should('have.value', '17');
    });

    it('should show the incomplete message when focus leaves a half-typed range', () => {
      mountWidget({ props: { hourFormat: '24', incompleteMessage: 'Finish the range' } });

      typeEnd('start', ['06', '10', '2026', '09', '00']);
      cy.get('[data-cy="submitBtn_button"]').focus();
      cy.get(error).should('be.visible').and('contain', 'Finish the range');
    });

    it('should translate its incomplete message', () => {
      mountWidget({
        localization: translated({ finish: 'Termina el rango' }),
        props: { hourFormat: '24', incompleteMessage: { key: 'finish' } },
      });

      typeEnd('start', ['06', '10', '2026', '09', '00']);
      cy.get('[data-cy="submitBtn_button"]').focus();
      cy.get(error).should('contain', 'Termina el rango');
    });

    it('should keep its value when readonly', () => {
      const formSubmit = cy.stub().as('formSubmit');
      mountWidget({ readonly: true, data: { range: june }, formSubmit });

      cy.get('gui-range-date-time input').each(($input) =>
        cy.wrap($input).should('have.attr', 'readonly'),
      );
      submitAndGetData().then((data) => expect(data.range).to.deep.equal(june));
    });
  });
};
