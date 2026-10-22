import { html, nothing } from 'lit';
import type { GuiTooltip } from '../../src/lib/components/tooltip';
import { GUIAnchorController } from '../../src/lib/controllers/anchor.controller';
import { overlaySuite } from '../support/overlay';
import { realClick, realPress, takesRealInput } from '../support/real-input';

// Short delays keep the specs fast; the defaults are 500 and 150 ms.
const save = ({ placement }: { placement?: string } = {}) =>
  html`<button type="button" id="save">Save</button>
    <gui-tooltip for="save" open-delay="40" close-delay="40" placement=${placement ?? nothing}>
      Saves your changes without publishing them to the rest of the team
    </gui-tooltip>`;

const tooltip = () => cy.get<GuiTooltip>('gui-tooltip');
const target = () => cy.get('#save');
const hover = () => target().trigger('pointerenter', { pointerType: 'mouse' });
const isOpen = (expected: boolean) =>
  tooltip().should(([element]) => expect(element.matches(':popover-open')).to.equal(expected));

overlaySuite({
  name: 'gui-tooltip',
  template: () => save(),
  invoker: '#save',
  floating: 'gui-tooltip',
  host: 'gui-tooltip',
  openState: ':popover-open',
  openFromInvoker: () => {
    hover();
  },
  // The pointer leaving the target closes it: a click elsewhere is no different.
  outsideClick: 'skip',
  anchored: 'center',
});

