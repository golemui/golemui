import { html, nothing } from 'lit';
import { checkA11y } from '../support/a11y';
import { overlaySuite } from '../support/overlay';
import { realPress, takesRealInput } from '../support/real-input';

/** A vertical menu, three levels deep, with the current page in an open group. */
const vertical = ({ name = 'Main' as string | null, settingsOpen = true } = {}) =>
  html`<gui-menu>
    <nav aria-label=${name ?? nothing}>
      <ul>
        <li><button type="button" value="home">Home</button></li>
        <li><a href="#orders">Orders</a></li>
        <li>
          <button
            type="button"
            value="settings"
            aria-expanded=${String(settingsOpen)}
            aria-controls="m-settings"
          >
            Settings
          </button>
          <ul id="m-settings" ?hidden=${!settingsOpen}>
            <li><button type="button" aria-current="page">Profile</button></li>
            <li>
              <button type="button" aria-expanded="false" aria-controls="m-billing">Billing</button>
              <ul id="m-billing" hidden>
                <li><button type="button" value="invoices">Invoices</button></li>
                <li>
                  <button type="button" aria-expanded="false" aria-controls="m-payment">
                    Payment
                  </button>
                  <ul id="m-payment" hidden>
                    <li><button type="button" value="cards">Cards</button></li>
                  </ul>
                </li>
              </ul>
            </li>
            <li><button type="button" value="archived" disabled>Archived</button></li>
          </ul>
        </li>
      </ul>
    </nav>
  </gui-menu>`;

/** A horizontal menu: two dropdowns, the first with a group inside, and a plain item. */
const horizontal = () =>
  html`<gui-menu orientation="horizontal">
    <nav aria-label="Main">
      <ul>
        <li><button type="button" value="home" aria-current="page">Home</button></li>
        <li>
          <button type="button" id="reports-button" value="reports" popovertarget="m-reports">
            Reports
          </button>
          <gui-popover id="reports-popover">
            <ul id="m-reports" popover>
              <li><button type="button" value="sales">Sales</button></li>
              <li><button type="button" value="stock">Stock</button></li>
              <li>
                <button type="button" aria-expanded="false" aria-controls="m-yearly">Yearly</button>
                <ul id="m-yearly" hidden>
                  <li><button type="button" value="2026">2026</button></li>
                </ul>
              </li>
            </ul>
          </gui-popover>
        </li>
        <li>
          <button type="button" id="help-button" popovertarget="m-help">Help</button>
          <gui-popover>
            <ul id="m-help" popover>
              <li><button type="button" value="docs">Docs</button></li>
              <li><button type="button" value="contact">Contact</button></li>
              <li><button type="button" value="status">Status</button></li>
            </ul>
          </gui-popover>
        </li>
        <li><button type="button" value="team">Team</button></li>
      </ul>
    </nav>
  </gui-menu>`;

const group = (text: string) => cy.contains('gui-menu button', text);
const expectGroup = (id: string, open: boolean) => {
  cy.get(`#${id}`).should(open ? 'not.have.attr' : 'have.attr', 'hidden');
  cy.get(`[aria-controls="${id}"]`).should('have.attr', 'aria-expanded', String(open));
};
const isOpen = (id: string, expected: boolean) =>
  cy.get(`#${id}`).should(([list]) => expect(list.matches(':popover-open')).to.equal(expected));
/** A spacing token in pixels, as it resolves here: narrow viewports shrink the scale. */
const space = (token: string) => {
  const probe = document.createElement('div');
  probe.style.paddingInlineStart = `var(${token})`;
  document.body.append(probe);
  const value = getComputedStyle(probe).paddingInlineStart;
  probe.remove();
  return value;
};

/** The `::after` of a group's button: its caret. */
const caret = (text: string) => group(text).then(([button]) => getComputedStyle(button, '::after'));

overlaySuite({
  name: 'gui-menu (horizontal dropdown)',
  template: horizontal,
  invoker: '#reports-button',
  floating: '#m-reports',
  host: '#reports-popover',
  openState: ':popover-open',
  focusable: '#m-reports button[value="sales"]',
  outsideClick: 'closes',
  anchored: 'start',
});

