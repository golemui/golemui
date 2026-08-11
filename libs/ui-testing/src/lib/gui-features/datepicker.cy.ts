import { defineForm, identityTranslator } from '@golemui/core';
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

    const mountWithProps = (options: {
      data?: Record<string, any>;
      props?: Record<string, any>;
      formSubmit?: (event: any) => void;
    }) => {
      mountFn({
        localization: identityTranslator('en-US'),
        data: options.data,
        formDef: defineForm({
          form: [
            {
              uid: 'testSubject',
              kind: 'input',
              type: 'datePicker',
              path: 'myDate',
              ...(options.props ? { props: options.props } : {}),
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
        formSubmit: options.formSubmit,
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

    it('should close the calendar with Escape and restore focus to the input', () => {
      mountWithDate();

      cy.get('gui-date input[data-type="day"]').click();
      cy.get('gui-calendar').should('exist');

      // Escape from a focused day button closes the calendar
      cy.get('gui-calendar button[data-date="2026-06-15"]').focus();
      cy.focused().type('{esc}');

      cy.get('gui-calendar').should('not.exist');
      cy.focused().should('match', 'gui-date input');
    });

    it('should consume Escape while the calendar is open so it does not bubble to a modal', () => {
      mountWithDate();

      // A modal ancestor typically closes on a document-level Escape keydown.
      const escSpy = cy.spy().as('escSpy');
      cy.document().then((doc) => {
        doc.addEventListener('keydown', (e) => {
          if ((e as KeyboardEvent).key === 'Escape') escSpy();
        });
      });

      cy.get('gui-date input[data-type="day"]').click();
      cy.get('gui-calendar').should('exist');

      // Escape closes the calendar and is consumed — it must not reach document
      cy.get('gui-calendar button[data-date="2026-06-15"]').focus();
      cy.focused().type('{esc}');
      cy.get('gui-calendar').should('not.exist');
      cy.get('@escSpy').should('not.have.been.called');

      // With the calendar closed, Escape is free to bubble (so a modal can close)
      cy.get('gui-date input[data-type="day"]').trigger('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      cy.get('@escSpy').should('have.been.called');
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

    it('should advance the value and emit inputError when a typed date is out of bounds', () => {
      mountWithProps({
        props: { maxDate: '2026-06-20', maxDateMessage: 'Too far out' },
      });

      const changeSpy = cy.spy().as('changeSpy');
      const inputErrorSpy = cy.spy().as('inputErrorSpy');
      cy.get('gui-date-picker').then(($el) => {
        $el[0].addEventListener('change', changeSpy as unknown as EventListener);
        $el[0].addEventListener('inputError', inputErrorSpy as unknown as EventListener);
      });

      // Type a full date 06/25/2026 (en-US order), past maxDate. gui-date has no
      // date bounds, so it commits the date; the picker validates it. The value
      // advances (the field shows the 25th) and the picker surfaces the error.
      cy.get('gui-date input[data-type="month"]').click();
      cy.focused().type('06');
      cy.focused().type('25');
      cy.focused().type('2026');

      cy.get('gui-date input[data-type="day"]').should('have.value', '25');
      cy.get('@changeSpy').should('have.been.called');
      cy.get('@inputErrorSpy').then((spy: any) => {
        expect(spy.getCall(0).args[0].detail.message).to.equal('Too far out');
      });
    });

    describe('incomplete input on focus leave', () => {
      it('should flip a partial typed date to null with an incomplete error when focus leaves', () => {
        // Non-required field: the null report still marks it invalid, so the
        // lingering partial is caught without a required validator
        mountWithProps({});

        cy.get('gui-date input[data-type="month"]').click();
        cy.focused().type('06');
        cy.get('[data-cy="submitBtn_button"]').focus();

        cy.get('[data-cy="testSubject_validator-error"]').should('contain.text', 'Incomplete date');
      });

      it('should clear the incomplete error when the emptied picker is left again', () => {
        // Regression: leave a partial behind (incomplete error), come back,
        // empty the field and leave again — the error must not outlive
        // fields that no longer hold anything.
        mountWithProps({});

        cy.get('gui-date input[data-type="month"]').click();
        cy.focused().type('06');
        cy.get('[data-cy="submitBtn_button"]').focus();
        cy.get('[data-cy="testSubject_validator-error"]').should('contain.text', 'Incomplete date');

        cy.get('gui-date input[data-type="month"]').type('{selectAll}{backspace}');
        cy.get('[data-cy="submitBtn_button"]').focus();
        cy.get('[data-cy="testSubject_validator-errors"]').should('not.exist');
      });

      it('should honor the incompleteMessage prop', () => {
        mountWithProps({ props: { incompleteMessage: 'Incomplete date!' } });

        cy.get('gui-date input[data-type="month"]').click();
        cy.focused().type('06');
        cy.get('[data-cy="submitBtn_button"]').focus();

        cy.get('[data-cy="testSubject_validator-error"]').should(
          'contain.text',
          'Incomplete date!',
        );
      });
    });

    describe('accessibility', () => {
      const toggleSel = 'button.gui-date-picker__arrow';

      it('should expose a named popup toggle button', () => {
        mountWithDate();
        cy.get(toggleSel)
          .should('have.attr', 'aria-label', 'Show calendar')
          .should('have.attr', 'aria-haspopup', 'dialog')
          .should('have.attr', 'aria-expanded', 'false')
          .should('have.attr', 'aria-controls', 'testSubject_popup');
      });

      it('should open a dialog from the toggle and move focus into the calendar', () => {
        mountWithDate();
        cy.get(toggleSel).click();
        cy.get(toggleSel).should('have.attr', 'aria-expanded', 'true');
        cy.get('gui-calendar')
          .should('have.attr', 'role', 'dialog')
          .should('have.id', 'testSubject_popup');
        cy.focused().should('have.class', 'gui-calendar__day-button');
      });

      it('should close the popup from the toggle button', () => {
        mountWithDate();
        cy.get(toggleSel).click();
        cy.get('gui-calendar').should('exist');
        cy.get(toggleSel).click();
        cy.get('gui-calendar').should('not.exist');
        cy.get(toggleSel).should('have.attr', 'aria-expanded', 'false');
      });

      it('should return focus to the input when Escape closes the popup', () => {
        mountWithDate();
        cy.get(toggleSel).click();
        cy.focused().should('have.class', 'gui-calendar__day-button');
        cy.focused().type('{esc}');
        cy.get('gui-calendar').should('not.exist');
        cy.focused().should('have.class', 'gui-parts__part');
      });

      it('should honor the toggle aria-label override', () => {
        mountWithProps({ props: { toggleAriaLabel: 'Abrir calendario' } });
        cy.get(toggleSel).should('have.attr', 'aria-label', 'Abrir calendario');
      });

      it('should not duplicate the widget id while the popup is open', () => {
        mountWithDate();
        cy.get(toggleSel).click();
        cy.get('gui-calendar').should('exist');
        // The date input's segment group owns the bare uid; the calendar
        // chrome carries the _calendar suffix
        cy.get('[id="testSubject"]').should('have.length', 1);
        cy.get('[id="testSubject_calendar"]').should('have.length', 1);
      });
    });
  });
};
