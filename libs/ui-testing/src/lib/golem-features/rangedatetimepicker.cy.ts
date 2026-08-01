import { defineForm, identityTranslator } from '@golemui/core';
import { type MountComponentFn } from '../utils';

// Behavior tests for the gui-range-date-time-picker web component: the typed
// gui-range-date-time input as the trigger (holding the pills) with the
// gui-range-date-time-calendar in a popover. These pin the COMPOSITION —
// open/close, committing a pill into the trigger, the popover staying open for
// more ranges, pill navigation, delegated validation — not the calendar
// internals, which rangedatetimecalendar.cy.ts already covers. Interactive
// tests use current-month relative dates so day buttons are visible.
export const runRangeDateTimePickerComponentTests = (mountFn: MountComponentFn) => {
  describe('RangeDateTimePicker Component', () => {
    const picker = 'gui-range-date-time-picker';
    const cal = `${picker} gui-range-date-time-calendar`;
    const sel = {
      calendar: cal,
      trigger: `${picker} gui-range-date-time`,
      triggerPart: (group: 'start' | 'end', type: string) =>
        `${picker} gui-range-date-time input[data-group="${group}"][data-type="${type}"]`,
      pillText: `${picker} gui-range-date-time .gui-pills__pill-text`,
      dayButton: (date: string) => `${cal} .gui-calendar__day-button[data-date="${date}"]`,
      startPicker: `${cal} gui-time-picker.gui-range-date-time-calendar__start`,
      endPicker: `${cal} gui-time-picker.gui-range-date-time-calendar__end`,
      error: '[data-cy="testSubject_validator-error"]',
    };

    const now = new Date();
    const y = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const iso = (d: number) => `${y}-${mm}-${String(d).padStart(2, '0')}`;
    const dt = (d: number, time: string) => `${iso(d)}T${time}`;

    const startHour = () => cy.get(`${sel.startPicker} gui-time input[data-type="hour"]`);
    const endHour = () => cy.get(`${sel.endPicker} gui-time input[data-type="hour"]`);
    const startOption = (time: string) =>
      cy.get(`${sel.startPicker} gui-time-list .gui-time-list__option[data-value="${time}"]`);
    const endOption = (time: string) =>
      cy.get(`${sel.endPicker} gui-time-list .gui-time-list__option[data-value="${time}"]`);

    const mountPicker = (options?: {
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
              type: 'rangeDateTimePicker',
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

    // Open the popover, then pick a date range + start/end time to commit a pill.
    const openAndCommit = (
      startDay: number,
      startTime: string,
      endDay: number,
      endTime: string,
    ) => {
      cy.get(sel.triggerPart('start', 'day')).click();
      cy.get(sel.calendar).should('exist');
      cy.get(sel.dayButton(iso(startDay))).click();
      cy.get(sel.dayButton(iso(endDay))).click();
      startHour().click();
      startOption(startTime).click();
      endHour().click();
      endOption(endTime).click();
    };

    describe('open / close', () => {
      it('should not render the calendar initially', () => {
        mountPicker({
          data: { myRanges: [{ start: dt(10, '09:00:00'), end: dt(12, '17:00:00') }] },
        });
        cy.get(sel.calendar).should('not.exist');
      });

      it('should open the calendar when clicking a trigger input part', () => {
        mountPicker();
        cy.get(sel.triggerPart('start', 'day')).click();
        cy.get(sel.calendar).should('exist');
      });

      it('should close the calendar when clicking outside', () => {
        mountPicker();
        cy.get(sel.triggerPart('start', 'day')).click();
        cy.get(sel.calendar).should('exist');
        cy.get('body').click(0, 0);
        cy.get(sel.calendar).should('not.exist');
      });

      it('should close the calendar with Escape', () => {
        mountPicker();
        cy.get(sel.triggerPart('start', 'day')).click();
        cy.get(sel.calendar).should('exist');
        cy.get(sel.dayButton(iso(13))).focus();
        cy.focused().type('{esc}');
        cy.get(sel.calendar).should('not.exist');
      });

      it('should close the calendar when focus leaves the picker', () => {
        mountPicker();
        cy.get(sel.triggerPart('start', 'day')).click();
        cy.get(sel.calendar).should('exist');
        cy.get('[data-cy="submitBtn_button"]').focus();
        cy.get(sel.calendar).should('not.exist');
      });

      it('should stay open when clicking a non-interactive area inside the calendar', () => {
        mountPicker();

        // Select a range so the start time picker enables and focus is parked
        // on the last-clicked day button
        cy.get(sel.triggerPart('start', 'day')).click();
        cy.get(sel.dayButton(iso(13))).click();
        cy.get(sel.dayButton(iso(15))).click();
        startHour().should('not.be.disabled');

        // Clicking dead space inside the popover blurs the day button to body;
        // that must not light-dismiss the popover — only real outside
        // interactions may close it
        cy.get(`${cal} .gui-calendar__weekday`).first().click();
        cy.get(sel.calendar).should('exist');

        // The still-disabled end picker is also "inside" (mouse events are
        // swallowed by disabled controls, pointerdown is not)
        endHour().should('be.disabled');
        endHour().click({ force: true });
        cy.get(sel.calendar).should('exist');

        // Outside clicks still close
        cy.get('body').click(0, 0);
        cy.get(sel.calendar).should('not.exist');
      });

      it('should stay open while interacting with the embedded time picker chrome', () => {
        mountPicker();

        cy.get(sel.triggerPart('start', 'day')).click();
        cy.get(sel.calendar).should('exist');
        cy.get(sel.dayButton(iso(13))).click();
        cy.get(sel.dayButton(iso(15))).click();
        startHour().should('not.be.disabled');

        // Non-focusable chrome around the time input (label, widget padding)
        // blurs the focused day button with no relatedTarget; the popover must
        // not read that as a departure
        cy.get(`${sel.startPicker} .gui-label`).first().click();
        cy.get(sel.calendar).should('exist');
        cy.get(`${sel.startPicker} .gui-widget`).first().click('topLeft');
        cy.get(sel.calendar).should('exist');

        // Entering the time input opens the list; picking an option commits
        // the start time — all without dismissing the popover
        startHour().click();
        cy.get(sel.calendar).should('exist');
        startOption('09:00:00').should('be.visible').click();
        cy.get(sel.calendar).should('exist');
        endHour().should('not.be.disabled');
      });

      it('should toggle the time list from its chevron without dismissing the popover', () => {
        mountPicker();

        cy.get(sel.triggerPart('start', 'day')).click();
        cy.get(sel.dayButton(iso(13))).click();
        cy.get(sel.dayButton(iso(15))).click();
        startHour().should('not.be.disabled');

        cy.get(`${sel.startPicker} .gui-time-picker__arrow`).click();
        startOption('09:00:00').should('be.visible');
        cy.get(sel.calendar).should('exist');

        cy.get(`${sel.startPicker} .gui-time-picker__arrow`).click();
        startOption('09:00:00').should('not.be.visible');
        cy.get(sel.calendar).should('exist');
      });

      it('should stay open when a mid-gesture layout shift retargets the click', () => {
        // Real browsers retarget a click to the common ancestor when the
        // mousedown and mouseup targets differ — which happens when the time
        // list opens mid-gesture and re-flows the popover. Simulate the
        // retarget: pointerdown on the hour input, the trailing click
        // materializing on the picker's anchor chrome
        mountPicker();

        cy.get(sel.triggerPart('start', 'day')).click();
        cy.get(sel.dayButton(iso(13))).click();
        cy.get(sel.dayButton(iso(15))).click();
        startHour().trigger('pointerdown');
        cy.get(`${picker} > .gui-widget`).then(($el) => {
          $el[0].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        });
        // Give a wrongly-triggered close a beat to unmount before asserting
        cy.wait(50);
        cy.get(sel.calendar).should('exist');
        startHour().should('not.be.disabled');
      });

      it('should stay open when chrome clicks hand focus to a focusable tabpanel ancestor', () => {
        // The playgrounds host widgets inside tabs, and role="tabpanel"
        // carries tabindex="0" — so in a real browser, clicking non-focusable
        // chrome moves focus to the SECTION ancestor (focusout with a non-null
        // relatedTarget outside the picker) instead of dropping it to body.
        // That is still gesture churn, not a departure.
        mountFn({
          localization: identityTranslator('en-US'),
          formDef: defineForm({
            form: [
              {
                uid: 'hostTabs',
                kind: 'layout',
                type: 'tabs',
                props: { tabs: [{ label: 'Pickers', uid: 'testSubject' }] },
                children: [
                  {
                    uid: 'testSubject',
                    kind: 'input',
                    type: 'rangeDateTimePicker',
                    path: 'myRanges',
                  },
                ],
              },
            ],
          }),
        });

        cy.get(sel.triggerPart('start', 'day')).click();
        cy.get(sel.dayButton(iso(13))).click();
        cy.get(sel.dayButton(iso(15))).click();
        startHour().click();

        // Gesture starts on the time picker's label; the browser's
        // focus-nearest-focusable-ancestor fallback lands on the tabpanel
        cy.get(`${sel.startPicker} .gui-label`).first().trigger('pointerdown');
        cy.get('section[role="tabpanel"]').first().focus();
        cy.wait(50);
        cy.get(sel.calendar).should('exist');
        startHour().should('not.be.disabled');
      });

      it('should stay open when navigating to the minDateTime boundary month', () => {
        // minDateTime two months back: clicking prev into the boundary month
        // disables the prev arrow that holds focus, which used to drop focus to
        // <body> and close the whole popover.
        const min = new Date(y, now.getMonth() - 2, 1);
        const minIso = `${min.getFullYear()}-${String(min.getMonth() + 1).padStart(2, '0')}-01T09:00:00`;
        mountPicker({ props: { minDateTime: minIso } });

        cy.get(sel.triggerPart('start', 'day')).click();
        cy.get(sel.calendar).should('exist');

        cy.get(`${cal} .gui-calendar__month-button--prev`).click();
        cy.get(sel.calendar).should('exist');
        cy.get(`${cal} .gui-calendar__month-button--prev`).click();

        // Landed on the boundary month: prev is disabled, popover still open,
        // and focus parked inside the calendar so it survives the re-render.
        cy.get(sel.calendar).should('exist');
        cy.get(`${cal} .gui-calendar__month-button--prev`).should('be.disabled');
        cy.get(`${cal} .gui-calendar__day-button[data-date="${minIso.split('T')[0]}"]`).should(
          'exist',
        );
      });
    });

    describe('committing ranges', () => {
      it('should commit a pill into the trigger, keep the popover open, and submit', () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountPicker({ formSubmit });

        openAndCommit(13, '09:00:00', 13, '11:00:00');

        // The pill lands in the trigger input; the popover stays open for more.
        cy.get(sel.pillText).should('have.length', 1);
        cy.get(sel.calendar).should('exist');

        cy.get('body').click(0, 0);
        cy.get(sel.calendar).should('not.exist');

        cy.get('[data-cy="submitBtn_button"]').click({ force: true });
        cy.get('@formSubmit').then((stub: any) => {
          expect(stub.getCall(0).args[0].data.myRanges).to.deep.equal([
            { start: dt(13, '09:00:00'), end: dt(13, '11:00:00') },
          ]);
        });
      });

      it('should accumulate a second non-overlapping same-day range as a second pill', () => {
        mountPicker();

        openAndCommit(13, '09:00:00', 13, '11:00:00');
        cy.get(sel.pillText).should('have.length', 1);

        // Popover is still open — add a second, non-overlapping range.
        cy.get(sel.dayButton(iso(13))).click();
        cy.get(sel.dayButton(iso(13))).click();
        startHour().click();
        startOption('14:00:00').click();
        endHour().click();
        endOption('15:00:00').click();

        cy.get(sel.pillText).should('have.length', 2);
      });
    });

    describe('hydration and navigation', () => {
      it('should hydrate a DateTimeRange[] value into trigger pills and reflect them in the calendar', () => {
        mountPicker({
          data: { myRanges: [{ start: dt(10, '09:00:00'), end: dt(12, '17:00:00') }] },
        });

        cy.get(sel.pillText).should('have.length', 1);

        cy.get(sel.triggerPart('start', 'day')).click();
        cy.get(sel.dayButton(iso(10))).should('have.class', 'range-start');
        cy.get(sel.dayButton(iso(12)))
          .should('have.class', 'range-end')
          .and('not.have.class', 'in-range');
      });

      it('should open the calendar at the month of the clicked pill', () => {
        // One pill this month, one three months back — click the older one.
        const older = new Date(y, now.getMonth() - 3, 5);
        const oy = older.getFullYear();
        const om = String(older.getMonth() + 1).padStart(2, '0');
        const olderStart = `${oy}-${om}-05T09:00:00`;
        const olderEnd = `${oy}-${om}-06T10:00:00`;

        mountPicker({
          data: {
            myRanges: [
              { start: dt(13, '09:00:00'), end: dt(13, '11:00:00') },
              { start: olderStart, end: olderEnd },
            ],
          },
        });

        // force: gui-pills may collapse to compact mode in narrow harnesses.
        cy.get(sel.pillText).contains(`${om}/05/${oy}`).click({ force: true });
        cy.get(sel.calendar).should('exist');
        cy.get(`${cal} .gui-calendar__day-button[data-date="${oy}-${om}-05"]`).should('exist');
      });
    });

    describe('delegated validation', () => {
      it('should reject a range overlapping a disabled span with an error and no pill', () => {
        mountPicker({
          props: {
            disabledRanges: [{ start: dt(13, '10:00:00'), end: dt(13, '11:00:00') }],
            disabledRangeMessage: 'Range unavailable',
          },
        });

        cy.get(sel.triggerPart('start', 'day')).click();
        cy.get(sel.dayButton(iso(13))).click();
        cy.get(sel.dayButton(iso(13))).click();
        startHour().click();
        startOption('09:00:00').click();
        endHour().click();
        endOption('12:00:00').click();

        cy.get(sel.pillText).should('not.exist');
        cy.get(sel.error).should('be.visible').and('contain', 'Range unavailable');
      });

      it('should reject a typed range overlapping a disabled span with an error and no pill', () => {
        mountPicker({
          props: {
            hourFormat: '24',
            allowCustomTime: true,
            // Both typed endpoints are legal instants; only the SPAN steps over
            // the 13:00–14:00 hole. This must not create a pill.
            disabledRanges: [{ start: dt(17, '13:00:00'), end: dt(17, '14:00:00') }],
            disabledRangeMessage: 'Range unavailable',
          },
        });

        const changeSpy = cy.spy().as('changeSpy');
        cy.get(picker).then(($el) => {
          $el[0].addEventListener('change', changeSpy as unknown as EventListener);
        });

        // Type 17th 11:00 → 17th 15:00 into the trigger and Enter.
        cy.get(sel.triggerPart('start', 'day')).click();
        cy.focused().type('17');
        cy.get(sel.triggerPart('start', 'month')).click();
        cy.focused().type(mm);
        cy.get(sel.triggerPart('start', 'year')).click();
        cy.focused().type(String(y));
        cy.get(sel.triggerPart('start', 'hour')).click();
        cy.focused().type('11');
        cy.get(sel.triggerPart('start', 'minute')).click();
        cy.focused().type('00');

        cy.get(sel.triggerPart('end', 'day')).click();
        cy.focused().type('17');
        cy.get(sel.triggerPart('end', 'month')).click();
        cy.focused().type(mm);
        cy.get(sel.triggerPart('end', 'year')).click();
        cy.focused().type(String(y));
        cy.get(sel.triggerPart('end', 'hour')).click();
        cy.focused().type('15');
        cy.get(sel.triggerPart('end', 'minute')).click();
        cy.focused().type('00');
        cy.focused().type('{enter}');

        cy.get(sel.pillText).should('not.exist');
        cy.get('@changeSpy').should('not.have.been.called');
        cy.get(sel.error).should('be.visible').and('contain', 'Range unavailable');
        // The typed values stay in the inputs so the user can correct them.
        cy.get(sel.triggerPart('end', 'hour')).should('have.value', '15');
      });

      it('should reject a typed invalid instant in the trigger with an error and no pill', () => {
        mountPicker({
          props: {
            hourFormat: '24',
            allowCustomTime: true,
            minDateTime: dt(10, '00:00:00'),
            maxDateTime: dt(20, '12:00:00'),
            maxDateTimeMessage: 'Too late',
          },
        });

        const changeSpy = cy.spy().as('changeSpy');
        cy.get(picker).then(($el) => {
          $el[0].addEventListener('change', changeSpy as unknown as EventListener);
        });

        // Type a full range whose end (25th) is past the max (20th) and Enter.
        cy.get(sel.triggerPart('start', 'day')).click();
        cy.focused().type('18');
        cy.get(sel.triggerPart('start', 'month')).click();
        cy.focused().type(mm);
        cy.get(sel.triggerPart('start', 'year')).click();
        cy.focused().type(String(y));
        cy.get(sel.triggerPart('start', 'hour')).click();
        cy.focused().type('09');
        cy.get(sel.triggerPart('start', 'minute')).click();
        cy.focused().type('00');

        cy.get(sel.triggerPart('end', 'day')).click();
        cy.focused().type('25');
        cy.get(sel.triggerPart('end', 'month')).click();
        cy.focused().type(mm);
        cy.get(sel.triggerPart('end', 'year')).click();
        cy.focused().type(String(y));
        cy.get(sel.triggerPart('end', 'hour')).click();
        cy.focused().type('10');
        cy.get(sel.triggerPart('end', 'minute')).click();
        cy.focused().type('00');
        cy.focused().type('{enter}');

        cy.get(sel.pillText).should('not.exist');
        cy.get('@changeSpy').should('not.have.been.called');
      });
    });

    describe('states', () => {
      it('should not open the calendar when disabled and preserve hydrated pills', () => {
        mountPicker({
          data: { myRanges: [{ start: dt(13, '09:00:00'), end: dt(13, '11:00:00') }] },
          disabled: true,
        });

        cy.get(`${picker} .gui-widget`).first().click({ force: true });
        cy.get(sel.calendar).should('not.exist');
        cy.get(sel.pillText).should('have.length', 1);
      });

      it('should not commit a new range when readonly', () => {
        mountPicker({
          data: { myRanges: [{ start: dt(13, '09:00:00'), end: dt(13, '11:00:00') }] },
          readonly: true,
        });

        cy.get(sel.triggerPart('start', 'day')).click();
        cy.get(sel.calendar).should('exist');
        cy.get(sel.dayButton(iso(15))).click();
        cy.get(sel.dayButton(iso(16))).click();

        // The pickers stay disabled; the hydrated pill is untouched.
        cy.get(sel.pillText).should('have.length', 1);
      });
    });

    describe('accessibility', () => {
      const toggleSel = 'button.gui-range-date-time-picker__arrow';

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
        cy.get('gui-range-date-time-calendar')
          .should('have.attr', 'role', 'dialog')
          .should('have.id', 'testSubject_popup');
        cy.focused().should('have.class', 'gui-calendar__day-button');
      });
    });
  });
};
