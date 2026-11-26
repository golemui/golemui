import { defineForm, identityTranslator, type FormWidget } from '@golemui/core';
import { type MountComponentFn } from '../utils';

// Behavior tests for the button widget's accessible name: an icon-only button is named by its
// `ariaLabel`, and a visible label always stays the name. Its tooltip is its description.
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
    const tooltip = () => cy.get('gui-tooltip');
    const hover = () => button().trigger('pointerenter', { pointerType: 'mouse' });
    const tooltipIsOpen = (open: boolean) =>
      tooltip().should(([element]) =>
        expect(element.matches(':popover-open'), 'tooltip open').to.equal(open),
      );

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

    it('describes the button with its tooltip, which the pointer resting on it opens', () => {
      cy.window().then((win) => cy.spy(win.console, 'warn').as('warn'));
      mountButton(
        { label: undefined },
        { icon: 'close', ariaLabel: 'Close', tooltip: 'Closes the panel' },
      );

      tooltip()
        .should('have.attr', 'role', 'tooltip')
        .and('have.attr', 'popover', 'manual')
        .and('have.text', 'Closes the panel');
      tooltip().then(([element]) => button().should('have.attr', 'aria-describedby', element.id));
      button().should('have.attr', 'aria-label', 'Close');
      tooltipIsOpen(false);

      hover();
      tooltipIsOpen(true);
      button().trigger('pointerdown');
      tooltipIsOpen(false);
      cy.get('@warn').should('not.have.been.calledWithMatch', /<gui-tooltip>/);
    });

    it('names a button with no label and no ariaLabel by its tooltip, which describes nothing', () => {
      mountButton({ label: undefined }, { icon: 'close', tooltip: 'Close' });

      button().should('have.attr', 'aria-label', 'Close');
      button().should('not.have.attr', 'aria-describedby');
      tooltip().should(([element]) =>
        expect((element as HTMLElement & { type: string }).type).to.equal('label'),
      );
      hover();
      tooltipIsOpen(true);
      button().should('not.have.attr', 'aria-describedby');
    });

    it('renders no tooltip and no description without one', () => {
      mountButton({}, { tooltip: '' });

      button().should('exist').and('not.have.attr', 'aria-describedby');
      tooltip().should('not.exist');
    });

    it('translates its tooltip', () => {
      const translations: Record<string, string> = { closeTip: 'Cierra el panel' };
      const translator = identityTranslator('es-ES');
      mountFn({
        localization: { ...translator, translate: (key: string) => translations[key] ?? key },
        formDef: defineForm({
          form: [
            {
              uid: UID,
              kind: 'action',
              type: 'button',
              label: 'Cerrar',
              props: { tooltip: { key: 'closeTip' } },
            } as FormWidget<string>,
          ],
        }),
      });

      tooltip().should('have.text', 'Cierra el panel');
    });
  });
};
