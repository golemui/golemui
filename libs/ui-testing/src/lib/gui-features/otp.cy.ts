import { defineForm, identityTranslator, type I18nTranslator } from '@golemui/core';
import { type MountComponentFn } from '../utils';

// Behavior tests for the otp widget: a one-time code, one box per digit, whose value is the
// string of digits typed so far.
export const runOtpComponentTests = (mountFn: MountComponentFn) => {
  describe('OTP Component', () => {
    const uid = 'testSubject';
    const sel = {
      input: `[data-cy="${uid}_otp"]`,
      boxes: 'gui-otp .gui-otp__box',
      error: `[data-cy="${uid}_validator-error"]`,
    };

    const mountOtp = (options?: {
      data?: Record<string, any>;
      props?: Record<string, unknown>;
      validator?: Record<string, unknown>;
      formSubmit?: (event: any) => void;
      localization?: I18nTranslator;
      disabled?: boolean;
      readonly?: boolean;
    }) => {
      mountFn({
        localization: options?.localization ?? identityTranslator('en-US'),
        data: options?.data,
        formDef: defineForm({
          form: [
            {
              uid,
              kind: 'input',
              type: 'otp',
              path: 'myField',
              label: 'Verification code',
              ...(options?.props ? { props: options.props } : {}),
              ...(options?.validator ? { validator: options.validator } : {}),
              ...(options?.disabled !== undefined ? { disabled: options.disabled } : {}),
              ...(options?.readonly !== undefined ? { readonly: options.readonly } : {}),
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

    const submit = () => cy.get('[data-cy="submitBtn_button"]').click({ force: true });
    const submitAndGetData = () => {
      submit();
      return cy.get('@formSubmit').then((stub: any) => stub.getCall(0).args[0].data);
    };

    /** Waits until the boxes show `code`, a space for an empty box. */
    const shows = (code: string) =>
      cy.get(sel.boxes).should((boxes) => {
        expect([...boxes].map((box) => box.textContent?.trim() || ' ').join('')).to.equal(code);
      });

    /** Pastes text the way the browser reports it: the input's new value, then `input`. */
    const paste = (text: string) =>
      cy.get<HTMLInputElement>(sel.input).then(([field]) => {
        field.value = text;
        field.dispatchEvent(
          new InputEvent('input', { bubbles: true, inputType: 'insertFromPaste' }),
        );
      });

    describe('value', () => {
      it('should submit the digits typed, as a string', () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountOtp({ formSubmit });

        cy.get(sel.input).type('012-345');
        shows('012345');
        submitAndGetData().then((data) => {
          expect(data.myField).to.equal('012345');
        });
      });

      it('should show the code from the data', () => {
        mountOtp({ data: { myField: '4829' } });

        shows('4829  ');
        cy.get(sel.input).should('have.value', '4829');
      });

      it('should take a pasted code without its separators', () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountOtp({ formSubmit });

        paste('123 456');
        shows('123456');
        submitAndGetData().then((data) => {
          expect(data.myField).to.equal('123456');
        });
      });
    });

    describe('validation', () => {
      it('should show the required error once touched, and clear it once typed', () => {
        mountOtp({
          validator: {
            type: 'string',
            required: true,
            // An untouched code is undefined, which the string type check reports as invalid.
            messages: { required: 'Enter the code', invalid: 'Enter the code' },
          },
        });

        cy.get(sel.error).should('not.exist');
        cy.get(sel.input).focus().blur();
        cy.get(sel.error).should('contain.text', 'Enter the code');
        cy.get(sel.input).type('1');
        cy.get(sel.error).should('not.exist');
      });

      // A partial code fails `exactLength`, set to the code's length.
      const codeValidator = {
        type: 'string',
        required: true,
        exactLength: 6,
        messages: { exactLength: 'Enter all 6 digits' },
      };

      it('should report a partial code with exactLength once touched, and clear it once complete', () => {
        mountOtp({ validator: codeValidator });

        cy.get(sel.input).type('123').blur();
        cy.get(sel.error).should('contain.text', 'Enter all 6 digits');
        cy.get(sel.input).type('456');
        cy.get(sel.error).should('not.exist');
      });

      it('should not submit a partial code', () => {
        const formSubmit = cy.stub().as('formSubmit');
        mountOtp({ formSubmit, validator: codeValidator });

        cy.get(sel.input).type('123');
        submit();
        cy.get(sel.error).should('contain.text', 'Enter all 6 digits');
        cy.get('@formSubmit').should('not.have.been.called');
      });

      it('should translate its exactLength message', () => {
        const translations: Record<string, string> = { codeIncomplete: 'Faltan dígitos' };
        const translator = identityTranslator('es-ES');
        mountOtp({
          localization: { ...translator, translate: (key: string) => translations[key] ?? key },
          validator: {
            type: 'string',
            required: true,
            exactLength: 4,
            messages: { exactLength: { key: 'codeIncomplete' } },
          },
        });

        cy.get(sel.input).type('12').blur();
        cy.get(sel.error).should('contain.text', 'Faltan dígitos');
      });
    });

    describe('props', () => {
      it("should draw a box per digit of the validator's exactLength, in its groups", () => {
        mountOtp({ props: { groups: [4, 4] }, validator: { type: 'string', exactLength: 8 } });

        cy.get(sel.boxes).should('have.length', 8);
        cy.get('gui-otp .gui-otp__separator').should('have.length', 1);
      });

      it('should offer the code from an SMS: a numeric one-time-code input', () => {
        mountOtp();

        cy.get(sel.input)
          .should('have.attr', 'autocomplete', 'one-time-code')
          .and('have.attr', 'inputmode', 'numeric');
      });
    });

    describe('state', () => {
      it('should disable its input when disabled', () => {
        mountOtp({ disabled: true, data: { myField: '123456' } });

        cy.get(sel.input).should('be.disabled');
      });

      it('should make its input read-only when readonly', () => {
        mountOtp({ readonly: true, data: { myField: '123456' } });

        cy.get(sel.input).should('have.attr', 'readonly');
        cy.get(sel.input).should('not.be.disabled');
      });
    });
  });
};