describe('gui-menu', () => {
  describe('vertical', () => {
    it('writes no attribute on itself or on the menu', () => {
      cy.mount(vertical());

      cy.get('gui-menu').should(([menu]) => {
        expect(menu.getAttributeNames()).to.deep.equal([]);
        for (const item of Array.from(menu.querySelectorAll('button, a'))) {
          expect(item.hasAttribute('role'), 'role').to.equal(false);
          expect(item.hasAttribute('tabindex'), 'tabindex').to.equal(false);
        }
      });
    });

    it('opens and closes a group in place, three levels deep, and reports it', () => {
      const onToggle = cy.spy().as('toggle');
      cy.mount(html`<div @gui-toggle=${onToggle}>${vertical()}</div>`);

      group('Billing').click();
      expectGroup('m-billing', true);
      cy.get('@toggle').its('lastCall.args.0.detail').should('deep.equal', {
        open: true,
        value: 'Billing',
      });
      group('Payment').click();
      expectGroup('m-payment', true);
      cy.contains('button', 'Cards').should('be.visible');

      group('Settings').click();
      expectGroup('m-settings', false);
      cy.get('@toggle').its('lastCall.args.0.detail').should('deep.equal', {
        open: false,
        value: 'settings',
      });
      cy.contains('button', 'Cards').should('not.be.visible');
    });

    it('indents each level, and turns the caret of an open group', () => {
      cy.mount(vertical());
      group('Billing').click();

      cy.get('#m-settings').should(([list]) =>
        expect(getComputedStyle(list).paddingInlineStart).to.equal(space('--gui-space-4')),
      );
      caret('Settings').its('rotate').should('equal', '180deg');
      caret('Billing').its('rotate').should('equal', '180deg');
      caret('Payment').its('rotate').should('be.oneOf', ['none', '0deg']);
      group('Home').then(([button]) =>
        expect(getComputedStyle(button, '::after').content).to.be.oneOf(['none', 'normal']),
      );
    });

    it('marks the current page, and the group that holds it', () => {
      cy.mount(vertical());

      cy.get('[aria-current="page"]').should('have.css', 'font-weight', '600');
      group('Settings').should(([settings]) => {
        const home = document.querySelector('button[value="home"]') as HTMLElement;
        expect(getComputedStyle(settings).color).not.to.equal(getComputedStyle(home).color);
      });
    });

    it('puts the caret and the indent at the start right to left', () => {
      cy.mount(html`<div dir="rtl" style="inline-size: 300px">${vertical()}</div>`);

      group('Settings').should(([button]) => {
        const box = button.getBoundingClientRect();
        const label = document.createRange();
        label.selectNodeContents(button);
        // The caret takes the left end, and the text the right one.
        expect(label.getBoundingClientRect().right).to.be.closeTo(
          box.right - parseFloat(space('--gui-space-3')),
          2,
        );
      });
      cy.get('#m-settings').should(([list]) =>
        expect(getComputedStyle(list).paddingRight).to.equal(space('--gui-space-4')),
      );
    });

    it('has no accessibility violations, with its groups closed or open', () => {
      cy.mount(vertical({ settingsOpen: false }));
      checkA11y('gui-menu');
      group('Settings').click();
      group('Billing').click();
      checkA11y('gui-menu');
    });
  });

  describe('activating an item', () => {
    it('fires gui-action with the value of a button, or its text', () => {
      const onAction = cy.spy().as('action');
      cy.mount(html`<div @gui-action=${onAction}>${vertical()}</div>`);

      group('Home').click();
      cy.get('@action').its('lastCall.args.0.detail.value').should('equal', 'home');
      cy.contains('button', 'Profile').click();
      cy.get('@action').its('lastCall.args.0.detail.value').should('equal', 'Profile');
      cy.get('@action').should('have.been.calledTwice');
    });

    it('fires gui-action for a link, and leaves its navigation alone', () => {
      const onAction = cy.spy().as('action');
      cy.mount(html`<div @gui-action=${onAction}>${vertical()}</div>`);

      cy.contains('a', 'Orders').click();
      cy.get('@action').its('lastCall.args.0.detail.value').should('equal', 'Orders');
      cy.location('hash').should('equal', '#orders');
    });

    it('fires no gui-action for a group or a disabled item', () => {
      const onAction = cy.spy().as('action');
      cy.mount(html`<div @gui-action=${onAction}>${vertical()}</div>`);

      group('Billing').click();
      cy.contains('button', 'Archived').click({ force: true });
      cy.get('@action').should('not.have.been.called');
    });
  });

  describe('keyboard', () => {
    it('keeps every item in the Tab order, a closed group hiding its items', () => {
      cy.mount(vertical({ settingsOpen: false }));

      cy.get('gui-menu').should(([menu]) => {
        const tabbable = Array.from(menu.querySelectorAll<HTMLElement>('button, a')).filter(
          (item) => item.checkVisibility() && item.tabIndex === 0,
        );
        expect(tabbable.map((item) => item.textContent?.trim())).to.deep.equal([
          'Home',
          'Orders',
          'Settings',
        ]);
      });
    });

    if (takesRealInput()) {
      it('opens a group with Enter and closes it with Space', () => {
        cy.mount(vertical({ settingsOpen: false }));

        group('Settings').focus();
        realPress('Enter');
        expectGroup('m-settings', true);
        realPress('Space');
        expectGroup('m-settings', false);
      });

      it('closes the group around the focus with Escape, one level at a time', () => {
        cy.mount(vertical());
        group('Billing').click();

        cy.contains('button', 'Invoices').focus();
        realPress('Escape');
        expectGroup('m-billing', false);
        cy.focused().should('have.attr', 'aria-controls', 'm-billing');

        // Again: the next group out closes.
        realPress('Escape');
        expectGroup('m-settings', false);
        cy.focused().should('have.attr', 'aria-controls', 'm-settings');
      });

      it('closes an open group with Escape on its own button', () => {
        cy.mount(vertical());

        group('Settings').focus();
        realPress('Escape');
        expectGroup('m-settings', false);
      });
    }
  });

  describe('horizontal', () => {
    it('lays the first level out in a row', () => {
      cy.mount(horizontal());

      cy.get('gui-menu > nav > ul > li').should(($items) => {
        const tops = new Set(Array.from($items, (item) => item.getBoundingClientRect().top));
        expect(tops.size, 'rows').to.equal(1);
      });
      caret('Reports').its('rotate').should('be.oneOf', ['none', '0deg']);
    });

    it('scrolls a row that does not fit, with shadows, never the page', () => {
      cy.mount(html`<div style="inline-size: 160px">${horizontal()}</div>`);

      cy.get('gui-menu > nav > ul').should(([row]) => {
        expect(row.scrollWidth).to.be.greaterThan(row.clientWidth);
        expect(row.getBoundingClientRect().width).to.equal(160);
        expect(getComputedStyle(row).backgroundImage).to.contain('linear-gradient');
      });
      cy.document().should((doc) =>
        expect(doc.documentElement.scrollWidth).to.equal(doc.documentElement.clientWidth),
      );
    });

    it('shrinks and scrolls as a flex or grid item, instead of widening its row or track', () => {
      cy.mount(
        html`<header id="flex" style="display: flex; gap: 8px; inline-size: 240px">
            <strong>Acme</strong>${horizontal()}
          </header>
          <div id="grid" style="display: grid; inline-size: 200px">${horizontal()}</div>`,
      );

      for (const container of ['#flex', '#grid']) {
        cy.get(container).should(([box]) => {
          const row = box.querySelector('gui-menu > nav > ul') as HTMLElement;
          expect(row.scrollWidth, 'the row overflows').to.be.greaterThan(row.clientWidth);
          expect(box.scrollWidth, 'the container does not').to.equal(box.clientWidth);
        });
      }
    });

    it("opens a dropdown, and reports it as the menu's own toggle", () => {
      const onToggle = cy.spy().as('toggle');
      cy.mount(html`<div @gui-toggle=${onToggle}>${horizontal()}</div>`);

      group('Reports').click();
      isOpen('m-reports', true);
      caret('Reports').its('rotate').should('equal', '180deg');
      cy.get('@toggle').should('have.been.calledOnce');
      cy.get('@toggle').its('lastCall.args.0.target.localName').should('equal', 'gui-menu');
      cy.get('@toggle').its('lastCall.args.0.detail').should('deep.equal', {
        open: true,
        value: 'reports',
      });
    });

    it('closes one dropdown when another opens', () => {
      cy.mount(horizontal());

      group('Reports').click();
      isOpen('m-reports', true);
      group('Help').click();
      isOpen('m-help', true);
      isOpen('m-reports', false);
    });

    it('closes the dropdown when an item in it is picked, and returns focus to its button', () => {
      const onAction = cy.spy().as('action');
      cy.mount(html`<div @gui-action=${onAction}>${horizontal()}</div>`);

      group('Reports').click();
      cy.contains('button', 'Stock').focus().click();
      cy.get('@action').its('lastCall.args.0.detail.value').should('equal', 'stock');
      isOpen('m-reports', false);
      cy.focused().should('have.id', 'reports-button');
    });

    it('opens a group inside a dropdown in place', () => {
      cy.mount(horizontal());

      group('Reports').click();
      group('Yearly').click();
      expectGroup('m-yearly', true);
      isOpen('m-reports', true);
      cy.contains('button', '2026').should('be.visible');
    });

    if (takesRealInput()) {
      it('closes a group inside a dropdown with Escape, and leaves the dropdown open', () => {
        cy.mount(horizontal());

        group('Reports').click();
        group('Yearly').click();
        cy.contains('button', '2026').focus();
        realPress('Escape');
        expectGroup('m-yearly', false);
        isOpen('m-reports', true);
        cy.focused().should('have.attr', 'aria-controls', 'm-yearly');

        realPress('Escape');
        isOpen('m-reports', false);
        cy.focused().should('have.id', 'reports-button');
      });
    }

    it('has no accessibility violations, with a dropdown open', () => {
      cy.mount(horizontal());
      group('Reports').click();
      isOpen('m-reports', true);
      cy.get('#m-reports').should(([list]) => expect(list.getAnimations()).to.have.length(0));
      checkA11y('gui-menu');
    });
  });

  describe('development warnings', () => {
    beforeEach(() => cy.window().then((win) => cy.spy(win.console, 'warn').as('warn')));

    it('warns about a <nav> with no name', () => {
      cy.mount(vertical({ name: null }));
      cy.get('@warn').should(
        'have.been.calledWithMatch',
        /<gui-menu> has a <nav> with no aria-label/,
      );
    });

    it('warns about a group button that controls no list', () => {
      cy.mount(
        html`<gui-menu>
          <nav aria-label="Main">
            <ul>
              <li>
                <button type="button" aria-expanded="false" aria-controls="nowhere">Lost</button>
              </li>
            </ul>
          </nav>
        </gui-menu>`,
      );
      cy.get('@warn').should('have.been.calledWithMatch', /aria-controls names no list/);
    });

    it('warns about a current item that starts in a closed group', () => {
      cy.mount(vertical({ settingsOpen: false }));
      cy.get('@warn').should('have.been.calledWithMatch', /current item in a closed group/);
    });

    it('does not warn when the user closes the group that holds the current item', () => {
      cy.mount(vertical());
      group('Settings').click();
      expectGroup('m-settings', false);
      cy.get('@warn').should('not.have.been.calledWithMatch', /<gui-menu>/);
    });

    it('does not warn about a menu rendered after it connects', () => {
      cy.mount(html`<gui-menu></gui-menu>`);
      cy.get('gui-menu').then(([menu]) => {
        menu.innerHTML =
          '<nav aria-label="Main"><ul><li><button type="button" aria-current="page">Home</button></li><li><button type="button" aria-expanded="true" aria-controls="m-x">More</button><ul id="m-x"><li><a href="#a">A</a></li></ul></li></ul></nav>';
      });

      cy.get('gui-menu #m-x').should('exist');
      cy.get('@warn').should('not.have.been.calledWithMatch', /<gui-menu>/);
    });
  });
});
