import { defineForm, identityTranslator, type MutableI18nTranslator } from '@golemui/core';
import { type MountComponentFn } from '../utils';

export const runDateTimeInputComponentTests = (mountFn: MountComponentFn) => {
  describe('DateTimeInput Component', () => {
    const sel = {
      day: 'gui-date-time input[data-type="day"]',
      month: 'gui-date-time input[data-type="month"]',
      year: 'gui-date-time input[data-type="year"]',
      hour: 'gui-date-time input[data-type="hour"]',
      minute: 'gui-date-time input[data-type="minute"]',
      dayPeriod: 'gui-date-time button[data-type="dayPeriod"]',
    };

    const mountDateTimeInput = (options?: {
      data?: Record<string, any>;
      lang?: string;
      translator?: MutableI18nTranslator;
      props?: Record<string, any>;
      validator?: Record<string, any>;
      formSubmit?: (event: any) => void;
      readonly?: boolean;
      disabled?: boolean;
    }) => {
      mountFn({
        localization: options?.translator ?? identityTranslator(options?.lang ?? 'en-US'),
        data: options?.data,
        formDef: defineForm({
          form: [
            {
              uid: 'testSubject',
              kind: 'input',
              type: 'dateTimeInput',
              path: 'myDateTime',
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
      cy.get('[data-cy="submitBtn_button"]').click();
      return cy.get(formSubmitAlias).then((stub: any) => stub.getCall(0).args[0].data);
    };

    // The toggle's template may render whitespace around the label
    const expectDayPeriod = (label: string) =>
      cy.get(sel.dayPeriod).should(($el) => {
        expect($el.text().trim()).to.equal(label);
      });

    describe('rendering', () => {
      it('should display date and time parts in locale order (12h locale)', () => {
        mountDateTimeInput({ data: { myDateTime: '2026-06-15T14:30:00' } });

        // en-US orders parts month/day/year, hour:minute dayPeriod
        cy.get('gui-date-time input, gui-date-time button[data-type]').should(($els) => {
          const types = $els.toArray().map((el) => el.getAttribute('data-type'));
          expect(types).to.deep.equal(['month', 'day', 'year', 'hour', 'minute', 'dayPeriod']);
        });

        cy.get(sel.month).should('have.value', '06');
        cy.get(sel.day).should('have.value', '15');
        cy.get(sel.year).should('have.value', '2026');
        cy.get(sel.hour).should('have.value', '02');
        cy.get(sel.minute).should('have.value', '30');
        expectDayPeriod('PM');
      });

      it('should display a 24h layout without a day period in a 24h locale', () => {
        mountDateTimeInput({ data: { myDateTime: '2026-06-15T14:30:00' }, lang: 'en-GB' });

        cy.get(sel.day).should('have.value', '15');
        cy.get(sel.hour).should('have.value', '14');
        cy.get(sel.dayPeriod).should('not.exist');
      });

      it('should hydrate a date-only value with time 00:00', () => {
        mountDateTimeInput({ data: { myDateTime: '2026-06-15' }, lang: 'en-GB' });

        cy.get(sel.day).should('have.value', '15');
        cy.get(sel.hour).should('have.value', '00');
        cy.get(sel.minute).should('have.value', '00');
      });
    });

    describe('typing', () => {
      it('should auto-advance from the date parts into the time parts', () => {
        mountDateTimeInput();

        cy.get(sel.month).type('06');
        cy.focused().should('have.attr', 'data-type', 'day');
        cy.focused().type('15');
        cy.focused().should('have.attr', 'data-type', 'year');
        cy.focused().type('2026');
        cy.focused().should('have.attr', 'data-type', 'hour');
      });

      it('should submit the typed date and time as a local ISO date-time (default AM)', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountDateTimeInput({ formSubmit: formSubmitHandler });

        expectDayPeriod('AM');

        cy.get(sel.month).type('06');
        cy.focused().type('15');
        cy.focused().type('2026');
        cy.focused().type('09');
        cy.focused().type('30');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myDateTime: '2026-06-15T09:30:00' });
        });
      });

      it('should clamp typed date and time parts to their limits', () => {
        mountDateTimeInput({ lang: 'en-GB' });

        cy.get(sel.day).type('35');
        cy.get(sel.day).should('have.value', '31');
        cy.get(sel.month).type('15');
        cy.get(sel.month).should('have.value', '12');
        cy.get(sel.hour).type('30');
        cy.get(sel.hour).should('have.value', '23');
        cy.get(sel.minute).type('95');
        cy.get(sel.minute).should('have.value', '59');
      });

      it('should emit inputError and no change for a complete but invalid date (Feb 31)', () => {
        mountDateTimeInput({ lang: 'en-GB' });

        const changeSpy = cy.spy().as('changeSpy');
        const inputErrorSpy = cy.spy().as('inputErrorSpy');
        cy.get('gui-date-time').then(($el) => {
          $el[0].addEventListener('change', changeSpy as unknown as EventListener);
          $el[0].addEventListener('inputError', inputErrorSpy as unknown as EventListener);
        });

        cy.get(sel.day).type('31');
        cy.get(sel.month).type('02', { force: true });
        cy.get(sel.year).type('2026', { force: true });
        cy.get(sel.hour).type('09', { force: true });
        // Filling the last part wraps focus, committing the value
        cy.get(sel.minute).type('30', { force: true });

        cy.get('@inputErrorSpy').should('have.been.called');
        cy.get('@changeSpy').should('not.have.been.called');
      });

      it('should emit the custom invalidDateMessage when provided', () => {
        mountDateTimeInput({
          lang: 'en-GB',
          props: { invalidDateMessage: 'Nope, no such day' },
        });

        const inputErrorSpy = cy.spy().as('inputErrorSpy');
        cy.get('gui-date-time').then(($el) => {
          $el[0].addEventListener('inputError', inputErrorSpy as unknown as EventListener);
        });

        cy.get(sel.day).type('31');
        cy.get(sel.month).type('02', { force: true });
        cy.get(sel.year).type('2026', { force: true });
        cy.get(sel.hour).type('09', { force: true });
        cy.get(sel.minute).type('30', { force: true });

        cy.get('@inputErrorSpy').then((spy: any) => {
          expect(spy.getCall(0).args[0].detail.message).to.equal('Nope, no such day');
        });
      });
    });

    describe('arrows and toggle', () => {
      it('should stop date parts at their limits and wrap minutes', () => {
        mountDateTimeInput({ data: { myDateTime: '2026-12-15T14:59:00' }, lang: 'en-GB' });

        cy.get(sel.month).type('{upArrow}');
        cy.get(sel.month).should('have.value', '12');

        cy.get(sel.minute).type('{upArrow}');
        cy.get(sel.minute).should('have.value', '00');
        // Wrapping does not carry into the hour part
        cy.get(sel.hour).should('have.value', '14');
      });

      it('should toggle the period on click and shift the value by 12h', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountDateTimeInput({
          data: { myDateTime: '2026-06-15T14:30:00' },
          formSubmit: formSubmitHandler,
        });

        expectDayPeriod('PM');
        cy.get(sel.dayPeriod).click();
        expectDayPeriod('AM');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myDateTime: '2026-06-15T02:30:00' });
        });
      });

      it('should move minutes by minuteStep', () => {
        mountDateTimeInput({
          data: { myDateTime: '2026-06-15T14:30:00' },
          props: { minuteStep: 15 },
        });

        cy.get(sel.minute).type('{upArrow}');
        cy.get(sel.minute).should('have.value', '45');
      });
    });

    describe('runtime locale change', () => {
      it('should re-derive the parts when switching to a 24h locale at runtime', () => {
        const translator = identityTranslator('en-US');
        mountDateTimeInput({ data: { myDateTime: '2026-06-15T14:30:00' }, translator });

        cy.get(sel.hour).should('have.value', '02');
        expectDayPeriod('PM');

        cy.then(() => translator.setLang('en-GB'));

        // en-GB reorders the date parts and drops the day period
        cy.get('gui-date-time input, gui-date-time button[data-type]').should(($els) => {
          const types = $els.toArray().map((el) => el.getAttribute('data-type'));
          expect(types).to.deep.equal(['day', 'month', 'year', 'hour', 'minute']);
        });
        cy.get(sel.hour).should('have.value', '14');
        cy.get(sel.day).should('have.value', '15');
        cy.get(sel.month).should('have.value', '06');
      });

      it('should re-derive the parts when switching to a 12h locale at runtime', () => {
        const translator = identityTranslator('en-GB');
        mountDateTimeInput({ data: { myDateTime: '2026-06-15T14:30:00' }, translator });

        cy.get(sel.hour).should('have.value', '14');
        cy.get(sel.dayPeriod).should('not.exist');

        cy.then(() => translator.setLang('en-US'));

        cy.get(sel.hour).should('have.value', '02');
        cy.get(sel.minute).should('have.value', '30');
        expectDayPeriod('PM');
      });
    });

    describe('RTL', () => {
      it('should mirror the date parts but keep hour:minute unmirrored', () => {
        mountDateTimeInput({ data: { myDateTime: '2026-06-15T08:00:00' }, lang: 'ar' });

        cy.get(sel.hour).should('have.value', '08');
        cy.get('gui-date-time').should(($el) => {
          const left = (type: string) => {
            const part = $el[0].querySelector(`[data-type="${type}"]`);
            expect(part, `${type} part exists`).to.not.equal(null);
            return (part as HTMLElement).getBoundingClientRect().left;
          };
          // Date parts mirror in RTL (CLDR inserts direction marks): the day
          // ends up visually rightmost
          expect(left('year'), 'year left of month').to.be.lessThan(left('month'));
          expect(left('month'), 'month left of day').to.be.lessThan(left('day'));
          // The time run never mirrors: hour stays left of minute
          expect(left('hour'), 'hour left of minute').to.be.lessThan(left('minute'));
        });
      });
    });

    describe('blur', () => {
      it('should emit a null value and keep the other parts when one part is emptied', () => {
        mountDateTimeInput({ data: { myDateTime: '2026-06-15T14:30:00' } });

        const changeSpy = cy.spy().as('changeSpy');
        cy.get('gui-date-time').then(($el) => {
          $el[0].addEventListener('change', changeSpy as unknown as EventListener);
        });

        cy.get(sel.day).type('{selectAll}{backspace}');
        cy.get(sel.day).blur();

        cy.get('@changeSpy').then((spy: any) => {
          expect(spy.getCall(0).args[0].detail.value).to.equal(null);
        });

        // Only the emptied part clears: the rest of the entry is not wiped
        cy.get(sel.day).should('have.value', '');
        cy.get(sel.month).should('have.value', '06');
        cy.get(sel.year).should('have.value', '2026');
        cy.get(sel.hour).should('have.value', '02');
        cy.get(sel.minute).should('have.value', '30');
      });

      it('should keep a minute of 00 on blur', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountDateTimeInput({
          data: { myDateTime: '2026-06-15T14:00:00' },
          formSubmit: formSubmitHandler,
        });

        cy.get(sel.minute).click();
        cy.get(sel.minute).blur();

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myDateTime: '2026-06-15T14:00:00' });
        });
      });
    });

    describe('incomplete input on focus leave', () => {
      it('should not validate while moving between the parts of one entry', () => {
        // Filling a part auto-advances to the next one. That hop is not
        // leaving the widget, so the form must not judge a half-typed entry:
        // a required field lighting up after the first part is the bug.
        mountDateTimeInput({ validator: { type: 'string', required: true } });

        cy.get(sel.month).click();
        cy.focused().type('06');
        cy.get('[data-cy="testSubject_validator-errors"]').should('not.exist');
        cy.focused().type('15');
        cy.get('[data-cy="testSubject_validator-errors"]').should('not.exist');

        // Leaving the widget is the one moment the entry is judged
        cy.get('[data-cy="submitBtn_button"]').focus();
        cy.get('[data-cy="testSubject_validator-errors"]').should('exist');
      });

      it('should flip a date-only entry to null with an incomplete error when focus leaves', () => {
        mountDateTimeInput();

        const changeSpy = cy.spy().as('changeSpy');
        cy.get('gui-date-time').then(($el) => {
          $el[0].addEventListener('change', changeSpy as unknown as EventListener);
        });

        // en-US orders the parts month/day/year, then the time run
        cy.get(sel.month).click();
        cy.focused().type('06');
        cy.focused().type('15');
        cy.focused().type('2026');
        cy.get('[data-cy="submitBtn_button"]').focus();

        cy.get('[data-cy="testSubject_validator-error"]').should(
          'contain.text',
          'Incomplete date-time',
        );
        cy.get('@changeSpy').then((spy: any) => {
          expect(spy.getCall(0).args[0].detail.value).to.equal(null);
        });
      });

      it('should show the incomplete error for a committed value left with an emptied part', () => {
        mountDateTimeInput({ data: { myDateTime: '2026-06-15T14:30:00' } });

        cy.get(sel.day).type('{selectAll}{backspace}');
        cy.get('[data-cy="submitBtn_button"]').focus();

        cy.get('[data-cy="testSubject_validator-error"]').should(
          'contain.text',
          'Incomplete date-time',
        );
        cy.get(sel.month).should('have.value', '06');
        cy.get(sel.hour).should('have.value', '02');
      });

      it('should clear the incomplete error once the date-time is completed', () => {
        mountDateTimeInput({ props: { hourFormat: '24' } });

        cy.get(sel.month).click();
        cy.focused().type('06');
        cy.focused().type('15');
        cy.focused().type('2026');
        cy.get('[data-cy="submitBtn_button"]').focus();
        cy.get('[data-cy="testSubject_validator-error"]').should(
          'contain.text',
          'Incomplete date-time',
        );

        cy.get(sel.hour).type('10');
        cy.focused().type('30', { force: true });
        cy.get('[data-cy="testSubject_validator-error"]').should('not.exist');
      });
    });

    describe('readonly and disabled', () => {
      it('should ignore typing, arrows and toggle clicks when readonly', () => {
        mountDateTimeInput({ data: { myDateTime: '2026-06-15T14:30:00' }, readonly: true });

        cy.get(sel.day).should('have.attr', 'readonly');
        cy.get(sel.day).type('{upArrow}', { force: true });
        cy.get(sel.day).should('have.value', '15');

        cy.get(sel.dayPeriod).click();
        expectDayPeriod('PM');
      });

      it('should render disabled parts when disabled', () => {
        mountDateTimeInput({ data: { myDateTime: '2026-06-15T14:30:00' }, disabled: true });

        cy.get(sel.day).should('be.disabled');
        cy.get(sel.hour).should('be.disabled');
        cy.get(sel.dayPeriod).should('be.disabled');
      });
    });

    describe('bounds validation', () => {
      it('should emit change and inputError when the date is past maxDate', () => {
        mountDateTimeInput({
          lang: 'en-GB',
          props: { maxDate: '2026-06-20', maxDateMessage: 'Date too far out' },
        });

        const changeSpy = cy.spy().as('changeSpy');
        const inputErrorSpy = cy.spy().as('inputErrorSpy');
        cy.get('gui-date-time').then(($el) => {
          $el[0].addEventListener('change', changeSpy as unknown as EventListener);
          $el[0].addEventListener('inputError', inputErrorSpy as unknown as EventListener);
        });

        // en-GB orders day/month/year and renders 24h; 25/06/2026 10:30 is past maxDate
        cy.get(sel.day).click();
        cy.focused().type('25');
        cy.focused().type('06');
        cy.focused().type('2026');
        cy.focused().type('10');
        cy.focused().type('30');

        cy.get(sel.day).should('have.value', '25');
        cy.get('@changeSpy').should('have.been.called');
        cy.get('@inputErrorSpy').then((spy: any) => {
          expect(spy.getCall(0).args[0].detail.message).to.equal('Date too far out');
        });
      });

      it('should emit change and inputError when the time is past maxTime', () => {
        mountDateTimeInput({
          lang: 'en-GB',
          props: { maxTime: '17:00:00', maxTimeMessage: 'Time too late' },
        });

        const inputErrorSpy = cy.spy().as('inputErrorSpy');
        cy.get('gui-date-time').then(($el) => {
          $el[0].addEventListener('inputError', inputErrorSpy as unknown as EventListener);
        });

        // 15/06/2026 18:00 is a valid date but past maxTime
        cy.get(sel.day).click();
        cy.focused().type('15');
        cy.focused().type('06');
        cy.focused().type('2026');
        cy.focused().type('18');
        cy.focused().type('00');

        cy.get('@inputErrorSpy').then((spy: any) => {
          expect(spy.getCall(0).args[0].detail.message).to.equal('Time too late');
        });
      });
    });
  });
};
