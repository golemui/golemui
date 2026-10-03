import { html } from 'lit';
import type { GuiTimeList } from '../../src/lib/components/time-list';

const options = () => cy.get('gui-time-list .gui-time-list__option');
const option = (value: string) => cy.get(`gui-time-list [data-value="${value}"]`);
const element = () => cy.get<GuiTimeList>('gui-time-list');

const labels = ($options: JQuery<HTMLElement>) =>
  $options.toArray().map((el) => el.textContent?.trim());

describe('gui-time-list', () => {
  describe('rendering', () => {
    it('lists the times between min-time and max-time every minute-step', () => {
      cy.mount(
        html`<gui-time-list
          label="At"
          locale-id="en-US"
          min-time="09:00:00"
          max-time="11:00:00"
          minute-step="30"
        ></gui-time-list>`,
      );

      cy.get('gui-time-list [role="listbox"]').should('have.attr', 'aria-label', 'At');
      options().should(($options) => {
        expect(labels($options)).to.deep.equal([
          '09:00 AM',
          '09:30 AM',
          '10:00 AM',
          '10:30 AM',
          '11:00 AM',
        ]);
      });
      options().first().should('have.attr', 'role', 'option').and('have.attr', 'tabindex', '0');
    });

    it('writes the times on a 24-hour clock with hour-format', () => {
      cy.mount(
        html`<gui-time-list
          label="At"
          locale-id="en-US"
          hour-format="24"
          min-time="13:00:00"
          max-time="14:00:00"
          minute-step="60"
        ></gui-time-list>`,
      );

      options().should(($options) => expect(labels($options)).to.deep.equal(['13:00', '14:00']));
    });

    it('lays the times out in a grid of columns', () => {
      cy.mount(
        html`<gui-time-list
          label="At"
          locale-id="en-US"
          min-time="09:00:00"
          max-time="11:00:00"
          minute-step="30"
          columns="2"
        ></gui-time-list>`,
      );

      cy.get('gui-time-list [role="grid"] [role="row"]').should('have.length', 3);
      cy.get('gui-time-list [role="gridcell"]').should('have.length', 5);
    });

    it('disables the times inside disabled-ranges', () => {
      cy.mount(
        html`<gui-time-list
          label="At"
          locale-id="en-US"
          min-time="09:00:00"
          max-time="11:00:00"
          minute-step="30"
          disabled-ranges='[{"start":"09:30:00","end":"10:00:00"}]'
        ></gui-time-list>`,
      );

      option('09:30:00').should('be.disabled').and('have.attr', 'aria-disabled', 'true');
      option('10:00:00').should('be.disabled');
      option('10:30:00').should('not.be.disabled').and('have.attr', 'aria-disabled', 'false');
    });

    it('shows no-available-times-message when no time fits the bounds', () => {
      cy.mount(
        html`<gui-time-list
          label="At"
          locale-id="en-US"
          min-time="12:00:00"
          max-time="11:00:00"
          no-available-times-message="Fully booked"
        ></gui-time-list>`,
      );

      cy.get('gui-time-list .gui-time-list__empty').should('contain.text', 'Fully booked');
      options().should('not.exist');
    });
  });

  describe('value', () => {
    it('fires gui-input and gui-change when a time is picked', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-time-list
          label="At"
          locale-id="en-US"
          min-time="09:00:00"
          max-time="11:00:00"
          minute-step="30"
          @gui-input=${onInput}
          @gui-change=${onChange}
        ></gui-time-list>`,
      );

      option('10:30:00').click();

      cy.get('@input').its('firstCall.args.0.detail').should('deep.equal', { value: '10:30:00' });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: '10:30:00' });
      element().should('have.prop', 'value', '10:30:00');
      option('10:30:00')
        .should('have.attr', 'aria-selected', 'true')
        .and('have.attr', 'tabindex', '0');
    });

    it('selects a value set from outside', () => {
      cy.mount(
        html`<gui-time-list
          label="At"
          locale-id="en-US"
          min-time="09:00:00"
          max-time="11:00:00"
          minute-step="30"
          value="09:30:00"
        ></gui-time-list>`,
      );
      option('09:30:00').should('have.attr', 'aria-selected', 'true');

      element().invoke('prop', 'value', '11:00:00');

      option('11:00:00').should('have.attr', 'aria-selected', 'true');
      option('09:30:00').should('have.attr', 'aria-selected', 'false');
    });
  });

  describe('keyboard', () => {
    it('moves through the times with the arrows, skipping disabled ones, and picks with Enter', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-time-list
          label="At"
          locale-id="en-US"
          min-time="09:00:00"
          max-time="11:00:00"
          minute-step="30"
          .disabledRanges=${[{ start: '09:30:00', end: '10:00:00' }]}
          @gui-change=${onChange}
        ></gui-time-list>`,
      );

      option('09:00:00').focus().type('{downArrow}');
      cy.focused().should('have.attr', 'data-value', '10:30:00');
      cy.focused().type('{end}');
      cy.focused().should('have.attr', 'data-value', '11:00:00');
      cy.focused().type('{upArrow}{enter}');

      cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: '10:30:00' });
    });

    it('moves across columns with the left and right arrows in a grid', () => {
      cy.mount(
        html`<gui-time-list
          label="At"
          locale-id="en-US"
          min-time="09:00:00"
          max-time="11:00:00"
          minute-step="30"
          columns="2"
        ></gui-time-list>`,
      );

      option('09:00:00').focus().type('{rightArrow}');
      cy.focused().should('have.attr', 'data-value', '09:30:00');
      cy.focused().type('{downArrow}');
      cy.focused().should('have.attr', 'data-value', '10:30:00');
      cy.focused().type('{home}');
      cy.focused().should('have.attr', 'data-value', '09:00:00');
    });
  });

  describe('states', () => {
    it('keeps its value when read-only', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-time-list
          label="At"
          locale-id="en-US"
          min-time="09:00:00"
          max-time="11:00:00"
          minute-step="30"
          value="09:30:00"
          readonly
          @gui-change=${onChange}
        ></gui-time-list>`,
      );

      option('10:30:00').click();

      cy.get('@change').should('not.have.been.called');
      element().should('have.prop', 'value', '09:30:00');
    });

    it('disables every time', () => {
      cy.mount(
        html`<gui-time-list
          label="At"
          locale-id="en-US"
          min-time="09:00:00"
          max-time="11:00:00"
          minute-step="30"
          disabled
        ></gui-time-list>`,
      );

      options().each(($option) => {
        cy.wrap($option).should('be.disabled').and('have.attr', 'aria-disabled', 'true');
      });
    });
  });
});
