import { html, nothing, type TemplateResult } from 'lit';
import { realPress, takesRealInput } from '../support/real-input';

/** A sidebar layout as an app writes it: the side region once, a popover the toggle opens. */
const layout = ({
  side,
  size,
  toggle = true,
  sideName = 'Main',
  popover = true,
  target = 'nav',
}: {
  side?: string;
  size?: string;
  toggle?: boolean;
  sideName?: string | null;
  popover?: boolean;
  target?: string;
} = {}) =>
  html`<gui-sidebar side=${side ?? nothing} side-size=${size ?? nothing}>
    ${toggle
      ? html`<button
          type="button"
          class="gui-sidebar__toggle"
          popovertarget=${target}
          aria-label="Open menu"
        ></button>`
      : nothing}
    <aside class="gui-sidebar__side" id="nav" ?popover=${popover} aria-label=${sideName ?? nothing}>
      <a href="#orders" id="orders">Orders</a>
      <button type="button" id="group" aria-expanded="false">Settings</button>
      <input id="filter" aria-label="Filter" />
      <gui-button id="export" label="Export"></gui-button>
    </aside>
    <div class="gui-sidebar__main">
      <p>Orders this week</p>
      <button type="button" id="save">Save</button>
    </div>
  </gui-sidebar>`;

/** A box of a given width around the layout, so it switches by its own width, not the page's. */
const inBox = (width: number, content: TemplateResult, dir = 'ltr') =>
  html`<div id="box" dir=${dir} style="inline-size: ${width}px">${content}</div>`;

const sidebar = () => cy.get('gui-sidebar');
const side = () => cy.get('.gui-sidebar__side');
const main = () => cy.get('.gui-sidebar__main');
const toggle = () => cy.get('.gui-sidebar__toggle');
const resize = (width: number) =>
  cy.get('#box').then(([box]) => box.style.setProperty('inline-size', `${width}px`));
const box = (element: Element) => element.getBoundingClientRect();
const isOpen = (open: boolean) =>
  side().should(([aside]) => expect(aside.matches(':popover-open'), 'drawer open').to.equal(open));
const openDrawer = () => side().then(([aside]) => aside.showPopover());
/** Waits two frames: the element has had its first resize report, which fires no event. */
const laidOut = () =>
  cy
    .window()
    .then(
      (win) =>
        new Promise<void>((resolve) =>
          win.requestAnimationFrame(() => win.requestAnimationFrame(() => resolve())),
        ),
    );

