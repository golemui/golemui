import { html } from 'lit';
import type { GuiRangeDateTimeInput } from '../../src/lib/components/range-date-time-input';

type Group = 'start' | 'end';
type Endpoint = [month: string, day: string, year: string, hour: string, minute: string];

const element = () => cy.get<GuiRangeDateTimeInput>('gui-range-date-time');
const part = (group: Group, type: string) =>
  cy.get(`gui-range-date-time [data-group="${group}"][data-type="${type}"]`);
const pills = () => cy.get('gui-range-date-time .gui-pills__pill');

const typeEndpoint = (group: Group, [month, day, year, hour, minute]: Endpoint) => {
  part(group, 'month').click();
  for (const digits of [month, day, year, hour, minute]) cy.focused().type(digits);
};

const june = [{ start: '2026-06-10T09:00:00', end: '2026-06-12T17:00:00' }];
/** Matches an event the element dispatched itself, not one bubbling from an element inside it. */
const dispatchedBy = (el: Element) =>
  Cypress.sinon.match((event: Event) => event.target === el, 'dispatched by the element');

describe('gui-range-date-time', () => {
  describe('rendering', () => {
    it('renders both endpoints in the locale part order with their names', () => {
      cy.mount(
        html`<gui-range-date-time
          label="Shift"
          locale-id="en-US"
          start-date-time-aria-label="From"
          end-date-time-aria-label="Until"
        ></gui-range-date-time>`,
      );

      cy.get('gui-range-date-time [data-group="start"]').should(($parts) => {
        expect($parts.toArray().map((el) => el.getAttribute('data-type'))).to.deep.equal([
          'month',
          'day',
          'year',
          'hour',
          'minute',
          'dayPeriod',
        ]);
      });
      part('end', 'dayPeriod').should('contain.text', 'AM');
      cy.get('gui-range-date-time [role="group"][aria-label="From"]').should('exist');
      cy.get('gui-range-date-time [role="group"][aria-label="Until"]').should('exist');
      cy.get('gui-range-date-time .gui-label').should('contain.text', 'Shift');
    });
  });

  describe('value', () => {
    it('fires gui-parts-change while typing and gui-change with the range on Enter', () => {
      const onParts = cy.spy().as('parts');
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date-time
          label="Shift"
          locale-id="en-US"
          @gui-parts-change=${onParts}
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-range-date-time>`,
      );

      typeEndpoint('start', ['06', '15', '2026', '09', '00']);
      typeEndpoint('end', ['06', '15', '2026', '05', '30']);
      part('end', 'dayPeriod').click();

      cy.get('@parts')
        .its('lastCall.args.0.detail')
        .should('deep.equal', {
          start: { date: '2026-06-15', time: '09:00:00' },
          end: { date: '2026-06-15', time: '17:30:00' },
        });
      cy.get('@change').should('not.have.been.called');

      part('end', 'minute').type('{enter}');

      const value = [{ start: '2026-06-15T09:00:00', end: '2026-06-15T17:30:00' }];
      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value });
      pills().should('have.length', 1);
      element().should(([el]) => expect(el.value).to.deep.equal(value));
    });

    it('fires gui-input-error for a date-time past max-date-time', () => {
      const onError = cy.spy().as('error');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date-time
          label="Shift"
          locale-id="en-US"
          max-date-time="2026-06-15T12:00:00"
          max-date-time-message="Too late"
          @gui-input-error=${onError}
          @gui-change=${onChange}
        ></gui-range-date-time>`,
      );

      typeEndpoint('start', ['06', '15', '2026', '09', '00']);
      typeEndpoint('end', ['06', '16', '2026', '09', '00']);
      part('end', 'minute').type('{enter}');

      cy.get('@error').its('lastCall.args.0.detail').should('deep.equal', { message: 'Too late' });
      cy.get('@change').should('not.have.been.called');
      pills().should('not.exist');
    });

    it('fires gui-input-error and gui-blur when focus leaves a half-typed range', () => {
      const onError = cy.spy().as('error');
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-range-date-time
            label="Shift"
            locale-id="en-US"
            incomplete-message="Finish the range"
            @gui-input-error=${onError}
            @gui-blur=${onBlur}
          ></gui-range-date-time>
          <button>Next</button>`,
      );

      typeEndpoint('start', ['06', '15', '2026', '09', '00']);
      cy.get('@blur').should('not.have.been.called');
      cy.get('button').contains('Next').focus();

      cy.get('@error')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'Finish the range' });
      cy.get('@blur').should('have.been.calledOnce');
    });

    it('fires gui-focus when a part receives focus', () => {
      const onFocus = cy.spy().as('focus');
      cy.mount(
        html`<gui-range-date-time
          label="Shift"
          locale-id="en-US"
          @gui-focus=${onFocus}
        ></gui-range-date-time>`,
      );

      part('end', 'hour').focus();

      cy.get('@focus').should('have.been.calledOnce');
      cy.get('@focus')
        .its('firstCall.args.0.detail.target')
        .should('have.attr', 'data-type', 'hour');
    });

    it('renders a pill per range, fires gui-range-click when clicked and gui-change when removed', () => {
      const onClick = cy.spy().as('click');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date-time
          label="Shift"
          locale-id="en-US"
          remove-pill-aria-label="Drop range"
          .value=${june}
          @gui-range-click=${onClick}
          @gui-change=${onChange}
        ></gui-range-date-time>`,
      );

      pills()
        .should('have.length', 1)
        .and('contain.text', '06/10/2026')
        .and('contain.text', '09:00')
        .and('contain.text', '06/12/2026')
        .and('contain.text', '05:00')
        .and('have.attr', 'aria-description', 'Drop range');
      cy.get('gui-range-date-time .gui-pills__pill-text').click({ force: true });
      cy.get('@click').its('firstCall.args.0.detail').should('deep.equal', { range: june[0] });

      cy.get('gui-range-date-time .gui-pills__pill-remove').click({ force: true });
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: [] });
      pills().should('not.exist');
    });

    it('fires gui-edit-state-change as a pill is selected and edited', () => {
      const onEditState = cy.spy().as('editState');
      cy.mount(
        html`<gui-range-date-time
          label="Shift"
          locale-id="en-US"
          allow-edit
          .value=${june}
          @gui-edit-state-change=${onEditState}
        ></gui-range-date-time>`,
      );

      pills().first().click({ force: true });
      cy.get('@editState')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { selected: june[0], editing: false });

      pills().first().type('e', { force: true });
      cy.get('@editState')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { selected: june[0], editing: true });
      part('end', 'day').should('have.value', '12');
      part('end', 'hour').should('have.value', '05');
      part('end', 'dayPeriod').should('contain.text', 'PM');
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
            <gui-range-date-time
              label="Shift"
              locale-id="en-US"
              allow-edit
              incomplete-message="Finish the range"
              .value=${june}
            ></gui-range-date-time>
          </div>
          <button id="outside">Outside</button>`,
      );

      cy.get('gui-range-date-time .gui-pills__pill-text').click({ force: true });
      typeEndpoint('start', ['06', '20', '2026', '09', '00']);
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
        html`<gui-range-date-time
          label="Shift"
          locale-id="en-US"
          .value=${june}
        ></gui-range-date-time>`,
      );

      element().invoke('prop', 'value', [
        { start: '2026-09-01T08:00:00', end: '2026-09-01T10:00:00' },
      ]);

      pills().should('have.length', 1).and('contain.text', '09/01/2026');
    });
  });

  describe('keyboard', () => {
    it('steps a part and toggles AM/PM with the arrow keys', () => {
      cy.mount(html`<gui-range-date-time label="Shift" locale-id="en-US"></gui-range-date-time>`);

      part('start', 'hour').type('{upArrow}{upArrow}');
      part('start', 'hour').should('have.value', '02');
      part('start', 'dayPeriod').focus().trigger('keydown', { key: 'ArrowUp' });
      part('start', 'dayPeriod').trigger('keyup', { key: 'ArrowUp' });
      part('start', 'dayPeriod').should('contain.text', 'PM');
    });

    it('moves from the first part to the last pill with ArrowLeft and removes it with Delete', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-date-time
          label="Shift"
          locale-id="en-US"
          .value=${june}
          @gui-change=${onChange}
        ></gui-range-date-time>`,
      );

      part('start', 'month').focus().type('{leftArrow}');
      cy.focused().should('have.class', 'gui-pills__pill').type('{del}');

      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: [] });
    });
  });

  describe('states', () => {
    it('makes its parts read-only and locks its pills', () => {
      cy.mount(
        html`<gui-range-date-time
          label="Shift"
          locale-id="en-US"
          readonly
          .value=${june}
        ></gui-range-date-time>`,
      );

      cy.get('gui-range-date-time input').each((input) =>
        cy.wrap(input).should('have.attr', 'readonly'),
      );
      pills().should('be.disabled');
    });

    it('disables its parts and pills', () => {
      cy.mount(
        html`<gui-range-date-time
          label="Shift"
          locale-id="en-US"
          disabled
          .value=${june}
        ></gui-range-date-time>`,
      );

      cy.get('gui-range-date-time input').should('be.disabled');
      part('start', 'dayPeriod').should('be.disabled');
      pills().should('be.disabled');
    });
  });
});
