import { html, nothing } from 'lit';
import { GUIAnchorController } from '../../src/lib/controllers/anchor.controller';
import { PLACEMENTS, type GuiPlacement } from '../../src/lib/utils/placement';
import { overlaySuite } from '../support/overlay';

const filters = ({ placement, anchor }: { placement?: GuiPlacement; anchor?: string } = {}) =>
  html`<button type="button" popovertarget="filters">Filters</button>
    <gui-popover placement=${placement ?? nothing} anchor=${anchor ?? nothing}>
      <div id="filters" popover>
        <p style="inline-size: 200px; block-size: 60px; margin: 0">Only show open orders</p>
        <button type="button">Apply</button>
      </div>
    </gui-popover>`;

const popover = () => cy.get('gui-popover');
const panel = () => cy.get('#filters');

/** Waits until the panel sits at `placement` against the anchor, measuring both on each try. */
const shouldBePlaced = (placement: GuiPlacement, anchor = 'button[popovertarget="filters"]') =>
  cy
    .get(anchor)
    .then(([anchorElement]) =>
      panel().should(([element]) =>
        expectPlaced(
          placement,
          anchorElement.getBoundingClientRect(),
          element.getBoundingClientRect(),
        ),
      ),
    );

overlaySuite({
  name: 'gui-popover',
  template: () => filters(),
  invoker: 'button[popovertarget="filters"]',
  floating: '#filters',
  host: 'gui-popover',
  openState: ':popover-open',
  focusable: '#filters button',
  lightDismiss: true,
  anchored: 'start',
});

/** Where a panel placed at `placement` sits against its anchor, in a left-to-right context. */
function expectPlaced(placement: GuiPlacement, anchor: DOMRect, panel: DOMRect) {
  const [side, align = 'center'] = placement.split('-');
  const gap = 4;

  if (side === 'top') expect(panel.bottom, 'bottom').to.be.closeTo(anchor.top - gap, 1);
  if (side === 'bottom') expect(panel.top, 'top').to.be.closeTo(anchor.bottom + gap, 1);
  if (side === 'start') expect(panel.right, 'right').to.be.closeTo(anchor.left - gap, 1);
  if (side === 'end') expect(panel.left, 'left').to.be.closeTo(anchor.right + gap, 1);

  if (side === 'top' || side === 'bottom') {
    if (align === 'start') expect(panel.left, 'left').to.be.closeTo(anchor.left, 1);
    if (align === 'end') expect(panel.right, 'right').to.be.closeTo(anchor.right, 1);
    if (align === 'center') {
      expect(panel.left + panel.width / 2, 'center').to.be.closeTo(
        anchor.left + anchor.width / 2,
        1,
      );
    }
  } else {
    if (align === 'start') expect(panel.top, 'top').to.be.closeTo(anchor.top, 1);
    if (align === 'end') expect(panel.bottom, 'bottom').to.be.closeTo(anchor.bottom, 1);
    if (align === 'center') {
      expect(panel.top + panel.height / 2, 'middle').to.be.closeTo(
        anchor.top + anchor.height / 2,
        1,
      );
    }
  }
}

