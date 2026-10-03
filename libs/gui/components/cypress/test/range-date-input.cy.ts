import { html } from 'lit';
import type { GuiRangeDateInput } from '../../src/lib/components/range-date-input';

type Group = 'start' | 'end';

const element = () => cy.get<GuiRangeDateInput>('gui-range-date');
const part = (group: Group, type: string) =>
  cy.get(`gui-range-date input[data-group="${group}"][data-type="${type}"]`);
const pills = () => cy.get('gui-range-date .gui-pills__pill');

const typeDate = (group: Group, month: string, day: string, year: string) => {
  part(group, 'month').click();
  cy.focused().type(month);
  cy.focused().type(day);
  cy.focused().type(year);
};

const june = [{ start: '2026-06-10', end: '2026-06-12' }];
/** Matches an event the element dispatched itself, not one bubbling from an element inside it. */
const dispatchedBy = (el: Element) =>
  Cypress.sinon.match((event: Event) => event.target === el, 'dispatched by the element');

describe('gui-range-date', () => {
  describe('rendering', () => {
    it('renders both endpoints in the locale part order with their names', () => {
      cy.mount(
        html`<gui-range-date
          label="Stay"
          locale-id="en-US"
          separator="to"
          start-date-aria-label="Check-in"
          end-date-aria-label="Check-out"
        ></gui-range-date>`,
      );

      cy.get('gui-range-date input').should(($inputs) => {
        const parts = $inputs
          .toArray()
          .map((el) => `${el.getAttribute('data-group')}-${el.getAttribute('data-type')}`);
        expect(parts).to.deep.equal([
          'start-month',
          'start-day',
          'start-year',
          'end-month',
          'end-day',
          'end-year',
        ]);
      });
      cy.get('gui-range-date [role="group"][aria-label="Check-in"]').should('exist');
      cy.get('gui-range-date [role="group"][aria-label="Check-out"]').should('exist');
      cy.get(
        'gui-range-date .gui-range-date-input__inputs > .gui-range-date-input__separator',
      ).should('have.text', 'to');
      cy.get('gui-range-date .gui-label').should('contain.text', 'Stay');
      cy.get('gui-range-date .gui-range-date-input')
        .invoke('attr', 'aria-labelledby')
        .then((id) => cy.get(`#${id}`).should('contain.text', 'Stay'));
    });
  });

  describe('value', () => {
    it('fires gui-parts-change while typing and gui-change with the range on Enter', () => {
      const onParts = cy.spy().as('parts');
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date
          label="Stay"
          locale-id="en-US"
          @gui-parts-change=${onParts}
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-range-date>`,
      );

      typeDate('start', '06', '15', '2026');
      typeDate('end', '06', '18', '2026');

      cy.get('@parts')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { start: '2026-06-15', end: '2026-06-18' });
      cy.get('@change').should('not.have.been.called');

      cy.focused().type('{enter}');

      const value = [{ start: '2026-06-15', end: '2026-06-18' }];
      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value });
      pills().should('contain.text', '06/15/2026 - 06/18/2026');
      part('start', 'month').should('have.value', '');
      element().should(([el]) => expect(el.value).to.deep.equal(value));
    });

    it('fires gui-input-error for an impossible date on Enter', () => {
      const onError = cy.spy().as('error');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date
          label="Stay"
          locale-id="en-US"
          invalid-date-message="No such day"
          @gui-input-error=${onError}
          @gui-change=${onChange}
        ></gui-range-date>`,
      );

      typeDate('start', '02', '31', '2026');
      typeDate('end', '03', '02', '2026');
      cy.get('@error').should('not.have.been.called');

      cy.focused().type('{enter}');

      cy.get('@error').its('lastCall.args.0.detail').should('deep.equal', {
        message: 'No such day',
      });
      cy.get('@change').should('not.have.been.called');
      pills().should('not.exist');
    });

    it('fires gui-input-error and gui-blur when focus leaves a half-typed range', () => {
      const onError = cy.spy().as('error');
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-range-date
            label="Stay"
            locale-id="en-US"
            incomplete-message="Finish the range"
            @gui-input-error=${onError}
            @gui-blur=${onBlur}
          ></gui-range-date>
          <button>Next</button>`,
      );

      typeDate('start', '06', '10', '2026');
      cy.get('@blur').should('not.have.been.called');
      cy.get('button').contains('Next').focus();

      cy.get('@error').its('lastCall.args.0.detail').should('deep.equal', {
        message: 'Finish the range',
      });
      cy.get('@blur').should('have.been.calledOnce');
    });

    it('fires gui-focus when a part receives focus', () => {
      const onFocus = cy.spy().as('focus');
      cy.mount(
        html`<gui-range-date
          label="Stay"
          locale-id="en-US"
          @gui-focus=${onFocus}
        ></gui-range-date>`,
      );

      part('end', 'day').focus();

      cy.get('@focus').should('have.been.calledOnce');
      cy.get('@focus')
        .its('firstCall.args.0.detail.target')
        .should('have.attr', 'data-type', 'day');
    });

    it('renders a pill per range, fires gui-range-click when clicked and gui-change when removed', () => {
      const onClick = cy.spy().as('click');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date
          label="Stay"
          locale-id="en-US"
          remove-pill-aria-label="Drop range"
          .value=${june}
          @gui-range-click=${onClick}
          @gui-change=${onChange}
        ></gui-range-date>`,
      );

      pills()
        .should('have.length', 1)
        .and('contain.text', '06/10/2026 - 06/12/2026')
        .and('have.attr', 'aria-description', 'Drop range');
      cy.get('gui-range-date .gui-pills__pill-text').click({ force: true });
      cy.get('@click').its('firstCall.args.0.detail').should('deep.equal', { range: june[0] });

      cy.get('gui-range-date .gui-pills__pill-remove').click({ force: true });
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: [] });
      pills().should('not.exist');
    });

    it('fires gui-edit-state-change as a pill is selected and edited', () => {
      const onEditState = cy.spy().as('editState');
      cy.mount(
        html`<gui-range-date
          label="Stay"
          locale-id="en-US"
          allow-edit
          .value=${june}
          @gui-edit-state-change=${onEditState}
        ></gui-range-date>`,
      );

      pills().first().click({ force: true });
      cy.get('@editState')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { selected: june[0], editing: false });

      pills().first().type('e', { force: true });
      cy.get('@editState')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { selected: june[0], editing: true });
      part('start', 'month').should('have.value', '06');
      part('end', 'day').should('have.value', '12');
    });

    it('fires its events to an ancestor listener', () => {
      const onBlur = cy.spy().as('blur');
      const onFocus = cy.spy().as('focus');
      const onPartsChange = cy.spy().as('partsChange');
      const onInputError = cy.spy().as('inputError');
      const onRangeClick = cy.spy().as('rangeClick');
      const onEditStateChange = cy.spy().as('editStateChange');
      cy.mount(
        html`<div
            @gui-blur=${onBlur}
            @gui-focus=${onFocus}
            @gui-parts-change=${onPartsChange}
            @gui-input-error=${onInputError}
            @gui-range-click=${onRangeClick}
            @gui-edit-state-change=${onEditStateChange}
          >
            <gui-range-date
              label="Stay"
              locale-id="en-US"
              allow-edit
              incomplete-message="Finish the range"
              .value=${june}
            ></gui-range-date>
          </div>
          <button id="outside">Outside</button>`,
      );

      cy.get('gui-range-date .gui-pills__pill-text').click({ force: true });
      typeDate('start', '06', '20', '2026');
      cy.get('#outside').focus();

      element().then(([el]) => {
        for (const spy of [
          '@focus',
          '@partsChange',
          '@inputError',
          '@rangeClick',
          '@editStateChange',
        ]) {
          cy.get(spy).should('always.have.been.calledWithMatch', dispatchedBy(el));
        }
        cy.get('@blur').should('have.been.calledOnceWith', dispatchedBy(el));
      });
      cy.get('@inputError')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'Finish the range' });
    });

    it('shows a value set from outside', () => {
      cy.mount(
        html`<gui-range-date label="Stay" locale-id="en-US" .value=${june}></gui-range-date>`,
      );

      element().invoke('prop', 'value', [{ start: '2026-09-01', end: '2026-09-03' }]);

      pills().should('have.length', 1).and('contain.text', '09/01/2026 - 09/03/2026');
    });
  });

  describe('keyboard', () => {
    it('steps a part with the arrow keys', () => {
      cy.mount(html`<gui-range-date label="Stay" locale-id="en-US"></gui-range-date>`);

      part('start', 'month').type('{upArrow}{upArrow}{upArrow}');
      part('start', 'month').should('have.value', '03');
      part('start', 'month').type('{downArrow}');
      part('start', 'month').should('have.value', '02');
    });

    it('moves from the first part to the last pill with ArrowLeft and removes it with Delete', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date
          label="Stay"
          locale-id="en-US"
          .value=${june}
          @gui-change=${onChange}
        ></gui-range-date>`,
      );

      part('start', 'month').focus().type('{leftArrow}');
      cy.focused().should('have.class', 'gui-pills__pill').type('{del}');

      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: [] });
      cy.focused().should('have.attr', 'data-group', 'start');
    });
  });

  describe('states', () => {
    it('makes its parts read-only and locks its pills', () => {
      cy.mount(
        html`<gui-range-date
          label="Stay"
          locale-id="en-US"
          readonly
          .value=${june}
        ></gui-range-date>`,
      );

      cy.get('gui-range-date input').each((input) =>
        cy.wrap(input).should('have.attr', 'readonly'),
      );
      pills().should('be.disabled');
    });

    it('disables its parts and pills', () => {
      cy.mount(
        html`<gui-range-date
          label="Stay"
          locale-id="en-US"
          disabled
          .value=${june}
        ></gui-range-date>`,
      );

      cy.get('gui-range-date input').should('be.disabled');
      pills().should('be.disabled');
    });
  });
});
