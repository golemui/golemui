import { defineForm, identityTranslator } from '@golemui/core';
import { type MountComponentFn } from '../utils';

// Behavior tests for the gui-date-time-picker web component: a gui-date-time
// input opening a gui-date-time-calendar popover. The popover closes only on
// a deliberate commit (a list pick or Enter) — picking a day keeps any
// previously chosen time (committing the new full value) or, with no time
// yet, parks a working partial that survives closing the popover.
export const runDateTimePickerComponentTests = (mountFn: MountComponentFn) => {
  describe('DateTimePicker Component', () => {
    const sel = {
      // The typed field parts (the popover's own time input is scoped under gui-time)
      day: 'gui-date-time-picker gui-date-time input[data-type="day"]',
      month: 'gui-date-time-picker gui-date-time input[data-type="month"]',
      year: 'gui-date-time-picker gui-date-time input[data-type="year"]',
      hour: 'gui-date-time-picker gui-date-time input[data-type="hour"]',
      minute: 'gui-date-time-picker gui-date-time input[data-type="minute"]',
      calendar: 'gui-date-time-picker gui-date-time-calendar',
      popoverHour: 'gui-date-time-calendar gui-time input[data-type="hour"]',
      timeList: 'gui-date-time-calendar gui-time-picker gui-time-list',
      openTimeList: 'gui-date-time-calendar gui-time-picker gui-time-list:not([hidden])',
      dayButton: (isoDate: string) =>
        `gui-date-time-calendar .gui-calendar__day-button[data-date="${isoDate}"]`,
      option: (isoTime: string) =>
        `gui-date-time-calendar gui-time-list .gui-time-list__option[data-value="${isoTime}"]`,
    };

    // Office hours; date-anchored tests hydrate a February 2026 value (the
    // 13th is a Friday, the 15th a Sunday, the 16th a Monday) because the
    // calendar anchors its visible month on the value
    const officeProps = {
      minTime: '09:00:00',
      maxTime: '11:00:00',
      minuteStep: 30,
    };

    const mountPicker = (options?: {
      data?: Record<string, any>;
      props?: Record<string, any>;
      validator?: Record<string, any>;
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
              uid: 'testSubject',
              kind: 'input',
              type: 'dateTimePicker',
              path: 'myAppointment',
              ...(options?.props ? { props: options.props } : {}),
              ...(options?.validator ? { validator: options.validator as any } : {}),
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

    const submitAndGetData = (formSubmitAlias: string) => {
      cy.get('[data-cy="submitBtn_button"]').click({ force: true });
      return cy.get(formSubmitAlias).then((stub: any) => stub.getCall(0).args[0].data);
    };

    it('should keep the popover open while editing the calendar time and close on Enter', () => {
      mountPicker({
        data: { myAppointment: '2026-02-13T09:30:00' },
        props: { minTime: '09:00:00', maxTime: '18:00:00', minuteStep: 30, allowCustomTime: true },
      });
      cy.get(sel.day).click();
      cy.get(sel.calendar).should('exist');

      // Arrowing the time in the calendar's field commits the value but must NOT
      // close the popover (typing runs through the same non-committing path)
      cy.get(sel.popoverHour).click();
      cy.get(sel.popoverHour).type('{upArrow}');
      cy.get(sel.popoverHour).should('have.value', '10');
      cy.get(sel.calendar).should('exist');

      // Enter is the deliberate commit: the popover closes and the value sticks
      cy.get(sel.popoverHour).type('{enter}', { force: true });
      cy.get(sel.calendar).should('not.exist');
      cy.get(sel.hour).should('have.value', '10');
      cy.get(sel.minute).should('have.value', '30');
    });

    it('should hydrate a full ISO date-time into the field and keep the popover closed', () => {
      mountPicker({ data: { myAppointment: '2026-02-13T09:30:00' }, props: officeProps });

      cy.get(sel.day).should('have.value', '13');
      cy.get(sel.month).should('have.value', '02');
      cy.get(sel.year).should('have.value', '2026');
      cy.get(sel.hour).should('have.value', '09');
      cy.get(sel.minute).should('have.value', '30');
      cy.get(sel.calendar).should('not.exist');
    });

    it('should open the popover on a field part click with the day and time hydrated', () => {
      mountPicker({ data: { myAppointment: '2026-02-13T09:30:00' }, props: officeProps });

      cy.get(sel.day).click();
      cy.get(sel.calendar).should('exist');
      cy.get(sel.dayButton('2026-02-13')).should('have.attr', 'aria-selected', 'true');
      cy.get(sel.popoverHour).should('have.value', '09');
    });

    it('should keep the popover open across the day step and close it on the time commit', () => {
      const formSubmitHandler = cy.stub().as('formSubmitHandler');
      mountPicker({
        data: { myAppointment: '2026-02-13T09:30:00' },
        props: officeProps,
        formSubmit: formSubmitHandler,
      });

      cy.get(sel.day).click();

      // Day step: the kept time commits the new full value immediately, and
      // the popover must stay open (not a deliberate list-pick/Enter commit)
      cy.get(sel.dayButton('2026-02-16')).click();
      cy.get(sel.calendar).should('exist');
      cy.get(sel.day).should('have.value', '16');
      cy.get(sel.hour).should('have.value', '09');

      // Time step: the commit closes the popover and fills the field
      cy.get(sel.popoverHour).click();
      cy.get(sel.openTimeList).should('exist');
      cy.get(sel.option('10:00:00')).click();

      cy.get(sel.calendar).should('not.exist');
      cy.get(sel.day).should('have.value', '16');
      cy.get(sel.hour).should('have.value', '10');
      cy.get(sel.minute).should('have.value', '00');

      submitAndGetData('@formSubmitHandler').then((data) => {
        expect(data).to.deep.equal({ myAppointment: '2026-02-16T10:00:00' });
      });
    });

    it('should fill the date segments and keep the value null after a day-only pick', () => {
      const formSubmitHandler = cy.stub().as('formSubmitHandler');
      mountPicker({
        data: { myAppointment: null },
        props: officeProps,
        formSubmit: formSubmitHandler,
      });

      cy.get(sel.day).click();
      cy.get('gui-date-time-calendar .gui-calendar__day-button:not(.other-month):not(:disabled)')
        .first()
        .then(($btn) => {
          const isoDate = $btn.attr('data-date') as string;

          cy.wrap($btn).click();
          cy.get(sel.calendar).should('exist');
          cy.get(sel.day).should('have.value', isoDate.slice(8, 10));
          cy.get(sel.month).should('have.value', isoDate.slice(5, 7));
          cy.get(sel.hour).should('have.value', '');

          submitAndGetData('@formSubmitHandler').then((data) => {
            expect(data).to.deep.equal({ myAppointment: null });
          });
        });
    });

    it('should select the typed day in the calendar as the date half completes', () => {
      mountPicker({ props: { ...officeProps, hourFormat: '24' } });

      cy.get(sel.month).click();
      cy.focused().type('02');
      cy.focused().type('13');
      cy.focused().type('2026');

      cy.get(sel.dayButton('2026-02-13')).should('have.attr', 'aria-selected', 'true');
    });

    it('should keep a time picked before any day and commit once a day is picked', () => {
      const formSubmitHandler = cy.stub().as('formSubmitHandler');
      mountPicker({
        data: { myAppointment: null },
        props: officeProps,
        formSubmit: formSubmitHandler,
      });

      cy.get(sel.day).click();
      cy.get(sel.popoverHour).click();
      cy.get(sel.option('10:00:00')).click();

      // No day yet: the pick is parked, the popover stays open, the field
      // time segments fill
      cy.get(sel.calendar).should('exist');
      cy.get(sel.hour).should('have.value', '10');

      cy.get('gui-date-time-calendar .gui-calendar__day-button:not(.other-month):not(:disabled)')
        .first()
        .then(($btn) => {
          const isoDate = $btn.attr('data-date') as string;

          cy.wrap($btn).click();
          cy.get(sel.day).should('have.value', isoDate.slice(8, 10));

          submitAndGetData('@formSubmitHandler').then((data) => {
            expect(data).to.deep.equal({ myAppointment: `${isoDate}T10:00:00` });
          });
        });
    });

    it('should keep a day-only pick across popover close and reopen', () => {
      mountPicker({ data: { myAppointment: null }, props: officeProps });

      cy.get(sel.day).click();
      cy.get('gui-date-time-calendar .gui-calendar__day-button:not(.other-month):not(:disabled)')
        .first()
        .then(($btn) => {
          const isoDate = $btn.attr('data-date') as string;

          cy.wrap($btn).click();
          // Escape closes the popover; the working selection must survive
          cy.focused().type('{esc}');
          cy.get(sel.calendar).should('not.exist');

          cy.get(sel.day).click();
          cy.get(sel.calendar).should('exist');
          cy.get(sel.dayButton(isoDate)).should('have.attr', 'aria-selected', 'true');
        });
    });

    it('should not show an error while a selection is still in progress in the popover', () => {
      // Completing a selection step by step must stay quiet: no error until
      // the user actually abandons the widget with a partial value.
      mountPicker({
        data: { myAppointment: null },
        props: officeProps,
        validator: { type: 'string', format: 'date-time', required: true },
      });

      cy.get(sel.day).click();
      cy.get('gui-date-time-calendar .gui-calendar__day-button:not(.other-month):not(:disabled)')
        .first()
        .click();
      cy.get('[data-cy="testSubject_validator-errors"]').should('not.exist');

      // Moving on to the time step must not flag the field either
      cy.get(sel.popoverHour).click();
      cy.get('[data-cy="testSubject_validator-errors"]').should('not.exist');

      cy.get(sel.option('10:00:00')).click();
      cy.get('[data-cy="testSubject_validator-errors"]').should('not.exist');
    });

    it('should not show an error when clicking a non-focusable area of the popover', () => {
      // Clicking widget chrome (the time input's group wrapper, padding...)
      // must not read as leaving the control just because the clicked
      // element cannot hold focus.
      mountPicker({
        data: { myAppointment: null },
        props: officeProps,
        validator: { type: 'string', format: 'date-time', required: true },
      });

      cy.get(sel.day).click();
      cy.get('gui-date-time-calendar .gui-calendar__day-button:not(.other-month):not(:disabled)')
        .first()
        .click();

      cy.get('gui-date-time-calendar gui-time [role="group"]').click('right');

      cy.get(sel.calendar).should('exist');
      cy.get('[data-cy="testSubject_validator-errors"]').should('not.exist');
    });

    it('should keep the other parts and show the incomplete error when a part is emptied', () => {
      mountPicker({ data: { myAppointment: '2026-02-13T09:30:00' }, props: officeProps });

      cy.get(sel.day).type('{selectAll}{backspace}');
      cy.get('[data-cy="submitBtn_button"]').focus();

      // The field keeps what the user still has: only the emptied part clears
      cy.get(sel.day).should('have.value', '');
      cy.get(sel.month).should('have.value', '02');
      cy.get(sel.year).should('have.value', '2026');
      cy.get(sel.hour).should('have.value', '09');
      cy.get('[data-cy="testSubject_validator-error"]').should(
        'contain.text',
        'Incomplete date-time',
      );
    });

    it('should report an abandoned partial when clicking away onto the page background', () => {
      // The counterpart of the chrome-click case: a click outside that lands
      // on a non-focusable area is still leaving the widget.
      mountPicker({ data: { myAppointment: null }, props: officeProps });

      cy.get(sel.day).click();
      cy.get('gui-date-time-calendar .gui-calendar__day-button:not(.other-month):not(:disabled)')
        .first()
        .click();

      cy.get('body').click(0, 0);

      cy.get(sel.calendar).should('not.exist');
      cy.get('[data-cy="testSubject_validator-error"]').should(
        'contain.text',
        'Incomplete date-time',
      );
    });

    it('should flip a day-only pick to null with an incomplete error when focus leaves', () => {
      mountPicker({ data: { myAppointment: null }, props: officeProps });

      cy.get(sel.day).click();
      cy.get('gui-date-time-calendar .gui-calendar__day-button:not(.other-month):not(:disabled)')
        .first()
        .click();

      cy.get('[data-cy="submitBtn_button"]').focus();
      cy.get(sel.calendar).should('not.exist');
      cy.get('[data-cy="testSubject_validator-error"]').should(
        'contain.text',
        'Incomplete date-time',
      );
    });

    it('should clear the incomplete error when the emptied picker is left again', () => {
      // Regression: leave a typed partial behind (incomplete error), come
      // back, empty the field and leave again — the error must not outlive
      // fields that no longer hold anything.
      mountPicker({ props: officeProps });

      cy.get(sel.month).click();
      cy.focused().type('02');
      cy.get('[data-cy="submitBtn_button"]').focus();
      cy.get('[data-cy="testSubject_validator-error"]').should(
        'contain.text',
        'Incomplete date-time',
      );

      cy.get(sel.month).type('{selectAll}{backspace}');
      cy.get('[data-cy="submitBtn_button"]').focus();
      cy.get('[data-cy="testSubject_validator-errors"]').should('not.exist');
    });

    it('should commit a fully typed date-time from the field', () => {
      const formSubmitHandler = cy.stub().as('formSubmitHandler');
      mountPicker({
        props: { ...officeProps, hourFormat: '24' },
        formSubmit: formSubmitHandler,
      });

      // en-US orders the parts month/day/year then hour/minute (auto-advance)
      cy.get(sel.month).click();
      cy.focused().type('02');
      cy.focused().type('13');
      cy.focused().type('2026');
      cy.focused().type('10');
      cy.focused().type('30');

      submitAndGetData('@formSubmitHandler').then((data) => {
        expect(data).to.deep.equal({ myAppointment: '2026-02-13T10:30:00' });
      });
    });

    it('should advance the value and emit inputError for an out-of-bounds time toggled in the field', () => {
      mountPicker({
        data: { myAppointment: '2026-02-13T09:30:00' },
        props: { ...officeProps, maxTimeMessage: 'Office closes at 11' },
      });

      const inputErrorSpy = cy.spy().as('inputErrorSpy');
      const changeSpy = cy.spy().as('changeSpy');
      cy.get('gui-date-time-picker').then(($el) => {
        $el[0].addEventListener('inputError', inputErrorSpy as unknown as EventListener);
        $el[0].addEventListener('change', changeSpy as unknown as EventListener);
      });

      // 09:30 AM is valid; toggling the field's period to PM makes 21:30, past
      // the 11:00 maxTime — the value advances (change) alongside the error.
      cy.get('gui-date-time-picker gui-date-time button[data-type="dayPeriod"]').click();

      cy.get('@changeSpy').should('have.been.called');
      cy.get('@inputErrorSpy').then((spy: any) => {
        expect(spy.getCall(0).args[0].detail.message).to.equal('Office closes at 11');
      });
    });

    it('should advance the value and emit inputError when the field date lands in a disabled range', () => {
      mountPicker({
        props: {
          ...officeProps,
          hourFormat: '24',
          disabledRanges: [{ start: '2026-02-20', end: '2026-02-22' }],
          disabledDateRangeMessage: 'That week is blocked',
        },
      });

      const changeSpy = cy.spy().as('changeSpy');
      const inputErrorSpy = cy.spy().as('inputErrorSpy');
      cy.get('gui-date-time-picker').then(($el) => {
        $el[0].addEventListener('change', changeSpy as unknown as EventListener);
        $el[0].addEventListener('inputError', inputErrorSpy as unknown as EventListener);
      });

      // Type a full date-time on a disabled day. Unlike a time bound, the date is
      // validated by the picker, so the value advances (the field reflects '20')
      // and the picker surfaces the disabled-date error.
      cy.get(sel.month).click();
      cy.focused().type('02');
      cy.focused().type('20');
      cy.focused().type('2026');
      cy.focused().type('10');
      cy.focused().type('30');

      cy.get(sel.day).should('have.value', '20');
      cy.get('@changeSpy').should('have.been.called');
      cy.get('@inputErrorSpy').then((spy: any) => {
        expect(spy.getCall(0).args[0].detail.message).to.equal('That week is blocked');
      });
    });

    it('should advance the value and emit inputError when the field time lands in a disabled time range', () => {
      mountPicker({
        props: {
          minTime: '09:00:00',
          maxTime: '11:00:00',
          minuteStep: 30,
          hourFormat: '24',
          disabledTimeRanges: [{ start: '10:00:00', end: '10:30:00' }],
          disabledTimeRangeMessage: 'Reserved for standup',
        },
      });

      const changeSpy = cy.spy().as('changeSpy');
      const inputErrorSpy = cy.spy().as('inputErrorSpy');
      cy.get('gui-date-time-picker').then(($el) => {
        $el[0].addEventListener('change', changeSpy as unknown as EventListener);
        $el[0].addEventListener('inputError', inputErrorSpy as unknown as EventListener);
      });

      // Type a full date-time whose time (10:15) is inside the disabled range but
      // within min/max, so the field commits it and the picker raises the
      // disabled-time-range error while the value advances.
      cy.get(sel.month).click();
      cy.focused().type('02');
      cy.focused().type('13');
      cy.focused().type('2026');
      cy.focused().type('10');
      cy.focused().type('15');

      cy.get(sel.hour).should('have.value', '10');
      cy.get(sel.minute).should('have.value', '15');
      cy.get('@changeSpy').should('have.been.called');
      cy.get('@inputErrorSpy').then((spy: any) => {
        expect(spy.getCall(0).args[0].detail.message).to.equal('Reserved for standup');
      });
    });

    it('should keep the popover open when keyboard navigation crosses a month boundary', () => {
      mountPicker({ data: { myAppointment: '2026-06-15T09:30:00' }, props: officeProps });

      cy.get(sel.day).click();
      cy.get(sel.dayButton('2026-06-30')).focus();
      cy.focused().type('{downArrow}');

      cy.get(sel.calendar).should('exist');
      cy.focused()
        .should('have.class', 'gui-calendar__day-button')
        .invoke('attr', 'data-date')
        .should('contain', '2026-07');
    });

    it('should close the popover when clicking outside', () => {
      mountPicker({ data: { myAppointment: '2026-02-13T09:30:00' }, props: officeProps });

      cy.get(sel.day).click();
      cy.get(sel.calendar).should('exist');

      cy.get('body').click(0, 0);
      cy.get(sel.calendar).should('not.exist');
    });

    it('should close the popover when focus leaves the picker', () => {
      mountPicker({ data: { myAppointment: '2026-02-13T09:30:00' }, props: officeProps });

      cy.get(sel.day).click();
      cy.get(sel.calendar).should('exist');

      cy.get('[data-cy="submitBtn_button"]').focus();
      cy.get(sel.calendar).should('not.exist');
    });

    it('should close the popover with Escape from a focused day', () => {
      mountPicker({ data: { myAppointment: '2026-02-13T09:30:00' }, props: officeProps });

      cy.get(sel.day).click();
      cy.get(sel.calendar).should('exist');

      cy.get(sel.dayButton('2026-02-13')).focus();
      cy.focused().type('{esc}');
      cy.get(sel.calendar).should('not.exist');
    });

    it('should close the time list first, then the popover, on successive Escapes', () => {
      mountPicker({ data: { myAppointment: '2026-02-13T09:30:00' }, props: officeProps });

      cy.get(sel.day).click();
      cy.get(sel.popoverHour).click();
      cy.get(sel.openTimeList).should('exist');

      // First Escape closes the embedded time list, popover stays open
      cy.get(sel.popoverHour).type('{esc}', { force: true });
      cy.get(sel.timeList).should('have.attr', 'hidden');
      cy.get(sel.calendar).should('exist');

      // Second Escape closes the popover
      cy.get(sel.popoverHour).type('{esc}', { force: true });
      cy.get(sel.calendar).should('not.exist');
    });

    it('should apply day-scoped disabled time ranges in the popover', () => {
      mountPicker({
        data: { myAppointment: '2026-02-13T09:30:00' },
        props: {
          ...officeProps,
          maxTime: '14:00:00',
          disabledTimeRanges: [{ start: '13:00:00', end: '14:00:00', weekdays: [1, 2, 3, 4, 5] }],
        },
      });

      // 2026-02-13 is a Friday: the lunch range applies
      cy.get(sel.day).click();
      cy.get(sel.popoverHour).click();
      cy.get(sel.option('13:00:00')).should('be.disabled');

      // Escape closes the time list so the days grid is visible again
      cy.get(sel.popoverHour).type('{esc}', { force: true });
      cy.get(sel.openTimeList).should('not.exist');

      // 2026-02-15 is a Sunday: the range does not apply (day step keeps the
      // popover open, then the time list reflects the new day)
      cy.get(sel.dayButton('2026-02-15')).click();
      cy.get(sel.popoverHour).click();
      cy.get(sel.option('13:00:00')).should('not.be.disabled');
    });

    it('should not open when disabled', () => {
      // Split from the readonly case below: with two mounts in one test the
      // Angular mount adapter runs both before the interactions, so the
      // clicks land on the second mount's component.
      mountPicker({
        data: { myAppointment: '2026-02-13T09:30:00' },
        props: officeProps,
        disabled: true,
      });

      // Wait for the disabled state to land before clicking: force-clicks
      // skip actionability, so the click could otherwise race the adapter
      // applying props on a slow runner
      cy.get(sel.day).should('be.disabled');
      cy.get('.gui-date-time-picker .gui-widget').first().click({ force: true });
      cy.wait(50);
      cy.get(sel.calendar).should('not.exist');
    });

    it('should not change the value when readonly', () => {
      mountPicker({
        data: { myAppointment: '2026-02-13T09:30:00' },
        props: officeProps,
        readonly: true,
      });

      cy.get(sel.day).click();
      cy.get(sel.calendar).should('exist');

      cy.get(sel.dayButton('2026-02-16')).click();
      cy.get(sel.dayButton('2026-02-13')).should('have.attr', 'aria-selected', 'true');
      cy.get(sel.day).should('have.value', '13');
    });

    describe('accessibility', () => {
      const toggleSel = 'button.gui-date-time-picker__arrow';

      it('should expose a named popup toggle button', () => {
        mountPicker();
        cy.get(toggleSel)
          .should('have.attr', 'aria-label', 'Show calendar')
          .should('have.attr', 'aria-haspopup', 'dialog')
          .should('have.attr', 'aria-expanded', 'false')
          .should('have.attr', 'aria-controls', 'testSubject_popup');
      });

      it('should open the calendar dialog from the toggle and move focus into it', () => {
        mountPicker();
        cy.get(toggleSel).click();
        cy.get(toggleSel).should('have.attr', 'aria-expanded', 'true');
        cy.get('gui-date-time-calendar')
          .should('have.attr', 'role', 'dialog')
          .should('have.id', 'testSubject_popup');
        cy.focused().should('have.class', 'gui-calendar__day-button');
      });
    });
  });
};
