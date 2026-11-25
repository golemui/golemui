import { html, type TemplateResult } from 'lit';
import { realPress, takesRealInput } from '../support/real-input';

const element = () => cy.get('gui-table');

/** A table of orders. `wide` makes its cells long enough to overflow a 240px container. */
const orders = ({
  caption = html`<caption>
    Open orders
  </caption>`,
  wide = false,
  rows = 2,
}: { caption?: TemplateResult | null; wide?: boolean; rows?: number } = {}) => {
  const filler = wide ? ' with a long note that does not wrap' : '';
  return html`<table>
    ${caption}
    <thead>
      <tr>
        <th scope="col">Order</th>
        <th scope="col" class="gui-table__cell--end">Total</th>
      </tr>
    </thead>
    <tbody>
      ${Array.from(
        { length: rows },
        (_, row) =>
          html`<tr>
            <td style="white-space: nowrap">A-104${row}${filler}</td>
            <td class="gui-table__cell--end">1,280.50</td>
          </tr>`,
      )}
    </tbody>
  </table>`;
};

/** A container of a given width, around the table. */
const inBox = (width: number, content: TemplateResult, dir = 'ltr') =>
  html`<div id="box" dir=${dir} style="inline-size: ${width}px">
    <gui-table>${content}</gui-table>
  </div>`;

/** Asserts, retrying, the element's attributes: a value, or null for one it must not have. */
const expectAttributes = (expected: Record<string, string | null>) =>
  element().should(([el]) => {
    for (const [attribute, value] of Object.entries(expected)) {
      expect(el.getAttribute(attribute), attribute).to.equal(value);
    }
  });

const expectNotRegion = () =>
  expectAttributes({ tabindex: null, role: null, 'aria-label': null, 'aria-labelledby': null });