describe('gui-popover', () => {
  for (const fallback of [false, true]) {
    describe(`placement${fallback ? ', measuring path' : ''}`, () => {
      beforeEach(() => {
        GUIAnchorController.forceFallback = fallback;
        // Room on every side of the invoker for the panel, so none flips.
        cy.viewport(800, 600);
      });

      afterEach(() => {
        GUIAnchorController.forceFallback = false;
      });

      for (const placement of PLACEMENTS) {
        it(`places the panel at ${placement}`, () => {
          cy.mount(
            html`<div style="position: fixed; top: 250px; left: 300px">
              ${filters({ placement })}
            </div>`,
          );

          popover().invoke('prop', 'open', true);
          shouldBePlaced(placement);
        });
      }

      it('keeps the natural width of a panel of running text near the end edge', () => {
        const panel = (placement: GuiPlacement) =>
          html`<button type="button" popovertarget="note">Note</button>
            <gui-popover placement=${placement}>
              <div id="note" popover>Orders ship within two working days of payment.</div>
            </gui-popover>`;
        let width = 0;
        cy.mount(
          html`<div style="position: fixed; top: 250px; left: 300px">${panel('bottom')}</div>`,
        );
        popover().invoke('prop', 'open', true);
        cy.get('#note').should(([element]) => {
          width = element.getBoundingClientRect().width;
          expect(width).to.be.greaterThan(0);
        });

        // At the end edge it flips to the other alignment, as wide as before.
        cy.mount(
          html`<div style="position: fixed; top: 250px; right: 8px">${panel('bottom-start')}</div>`,
        );
        popover().invoke('prop', 'open', true);
        cy.get('button[popovertarget="note"]').then(([anchor]) =>
          cy.get('#note').should(([element]) => {
            const rect = element.getBoundingClientRect();
            expect(rect.width, 'width').to.be.closeTo(width, 1);
            expectPlaced('bottom-end', anchor.getBoundingClientRect(), rect);
          }),
        );
      });

      it('places the panel again when its placement changes while it is open', () => {
        cy.mount(
          html`<div style="position: fixed; top: 250px; left: 300px">
            ${filters({ placement: 'bottom-start' })}
          </div>`,
        );

        popover().invoke('prop', 'open', true);
        shouldBePlaced('bottom-start');
        popover().invoke('attr', 'placement', 'top-end');
        shouldBePlaced('top-end');
      });

      it('follows its anchor when a container scrolls', () => {
        cy.mount(
          html`<div id="scroller" style="block-size: 300px; overflow: auto">
            <div style="block-size: 800px; padding-block-start: 100px">${filters()}</div>
          </div>`,
        );

        popover().invoke('prop', 'open', true);
        shouldBePlaced('bottom-start');
        cy.get('#scroller').scrollTo(0, 60);
        shouldBePlaced('bottom-start');
      });
    });
  }

  describe('anchor', () => {
    it('anchors to the element its anchor attribute names', () => {
      cy.mount(
        html`<div style="position: fixed; top: 200px; left: 240px">
          <span id="target">Orders</span>
          ${filters({ anchor: 'target' })}
        </div>`,
      );

      popover().invoke('prop', 'open', true);
      shouldBePlaced('bottom-start', '#target');
    });

    it('anchors to an invoker that uses commandfor', () => {
      cy.mount(
        html`<div style="position: fixed; top: 200px; left: 240px">
          <button type="button" commandfor="menu" command="toggle-popover">More</button>
          <gui-popover>
            <div id="menu" popover style="inline-size: 160px">Archive</div>
          </gui-popover>
        </div>`,
      );

      popover().invoke('prop', 'open', true);
      cy.get('button[commandfor="menu"]').then(([anchor]) =>
        cy
          .get('#menu')
          .should(([element]) =>
            expectPlaced(
              'bottom-start',
              anchor.getBoundingClientRect(),
              element.getBoundingClientRect(),
            ),
          ),
      );
    });

    it('lets the browser center a panel that has no anchor', () => {
      cy.mount(
        html`<gui-popover>
          <div id="lonely" popover style="inline-size: 100px; block-size: 40px">Hello</div>
        </gui-popover>`,
      );

      popover().invoke('prop', 'open', true);
      cy.get('#lonely').should(([element]) => {
        const rect = element.getBoundingClientRect();
        const view = element.ownerDocument.documentElement;
        expect(rect.width).to.be.greaterThan(0);
        expect(rect.left + rect.width / 2).to.be.closeTo(view.clientWidth / 2, 1);
      });
    });
  });

  describe('state', () => {
    it('takes the state of its panel, and reflects open while it is open', () => {
      cy.mount(filters());

      popover().should('have.prop', 'open', false).and('not.have.attr', 'open');
      cy.get('button[popovertarget="filters"]').click();
      popover().should('have.prop', 'open', true).and('have.attr', 'open');
    });

    it('opens when it connects with open set', () => {
      cy.mount(
        html`<button type="button" popovertarget="tips">Tips</button>
          <gui-popover open><div id="tips" popover>Press / to search</div></gui-popover>`,
      );

      cy.get('#tips').should('match', ':popover-open');
    });

    it('fires gui-toggle when the user opens or closes it, not when open changes', () => {
      const onToggle = cy.spy().as('toggle');
      cy.mount(html`<div @gui-toggle=${onToggle}>${filters()}</div>`);

      cy.get('button[popovertarget="filters"]').click();
      cy.get('@toggle').should('have.been.calledOnce');
      cy.get('@toggle').its('firstCall.args.0.detail').should('deep.equal', { open: true });
      cy.get('button[popovertarget="filters"]').click();
      cy.get('@toggle').its('secondCall.args.0.detail').should('deep.equal', { open: false });

      popover().invoke('prop', 'open', true);
      panel().should('match', ':popover-open');
      popover().invoke('prop', 'open', false);
      panel().should('not.match', ':popover-open');
      cy.get('@toggle').should('have.been.calledTwice');
    });

    it('adds nothing to the markup of the app', () => {
      cy.mount(filters());

      popover().should(([element]) => expect(element.getAttributeNames()).to.deep.equal([]));
      panel().should(([element]) => {
        expect(element.getAttributeNames()).to.deep.equal(['id', 'popover']);
      });
    });
  });
});
