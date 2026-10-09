import { html } from 'lit';
import type { GuiMultiDropdown } from '../../src/lib/components/multi-dropdown';
import type { GuiItemRenderer } from '../../src/lib/utils/item-content';

const languages = ['English', 'Spanish', 'French', 'German'];
const cities = [
  { code: 'MAD', name: 'Madrid' },
  { code: 'LIS', name: 'Lisbon' },
  { code: 'POR', name: 'Porto' },
];

const element = () => cy.get<GuiMultiDropdown>('gui-multi-dropdown');
const input = () => cy.get('gui-multi-dropdown input[role="combobox"]');
const list = () => cy.get('gui-multi-dropdown gui-multi-list');
const panel = () => cy.get('gui-multi-dropdown .gui-widget > .gui-picker__panel');
const options = () => cy.get('gui-multi-dropdown [role="option"]');
const pills = () => cy.get('gui-multi-dropdown .gui-pills__pill');

describe('gui-multi-dropdown', () => {
  // Narrower than 540px, the pills collapse into a count.
  beforeEach(() => cy.viewport(800, 600));

  describe('rendering', () => {
    it('exposes a combobox controlling a multi-select listbox', () => {
      cy.mount(
        html`<gui-multi-dropdown
          uid="langs"
          label="Languages"
          .items=${languages}
        ></gui-multi-dropdown>`,
      );

      input()
        .should('have.attr', 'role', 'combobox')
        .and('have.attr', 'aria-controls', 'langs-list')
        .and('have.attr', 'aria-expanded', 'false');
      list()
        .should('have.attr', 'role', 'listbox')
        .and('have.attr', 'aria-multiselectable', 'true');
      cy.get('gui-multi-dropdown').should('have.class', 'gui-multi-dropdown');
    });

    it('shows the selected values as pills, labelled from the items', () => {
      cy.mount(
        html`<gui-multi-dropdown
          label="Cities"
          label-field="name"
          value-field="code"
          .values=${['POR', 'MAD']}
          .items=${cities}
        ></gui-multi-dropdown>`,
      );

      pills().should('have.length', 2);
      pills().eq(0).should('contain.text', 'Porto');
      pills().eq(1).should('contain.text', 'Madrid');
    });

    it('draws a check box in each option, shown while selected', () => {
      cy.mount(
        html`<gui-multi-dropdown
          label="Languages"
          .values=${['Spanish']}
          .items=${languages}
        ></gui-multi-dropdown>`,
      );

      input().focus();
      options().eq(1).find('.gui-list__item-check svg').should('be.visible');
      options().eq(0).find('.gui-list__item-check svg').should('not.be.visible');
      options().eq(1).should('have.attr', 'aria-selected', 'true');
    });
  });

  describe('picking', () => {
    it('adds a clicked item and keeps the panel open', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-multi-dropdown
          label="Languages"
          .items=${languages}
          @gui-change=${onChange}
        ></gui-multi-dropdown>`,
      );

      input().focus();
      options().eq(0).click();
      options().eq(2).click();

      element().should('have.prop', 'values').and('deep.equal', ['English', 'French']);
      panel().should('be.visible');
      pills().should('have.length', 2);
      cy.get('@change')
        .should('have.been.calledTwice')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { value: ['English', 'French'] });
    });

    it('takes out an item clicked again', () => {
      cy.mount(
        html`<gui-multi-dropdown
          label="Languages"
          .values=${['English', 'French']}
          .items=${languages}
        ></gui-multi-dropdown>`,
      );

      input().focus();
      options().eq(0).click();
      element().should('have.prop', 'values').and('deep.equal', ['French']);
    });

    it('toggles the active item with the keyboard', () => {
      cy.mount(
        html`<gui-multi-dropdown
          uid="langs"
          label="Languages"
          .items=${languages}
        ></gui-multi-dropdown>`,
      );

      input().focus().type('{downArrow}');
      cy.focused().should('have.attr', 'id', 'langs-list');
      cy.focused().type('{downArrow}{downArrow}{enter}');
      element().should('have.prop', 'values').and('deep.equal', ['Spanish']);
      panel().should('be.visible');
      cy.focused().type('{enter}');
      element().should('have.prop', 'values').and('deep.equal', []);
    });

    it('removes a value from its pill', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-multi-dropdown
          label="Languages"
          .values=${['English', 'French']}
          .items=${languages}
          @gui-change=${onChange}
        ></gui-multi-dropdown>`,
      );

      cy.get('gui-multi-dropdown .gui-pills__pill-remove').eq(0).click();
      element().should('have.prop', 'values').and('deep.equal', ['French']);
      cy.get('@change').should('have.been.calledOnce');
    });

    it("doesn't change while read-only", () => {
      cy.mount(
        html`<gui-multi-dropdown
          label="Languages"
          readonly
          .values=${['English']}
          .items=${languages}
        ></gui-multi-dropdown>`,
      );

      input().focus();
      options().eq(1).click();
      element().should('have.prop', 'values').and('deep.equal', ['English']);
    });
  });

  describe('searching', () => {
    it('filters, and keeps the search after a pick', () => {
      const onFilter = cy.spy().as('filter');
      cy.mount(
        html`<gui-multi-dropdown
          label="Languages"
          input-debounce="0"
          .items=${languages}
          @gui-filter=${onFilter}
        ></gui-multi-dropdown>`,
      );

      input().type('an');
      options().should('have.length', 2);
      cy.get('@filter').should(
        'have.been.calledWith',
        Cypress.sinon.match.has('detail', { query: 'an' }),
      );
      options().contains('German').click();
      input().should('have.value', 'an');
      options().should('have.length', 2);
    });

    it('keeps the labels of selections the search hides', () => {
      cy.mount(
        html`<gui-multi-dropdown
          label="Cities"
          input-debounce="0"
          label-field="name"
          value-field="code"
          .values=${['MAD']}
          .items=${cities}
        ></gui-multi-dropdown>`,
      );

      input().type('por');
      options().should('have.length', 1);
      pills().eq(0).should('contain.text', 'Madrid');
    });
  });

  describe('renderItem', () => {
    it('renders the content next to the check box', () => {
      const renderItem: GuiItemRenderer<(typeof cities)[number]> = (item, { html }) =>
        html`<b>${item.template.code}</b> ${item.template.name}`;
      cy.mount(
        html`<gui-multi-dropdown
          label="Cities"
          label-field="name"
          value-field="code"
          .items=${cities}
          .renderItem=${renderItem}
        ></gui-multi-dropdown>`,
      );

      input().focus();
      options().eq(0).find('.gui-list__item-check').should('exist');
      options().eq(0).find('.gui-list__item-content b').should('have.text', 'MAD');
    });
  });

  describe('errors', () => {
    it('marks the field invalid and repeats the errors in the panel', () => {
      cy.mount(
        html`<gui-multi-dropdown
          uid="langs"
          label="Languages"
          .items=${languages}
          .errors=${['Pick at least one']}
        ></gui-multi-dropdown>`,
      );

      cy.get('#langs_errors').should('contain.text', 'Pick at least one');
      cy.get('gui-multi-dropdown .gui-multi-select__field').should(
        'have.attr',
        'aria-invalid',
        'true',
      );
      input().focus();
      cy.get('#langs_panel_errors').should('be.visible');
    });
  });
});
