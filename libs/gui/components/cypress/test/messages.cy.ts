import { html } from 'lit';
import { configureMessages, type GuiMessageKey } from '../../src/index';

const spanish: Partial<Record<GuiMessageKey, string>> = {
  showCalendar: 'Mostrar calendario',
  valueMissing: 'Rellena este campo.',
};

describe('configureMessages', () => {
  afterEach(() => configureMessages(null));

  it('translates the built-in strings through the app translate function', () => {
    configureMessages((key) => spanish[key]);
    cy.mount(html`<gui-date-picker label="Start"></gui-date-picker>`);

    cy.get('gui-date-picker button[aria-haspopup]').should(
      'have.attr',
      'aria-label',
      'Mostrar calendario',
    );
  });

  it('re-renders connected elements on a language change', () => {
    cy.mount(html`<gui-date-picker label="Start"></gui-date-picker>`);
    cy.get('gui-date-picker button[aria-haspopup]').should(
      'have.attr',
      'aria-label',
      'Show calendar',
    );

    cy.then(() => configureMessages((key) => spanish[key]));

    cy.get('gui-date-picker button[aria-haspopup]').should(
      'have.attr',
      'aria-label',
      'Mostrar calendario',
    );
  });

  it("keeps an element's own prop over the translation", () => {
    configureMessages((key) => spanish[key]);
    cy.mount(html`<gui-date-picker label="Start" .toggleAriaLabel=${'Abrir'}></gui-date-picker>`);

    cy.get('gui-date-picker button[aria-haspopup]').should('have.attr', 'aria-label', 'Abrir');
  });

  it('translates the native validation message', () => {
    configureMessages((key) => spanish[key]);
    cy.mount(
      html`<form><gui-textinput name="email" label="Email" required></gui-textinput></form>`,
    );

    cy.get('gui-textinput').should('have.prop', 'validationMessage', 'Rellena este campo.');
  });
});
