import { defineForm, identityTranslator } from '@golemui/core';
import { type MountComponentFn } from '../utils';

// Behavior tests for the gui-range-date-time-calendar web component: a range
// calendar hosting two time pickers, accumulating a DateTimeRange[] value as
// pills. Interactive tests use current-month relative dates so the day buttons
// are visible without hydrating a value first.
export const runRangeDateTimeCalendarComponentTests = (mountFn: MountComponentFn) => {
  describe('RangeDateTimeCalendar Component', () => {
    const cal = 'gui-range-date-time-calendar';
    const sel = {
      dayButton: `${cal} .gui-calendar__day-button`,
      pillText: `${cal} .gui-pills__pill-text`,
      dayCount: '.gui-range-date-time-calendar__day-count',
      startPicker: `${cal} gui-time-picker.gui-range-date-time-calendar__start`,
      endPicker: `${cal} gui-time-picker.gui-range-date-time-calendar__end`,
      error: '[data-cy="testSubject_validator-error"]',
    };

    const now = new Date();
    const y = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const iso = (d: number) => `${y}-${mm}-${String(d).padStart(2, '0')}`;
    const dt = (d: number, time: string) => `${iso(d)}T${time}`;

    const day = (d: number) => cy.get(`${sel.dayButton}[data-date="${iso(d)}"]`);
    const startHour = () => cy.get(`${sel.startPicker} gui-time input[data-type="hour"]`);
    const endHour = () => cy.get(`${sel.endPicker} gui-time input[data-type="hour"]`);
    const startOption = (time: string) =>
      cy.get(`${sel.startPicker} gui-time-list .gui-time-list__option[data-value="${time}"]`);
    const endOption = (time: string) =>
      cy.get(`${sel.endPicker} gui-time-list .gui-time-list__option[data-value="${time}"]`);

    const mountCalendar = (options?: {
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
              uid: 'testSubject',
              kind: 'input',
              type: 'rangeDateTimeCalendar',
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

    const submitAndGetData = (formSubmitAlias: string) => {
      cy.get('[data-cy="submitBtn_button"]').click({ force: true });
      return cy.get(formSubmitAlias).then((stub: any) => stub.getCall(0).args[0].data);
    };

    // Select a date range then a start + end time, committing one pill.
    const commitRange = (startDay: number, startTime: string, endDay: number, endTime: string) => {
      day(startDay).click();
      day(endDay).click();
      startHour().click();
      startOption(startTime).click();
      endHour().click();
      endOption(endTime).click();
    };

    describe('selection flow', () => {
      it('should keep both time pickers usable from the start', () => {
        mountCalendar();

        startHour().should('not.be.disabled');
        endHour().should('not.be.disabled');

        day(13).click();
        startHour().should('not.be.disabled');

        day(13).click();
        startHour().should('not.be.disabled');
        endHour().should('not.be.disabled');
      });

      it('should commit a range whose times were picked before the days', () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountCalendar({ formSubmit });

        // Times first, no day span yet: nothing commits, both are kept
        startHour().click();
        startOption('09:00:00').click();
        endHour().click();
        endOption('11:00:00').click();
        cy.get(sel.pillText).should('have.length', 0);

        // Completing the span commits the whole range
        day(13).click();
        day(13).click();

        cy.get(sel.pillText).should('have.length', 1);
        submitAndGetData('@formSubmit').then((data) => {
          expect(data.myRanges).to.deep.equal([
            { start: dt(13, '09:00:00'), end: dt(13, '11:00:00') },
          ]);
        });
      });

      it('should keep the picked times when a new day span is started', () => {
        mountCalendar();

        startHour().click();
        startOption('09:00:00').click();

        // Restarting the span must not discard a time already chosen
        day(13).click();
        day(16).click();
        day(20).click();

        startHour().should('have.value', '09');
      });

      it('should commit a same-day range as a pill and reset the pickers', () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountCalendar({ formSubmit });

        commitRange(13, '09:00:00', 13, '11:00:00');

        cy.get(sel.pillText).should('have.length', 1);
        // Both time inputs are cleared after a commit — the end picker must not
        // keep showing the last picked value — and both stay usable.
        startHour().should('have.value', '');
        endHour().should('have.value', '');
        startHour().should('not.be.disabled');
        endHour().should('not.be.disabled');

        submitAndGetData('@formSubmit').then((data) => {
          expect(data.myRanges).to.deep.equal([
            { start: dt(13, '09:00:00'), end: dt(13, '11:00:00') },
          ]);
        });
      });

      it('should clear the end list selection for the next range', () => {
        mountCalendar();

        commitRange(13, '09:00:00', 13, '11:00:00');

        // Start a new range and reopen the end list — the previous end option
        // must no longer be selected.
        day(15).click();
        day(15).click();
        startHour().click();
        startOption('09:00:00').click();
        endHour().click();

        cy.get(`${sel.endPicker} gui-time-list .gui-time-list__option--selected`).should(
          'not.exist',
        );
      });

      it('should keep a cross-day range as-is without double-classing the end day', () => {
        mountCalendar();

        day(13).click();
        day(20).click();
        startHour().click();
        startOption('18:00:00').click();
        endHour().click();
        endOption('09:00:00').click();

        cy.get(sel.pillText).should('have.length', 1);
        day(13).should('have.class', 'range-start');
        day(15).should('have.class', 'in-range');
        // The end day (09:00) must be range-end only — not also in-range, which
        // would fight the border radii (the endpointDay truncation guard).
        day(20).should('have.class', 'range-end').and('not.have.class', 'in-range');
      });
    });

    describe('multiple ranges per day', () => {
      it('should keep two non-overlapping same-day ranges and badge the day', () => {
        mountCalendar();

        commitRange(13, '09:00:00', 13, '11:00:00');
        commitRange(13, '14:00:00', 13, '15:00:00');

        cy.get(sel.pillText).should('have.length', 2);
        day(13).find(sel.dayCount).should('have.text', '2');
        // The selection bubble's hover label lists the committed ranges.
        day(13)
          .find('.gui-range-date-time-calendar__badge-tooltip')
          .should('contain', '9:00 AM')
          .and('contain', '3:00 PM')
          .and('not.be.visible');
      });

      it('should merge overlapping same-day ranges into one pill with no badge', () => {
        mountCalendar();

        commitRange(13, '09:00:00', 13, '11:00:00');
        commitRange(13, '10:00:00', 13, '12:00:00');

        cy.get(sel.pillText).should('have.length', 1);
        day(13).find(sel.dayCount).should('not.exist');
      });
    });

    describe('bounds and disabled spans', () => {
      it('should badge a partially-blocked day with its span count and hover label', () => {
        mountCalendar({
          props: {
            disabledRanges: [
              { start: dt(17, '10:00:00'), end: dt(17, '11:00:00') },
              { start: dt(17, '13:00:00'), end: dt(17, '14:00:00') },
              { start: dt(15, '00:00:00'), end: dt(15, '23:59:59') },
            ],
          },
        });

        // Two partial spans on the 17th → grey bubble '2', hover label listing
        // both clock windows (hidden until hovered).
        day(17).find('.gui-range-date-time-calendar__disabled-count').should('have.text', '2');
        day(17)
          .find('.gui-range-date-time-calendar__badge-tooltip')
          .should('contain', '10:00 AM – 11:00 AM')
          .and('contain', '1:00 PM – 2:00 PM')
          .and('not.be.visible');

        // A fully-blocked day greys out as a whole — no bubble; free days none.
        day(15).find('.gui-range-date-time-calendar__disabled-count').should('not.exist');
        day(16).find('.gui-range-date-time-calendar__disabled-count').should('not.exist');
      });

      it('should stack the selection and disabled bubbles side by side', () => {
        mountCalendar({
          props: {
            disabledRanges: [{ start: dt(13, '16:00:00'), end: dt(13, '17:00:00') }],
          },
        });

        commitRange(13, '09:00:00', 13, '11:00:00');
        commitRange(13, '13:00:00', 13, '14:00:00');

        day(13).find('.gui-range-date-time-calendar__badges').should('exist');
        day(13).find(sel.dayCount).should('have.text', '2');
        day(13).find('.gui-range-date-time-calendar__disabled-count').should('have.text', '1');
      });

      it('should clamp the start list on the minDateTime boundary day', () => {
        mountCalendar({ props: { minDateTime: dt(13, '10:00:00') } });

        day(13).click();
        day(13).click();
        startHour().click();

        startOption('09:00:00').should('not.exist');
        startOption('10:00:00').should('exist');
      });

      it('should grey the slots of a partial block and reject an overlapping range', () => {
        mountCalendar({
          props: {
            disabledRanges: [{ start: dt(13, '10:00:00'), end: dt(13, '11:00:00') }],
            disabledRangeMessage: 'Range unavailable',
          },
        });

        // A partial block leaves the day clickable but greys its slots.
        day(13).should('not.be.disabled');
        day(13).click();
        day(13).click();
        startHour().click();
        startOption('10:00:00').should('be.disabled');

        // 09:00–12:00 steps over the disabled 10:00–11:00 → rejected, no pill.
        startOption('09:00:00').click();
        endHour().click();
        endOption('12:00:00').click();

        cy.get(sel.pillText).should('not.exist');
        cy.get(sel.error).should('be.visible').and('contain', 'Range unavailable');
      });

      it('should not create a pill from a typed, uncommitted end time', () => {
        mountCalendar({
          props: {
            hourFormat: '24',
            allowCustomTime: true,
            disabledRanges: [{ start: dt(17, '13:00:00'), end: dt(17, '14:00:00') }],
            disabledRangeMessage: 'Range unavailable',
          },
        });

        day(15).click();
        day(17).click();
        startHour().click();
        startOption('14:30:00').click();

        // Type 13:00 into the end picker (allowCustomTime) without committing —
        // no Enter, no list pick. It surfaces the error but must NOT create a pill.
        cy.get(`${sel.endPicker} gui-time input[data-type="hour"]`).click().type('13');
        cy.get(`${sel.endPicker} gui-time input[data-type="minute"]`).type('00');

        cy.get(sel.pillText).should('not.exist');
        cy.get(sel.error).should('be.visible').and('contain', 'Range unavailable');
      });

      it('should commit a range finished with a typed end time when focus leaves', () => {
        mountCalendar({ props: { allowCustomTime: true } });

        day(13).click();
        day(15).click();
        startHour().click();
        startOption('09:00:00').click();

        // A typed custom time never commits as it is typed — only a list pick
        // or Enter does — so the fourth piece lands here unclaimed.
        cy.get(`${sel.endPicker} gui-time input[data-type="hour"]`).click().type('11');
        cy.get(`${sel.endPicker} gui-time input[data-type="minute"]`).type('30');
        cy.get(sel.pillText).should('not.exist');

        // Leaving is as deliberate as Enter, and the selection is complete.
        cy.get('[data-cy="submitBtn_button"]').focus();
        cy.get(sel.pillText).should('have.length', 1);
        startHour().should('have.value', '');
      });

      it('should disable a fully-blocked day and reject a range stepping over it', () => {
        mountCalendar({
          props: {
            disabledRanges: [{ start: dt(15, '00:00:00'), end: dt(15, '23:59:59') }],
            disabledRangeMessage: 'Range unavailable',
          },
        });

        // Fully-blocked in-month days stay in the accessibility tree
        // (aria-disabled) instead of being natively disabled
        day(15).should('have.attr', 'aria-disabled', 'true').and('not.have.attr', 'disabled');

        day(13).click();
        day(17).click();

        cy.get(sel.pillText).should('not.exist');
        day(13).should('have.class', 'invalid-range-start');
        cy.get(sel.error).should('be.visible').and('contain', 'Range unavailable');
      });
    });

    describe('hydration and states', () => {
      it('should hydrate a DateTimeRange[] value into pills and day highlights', () => {
        mountCalendar({
          data: { myRanges: [{ start: dt(10, '09:00:00'), end: dt(12, '17:00:00') }] },
        });

        cy.get(sel.pillText).should('have.length', 1);
        day(10).should('have.class', 'range-start');
        day(11).should('have.class', 'in-range');
        day(12).should('have.class', 'range-end').and('not.have.class', 'in-range');
      });

      it('should not allow selection when disabled', () => {
        mountCalendar({
          data: { myRanges: [{ start: dt(13, '09:00:00'), end: dt(13, '11:00:00') }] },
          disabled: true,
        });

        // Both pickers are disabled and the hydrated pill is preserved.
        startHour().should('be.disabled');
        endHour().should('be.disabled');
        cy.get(sel.pillText).should('have.length', 1);
      });
    });
  });
};
