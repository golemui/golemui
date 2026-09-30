import { ref } from 'lit/directives/ref.js';
import { html, unsafeStatic } from 'lit/static-html.js';
import type { GuiFormControl } from '../../src/lib/gui-form-control';
import { checkA11y } from '../support/a11y';
import { elements, type ElementCase } from '../support/elements';

type Control = GuiFormControl & HTMLElement & Record<string, unknown>;

/** The element with its props, set before it connects (a `ref` runs before insertion). */
const element = ({ tag, props }: ElementCase, extra: Record<string, unknown> = {}) =>
  html`<${unsafeStatic(tag)}
    ${ref((node) => node && Object.assign(node, props, extra))}
  ></${unsafeStatic(tag)}>`;

const control = (tag: string) => cy.get<Control>(tag);
const form = () => cy.get<HTMLFormElement>('form');

// The contract every element keeps on its own, without GolemUI Forms. Each element's own
// behavior is in its spec.
describe('element contract', () => {
  for (const testCase of elements) {
    const { tag, form: formCase } = testCase;

    describe(tag, () => {
      it('renders with no accessibility violations', () => {
        cy.mount(element(testCase));

        if (testCase.hostRendersChildren) cy.get(tag).should('exist');
        else cy.get(tag).children().should('not.have.length', 0);
        checkA11y(
          { include: [tag], exclude: testCase.exclude?.map((selector) => `${tag} ${selector}`) },
          testCase.rules,
        );
      });

      if (!formCase) return;

      it('belongs to its form and submits its value under its name', () => {
        cy.mount(
          html`<form>
            ${element(testCase, { name: 'field', [formCase.property]: formCase.sample })}
          </form>`,
        );

        form().should(([formElement]) => {
          expect(formElement.querySelector<Control>(tag)?.form).to.equal(formElement);
          expect(new FormData(formElement).has('field')).to.equal(true);
        });
      });

      it('submits nothing without a name', () => {
        cy.mount(html`<form>${element(testCase, { [formCase.property]: formCase.sample })}</form>`);

        control(tag).should('have.prop', 'isConnected', true);
        form().should(([formElement]) => {
          expect([...new FormData(formElement).keys()]).to.deep.equal([]);
        });
      });

      it('restores its initial value on reset', () => {
        cy.mount(
          html`<form>
            ${element(testCase, { name: 'field', [formCase.property]: formCase.sample })}
          </form>`,
        );

        control(tag).then(([el]) => {
          el[formCase.property] = undefined;
        });
        form().then(([formElement]) => formElement.reset());

        control(tag).should(([el]) => expect(el[formCase.property]).to.deep.equal(formCase.sample));
      });

      it('reports a missing value when required', () => {
        cy.mount(html`<form>${element(testCase, { name: 'field', required: true })}</form>`);

        control(tag).should(([el]) => expect(el.validity?.valueMissing).to.equal(true));
        form().should(([formElement]) => expect(formElement.checkValidity()).to.equal(false));
      });

      it('is disabled by a disabled fieldset', () => {
        cy.mount(
          html`<form><fieldset disabled>${element(testCase, { name: 'field' })}</fieldset></form>`,
        );

        control(tag).should('have.prop', 'disabled', true);
        cy.get('fieldset').invoke('prop', 'disabled', false);
        control(tag).should('have.prop', 'disabled', false);
      });
    });
  }
});
