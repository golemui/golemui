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
      startDay: 'gui-range-date input[data-group="start"][data-type="day"]',
      endDay: 'gui-range-date input[data-group="end"][data-type="day"]',
      calendar: 'gui-range-calendar',
      pillText: 'gui-range-date .gui-pills__pill-text',
      dayButton: (date: string) => `gui-range-calendar button[data-date="${date}"]`,
    };

    const mountRangeDatePicker = (options?: {
      data?: Record<string, any>;
      props?: Record<string, any>;
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
              ...(options?.props ? { props: options.props } : {}),
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

    it('should stay open when navigating to the minDate boundary month', () => {
      // minDate two months back: clicking prev into the boundary month disables
      // the prev arrow that holds focus, which used to drop focus to <body> and
      // close the whole popover.
      const now = new Date();
      const min = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const minIso = `${min.getFullYear()}-${String(min.getMonth() + 1).padStart(2, '0')}-01`;
      mountRangeDatePicker({ props: { minDate: minIso } });

      cy.get(sel.startMonth).click();
      cy.get(sel.calendar).should('exist');

      cy.get(`${sel.calendar} .gui-calendar__month-button--prev`).click();
      cy.get(sel.calendar).should('exist');
      cy.get(`${sel.calendar} .gui-calendar__month-button--prev`).click();

      cy.get(sel.calendar).should('exist');
      cy.get(`${sel.calendar} .gui-calendar__month-button--prev`).should('be.disabled');
      cy.get(sel.dayButton(minIso)).should('exist');
    });

    it('should close the calendar when clicking outside', () => {
      mountRangeDatePicker({ data: { myRanges: [juneRange] } });

      cy.get(sel.startMonth).click();
      cy.get(sel.calendar).should('exist');

      cy.get('body').click(0, 0);
      cy.get(sel.calendar).should('not.exist');
    });

    it('should close the calendar with Escape', () => {
      mountRangeDatePicker({ data: { myRanges: [juneRange] } });

      cy.get(sel.startMonth).click();
      cy.get(sel.calendar).should('exist');

      cy.get(sel.dayButton('2026-06-18')).focus();
      cy.focused().type('{esc}');
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

    it('should reject a typed range with an out-of-bounds endpoint (no pill, inputs stay filled)', () => {
      mountRangeDatePicker({
        props: { maxDate: '2026-06-20', maxDateMessage: 'Outside the window' },
      });

      const changeSpy = cy.spy().as('changeSpy');
      const inputErrorSpy = cy.spy().as('inputErrorSpy');
      cy.get('gui-range-date-picker').then(($el) => {
        $el[0].addEventListener('change', changeSpy as unknown as EventListener);
        $el[0].addEventListener('inputError', inputErrorSpy as unknown as EventListener);
      });

      // Type a full range 06/25 – 06/26, both past maxDate, and press Enter.
      // The range is rejected: no pill, no value change, the error surfaces, and
      // the typed values stay in the inputs so the user can correct them.
      cy.get(sel.startMonth).click();
      cy.focused().type('06');
      cy.focused().type('25');
      cy.focused().type('2026');
      cy.get('gui-range-date input[data-group="end"][data-type="month"]').click();
      cy.focused().type('06');
      cy.focused().type('26');
      cy.focused().type('2026');
      cy.focused().type('{enter}');

      cy.get(sel.pillText).should('not.exist');
      cy.get('@changeSpy').should('not.have.been.called');
      cy.get('@inputErrorSpy').then((spy: any) => {
        expect(spy.getCall(0).args[0].detail.message).to.equal('Outside the window');
      });
      cy.get(sel.startDay).should('have.value', '25');
      cy.get(sel.endDay).should('have.value', '26');
    });

    it('should reject a typed range that steps over a disabled day (no pill)', () => {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      const mm = String(m + 1).padStart(2, '0');
      const yyyy = String(y);
      const iso = (d: number) => `${yyyy}-${mm}-${String(d).padStart(2, '0')}`;

      mountRangeDatePicker({
        props: {
          disabledRanges: [{ start: iso(9), end: iso(10) }],
          disabledDateRangeMessage: 'Range includes unavailable days',
        },
      });

      // Type 08 → 12, which steps over the disabled 9–10 (both endpoints clean).
      cy.get(sel.startMonth).click();
      cy.focused().type(mm);
      cy.focused().type('08');
      cy.focused().type(yyyy);
      cy.get('gui-range-date input[data-group="end"][data-type="month"]').click();
      cy.focused().type(mm);
      cy.focused().type('12');
      cy.focused().type(yyyy);
      cy.focused().type('{enter}');

      // No pill; the error surfaces; the range is echoed and highlighted in red.
      cy.get(sel.pillText).should('not.exist');
      cy.get('[data-cy="testSubject_validator-error"]')
        .should('be.visible')
        .and('contain', 'Range includes unavailable days');
      cy.get(sel.startDay).should('have.value', '08');
      cy.get(sel.endDay).should('have.value', '12');
      cy.get(sel.dayButton(iso(8))).should('have.class', 'invalid-range-start');
      cy.get(sel.dayButton(iso(12))).should('have.class', 'invalid-range-end');
    });

    it('should reject a typed range that starts on a disabled day (no pill)', () => {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      const mm = String(m + 1).padStart(2, '0');
      const yyyy = String(y);
      const iso = (d: number) => `${yyyy}-${mm}-${String(d).padStart(2, '0')}`;

      mountRangeDatePicker({
        props: {
          disabledRanges: [{ start: iso(9), end: iso(10) }],
          disabledDateRangeMessage: 'Range includes unavailable days',
        },
      });

      // Start on the disabled 9 → the whole range is rejected, no pill created.
      cy.get(sel.startMonth).click();
      cy.focused().type(mm);
      cy.focused().type('09');
      cy.focused().type(yyyy);
      cy.get('gui-range-date input[data-group="end"][data-type="month"]').click();
      cy.focused().type(mm);
      cy.focused().type('12');
      cy.focused().type(yyyy);
      cy.focused().type('{enter}');

      cy.get(sel.pillText).should('not.exist');
      cy.get('[data-cy="testSubject_validator-error"]')
        .should('be.visible')
        .and('contain', 'Range includes unavailable days');
    });

    it('should clear a group error once its invalid date is corrected in the input', () => {
      mountRangeDatePicker({ props: { invalidDateMessage: 'Invalid date' } });

      // Type Feb 30 into the start group of the picker's input → invalid date.
      cy.get(sel.startMonth).click();
      cy.focused().type('02');
      cy.focused().type('30');
      cy.focused().type('2026');
      // Submit marks the form touched so the picker renders the injected error.
      cy.get('[data-cy="submitBtn_button"]').click({ force: true });
      cy.get('[data-cy="testSubject_validator-error"]')
        .should('be.visible')
        .and('contain', 'Invalid date');

      // Correct just the start day to 28; the end is still empty, but the
      // corrected start clears the error through the picker.
      cy.get('gui-range-date input[data-group="start"][data-type="day"]').click();
      cy.focused().type('{selectall}28', { force: true });
      cy.get('gui-range-date input[data-group="end"][data-type="month"]').click();

      cy.get('[data-cy="testSubject_validator-error"]').should('not.exist');
    });

    it('should reject a calendar range that spans a disabled day with an error and no pill', () => {
      // Dates in the currently-displayed month so the day buttons are visible.
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      const iso = (d: number) =>
        `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      mountRangeDatePicker({
        props: {
          disabledRanges: [{ start: iso(15), end: iso(15) }],
          disabledDateRangeMessage: 'Range includes unavailable days',
        },
      });

      cy.get(sel.startMonth).click();
      // Select 10 → 20, which spans the disabled 15: the whole range is rejected.
      cy.get(sel.dayButton(iso(10))).click();
      cy.get(sel.dayButton(iso(20))).click();

      cy.get(sel.pillText).should('not.exist');
      // The error must surface as soon as the selection completes — without a
      // submit or a click-outside blur.
      cy.get('[data-cy="testSubject_validator-error"]')
        .should('be.visible')
        .and('contain', 'Range includes unavailable days');

      // The rejected range stays visible in red so the user sees what was invalid.
      cy.get(sel.dayButton(iso(10))).should('have.class', 'invalid-range-start');
      cy.get(sel.dayButton(iso(20))).should('have.class', 'invalid-range-end');

      // And the date inputs above are filled with the rejected range.
      cy.get(sel.startDay).should('have.value', '10');
      cy.get(sel.endDay).should('have.value', '20');
    });

    it('should restore the rejected-range highlight after closing and reopening the calendar', () => {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      const iso = (d: number) =>
        `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      mountRangeDatePicker({
        props: {
          disabledRanges: [{ start: iso(15), end: iso(15) }],
          disabledDateRangeMessage: 'Range includes unavailable days',
        },
      });

      cy.get(sel.startMonth).click();
      cy.get(sel.dayButton(iso(10))).click();
      cy.get(sel.dayButton(iso(20))).click();
      cy.get(sel.dayButton(iso(10))).should('have.class', 'invalid-range-start');

      // Close the calendar (it gets destroyed) then reopen it.
      cy.get('body').click(0, 0);
      cy.get(sel.calendar).should('not.exist');
      cy.get(sel.startMonth).click();

      // The red highlight is restored on the freshly recreated calendar.
      cy.get(sel.dayButton(iso(10))).should('have.class', 'invalid-range-start');
      cy.get(sel.dayButton(iso(20))).should('have.class', 'invalid-range-end');
      cy.get(sel.startDay).should('have.value', '10');
    });

    it('should clear the rejected range once a valid range is selected', () => {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      const iso = (d: number) =>
        `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      mountRangeDatePicker({
        props: {
          disabledRanges: [{ start: iso(15), end: iso(15) }],
          disabledDateRangeMessage: 'Range includes unavailable days',
        },
      });

      cy.get(sel.startMonth).click();
      // First an invalid range: 10 → 20 spans the disabled 15.
      cy.get(sel.dayButton(iso(10))).click();
      cy.get(sel.dayButton(iso(20))).click();
      cy.get(sel.dayButton(iso(10))).should('have.class', 'invalid-range-start');

      // Then a valid range clears the red highlight, echoed inputs, and commits a pill.
      cy.get(sel.dayButton(iso(2))).click();
      cy.get(sel.dayButton(iso(5))).click();

      cy.get(sel.dayButton(iso(10))).should('not.have.class', 'invalid-range-start');
      cy.get(sel.dayButton(iso(20))).should('not.have.class', 'invalid-range-end');
      cy.get(sel.startDay).should('have.value', '');
      cy.get(sel.pillText).should('exist');
    });
  });
};
