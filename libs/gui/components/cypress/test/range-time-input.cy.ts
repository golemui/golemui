import { html } from 'lit';
import type { GuiRangeTimeInput } from '../../src/lib/components/range-time-input';

type Group = 'start' | 'end';

const element = () => cy.get<GuiRangeTimeInput>('gui-range-time');
const part = (group: Group, type: string) =>
  cy.get(`gui-range-time [data-group="${group}"][data-type="${type}"]`);
const pills = () => cy.get('gui-range-time .gui-pills__pill');

const typeTime = (group: Group, hour: string, minute: string, pm = false) => {
  part(group, 'hour').click();
  cy.focused().type(hour);
  cy.focused().type(minute);
  if (pm) part(group, 'dayPeriod').click();
};

const shift = [{ start: '09:00:00', end: '17:00:00' }];
/** Matches an event the element dispatched itself, not one bubbling from an element inside it. */
const dispatchedBy = (el: Element) =>
  Cypress.sinon.match((event: Event) => event.target === el, 'dispatched by the element');

describe('gui-range-time', () => {
  describe('rendering', () => {
    it('renders both endpoints in the locale part order with their names', () => {
      cy.mount(
        html`<gui-range-time
          label="Shift"
          locale-id="en-US"
          separator="to"
          start-time-aria-label="Clock in"
          end-time-aria-label="Clock out"
        ></gui-range-time>`,
      );

      cy.get('gui-range-time [data-group]').should(($parts) => {
        const parts = $parts
          .toArray()
          .map((el) => `${el.getAttribute('data-group')}-${el.getAttribute('data-type')}`);
        expect(parts).to.deep.equal([
          'start-hour',
          'start-minute',
          'start-dayPeriod',
          'end-hour',
          'end-minute',
          'end-dayPeriod',
        ]);
      });
      part('start', 'dayPeriod').should('contain.text', 'AM');
      cy.get('gui-range-time [role="group"][aria-label="Clock in"]').should('exist');
      cy.get('gui-range-time [role="group"][aria-label="Clock out"]').should('exist');
      cy.get(
        'gui-range-time .gui-range-time-input__inputs > .gui-range-time-input__separator',
      ).should('have.text', 'to');
      cy.get('gui-range-time .gui-label').should('contain.text', 'Shift');
    });
  });

  describe('value', () => {
    it('fires gui-parts-change while typing and gui-change with the range on Enter', () => {
      const onParts = cy.spy().as('parts');
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-time
          label="Shift"
          locale-id="en-US"
          @gui-parts-change=${onParts}
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-range-time>`,
      );

      typeTime('start', '09', '00');
      typeTime('end', '05', '30', true);

      cy.get('@parts')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { start: '09:00:00', end: '17:30:00' });
      cy.get('@change').should('not.have.been.called');

      part('end', 'minute').type('{enter}');

      const value = [{ start: '09:00:00', end: '17:30:00' }];
      cy.get('@input').its('lastCall.args.0.detail').should('deep.equal', { value });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value });
      pills().should('contain.text', '09:00 AM - 05:30 PM');
      element().should(([el]) => expect(el.value).to.deep.equal(value));
    });

    it('fires gui-input-error for a time past max-time', () => {
      const onError = cy.spy().as('error');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-time
          label="Shift"
          locale-id="en-US"
          max-time="18:00:00"
          max-time-message="Too late"
          @gui-input-error=${onError}
          @gui-change=${onChange}
        ></gui-range-time>`,
      );

      typeTime('start', '09', '00');
      typeTime('end', '07', '00', true);
      part('end', 'minute').type('{enter}');

      cy.get('@error').its('lastCall.args.0.detail').should('deep.equal', { message: 'Too late' });
      cy.get('@change').should('not.have.been.called');
      pills().should('not.exist');
    });

    it('fires gui-input-error for an end before the start', () => {
      const onError = cy.spy().as('error');
      cy.mount(
        html`<gui-range-time
          label="Shift"
          locale-id="en-US"
          range-order-message="End after start"
          @gui-input-error=${onError}
        ></gui-range-time>`,
      );

      typeTime('start', '05', '00', true);
      typeTime('end', '09', '00');
      part('end', 'minute').type('{enter}');

      cy.get('@error')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { message: 'End after start' });
      pills().should('not.exist');
    });

    it('fires gui-input-error and gui-blur when focus leaves a half-typed range', () => {
      const onError = cy.spy().as('error');
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-range-time
            label="Shift"
            locale-id="en-US"
            incomplete-message="Finish the range"
            @gui-input-error=${onError}
            @gui-blur=${onBlur}
          ></gui-range-time>
          <button>Next</button>`,
      );

      typeTime('start', '09', '00');
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
        html`<gui-range-time
          label="Shift"
          locale-id="en-US"
          @gui-focus=${onFocus}
        ></gui-range-time>`,
      );

      part('end', 'minute').focus();

      cy.get('@focus').should('have.been.calledOnce');
      cy.get('@focus')
        .its('firstCall.args.0.detail.target')
        .should('have.attr', 'data-type', 'minute');
    });

    it('renders a pill per range, fires gui-range-click when clicked and gui-change when removed', () => {
      const onClick = cy.spy().as('click');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-time
          label="Shift"
          locale-id="en-US"
          remove-pill-aria-label="Drop range"
          .value=${shift}
          @gui-range-click=${onClick}
          @gui-change=${onChange}
        ></gui-range-time>`,
      );

      pills()
        .should('have.length', 1)
        .and('contain.text', '09:00 AM - 05:00 PM')
        .and('have.attr', 'aria-description', 'Drop range');
      cy.get('gui-range-time .gui-pills__pill-text').click({ force: true });
      cy.get('@click').its('firstCall.args.0.detail').should('deep.equal', { range: shift[0] });

      cy.get('gui-range-time .gui-pills__pill-remove').click({ force: true });
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: [] });
      pills().should('not.exist');
    });

    it('fires gui-edit-state-change as a pill is selected and edited', () => {
      const onEditState = cy.spy().as('editState');
      cy.mount(
        html`<gui-range-time
          label="Shift"
          locale-id="en-US"
          allow-edit
          .value=${shift}
          @gui-edit-state-change=${onEditState}
        ></gui-range-time>`,
      );

      pills().first().click({ force: true });
      cy.get('@editState')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { selected: shift[0], editing: false });

      pills().first().type('e', { force: true });
      cy.get('@editState')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { selected: shift[0], editing: true });
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
            <gui-range-time
              label="Shift"
              locale-id="en-US"
              allow-edit
              incomplete-message="Finish the range"
              .value=${shift}
            ></gui-range-time>
          </div>
          <button id="outside">Outside</button>`,
      );

      cy.get('gui-range-time .gui-pills__pill-text').click({ force: true });
      typeTime('start', '10', '00');
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
        html`<gui-range-time label="Shift" locale-id="en-US" .value=${shift}></gui-range-time>`,
      );

      element().invoke('prop', 'value', [{ start: '08:00:00', end: '10:00:00' }]);

      pills().should('have.length', 1).and('contain.text', '08:00 AM - 10:00 AM');
    });
  });

  describe('keyboard', () => {
    it('steps a part with the arrow keys and removes the last pill from the first part', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-range-time
          label="Shift"
          locale-id="en-US"
          .value=${shift}
          @gui-change=${onChange}
        ></gui-range-time>`,
      );

      part('start', 'hour').type('{upArrow}{upArrow}');
      part('start', 'hour').should('have.value', '02');
      part('start', 'hour').type('{selectAll}{backspace}{backspace}{leftArrow}');
      cy.focused().should('have.class', 'gui-pills__pill').type('{del}');

      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: [] });
    });
  });

  describe('states', () => {
    it('makes its parts read-only and locks its pills', () => {
      cy.mount(
        html`<gui-range-time
          label="Shift"
          locale-id="en-US"
          readonly
          .value=${shift}
        ></gui-range-time>`,
      );

      cy.get('gui-range-time input').each((input) =>
        cy.wrap(input).should('have.attr', 'readonly'),
      );
      pills().should('be.disabled');
    });

    it('disables its parts and pills', () => {
      cy.mount(
        html`<gui-range-time
          label="Shift"
          locale-id="en-US"
          disabled
          .value=${shift}
        ></gui-range-time>`,
      );

      cy.get('gui-range-time input').should('be.disabled');
      part('start', 'dayPeriod').should('be.disabled');
      pills().should('be.disabled');
    });
  });
});
