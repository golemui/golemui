import { html } from 'lit';
import type { GuiSelect } from '../../src/lib/components/select';

const options = [
  { label: 'Red', value: 'red' },
  { label: 'Green', value: 'green' },
];

const select = () => cy.get('gui-select select');
const element = () => cy.get<GuiSelect>('gui-select');

describe('gui-select', () => {
  describe('rendering', () => {
    it('renders its options from its attributes after a placeholder', () => {
      cy.mount(
        html`<gui-select
          label="Color"
          options='[{"name":"Red","id":"red"},{"name":"Green","id":"green"}]'
          label-field="name"
          value-field="id"
          placeholder="Choose a color"
          autocomplete="off"
          required
        ></gui-select>`,
      );

      cy.get('gui-select option').should('have.length', 3);
      cy.get('gui-select option').eq(0).should('contain.text', 'Choose a color');
      cy.get('gui-select option').eq(0).should('be.disabled').and('be.selected');
      cy.get('gui-select option').eq(2).should('have.value', 'green');
      cy.get('gui-select option').eq(2).should('contain.text', 'Green');
      select().should('have.attr', 'autocomplete', 'off');
      // The element validates itself: only the ARIA state is on the native control.
      select().should('have.attr', 'aria-required', 'true').and('not.have.attr', 'required');
      cy.get('gui-select label').should('contain.text', 'Color');
    });

    it('says "Select an option" without a placeholder', () => {
      cy.mount(html`<gui-select label="Color" .options=${options}></gui-select>`);

      cy.get('gui-select option').eq(0).should('contain.text', 'Select an option');
    });

    it('describes the select with its hint', () => {
      cy.mount(
        html`<gui-select label="Color" hint="Your favorite" .options=${options}></gui-select>`,
      );

      select()
        .invoke('attr', 'aria-describedby')
        .then((id) => cy.get(`#${id}`).should('have.text', 'Your favorite'));
    });

    it('shows its errors and points the select at them', () => {
      cy.mount(
        html`<gui-select label="Color" .options=${options} .errors=${['Pick one']}></gui-select>`,
      );

      select().should('have.attr', 'aria-invalid', 'true');
      select()
        .invoke('attr', 'aria-errormessage')
        .then((id) => cy.get(`#${id}`).should('contain.text', 'Pick one'));
    });

    it('renders its icon hidden from assistive technology', () => {
      cy.mount(
        html`<gui-select label="Color" icon="icon-palette" .options=${options}></gui-select>`,
      );

      cy.get('gui-select .icon-palette').should('have.attr', 'aria-hidden', 'true');
      select().should('have.class', 'gui-select--icon');
    });
  });

  describe('value', () => {
    it('fires gui-input and gui-change when an option is picked', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-select
          label="Color"
          .options=${options}
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-select>`,
      );

      select().select('green');

      cy.get('@input').its('firstCall.args.0.detail').should('deep.equal', { value: 'green' });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: 'green' });
      element().should('have.prop', 'value', 'green');
    });

    it('keeps number option values as numbers', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-select
          label="Rating"
          .options=${[1, 2, 3]}
          @gui-change=${onChange}
        ></gui-select>`,
      );

      select().select('2');

      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: 2 });
    });

    it('fires gui-blur when focus leaves', () => {
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-select label="Color" .options=${options} @gui-blur=${onBlur}></gui-select>`,
      );

      select().focus().blur();

      cy.get('@blur').should('have.been.calledOnce');
    });

    it('selects the option of a value set from outside', () => {
      cy.mount(html`<gui-select label="Color" value="red" .options=${options}></gui-select>`);

      select().should('have.value', 'red');
      element().invoke('prop', 'value', 'green');
      select().should('have.value', 'green');
      element().then(([el]) => {
        el.value = undefined;
      });
      cy.get('gui-select option').eq(0).should('be.selected');
    });

    it('fires gui-input-error for a value that matches no option', () => {
      const onError = cy.spy().as('error');
      cy.mount(
        html`<gui-select
          label="Color"
          .options=${options}
          @gui-input-error=${onError}
        ></gui-select>`,
      );

      element().invoke('prop', 'value', 'blue');

      cy.get('@error').should('have.been.calledOnce');
      cy.get('@error')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { message: "Invalid selection: 'blue' is not a valid option." });
      cy.get('@error').its('firstCall.args.0.composed').should('equal', true);
      cy.get('gui-select option').eq(0).should('be.selected');
    });

    it('waits for options that arrive after the value', () => {
      const onError = cy.spy().as('error');
      cy.mount(
        html`<gui-select label="Color" value="green" @gui-input-error=${onError}></gui-select>`,
      );

      element().invoke('prop', 'options', options);

      select().should('have.value', 'green');
      cy.get('@error').should('not.have.been.called');
    });

    it('withdraws its error with an empty message when new options make the value valid', () => {
      const onError = cy.spy().as('error');
      cy.mount(
        html`<gui-select
          label="Color"
          value="blue"
          .options=${options}
          @gui-input-error=${onError}
        ></gui-select>`,
      );

      cy.get('@error').should('have.been.calledOnce');
      element().invoke('prop', 'options', [...options, { label: 'Blue', value: 'blue' }]);

      select().should('have.value', 'blue');
      cy.get('@error').should('have.been.calledTwice');
      cy.get('@error').its('lastCall.args.0.detail').should('deep.equal', { message: '' });
    });

    it('reports an invalid value once while new options keep it invalid', () => {
      const onError = cy.spy().as('error');
      cy.mount(
        html`<gui-select
          label="Color"
          value="blue"
          .options=${options}
          @gui-input-error=${onError}
        ></gui-select>`,
      );

      element().invoke('prop', 'options', [...options]);
      element().invoke('prop', 'options', [...options]);

      cy.get('gui-select option').should('have.length', 3);
      cy.get('@error').should('have.been.calledOnce');
    });

    it('lets the gui-input of a picked option replace its error', () => {
      const onError = cy.spy().as('error');
      const onInput = cy.spy().as('input');
      cy.mount(
        html`<gui-select
          label="Color"
          value="blue"
          .options=${options}
          @gui-input-error=${onError}
          @gui-input=${onInput}
        ></gui-select>`,
      );

      select().select('green');

      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value: 'green' });
      cy.get('@error').should('have.been.calledOnce');
    });

    it('words that error with invalid-option-message', () => {
      const onError = cy.spy().as('error');
      cy.mount(
        html`<gui-select
          label="Color"
          invalid-option-message="{value} is not on the list"
          .options=${options}
          @gui-input-error=${onError}
        ></gui-select>`,
      );

      element().invoke('prop', 'value', 'blue');

      cy.get('@error')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { message: 'blue is not on the list' });
    });
  });

  describe('states', () => {
    it('stays enabled and focusable, marked read-only, when read-only', () => {
      cy.mount(
        html`<gui-select label="Color" value="red" readonly .options=${options}></gui-select>`,
      );

      select().should('not.be.disabled').and('have.attr', 'aria-readonly', 'true');
      select().should('not.have.attr', 'aria-disabled');
      select().focus().should('be.focused');
    });

    it('ignores the mouse and the keys that would change it when read-only, firing nothing', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-select
          label="Color"
          value="red"
          readonly
          .options=${options}
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-select>`,
      );

      select().then(([el]) => {
        // Cancelled events are what keep the browser from opening the list or changing the option.
        const press = (key: string) =>
          el.dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true }));
        expect(press('ArrowDown')).to.equal(false);
        expect(press(' ')).to.equal(false);
        expect(press('g')).to.equal(false);
        expect(press('Tab')).to.equal(true);
        expect(el.dispatchEvent(new MouseEvent('mousedown', { cancelable: true }))).to.equal(false);
      });

      // The mouse still focuses it.
      select().should('be.focused');
      select().should('have.value', 'red');
      element().should('have.prop', 'value', 'red');
      cy.get('@input').should('not.have.been.called');
      cy.get('@change').should('not.have.been.called');
    });

    it('disables the native select', () => {
      cy.mount(html`<gui-select label="Color" disabled .options=${options}></gui-select>`);

      select().should('be.disabled');
    });
  });
});
