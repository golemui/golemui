import { html } from 'lit';
import type { GuiOtp } from '../../src/lib/components/otp';
import { configureMessages } from '../../src/index';
import { realClick, realPress, realType, takesRealInput } from '../support/real-input';

const element = () => cy.get<GuiOtp>('gui-otp');
const input = () => cy.get<HTMLInputElement>('gui-otp input');
const boxes = () => cy.get('gui-otp .gui-otp__box');

/** Waits until the boxes show `code`, one character per box, a space for an empty one. */
const shows = (code: string) =>
  boxes().should((list) =>
    expect([...list].map((box) => box.textContent?.trim() || ' ').join('')).to.equal(code),
  );

/** Pastes text the way the browser reports it: the input's new value, then `input`. */
const paste = (text: string) =>
  input().then(([field]) => {
    field.value = text;
    field.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertFromPaste' }));
  });

describe('gui-otp', () => {
  describe('rendering', () => {
    it('draws one box per digit, six by default', () => {
      cy.mount(html`<gui-otp label="Code"></gui-otp>`);

      boxes().should('have.length', 6);
      cy.get('gui-otp .gui-otp__separator').should('not.exist');
    });

    it('draws `length` boxes, in the groups it is given', () => {
      cy.mount(html`<gui-otp label="Code" length="8" groups="4,4"></gui-otp>`);

      boxes().should('have.length', 8);
      cy.get('gui-otp .gui-otp__group').should('have.length', 2);
      cy.get('gui-otp .gui-otp__separator').should('have.length', 1);
    });

    it('ignores groups that do not add up to the length, and a length that is not a count', () => {
      cy.mount(html`<gui-otp label="Code" length="0" groups="2,2"></gui-otp>`);

      boxes().should('have.length', 6);
      cy.get('gui-otp .gui-otp__group').should('have.length', 1);
    });

    it('is a plain text field for autofill and assistive technology', () => {
      cy.mount(html`<gui-otp uid="code" label="Verification code" hint="Sent by SMS"></gui-otp>`);

      input().should(([field]) => {
        expect(field.type).to.equal('text');
        expect(field.getAttribute('autocomplete')).to.equal('one-time-code');
        expect(field.getAttribute('inputmode')).to.equal('numeric');
        expect(field.getAttribute('aria-describedby')).to.equal('code_hint');
        // The element validates the code itself (see GuiFormControl): no native constraints, and
        // no maxlength, which would cut a pasted `123-456` before its dash is dropped.
        for (const constraint of ['maxlength', 'pattern', 'required']) {
          expect(field.hasAttribute(constraint), constraint).to.equal(false);
        }
      });
      input().then(([field]) => {
        expect(field.labels?.[0]?.textContent).to.contain('Verification code');
      });
      cy.get('gui-otp .gui-otp__boxes').should('have.attr', 'aria-hidden', 'true');
    });

    it('shows the digits of its value, and only those', () => {
      cy.mount(html`<gui-otp label="Code" value="12ab3"></gui-otp>`);

      shows('123   ');
      input().should('have.value', '123');
    });

    it('runs left to right in a right-to-left page', () => {
      cy.mount(html`<div dir="rtl"><gui-otp label="Code" value="123456"></gui-otp></div>`);

      cy.get('gui-otp .gui-otp__control').should('have.attr', 'dir', 'ltr');
      boxes().then((list) => {
        const [first, second] = [...list].map((box) => box.getBoundingClientRect().left);
        expect(first).to.be.lessThan(second);
      });
      shows('123456');
    });
  });

  describe('typing', () => {
    it('keeps the digits of what is typed, and fires gui-input for each change', () => {
      const onInput = cy.spy().as('input');
      cy.mount(html`<gui-otp label="Code" @gui-input=${onInput}></gui-otp>`);

      input().type('12-a3');
      shows('123   ');
      input().should('have.value', '123');
      element().should(([host]) => expect(host.value).to.equal('123'));
      cy.get('@input').its('lastCall.args.0.detail.value').should('equal', '123');
      // The dash and the letter changed nothing, so they fired nothing.
      cy.get('@input').should('have.callCount', 3);
    });

    it('fires gui-change once, when the code is complete', () => {
      const onChange = cy.spy().as('change');
      cy.mount(html`<gui-otp label="Code" length="4" @gui-change=${onChange}></gui-otp>`);

      input().type('123');
      cy.get('@change').should('not.have.been.called');
      input().type('4');
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change').its('lastCall.args.0.detail.value').should('equal', '1234');
      // A seventh digit has nowhere to go.
      input().type('5');
      shows('1234');
      cy.get('@change').should('have.been.calledOnce');
    });

    it('fires gui-change when focus leaves a changed code, and gui-blur', () => {
      const onChange = cy.spy().as('change');
      const onBlur = cy.spy().as('blur');
      cy.mount(html`<gui-otp label="Code" @gui-change=${onChange} @gui-blur=${onBlur}></gui-otp>`);

      input().type('12').blur();
      cy.get('@change').its('lastCall.args.0.detail.value').should('equal', '12');
      cy.get('@blur').should('have.been.called');
    });

    it('removes the last digit with Backspace', () => {
      cy.mount(html`<gui-otp label="Code" value="1234"></gui-otp>`);

      input().type('{backspace}');
      shows('123   ');
      element().should(([host]) => expect(host.value).to.equal('123'));
    });

    it('replaces the whole code once it is selected', () => {
      cy.mount(html`<gui-otp label="Code" value="123456"></gui-otp>`);

      input().type('{selectall}987654');
      shows('987654');
    });

    it('takes a pasted code without its separators, up to its length', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-otp label="Code" @gui-input=${onInput} @gui-change=${onChange}></gui-otp>`,
      );

      paste('123-456 789');
      shows('123456');
      input().should('have.value', '123456');
      cy.get('@input').should('have.been.calledOnce');
      cy.get('@change').its('lastCall.args.0.detail.value').should('equal', '123456');
    });

    it('marks the box the next digit goes in', () => {
      cy.mount(html`<gui-otp label="Code" length="4" value="12"></gui-otp>`);

      boxes().eq(2).should('have.class', 'gui-otp__box--active');
      boxes().filter('.gui-otp__box--filled').should('have.length', 2);
      element().invoke('prop', 'value', '1234');
      // A complete code keeps the last box active.
      boxes().eq(3).should('have.class', 'gui-otp__box--active');
    });

    it('is read-only or disabled like a native field', () => {
      cy.mount(
        html`<gui-otp label="Code" value="12" readonly></gui-otp>
          <gui-otp label="Other" value="34" disabled></gui-otp>`,
      );

      cy.get('gui-otp[readonly] input').should('have.attr', 'readonly');
      cy.get('gui-otp[disabled] input').should('be.disabled');
    });

    if (takesRealInput()) {
      it('keeps the caret after the last digit: arrows and Home do not move it', () => {
        cy.mount(html`<gui-otp label="Code"></gui-otp>`);

        input().focus();
        realType('123');
        realPress('ArrowLeft');
        realPress('Home');
        realType('4');
        shows('1234  ');
        realPress('Backspace');
        shows('123   ');
      });

      it('puts the caret after the last digit wherever the code is clicked', () => {
        cy.mount(html`<gui-otp label="Code" value="123"></gui-otp>`);

        boxes()
          .first()
          .then(([box]) => {
            const { x, y, width, height } = box.getBoundingClientRect();
            return realClick(x + width / 2, y + height / 2);
          });
        input().should('be.focused');
        realType('4');
        shows('1234  ');
      });
    }
  });

  describe('form', () => {
    it('submits the code under its name, and resets to its initial value', () => {
      cy.mount(html`<form><gui-otp name="code" label="Code" value="123456"></gui-otp></form>`);

      cy.get('form').should(([form]) =>
        expect(new FormData(form as HTMLFormElement).get('code')).to.equal('123456'),
      );
      input().type('{backspace}');
      cy.get('form').then(([form]) => (form as HTMLFormElement).reset());
      shows('123456');
    });

    it('blocks an empty required code and an incomplete one', () => {
      cy.mount(html`<form><gui-otp name="code" label="Code" required></gui-otp></form>`);

      element().should(([host]) => {
        expect(host.validity?.valueMissing).to.equal(true);
      });
      input().type('123');
      element().should(([host]) => {
        expect(host.validity?.tooShort).to.equal(true);
        expect(host.validationMessage).to.equal('Enter all 6 digits.');
      });
      input().type('456');
      element().should(([host]) => expect(host.checkValidity()).to.equal(true));
    });

    it('reports a value that is not digits, set from outside, with its own message', () => {
      cy.mount(html`<form><gui-otp name="code" length="4" value="12-34"></gui-otp></form>`);

      shows('1234');
      element().should(([host]) => {
        expect(host.value).to.equal('12-34');
        expect(host.validity?.patternMismatch).to.equal(true);
        expect(host.validationMessage).to.equal('Enter a 4-digit code.');
      });
    });

    it('reports too many digits, set from outside, with its own message', () => {
      cy.mount(html`<form><gui-otp name="code" length="4" value="12345"></gui-otp></form>`);

      shows('1234');
      element().should(([host]) => {
        expect(host.value).to.equal('12345');
        expect(host.validity?.tooLong).to.equal(true);
        expect(host.validity?.tooShort).to.equal(false);
        expect(host.validationMessage).to.equal('Enter a 4-digit code.');
      });
    });

    it('takes its own incomplete message', () => {
      cy.mount(
        html`<form>
          <gui-otp
            name="code"
            label="Code"
            value="12"
            incomplete-message="The code has 6 digits"
          ></gui-otp>
        </form>`,
      );

      element().should(([host]) =>
        expect(host.validationMessage).to.equal('The code has 6 digits'),
      );
    });
  });

  describe('strings', () => {
    afterEach(() => configureMessages(null));

    it('translates the incomplete message, with the length', () => {
      configureMessages((key, _text, params) =>
        key === 'incompleteCode' ? `Faltan dígitos: ${params?.['length']}` : undefined,
      );
      cy.mount(html`<form><gui-otp name="code" length="4" value="1"></gui-otp></form>`);

      element().should(([host]) => expect(host.validationMessage).to.equal('Faltan dígitos: 4'));
    });
  });
});
