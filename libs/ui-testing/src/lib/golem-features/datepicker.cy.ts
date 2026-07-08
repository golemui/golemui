import { defineForm } from '@golemui/core';
import { type MountComponentFn } from '../utils';

export const runDatePickerComponentTests = (mountFn: MountComponentFn) => {
  describe('DatePicker Component', () => {
    const mountWithDate = (formSubmit?: (event: any) => void) => {
      mountFn({
        data: { myDate: '2026-06-15' },
        formDef: defineForm({
          form: [
            {
              uid: 'testSubject',
              kind: 'input',
              type: 'datePicker',
              path: 'myDate',
            },
            {
              uid: 'submitBtn',
              kind: 'action',
              type: 'button',
              label: 'Submit',
              actionType: 'submit',
            },
          ],
        }),
        formSubmit,
      });
    };

    // These specs guard against timezone regressions: date-only ISO strings
    // parsed as UTC render as the previous day in timezones behind UTC

    it('should display the default value date parts regardless of timezone', () => {
      mountWithDate();

      cy.get('gui-date input[data-type="day"]').should('have.value', '15');
      cy.get('gui-date input[data-type="month"]').should('have.value', '06');
      cy.get('gui-date input[data-type="year"]').should('have.value', '2026');
    });

    it('should highlight the day of the current value in the calendar', () => {
      mountWithDate();

      cy.get('gui-date input[data-type="day"]').click();
      cy.get('gui-calendar button[data-date="2026-06-15"]').should(
        'have.attr',
        'aria-selected',
        'true',
      );
    });

    it('should keep the calendar open when keyboard navigation crosses a month boundary', () => {
      mountWithDate();

      cy.get('gui-date input[data-type="day"]').click();
      cy.get('gui-calendar button[data-date="2026-06-30"]').focus();
      // ArrowDown from the last week re-renders the calendar into July; the
      // focused button is removed mid-navigation and must not close the picker
      cy.focused().type('{downArrow}');

      cy.get('gui-calendar').should('exist');
      cy.focused()
        .should('have.class', 'gui-calendar__day-button')
        .invoke('attr', 'data-date')
        .should('contain', '2026-07');
    });

    it('should select the exact day that is clicked', () => {
      const formSubmitHandler = cy.stub().as('formSubmitHandler');
      mountWithDate(formSubmitHandler);

      cy.get('gui-date input[data-type="day"]').click();
      cy.get('gui-calendar button[data-date="2026-06-18"]').click();

      // The date input must show the clicked day, not the day before
      cy.get('gui-date input[data-type="day"]').should('have.value', '18');
      cy.get('gui-date input[data-type="month"]').should('have.value', '06');
      cy.get('gui-date input[data-type="year"]').should('have.value', '2026');

      // Re-opening the calendar must highlight the clicked day
      cy.get('gui-date input[data-type="day"]').click();
      cy.get('gui-calendar button[data-date="2026-06-18"]').should(
        'have.attr',
        'aria-selected',
        'true',
      );

      // Close the calendar so it does not cover the submit button
      cy.get('body').click(0, 0);
      cy.get('gui-calendar').should('not.exist');

      // The submitted value must be the clicked day
      cy.get('[data-cy="submitBtn_button"]').click();
      cy.get('@formSubmitHandler').then((stub: any) => {
        const submittedData = stub.getCall(0).args[0].data;
        expect(submittedData).to.deep.equal({ myDate: '2026-06-18' });
      });
    });
  });
};
