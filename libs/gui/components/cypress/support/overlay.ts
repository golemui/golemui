import { html, type TemplateResult } from 'lit';
import { GUIAnchorController } from '../../src/lib/controllers/anchor.controller';
import { checkA11y } from './a11y';
import { realClick, realPress, takesRealInput } from './real-input';

/** An overlay element, for the behavior every overlay shares. */
export interface OverlayCase {
  /** The element's tag, for the test titles. */
  name: string;
  /** The overlay and its invoker, closed. The floating element must be larger than 120×60. */
  template: () => TemplateResult;
  /** The element that opens it. */
  invoker: string;
  /** The element the browser shows in the top layer. */
  floating: string;
  /** The element with the `open` property. */
  host: string;
  /** The pseudo-class the floating element matches while it is open. */
  openState: ':popover-open' | ':modal';
  /**
   * A focusable element inside the floating one. Without one (a tooltip holds no controls), focus
   * stays on the invoker.
   */
  focusable?: string;
  /** How the user opens it from its invoker. Default: a click. */
  openFromInvoker?: () => void;
  /**
   * What a click outside does: `closes` (light dismiss), `stays`, or `skip` for an overlay that
   * closes when the pointer leaves its invoker, which a click outside also does.
   */
  outsideClick: 'closes' | 'stays' | 'skip';
  /**
   * How it lines up with its invoker, for an overlay anchored to it: `start` for an alignment to
   * the invoker's start edge, `center` for a centered one. Anchored overlays also run on the
   * measuring path, and are checked near each edge of the viewport and in right-to-left.
   */
  anchored?: 'start' | 'center';
}

type Corner = { top?: string; bottom?: string; left?: string; right?: string };

const corners: Record<string, Corner> = {
  'top left': { top: '8px', left: '8px' },
  'top right': { top: '8px', right: '8px' },
  'bottom left': { bottom: '8px', left: '8px' },
  'bottom right': { bottom: '8px', right: '8px' },
};

const placed = (corner: Corner, content: TemplateResult, dir = 'ltr') =>
  html`<div
    dir=${dir}
    style=${[
      'position: fixed',
      ...Object.entries(corner).map(([side, value]) => `${side}: ${value}`),
    ].join('; ')}
  >
    ${content}
  </div>`;

const box = (selector: string) =>
  cy.get(selector).then(([element]) => element.getBoundingClientRect());

/**
 * The behavior every overlay shares: it opens from its invoker and from `open`, it closes on
 * Escape and returns focus, it shows in the top layer, above a modal dialog too, and it passes axe
 * open and closed. An anchored overlay also stays inside the viewport near each edge and mirrors
 * in right-to-left, on the CSS path and on the measuring one.
 */
export function overlaySuite(overlay: OverlayCase): void {
  const { invoker, floating, host, openState } = overlay;
  const isOpen = (expected: boolean) =>
    cy.get(floating).should(([element]) => expect(element.matches(openState)).to.equal(expected));
  const open = () => cy.get(host).invoke('prop', 'open', true);
  const openFromInvoker = overlay.openFromInvoker ?? (() => cy.get(invoker).click());
  const focusInside = () => cy.get(overlay.focusable ?? invoker).focus();
  // Until it has faded in, axe would measure the contrast of half-transparent text.
  const settled = () =>
    cy.get(floating).should(([element]) => expect(element.getAnimations()).to.have.length(0));

  for (const fallback of overlay.anchored ? [false, true] : [false]) {
    describe(`${overlay.name}: overlay behavior${fallback ? ', measuring path' : ''}`, () => {
      beforeEach(() => {
        GUIAnchorController.forceFallback = fallback;
      });

      afterEach(() => {
        GUIAnchorController.forceFallback = false;
      });

      it('opens from its invoker', () => {
        cy.mount(overlay.template());

        isOpen(false);
        openFromInvoker();
        isOpen(true);
      });

      it('opens and closes with open, and returns focus to its invoker', () => {
        cy.mount(overlay.template());

        openFromInvoker();
        focusInside();
        cy.get(host).invoke('prop', 'open', false);
        isOpen(false);
        cy.focused().should('match', invoker);

        open();
        isOpen(true);
      });

      it('shows in the top layer, above anything the page stacks', () => {
        cy.mount(
          html`${overlay.template()}
            <div style="position: fixed; inset: 0; z-index: 2147483647"></div>`,
        );

        open();
        cy.get(floating).should(([element]) => {
          const { x, y, width, height } = element.getBoundingClientRect();
          const top = element.ownerDocument.elementFromPoint(x + width / 2, y + height / 2);
          expect(element.contains(top), 'the element on top').to.equal(true);
        });
      });

      it('shows above a modal dialog it opens from', () => {
        cy.mount(
          html`<dialog id="overlay-dialog" aria-label="Settings">${overlay.template()}</dialog>`,
        );
        cy.get<HTMLDialogElement>('#overlay-dialog').then(([dialog]) => dialog.showModal());

        openFromInvoker();
        isOpen(true);
        cy.get(floating).should(([element]) => {
          const { x, y, width, height } = element.getBoundingClientRect();
          const top = element.ownerDocument.elementFromPoint(x + width / 2, y + height / 2);
          expect(element.contains(top), 'the element on top').to.equal(true);
        });
      });

      it('has no accessibility violations, closed or open', () => {
        cy.mount(overlay.template());

        checkA11y(host);
        open();
        isOpen(true);
        settled();
        checkA11y(host);
      });

      // Escape and a click outside need trusted input, which Cypress has in Chromium only.
      if (takesRealInput()) {
        it('closes on Escape and returns focus to its invoker', () => {
          cy.mount(overlay.template());

          openFromInvoker();
          focusInside();
          realPress('Escape');
          isOpen(false);
          cy.focused().should('match', invoker);
        });

        if (overlay.outsideClick !== 'skip') {
          const closes = overlay.outsideClick === 'closes';
          it(`${closes ? 'closes' : 'stays open'} on a click outside`, () => {
            cy.mount(overlay.template());

            openFromInvoker();
            isOpen(true);
            cy.window().then((win) => realClick(4, win.innerHeight - 4));
            isOpen(!closes);
          });
        }
      }

      if (!overlay.anchored) return;

      for (const [name, corner] of Object.entries(corners)) {
        it(`stays inside the viewport near the ${name} corner`, () => {
          cy.mount(placed(corner, overlay.template()));

          open();
          isOpen(true);
          cy.window().then((win) => {
            box(floating).should((rect) => {
              expect(rect.left, 'left').to.be.at.least(0);
              expect(rect.top, 'top').to.be.at.least(0);
              expect(rect.right, 'right').to.be.at.most(win.innerWidth);
              expect(rect.bottom, 'bottom').to.be.at.most(win.innerHeight);
            });
          });
        });
      }

      for (const dir of ['ltr', 'rtl']) {
        it(`lines up with its invoker in ${dir}`, () => {
          cy.mount(placed({ top: '120px', left: '200px' }, overlay.template(), dir));

          open();
          isOpen(true);
          box(invoker).then((anchor) => {
            box(floating).should((rect) => {
              if (overlay.anchored === 'center') {
                expect(rect.left + rect.width / 2).to.be.closeTo(anchor.left + anchor.width / 2, 1);
              } else if (dir === 'ltr') {
                expect(rect.left).to.be.closeTo(anchor.left, 1);
              } else {
                expect(rect.right).to.be.closeTo(anchor.right, 1);
              }
            });
          });
        });
      }
    });
  }
}
