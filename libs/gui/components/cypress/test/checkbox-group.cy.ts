import { html } from 'lit';
import type { GuiCheckboxGroup } from '../../src/lib/components/checkbox-group';
import { configureMessages } from '../../src/lib/utils/messages';
import { checkA11y } from '../support/a11y';

const toppings = [
  { label: 'Cheese', value: 'cheese' },
  { label: 'Ham', value: 'ham' },
  { label: 'Olives', value: 'olives' },
];

const element = () => cy.get<GuiCheckboxGroup>('gui-checkbox-group');
const box = (index: number) =>
  cy.get<HTMLInputElement>(`gui-checkbox-group [data-cy$="_checkbox_${index}"]`);
const group = () => cy.get('gui-checkbox-group [role="group"]');
const valuesOf = (expected: unknown) =>
  element().should(([host]) => expect(host.values).to.deep.equal(expected));

const pizza = () =>
  html`<gui-checkbox-group
    uid="toppings"
    label="Toppings"
    .options=${toppings}
  ></gui-checkbox-group>`;

describe('gui-checkbox-group', () => {
  afterEach(() => configureMessages(null));

  describe('rendering', () => {
    it('renders native checkboxes in a group named by its label', () => {
      cy.mount(pizza());

      group().should('have.attr', 'aria-labelledby', 'toppings_label');
      cy.get('#toppings_label').should('contain.text', 'Toppings');
      cy.get('gui-checkbox-group input[type="checkbox"]').should('have.length', 3);
      box(1).should(([input]) => expect(input.labels?.[0]?.textContent).to.contain('Ham'));
      valuesOf(undefined);
    });

    it('checks the options its values hold', () => {
      cy.mount(
        html`<gui-checkbox-group
          label="Toppings"
          .options=${toppings}
          .values=${['olives', 'cheese']}
        ></gui-checkbox-group>`,
      );

      box(0).should('be.checked');
      box(1).should('not.be.checked');
      box(2).should('be.checked');
    });

    it('lays its options out in a row with direction="row"', () => {
      cy.mount(
        html`<gui-checkbox-group
          label="Toppings"
          direction="row"
          .options=${toppings}
        ></gui-checkbox-group>`,
      );

      group().should('have.class', 'gui-widget--horizontal');
      box(0).then(([first]) =>
        box(1).should(([second]) =>
          expect(second.getBoundingClientRect().top).to.equal(first.getBoundingClientRect().top),
        ),
      );
    });
  });

  describe('looking like gui-checkbox', () => {
    /** Where a checkbox sits against its text and its label, in the label's reading direction. */
    const layoutOf = (input: HTMLInputElement) => {
      const label = input.closest('label')!;
      const text = [...label.querySelectorAll('*'), label]
        .flatMap((node) => [...node.childNodes])
        .find((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())!;
      const range = document.createRange();
      range.selectNodeContents(text);
      const [box, words, row] = [input, range, label].map((part) => part.getBoundingClientRect());
      const rtl = getComputedStyle(label).direction === 'rtl';
      // To a hundredth of a pixel: Firefox lays right to left out with a little float noise.
      const round = (value: number) => Math.round(value * 100) / 100;
      return {
        gap: round(rtl ? box.left - words.right : words.left - box.right),
        inset: round(rtl ? row.right - box.right : box.left - row.left),
        drop: round(words.top - box.top),
      };
    };

    const both = () =>
      html`<gui-checkbox label="Cheese"></gui-checkbox>
        <gui-checkbox-group label="Toppings" .options=${toppings}></gui-checkbox-group>`;

    for (const dir of ['ltr', 'rtl']) {
      it(`spaces its boxes and their text as gui-checkbox does, in ${dir}`, () => {
        cy.mount(html`<div dir=${dir}>${both()}</div>`);

        cy.get('gui-checkbox input').then(([single]) =>
          box(0).should(([grouped]) => {
            const expected = layoutOf(single as HTMLInputElement);
            expect(layoutOf(grouped), 'the group').to.deep.equal(expected);
            expect(expected.gap, 'the gap').to.equal(8);
          }),
        );
      });
    }

    it('takes the --gui-checkbox-* tokens, as gui-checkbox does', () => {
      cy.mount(
        html`<div
          style="--gui-checkbox-size: 24px; --gui-checkbox-tick: rgb(200, 0, 0); --gui-checkbox-gap: 12px"
        >
          ${both()}
        </div>`,
      );

      cy.get('gui-checkbox input, gui-checkbox-group input').should((inputs) => {
        expect(inputs).to.have.length(4);
        for (const input of inputs) {
          expect(input.getBoundingClientRect().width).to.equal(24);
          expect(getComputedStyle(input, '::before').backgroundColor).to.equal('rgb(200, 0, 0)');
          expect(Math.round(layoutOf(input as HTMLInputElement).gap)).to.equal(12);
        }
      });
    });
  });

  describe('value', () => {
    it("keeps its values in the options' order, whatever order they are checked in", () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(html`<div @gui-input=${onInput} @gui-change=${onChange}>${pizza()}</div>`);

      box(2).check();
      valuesOf(['olives']);
      box(0).check();
      valuesOf(['cheese', 'olives']);
      cy.get('@change')
        .its('lastCall.args.0.detail.value')
        .should('deep.equal', ['cheese', 'olives']);
      cy.get('@input').should('have.been.calledTwice');
      cy.get('@change').should('have.been.calledTwice');
    });

    it('holds an empty list once every option is unchecked', () => {
      cy.mount(pizza());

      box(1).check();
      box(1).uncheck();
      valuesOf([]);
    });

    it('keeps a value that matches no option, after the options', () => {
      cy.mount(
        html`<gui-checkbox-group
          label="Toppings"
          .options=${toppings}
          .values=${['anchovies', 'ham']}
        ></gui-checkbox-group>`,
      );

      box(2).check();
      valuesOf(['ham', 'olives', 'anchovies']);
    });

    it('takes numbers as values', () => {
      cy.mount(
        html`<gui-checkbox-group
          label="Sizes"
          .options=${[
            { label: 'Small', value: 1 },
            { label: 'Large', value: 2 },
          ]}
        ></gui-checkbox-group>`,
      );

      box(1).check();
      valuesOf([2]);
    });

    it('fires gui-blur when focus leaves the group, not when it moves inside it', () => {
      const onBlur = cy.spy().as('blur');
      cy.mount(html`<div @gui-blur=${onBlur}>${pizza()}<button>After</button></div>`);

      box(0).focus();
      box(1).focus();
      cy.get('@blur').should('not.have.been.called');
      cy.get('button').focus();
      cy.get('@blur').should('have.been.calledOnce');
    });
  });

  describe('states', () => {
    it('stays as it is when read-only, and says so on each checkbox', () => {
      cy.mount(
        html`<gui-checkbox-group
          label="Toppings"
          readonly
          .options=${toppings}
          .values=${['ham']}
        ></gui-checkbox-group>`,
      );

      box(0).should('have.attr', 'aria-readonly', 'true').click();
      box(0).should('not.be.checked');
      box(1).click();
      box(1).should('be.checked');
      valuesOf(['ham']);
    });

    it('disables every checkbox', () => {
      cy.mount(
        html`<gui-checkbox-group
          label="Toppings"
          disabled
          .options=${toppings}
        ></gui-checkbox-group>`,
      );

      cy.get('gui-checkbox-group input').should('have.length', 3).and('be.disabled');
    });

    it('says it is required in its name, not on each checkbox', () => {
      cy.mount(
        html`<gui-checkbox-group
          uid="toppings"
          label="Toppings"
          required
          .options=${toppings}
        ></gui-checkbox-group>`,
      );

      group().should('have.attr', 'aria-labelledby', 'toppings_label toppings_required');
      cy.get('#toppings_required').should('have.text', 'required');
      box(0).should('not.have.attr', 'aria-required');
    });

    it('translates the required name', () => {
      configureMessages((key, defaultText) =>
        key === 'requiredGroup' ? 'obligatorio' : defaultText,
      );
      cy.mount(
        html`<gui-checkbox-group
          uid="toppings"
          label="Ingredientes"
          required
          .options=${toppings}
        ></gui-checkbox-group>`,
      );

      cy.get('#toppings_required').should('have.text', 'obligatorio');
    });
  });

  describe('form', () => {
    it('submits each checked value under its name, and blocks an empty required group', () => {
      cy.mount(
        html`<form>
          <gui-checkbox-group
            name="toppings"
            label="Toppings"
            required
            .options=${toppings}
          ></gui-checkbox-group>
        </form>`,
      );

      element().should(([host]) => expect(host.validity?.valueMissing).to.equal(true));
      box(2).check();
      box(0).check();
      cy.get('form').should(([form]) => {
        expect(new FormData(form as HTMLFormElement).getAll('toppings')).to.deep.equal([
          'cheese',
          'olives',
        ]);
        expect((form as HTMLFormElement).checkValidity()).to.equal(true);
      });
    });

    it('keeps its checkboxes out of the form: only the element submits', () => {
      cy.mount(
        html`<form>
          <gui-checkbox-group label="Toppings" .options=${toppings}></gui-checkbox-group>
        </form>`,
      );

      box(0).check();
      cy.get('form').should(([form]) => {
        expect([...new FormData(form as HTMLFormElement).keys()]).to.deep.equal([]);
      });
    });
  });

  it('has no accessibility violations', () => {
    cy.mount(
      html`<div>
        <gui-checkbox-group
          label="Toppings"
          hint="Pick any"
          required
          .options=${toppings}
          .values=${['ham']}
        ></gui-checkbox-group>
      </div>`,
    );

    checkA11y('div');
  });
});
