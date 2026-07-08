import { defineForm, identityTranslator } from '@golemui/core';
import { type MountComponentFn } from '../utils';

// Behavior tests for the gui-range-date-picker web component. They pin the
// open/close model that used to be hand-rolled per framework (open on input
// interaction, stay open across range selection, close on outside click or
// focus leaving the picker, pill click navigating to the range's month).
export const runRangeDatePickerComponentTests = (mountFn: MountComponentFn) => {
  describe('RangeDatePicker Component', () => {
    const uid = 'testSubject';
    const sel = {
      startMonth: 'gui-range-date input[data-group="start"][data-type="month"]',
      calendar: 'gui-range-calendar',
      pillText: 'gui-range-date .gui-pills__pill-text',
      dayButton: (date: string) => `gui-range-calendar button[data-date="${date}"]`,
    };

    const mountRangeDatePicker = (options?: {
      data?: Record<string, any>;
      formSubmit?: (event: any) => void;
      readonly?: boolean;
      disabled?: boolean;
    }) => {
      mountFn({
        localization: identityTranslator('en-US'),
        data: options?.data,
        formDef: defineForm({
          form: [
            {
              uid,
              kind: 'input',
              type: 'rangeDatePicker',
              path: 'myRanges',
              ...(options?.readonly !== undefined ? { readonly: options.readonly } : {}),
              ...(options?.disabled !== undefined ? { disabled: options.disabled } : {}),
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
        formSubmit: options?.formSubmit,
      });
    };

    const juneRange = { start: '2026-06-10', end: '2026-06-12' };
    const marchRange = { start: '2026-03-05', end: '2026-03-07' };

    it('should not render the calendar initially', () => {
      mountRangeDatePicker({ data: { myRanges: [juneRange] } });

      cy.get(sel.calendar).should('not.exist');
    });

    it('should open the calendar when clicking a date input part', () => {
      mountRangeDatePicker({ data: { myRanges: [juneRange] } });

      cy.get(sel.startMonth).click();
      cy.get(sel.calendar).should('exist');
    });

    it('should keep the calendar open across a range selection and submit both ranges', () => {
      const formSubmitHandler = cy.stub().as('formSubmitHandler');
      mountRangeDatePicker({ data: { myRanges: [juneRange] }, formSubmit: formSubmitHandler });

      cy.get(sel.startMonth).click();

      // First click anchors the range and must not close the calendar
      cy.get(sel.dayButton('2026-06-18')).click();
      cy.get(sel.calendar).should('exist');

      // Second click commits the range; the range picker stays open so the
      // user can select more ranges
      cy.get(sel.dayButton('2026-06-20')).click();
      cy.get(sel.calendar).should('exist');
      cy.get(sel.pillText).should('have.length', 2);

      cy.get('body').click(0, 0);
      cy.get(sel.calendar).should('not.exist');

      cy.get('[data-cy="submitBtn_button"]').click();
      cy.get('@formSubmitHandler').then((stub: any) => {
        const submittedData = stub.getCall(0).args[0].data;
        expect(submittedData).to.deep.equal({
          myRanges: [juneRange, { start: '2026-06-18', end: '2026-06-20' }],
        });
      });
    });

    it('should keep the calendar open when keyboard navigation crosses a month boundary', () => {
      mountRangeDatePicker({ data: { myRanges: [juneRange] } });

      cy.get(sel.startMonth).click();
      cy.get(sel.dayButton('2026-06-30')).focus();
      // ArrowDown from the last week re-renders the calendar into July; the
      // focused button is removed mid-navigation and must not close the picker
      cy.focused().type('{downArrow}');

      cy.get(sel.calendar).should('exist');
      cy.focused()
        .should('have.class', 'gui-calendar__day-button')
        .invoke('attr', 'data-date')
        .should('contain', '2026-07');
    });

    it('should close the calendar when clicking outside', () => {
      mountRangeDatePicker({ data: { myRanges: [juneRange] } });

      cy.get(sel.startMonth).click();
      cy.get(sel.calendar).should('exist');

      cy.get('body').click(0, 0);
      cy.get(sel.calendar).should('not.exist');
    });

    it('should close the calendar when focus leaves the picker', () => {
      mountRangeDatePicker({ data: { myRanges: [juneRange] } });

      cy.get(sel.startMonth).click();
      cy.get(sel.calendar).should('exist');

      cy.get('[data-cy="submitBtn_button"]').focus();
      cy.get(sel.calendar).should('not.exist');
    });

    it('should open the calendar at the month of the clicked pill', () => {
      mountRangeDatePicker({ data: { myRanges: [juneRange, marchRange] } });

      // The clicked pill's range lives in a different month than the other.
      // force: gui-pills may collapse to compact mode in narrow harnesses
      cy.get(sel.pillText).contains('03/05/2026').click({ force: true });
      cy.get(sel.calendar).should('exist');
      cy.get(sel.dayButton(marchRange.start)).should('exist');
    });

    it('should not open the calendar when disabled', () => {
      mountRangeDatePicker({ data: { myRanges: [juneRange] }, disabled: true });

      cy.get(`.gui-range-date-picker .gui-widget`).first().click({ force: true });
      cy.get(sel.calendar).should('not.exist');
    });

    it('should not allow range selection when readonly', () => {
      mountRangeDatePicker({ data: { myRanges: [juneRange] }, readonly: true });

      cy.get(sel.startMonth).click();
      cy.get(sel.calendar).should('exist');

      cy.get(sel.dayButton('2026-06-18')).click();
      cy.get(sel.dayButton('2026-06-20')).click();
      cy.get(sel.pillText).should('have.length', 1);
    });
  });
};