describe('gui-sidebar', () => {
  beforeEach(() => cy.viewport(1200, 800));

  describe('wide', () => {
    it('puts the side region in a column before the main one, and hides the toggle', () => {
      cy.mount(inBox(900, layout()));

      toggle().should('not.be.visible');
      side().should(([aside]) => {
        const mainBox = box(document.querySelector('.gui-sidebar__main') as Element);
        expect(aside.matches(':popover-open'), 'an open popover').to.equal(false);
        expect(box(aside).width).to.equal(256);
        expect(box(aside).right).to.be.at.most(mainBox.left);
        expect(box(aside).top).to.equal(mainBox.top);
      });
      side().should('have.css', 'position', 'sticky');
      sidebar().should('not.have.attr', 'collapsed');
    });

    it('sizes the column with side-size', () => {
      cy.mount(inBox(900, layout({ size: 'sm' })));
      side().should(([aside]) => expect(box(aside).width).to.equal(192));

      cy.mount(inBox(900, layout({ size: 'lg' })));
      side().should(([aside]) => expect(box(aside).width).to.equal(320));
    });

    it('puts the column at the end with side="end", and mirrors right to left', () => {
      const sideAfterMain = () =>
        side().should(([aside]) =>
          expect(box(aside).left).to.be.at.least(
            box(document.querySelector('.gui-sidebar__main') as Element).right,
          ),
        );
      cy.mount(inBox(900, layout({ side: 'end' })));
      sideAfterMain();

      cy.mount(inBox(900, layout(), 'rtl'));
      sideAfterMain();
    });

    it('writes no attribute on itself or on the regions', () => {
      cy.mount(inBox(900, layout()));

      main().should('exist');
      laidOut();
      sidebar().should(([element]) => {
        expect(element.getAttributeNames()).to.deep.equal([]);
        for (const child of Array.from(element.children)) {
          expect(child.hasAttribute('tabindex'), 'tabindex').to.equal(false);
          expect(child.hasAttribute('role'), 'role').to.equal(false);
        }
      });
    });
  });

  describe('narrow', () => {
    it('hides the side region, and shows the toggle above the main one, full width', () => {
      cy.mount(inBox(500, layout()));

      side().should('not.be.visible');
      toggle().should('be.visible');
      main().should(([region]) => {
        expect(box(region).width).to.equal(500);
        expect(box(region).top).to.be.greaterThan(
          box(document.querySelector('.gui-sidebar__toggle') as Element).bottom,
        );
      });
      sidebar().should('have.attr', 'collapsed');
    });

    it('opens the side region from the toggle as a drawer along the edge, focused', () => {
      const onToggle = cy.spy().as('toggle');
      cy.mount(html`<div @gui-toggle=${onToggle}>${inBox(500, layout())}</div>`);

      toggle().click();
      isOpen(true);
      side().should(([aside]) => {
        expect(box(aside).left).to.equal(0);
        expect(box(aside).height).to.equal(window.innerHeight);
      });
      cy.focused().should('have.id', 'orders');
      cy.document().its('documentElement').should('have.css', 'overflow', 'hidden');
      cy.get('@toggle').its('lastCall.args.0.detail').should('deep.equal', { open: true });
    });

    it('opens from the end edge with side="end", and from the right right to left', () => {
      cy.mount(inBox(500, layout({ side: 'end' })));
      openDrawer();
      side().should(([aside]) => expect(box(aside).right).to.equal(window.innerWidth));

      cy.mount(inBox(500, layout(), 'rtl'));
      openDrawer();
      side().should(([aside]) => expect(box(aside).right).to.equal(window.innerWidth));
    });

    it('leaves a strip of backdrop beside the drawer on a small screen', () => {
      cy.viewport(320, 640);
      cy.mount(inBox(300, layout()));
      openDrawer();

      side().should(([aside]) => expect(box(aside).width).to.equal(320 - 48));
    });

    it('closes when something in it is picked: an action, a link or a gui-button', () => {
      cy.mount(inBox(500, layout()));

      openDrawer();
      cy.get('#group').then(([button]) =>
        button.dispatchEvent(new CustomEvent('gui-action', { bubbles: true })),
      );
      isOpen(false);

      openDrawer();
      cy.get('#orders').click();
      isOpen(false);

      openDrawer();
      cy.get('#export button').click();
      isOpen(false);
    });

    it('stays open for a control that picks nothing, such as a group', () => {
      cy.mount(inBox(500, layout()));
      openDrawer();

      cy.get('#group').click();
      cy.get('#filter').click();
      isOpen(true);
    });

    if (takesRealInput()) {
      it('closes on Escape and returns focus to the toggle', () => {
        cy.mount(inBox(500, layout()));
        toggle().click();
        isOpen(true);

        realPress('Escape');
        isOpen(false);
        cy.focused().should('have.class', 'gui-sidebar__toggle');
        cy.document().its('documentElement').should('not.have.css', 'overflow', 'hidden');
      });

      it('closes when Tab leaves it', () => {
        cy.mount(inBox(500, layout()));
        toggle().click();
        cy.get('#export button').focus();

        realPress('Tab');
        isOpen(false);
        cy.focused().should('have.id', 'save');
      });
    }
  });

  describe('switching', () => {
    it('reflects collapsed and fires gui-collapse each way, and not on connect', () => {
      const onCollapse = cy.spy().as('collapse');
      cy.mount(html`<div @gui-collapse=${onCollapse}>${inBox(900, layout())}</div>`);
      sidebar().should('not.have.attr', 'collapsed');
      laidOut();
      cy.get('@collapse').should('not.have.been.called');

      resize(500);
      sidebar().should('have.attr', 'collapsed');
      cy.get('@collapse').its('lastCall.args.0.detail').should('deep.equal', { collapsed: true });

      resize(900);
      sidebar().should('not.have.attr', 'collapsed');
      cy.get('@collapse').its('lastCall.args.0.detail').should('deep.equal', { collapsed: false });
      cy.get('@collapse').should('have.been.calledTwice');
    });

    it('keeps the side region as it was across the switch: one copy', () => {
      cy.mount(inBox(900, layout()));
      cy.get('#filter').type('late');
      cy.get('#group').invoke('attr', 'aria-expanded', 'true');

      resize(500);
      openDrawer();
      cy.get('#filter').should('have.value', 'late');
      cy.get('#group').should('have.attr', 'aria-expanded', 'true');
      cy.get('gui-sidebar [id]').should(($elements) => {
        const ids = Array.from($elements, (element) => element.id);
        expect(new Set(ids).size, 'no id twice').to.equal(ids.length);
      });
    });

    it('closes the drawer when it grows, and keeps focus on the same control', () => {
      cy.mount(inBox(500, layout()));
      openDrawer();
      cy.get('#filter').focus();

      resize(900);
      isOpen(false);
      side().should('be.visible');
      cy.focused().should('have.id', 'filter');
    });

    it('moves focus from the column to the toggle when the column hides', () => {
      cy.mount(inBox(900, layout()));
      cy.get('#filter').focus();

      resize(500);
      cy.focused().should('have.class', 'gui-sidebar__toggle');
    });

    it('leaves focus in the main region alone', () => {
      cy.mount(inBox(900, layout()));
      cy.get('#save').focus();

      resize(500);
      sidebar().should('have.attr', 'collapsed');
      cy.focused().should('have.id', 'save');
    });
  });

  describe('development warnings', () => {
    beforeEach(() => cy.window().then((win) => cy.spy(win.console, 'warn').as('warn')));

    it('warns about a side region with no name', () => {
      cy.mount(inBox(900, layout({ sideName: null })));
      cy.get('@warn').should(
        'have.been.calledWithMatch',
        /<gui-sidebar> has a .gui-sidebar__side with no aria-label/,
      );
    });

    it('warns about a side region that is not a popover', () => {
      cy.mount(inBox(900, layout({ popover: false })));
      cy.get('@warn').should('have.been.calledWithMatch', /with no popover attribute/);
    });

    it('warns about a missing toggle', () => {
      cy.mount(inBox(900, layout({ toggle: false })));
      cy.get('@warn').should(
        'have.been.calledWithMatch',
        /<gui-sidebar> has no .gui-sidebar__toggle/,
      );
    });

    it('warns about a toggle that opens something else', () => {
      cy.mount(inBox(900, layout({ target: 'nowhere' })));
      cy.get('@warn').should('have.been.calledWithMatch', /popovertarget is not the id/);
    });

    it('does not warn about a complete layout', () => {
      cy.mount(inBox(900, layout()));
      side().should('exist');
      cy.get('@warn').should('not.have.been.calledWithMatch', /<gui-sidebar>/);
    });
  });
});
