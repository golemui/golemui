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

// A field renders its hint once, under the id its controls' aria-describedby points at. Pickers
// embed a field and a calendar that take the same uid and hint, so each is checked with its popup
// open too.
describe('hint', () => {
  const hint = 'Use the format on your card';
  const uid = 'field';

  const expectOneHint = (tag: string) =>
    cy.get(tag).should(([el]) => {
      expect(el.querySelectorAll(`[id="${uid}_hint"]`), 'elements with the hint id').to.have.length(
        1,
      );
      expect(el.textContent?.split(hint).length, 'times the hint text shows').to.equal(2);
      for (const described of el.querySelectorAll('[aria-describedby]')) {
        for (const id of described.getAttribute('aria-describedby')?.split(/\s+/) ?? []) {
          expect(document.getElementById(id), `#${id}, from aria-describedby`).not.to.equal(null);
        }
      }
    });

  // gui-list and gui-multi-list render no label or hint: their host does, and they carry the hint
  // as aria-description.
  for (const testCase of elements.filter((item) => item.form && !item.hostRendersChildren)) {
    const { tag } = testCase;
    const picker = tag.endsWith('-picker');

    for (const [name, label] of [
      ['with a label', testCase.props['label']],
      ['without a label', undefined],
    ] as const) {
      it(`${tag} renders its hint once, ${name}`, () => {
        cy.mount(element(testCase, { uid, hint, label }));

        expectOneHint(tag);
        if (label) {
          checkA11y(
            { include: [tag], exclude: testCase.exclude?.map((selector) => `${tag} ${selector}`) },
            testCase.rules,
          );
        }
        if (picker) {
          cy.get(`${tag} button[aria-haspopup]`).first().click();
          cy.get(`${tag} button[aria-haspopup]`)
            .first()
            .should('have.attr', 'aria-expanded', 'true');
          expectOneHint(tag);
        }
      });
    }
  }
});
