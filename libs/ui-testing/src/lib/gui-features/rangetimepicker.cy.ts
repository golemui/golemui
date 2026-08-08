import { defineForm, identityTranslator } from '@golemui/core';
import { type MountComponentFn } from '../utils';

// Behavior tests for the gui-range-time-picker: the gui-range-time typed input
// plus a two-list popover (time-in left, time-out right). Both lists are usable
// from the start, and once an in is chosen the out list floors one slot after
// it so end > start strictly. Committed ranges accumulate as merged pills
// (value = TimeRange[]). Uses en-GB (24h) so option labels are plain HH:mm.
export const runRangeTimePickerComponentTests = (mountFn: MountComponentFn) => {
  describe('RangeTimePicker Component', () => {
    const uid = 'testSubject';
    const sel = {
      startHour: 'gui-range-time input[data-group="start"][data-type="hour"]',
      startMinute: 'gui-range-time input[data-group="start"][data-type="minute"]',
      endHour: 'gui-range-time input[data-group="end"][data-type="hour"]',
      endMinute: 'gui-range-time input[data-group="end"][data-type="minute"]',
      panel: '.gui-range-time-picker__panel',
      inList: '.gui-range-time-picker__column:first-child gui-time-list',
      outList: '.gui-range-time-picker__column:last-child gui-time-list',
      inItems: '.gui-range-time-picker__column:first-child .gui-time-list__option',
      outItems: '.gui-range-time-picker__column:last-child .gui-time-list__option',
      pillText: 'gui-range-time .gui-pills__pill-text',
      pillRemove: 'gui-range-time .gui-pills__pill-remove',
    };

    // Office hours 09:00–12:00 in 30-minute slots → 7 options per list.
    const officeProps = {
      minTime: '09:00:00',
      maxTime: '12:00:00',
      minuteStep: 30,
    };

    const mountRangeTimePicker = (options?: {
      data?: Record<string, any>;
      lang?: string;
      props?: Record<string, any>;
      formSubmit?: (event: any) => void;
      readonly?: boolean;
      disabled?: boolean;
    }) => {
      mountFn({
        localization: identityTranslator(options?.lang ?? 'en-GB'),
        data: options?.data,
        formDef: defineForm({
          form: [
            {
              uid,
              kind: 'input',
              type: 'rangeTimePicker',
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

    it('should hydrate a TimeRange[] value into pills with the panel closed', () => {
      mountRangeTimePicker({
        data: { myRanges: [{ start: '09:00:00', end: '11:00:00' }] },
        props: officeProps,
      });
      cy.get(sel.pillText).should('have.length', 1).and('contain', '09:00');
      cy.get(sel.panel).should('not.exist');
    });

    it('should open the panel with both lists usable from the start', () => {
      mountRangeTimePicker({ props: officeProps });

      cy.get(sel.startHour).click();
      cy.get(sel.panel).should('exist');
      cy.get(sel.inItems).should('have.length', 7);
      // The end list is pickable before a start exists: order is up to the user.
      cy.get(sel.outItems).should('have.length', 7);
      cy.get(sel.outItems).eq(0).should('have.attr', 'aria-disabled', 'false');
    });

    it('should keep an end picked before a start and commit once the start arrives', () => {
      const formSubmitHandler = cy.stub().as('formSubmitHandler');
      mountRangeTimePicker({ props: officeProps, formSubmit: formSubmitHandler });

      cy.get(sel.startHour).click();
      cy.get(sel.outItems).filter('[data-value="11:00:00"]').click();

      // Nothing commits yet, but the end is kept in its field
      cy.get(sel.pillText).should('have.length', 0);
      cy.get(sel.endHour).should('have.value', '11');

      cy.get(sel.inItems).filter('[data-value="09:00:00"]').click();
      cy.get(sel.pillText).should('have.length', 1);

      submitAndGetData('@formSubmitHandler').then((data) => {
        expect(data).to.deep.equal({ myRanges: [{ start: '09:00:00', end: '11:00:00' }] });
      });
    });

    it('should keep a half-picked range when the panel is closed and reopened', () => {
      mountRangeTimePicker({ props: officeProps });

      cy.get(sel.startHour).click();
      cy.get(sel.inItems).filter('[data-value="10:00:00"]').click();

      cy.get('body').click(0, 0);
      cy.get(sel.panel).should('not.exist');

      cy.get(sel.startHour).click();
      cy.get(sel.panel).should('exist');
      cy.get(sel.startHour).should('have.value', '10');
      cy.get(sel.inItems)
        .filter('.gui-time-list__option--selected')
        .should('have.attr', 'data-value', '10:00:00');
    });

    it('should render localizable start/end column headings from startTimeLabel/endTimeLabel', () => {
      mountRangeTimePicker({
        props: { ...officeProps, startTimeLabel: 'From', endTimeLabel: 'Until' },
      });

      cy.get(sel.startHour).click();
      cy.get('.gui-range-time-picker__column-label').should('have.length', 2);
      cy.get('.gui-range-time-picker__column-label').first().should('have.text', 'From');
      cy.get('.gui-range-time-picker__column-label').last().should('have.text', 'Until');
    });

    it('should floor the out list one slot after the chosen in (out > in)', () => {
      mountRangeTimePicker({ props: officeProps });

      cy.get(sel.startHour).click();
      cy.get(sel.inItems).filter('[data-value="10:00:00"]').click();

      // Out options now start at 10:30 (one step after 10:00), not 10:00.
      cy.get(sel.outItems).eq(0).should('have.attr', 'data-value', '10:30:00');
      cy.get(sel.outItems).eq(0).should('have.attr', 'aria-disabled', 'false');
    });

    it('should commit a range picked from the two lists as a pill and submit it', () => {
      const formSubmitHandler = cy.stub().as('formSubmitHandler');
      mountRangeTimePicker({ props: officeProps, formSubmit: formSubmitHandler });

      cy.get(sel.startHour).click();
      cy.get(sel.inItems).filter('[data-value="09:00:00"]').click();
      cy.get(sel.outItems).filter('[data-value="11:00:00"]').click();

      cy.get(sel.pillText).should('have.length', 1).and('contain', '09:00');
      submitAndGetData('@formSubmitHandler').then((data) => {
        expect(data).to.deep.equal({ myRanges: [{ start: '09:00:00', end: '11:00:00' }] });
      });
    });

    it('should merge an overlapping list-picked range into the existing pill', () => {
      const formSubmitHandler = cy.stub().as('formSubmitHandler');
      mountRangeTimePicker({
        data: { myRanges: [{ start: '09:00:00', end: '11:00:00' }] },
        props: officeProps,
        formSubmit: formSubmitHandler,
      });

      // 10:00–12:00 overlaps 09:00–11:00 → merge into 09:00–12:00
      cy.get(sel.startHour).click();
      cy.get(sel.inItems).filter('[data-value="10:00:00"]').click();
      cy.get(sel.outItems).filter('[data-value="12:00:00"]').click();

      cy.get(sel.pillText).should('have.length', 1);
      submitAndGetData('@formSubmitHandler').then((data) => {
        expect(data).to.deep.equal({ myRanges: [{ start: '09:00:00', end: '12:00:00' }] });
      });
    });

    it('should close the panel on outside click', () => {
      mountRangeTimePicker({ props: officeProps });

      cy.get(sel.startHour).click();
      cy.get(sel.panel).should('exist');

      cy.get('body').click(0, 0);
      cy.get(sel.panel).should('not.exist');
    });

    it('should close the panel with Escape and restore focus to the input', () => {
      mountRangeTimePicker({ props: officeProps });

      cy.get(sel.startHour).click();
      cy.get(sel.inItems).filter('[data-value="09:00:00"]').first().focus();
      cy.focused().type('{esc}');

      cy.get(sel.panel).should('not.exist');
      cy.focused().should('match', 'gui-range-time input, gui-range-time button');
    });

    it('should render the input readonly by default (no custom time entry)', () => {
      mountRangeTimePicker({ props: officeProps });
      cy.get(sel.startHour).should('have.attr', 'readonly');
    });

    it('should accept a typed range when allowCustomTime is on', () => {
      const formSubmitHandler = cy.stub().as('formSubmitHandler');
      mountRangeTimePicker({
        props: { ...officeProps, allowCustomTime: true },
        formSubmit: formSubmitHandler,
      });

      cy.get(sel.startHour).should('not.have.attr', 'readonly');
      cy.get(sel.startHour).click();
      cy.focused().type('09');
      cy.focused().type('30');
      cy.get(sel.endHour).click();
      cy.focused().type('11');
      cy.focused().type('00');
      cy.focused().type('{enter}');

      cy.get(sel.pillText).should('have.length', 1);
      submitAndGetData('@formSubmitHandler').then((data) => {
        expect(data).to.deep.equal({ myRanges: [{ start: '09:30:00', end: '11:00:00' }] });
      });
    });

    it('should reject a typed reversed range with the order error', () => {
      mountRangeTimePicker({
        props: {
          ...officeProps,
          allowCustomTime: true,
          rangeOrderMessage: 'End must be after start',
        },
      });

      const inputErrorSpy = cy.spy().as('inputErrorSpy');
      cy.get('gui-range-time-picker').then(($el) => {
        $el[0].addEventListener('inputError', inputErrorSpy as unknown as EventListener);
      });

      cy.get(sel.startHour).click();
      cy.focused().type('11');
      cy.focused().type('00');
      cy.get(sel.endHour).click();
      cy.focused().type('09');
      cy.focused().type('00');
      cy.focused().type('{enter}');

      cy.get(sel.pillText).should('have.length', 0);
      cy.get('@inputErrorSpy').then((spy: any) => {
        expect(spy.getCall(0).args[0].detail.message).to.equal('End must be after start');
      });
    });

    it('should highlight the matching list slot when a typed time is available', () => {
      mountRangeTimePicker({ props: { ...officeProps, allowCustomTime: true } });

      cy.get(sel.startHour).click();
      cy.focused().type('10');
      cy.focused().type('00');
      // Move focus off the start field so its parts commit and emit their value.
      cy.get(sel.endHour).click();

      // The typed 10:00 is selected in the start list, and the end list has
      // enabled and floored to one slot after it.
      cy.get(sel.inItems)
        .filter('[data-value="10:00:00"]')
        .should('have.attr', 'aria-selected', 'true');
      cy.get(sel.outItems).eq(0).should('have.attr', 'data-value', '10:30:00');
      cy.get(sel.outItems).eq(0).should('have.attr', 'aria-disabled', 'false');
    });

    it('should highlight the end list slot as soon as the last typed digit lands', () => {
      mountRangeTimePicker({ props: { ...officeProps, allowCustomTime: true } });

      cy.get(sel.startHour).click();
      cy.get(sel.inItems).filter('[data-value="09:00:00"]').click();

      // en-GB is 24h, so the end minute is the last field of the last group,
      // with no day-period toggle after it to advance into. Nothing is clicked
      // afterwards on purpose: the digit that completes the time is what has to
      // commit it.
      cy.get(sel.endHour).click();
      cy.focused().type('11');
      cy.focused().type('00');

      cy.get(sel.outItems)
        .filter('[data-value="11:00:00"]')
        .should('have.attr', 'aria-selected', 'true');
    });

    it('should reset both lists after a range is committed by typing and Enter', () => {
      mountRangeTimePicker({ props: { ...officeProps, allowCustomTime: true } });

      // Pick the start from the list, then type the end and commit with Enter.
      cy.get(sel.startHour).click();
      cy.get(sel.inItems).filter('[data-value="09:00:00"]').click();
      cy.get(sel.endHour).click();
      cy.focused().type('11');
      cy.focused().type('00');
      cy.focused().type('{enter}');

      cy.get(sel.pillText).should('have.length', 1);
      // The panel stays open and both lists reset ready for the next range:
      // the start deselects and the end list is back to its full window.
      cy.get(sel.panel).should('exist');
      cy.get(sel.inItems).filter('.gui-time-list__option--selected').should('not.exist');
      cy.get(sel.outItems).filter('.gui-time-list__option--selected').should('not.exist');
      cy.get(sel.outItems).eq(0).should('have.attr', 'data-value', '09:00:00');
    });

    it('should fill the start/end input fields as options are picked from the lists', () => {
      mountRangeTimePicker({ props: officeProps });

      cy.get(sel.startHour).click();
      cy.get(sel.inItems).filter('[data-value="09:00:00"]').click();
      // The start field mirrors the in-list pick immediately (out still pending).
      cy.get(sel.startHour).should('have.value', '09');
      cy.get(sel.startMinute).should('have.value', '00');

      cy.get(sel.outItems).filter('[data-value="11:00:00"]').click();
      // A valid range commits to a pill and clears the fields for the next entry.
      cy.get(sel.pillText).should('have.length', 1).and('contain', '09:00');
      cy.get(sel.startHour).should('have.value', '');
      cy.get(sel.endHour).should('have.value', '');
    });

    it('should report an incomplete range when only the start time was picked', () => {
      // One endpoint picked and the other left empty never became a pill, so
      // leaving the widget must say so instead of dropping the entry silently.
      mountRangeTimePicker({ props: officeProps });

      cy.get(sel.startHour).click();
      cy.get(sel.inItems).filter('[data-value="09:00:00"]').click();

      cy.get('[data-cy="submitBtn_button"]').focus();
      cy.get(`[data-cy="${uid}_validator-error"]`).should('contain.text', 'Incomplete time');
      cy.get(sel.pillText).should('have.length', 0);
    });

    it('should not commit a range that spans a disabled block, keeping the values and showing the error', () => {
      mountRangeTimePicker({
        props: {
          minTime: '09:00:00',
          maxTime: '22:00:00',
          minuteStep: 60,
          disabledRanges: [{ start: '13:00:00', end: '14:00:00' }],
          disabledRangeMessage: 'Time is within a disabled range',
        },
      });

      const inputErrorSpy = cy.spy().as('inputErrorSpy');
      cy.get('gui-range-time-picker').then(($el) => {
        $el[0].addEventListener('inputError', inputErrorSpy as unknown as EventListener);
      });

      // in=12:00, out=18:00 straddles the disabled 13:00-14:00 block: neither
      // endpoint is disabled, but the span is invalid.
      cy.get(sel.startHour).click();
      cy.get(sel.inItems).filter('[data-value="12:00:00"]').click();
      cy.get(sel.outItems).filter('[data-value="18:00:00"]').click();

      // No pill is created and the dropdown closes...
      cy.get(sel.pillText).should('have.length', 0);
      cy.get(sel.panel).should('not.exist');
      // ...but the offending values stay in the inputs so the user sees them...
      cy.get(sel.startHour).should('have.value', '12');
      cy.get(sel.endHour).should('have.value', '18');
      // ...alongside the error explaining what's wrong.
      cy.get('@inputErrorSpy').then((spy: any) => {
        expect(spy.getCall(0).args[0].detail.message).to.equal('Time is within a disabled range');
      });
      cy.get('.gui-validator__error').should('contain', 'Time is within a disabled range');
    });

    it('should remove a pill', () => {
      mountRangeTimePicker({
        data: {
          myRanges: [
            { start: '09:00:00', end: '10:00:00' },
            { start: '11:00:00', end: '12:00:00' },
          ],
        },
        props: officeProps,
      });

      cy.get(sel.pillText).should('have.length', 2);
      cy.get(sel.pillRemove).first().click({ force: true });
      cy.get(sel.pillText).should('have.length', 1);
    });

    it('should not open the panel when disabled', () => {
      mountRangeTimePicker({
        data: { myRanges: [{ start: '09:00:00', end: '10:00:00' }] },
        props: officeProps,
        disabled: true,
      });

      cy.get(sel.startHour).should('be.disabled');
      cy.get('.gui-range-time-picker .gui-widget').first().click({ force: true });
      cy.get(sel.panel).should('not.exist');
    });

    describe('accessibility', () => {
      const toggleSel = 'button.gui-range-time-picker__arrow';

      it('should expose a named popup toggle button', () => {
        mountRangeTimePicker();
        cy.get(toggleSel)
          .should('have.attr', 'aria-label', 'Show time list')
          .should('have.attr', 'aria-haspopup', 'dialog')
          .should('have.attr', 'aria-expanded', 'false')
          .should('have.attr', 'aria-controls', 'testSubject_popup');
      });

      it('should open the list dialog from the toggle and move focus into it', () => {
        mountRangeTimePicker();
        cy.get(toggleSel).click();
        cy.get(toggleSel).should('have.attr', 'aria-expanded', 'true');
        cy.get('.gui-range-time-picker__panel')
          .should('have.attr', 'role', 'dialog')
          .should('have.id', 'testSubject_popup');
        cy.focused().should('have.class', 'gui-time-list__option');
      });
    });
  });
};
