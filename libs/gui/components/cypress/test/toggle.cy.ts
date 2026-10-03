import { html } from 'lit';
import type { GuiToggle } from '../../src/lib/components/toggle';

const input = () => cy.get('gui-toggle input');
const element = () => cy.get<GuiToggle>('gui-toggle');

describe('gui-toggle', () => {
  describe('rendering', () => {
    it('renders a switch with its label and hint', () => {
      cy.mount(html`<gui-toggle label="Notifications" hint="Sent by email"></gui-toggle>`);

      input().should('have.attr', 'role', 'switch').and('not.be.checked');
      cy.get('gui-toggle label').should('contain.text', 'Notifications');
      input()
        .invoke('attr', 'aria-describedby')
        .then((id) => cy.get(`#${id}`).should('contain.text', 'Sent by email'));
    });

    it('places the switch on the right with toggle-position', () => {
      cy.mount(html`<gui-toggle label="Notifications" toggle-position="right"></gui-toggle>`);

      element().should('have.class', 'gui-toggle--right');
      element().invoke('prop', 'togglePosition', 'left');
      element().should('not.have.class', 'gui-toggle--right');
    });

    it('marks the switch as required', () => {
      cy.mount(html`<gui-toggle label="Notifications" required></gui-toggle>`);

      input().should('have.attr', 'required');
      input().should('have.attr', 'aria-required', 'true');
      cy.get('gui-toggle label [aria-hidden="true"]').should('contain.text', '*');
    });

    it('shows its errors and points the switch at them', () => {
      cy.mount(html`<gui-toggle label="Notifications" .errors=${['Turn it on']}></gui-toggle>`);

      input().should('have.attr', 'aria-invalid', 'true');
      input()
        .invoke('attr', 'aria-errormessage')
        .then((id) => cy.get(`#${id}`).should('contain.text', 'Turn it on'));
    });
  });

  describe('value', () => {
    it('fires gui-input and gui-change when switched on', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-toggle
          label="Notifications"
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-toggle>`,
      );

      input().click();

      cy.get('@input').should('have.been.calledOnce');
      cy.get('@input').its('firstCall.args.0.detail').should('deep.equal', { value: true });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: true });
      element().should('have.prop', 'value', true);
    });

    it('fires gui-change with false when switched off', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-toggle
          label="Notifications"
          .value=${true}
          @gui-change=${onChange}
        ></gui-toggle>`,
      );

      input().should('be.checked').click();

      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: false });
      element().should('have.prop', 'value', false);
    });

    it('fires gui-blur when focus leaves', () => {
      const onBlur = cy.spy().as('blur');
      cy.mount(html`<gui-toggle label="Notifications" @gui-blur=${onBlur}></gui-toggle>`);

      input().focus().blur();

      cy.get('@blur').should('have.been.calledOnce');
    });

    it('reads its value attribute as a boolean, and value="false" as off', () => {
      cy.mount(
        html`<gui-toggle label="On" value></gui-toggle>
          <gui-toggle label="Off" value="false"></gui-toggle>`,
      );

      element().eq(0).should('have.prop', 'value', true).find('input').should('be.checked');
      element().eq(1).should('have.prop', 'value', false).find('input').should('not.be.checked');
    });

    it('shows a value set from outside', () => {
      cy.mount(html`<gui-toggle label="Notifications"></gui-toggle>`);

      element().invoke('prop', 'value', true);
      input().should('be.checked');

      element().invoke('prop', 'value', false);
      input().should('not.be.checked');
    });
  });

  describe('states', () => {
    it('stays focusable and marked read-only when read-only', () => {
      cy.mount(html`<gui-toggle label="Notifications" readonly></gui-toggle>`);

      input()
        .should('not.be.disabled')
        .and('have.attr', 'aria-readonly', 'true')
        .and('have.css', 'cursor', 'default');
      input().focus().should('be.focused');
    });

    it('keeps its value on click when read-only, firing nothing', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-toggle
          label="Notifications"
          .value=${true}
          readonly
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-toggle>`,
      );

      cy.get('gui-toggle label').click();
      input().click();

      input().should('be.checked');
      element().should('have.prop', 'value', true);
      cy.get('@input').should('not.have.been.called');
      cy.get('@change').should('not.have.been.called');
    });

    it('disables the native switch', () => {
      cy.mount(html`<gui-toggle label="Notifications" disabled></gui-toggle>`);

      input().should('be.disabled');
    });
  });
});
