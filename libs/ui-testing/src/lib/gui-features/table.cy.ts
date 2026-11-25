import { defineForm, identityTranslator } from '@golemui/core';
import { dictionaryTranslator, type MountComponentFn, testDomId, withTestFormName } from '../utils';

// Behavior tests for the table widget: a native table in gui-table, its cells formatted in the
// form's language.

const columns = [
  { key: 'id', label: 'Order' },
  { key: 'date', label: 'Date', type: 'date' as const },
  { key: 'total', label: 'Total', type: 'number' as const },
  { key: 'paid', label: 'Paid', align: 'center' as const },
];
const rows = [
  { id: 'A-1042', date: '2026-11-20', total: 1280.5, paid: true, note: 'not a column' },
  { id: 'A-1043', date: 'soon', total: null, paid: false },
];

export const runTableComponentTests = (baseMountFn: MountComponentFn) => {
  const mountFn = withTestFormName(baseMountFn);
  const table = (uid: string) => cy.get(`gui-table[id="${testDomId(uid)}"]`);
  /** Asserts, retrying, an element's text without the whitespace a template puts around it. */
  const text = <T extends HTMLElement>(subject: Cypress.Chainable<JQuery<T>>, expected: string) =>
    subject.should(($el) => expect($el.text().trim()).to.equal(expected));
  /** Asserts, retrying, the text of each cell, row by row. */
  const cells = (uid: string, expected: string[][]) =>
    table(uid)
      .find('tbody tr')
      .should(($rows) =>
        expect(
          $rows
            .toArray()
            .map((row) =>
              Array.from(row.querySelectorAll('td')).map((cell) => cell.textContent?.trim()),
            ),
        ).to.deep.equal(expected),
      );

  describe('Table Component', () => {
    it('renders a captioned native table with column headers and its rows', () => {
      mountFn({
        localization: identityTranslator('en-US'),
        formDef: defineForm({
          form: [
            {
              uid: 'orders',
              kind: 'display',
              type: 'table',
              props: { caption: 'Open orders', columns, rows },
            },
          ],
        }),
      });

      text(table('orders').find('table > caption'), 'Open orders');
      table('orders')
        .find('thead th')
        .should(($headers) => {
          expect($headers.toArray().map((th) => th.textContent?.trim())).to.deep.equal([
            'Order',
            'Date',
            'Total',
            'Paid',
          ]);
          expect($headers.toArray().every((th) => th.getAttribute('scope') === 'col')).to.equal(
            true,
          );
        });
      // Keys no column names are ignored, an empty cell is empty, and a date that doesn't parse
      // is shown as it came.
      cells('orders', [
        ['A-1042', 'Nov 20, 2026', '1,280.5', 'true'],
        ['A-1043', 'soon', '', 'false'],
      ]);
      table('orders').parent().should('have.class', 'gui-table').and('have.class', 'gui-field');
    });

    it('aligns number columns at the end, and each column as it says', () => {
      mountFn({
        formDef: defineForm({
          form: [
            {
              uid: 'orders',
              kind: 'display',
              type: 'table',
              props: { caption: 'Open orders', columns, rows },
            },
          ],
        }),
      });

      table('orders')
        .find('tbody tr')
        .first()
        .find('td')
        .should(($cells) =>
          expect($cells.toArray().map((td) => td.className)).to.deep.equal([
            '',
            '',
            'gui-table__cell--end',
            'gui-table__cell--center',
          ]),
        );
      table('orders').find('thead th').eq(2).should('have.class', 'gui-table__cell--end');
    });

    it('shows its empty message in one row across the columns when it has no rows', () => {
      mountFn({
        formDef: defineForm({
          form: [
            {
              uid: 'orders',
              kind: 'display',
              type: 'table',
              props: { caption: 'Open orders', columns, rows: [], emptyMessage: 'No open orders' },
            },
          ],
        }),
      });

      table('orders')
        .find('tbody td')
        .should('have.length', 1)
        .and('have.class', 'gui-table__empty')
        .and('have.attr', 'colspan', '4');
      text(table('orders').find('tbody td'), 'No open orders');
    });

    it('takes the rows of the active state', () => {
      mountFn({
        formDef: defineForm({
          states: { closed: "$form.view === 'closed'" },
          form: [
            { uid: 'view', kind: 'input', type: 'textinput', path: 'view' },
            {
              uid: 'orders',
              kind: 'display',
              type: 'table',
              props: {
                caption: 'Orders',
                columns: [{ key: 'id', label: 'Order' }],
                rows: [{ id: 'A-1042' }],
                'rows.closed': [{ id: 'Z-0001' }, { id: 'Z-0002' }],
              },
            },
          ],
        }),
      });

      cells('orders', [['A-1042']]);
      cy.get('[data-cy="view_textinput"]').type('closed');
      cells('orders', [['Z-0001'], ['Z-0002']]);
    });

    it('translates its caption, labels and empty message, and formats cells in the language', () => {
      const translator = dictionaryTranslator('en-US', {
        'en-US': { 'orders.caption': 'Open orders', 'orders.total': 'Total' },
        'de-DE': { 'orders.caption': 'Offene Bestellungen', 'orders.total': 'Summe' },
      });

      mountFn({
        localization: translator,
        formDef: defineForm({
          form: [
            {
              uid: 'orders',
              kind: 'display',
              type: 'table',
              props: {
                caption: { key: 'orders.caption' },
                columns: [{ key: 'total', label: { key: 'orders.total' }, type: 'number' }],
                rows: [{ total: 1280.5 }],
              },
            },
          ],
        }),
      });

      text(table('orders').find('caption'), 'Open orders');
      cells('orders', [['1,280.5']]);
      cy.then(() => translator.setLang('de-DE'));
      text(table('orders').find('caption'), 'Offene Bestellungen');
      text(table('orders').find('thead th'), 'Summe');
      cells('orders', [['1.280,5']]);
    });
  });
};
