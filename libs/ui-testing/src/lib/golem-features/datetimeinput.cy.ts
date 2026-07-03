import { defineForm, identityTranslator } from '@golemui/core';
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
              type: 'dateTimeInput',
              path: 'myDateTime',
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
        cy.get(sel.dayPeriod).should('have.text', 'PM');
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

        cy.get(sel.dayPeriod).should('have.text', 'AM');

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

        cy.get(sel.dayPeriod).should('have.text', 'PM');
        cy.get(sel.dayPeriod).click();
        cy.get(sel.dayPeriod).should('have.text', 'AM');

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

    describe('blur', () => {
      it('should emit a null value when a part is emptied and blurred', () => {
        const formSubmitHandler = cy.stub().as('formSubmitHandler');
        mountDateTimeInput({
          data: { myDateTime: '2026-06-15T14:30:00' },
          formSubmit: formSubmitHandler,
        });

        cy.get(sel.day).type('{selectAll}{backspace}');
        cy.get(sel.day).blur();

        submitAndGetData('@formSubmitHandler').then((data) => {
          expect(data).to.deep.equal({ myDateTime: null });
        });
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

    describe('readonly and disabled', () => {
      it('should ignore typing, arrows and toggle clicks when readonly', () => {
        mountDateTimeInput({ data: { myDateTime: '2026-06-15T14:30:00' }, readonly: true });

        cy.get(sel.day).should('have.attr', 'readonly');
        cy.get(sel.day).type('{upArrow}', { force: true });
        cy.get(sel.day).should('have.value', '15');

        cy.get(sel.dayPeriod).click();
        cy.get(sel.dayPeriod).should('have.text', 'PM');
      });

      it('should render disabled parts when disabled', () => {
        mountDateTimeInput({ data: { myDateTime: '2026-06-15T14:30:00' }, disabled: true });

        cy.get(sel.day).should('be.disabled');
        cy.get(sel.hour).should('be.disabled');
        cy.get(sel.dayPeriod).should('be.disabled');
      });
    });
  });
};
