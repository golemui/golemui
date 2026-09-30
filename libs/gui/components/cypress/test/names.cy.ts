import { html } from 'lit';

// How the elements name their parts for assistive technology, across elements. Each element's own
// names are in its spec.
describe('accessible names', () => {
  describe('a control that needs a name', () => {
    it('keeps its default name when given an empty one', () => {
      cy.mount(html`<gui-calendar label="Day" prev-month-aria-label=""></gui-calendar>`);

      cy.get('gui-calendar .gui-calendar__month-button--prev').should(
        'have.attr',
        'aria-label',
        'Previous month',
      );
    });

    it('takes the name it is given', () => {
      cy.mount(html`<gui-calendar label="Day" prev-month-aria-label="Back"></gui-calendar>`);

      cy.get('gui-calendar .gui-calendar__month-button--prev').should(
        'have.attr',
        'aria-label',
        'Back',
      );
    });
  });

  describe('a part that only adds context', () => {
    it('has a default name, which an empty one removes', () => {
      cy.mount(html`<gui-range-date label="Stay" end-date-aria-label=""></gui-range-date>`);

      cy.get('gui-range-date .gui-range-date-input__field')
        .first()
        .should('have.attr', 'aria-label', 'Start date');
      cy.get('gui-range-date .gui-range-date-input__field')
        .last()
        .should('not.have.attr', 'aria-label');
    });
  });

  describe('a field', () => {
    it('is named by its label, not a copy of it', () => {
      cy.mount(html`<gui-tags label="Topics"></gui-tags>`);

      cy.get('gui-tags [role="group"]').should('not.have.attr', 'aria-label');
      cy.get('gui-tags [role="group"]')
        .invoke('attr', 'aria-labelledby')
        .then((id) => {
          cy.get(`#${id}`).should('contain.text', 'Topics');
          cy.get('gui-tags input').should('have.attr', 'aria-labelledby', id);
        });
    });

    it('keeps its hint out of its name, and reads it as its description', () => {
      cy.mount(html`<gui-textinput label="Name" hint="As on your passport"></gui-textinput>`);

      cy.get('gui-textinput .gui-label .gui-widget-hint').should(
        'have.attr',
        'aria-hidden',
        'true',
      );
      cy.get('gui-textinput input')
        .invoke('attr', 'aria-describedby')
        .then((id) => cy.get(`#${id}`).should('have.text', 'As on your passport'));
    });

    it('shows a hint without a label to everyone', () => {
      cy.mount(html`<gui-textinput hint="As on your passport"></gui-textinput>`);

      cy.get('gui-textinput .gui-widget-hint').should('not.have.attr', 'aria-hidden');
    });

    it('warns in development when it has no label', () => {
      cy.window().then((win) => cy.spy(win.console, 'warn').as('warn'));
      cy.mount(html`<gui-tags></gui-tags><gui-range-time label="Shift"></gui-range-time>`);

      cy.get('@warn').should('have.been.calledOnce');
      cy.get('@warn').should('have.been.calledWithMatch', /<gui-tags> has no label/);
    });

    it('inside a picker, is named by the picker label', () => {
      cy.window().then((win) => cy.spy(win.console, 'warn').as('warn'));
      cy.mount(html`<gui-range-date-picker label="Stay"></gui-range-date-picker>`);

      cy.get('gui-range-date [role="group"].gui-range-date-input')
        .invoke('attr', 'aria-labelledby')
        .then((id) => cy.get(`gui-range-date-picker > #${id}`).should('contain.text', 'Stay'));
      cy.get('@warn').should('not.have.been.called');
    });
  });

  describe('a popup dialog', () => {
    it('is named by the field label', () => {
      cy.mount(html`<gui-date-picker label="Start"></gui-date-picker>`);
      cy.get('gui-date-picker button[aria-haspopup]').click();

      cy.get('gui-date-picker [role="dialog"]').should('not.have.attr', 'aria-label');
      cy.get('gui-date-picker [role="dialog"]')
        .invoke('attr', 'aria-labelledby')
        .then((id) => cy.get(`#${id}`).should('contain.text', 'Start'));
    });

    it('has a default name without a label', () => {
      cy.mount(html`<gui-time-picker></gui-time-picker>`);
      cy.get('gui-time-picker button[aria-haspopup]').click();

      cy.get('gui-time-picker [role="dialog"]').should('have.attr', 'aria-label', 'Time list');
    });
  });

  describe('a count', () => {
    it('is read in the right plural form', () => {
      // The pills show the count instead of the strip in a narrow container.
      cy.mount(
        html`<div
          style="container-type: inline-size; container-name: gui-pills-widget; width: 300px"
        >
          <gui-pills .items=${[{ key: 'a', label: 'Alpha' }]}></gui-pills>
        </div>`,
      );

      cy.get('gui-pills .gui-pills__count').should('have.attr', 'aria-label', '1 item');
    });
  });
});