describe('gui-table', () => {
  describe('a table that fits', () => {
    it('adds no tab stop, no role and no name', () => {
      cy.mount(inBox(600, orders()));

      cy.get('gui-table table').should(([table]) =>
        expect(table.getBoundingClientRect().width).to.equal(600),
      );
      expectNotRegion();
    });

    it('aligns cells by class, and centers the empty row', () => {
      cy.mount(
        inBox(
          600,
          html`<table>
            <caption>
              Open orders
            </caption>
            <tbody>
              <tr>
                <td class="gui-table__cell--end">1</td>
                <td class="gui-table__cell--center">2</td>
              </tr>
              <tr>
                <td class="gui-table__empty" colspan="2">No open orders</td>
              </tr>
            </tbody>
          </table>`,
        ),
      );

      cy.get('.gui-table__cell--end').should('have.css', 'text-align', 'end');
      cy.get('.gui-table__cell--center').should('have.css', 'text-align', 'center');
      cy.get('.gui-table__empty').should('have.css', 'text-align', 'center');
    });
  });

  describe('a table that overflows', () => {
    it('scrolls inside the element, never the page', () => {
      cy.mount(inBox(240, orders({ wide: true })));

      element().should(([el]) => {
        expect(el.scrollWidth).to.be.greaterThan(el.clientWidth);
        expect(el.getBoundingClientRect().width).to.equal(240);
      });
      cy.document().should((doc) =>
        expect(doc.documentElement.scrollWidth).to.equal(doc.documentElement.clientWidth),
      );
    });

    it('becomes a focusable region named after its caption', () => {
      cy.mount(inBox(240, orders({ wide: true })));

      expectAttributes({
        tabindex: '0',
        role: 'region',
        'aria-label': 'Open orders',
        'aria-labelledby': null,
      });
    });

    it('is labelled by a caption with an id, or by the table label', () => {
      cy.mount(
        html`${inBox(
          240,
          orders({
            wide: true,
            caption: html`<caption id="orders-caption">
              Open orders
            </caption>`,
          }),
        )}`,
      );
      expectAttributes({ 'aria-labelledby': 'orders-caption', 'aria-label': null });

      cy.mount(
        html`<div style="inline-size: 240px">
          <gui-table>
            <table aria-label="Invoices">
              <tr>
                <td style="white-space: nowrap">A very long invoice line that does not wrap</td>
              </tr>
            </table>
          </gui-table>
        </div>`,
      );
      expectAttributes({ 'aria-label': 'Invoices' });
    });

    it('stops being a region when the table fits again, and becomes one when it grows', () => {
      cy.mount(inBox(240, orders({ wide: true })));
      expectAttributes({ role: 'region' });

      cy.get('#box').invoke('attr', 'style', 'inline-size: 900px');
      expectNotRegion();

      cy.get('gui-table td').first().invoke('text', 'A-1040 '.repeat(60));
      expectAttributes({ role: 'region' });
    });

    it('keeps the role, the name and the tab stop the app wrote, and never removes them', () => {
      cy.mount(
        html`<div id="box" style="inline-size: 240px">
          <gui-table role="group" aria-label="Orders, scrollable" tabindex="-1">
            ${orders({ wide: true })}
          </gui-table>
        </div>`,
      );

      expectAttributes({
        role: 'group',
        'aria-label': 'Orders, scrollable',
        tabindex: '-1',
        'aria-labelledby': null,
      });

      cy.get('#box').invoke('attr', 'style', 'inline-size: 900px');
      expectAttributes({ role: 'group', 'aria-label': 'Orders, scrollable', tabindex: '-1' });
    });

    it('keeps its caption in view, and within the region, while the table scrolls', () => {
      cy.mount(
        inBox(
          240,
          orders({
            wide: true,
            caption: html`<caption>
              Open orders this week, by customer and by total, newest first
            </caption>`,
          }),
        ),
      );

      element().should('have.attr', 'role', 'region').invoke('scrollLeft', 120);
      element().should(([el]) => {
        const region = el.getBoundingClientRect();
        const caption = (el.querySelector('caption') as HTMLElement).getBoundingClientRect();
        expect(caption.left).to.be.closeTo(region.left, 1);
        expect(caption.right).to.be.at.most(region.right + 1);
      });
    });

    it('sets the region width only while it overflows', () => {
      cy.mount(inBox(240, orders({ wide: true })));
      element().should(([el]) =>
        expect(el.style.getPropertyValue('--gui-table-region-width')).to.equal('240px'),
      );

      cy.get('#box').invoke('attr', 'style', 'inline-size: 900px');
      element().should('not.have.attr', 'style');
    });

    it('follows a caption that changes', () => {
      cy.mount(inBox(240, orders({ wide: true })));
      expectAttributes({ 'aria-label': 'Open orders' });

      cy.get('gui-table caption').invoke('text', 'Closed orders');
      expectAttributes({ 'aria-label': 'Closed orders' });
    });

    it('scrolls with the arrow keys once focused', function () {
      if (!takesRealInput()) this.skip();
      cy.mount(inBox(240, orders({ wide: true })));

      element().focus();
      realPress('ArrowRight');
      element().should(([el]) => expect(el.scrollLeft).to.be.greaterThan(0));
    });

    it('overflows and scrolls toward the start right to left too', function () {
      cy.mount(inBox(240, orders({ wide: true }), 'rtl'));
      expectAttributes({ role: 'region' });
      if (!takesRealInput()) return;

      element().focus();
      realPress('ArrowLeft');
      // Right to left, the scroll position runs from 0 at the start into negative numbers.
      element().should(([el]) => expect(el.scrollLeft).to.be.lessThan(0));
    });
  });

  describe('naming', () => {
    it('warns in development about a table with no caption and no label', () => {
      cy.window().then((win) => cy.spy(win.console, 'warn').as('warn'));
      cy.mount(inBox(600, orders({ caption: null })));

      cy.get('@warn').should(
        'have.been.calledWithMatch',
        /<gui-table> has a table with no <caption> and no aria-label/,
      );
    });

    it('does not warn about a captioned table', () => {
      cy.window().then((win) => cy.spy(win.console, 'warn').as('warn'));
      cy.mount(inBox(600, orders()));

      element().should('exist');
      cy.get('@warn').should('not.have.been.calledWithMatch', /<gui-table>/);
    });
  });
});
