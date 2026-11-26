import { html, nothing, type TemplateResult } from 'lit';

/** The side region's controls, once per copy: the same controls, in the same order. */
const controls = (copy: string, { hideBilling = false } = {}) =>
  html`<nav>
    <a href="#orders" id="${copy}-orders">Orders</a>
    <div ?hidden=${hideBilling}><a href="#billing" id="${copy}-billing">Billing</a></div>
    <button type="button" id="${copy}-more">More</button>
  </nav>`;

/** A sidebar layout and its drawer, as an app writes them. */
const layout = ({
  side,
  size,
  toggle = true,
  sideName = 'Main',
  drawerId = 'nav-drawer',
  hideBillingInColumn = false,
}: {
  side?: string;
  size?: string;
  toggle?: boolean;
  sideName?: string | null;
  drawerId?: string;
  hideBillingInColumn?: boolean;
} = {}) =>
  html`<gui-sidebar side=${side ?? nothing} side-size=${size ?? nothing}>
      ${toggle
        ? html`<button
            type="button"
            class="gui-sidebar__toggle"
            commandfor=${drawerId}
            command="show-modal"
            aria-label="Open menu"
          ></button>`
        : nothing}
      <aside class="gui-sidebar__side" aria-label=${sideName ?? nothing}>
        ${controls('column', { hideBilling: hideBillingInColumn })}
      </aside>
      <div class="gui-sidebar__main">
        <p>Orders this week</p>
        <button type="button" id="save">Save</button>
      </div>
    </gui-sidebar>
    <gui-dialog placement="start">
      <dialog id="nav-drawer" aria-label="Main">${controls('drawer')}</dialog>
    </gui-dialog>`;

/** A box of a given width around the layout, so it switches by its own width, not the page's. */
const inBox = (width: number, content: TemplateResult, dir = 'ltr') =>
  html`<div id="box" dir=${dir} style="inline-size: ${width}px">${content}</div>`;

const sidebar = () => cy.get('gui-sidebar');
const side = () => cy.get('.gui-sidebar__side');
const main = () => cy.get('.gui-sidebar__main');
const toggle = () => cy.get('.gui-sidebar__toggle');
const drawer = () => cy.get<HTMLDialogElement>('#nav-drawer');
const resize = (width: number) =>
  cy.get('#box').then(([box]) => box.style.setProperty('inline-size', `${width}px`));
const box = (element: Element) => element.getBoundingClientRect();
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
      cy.mount(inBox(900, layout({ side: 'end' })));
      side().should(([aside]) =>
        expect(box(aside).left).to.be.at.least(
          box(document.querySelector('.gui-sidebar__main') as Element).right,
        ),
      );

      cy.mount(inBox(900, layout(), 'rtl'));
      side().should(([aside]) =>
        expect(box(aside).left).to.be.at.least(
          box(document.querySelector('.gui-sidebar__main') as Element).right,
        ),
      );
    });

    it('writes no attribute on itself or on the regions', () => {
      cy.mount(inBox(900, layout()));

      main().should('exist');
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

    it('opens the drawer from the toggle', function () {
      if (!('command' in HTMLButtonElement.prototype)) this.skip();
      cy.mount(inBox(500, layout()));

      toggle().click();
      drawer().should('match', ':modal');
    });
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

    it('closes the drawer when it grows, and focuses the same control in the column', () => {
      cy.mount(inBox(500, layout()));
      drawer().then(([dialog]) => dialog.showModal());
      cy.get('#drawer-billing').focus();

      resize(900);
      drawer().should('not.have.attr', 'open');
      cy.focused().should('have.id', 'column-billing');
    });

    it('focuses the nearest control before it when the column hides the same one', () => {
      cy.mount(inBox(500, layout({ hideBillingInColumn: true })));
      drawer().then(([dialog]) => dialog.showModal());
      cy.get('#drawer-billing').focus();

      resize(900);
      drawer().should('not.have.attr', 'open');
      cy.focused().should('have.id', 'column-orders');
    });

    it('moves focus from the column to the toggle when the column hides', () => {
      cy.mount(inBox(900, layout()));
      cy.get('#column-more').focus();

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

    it('warns about a missing toggle', () => {
      cy.mount(inBox(900, layout({ toggle: false })));
      cy.get('@warn').should(
        'have.been.calledWithMatch',
        /<gui-sidebar> has no .gui-sidebar__toggle/,
      );
    });

    it('warns about a toggle that opens no dialog', () => {
      cy.mount(inBox(900, layout({ drawerId: 'nowhere' })));
      cy.get('@warn').should('have.been.calledWithMatch', /commandfor names no <dialog>/);
    });

    it('does not warn about a complete layout', () => {
      cy.mount(inBox(900, layout()));
      side().should('exist');
      cy.get('@warn').should('not.have.been.calledWithMatch', /<gui-sidebar>/);
    });
  });
});
