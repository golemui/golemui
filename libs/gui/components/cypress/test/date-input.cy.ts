import { html } from 'lit';
import type { GuiDate } from '../../src/lib/components/date-input';

const part = (type: 'month' | 'day' | 'year') => cy.get(`gui-date [data-type="${type}"]`);
const element = () => cy.get<GuiDate>('gui-date');
/** Matches an event the element dispatched itself, not one bubbling from an element inside it. */
const dispatchedBy = (el: Element) =>
  Cypress.sinon.match((event: Event) => event.target === el, 'dispatched by the element');

describe('gui-date', () => {
  describe('rendering', () => {
    it('renders its value as month, day and year parts in the locale order', () => {
      cy.mount(html`<gui-date label="Start" locale-id="en-US" value="2026-03-15"></gui-date>`);

      cy.get('gui-date [role="spinbutton"]').should(($parts) => {
        expect($parts.toArray().map((el) => el.dataset['type'])).to.deep.equal([
          'month',
          'day',
          'year',
        ]);
      });
      part('month').should('have.value', '03');
      part('day').should('have.value', '15');
      part('year').should('have.value', '2026');
    });

    it('names the group with its label and each part with its aria-label attribute', () => {
      cy.mount(
        html`<gui-date
          label="Start"
          locale-id="en-US"
          day-aria-label="Día"
          month-aria-label="Mes"
          year-aria-label="Año"
        ></gui-date>`,
      );

      cy.get('gui-date [role="group"]')
        .invoke('attr', 'aria-labelledby')
        .then((id) => cy.get(`#${id}`).should('contain.text', 'Start'));
      part('day').should('have.attr', 'aria-label', 'Día');
      part('month').should('have.attr', 'aria-label', 'Mes');
      part('year').should('have.attr', 'aria-label', 'Año');
    });

    it('shows a value set from outside', () => {
      cy.mount(html`<gui-date label="Start" locale-id="en-US" value="2026-03-15"></gui-date>`);

      element().invoke('prop', 'value', '2027-11-02');

      part('month').should('have.value', '11');
      part('day').should('have.value', '02');
      part('year').should('have.value', '2027');
    });
  });

  describe('value', () => {
    it('fires gui-input and gui-change with the ISO date once every part is typed', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-date
          label="Start"
          locale-id="en-US"
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-date>`,
      );

      part('month').type('03');
      cy.focused().should('have.attr', 'data-type', 'day').type('15');
      cy.focused().should('have.attr', 'data-type', 'year').type('2026');

      cy.get('@input').should('have.been.calledOnce');
      cy.get('@input').its('firstCall.args.0.detail').should('deep.equal', { value: '2026-03-15' });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { value: '2026-03-15' });
      element().should('have.prop', 'value', '2026-03-15');
    });

    it('fires gui-parts-change with the date once the parts form one', () => {
      const onPartsChange = cy.spy().as('partsChange');
      cy.mount(
        html`<gui-date
          label="Start"
          locale-id="en-US"
          @gui-parts-change=${onPartsChange}
        ></gui-date>`,
      );

      part('month').type('03');
      cy.focused().type('15');

      cy.get('@partsChange').its('firstCall.args.0.detail').should('deep.equal', { date: null });

      cy.focused().type('2026');

      cy.get('@partsChange')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { date: '2026-03-15' });
    });

    it('fires gui-focus when a part receives focus and gui-blur when focus leaves the field', () => {
      const onFocus = cy.spy().as('focus');
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-date
            label="Start"
            locale-id="en-US"
            @gui-focus=${onFocus}
            @gui-blur=${onBlur}
          ></gui-date>
          <button id="outside">Outside</button>`,
      );

      part('month').type('03');
      cy.focused().should('have.attr', 'data-type', 'day');
      cy.get('@focus').should('have.been.calledTwice');
      cy.get('@focus').its('firstCall.args.0.detail').should('be.instanceOf', FocusEvent);
      cy.get('@blur').should('not.have.been.called');

      cy.get('#outside').focus();

      cy.get('@blur').should('have.been.calledOnce');
    });

    it('fires its events to an ancestor listener', () => {
      const onBlur = cy.spy().as('blur');
      const onFocus = cy.spy().as('focus');
      const onPartsChange = cy.spy().as('partsChange');
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<div
            @gui-blur=${onBlur}
            @gui-focus=${onFocus}
            @gui-parts-change=${onPartsChange}
            @gui-input-error=${onInputError}
          >
            <gui-date label="Start" locale-id="en-US" invalid-date-message="No such day"></gui-date>
          </div>
          <button id="outside">Outside</button>`,
      );

      part('month').type('02');
      cy.focused().type('31');
      cy.focused().type('2026');
      cy.get('#outside').focus();

      element().then(([el]) => {
        cy.get('@focus').should('always.have.been.calledWithMatch', dispatchedBy(el));
        cy.get('@partsChange').should('always.have.been.calledWithMatch', dispatchedBy(el));
        cy.get('@inputError').should('always.have.been.calledWithMatch', dispatchedBy(el));
        cy.get('@blur').should('have.been.calledOnceWith', dispatchedBy(el));
      });
      cy.get('@inputError')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { message: 'No such day' });
    });

    it('fires gui-input-error for an impossible date', () => {
      const onChange = cy.spy().as('change');
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-date
          label="Start"
          locale-id="en-US"
          invalid-date-message="No such day"
          @gui-change=${onChange}
          @gui-input-error=${onInputError}
        ></gui-date>`,
      );

      part('month').type('02');
      part('day').type('31');
      part('year').type('2026');

      cy.get('@inputError')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { message: 'No such day' });
      cy.get('@change').should('not.have.been.called');
      element().should(([el]) => expect(el.value).to.equal(undefined));
    });

    it('fires gui-change and gui-input-error for a date outside min-date and max-date', () => {
      const onChange = cy.spy().as('change');
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-date
          label="Start"
          locale-id="en-US"
          min-date="2026-03-01"
          max-date="2026-03-31"
          max-date-message="Too late"
          @gui-change=${onChange}
          @gui-input-error=${onInputError}
        ></gui-date>`,
      );

      part('month').type('04');
      part('day').type('02');
      part('year').type('2026');

      cy.get('@change')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { value: '2026-04-02' });
      cy.get('@inputError')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { message: 'Too late' });
    });

    it('reports a partly typed date as incomplete when focus leaves', () => {
      const onInput = cy.spy().as('input');
      const onInputError = cy.spy().as('inputError');
      cy.mount(
        html`<gui-date
            label="Start"
            locale-id="en-US"
            incomplete-message="Finish the date"
            @gui-input=${onInput}
            @gui-input-error=${onInputError}
          ></gui-date>
          <button id="outside">Outside</button>`,
      );

      part('month').type('03');
      cy.get('#outside').focus();

      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value: null });
      cy.get('@inputError')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { message: 'Finish the date' });
      part('month').should('have.value', '03');
    });
  });

  describe('keyboard', () => {
    it('steps a part with the up and down arrows and fires gui-change', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-date
          label="Start"
          locale-id="en-US"
          value="2026-03-15"
          @gui-change=${onChange}
        ></gui-date>`,
      );

      part('day').type('{upArrow}');

      part('day').should('have.value', '16');
      cy.get('@change').its('lastCall.args.0.detail').should('deep.equal', { value: '2026-03-16' });

      part('month').type('{downArrow}');

      part('month').should('have.value', '02');
      element().should('have.prop', 'value', '2026-02-16');
    });

    it('moves between parts with the left and right arrows', () => {
      cy.mount(html`<gui-date label="Start" locale-id="en-US" value="2026-03-15"></gui-date>`);

      part('month').type('{rightArrow}');
      cy.focused().should('have.attr', 'data-type', 'day');
      cy.focused().type('{rightArrow}');
      cy.focused().should('have.attr', 'data-type', 'year');
      cy.focused().type('{leftArrow}');
      cy.focused().should('have.attr', 'data-type', 'day');
    });

    it('ignores keys other than digits', () => {
      cy.mount(html`<gui-date label="Start" locale-id="en-US"></gui-date>`);

      part('day').type('a-');

      part('day').should('have.value', '');
    });
  });

  describe('states', () => {
    it('makes its parts read-only', () => {
      cy.mount(
        html`<gui-date label="Start" locale-id="en-US" value="2026-03-15" readonly></gui-date>`,
      );

      cy.get('gui-date [role="spinbutton"]').each(($part) => {
        cy.wrap($part).should('have.attr', 'readonly');
      });
      part('day')
        .focus()
        .trigger('keydown', { key: 'ArrowUp' })
        .trigger('keyup', { key: 'ArrowUp' });
      part('day').should('have.value', '15');
    });

    it('disables its parts', () => {
      cy.mount(html`<gui-date label="Start" locale-id="en-US" disabled></gui-date>`);

      cy.get('gui-date [role="spinbutton"]').each(($part) => {
        cy.wrap($part).should('be.disabled');
      });
    });
  });
});
