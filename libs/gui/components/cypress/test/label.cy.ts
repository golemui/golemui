import { html } from 'lit';
import type { GuiLabel } from '../../src/lib/components/label';

const label = () => cy.get<GuiLabel>('gui-label');
const target = () => cy.get('#target');

/** Points the label at the input next to it. */
const labelTarget = () =>
  label().then(([element]) => {
    element.targetElement = document.getElementById('target') as HTMLElement;
  });

describe('gui-label', () => {
  describe('rendering', () => {
    it('renders a native label for its control, with its hint', () => {
      cy.mount(
        html`<gui-label uid="name" label="Name" hint="Your full name"></gui-label>
          <input id="name" />`,
      );

      cy.get('gui-label label')
        .should('have.attr', 'for', 'name')
        .and('have.attr', 'id', 'name_label')
        .and('contain.text', 'Name');
      cy.get('#name_hint').should('have.text', 'Your full name');
    });

    it('renders a plain element for a control a label cannot name', () => {
      cy.mount(html`<gui-label uid="name" label="Name" .native=${false}></gui-label>`);

      cy.get('gui-label label').should('not.exist');
      cy.get('gui-label #name_label').should('contain.text', 'Name');
    });

    it('adds a required marker hidden from assistive technology', () => {
      cy.mount(html`<gui-label label="Name" required></gui-label>`);

      cy.get('gui-label [aria-hidden="true"]').should('have.text', ' *');
    });

    it('renders its hint alone without a label', () => {
      cy.mount(html`<gui-label uid="name" hint="Your full name"></gui-label>`);

      cy.get('gui-label .gui-label').should('not.exist');
      cy.get('gui-label #name_hint').should('have.text', 'Your full name');
    });

    it('renders nothing without a label or a hint', () => {
      cy.mount(html`<gui-label></gui-label>`);

      cy.get('gui-label').should('exist');
      cy.get('gui-label *').should('not.exist');
    });
  });

  describe('target', () => {
    it('sets the ARIA attributes of its target from its state', () => {
      cy.mount(
        html`<gui-label uid="name" label="Name" hint="Your full name" required></gui-label>
          <input id="target" />`,
      );
      labelTarget();

      target()
        .should('have.attr', 'aria-describedby', 'name_hint')
        .and('have.attr', 'aria-required', 'true')
        .and('not.have.attr', 'aria-invalid');

      label().invoke('attr', 'readonly', '');
      target().should('have.attr', 'aria-readonly', 'true');
      label().invoke('attr', 'disabled', '');
      target().should('have.attr', 'aria-disabled', 'true');
    });

    it('describes its target with its hint even without a label', () => {
      cy.mount(
        html`<gui-label uid="name" hint="Your full name"></gui-label> <input id="target" />`,
      );
      labelTarget();

      target().should('have.attr', 'aria-describedby', 'name_hint');
      cy.get('#name_hint').should('have.text', 'Your full name');
    });

    it('points its target at its errors, unless touched is false', () => {
      cy.mount(
        html`<gui-label uid="name" label="Name" .errors=${['Required']}></gui-label>
          <input id="target" />`,
      );
      labelTarget();

      target()
        .should('have.attr', 'aria-invalid', 'true')
        .and('have.attr', 'aria-errormessage', 'name_errors');

      label().invoke('prop', 'touched', false);
      target().should('not.have.attr', 'aria-invalid');
      target().should('not.have.attr', 'aria-errormessage');
    });

    it('sets the ARIA attributes of every target in a list', () => {
      cy.mount(
        html`<gui-label uid="range" label="Range" required></gui-label> <input class="part" /><input
            class="part"
          />`,
      );

      label().then(([element]) => {
        element.targetElement = [...document.querySelectorAll<HTMLElement>('.part')];
      });

      cy.get('.part').should((parts) => {
        expect(parts).to.have.length(2);
        parts.each((_, part) => {
          expect(part).to.have.attr('aria-required', 'true');
        });
      });
    });
  });
});