describe('gui-tooltip', () => {
  describe('description', () => {
    it("names itself a tooltip and joins its target's description", () => {
      cy.mount(
        html`<p id="hint">Ctrl+S</p>
          <button type="button" id="save" aria-describedby="hint">Save</button>
          <gui-tooltip for="save">Saves without publishing</gui-tooltip>`,
      );

      tooltip().should(([element]) => {
        expect(element.getAttribute('role')).to.equal('tooltip');
        expect(element.getAttribute('popover')).to.equal('manual');
        expect(element.id).to.match(/^gui-tooltip-\d+$/);
        expect(element.matches(':popover-open')).to.equal(false);
      });
      tooltip().then(([element]) =>
        target().should('have.attr', 'aria-describedby', `hint ${element.id}`),
      );

      tooltip().then(([element]) => element.remove());
      target().should('have.attr', 'aria-describedby', 'hint');
    });

    it('keeps the id and role the app gives it', () => {
      cy.mount(
        html`<button type="button" id="save">Save</button>
          <gui-tooltip id="save-tip" role="tooltip" for="save">Saves</gui-tooltip>`,
      );

      target().should('have.attr', 'aria-describedby', 'save-tip');
    });

    it('moves to another target when its for attribute changes', () => {
      cy.mount(html`${save()}<button type="button" id="publish">Publish</button>`);

      tooltip().invoke('attr', 'for', 'publish');
      target().should('not.have.attr', 'aria-describedby');
      tooltip().then(([element]) =>
        cy.get('#publish').should('have.attr', 'aria-describedby', element.id),
      );
    });
  });

  describe('pointer', () => {
    it('opens after its delay while the pointer rests on the target', () => {
      const onToggle = cy.spy().as('toggle');
      cy.mount(html`<div @gui-toggle=${onToggle}>${save()}</div>`);

      hover();
      isOpen(true);
      cy.get('@toggle').should('have.been.calledOnce');
      cy.get('@toggle').its('firstCall.args.0.detail').should('deep.equal', { open: true });
    });

    it('never opens for a touch', () => {
      cy.mount(save());

      target().trigger('pointerenter', { pointerType: 'touch' });
      cy.wait(120);
      isOpen(false);
    });

    it('stays open while the pointer moves onto it, and closes once it leaves both', () => {
      const onToggle = cy.spy().as('toggle');
      cy.mount(html`<div @gui-toggle=${onToggle}>${save()}</div>`);

      hover();
      isOpen(true);
      tooltip().then(([element]) =>
        target().trigger('pointerleave', { pointerType: 'mouse', relatedTarget: element }),
      );
      tooltip().trigger('pointerenter', { pointerType: 'mouse' });
      cy.wait(120);
      isOpen(true);

      cy.get('body').then(([body]) =>
        tooltip().trigger('pointerleave', { pointerType: 'mouse', relatedTarget: body }),
      );
      isOpen(false);
      cy.get('@toggle').its('lastCall.args.0.detail').should('deep.equal', { open: false });
    });

    it('closes when the target is pressed', () => {
      cy.mount(save());

      hover();
      isOpen(true);
      target().trigger('pointerdown', { pointerType: 'mouse' });
      isOpen(false);
    });
  });

  describe('keyboard', () => {
    it('closes on Escape, which goes no further', () => {
      const onKeyDown = cy.spy().as('keydown');
      cy.mount(save());
      cy.document().then((document) => document.addEventListener('keydown', onKeyDown));

      hover();
      isOpen(true);
      cy.get('body').type('{esc}');
      isOpen(false);
      cy.get('@keydown').should('not.have.been.called');
      cy.document().then((document) => document.removeEventListener('keydown', onKeyDown));
    });

    // Telling keyboard focus from a click needs trusted input, which Cypress has in Chromium only.
    if (takesRealInput()) {
      it('opens on keyboard focus and closes when focus leaves', () => {
        cy.mount(html`${save()}<button type="button">Cancel</button>`);
        cy.window().then((win) => realClick(4, win.innerHeight - 4));

        realPress('Tab');
        cy.focused().should('have.id', 'save');
        isOpen(true);
        realPress('Tab');
        isOpen(false);
      });

      it('does not open when a click focuses the target', () => {
        cy.mount(save());

        target().then(([button]) => {
          const { x, y, width, height } = button.getBoundingClientRect();
          realClick(x + width / 2, y + height / 2);
        });
        cy.focused().should('have.id', 'save');
        cy.wait(120);
        isOpen(false);
      });
    }
  });

  describe('state', () => {
    it('opens and closes with open, and fires no gui-toggle', () => {
      const onToggle = cy.spy().as('toggle');
      cy.mount(html`<div @gui-toggle=${onToggle}>${save()}</div>`);

      tooltip().invoke('prop', 'open', true);
      isOpen(true);
      tooltip().should('have.attr', 'open');
      tooltip().invoke('prop', 'open', false);
      isOpen(false);
      cy.get('@toggle').should('not.have.been.called');
    });

    it('places itself again when its placement changes while it is open', () => {
      cy.mount(html`<div style="position: fixed; top: 200px; left: 200px">${save()}</div>`);

      tooltip().invoke('prop', 'open', true);
      target().then(([button]) =>
        tooltip().should(([element]) => {
          expect(element.getBoundingClientRect().bottom).to.be.closeTo(
            button.getBoundingClientRect().top - 8,
            1,
          );
        }),
      );
      tooltip().invoke('attr', 'placement', 'bottom');
      target().then(([button]) =>
        tooltip().should(([element]) => {
          expect(element.getBoundingClientRect().top).to.be.closeTo(
            button.getBoundingClientRect().bottom + 8,
            1,
          );
        }),
      );
    });
  });

  for (const fallback of [false, true]) {
    describe(`arrow${fallback ? ', measuring path' : ''}`, () => {
      beforeEach(() => {
        GUIAnchorController.forceFallback = fallback;
        cy.viewport(800, 600);
      });

      afterEach(() => {
        GUIAnchorController.forceFallback = false;
      });

      /** Where the arrow points, on screen: its edge, and its centre along that edge. */
      const arrow = (element: Element) => {
        const box = element.getBoundingClientRect();
        const side = element.getAttribute('data-gui-arrow');
        const offset = parseFloat(
          (element as HTMLElement).style.getPropertyValue('--gui-arrow-offset'),
        );
        const across = side === 'top' || side === 'bottom';
        return { side, at: (across ? box.left : box.top) + offset };
      };

      const opened = (template: unknown, placement: string) => {
        cy.mount(template);
        tooltip().invoke('attr', 'placement', placement).invoke('prop', 'open', true);
        isOpen(true);
      };

      it('points at the middle of its target, from the edge that faces it', () => {
        opened(html`<div style="position: fixed; top: 250px; left: 300px">${save()}</div>`, 'top');

        target().then(([button]) =>
          tooltip().should(([element]) => {
            const { left, width } = button.getBoundingClientRect();
            expect(arrow(element).side).to.equal('bottom');
            expect(arrow(element).at).to.be.closeTo(left + width / 2, 1);
            expect(getComputedStyle(element, '::before').content).not.to.equal('none');
          }),
        );
        tooltip().invoke('attr', 'placement', 'end');
        target().then(([button]) =>
          tooltip().should(([element]) => {
            const { top, height } = button.getBoundingClientRect();
            expect(arrow(element).side).to.equal('left');
            expect(arrow(element).at).to.be.closeTo(top + height / 2, 1);
          }),
        );
      });

      it('sits near the corner lined up with a wider target', () => {
        opened(
          html`<div style="position: fixed; top: 250px; left: 100px">
            <button type="button" id="save" style="inline-size: 500px">Save</button>
            <gui-tooltip for="save">Saves without publishing</gui-tooltip>
          </div>`,
          'bottom-end',
        );

        tooltip().should(([element]) => {
          expect(arrow(element).side).to.equal('top');
          expect(arrow(element).at).to.be.closeTo(element.getBoundingClientRect().right - 12, 1);
        });
      });

      it('turns with the tooltip when it flips', () => {
        opened(html`<div style="position: fixed; top: 4px; left: 300px">${save()}</div>`, 'top');

        tooltip().should(([element]) => expect(arrow(element).side).to.equal('top'));
      });

      it('points back at its target in right to left', () => {
        opened(
          html`<div dir="rtl" style="position: fixed; top: 250px; left: 400px">${save()}</div>`,
          'end',
        );

        target().then(([button]) =>
          tooltip().should(([element]) => {
            expect(element.getBoundingClientRect().right).to.be.closeTo(
              button.getBoundingClientRect().left - 8,
              1,
            );
            expect(arrow(element).side).to.equal('right');
          }),
        );
      });
    });
  }
});
