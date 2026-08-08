import { defineForm, identityTranslator, type MutableI18nTranslator } from '@golemui/core';
import { type MountComponentFn } from '../utils';

export const runTimeInputComponentTests = (mountFn: MountComponentFn) => {
  describe('TimeInput Component', () => {
    const sel = {
      hour: 'gui-time input[data-type="hour"]',
      minute: 'gui-time input[data-type="minute"]',
      dayPeriod: 'gui-time button[data-type="dayPeriod"]',
    };

    const mountTimeInput = (options?: {
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
              type: 'timeInput',
              path: 'myTime',
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
      it('should display a 12h value with a day period in a 12h locale', () => {
        mountTimeInput({ data: { myTime: '14:30:00' } });

        cy.get(sel.hour).should('have.value', '02').and('have.attr', 'placeholder', 'hh');
        cy.get(sel.minute).should('have.value', '30').and('have.attr', 'placeholder', 'mm');
        expectDayPeriod('PM');
      });

      it('should display a 24h value without a day period in a 24h locale', () => {
        mountTimeInput({ data: { myTime: '14:30:00' }, lang: 'en-GB' });

        cy.get(sel.hour).should('have.value', '14');
        cy.get(sel.minute).should('have.value', '30');
        cy.get(sel.dayPeriod).should('not.exist');
      });

      it('should force a 24h layout with hourFormat=24 in a 12h locale', () => {
        mountTimeInput({
          data: { myTime: '14:30:00' },
          props: { hourFormat: '24' },
        });

        cy.get(sel.hour).should('have.value', '14');
        cy.get(sel.dayPeriod).should('not.exist');
      });

      it('should force a 12h layout with hourFormat=12 in a 24h locale', () => {
        mountTimeInput({
          data: { myTime: '14:30:00' },
          lang: 'en-GB',
          props: { hourFormat: '12' },
        });

        cy.get(sel.hour).should('have.value', '02');
        cy.get(sel.dayPeriod).should('exist');
      });

      it('should hydrate from a local ISO date-time value', () => {
        mountTimeInput({ data: { myTime: '2026-06-15T14:30:00' }, lang: 'en-GB' });

        cy.get(sel.hour).should('have.value', '14');
        cy.get(sel.minute).should('have.value', '30');
      });
    });

    describe('typing', () => {
      it('should block non-digit keys on numeric parts', () => {
        mountTimeInput();

        cy.get(sel.hour).type('ab-');
        cy.get(sel.hour).should('have.value', '');
      });

      it('should auto-advance from hour to minute when filled', () => {
        mountTimeInput();

        cy.get(sel.hour).type('09');
        cy.focused().should('have.attr', 'data-type', 'minute');
      });

      it('should clamp a too-large typed hour in 12h mode', () => {
        mountTimeInput();

        cy.get(sel.hour).type('30');
        cy.get(sel.hour).should('have.value', '12');
      });

      it('should clamp a too-large typed hour in 24h mode', () => {
        mountTimeInput({ lang: 'en-GB' });

        cy.get(sel.hour).type('30');
        cy.get(sel.hour).should('have.value', '23');
      });

      it('should clamp too-large typed minutes to 59', () => {
        mountTimeInput();

        cy.get(sel.minute).type('95');
        cy.get(sel.minute).should('have.value', '59');
      });

      it('should submit the typed time as an ISO time string', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountTimeInput({ lang: 'en-GB', formSubmit: formSubmitHandler });

        // Filling the last part wraps focus to the first one, committing the value
        cy.get(sel.hour).type('21');
        cy.focused().type('45');
        cy.focused().should('have.attr', 'data-type', 'hour');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myTime: '21:45:00' });
        });
      });
    });

    describe('arrow up/down', () => {
      it('should increment and decrement minutes by 1 by default', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountTimeInput({ data: { myTime: '14:30:00' }, formSubmit: formSubmitHandler });

        // Settle after each press: each arrow emits a change whose value
        // round-trips through the form before the next press
        cy.get(sel.minute).type('{upArrow}');
        cy.get(sel.minute).should('have.value', '31');
        cy.get(sel.minute).type('{downArrow}');
        cy.get(sel.minute).should('have.value', '30');
        cy.get(sel.minute).type('{downArrow}');
        cy.get(sel.minute).should('have.value', '29');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myTime: '14:29:00' });
        });
      });

      it('should move minutes by minuteStep', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountTimeInput({
          data: { myTime: '14:30:00' },
          props: { minuteStep: 15 },
          formSubmit: formSubmitHandler,
        });

        cy.get(sel.minute).type('{upArrow}');
        cy.get(sel.minute).should('have.value', '45');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myTime: '14:45:00' });
        });
      });

      it('should wrap minutes from 59 to 00 on ArrowUp', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountTimeInput({ data: { myTime: '14:59:00' }, formSubmit: formSubmitHandler });

        cy.get(sel.minute).type('{upArrow}');
        cy.get(sel.minute).should('have.value', '00');

        // Wrapping does not carry into the hour part
        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myTime: '14:00:00' });
        });
      });

      it('should wrap minutes from 00 to 59 on ArrowDown', () => {
        mountTimeInput({ data: { myTime: '14:00:00' } });

        cy.get(sel.minute).type('{downArrow}');
        cy.get(sel.minute).should('have.value', '59');
      });

      it('should wrap minutes past 60 with minuteStep', () => {
        mountTimeInput({
          data: { myTime: '14:55:00' },
          props: { minuteStep: 15 },
        });

        cy.get(sel.minute).type('{upArrow}');
        cy.get(sel.minute).should('have.value', '10');
      });

      it('should stop at the max hour limit instead of wrapping (24h)', () => {
        mountTimeInput({ data: { myTime: '23:30:00' }, lang: 'en-GB' });

        cy.get(sel.hour).type('{upArrow}');
        cy.get(sel.hour).should('have.value', '23');
      });

      it('should stop at the min hour limit instead of wrapping (24h)', () => {
        mountTimeInput({ data: { myTime: '00:30:00' }, lang: 'en-GB' });

        cy.get(sel.hour).type('{downArrow}');
        cy.get(sel.hour).should('have.value', '00');
      });

      it('should set an empty minute to 00 on ArrowUp', () => {
        mountTimeInput();

        cy.get(sel.minute).type('{upArrow}');
        cy.get(sel.minute).should('have.value', '00');
      });
    });

    describe('day period', () => {
      it('should default to AM so hour and minute alone emit a value', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountTimeInput({ formSubmit: formSubmitHandler });

        expectDayPeriod('AM');

        cy.get(sel.hour).type('09');
        cy.focused().type('30');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myTime: '09:30:00' });
        });
      });

      it('should toggle the period on click and shift the value by 12h', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountTimeInput({ data: { myTime: '14:30:00' }, formSubmit: formSubmitHandler });

        expectDayPeriod('PM');
        cy.get(sel.dayPeriod).click();
        expectDayPeriod('AM');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myTime: '02:30:00' });
        });
      });

      it('should NOT toggle the period with Enter', () => {
        // Enter belongs to whoever owns "commit" — a host time-picker sets the
        // time with it, and inside a range input it creates the pill. It must
        // never flip AM/PM as a side effect. Space, click and the arrows do that.
        mountTimeInput({ data: { myTime: '09:30:00' } });

        // Reach the toggle via keyboard so focusing does not click it
        cy.get(sel.minute).click();
        cy.focused().type('{rightArrow}');
        cy.focused().should('have.attr', 'data-type', 'dayPeriod');
        cy.focused().type('{enter}');
        expectDayPeriod('AM');
      });

      it('should toggle the period once with Space', () => {
        mountTimeInput({ data: { myTime: '09:30:00' } });

        // Reach the toggle via keyboard so focusing does not click it
        cy.get(sel.minute).click();
        cy.focused().type('{rightArrow}');
        cy.focused().should('have.attr', 'data-type', 'dayPeriod');
        cy.focused().type(' ');
        expectDayPeriod('PM');
      });

      it('should toggle AM/PM with the arrow keys', () => {
        // Arrows cycle the day-period like every other part (and like a native
        // <input type="time">), so it is reachable without Enter or Space.
        mountTimeInput({ data: { myTime: '14:30:00' } });

        expectDayPeriod('PM');
        // focus() instead of click() so focusing itself does not toggle
        cy.get(sel.dayPeriod).focus();
        cy.focused().type('{upArrow}');
        expectDayPeriod('AM');
        cy.focused().type('{downArrow}');
        expectDayPeriod('PM');
      });

      it('should participate in arrow navigation', () => {
        mountTimeInput({ data: { myTime: '09:30:00' } });

        cy.get(sel.hour).click();
        cy.focused().type('{rightArrow}');
        cy.focused().should('have.attr', 'data-type', 'minute');
        cy.focused().type('{rightArrow}');
        cy.focused().should('have.attr', 'data-type', 'dayPeriod');
        cy.focused().type('{leftArrow}');
        cy.focused().should('have.attr', 'data-type', 'minute');
      });
    });

    describe('runtime locale change', () => {
      it('should re-derive the parts when switching to a 24h locale at runtime', () => {
        const translator = identityTranslator('en-US');
        mountTimeInput({ data: { myTime: '14:30:00' }, translator });

        cy.get(sel.hour).should('have.value', '02');
        expectDayPeriod('PM');

        cy.then(() => translator.setLang('en-GB'));

        // A 24h locale drops the day period and shows the 24h hour
        cy.get(sel.dayPeriod).should('not.exist');
        cy.get(sel.hour).should('have.value', '14');
        cy.get(sel.minute).should('have.value', '30');
      });

      it('should re-derive the parts when switching to a 12h locale at runtime', () => {
        const translator = identityTranslator('en-GB');
        mountTimeInput({ data: { myTime: '14:30:00' }, translator });

        cy.get(sel.hour).should('have.value', '14');
        cy.get(sel.dayPeriod).should('not.exist');

        cy.then(() => translator.setLang('en-US'));

        cy.get(sel.hour).should('have.value', '02');
        cy.get(sel.minute).should('have.value', '30');
        expectDayPeriod('PM');
      });
    });

    describe('runtime locale change', () => {
      it('should re-derive the parts when switching to a 24h locale at runtime', () => {
        const translator = identityTranslator('en-US');
        mountTimeInput({ data: { myTime: '14:30:00' }, translator });

        cy.get(sel.hour).should('have.value', '02');
        expectDayPeriod('PM');

        cy.then(() => translator.setLang('en-GB'));

        cy.get(sel.hour).should('have.value', '14');
        cy.get(sel.dayPeriod).should('not.exist');
      });

      it('should re-derive the parts when switching to a 12h locale at runtime', () => {
        const translator = identityTranslator('en-GB');
        mountTimeInput({ data: { myTime: '14:30:00' }, translator });

        cy.get(sel.hour).should('have.value', '14');
        cy.get(sel.dayPeriod).should('not.exist');

        cy.then(() => translator.setLang('en-US'));

        cy.get(sel.hour).should('have.value', '02');
        cy.get(sel.minute).should('have.value', '30');
        expectDayPeriod('PM');
      });
    });

    describe('RTL', () => {
      // CLDR emits no bidi marks inside h:mm (it must read hour-first in any
      // direction); only the day period reorders around it. So in RTL the
      // expected visual order is [period] [hour]:[minute], left to right.
      it('should keep hour:minute unmirrored with the day period on the left', () => {
        mountTimeInput({ data: { myTime: '08:00:00' }, lang: 'ar' });

        cy.get(sel.hour).should('have.value', '08');
        cy.get(sel.minute).should('have.value', '00');
        cy.get('gui-time').should(($el) => {
          const left = (type: string) => {
            const part = $el[0].querySelector(`[data-type="${type}"]`);
            expect(part, `${type} part exists`).to.not.equal(null);
            return (part as HTMLElement).getBoundingClientRect().left;
          };
          expect(left('dayPeriod'), 'day period is visually leftmost').to.be.lessThan(left('hour'));
          expect(left('hour'), 'hour stays left of minute').to.be.lessThan(left('minute'));
        });
      });

      it('should navigate visually with the arrow keys', () => {
        mountTimeInput({ data: { myTime: '08:00:00' }, lang: 'ar' });

        // Visual order (left to right): dayPeriod, hour, minute
        cy.get(sel.hour).click();
        cy.focused().type('{rightArrow}');
        cy.focused().should('have.attr', 'data-type', 'minute');
        cy.focused().type('{leftArrow}');
        cy.focused().should('have.attr', 'data-type', 'hour');
        cy.focused().type('{leftArrow}');
        cy.focused().should('have.attr', 'data-type', 'dayPeriod');
      });
    });

    describe('blur', () => {
      it('should emit a null value and keep the other parts when one part is emptied', () => {
        mountTimeInput({ data: { myTime: '14:30:00' } });

        const changeSpy = cy.spy().as('changeSpy');
        cy.get('gui-time').then(($el) => {
          $el[0].addEventListener('change', changeSpy as unknown as EventListener);
        });

        cy.get(sel.minute).type('{selectAll}{backspace}');
        cy.get(sel.minute).blur();

        cy.get('@changeSpy').then((spy: any) => {
          expect(spy.getCall(0).args[0].detail.value).to.equal(null);
        });

        // Only the emptied part clears: the rest of the entry is not wiped
        cy.get(sel.minute).should('have.value', '');
        cy.get(sel.hour).should('have.value', '02');
        expectDayPeriod('PM');
      });
    });

    describe('incomplete input on focus leave', () => {
      it('should not validate while moving between the parts of one entry', () => {
        // Filling a part auto-advances to the next one. That hop is not
        // leaving the widget, so the form must not judge a half-typed entry:
        // a required field lighting up after the first part is the bug.
        mountTimeInput({ validator: { type: 'string', required: true } });

        cy.get(sel.hour).type('09');
        cy.get('[data-cy="testSubject_validator-errors"]').should('not.exist');

        // Leaving the widget is the one moment the entry is judged
        cy.get('[data-cy="submitBtn_button"]').focus();
        cy.get('[data-cy="testSubject_validator-errors"]').should('exist');
      });

      it('should flip a partial time to null with an incomplete error when focus leaves', () => {
        mountTimeInput();

        const changeSpy = cy.spy().as('changeSpy');
        cy.get('gui-time').then(($el) => {
          $el[0].addEventListener('change', changeSpy as unknown as EventListener);
        });

        cy.get(sel.hour).type('09');
        cy.get('[data-cy="submitBtn_button"]').focus();

        cy.get('[data-cy="testSubject_validator-error"]').should('contain.text', 'Incomplete time');
        cy.get('@changeSpy').then((spy: any) => {
          expect(spy.getCall(0).args[0].detail.value).to.equal(null);
        });
      });

      it('should show the incomplete error for a committed value left with an emptied part', () => {
        mountTimeInput({ data: { myTime: '14:30:00' } });

        cy.get(sel.minute).type('{selectAll}{backspace}');
        cy.get('[data-cy="submitBtn_button"]').focus();

        cy.get('[data-cy="testSubject_validator-error"]').should('contain.text', 'Incomplete time');
        cy.get(sel.hour).should('have.value', '02');
      });

      it('should clear the incomplete error once the time is completed', () => {
        mountTimeInput();

        cy.get(sel.hour).type('09');
        cy.get('[data-cy="submitBtn_button"]').focus();
        cy.get('[data-cy="testSubject_validator-error"]').should('contain.text', 'Incomplete time');

        cy.get(sel.minute).type('30');
        cy.get('[data-cy="testSubject_validator-error"]').should('not.exist');
      });
    });

    describe('readonly and disabled', () => {
      it('should ignore typing and arrows when readonly', () => {
        mountTimeInput({ data: { myTime: '14:30:00' }, readonly: true });

        cy.get(sel.minute).should('have.attr', 'readonly');
        cy.get(sel.minute).type('{upArrow}', { force: true });
        cy.get(sel.minute).should('have.value', '30');

        cy.get(sel.dayPeriod).click();
        expectDayPeriod('PM');
      });

      it('should render disabled inputs when disabled', () => {
        mountTimeInput({ data: { myTime: '14:30:00' }, disabled: true });

        cy.get(sel.hour).should('be.disabled');
        cy.get(sel.minute).should('be.disabled');
      });
    });

    describe('bounds validation', () => {
      it('should emit change and inputError for a time past maxTime', () => {
        // en-GB renders 24h, so the hour is typed directly without a period
        mountTimeInput({
          lang: 'en-GB',
          props: { minTime: '09:00:00', maxTime: '17:00:00', maxTimeMessage: 'Too late' },
        });

        const changeSpy = cy.spy().as('changeSpy');
        const inputErrorSpy = cy.spy().as('inputErrorSpy');
        cy.get('gui-time').then(($el) => {
          $el[0].addEventListener('change', changeSpy as unknown as EventListener);
          $el[0].addEventListener('inputError', inputErrorSpy as unknown as EventListener);
        });

        cy.get(sel.hour).type('18');
        cy.focused().type('00', { force: true });

        cy.get('@changeSpy').should('have.been.called');
        cy.get('@inputErrorSpy').then((spy: any) => {
          expect(spy.getCall(0).args[0].detail.message).to.equal('Too late');
        });
      });
    });

    describe('accessibility', () => {
      it('should expose each segment as a named spinbutton with its bounds', () => {
        mountTimeInput();

        cy.get(sel.hour)
          .should('have.attr', 'role', 'spinbutton')
          .should('have.attr', 'aria-label', 'Hour')
          .should('have.attr', 'aria-valuemin', '1')
          .should('have.attr', 'aria-valuemax', '12');
        cy.get(sel.minute)
          .should('have.attr', 'aria-label', 'Minute')
          .should('have.attr', 'aria-valuemin', '0')
          .should('have.attr', 'aria-valuemax', '59');
        cy.get(sel.dayPeriod).should('have.attr', 'aria-label', 'AM/PM');
      });

      it('should not expose aria-valuenow while a segment is empty', () => {
        mountTimeInput();
        cy.get(sel.hour).should('not.have.attr', 'aria-valuenow');
      });

      it('should expose aria-valuenow for filled segments', () => {
        mountTimeInput({ data: { myTime: '14:30' } });
        cy.get(sel.hour).should('have.attr', 'aria-valuenow', '2');
        cy.get(sel.minute).should('have.attr', 'aria-valuenow', '30');
      });

      it('should not mark individual segments as required', () => {
        mountTimeInput();
        cy.get(sel.hour).should('not.have.attr', 'required');
        cy.get(sel.minute).should('not.have.attr', 'required');
      });

      it('should honor the segment aria-label override props', () => {
        mountTimeInput({
          props: {
            hourAriaLabel: 'Hora',
            minuteAriaLabel: 'Minuto',
            dayPeriodAriaLabel: 'Meridiano',
          },
        });
        cy.get(sel.hour).should('have.attr', 'aria-label', 'Hora');
        cy.get(sel.minute).should('have.attr', 'aria-label', 'Minuto');
        cy.get(sel.dayPeriod).should('have.attr', 'aria-label', 'Meridiano');
      });
    });
  });
};
