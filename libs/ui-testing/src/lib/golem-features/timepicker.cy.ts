import { defineForm, identityTranslator } from '@golemui/core';
import { type MountComponentFn } from '../utils';

export const runTimePickerComponentTests = (mountFn: MountComponentFn) => {
  describe('TimePicker Component', () => {
    const sel = {
      hour: 'gui-time input[data-type="hour"]',
      minute: 'gui-time input[data-type="minute"]',
      dayPeriod: 'gui-time button[data-type="dayPeriod"]',
      list: 'gui-time-list',
      openList: 'gui-time-list:not([hidden])',
      items: 'gui-time-list:not([hidden]) .gui-time-list__option',
    };

    // Office hours with a disabled mid-morning slot: 09:00, 09:30, [10:00,
    // 10:30 disabled], 11:00
    const officeProps = {
      minTime: '09:00:00',
      maxTime: '11:00:00',
      minuteStep: 30,
      disabledRanges: [{ start: '10:00:00', end: '10:30:00' }],
    };

    const mountTimePicker = (options?: {
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
              type: 'timePicker',
              path: 'myTime',
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

    // Newer ICU separates the day period with a narrow no-break space, so
    // labels are matched with \s instead of a literal space
    const expectItemLabel = (index: number, pattern: RegExp) =>
      cy
        .get(sel.items)
        .eq(index)
        .should(($el) => {
          expect($el.text().trim()).to.match(pattern);
        });

    describe('rendering and open/close', () => {
      it('should hydrate the default value and keep the list hidden', () => {
        mountTimePicker({ data: { myTime: '09:30:00' }, props: officeProps });

        cy.get(sel.hour).should('have.value', '09');
        cy.get(sel.minute).should('have.value', '30');
        cy.get(sel.list).should('have.attr', 'hidden');
      });

      it('should open the list when a time part is clicked and close on outside click', () => {
        mountTimePicker({ props: officeProps });

        cy.get(sel.hour).click();
        cy.get(sel.openList).should('exist');

        cy.get('body').click(0, 0);
        cy.get(sel.list).should('have.attr', 'hidden');
      });

      it('should close the list with Escape and restore focus to the time input', () => {
        mountTimePicker({ data: { myTime: '09:30:00' }, props: officeProps });

        cy.get(sel.hour).click();
        cy.get(`${sel.items}[tabindex="0"]`).focus();
        cy.focused().type('{esc}');

        cy.get(sel.list).should('have.attr', 'hidden');
        cy.focused().should('have.attr', 'data-type', 'hour');
      });

      it('should emit listtoggle when the list opens and closes', () => {
        mountTimePicker({ props: officeProps });

        const toggleSpy = cy.spy().as('toggleSpy');
        cy.get('gui-time-picker').then(($el) => {
          $el[0].addEventListener('listtoggle', toggleSpy as unknown as EventListener);
        });

        cy.get(sel.hour).click();
        cy.get(sel.openList).should('exist');

        cy.get('body').click(0, 0);
        cy.get(sel.list).should('have.attr', 'hidden');

        cy.get('@toggleSpy').then((spy: any) => {
          expect(spy.getCall(0).args[0].detail).to.deep.equal({ open: true });
          expect(spy.getCall(1).args[0].detail).to.deep.equal({ open: false });
        });
      });

      it('should close the list with Enter from a time part', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountTimePicker({
          props: { ...officeProps, allowCustomTime: true },
          formSubmit: formSubmitHandler,
        });

        cy.get(sel.hour).type('09');
        cy.focused().type('45', { force: true });
        cy.get(sel.openList).should('exist');

        cy.get(sel.hour).type('{enter}', { force: true });
        cy.get(sel.list).should('have.attr', 'hidden');

        cy.get(sel.hour).should('have.value', '09');
        cy.get(sel.minute).should('have.value', '45');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myTime: '09:45:00' });
        });
      });

      it('should build the options from minTime, maxTime and minuteStep', () => {
        mountTimePicker({ props: officeProps });

        cy.get(sel.hour).click();
        cy.get(sel.items).should('have.length', 5);
        expectItemLabel(0, /^9:00\sAM$/);
        expectItemLabel(4, /^11:00\sAM$/);
      });

      it('should label the options with the 24h locale format', () => {
        mountTimePicker({ props: officeProps, lang: 'en-GB' });

        cy.get(sel.hour).click();
        expectItemLabel(0, /^09:00$/);
        expectItemLabel(4, /^11:00$/);
      });

      it('should keep the options on whole minutes when minTime has seconds', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountTimePicker({
          props: { minTime: '09:00:30', maxTime: '10:30:00', minuteStep: 30 },
          formSubmit: formSubmitHandler,
        });

        // 09:00:00 falls before minTime, so the grid starts at 09:30
        cy.get(sel.hour).click();
        cy.get(sel.items).should('have.length', 3);
        expectItemLabel(0, /^9:30\sAM$/);
        expectItemLabel(2, /^10:30\sAM$/);

        cy.get(sel.items).eq(2).click();
        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myTime: '10:30:00' });
        });
      });

      it('should show an empty-state message when the bounds yield no slots', () => {
        mountTimePicker({ props: { minTime: '18:00:00', maxTime: '09:00:00' } });

        cy.get(sel.hour).click();
        cy.get(sel.items).should('have.length', 0);
        cy.get(`${sel.openList} .gui-time-list__empty`).should(($el) => {
          expect($el.text().trim()).to.equal('No available times');
        });
      });

      it('should show the custom noAvailableTimesMessage when provided', () => {
        mountTimePicker({
          props: {
            minTime: '18:00:00',
            maxTime: '09:00:00',
            noAvailableTimesMessage: 'Nothing available today',
          },
        });

        cy.get(sel.hour).click();
        cy.get(`${sel.openList} .gui-time-list__empty`).should(($el) => {
          expect($el.text().trim()).to.equal('Nothing available today');
        });
      });
    });

    describe('disabled ranges', () => {
      it('should grey out options inside disabled ranges and ignore their clicks', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountTimePicker({ props: officeProps, formSubmit: formSubmitHandler });

        cy.get(sel.hour).click();
        cy.get(sel.items).eq(2).should('have.attr', 'aria-disabled', 'true');
        cy.get(sel.items).eq(3).should('have.attr', 'aria-disabled', 'true');
        cy.get(sel.items).eq(1).should('have.attr', 'aria-disabled', 'false');

        cy.get(sel.items).eq(2).click({ force: true });
        cy.get(sel.hour).should('have.value', '');

        // Clicking away from the empty hour part emits the empty-part null
        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myTime: null });
        });
      });

      it('should skip disabled options with the arrow keys inside the list', () => {
        mountTimePicker({ props: officeProps });

        cy.get(sel.hour).click();
        // Roving tabindex: the first enabled option carries tabindex 0
        cy.get(`${sel.openList} .gui-time-list__option[tabindex="0"]`).focus();
        cy.focused().should('have.attr', 'data-value', '09:00:00');

        // 09:00 -> 09:30 -> (skip 10:00 and 10:30) -> 11:00
        cy.focused().type('{downArrow}');
        cy.focused().should('have.attr', 'data-value', '09:30:00');
        cy.focused().type('{downArrow}');
        cy.focused().should('have.attr', 'data-value', '11:00:00');
      });
    });

    describe('selection', () => {
      it('should commit a clicked option to the input and the form value', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountTimePicker({ props: officeProps, formSubmit: formSubmitHandler });

        cy.get(sel.hour).click();
        cy.get(sel.items).eq(1).click();

        cy.get(sel.hour).should('have.value', '09');
        cy.get(sel.minute).should('have.value', '30');
        cy.get(sel.list).should('have.attr', 'hidden');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myTime: '09:30:00' });
        });
      });

      it('should select the focused option with Enter and close the list', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountTimePicker({ props: officeProps, formSubmit: formSubmitHandler });

        cy.get(sel.hour).click();
        cy.get(`${sel.openList} .gui-time-list__option[tabindex="0"]`).focus();
        cy.focused().type('{enter}');

        cy.get(sel.list).should('have.attr', 'hidden');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myTime: '09:00:00' });
        });
      });
    });

    describe('select-like keyboard mode (default, no custom time)', () => {
      it('should render the time input readonly by default', () => {
        mountTimePicker({ props: officeProps });

        cy.get(sel.hour).should('have.attr', 'readonly');
      });

      it('should select the first available option with ArrowDown when empty', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountTimePicker({ props: officeProps, formSubmit: formSubmitHandler });

        cy.get(sel.hour).type('{downArrow}', { force: true });
        cy.get(sel.hour).should('have.value', '09');
        cy.get(sel.minute).should('have.value', '00');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myTime: '09:00:00' });
        });
      });

      it('should step through the available options skipping disabled ones', () => {
        mountTimePicker({
          data: { myTime: '09:30:00' },
          props: officeProps,
        });

        // 09:30 -> (skip 10:00 and 10:30) -> 11:00
        cy.get(sel.hour).type('{downArrow}', { force: true });
        cy.get(sel.hour).should('have.value', '11');
        cy.get(sel.minute).should('have.value', '00');

        cy.get(sel.hour).type('{upArrow}', { force: true });
        cy.get(sel.hour).should('have.value', '09');
        cy.get(sel.minute).should('have.value', '30');
      });
    });

    describe('custom time entry (allowCustomTime)', () => {
      it('should accept a typed time within bounds', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountTimePicker({
          props: { ...officeProps, allowCustomTime: true },
          formSubmit: formSubmitHandler,
        });

        cy.get(sel.hour).should('not.have.attr', 'readonly');
        cy.get(sel.hour).type('09');
        cy.focused().type('45', { force: true });

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myTime: '09:45:00' });
        });
      });

      it('should emit inputError and no change for a typed time out of bounds', () => {
        mountTimePicker({ props: { ...officeProps, allowCustomTime: true } });

        const changeSpy = cy.spy().as('changeSpy');
        const inputErrorSpy = cy.spy().as('inputErrorSpy');
        cy.get('gui-time').then(($el) => {
          $el[0].addEventListener('change', changeSpy as unknown as EventListener);
          $el[0].addEventListener('inputError', inputErrorSpy as unknown as EventListener);
        });

        cy.get(sel.hour).type('08');
        cy.focused().type('00', { force: true });

        cy.get('@inputErrorSpy').should('have.been.called');
        cy.get('@changeSpy').should('not.have.been.called');
        cy.get('@inputErrorSpy').then((spy: any) => {
          expect(spy.getCall(0).args[0].detail.message).to.contain('minimum');
        });
      });

      it('should advance the value and emit inputError for a typed time inside a disabled range', () => {
        mountTimePicker({ props: { ...officeProps, allowCustomTime: true } });

        // The picker owns disabled-range validation now: the value advances (so
        // the field reflects it) and the picker — not the field — surfaces the
        // error, keeping the form invalid.
        const changeSpy = cy.spy().as('changeSpy');
        const inputErrorSpy = cy.spy().as('inputErrorSpy');
        cy.get('gui-time-picker').then(($el) => {
          $el[0].addEventListener('change', changeSpy as unknown as EventListener);
          $el[0].addEventListener('inputError', inputErrorSpy as unknown as EventListener);
        });

        cy.get(sel.hour).type('10');
        cy.focused().type('15', { force: true });

        cy.get(sel.hour).should('have.value', '10');
        cy.get(sel.minute).should('have.value', '15');
        cy.get('@changeSpy').should('have.been.called');
        cy.get('@inputErrorSpy').then((spy: any) => {
          expect(spy.getCall(0).args[0].detail.message).to.contain('disabled range');
        });
      });

      it('should emit the custom disabledRangeMessage from the picker', () => {
        mountTimePicker({
          props: { ...officeProps, allowCustomTime: true, disabledRangeMessage: 'Slot is booked' },
        });

        const inputErrorSpy = cy.spy().as('inputErrorSpy');
        cy.get('gui-time-picker').then(($el) => {
          $el[0].addEventListener('inputError', inputErrorSpy as unknown as EventListener);
        });

        cy.get(sel.hour).type('10');
        cy.focused().type('15', { force: true });

        cy.get('@inputErrorSpy').then((spy: any) => {
          expect(spy.getCall(0).args[0].detail.message).to.equal('Slot is booked');
        });
      });

      it('should emit the custom minTimeMessage when provided', () => {
        mountTimePicker({
          props: { ...officeProps, allowCustomTime: true, minTimeMessage: 'Too early' },
        });

        const inputErrorSpy = cy.spy().as('inputErrorSpy');
        cy.get('gui-time').then(($el) => {
          $el[0].addEventListener('inputError', inputErrorSpy as unknown as EventListener);
        });

        cy.get(sel.hour).type('08');
        cy.focused().type('00', { force: true });

        cy.get('@inputErrorSpy').then((spy: any) => {
          expect(spy.getCall(0).args[0].detail.message).to.equal('Too early');
        });
      });

      it('should run a localizable minTimeMessage through the translator', () => {
        // identityTranslator resolves translate(key) to the key itself, so a
        // { key, default } message arriving as the key proves it went through
        // the i18n pipeline (a real translator would return the translation)
        mountTimePicker({
          props: {
            ...officeProps,
            allowCustomTime: true,
            minTimeMessage: { key: 'err.tooEarly', default: 'Too early' },
          },
        });

        const inputErrorSpy = cy.spy().as('inputErrorSpy');
        cy.get('gui-time').then(($el) => {
          $el[0].addEventListener('inputError', inputErrorSpy as unknown as EventListener);
        });

        cy.get(sel.hour).type('08');
        cy.focused().type('00', { force: true });

        cy.get('@inputErrorSpy').then((spy: any) => {
          expect(spy.getCall(0).args[0].detail.message).to.equal('err.tooEarly');
        });
      });
    });

    describe('readonly and disabled', () => {
      it('should not select options when the widget is readonly', () => {
        mountTimePicker({ data: { myTime: '09:30:00' }, props: officeProps, readonly: true });

        cy.get(sel.hour).click();
        cy.get(sel.items).eq(0).click({ force: true });
        cy.get(sel.hour).should('have.value', '09');
        cy.get(sel.minute).should('have.value', '30');

        cy.get(sel.hour).type('{downArrow}', { force: true });
        cy.get(sel.minute).should('have.value', '30');
      });

      it('should render disabled parts when disabled', () => {
        mountTimePicker({ data: { myTime: '09:30:00' }, props: officeProps, disabled: true });

        cy.get(sel.hour).should('be.disabled');
        cy.get(sel.minute).should('be.disabled');
      });

      it('should not open the list when disabled', () => {
        mountTimePicker({ data: { myTime: '09:30:00' }, props: officeProps, disabled: true });

        // Disabled inputs swallow clicks, so aim at the widget row and arrow
        cy.get('.gui-time-picker .gui-widget').first().click({ force: true });
        cy.get(sel.list).should('have.attr', 'hidden');

        cy.get('.gui-time-picker__arrow').click({ force: true });
        cy.get(sel.list).should('have.attr', 'hidden');
      });
    });
  });
};
