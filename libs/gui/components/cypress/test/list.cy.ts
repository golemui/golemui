import { html } from 'lit';
import type { GuiList } from '../../src/lib/components/list';
import type { GuiVisibleItem } from '../../src/lib/types';

const frameworks = [
  { label: 'React', value: 'react' },
  { label: 'Angular', value: 'angular' },
  { label: 'Vue', value: 'vue' },
];

const element = () => cy.get<GuiList>('gui-list');
const activeItem = (index: number) =>
  element().should('have.attr', 'aria-activedescendant', `colors-item-${index}`);

describe('gui-list', () => {
  describe('rendering', () => {
    it('exposes a listbox named by its label and described by its hint', () => {
      cy.mount(
        html`<gui-list label="Framework" hint="Pick one" required .items=${frameworks}></gui-list>`,
      );

      element()
        .should('have.attr', 'role', 'listbox')
        .and('have.attr', 'tabindex', '0')
        .and('have.attr', 'aria-label', 'Framework')
        .and('have.attr', 'aria-description', 'Pick one')
        .and('have.attr', 'aria-required', 'true')
        .and('not.have.attr', 'aria-activedescendant');
    });

    it('shows its errors and points the listbox at them', () => {
      cy.mount(
        html`<gui-list uid="colors" .items=${frameworks} .errors=${['Pick one']}></gui-list>`,
      );

      element()
        .should('have.attr', 'aria-invalid', 'true')
        .and('have.attr', 'aria-errormessage', 'colors_errors');
      cy.get('gui-list #colors_errors')
        .should('contain.text', 'Pick one')
        .and('have.attr', 'role', 'alert')
        .and('be.visible');

      element().invoke('prop', 'errors', []);
      element().should('not.have.attr', 'aria-invalid');
      element().should('not.have.attr', 'aria-errormessage');
      cy.get('gui-list .gui-validator__error').should('not.exist');
    });

    it('holds its errors back while touched is false', () => {
      cy.mount(
        html`<gui-list
          uid="colors"
          .items=${frameworks}
          .errors=${['Pick one']}
          .touched=${false}
        ></gui-list>`,
      );

      element().should('not.have.attr', 'aria-invalid');
      cy.get('gui-list .gui-validator__error').should('not.exist');
    });

    it('leaves the invalid state of a host that renders the errors itself', () => {
      // GolemUI Forms renders the errors next to the list and marks it invalid through its label.
      cy.mount(html`<gui-list uid="colors" .touched=${true} .items=${frameworks}></gui-list>`);
      element().invoke('attr', 'aria-invalid', 'true');
      element().invoke('attr', 'aria-errormessage', 'colors_errors');

      element().focus().type('{downArrow}');
      activeItem(0);

      element()
        .should('have.attr', 'aria-invalid', 'true')
        .and('have.attr', 'aria-errormessage', 'colors_errors');
      cy.get('gui-list .gui-list__errors').should('not.exist');
    });

    it('fires gui-update-items with plain values as items', () => {
      const onItems = cy.spy().as('items');
      cy.mount(html`<gui-list items='["React","Vue"]' @gui-update-items=${onItems}></gui-list>`);

      cy.get('@items')
        .its('lastCall.args.0.detail')
        .should('deep.equal', [
          { template: 'React', value: 'React' },
          { template: 'Vue', value: 'Vue' },
        ]);
    });

    it('maps object items with value-field and keeps their disabled flag', () => {
      const onItems = cy.spy().as('items');
      const items = [
        { name: 'React', id: 'r' },
        { name: 'Vue', id: 'v', disabled: true },
      ];
      cy.mount(
        html`<gui-list value-field="id" .items=${items} @gui-update-items=${onItems}></gui-list>`,
      );

      cy.get('@items')
        .its('lastCall.args.0.detail')
        .should('deep.equal', [
          { template: items[0], value: 'r' },
          { template: items[1], value: 'v', disabled: true },
        ]);
    });

    it('fires gui-range-change with the items to render, and again on scroll', () => {
      const onRange = cy.spy().as('range');
      const items = Array.from({ length: 100 }, (_, i) => `Item ${i}`);
      cy.mount(
        html`<gui-list
          height="200"
          item-height="40"
          .items=${items}
          @gui-range-change=${onRange}
        ></gui-list>`,
      );

      cy.get('@range')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { startIndex: 0, endIndex: 10 });

      element().shadow().find('.gui-list__scroll-viewport').scrollTo(0, 400);

      cy.get('@range')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { startIndex: 5, endIndex: 20 });
    });
  });

  describe('keyboard', () => {
    it('moves the active item with the arrow keys and fires gui-focus-change', () => {
      const onFocus = cy.spy().as('focus');
      cy.mount(
        html`<gui-list uid="colors" .items=${frameworks} @gui-focus-change=${onFocus}></gui-list>`,
      );

      element().focus().type('{downArrow}');
      activeItem(0);
      cy.get('@focus').its('lastCall.args.0.detail').should('deep.equal', { index: 0 });

      element().type('{downArrow}{downArrow}{downArrow}');
      activeItem(2);

      element().type('{upArrow}');
      activeItem(1);
      cy.get('@focus').its('lastCall.args.0.detail').should('deep.equal', { index: 1 });
    });

    it('skips disabled items, and goes to the first and last enabled with Home and End', () => {
      const items = [...frameworks, { label: 'Svelte', value: 'svelte', disabled: true }];
      items[1] = { ...items[1], disabled: true };
      cy.mount(html`<gui-list uid="colors" .items=${items}></gui-list>`);

      element().focus().type('{downArrow}');
      activeItem(0);
      element().type('{downArrow}');
      activeItem(2);

      element().type('{home}');
      activeItem(0);
      element().type('{end}');
      activeItem(2);
    });

    it('pages by the items that fit with PageDown and PageUp', () => {
      const items = Array.from({ length: 10 }, (_, i) => `Item ${i}`);
      cy.mount(
        html`<gui-list uid="colors" height="120" item-height="40" .items=${items}></gui-list>`,
      );

      element().focus().type('{downArrow}{pageDown}');
      activeItem(3);
      element().type('{pageUp}');
      activeItem(0);
    });

    it('selects the active item with Enter and Space', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-list
          uid="colors"
          .items=${frameworks}
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-list>`,
      );

      element().focus().type('{downArrow}{downArrow}{enter}');

      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value: 'angular' });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change').its('lastCall.args.0.detail').should('deep.equal', { value: 'angular' });
      element().should('have.prop', 'value', 'angular');

      element().type('{downArrow} ');

      cy.get('@change').its('lastCall.args.0.detail').should('deep.equal', { value: 'vue' });
      element().should('have.prop', 'value', 'vue');
    });

    it('starts from the selected item when it takes focus', () => {
      const onFocus = cy.spy().as('focus');
      cy.mount(
        html`<gui-list
          uid="colors"
          value="angular"
          .items=${frameworks}
          @gui-focus-change=${onFocus}
        ></gui-list>`,
      );

      element().focus();

      activeItem(1);
      cy.get('@focus').its('lastCall.args.0.detail').should('deep.equal', { index: 1 });
      element().type('{downArrow}');
      activeItem(2);
    });

    it('scrolls to the selected item when the keyboard focuses it', () => {
      const items = Array.from({ length: 20 }, (_, i) => `item-${i}`);
      cy.mount(
        html`<gui-list uid="colors" height="200" value="item-15" .items=${items}></gui-list>`,
      );

      element().focus();

      activeItem(15);
      element()
        .shadow()
        .find('.gui-list__scroll-viewport')
        .should(($viewport) => expect($viewport[0].scrollTop).to.be.greaterThan(0));
    });

    it('fires gui-focus-change with -1 and gui-blur when focus leaves', () => {
      const onFocus = cy.spy().as('focus');
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-list
          uid="colors"
          .items=${frameworks}
          @gui-focus-change=${onFocus}
          @gui-blur=${onBlur}
        ></gui-list>`,
      );

      element().focus().type('{downArrow}');
      activeItem(0);
      element().blur();

      cy.get('@focus').its('lastCall.args.0.detail').should('deep.equal', { index: -1 });
      cy.get('@blur').should('have.been.calledOnce');
      element().should('not.have.attr', 'aria-activedescendant');
    });
  });

  describe('states', () => {
    it('stays focusable and navigable, marked read-only, when read-only', () => {
      const onFocus = cy.spy().as('focus');
      cy.mount(
        html`<gui-list
          uid="colors"
          readonly
          .items=${frameworks}
          @gui-focus-change=${onFocus}
        ></gui-list>`,
      );

      element()
        .should('have.attr', 'aria-readonly', 'true')
        .and('have.attr', 'tabindex', '0')
        .and('not.have.attr', 'aria-disabled');
      element().focus().type('{downArrow}{downArrow}');

      activeItem(1);
      cy.get('@focus').its('lastCall.args.0.detail').should('deep.equal', { index: 1 });
    });

    it('selects nothing with Enter or Space when read-only, firing no value events', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-list
          uid="colors"
          value="react"
          readonly
          .items=${frameworks}
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-list>`,
      );

      element().focus().type('{downArrow}{enter} ');

      activeItem(1);
      element().should('have.prop', 'value', 'react');
      cy.get('@input').should('not.have.been.called');
      cy.get('@change').should('not.have.been.called');
    });

    it('leaves the tab order when disabled', () => {
      cy.mount(html`<gui-list disabled .items=${frameworks}></gui-list>`);

      element().should('have.attr', 'tabindex', '-1').and('have.attr', 'aria-disabled', 'true');
    });
  });

  describe('visible items', () => {
    it('reports the items to render, with their ids and state', () => {
      const onVisible = cy.spy().as('visible');
      const items = [
        { label: 'React', value: 'react' },
        { label: 'Angular', value: 'angular', disabled: true },
        { label: 'Vue', value: 'vue' },
      ];
      cy.mount(
        html`<gui-list
          uid="fw"
          value="vue"
          .items=${items}
          @gui-visible-items-change=${onVisible}
        ></gui-list>`,
      );

      cy.get('@visible')
        .its('lastCall.args.0.detail')
        .should('deep.equal', [
          {
            template: items[0],
            value: 'react',
            index: 0,
            id: 'fw-item-0',
            selected: false,
            focused: false,
            disabled: false,
          },
          {
            template: items[1],
            value: 'angular',
            index: 1,
            id: 'fw-item-1',
            selected: false,
            focused: false,
            disabled: true,
          },
          {
            template: items[2],
            value: 'vue',
            index: 2,
            id: 'fw-item-2',
            selected: true,
            focused: false,
            disabled: false,
          },
        ]);
      element().its('0.visibleItems').should('have.length', 3);
    });

    it('reports them again on scroll, selection and the active item, and only then', () => {
      const onVisible = cy.spy().as('visible');
      const items = Array.from({ length: 100 }, (_, i) => `Item ${i}`);
      cy.mount(
        html`<gui-list
          uid="long"
          height="200"
          .items=${items}
          @gui-visible-items-change=${onVisible}
        ></gui-list>`,
      );

      cy.get('@visible').its('lastCall.args.0.detail.length').should('equal', 10);
      cy.get('@visible').then((spy) => spy.resetHistory());

      element().shadow().find('.gui-list__scroll-viewport').scrollTo(0, 400);
      cy.get('@visible').its('lastCall.args.0.detail.0.index').should('equal', 5);

      cy.get('@visible').then((spy) => spy.resetHistory());
      element().focus().type('{downArrow}');
      cy.get('@visible')
        .its('lastCall.args.0.detail')
        .should((visible: { focused: boolean; value: string }[]) => {
          expect(visible.find((item) => item.focused)?.value).to.equal('Item 0');
        });

      cy.get('@visible').then((spy) => spy.resetHistory());
      element().invoke('prop', 'disabled', false);
      cy.get('@visible').should('not.have.been.called');
    });

    it('marks every item disabled while the list is', () => {
      cy.mount(html`<gui-list disabled .items=${frameworks}></gui-list>`);
      element()
        .its('0.visibleItems')
        .should((visible: { disabled: boolean }[]) => {
          expect(visible.every((item) => item.disabled)).to.equal(true);
        });
    });
  });

  describe('clicks', () => {
    // Renders the options from visibleItems, as an app does.
    const renderOptions = (event: Event) => {
      const list = event.currentTarget as GuiList;
      const visible = (event as CustomEvent<GuiVisibleItem[]>).detail;
      list.querySelectorAll('[role="option"]').forEach((option) => option.remove());
      for (const item of visible) {
        const option = document.createElement('div');
        option.id = item.id;
        option.setAttribute('role', 'option');
        option.textContent = String(item.value);
        list.append(option);
      }
    };

    it('picks the clicked option and makes it the active one', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-list
          uid="colors"
          .items=${frameworks}
          @gui-visible-items-change=${renderOptions}
          @gui-change=${onChange}
        ></gui-list>`,
      );

      cy.get('#colors-item-2').click();

      element().should('have.prop', 'value', 'vue');
      activeItem(2);
      cy.get('@change')
        .should('have.been.calledOnce')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { value: 'vue' });
    });

    it('picks the clicked option on the first click while the selected one is out of view', () => {
      const items = Array.from({ length: 20 }, (_, i) => `item-${i}`);
      cy.mount(
        html`<gui-list
          uid="colors"
          height="200"
          value="item-15"
          .items=${items}
          @gui-visible-items-change=${(event: Event) => {
            renderOptions(event);
            (event.currentTarget as GuiList)
              .querySelectorAll<HTMLElement>('[role="option"]')
              .forEach((option) => (option.style.height = '40px'));
          }}
        ></gui-list>`,
      );

      cy.get('#colors-item-1').click();

      element().should('have.prop', 'value', 'item-1');
      activeItem(1);
    });

    it('ignores clicks on disabled items, and while read-only or disabled', () => {
      const onChange = cy.spy().as('change');
      const items = [
        { label: 'React', value: 'react' },
        { label: 'Angular', value: 'angular', disabled: true },
      ];
      cy.mount(
        html`<gui-list
          uid="colors"
          .items=${items}
          @gui-visible-items-change=${renderOptions}
          @gui-change=${onChange}
        ></gui-list>`,
      );

      cy.get('#colors-item-1').click();
      element().invoke('prop', 'readOnly', true);
      cy.get('#colors-item-0').click();
      element().invoke('prop', 'readOnly', false).invoke('prop', 'disabled', true);
      cy.get('#colors-item-0').click({ force: true });

      element().should(($list) => expect($list[0].value).to.equal(undefined));
      cy.get('@change').should('not.have.been.called');
    });
  });
});
