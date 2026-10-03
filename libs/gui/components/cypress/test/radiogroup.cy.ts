import { html } from 'lit';
import type { GuiRadiogroup } from '../../src/lib/components/radiogroup';

const options = [
  { label: 'Red', value: 'red' },
  { label: 'Green', value: 'green' },
  { label: 'Blue', value: 'blue' },
];

const radios = () => cy.get('gui-radiogroup input[type="radio"]');
const group = () => cy.get('gui-radiogroup [role="radiogroup"]');
const element = () => cy.get<GuiRadiogroup>('gui-radiogroup');

describe('gui-radiogroup', () => {
  describe('rendering', () => {
    it('renders one radio per option from its attributes', () => {
      cy.mount(
        html`<gui-radiogroup
          label="Color"
          options='[{"name":"Red","id":"red"},{"name":"Green","id":"green"}]'
          label-field="name"
          value-field="id"
          value="green"
        ></gui-radiogroup>`,
      );

      radios().should('have.length', 2);
      cy.get('gui-radiogroup label').eq(0).should('contain.text', 'Red');
      radios().eq(0).should('have.value', 'red').and('not.be.checked');
      radios().eq(1).should('have.value', 'green').and('be.checked');
    });

    it('renders plain values as options', () => {
      cy.mount(html`<gui-radiogroup label="Size" options='["S","M"]'></gui-radiogroup>`);

      radios().eq(0).should('have.value', 'S');
      cy.get('gui-radiogroup label').eq(1).should('contain.text', 'M');
    });

    it('names the group with its label and describes it with its hint', () => {
      cy.mount(
        html`<gui-radiogroup label="Color" hint="Pick one" .options=${options}></gui-radiogroup>`,
      );

      group()
        .invoke('attr', 'aria-labelledby')
        .then((id) => cy.get(`#${id}`).should('contain.text', 'Color'));
      group()
        .invoke('attr', 'aria-describedby')
        .then((id) => cy.get(`#${id}`).should('have.text', 'Pick one'));
    });

    it('lays the options out in a row with direction', () => {
      cy.mount(
        html`<gui-radiogroup label="Color" direction="row" .options=${options}></gui-radiogroup>`,
      );

      group().should('have.class', 'gui-widget--horizontal');
    });

    it('marks the group as required and shows its errors', () => {
      cy.mount(
        html`<gui-radiogroup
          label="Color"
          required
          .options=${options}
          .errors=${['Pick a color']}
        ></gui-radiogroup>`,
      );

      group().should('have.attr', 'aria-required', 'true');
      group().should('have.attr', 'aria-invalid', 'true');
      group()
        .invoke('attr', 'aria-errormessage')
        .then((id) => cy.get(`#${id}`).should('contain.text', 'Pick a color'));
    });
  });

  describe('value', () => {
    it('fires gui-input and gui-change when an option is picked', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-radiogroup
          label="Color"
          .options=${options}
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-radiogroup>`,
      );

      radios().eq(1).check();

      cy.get('@input').its('firstCall.args.0.detail').should('deep.equal', { value: 'green' });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: 'green' });
      element().should('have.prop', 'value', 'green');
    });

    it('keeps number option values as numbers', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-radiogroup
          label="Rating"
          .options=${[1, 2, 3]}
          @gui-change=${onChange}
        ></gui-radiogroup>`,
      );

      radios().eq(2).check();

      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: 3 });
    });

    it('fires gui-blur when focus leaves', () => {
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-radiogroup
          label="Color"
          .options=${options}
          @gui-blur=${onBlur}
        ></gui-radiogroup>`,
      );

      radios().eq(0).focus().blur();

      cy.get('@blur').should('have.been.calledOnce');
    });

    it('checks the option of a value set from outside', () => {
      cy.mount(
        html`<gui-radiogroup label="Color" value="red" .options=${options}></gui-radiogroup>`,
      );

      element().invoke('prop', 'value', 'blue');

      radios().eq(2).should('be.checked');
      radios().eq(0).should('not.be.checked');
    });
  });

  describe('keyboard', () => {
    it('keeps a single tab stop on the checked option, or the first one', () => {
      cy.mount(html`<gui-radiogroup label="Color" .options=${options}></gui-radiogroup>`);

      radios().eq(0).should('have.attr', 'tabindex', '0');
      radios().eq(1).should('have.attr', 'tabindex', '-1');

      element().invoke('prop', 'value', 'green');

      radios().eq(0).should('have.attr', 'tabindex', '-1');
      radios().eq(1).should('have.attr', 'tabindex', '0');
      radios().eq(2).should('have.attr', 'tabindex', '-1');
    });
  });

  describe('states', () => {
    it('stays focusable and marks the group read-only when read-only', () => {
      cy.mount(
        html`<gui-radiogroup
          label="Color"
          value="red"
          readonly
          .options=${options}
        ></gui-radiogroup>`,
      );

      group().should('have.attr', 'aria-readonly', 'true');
      radios().should('not.be.disabled');
      radios().eq(0).should('have.attr', 'tabindex', '0').focus().should('be.focused');
    });

    it('keeps its value on clicks and keys when read-only, firing nothing', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-radiogroup
          label="Color"
          value="red"
          readonly
          .options=${options}
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-radiogroup>`,
      );

      cy.get('gui-radiogroup label').contains('Green').click();
      radios().eq(2).click();
      radios()
        .eq(0)
        .then(([radio]) => {
          // Cancelled keys are what keep the browser from checking the next radio.
          const press = (key: string) =>
            radio.dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true }));
          expect(press('ArrowDown')).to.equal(false);
          expect(press('ArrowRight')).to.equal(false);
          expect(press(' ')).to.equal(false);
          expect(press('Tab')).to.equal(true);
        });

      radios().eq(0).should('be.checked');
      radios().eq(1).should('not.be.checked');
      radios().eq(2).should('not.be.checked');
      element().should('have.prop', 'value', 'red');
      cy.get('@input').should('not.have.been.called');
      cy.get('@change').should('not.have.been.called');
    });

    it('disables every radio', () => {
      cy.mount(html`<gui-radiogroup label="Color" disabled .options=${options}></gui-radiogroup>`);

      radios().should('have.length', 3).and('be.disabled');
    });
  });
});
