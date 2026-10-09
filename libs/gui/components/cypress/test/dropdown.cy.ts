import { html } from 'lit';
import type { GuiDropdown } from '../../src/lib/components/dropdown';
import type { GuiItemRenderer } from '../../src/lib/utils/item-content';

const frameworks = ['React', 'Angular', 'Vue'];
const cities = [
  { code: 'MAD', name: 'Madrid', country: 'Spain' },
  { code: 'LIS', name: 'Lisbon', country: 'Portugal' },
  { code: 'POR', name: 'Porto', country: 'Portugal' },
];

const element = () => cy.get<GuiDropdown>('gui-dropdown');
const input = () => cy.get('gui-dropdown input[role="combobox"]');
const list = () => cy.get('gui-dropdown gui-list');
const panel = () => cy.get('gui-dropdown .gui-widget > .gui-picker__panel');
const toggle = () => cy.get('gui-dropdown button.gui-dropdown__arrow');
const options = () => cy.get('gui-dropdown [role="option"]');

describe('gui-dropdown', () => {
  describe('rendering', () => {
    it('exposes a combobox controlling a named listbox', () => {
      cy.mount(html`<gui-dropdown uid="fw" label="Framework" .items=${frameworks}></gui-dropdown>`);

      input()
        .should('have.attr', 'role', 'combobox')
        .and('have.attr', 'aria-autocomplete', 'list')
        .and('have.attr', 'aria-expanded', 'false')
        .and('have.attr', 'aria-controls', 'fw-list');
      cy.get('gui-dropdown label').should('have.attr', 'for', 'fw');
      cy.get('[id="fw-list"]')
        .should('have.length', 1)
        .and('have.attr', 'role', 'listbox')
        .and('have.attr', 'aria-label', 'Framework');
      cy.get('[id="fw"]').should('have.length', 1);
      panel().should('have.attr', 'hidden');
    });

    it("shows the selected item's text", () => {
      cy.mount(
        html`<gui-dropdown
          label="City"
          label-field="name"
          value-field="code"
          value="LIS"
          .items=${cities}
        ></gui-dropdown>`,
      );

      input().should('have.value', 'Lisbon');
      element().invoke('prop', 'value', 'POR');
      input().should('have.value', 'Porto');
    });

    it('shows a value that matches no item as it is', () => {
      cy.mount(
        html`<gui-dropdown label="Framework" value="Svelte" .items=${frameworks}></gui-dropdown>`,
      );
      input().should('have.value', 'Svelte');
    });

    it('renders the icon and pads the input clear of it', () => {
      cy.mount(
        html`<gui-dropdown label="Framework" icon="search" .items=${frameworks}></gui-dropdown>`,
      );

      cy.get('gui-dropdown .gui-widget-icon')
        .should('have.attr', 'data-icon', 'search')
        .and('have.attr', 'aria-hidden', 'true');
      input().should('have.class', 'gui-dropdown--icon').and('have.css', 'padding-left', '40px');
    });
  });

  describe('opening and closing', () => {
    beforeEach(() => {
      cy.mount(html`<gui-dropdown uid="fw" label="Framework" .items=${frameworks}></gui-dropdown>`);
    });

    it('opens on focus and lists the items', () => {
      input().focus();
      panel().should('be.visible');
      input().should('have.attr', 'aria-expanded', 'true');
      options().should('have.length', 3);
      options().eq(0).should('have.attr', 'id', 'fw-item-0').and('contain.text', 'React');
    });

    it('opens and closes from the toggle button, keeping focus in the field', () => {
      toggle()
        .should('have.attr', 'aria-label', 'Show options')
        .and('have.attr', 'aria-haspopup', 'listbox')
        .and('have.attr', 'aria-controls', 'fw-list');

      toggle().click();
      panel().should('be.visible');
      toggle().should('have.attr', 'aria-expanded', 'true');
      cy.focused().should('have.attr', 'id', 'fw');

      toggle().click();
      panel().should('not.be.visible');
      toggle().should('have.attr', 'aria-expanded', 'false');
      cy.focused().should('have.attr', 'id', 'fw');
    });

    it('stays open while focus moves inside it, and closes when focus leaves', () => {
      const onBlur = cy.spy().as('blur');
      element().then(($el) => $el[0].addEventListener('gui-blur', onBlur));

      input().focus();
      toggle().focus();
      panel().should('be.visible');
      cy.get('@blur').should('not.have.been.called');

      toggle().blur();
      panel().should('not.be.visible');
      cy.get('@blur').should('have.been.calledOnce');
    });

    it('closes on Escape and keeps it from the page while open', () => {
      const onEscape = cy.spy().as('escape');
      cy.document().then((doc) =>
        doc.addEventListener('keydown', (event) => event.key === 'Escape' && onEscape()),
      );

      input().focus();
      input().type('{esc}');
      panel().should('not.be.visible');
      cy.get('@escape').should('not.have.been.called');

      input().type('{esc}');
      cy.get('@escape').should('have.been.calledOnce');
    });

    it('closes on Escape from inside the list and returns focus to the field', () => {
      input().focus().type('{downArrow}');
      cy.focused().should('have.attr', 'id', 'fw-list');
      cy.focused().type('{esc}');
      panel().should('not.be.visible');
      cy.focused().should('have.attr', 'id', 'fw');
    });

    it('keeps the list as the only tab stop of the panel', () => {
      input().focus();
      list().should('have.attr', 'tabindex', '0');
      options().should('have.attr', 'tabindex', '-1');
    });
  });

  describe('picking', () => {
    it('picks a clicked item, closes and returns focus to the field', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-dropdown
          uid="city"
          label="City"
          label-field="name"
          value-field="code"
          .items=${cities}
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-dropdown>`,
      );

      input().focus();
      options().contains('Porto').click();

      element().should('have.prop', 'value', 'POR');
      input().should('have.value', 'Porto');
      panel().should('not.be.visible');
      cy.focused().should('have.attr', 'id', 'city');
      cy.get('@input').should('have.been.calledOnce');
      cy.get('@change')
        .should('have.been.calledOnce')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { value: 'POR' });
    });

    it('picks with the keyboard', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-dropdown
          uid="fw"
          label="Framework"
          .items=${frameworks}
          @gui-change=${onChange}
        ></gui-dropdown>`,
      );

      input().focus().type('{downArrow}');
      cy.focused().type('{downArrow}{downArrow}');
      list().should('have.attr', 'aria-activedescendant', 'fw-item-1');
      cy.get('#fw-item-1').should('have.attr', 'role', 'option');
      cy.focused().type('{enter}');

      element().should('have.prop', 'value', 'Angular');
      input().should('have.value', 'Angular');
      panel().should('not.be.visible');
      cy.focused().should('have.attr', 'id', 'fw');
      cy.get('@change').should(
        'have.been.calledOnceWith',
        Cypress.sinon.match.has('detail', { value: 'Angular' }),
      );
    });

    it('marks the selected item', () => {
      cy.mount(
        html`<gui-dropdown label="Framework" value="Vue" .items=${frameworks}></gui-dropdown>`,
      );

      input().focus();
      options().eq(2).should('have.attr', 'aria-selected', 'true');
      options().eq(2).find('.gui-list__item').should('have.class', 'gui-list__item-selected');
      options().eq(0).should('have.attr', 'aria-selected', 'false');
    });

    it("doesn't pick a disabled item", () => {
      const items = [
        { label: 'React', value: 'react' },
        { label: 'Angular', value: 'angular', disabled: true },
      ];
      cy.mount(html`<gui-dropdown label="Framework" .items=${items}></gui-dropdown>`);

      input().focus();
      options().eq(1).should('have.attr', 'aria-disabled', 'true');
      options().eq(1).click({ force: true });
      element().should(($el) => expect($el[0].value).to.equal(undefined));
    });

    it('clears the value with Enter in an emptied field', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-dropdown
          label="Framework"
          value="Vue"
          .items=${frameworks}
          @gui-change=${onChange}
        ></gui-dropdown>`,
      );

      input().focus().clear().type('{enter}');
      element().should(($el) => expect($el[0].value).to.equal(undefined));
      cy.get('@change').should(
        'have.been.calledOnceWith',
        Cypress.sinon.match.has('detail', { value: null }),
      );
    });

    it('lets a read-only dropdown be browsed but not changed', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-dropdown
          label="Framework"
          value="Vue"
          readonly
          .items=${frameworks}
          @gui-change=${onChange}
        ></gui-dropdown>`,
      );

      input().should('have.attr', 'readonly');
      input().focus();
      options().eq(0).click();
      input().invoke('val', '').trigger('keydown', { key: 'Enter' });
      element().should('have.prop', 'value', 'Vue');
      cy.get('@change').should('not.have.been.called');
    });

    it("doesn't open while disabled", () => {
      cy.mount(html`<gui-dropdown label="Framework" disabled .items=${frameworks}></gui-dropdown>`);
      input().should('be.disabled');
      toggle().should('be.disabled');
      panel().should('have.attr', 'hidden');
    });
  });

  describe('searching', () => {
    const mountSearch = (items: unknown[]) => {
      const onFilter = cy.spy().as('filter');
      cy.mount(
        html`<gui-dropdown
          uid="s"
          label="Search"
          input-debounce="0"
          .items=${items}
          @gui-filter=${onFilter}
        ></gui-dropdown>`,
      );
    };

    it('filters values as the user types, ignoring case', () => {
      mountSearch(frameworks);

      input().type('r');
      options().should('have.length', 2);
      input().type('E');
      options().should('have.length', 1).and('contain.text', 'React');
      cy.get('@filter').should(
        'have.been.calledWith',
        Cypress.sinon.match.has('detail', { query: 'rE' }),
      );
    });

    it('shows every item again when the search is cleared', () => {
      mountSearch(frameworks);

      input().type('Re');
      options().should('have.length', 1);
      input().clear();
      options().should('have.length', 3);
    });

    it('picks a filtered item', () => {
      mountSearch(frameworks);

      input().type('Vu');
      options().first().click();
      element().should('have.prop', 'value', 'Vue');
      input().should('have.value', 'Vue');
    });

    it('searches objects in their label and value fields', () => {
      cy.mount(
        html`<gui-dropdown
          label="City"
          input-debounce="0"
          label-field="name"
          value-field="code"
          .items=${cities}
        ></gui-dropdown>`,
      );

      input().type('port');
      options().should('have.length', 1).and('contain.text', 'Porto');
      input().clear().type('mad');
      options().should('have.length', 1).and('contain.text', 'Madrid');
    });

    it('searches objects in their search fields', () => {
      cy.mount(
        html`<gui-dropdown
          label="City"
          input-debounce="0"
          label-field="name"
          value-field="code"
          .searchFields=${['country']}
          .items=${cities}
        ></gui-dropdown>`,
      );

      input().type('port');
      options().should('have.length', 2);
    });

    it('leaves the search to the app with remote-filter', () => {
      const onFilter = cy.spy().as('filter');
      cy.mount(
        html`<gui-dropdown
          label="Framework"
          input-debounce="0"
          remote-filter
          .items=${frameworks}
          @gui-filter=${onFilter}
        ></gui-dropdown>`,
      );

      input().type('Vu');
      cy.get('@filter').should(
        'have.been.calledWith',
        Cypress.sinon.match.has('detail', { query: 'Vu' }),
      );
      options().should('have.length', 3);

      // The app loads the matching items.
      element().invoke('prop', 'items', ['Vue']);
      options().should('have.length', 1);
    });

    it('waits for the debounce before searching', () => {
      cy.clock();
      const onFilter = cy.spy().as('filter');
      cy.mount(
        html`<gui-dropdown
          label="Framework"
          input-debounce="300"
          .items=${frameworks}
          @gui-filter=${onFilter}
        ></gui-dropdown>`,
      );

      input().type('Re');
      cy.tick(299);
      cy.get('@filter').should('not.have.been.called');
      options().should('have.length', 3);
      cy.tick(1);
      cy.get('@filter').should('have.been.calledOnce');
      options().should('have.length', 1);
    });

    it('goes back to the selected text and clears the search when it closes', () => {
      mountSearch(frameworks);
      element().invoke('prop', 'value', 'Vue');

      input().clear().type('Re');
      options().should('have.length', 1);
      input().type('{esc}');

      input().should('have.value', 'Vue');
      cy.get('@filter').should(
        'have.been.calledWith',
        Cypress.sinon.match.has('detail', { query: '' }),
      );
      input().blur().focus();
      options().should('have.length', 3);
    });
  });

  describe('renderItem', () => {
    it('renders each option from a template', () => {
      const renderItem: GuiItemRenderer<(typeof cities)[number]> = (item, { html, selected }) =>
        html`<b class="code">${item.template.code}</b> ${item.template.name}${selected ? ' ✓' : ''}`;
      cy.mount(
        html`<gui-dropdown
          label="City"
          label-field="name"
          value-field="code"
          value="LIS"
          .items=${cities}
          .renderItem=${renderItem}
        ></gui-dropdown>`,
      );

      input().focus();
      options().eq(0).find('.gui-list__item-content b.code').should('have.text', 'MAD');
      options().eq(1).should('contain.text', 'Lisbon ✓');
    });

    it('shows the values of a template as text', () => {
      const items = [{ label: '<img src=x onerror="window.hacked=true">', value: 'x' }];
      const renderItem: GuiItemRenderer = (item, { html }) => html`<i>${item.template.label}</i>`;
      cy.mount(
        html`<gui-dropdown label="Text" .items=${items} .renderItem=${renderItem}></gui-dropdown>`,
      );

      input().focus();
      options().eq(0).find('i').should('have.text', items[0].label);
      options().eq(0).find('img').should('not.exist');
      cy.window().should((win) =>
        expect((win as Window & { hacked?: boolean }).hacked).to.equal(undefined),
      );
    });

    it('shows a returned string as text, never as markup', () => {
      const renderItem: GuiItemRenderer = (item) => `<b>${item.template}</b>`;
      cy.mount(
        html`<gui-dropdown
          label="Framework"
          .items=${frameworks}
          .renderItem=${renderItem}
        ></gui-dropdown>`,
      );

      input().focus();
      options().eq(0).should('contain.text', '<b>React</b>');
      options().eq(0).find('b').should('not.exist');
    });

    it('lets the renderer fill the option itself and clean up when the option goes', () => {
      const cleaned: string[] = [];
      const renderItem: GuiItemRenderer = (item, { root, onCleanup }) => {
        root.textContent = `Own ${item.template}`;
        onCleanup(() => cleaned.push(String(item.value)));
      };
      cy.mount(
        html`<gui-dropdown
          label="Framework"
          input-debounce="0"
          .items=${frameworks}
          .renderItem=${renderItem}
        ></gui-dropdown>`,
      );

      input().focus();
      options().eq(1).find('.gui-list__item-content').should('have.text', 'Own Angular');
      input().type('Vu');
      options().should('have.length', 1);
      cy.wrap(cleaned).should('deep.equal', ['React', 'Angular']);
      input().blur();
      cy.wrap(cleaned).should('deep.equal', ['React', 'Angular', 'Vue']);
    });
  });

  describe('long lists', () => {
    it('renders only the items in view and a few more', () => {
      const items = Array.from({ length: 1000 }, (_, i) => `Item ${i}`);
      cy.mount(
        html`<gui-dropdown uid="long" label="Item" height="200" .items=${items}></gui-dropdown>`,
      );

      input().focus();
      options().should('have.length.lessThan', 20);
      list()
        .shadow()
        .find('.gui-list__scroll-viewport')
        .scrollTo(0, 400 * 40);
      cy.get('#long-item-400').should('exist').and('contain.text', 'Item 400');
      options().should('have.length.lessThan', 25);
    });
  });

  describe('errors', () => {
    it('shows its errors under the field and repeats them in the open panel', () => {
      cy.mount(
        html`<gui-dropdown
          uid="fw"
          label="Framework"
          .items=${frameworks}
          .errors=${['Pick a framework']}
        ></gui-dropdown>`,
      );

      cy.get('#fw_errors')
        .should('contain.text', 'Pick a framework')
        .and('have.attr', 'role', 'alert');
      input()
        .should('have.attr', 'aria-invalid', 'true')
        .and('have.attr', 'aria-errormessage', 'fw_errors');

      input().focus();
      cy.get('#fw_panel_errors')
        .should('be.visible')
        .and('contain.text', 'Pick a framework')
        .and('have.attr', 'aria-hidden', 'true');
      cy.get('[id="fw_errors"]').should('have.length', 1);
      // The panel owns the invalid look; the list inside it keeps its own.
      list().should('not.have.attr', 'aria-invalid');
    });

    it('keeps the panel open when its error text is clicked', () => {
      cy.mount(
        html`<gui-dropdown
          uid="fw"
          label="Framework"
          .items=${frameworks}
          .errors=${['Pick a framework']}
        ></gui-dropdown>`,
      );

      input().focus();
      cy.get('#fw_panel_errors').click();
      panel().should('be.visible');
    });
  });
});
