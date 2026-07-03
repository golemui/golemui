import { defineForm, identityTranslator } from '@golemui/core';
import { type MountComponentFn } from '../utils';

export const runTimeInputComponentTests = (mountFn: MountComponentFn) => {
  describe('TimeInput Component', () => {
    const sel = {
      hour: 'gui-time input[data-type="hour"]',
      minute: 'gui-time input[data-type="minute"]',
      dayPeriod: 'gui-time input[data-type="dayPeriod"]',
    };

    const mountTimeInput = (options?: {
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
              type: 'timeInput',
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
      cy.get('[data-cy="submitBtn_button"]').click();
      return cy.get(formSubmitAlias).then((stub: any) => stub.getCall(0).args[0].data);
    };

    /** Local ISO date-time for today's date at the given time, like the widget emits. */
    const todayAt = (hours: number, minutes: number) => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(hours)}:${pad(minutes)}:00`;
    };

    describe('rendering', () => {
      it('should display a 12h value with a day period in a 12h locale', () => {
        mountTimeInput({ data: { myTime: '2026-06-15T14:30:00' } });

        cy.get(sel.hour).should('have.value', '02').and('have.attr', 'placeholder', 'hh');
        cy.get(sel.minute).should('have.value', '30').and('have.attr', 'placeholder', 'mm');
        cy.get(sel.dayPeriod).should('have.value', 'PM');
      });

      it('should display a 24h value without a day period in a 24h locale', () => {
        mountTimeInput({ data: { myTime: '2026-06-15T14:30:00' }, lang: 'en-GB' });

        cy.get(sel.hour).should('have.value', '14');
        cy.get(sel.minute).should('have.value', '30');
        cy.get(sel.dayPeriod).should('not.exist');
      });

      it('should force a 24h layout with hourFormat=24 in a 12h locale', () => {
        mountTimeInput({
          data: { myTime: '2026-06-15T14:30:00' },
          props: { hourFormat: '24' },
        });

        cy.get(sel.hour).should('have.value', '14');
        cy.get(sel.dayPeriod).should('not.exist');
      });

      it('should force a 12h layout with hourFormat=12 in a 24h locale', () => {
        mountTimeInput({
          data: { myTime: '2026-06-15T14:30:00' },
          lang: 'en-GB',
          props: { hourFormat: '12' },
        });

        cy.get(sel.hour).should('have.value', '02');
        cy.get(sel.dayPeriod).should('exist');
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

      it('should submit the typed time as a local ISO date-time on the current date', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountTimeInput({ lang: 'en-GB', formSubmit: formSubmitHandler });

        // Filling the last part wraps focus to the first one, committing the value
        cy.get(sel.hour).type('21');
        cy.focused().type('45');
        cy.focused().should('have.attr', 'data-type', 'hour');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myTime: todayAt(21, 45) });
        });
      });
    });

    describe('arrow up/down', () => {
      it('should increment and decrement minutes by 1 by default', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountTimeInput({ data: { myTime: '2026-06-15T14:30:00' }, formSubmit: formSubmitHandler });

        // Settle after each press: each arrow emits a change whose value
        // round-trips through the form before the next press
        cy.get(sel.minute).type('{upArrow}');
        cy.get(sel.minute).should('have.value', '31');
        cy.get(sel.minute).type('{downArrow}');
        cy.get(sel.minute).should('have.value', '30');
        cy.get(sel.minute).type('{downArrow}');
        cy.get(sel.minute).should('have.value', '29');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myTime: todayAt(14, 29) });
        });
      });

      it('should move minutes by minuteStep', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountTimeInput({
          data: { myTime: '2026-06-15T14:30:00' },
          props: { minuteStep: 15 },
          formSubmit: formSubmitHandler,
        });

        cy.get(sel.minute).type('{upArrow}');
        cy.get(sel.minute).should('have.value', '45');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myTime: todayAt(14, 45) });
        });
      });

      it('should wrap minutes from 59 to 00 on ArrowUp', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountTimeInput({ data: { myTime: '2026-06-15T14:59:00' }, formSubmit: formSubmitHandler });

        cy.get(sel.minute).type('{upArrow}');
        cy.get(sel.minute).should('have.value', '00');

        // Wrapping does not carry into the hour part
        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myTime: todayAt(14, 0) });
        });
      });

      it('should wrap minutes from 00 to 59 on ArrowDown', () => {
        mountTimeInput({ data: { myTime: '2026-06-15T14:00:00' } });

        cy.get(sel.minute).type('{downArrow}');
        cy.get(sel.minute).should('have.value', '59');
      });

      it('should wrap minutes past 60 with minuteStep', () => {
        mountTimeInput({
          data: { myTime: '2026-06-15T14:55:00' },
          props: { minuteStep: 15 },
        });

        cy.get(sel.minute).type('{upArrow}');
        cy.get(sel.minute).should('have.value', '10');
      });

      it('should stop at the max hour limit instead of wrapping (24h)', () => {
        mountTimeInput({ data: { myTime: '2026-06-15T23:30:00' }, lang: 'en-GB' });

        cy.get(sel.hour).type('{upArrow}');
        cy.get(sel.hour).should('have.value', '23');
      });

      it('should stop at the min hour limit instead of wrapping (24h)', () => {
        mountTimeInput({ data: { myTime: '2026-06-15T00:30:00' }, lang: 'en-GB' });

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
      it('should toggle AM/PM with the arrow keys and shift the value by 12h', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountTimeInput({ data: { myTime: '2026-06-15T14:30:00' }, formSubmit: formSubmitHandler });

        cy.get(sel.dayPeriod).type('{upArrow}');
        cy.get(sel.dayPeriod).should('have.value', 'AM');

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myTime: todayAt(2, 30) });
        });
      });

      it('should ignore typed characters (arrows are the only way to set the period)', () => {
        mountTimeInput({ data: { myTime: '2026-06-15T09:30:00' } });

        cy.get(sel.dayPeriod).should('have.value', 'AM');
        cy.get(sel.dayPeriod).type('p');
        cy.get(sel.dayPeriod).should('have.value', 'AM');
        cy.get(sel.dayPeriod).type('x');
        cy.get(sel.dayPeriod).should('have.value', 'AM');
      });

      it('should clear the period with Backspace', () => {
        mountTimeInput({ data: { myTime: '2026-06-15T09:30:00' } });

        cy.get(sel.dayPeriod).type('{backspace}');
        cy.get(sel.dayPeriod).should('have.value', '');
      });

      it('should participate in arrow navigation', () => {
        mountTimeInput({ data: { myTime: '2026-06-15T09:30:00' } });

        cy.get(sel.hour).click();
        cy.focused().type('{rightArrow}');
        cy.focused().should('have.attr', 'data-type', 'minute');
        cy.focused().type('{rightArrow}');
        cy.focused().should('have.attr', 'data-type', 'dayPeriod');
        cy.focused().type('{leftArrow}');
        cy.focused().should('have.attr', 'data-type', 'minute');
      });
    });

    describe('blur', () => {
      it('should emit a null value when a part is emptied and blurred', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountTimeInput({ data: { myTime: '2026-06-15T14:30:00' }, formSubmit: formSubmitHandler });

        cy.get(sel.minute).type('{selectAll}{backspace}');
        cy.get(sel.minute).blur();

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myTime: null });
        });
      });
    });

    describe('readonly and disabled', () => {
      it('should ignore typing and arrows when readonly', () => {
        mountTimeInput({ data: { myTime: '2026-06-15T14:30:00' }, readonly: true });

        cy.get(sel.minute).should('have.attr', 'readonly');
        cy.get(sel.minute).type('{upArrow}', { force: true });
        cy.get(sel.minute).should('have.value', '30');
      });

      it('should render disabled inputs when disabled', () => {
        mountTimeInput({ data: { myTime: '2026-06-15T14:30:00' }, disabled: true });

        cy.get(sel.hour).should('be.disabled');
        cy.get(sel.minute).should('be.disabled');
      });
    });
  });
};
