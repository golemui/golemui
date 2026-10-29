import { defineForm, identityTranslator, type FormWidget } from '@golemui/core';
import { type MountComponentFn } from '../utils';

// Behavior tests for the button widget's accessible name: an icon-only button is named by its
// `ariaLabel`, and a visible label always stays the name.
export const runButtonComponentTests = (mountFn: MountComponentFn) => {
  describe('Button Component', () => {
    const UID = 'closeButton';

    const mountButton = (overrides: Record<string, unknown> = {}, props = {}) => {
      mountFn({
        localization: identityTranslator('en-US'),
        formDef: defineForm({
          form: [
            {
              uid: UID,
              kind: 'action',
              type: 'button',
              label: 'Close',
              props,
              ...overrides,
            } as FormWidget<string>,
          ],
        }),
      });
    };

    const button = () => cy.get(`[data-cy="${UID}_button"]`);

    it('names an icon-only button with ariaLabel', () => {
      mountButton({ label: undefined }, { icon: 'close', ariaLabel: 'Close the panel' });

      button().should('have.attr', 'aria-label', 'Close the panel');
    });

    it('keeps a visible label as the name, ignoring ariaLabel', () => {
      mountButton({}, { icon: 'close', ariaLabel: 'Close the panel' });

      button().should('not.have.attr', 'aria-label');
      button().should('contain.text', 'Close');
    });

    it('translates its ariaLabel', () => {
      const translations: Record<string, string> = { closePanel: 'Cerrar el panel' };
      const translator = identityTranslator('es-ES');
      mountFn({
        localization: { ...translator, translate: (key: string) => translations[key] ?? key },
        formDef: defineForm({
          form: [
            {
              uid: UID,
              kind: 'action',
              type: 'button',
              props: { icon: 'close', ariaLabel: { key: 'closePanel' } },
            } as FormWidget<string>,
          ],
        }),
      });

      button().should('have.attr', 'aria-label', 'Cerrar el panel');
    });
  });
};
