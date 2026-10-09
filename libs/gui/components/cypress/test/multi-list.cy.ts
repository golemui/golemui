import { html } from 'lit';
import type { GuiMultiList } from '../../src/lib/components/multi-list';
import type { GuiVisibleItem } from '../../src/lib/types';

const frameworks = [
  { label: 'React', value: 'react' },
  { label: 'Angular', value: 'angular' },
  { label: 'Vue', value: 'vue' },
];

const element = () => cy.get<GuiMultiList>('gui-multi-list');
const activeItem = (index: number) =>
  element().should('have.attr', 'aria-activedescendant', `colors-item-${index}`);

describe('gui-multi-list', () => {
  describe('rendering', () => {
    it('exposes a multi-selectable listbox named by its label', () => {
      cy.mount(
        html`<gui-multi-list
          label="Frameworks"
          hint="Pick any"
          .items=${frameworks}
        ></gui-multi-list>`,
      );

      element()
        .should('have.attr', 'role', 'listbox')
        .and('have.attr', 'aria-multiselectable', 'true')
        .and('have.attr', 'tabindex', '0')
        .and('have.attr', 'aria-label', 'Frameworks')
        .and('have.attr', 'aria-description', 'Pick any');
    });

    it('shows its errors and points the listbox at them', () => {
      cy.mount(
        html`<gui-multi-list
          uid="colors"
          .items=${frameworks}
          .errors=${['Pick two']}
        ></gui-multi-list>`,
      );

      element()
        .should('have.attr', 'aria-invalid', 'true')
        .and('have.attr', 'aria-errormessage', 'colors_errors');
      cy.get('gui-multi-list #colors_errors').should('contain.text', 'Pick two');
    });

    it('fires gui-update-items and gui-range-change for its host', () => {
      const onItems = cy.spy().as('items');
      const onRange = cy.spy().as('range');
      cy.mount(
        html`<gui-multi-list
          items='["React","Vue"]'
          height="200"
          item-height="40"
          @gui-update-items=${onItems}
          @gui-range-change=${onRange}
        ></gui-multi-list>`,
      );

      cy.get('@items')
        .its('lastCall.args.0.detail')
        .should('deep.equal', [
          { template: 'React', value: 'React' },
          { template: 'Vue', value: 'Vue' },
        ]);
      cy.get('@range')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { startIndex: 0, endIndex: 2 });
    });
  });

  describe('value', () => {
    it('toggles the active item on with Enter, firing gui-item-toggle then gui-input and gui-change', () => {
      const onToggle = cy.spy().as('toggle');
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-multi-list
          uid="colors"
          .items=${frameworks}
          @gui-item-toggle=${onToggle}
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-multi-list>`,
      );

      element().focus().type('{downArrow}{downArrow}{enter}');

      cy.get('@toggle').its('lastCall.args.0.detail').should('deep.equal', { value: 'angular' });
      cy.get('@input')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { value: ['angular'] });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { value: ['angular'] });
      cy.then(() => {
        expect(onToggle).to.have.been.calledBefore(onInput);
        expect(onInput).to.have.been.calledBefore(onChange);
      });
      element().should('have.prop', 'values').and('deep.equal', ['angular']);
    });

    it('toggles a clicked option once, on and off', () => {
      const onToggle = cy.spy().as('toggle');
      const renderOptions = (event: Event) => {
        const list = event.currentTarget as GuiMultiList;
        list.querySelectorAll('[role="option"]').forEach((option) => option.remove());
        for (const item of (event as CustomEvent<GuiVisibleItem[]>).detail) {
          const option = document.createElement('div');
          option.id = item.id;
          option.setAttribute('role', 'option');
          option.setAttribute('aria-selected', String(item.selected));
          option.textContent = String(item.value);
          list.append(option);
        }
      };
      cy.mount(
        html`<gui-multi-list
          uid="colors"
          .items=${frameworks}
          @gui-visible-items-change=${renderOptions}
          @gui-item-toggle=${onToggle}
        ></gui-multi-list>`,
      );

      cy.get('#colors-item-1').click();
      element().should('have.prop', 'values').and('deep.equal', ['angular']);
      cy.get('#colors-item-1').should('have.attr', 'aria-selected', 'true');
      cy.get('#colors-item-1').click();
      element().should('have.prop', 'values').and('deep.equal', []);
      cy.get('@toggle').should('have.been.calledTwice');
    });

    it('toggles the active item off again with Space', () => {
      const onToggle = cy.spy().as('toggle');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-multi-list
          uid="colors"
          .values=${['react', 'vue']}
          .items=${frameworks}
          @gui-item-toggle=${onToggle}
          @gui-change=${onChange}
        ></gui-multi-list>`,
      );

      element().focus();
      activeItem(0);
      element().type(' ');

      cy.get('@toggle').its('lastCall.args.0.detail').should('deep.equal', { value: 'react' });
      cy.get('@change')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { value: ['vue'] });
      element().should('have.prop', 'values').and('deep.equal', ['vue']);
    });

    it('adds to values set from its attribute', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-multi-list
          uid="colors"
          values='["vue"]'
          .items=${frameworks}
          @gui-change=${onChange}
        ></gui-multi-list>`,
      );

      element().focus();
      activeItem(2);
      element().type('{home}{enter}');

      cy.get('@change')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { value: ['vue', 'react'] });
    });
  });

  describe('keyboard', () => {
    it('moves the active item with the arrow keys and fires gui-focus-change', () => {
      const onFocus = cy.spy().as('focus');
      cy.mount(
        html`<gui-multi-list
          uid="colors"
          .items=${frameworks}
          @gui-focus-change=${onFocus}
        ></gui-multi-list>`,
      );

      element().focus().type('{downArrow}{downArrow}');
      activeItem(1);
      cy.get('@focus').its('lastCall.args.0.detail').should('deep.equal', { index: 1 });

      element().type('{end}');
      activeItem(2);
    });

    it('fires gui-focus-change with -1 and gui-blur when focus leaves', () => {
      const onFocus = cy.spy().as('focus');
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-multi-list
          uid="colors"
          .items=${frameworks}
          @gui-focus-change=${onFocus}
          @gui-blur=${onBlur}
        ></gui-multi-list>`,
      );

      element().focus().type('{downArrow}');
      activeItem(0);
      element().blur();

      cy.get('@focus').its('lastCall.args.0.detail').should('deep.equal', { index: -1 });
      cy.get('@blur').should('have.been.calledOnce');
    });
  });

  describe('states', () => {
    it('stays navigable but toggles nothing when read-only, firing no value events', () => {
      const onToggle = cy.spy().as('toggle');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-multi-list
          uid="colors"
          readonly
          .values=${['vue']}
          .items=${frameworks}
          @gui-item-toggle=${onToggle}
          @gui-change=${onChange}
        ></gui-multi-list>`,
      );

      element()
        .should('have.attr', 'aria-readonly', 'true')
        .and('have.attr', 'tabindex', '0')
        .and('not.have.attr', 'aria-disabled');
      element().focus().type('{home}{enter} ');

      activeItem(0);
      element().should('have.prop', 'values').and('deep.equal', ['vue']);
      cy.get('@toggle').should('not.have.been.called');
      cy.get('@change').should('not.have.been.called');
    });

    it('leaves the tab order when disabled', () => {
      cy.mount(html`<gui-multi-list disabled .items=${frameworks}></gui-multi-list>`);

      element().should('have.attr', 'tabindex', '-1').and('have.attr', 'aria-disabled', 'true');
    });
  });
});
