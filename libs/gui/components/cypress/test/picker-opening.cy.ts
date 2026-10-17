import { html, type TemplateResult } from 'lit';
import { options } from '../support/elements';

// How the pickers and dropdowns open, after the APG combobox pattern: focus alone never opens the
// panel, so a dialog's initial focus, a script or a form focusing an invalid field leaves it
// closed. A click on the field, the toggle button, Alt+ArrowDown (and ArrowDown or typing in a
// dropdown) open it; Escape and Alt+ArrowUp close it.

const fields: Record<string, { field: TemplateResult; focusable: string }> = {
  'gui-date-picker': {
    field: html`<gui-date-picker label="Start" value="2026-03-15"></gui-date-picker>`,
    focusable: '[data-type="month"]',
  },
  'gui-time-picker': {
    field: html`<gui-time-picker label="At" locale-id="en-US"></gui-time-picker>`,
    focusable: '[data-type="hour"]',
  },
  'gui-date-time-picker': {
    field: html`<gui-date-time-picker label="Delivery"></gui-date-time-picker>`,
    focusable: '[data-type="month"]',
  },
  'gui-range-date-picker': {
    field: html`<gui-range-date-picker label="Stay"></gui-range-date-picker>`,
    focusable: '[data-type="month"]',
  },
  'gui-range-time-picker': {
    field: html`<gui-range-time-picker label="Hours" locale-id="en-US"></gui-range-time-picker>`,
    focusable: '[data-type="hour"]',
  },
  'gui-range-date-time-picker': {
    field: html`<gui-range-date-time-picker label="Rental"></gui-range-date-time-picker>`,
    focusable: '[data-type="month"]',
  },
  'gui-dropdown': {
    field: html`<gui-dropdown label="Plan" .items=${options}></gui-dropdown>`,
    focusable: 'input',
  },
  'gui-multi-dropdown': {
    field: html`<gui-multi-dropdown label="Colors" .items=${options}></gui-multi-dropdown>`,
    focusable: 'input',
  },
};

/** An Alt+key press. A real KeyboardEvent: Firefox drops the modifier from Cypress's own. */
const alt = (key: string) => ({ key, altKey: true, eventConstructor: 'KeyboardEvent' as const });

const isOpen = (tag: string, expected: boolean) =>
  cy.get(tag).should(([element]) => {
    const panel = element.querySelector(':scope > .gui-widget > .gui-picker__panel');
    expect(!!panel?.matches(':popover-open'), 'the panel is open').to.equal(expected);
  });

describe('opening pickers and dropdowns', () => {
  for (const [tag, { field, focusable }] of Object.entries(fields)) {
    describe(tag, () => {
      it('stays closed when its field takes focus from a script', () => {
        cy.mount(field);

        cy.get(`${tag} ${focusable}`).first().focus();
        cy.focused().should('match', focusable);
        cy.wait(50);
        isOpen(tag, false);
      });

      it('opens on a click in its field', () => {
        cy.mount(field);

        cy.get(`${tag} ${focusable}`).first().click();
        isOpen(tag, true);
      });

      it('opens on Alt+ArrowDown and closes on Alt+ArrowUp', () => {
        cy.mount(field);

        cy.get(`${tag} ${focusable}`).first().focus();
        cy.focused().trigger('keydown', alt('ArrowDown'));
        isOpen(tag, true);
        cy.focused().trigger('keydown', alt('ArrowUp'));
        isOpen(tag, false);
      });
    });
  }

  it('moves into the calendar on Alt+ArrowDown, and leaves the date as it was', () => {
    cy.mount(fields['gui-date-picker'].field);

    cy.get('gui-date-picker [data-type="month"]')
      .focus()
      .trigger('keydown', alt('ArrowDown'))
      .trigger('keyup', alt('ArrowDown'));
    isOpen('gui-date-picker', true);
    cy.focused().should('have.class', 'gui-calendar__day-button');
    cy.get('gui-date-picker').should('have.prop', 'value', '2026-03-15');

    cy.focused().trigger('keydown', alt('ArrowUp'));
    isOpen('gui-date-picker', false);
    cy.focused().should('have.attr', 'data-type');
  });

  it("stays closed when a dialog's initial focus lands on it", () => {
    cy.mount(
      html`<gui-dialog>
        <dialog id="filters" aria-label="Filters">${fields['gui-date-picker'].field}</dialog>
      </gui-dialog>`,
    );

    // Opened once its content has rendered, as an invoker opens it.
    cy.get('gui-date-picker [data-type="month"]').should('exist');
    cy.get('gui-dialog').invoke('prop', 'open', true);
    cy.get('#filters').should('match', ':modal');
    cy.focused().should('match', '[data-type="month"]');
    cy.wait(50);
    isOpen('gui-date-picker', false);
  });
});
