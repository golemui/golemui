import { defineForm, identityTranslator } from '@golemui/core';
import { type MountComponentFn } from '../utils';

export const runDateTimeCalendarComponentTests = (mountFn: MountComponentFn) => {
  describe('DateTimeCalendar Component', () => {
    const sel = {
      hour: 'gui-date-time-calendar gui-time input[data-type="hour"]',
      minute: 'gui-date-time-calendar gui-time input[data-type="minute"]',
      daysGrid: 'gui-date-time-calendar .gui-calendar__days-grid',
      dayButton: 'gui-date-time-calendar .gui-calendar__day-button',
      timeGrid: 'gui-date-time-calendar gui-time-picker gui-time-list',
      openTimeGrid: 'gui-date-time-calendar gui-time-picker gui-time-list:not([hidden])',
      options: 'gui-date-time-calendar gui-time-list .gui-time-list__option',
      rovingOption: 'gui-date-time-calendar gui-time-list .gui-time-list__option[tabindex="0"]',
      yearSelector: 'gui-date-time-calendar .gui-calendar__year-selector',
      yearGrid: 'gui-date-time-calendar .gui-calendar__year-grid',
    };

    // Office hours; date-anchored tests hydrate a February 2026 value (the
    // 1st is a Sunday: the 13th is a Friday, the 15th a Sunday, the 16th a
    // Monday) because the calendar anchors its visible month on the value
    const officeProps = {
      minTime: '09:00:00',
      maxTime: '11:00:00',
      minuteStep: 30,
    };

    const mountCalendar = (options?: {
      data?: Record<string, any>;
      lang?: string;
      props?: Record<string, any>;
      formSubmit?: (event: any) => void;
      readonly?: boolean;
      disabled?: boolean;
    }) => {
      mountFn({
        localization: identityTranslator(options?.lang ?? 'en-US'),
        data: options?.data,
        formDef: defineForm({
          form: [
            {
              uid: 'testSubject',
              kind: 'input',
              type: 'dateTimeCalendar',
              path: 'myAppointment',
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

    const submitAndGetData = (formSubmitAlias: string) => {
      cy.get('[data-cy="submitBtn_button"]').click({ force: true });
      return cy.get(formSubmitAlias).then((stub: any) => stub.getCall(0).args[0].data);
    };

    const day = (isoDate: string) => cy.get(`${sel.dayButton}[data-date="${isoDate}"]`);
    // Empty-start tests pick a day from the currently visible month
    const firstAvailableDay = () =>
      cy.get(`${sel.dayButton}:not(.other-month):not(:disabled)`).first();
    const option = (isoTime: string) => cy.get(`${sel.options}[data-value="${isoTime}"]`);

    describe('rendering and hydration', () => {
      it('should render the days grid and a disabled time input when empty', () => {
        mountCalendar({ props: officeProps });

        cy.get(sel.daysGrid).should('exist');
        cy.get(sel.hour).should('be.disabled');
        cy.get(sel.timeGrid).should('have.attr', 'hidden');
      });

      it('should hydrate a full ISO date-time into day and time', () => {
        mountCalendar({ data: { myAppointment: '2026-02-13T09:30:00' }, props: officeProps });

        day('2026-02-13').should('have.class', 'selected');
        cy.get(sel.hour).should('have.value', '09');
        cy.get(sel.minute).should('have.value', '30');
        cy.get(sel.hour).should('not.be.disabled');
      });
    });

    describe('day and time selection flow', () => {
      it('should enable the time input on day selection and keep the value null', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountCalendar({
          data: { myAppointment: null },
          props: officeProps,
          formSubmit: formSubmitHandler,
        });

        firstAvailableDay().click();
        cy.get(sel.hour).should('not.be.disabled');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myAppointment: null });
        });
      });

      it('should open the time grid in place of the days grid when the time input is focused', () => {
        mountCalendar({ data: { myAppointment: null }, props: officeProps });

        firstAvailableDay().click();
        cy.get(sel.hour).click();

        cy.get(sel.openTimeGrid).should('exist');
        cy.get(sel.daysGrid).should('not.exist');
        cy.get(sel.options).should('have.length', 5);
      });

      it('should commit a picked time, close the grid and submit the full ISO value', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountCalendar({
          data: { myAppointment: null },
          props: officeProps,
          formSubmit: formSubmitHandler,
        });

        firstAvailableDay().then(($btn) => {
          const isoDate = $btn.attr('data-date') as string;

          cy.wrap($btn).click();
          cy.get(sel.hour).click();
          option('10:00:00').click();

          cy.get(sel.timeGrid).should('have.attr', 'hidden');
          cy.get(sel.daysGrid).should('exist');
          cy.get(sel.hour).should('have.value', '10');

          submitAndGetData('@formSubmitHandler').then((data) => {
            expect(data).to.deep.equal({ myAppointment: `${isoDate}T10:00:00` });
          });
        });
      });

      it('should clear the time and emit null when a different day is selected', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountCalendar({
          data: { myAppointment: '2026-02-13T09:30:00' },
          props: officeProps,
          formSubmit: formSubmitHandler,
        });

        day('2026-02-16').click();

        cy.get(sel.hour).should('have.value', '');
        cy.get(sel.minute).should('have.value', '');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myAppointment: null });
        });
      });

      it('should keep the value when the same day is re-selected', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountCalendar({
          data: { myAppointment: '2026-02-13T09:30:00' },
          props: officeProps,
          formSubmit: formSubmitHandler,
        });

        day('2026-02-13').click();
        cy.get(sel.hour).should('have.value', '09');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myAppointment: '2026-02-13T09:30:00' });
        });
      });
    });

    describe('per-day disabled time ranges', () => {
      it('should disable a weekday-scoped range only on matching weekdays', () => {
        mountCalendar({
          data: { myAppointment: '2026-02-13T09:30:00' },
          props: {
            ...officeProps,
            maxTime: '14:00:00',
            disabledTimeRanges: [{ start: '13:00:00', end: '14:00:00', weekdays: [1, 2, 3, 4, 5] }],
          },
        });

        // 2026-02-13 is a Friday: the lunch range applies
        cy.get(sel.hour).click();
        option('13:00:00').should('be.disabled');

        cy.get(sel.rovingOption).focus();
        cy.focused().type('{esc}');
        cy.get(sel.timeGrid).should('have.attr', 'hidden');

        // 2026-02-15 is a Sunday: the range does not apply
        day('2026-02-15').click();
        cy.get(sel.hour).click();
        option('13:00:00').should('not.be.disabled');
      });

      it('should disable a date-scoped range only on that date', () => {
        mountCalendar({
          data: { myAppointment: '2026-02-13T11:00:00' },
          props: {
            ...officeProps,
            disabledTimeRanges: [{ start: '09:00:00', end: '10:30:00', date: '2026-02-13' }],
          },
        });

        cy.get(sel.hour).click();
        option('09:30:00').should('be.disabled');

        cy.get(sel.rovingOption).focus();
        cy.focused().type('{esc}');

        day('2026-02-16').click();
        cy.get(sel.hour).click();
        option('09:30:00').should('not.be.disabled');
      });

      it('should reject a typed time inside a day-scoped range with inputError', () => {
        // Hydrate a Monday so the view shows February, then move to the
        // scoped 13th (clearing the time) and type into the empty parts
        mountCalendar({
          data: { myAppointment: '2026-02-16T11:00:00' },
          props: {
            ...officeProps,
            hourFormat: '24',
            allowCustomTime: true,
            disabledTimeRanges: [{ start: '09:00:00', end: '10:30:00', date: '2026-02-13' }],
          },
        });

        day('2026-02-13').click();
        cy.get(sel.hour).should('have.value', '');

        const inputErrorSpy = cy.spy().as('inputErrorSpy');
        cy.get('gui-date-time-calendar').then(($el) => {
          $el[0].addEventListener('inputError', inputErrorSpy as unknown as EventListener);
        });

        cy.get(sel.hour).type('09');
        cy.focused().type('30', { force: true });

        cy.get('@inputErrorSpy').then((spy: any) => {
          expect(spy.getCall(0).args[0].detail.message).to.contain('disabled range');
        });
      });
    });

    describe('typed time entry', () => {
      it('should render the time input readonly without allowCustomTime', () => {
        mountCalendar({ data: { myAppointment: '2026-02-13T09:30:00' }, props: officeProps });

        cy.get(sel.hour).should('have.attr', 'readonly');
      });

      it('should close the open grid with Enter after typing a custom time', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        // Move to a different day first so the parts are empty for typing
        mountCalendar({
          data: { myAppointment: '2026-02-16T09:30:00' },
          props: { ...officeProps, hourFormat: '24', allowCustomTime: true },
          formSubmit: formSubmitHandler,
        });

        day('2026-02-13').click();
        cy.get(sel.hour).click();
        cy.get(sel.openTimeGrid).should('exist');

        cy.get(sel.hour).type('10');
        cy.focused().type('30', { force: true });
        cy.focused().type('{enter}', { force: true });

        cy.get(sel.timeGrid).should('have.attr', 'hidden');
        cy.get(sel.daysGrid).should('exist');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myAppointment: '2026-02-13T10:30:00' });
        });
      });

      it('should commit a typed valid time as the full ISO value', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountCalendar({
          data: { myAppointment: null },
          props: { ...officeProps, hourFormat: '24', allowCustomTime: true },
          formSubmit: formSubmitHandler,
        });

        firstAvailableDay().then(($btn) => {
          const isoDate = $btn.attr('data-date') as string;

          cy.wrap($btn).click();
          cy.get(sel.hour).type('10');
          cy.focused().type('30', { force: true });

          submitAndGetData('@formSubmitHandler').then((data) => {
            expect(data).to.deep.equal({ myAppointment: `${isoDate}T10:30:00` });
          });
        });
      });

      it('should emit inputError and a change for a typed out-of-bounds time', () => {
        mountCalendar({
          data: { myAppointment: null },
          props: { ...officeProps, hourFormat: '24', allowCustomTime: true },
        });

        firstAvailableDay().click();

        const changeSpy = cy.spy().as('changeSpy');
        const inputErrorSpy = cy.spy().as('inputErrorSpy');
        cy.get('gui-date-time-calendar').then(($el) => {
          $el[0].addEventListener('change', changeSpy as unknown as EventListener);
          $el[0].addEventListener('inputError', inputErrorSpy as unknown as EventListener);
        });

        cy.get(sel.hour).type('08');
        cy.focused().type('00', { force: true });

        cy.get('@inputErrorSpy').should('have.been.called');
        cy.get('@changeSpy').should('have.been.called');
        cy.get('@inputErrorSpy').then((spy: any) => {
          expect(spy.getCall(0).args[0].detail.message).to.contain('minimum');
        });
      });

      it('should emit the custom minTimeMessage when provided', () => {
        mountCalendar({
          data: { myAppointment: null },
          props: {
            ...officeProps,
            hourFormat: '24',
            allowCustomTime: true,
            minTimeMessage: 'Office opens at 9',
          },
        });

        firstAvailableDay().click();

        const inputErrorSpy = cy.spy().as('inputErrorSpy');
        cy.get('gui-date-time-calendar').then(($el) => {
          $el[0].addEventListener('inputError', inputErrorSpy as unknown as EventListener);
        });

        cy.get(sel.hour).type('08');
        cy.focused().type('00', { force: true });

        cy.get('@inputErrorSpy').then((spy: any) => {
          expect(spy.getCall(0).args[0].detail.message).to.equal('Office opens at 9');
        });
      });
    });

    describe('empty time window', () => {
      it('should show the default no-available-times message', () => {
        mountCalendar({
          data: { myAppointment: null },
          props: { ...officeProps, minTime: '18:00:00', maxTime: '09:00:00' },
        });

        firstAvailableDay().click();
        cy.get(sel.hour).click();

        cy.get('gui-date-time-calendar gui-time-list:not([hidden]) .gui-time-list__empty').should(
          ($el) => {
            expect($el.text().trim()).to.equal('No available times');
          },
        );
      });

      it('should show the custom noAvailableTimesMessage when provided', () => {
        mountCalendar({
          data: { myAppointment: null },
          props: {
            ...officeProps,
            minTime: '18:00:00',
            maxTime: '09:00:00',
            noAvailableTimesMessage: 'Fully booked',
          },
        });

        firstAvailableDay().click();
        cy.get(sel.hour).click();

        cy.get('gui-date-time-calendar gui-time-list:not([hidden]) .gui-time-list__empty').should(
          ($el) => {
            expect($el.text().trim()).to.equal('Fully booked');
          },
        );
      });
    });

    describe('grid dismissal', () => {
      it('should close the grid when clicking outside the time cluster', () => {
        mountCalendar({ data: { myAppointment: '2026-02-13T09:30:00' }, props: officeProps });

        cy.get(sel.hour).click();
        cy.get(sel.openTimeGrid).should('exist');

        cy.get('body').click(0, 0);
        cy.get(sel.timeGrid).should('have.attr', 'hidden');
        cy.get(sel.daysGrid).should('exist');
      });

      it('should close the grid when focus moves out of the time cluster', () => {
        mountCalendar({ data: { myAppointment: '2026-02-13T09:30:00' }, props: officeProps });

        cy.get(sel.hour).click();
        cy.get(sel.rovingOption).focus();

        // Tabbing out: focus lands outside the time input/grid
        cy.get('[data-cy="submitBtn_button"]').focus();

        cy.get(sel.timeGrid).should('have.attr', 'hidden');
        cy.get(sel.daysGrid).should('exist');
      });
    });

    describe('keyboard and panel interplay', () => {
      it('should navigate the grid with arrows (4 columns), select with Enter and close with Escape', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountCalendar({
          data: { myAppointment: '2026-02-13T09:00:00' },
          props: officeProps,
          formSubmit: formSubmitHandler,
        });

        cy.get(sel.hour).click();
        cy.get(sel.rovingOption).focus();
        cy.focused().should('have.attr', 'data-value', '09:00:00');

        cy.focused().type('{rightArrow}');
        cy.focused().should('have.attr', 'data-value', '09:30:00');

        cy.focused().type('{downArrow}');
        cy.focused().should('have.attr', 'data-value', '11:00:00');

        cy.focused().type('{enter}');
        cy.get(sel.timeGrid).should('have.attr', 'hidden');
        cy.get(sel.hour).should('have.value', '11');

        // Escape closes without selecting and returns focus to the time input
        cy.get(sel.hour).click();
        cy.get(sel.rovingOption).focus();
        cy.focused().type('{esc}');
        cy.get(sel.timeGrid).should('have.attr', 'hidden');
        cy.focused().should('have.attr', 'data-type', 'hour');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myAppointment: '2026-02-13T11:00:00' });
        });
      });

      it('should flip the horizontal arrows in RTL', () => {
        mountCalendar({
          data: { myAppointment: '2026-02-13T09:30:00' },
          props: officeProps,
          lang: 'ar',
        });

        cy.get(sel.hour).click();
        cy.get(sel.rovingOption).focus();
        cy.focused().should('have.attr', 'data-value', '09:30:00');

        // Visually right = previous option in RTL
        cy.focused().type('{rightArrow}');
        cy.focused().should('have.attr', 'data-value', '09:00:00');
      });

      it('should close the time grid when the year selector opens', () => {
        mountCalendar({ data: { myAppointment: '2026-02-13T09:30:00' }, props: officeProps });

        cy.get(sel.hour).click();
        cy.get(sel.openTimeGrid).should('exist');

        cy.get(sel.yearSelector).click();
        cy.get(sel.timeGrid).should('have.attr', 'hidden');
        cy.get(sel.yearGrid).should('exist');
      });
    });

    describe('readonly and disabled', () => {
      it('should not select days nor open the grid when readonly', () => {
        mountCalendar({
          data: { myAppointment: '2026-02-13T09:30:00' },
          props: officeProps,
          readonly: true,
        });

        day('2026-02-16').click({ force: true });
        cy.get(sel.hour).should('have.value', '09');

        cy.get(sel.hour).click({ force: true });
        cy.get(sel.timeGrid).should('have.attr', 'hidden');
      });

      it('should render everything disabled and never open the grid when disabled', () => {
        mountCalendar({
          data: { myAppointment: '2026-02-13T09:30:00' },
          props: officeProps,
          disabled: true,
        });

        cy.get(sel.hour).should('be.disabled');

        // Day clicks are guarded, not natively disabled
        day('2026-02-16').click({ force: true });
        day('2026-02-13').should('have.class', 'selected');

        cy.get(sel.hour).click({ force: true });
        cy.get(sel.timeGrid).should('have.attr', 'hidden');
      });
    });

    describe('accessibility', () => {
      const liveRegion = 'gui-date-time-calendar .gui-visually-hidden[aria-live="polite"]';
      const nextMonth = 'gui-date-time-calendar .gui-calendar__month-button--next';

      it('should name the days grid after the visible month and announce month changes', () => {
        mountCalendar({ data: { myAppointment: '2026-02-13T09:30:00' }, props: officeProps });

        cy.get(sel.daysGrid).should('have.attr', 'aria-label', 'February 2026');
        cy.get(`${sel.daysGrid} .gui-calendar__weekday`)
          .should('have.length', 7)
          .each(($cell) => cy.wrap($cell).should('have.attr', 'role', 'columnheader'));
        cy.get(liveRegion).should('have.text', 'February 2026');

        cy.get(nextMonth).click();
        cy.get(sel.daysGrid).should('have.attr', 'aria-label', 'March 2026');
        cy.get(liveRegion).should('have.text', 'March 2026');
      });

      it('should label the year selector and year grid with English defaults', () => {
        mountCalendar({ data: { myAppointment: '2026-02-13T09:30:00' }, props: officeProps });

        cy.get(sel.yearSelector).should('have.attr', 'aria-label', 'Select year, 2026');
        cy.get(sel.yearSelector).click();
        cy.get(sel.yearGrid).should('have.attr', 'aria-label', 'Year selection');
      });

      it('should honor the year label override props', () => {
        mountCalendar({
          data: { myAppointment: '2026-02-13T09:30:00' },
          props: {
            ...officeProps,
            selectYearAriaLabel: 'Elegir año',
            yearGridAriaLabel: 'Selección de año',
          },
        });

        cy.get(sel.yearSelector).should('have.attr', 'aria-label', 'Elegir año, 2026');
        cy.get(sel.yearSelector).click();
        cy.get(sel.yearGrid).should('have.attr', 'aria-label', 'Selección de año');
      });
    });
  });
};
