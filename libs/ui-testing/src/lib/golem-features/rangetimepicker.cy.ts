import { defineForm, identityTranslator } from '@golemui/core';
import { type MountComponentFn } from '../utils';

// Behavior tests for the gui-range-time-picker: the gui-range-time typed input
// plus a two-list popover (time-in left, time-out right). The out list stays
// disabled until an in is chosen, then floors one slot after it so end > start
// strictly. Committed ranges accumulate as merged pills (value = TimeRange[]).
// Uses en-GB (24h) so option labels are plain HH:mm.
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

    it('should open the panel with both lists, the out list disabled until an in is picked', () => {
      mountRangeTimePicker({ props: officeProps });

      cy.get(sel.startHour).click();
      cy.get(sel.panel).should('exist');
      cy.get(sel.inItems).should('have.length', 7);
      // Out list renders its slots but every option is disabled up front.
      cy.get(sel.outItems).should('have.length', 7);
      cy.get(sel.outItems).eq(0).should('have.attr', 'aria-disabled', 'true');
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
        props: { ...officeProps, allowCustomTime: true, rangeOrderMessage: 'End must be after start' },
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
  });
};
