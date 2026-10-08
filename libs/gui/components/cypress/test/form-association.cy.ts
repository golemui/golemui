import { nothing } from 'lit';
import { ref } from 'lit/directives/ref.js';
import { html, unsafeStatic } from 'lit/static-html.js';
import type { GuiFormControl } from '../../src/lib/gui-form-control';

const form = () => cy.get<HTMLFormElement>('form');
const control = (tag: string) => cy.get<GuiFormControl & HTMLElement>(tag);

describe('native form association', () => {
  it('submits the value under its name', () => {
    cy.mount(html`<form><gui-textinput name="email" label="Email"></gui-textinput></form>`);

    cy.get('gui-textinput input').type('ada@example.com');

    form().then(([element]) => {
      expect(new FormData(element).get('email')).to.equal('ada@example.com');
    });
  });

  it('submits nothing and never blocks submission without a name', () => {
    cy.mount(html`<form><gui-textinput label="Email" required></gui-textinput></form>`);

    form().then(([element]) => {
      expect([...new FormData(element).keys()]).to.deep.equal([]);
    });
    control('gui-textinput').then(([element]) => {
      expect(element.checkValidity()).to.equal(true);
    });
  });

  it('blocks submission while a required value is missing', () => {
    cy.mount(
      html`<form><gui-textinput name="email" label="Email" required></gui-textinput></form>`,
    );

    control('gui-textinput').then(([element]) => {
      expect(element.validity?.valueMissing).to.equal(true);
      expect(element.validationMessage).to.equal('Please fill out this field.');
    });
    form().then(([element]) => expect(element.checkValidity()).to.equal(false));

    cy.get('gui-textinput input').type('ada@example.com');

    form().then(([element]) => expect(element.checkValidity()).to.equal(true));
  });

  it('reports a number outside its bounds', () => {
    cy.mount(
      html`<form><gui-number name="age" label="Age" minimum="18" maximum="99"></gui-number></form>`,
    );

    cy.get('gui-number input').type('12');
    control('gui-number').then(([element]) => {
      expect(element.validity?.rangeUnderflow).to.equal(true);
      expect(element.validationMessage).to.equal('Value must be greater than or equal to 18.');
    });

    cy.get('gui-number input').clear().type('120');
    control('gui-number').then(([element]) => {
      expect(element.validity?.rangeOverflow).to.equal(true);
    });

    cy.get('gui-number input').clear().type('30');
    control('gui-number').then(([element]) => expect(element.checkValidity()).to.equal(true));
    form().then(([element]) => expect(new FormData(element).get('age')).to.equal('30'));
  });

  it('submits a checked checkbox as "on" and a required unchecked one as missing', () => {
    cy.mount(
      html`<form><gui-checkbox name="terms" label="I agree" required></gui-checkbox></form>`,
    );

    control('gui-checkbox').then(([element]) => {
      expect(element.validity?.valueMissing).to.equal(true);
    });

    cy.get('gui-checkbox input').check();

    form().then(([element]) => expect(new FormData(element).get('terms')).to.equal('on'));
  });

  it('submits one entry per item of a list value', () => {
    cy.mount(html`<form><gui-tags name="tags" label="Tags"></gui-tags></form>`);

    cy.get('gui-tags input').type('lit{enter}css{enter}');

    form().then(([element]) => {
      expect(new FormData(element).getAll('tags')).to.deep.equal(['lit', 'css']);
    });
  });

  it('restores the initial value on reset', () => {
    cy.mount(
      html`<form><gui-textinput name="name" label="Name" value="Ada"></gui-textinput></form>`,
    );

    cy.get('gui-textinput input').clear().type('Grace');
    form().then(([element]) => element.reset());

    cy.get('gui-textinput input').should('have.value', 'Ada');
    form().then(([element]) => expect(new FormData(element).get('name')).to.equal('Ada'));
  });

  // The inner controls are in the light DOM, so a native reset empties them too: the element must
  // write its value back, also when the value did not change.
  it('shows its initial value again after a reset without edits', () => {
    const options = [
      { label: 'Starter', value: 'starter' },
      { label: 'Team', value: 'team' },
    ];
    cy.mount(
      html`<form>
        <gui-textinput name="name" label="Name" value="Ada"></gui-textinput>
        <gui-password name="secret" label="Password" value="hunter2"></gui-password>
        <gui-textarea name="bio" label="Bio" value="Hello"></gui-textarea>
        <gui-markdown name="notes" label="Notes" value="# Hi"></gui-markdown>
        <gui-checkbox name="terms" label="Terms" .value=${true}></gui-checkbox>
        <gui-toggle name="news" label="News" .value=${true}></gui-toggle>
        <gui-select name="plan" label="Plan" .options=${options} value="team"></gui-select>
        <gui-number name="age" label="Age" value="42"></gui-number>
        <gui-currency name="price" label="Price" value="12.5"></gui-currency>
      </form>`,
    );
    cy.get('gui-select select').should('have.value', 'team');

    form().then(([element]) => element.reset());

    cy.get('gui-textinput input').should('have.value', 'Ada');
    cy.get('gui-password input').should('have.value', 'hunter2');
    cy.get('gui-textarea textarea').should('have.value', 'Hello');
    cy.get('gui-markdown textarea').should('have.value', '# Hi');
    cy.get('gui-checkbox input').should('be.checked');
    cy.get('gui-toggle input').should('be.checked');
    cy.get('gui-select select').should('have.value', 'team');
    cy.get('gui-number input').should('have.value', '42');
    cy.get('gui-currency input').should('have.value', '12.5');
    form().then(([element]) => {
      const data = new FormData(element);
      expect(Object.fromEntries(data)).to.deep.equal({
        name: 'Ada',
        secret: 'hunter2',
        bio: 'Hello',
        notes: '# Hi',
        terms: 'on',
        news: 'on',
        plan: 'team',
        age: '42',
        price: '12.5',
      });
    });
  });

  it('is disabled by a disabled fieldset, and enabled again with it', () => {
    cy.mount(
      html`<form>
        <fieldset disabled>
          <gui-textinput name="name" label="Name"></gui-textinput>
        </fieldset>
      </form>`,
    );

    cy.get('gui-textinput input').should('be.disabled');
    control('gui-textinput').should('have.prop', 'disabled', true);

    cy.get('fieldset').invoke('prop', 'disabled', false);

    cy.get('gui-textinput input').should('not.be.disabled');
  });

  it('reports a typed date outside its bounds', () => {
    cy.mount(
      html`<form>
        <gui-date name="start" label="Start" min-date="2026-01-01" locale-id="en-US"></gui-date>
      </form>`,
    );

    cy.get('gui-date [data-type="month"]').type('12');
    cy.get('gui-date [data-type="day"]').type('31');
    cy.get('gui-date [data-type="year"]').type('2025');

    control('gui-date').then(([element]) => {
      expect(element.validity?.rangeUnderflow).to.equal(true);
    });
    form().then(([element]) => expect(new FormData(element).get('start')).to.equal('2025-12-31'));
  });
});

describe('standalone use', () => {
  it('generates the ids that tie the label to its control', () => {
    cy.mount(html`<gui-textinput label="Email"></gui-textinput>`);

    cy.get('gui-textinput input')
      .invoke('attr', 'id')
      .should('match', /^gui-textinput-\d+$/)
      .then((id) => cy.get(`label[for="${id}"]`).should('contain.text', 'Email'));
  });

  it('shows errors as soon as they are set', () => {
    cy.mount(html`<gui-textinput label="Email" .errors=${['Enter an email']}></gui-textinput>`);

    cy.get('gui-textinput [role="alert"]').should('contain.text', 'Enter an email');
    cy.get('gui-textinput input').should('have.attr', 'aria-invalid', 'true');
  });

  it('fires gui-input while typing and gui-change on commit', () => {
    const onInput = cy.spy().as('input');
    const onChange = cy.spy().as('change');
    cy.mount(
      html`<gui-textinput
        label="Name"
        @gui-input=${onInput}
        @gui-change=${onChange}
      ></gui-textinput>`,
    );

    cy.get('gui-textinput input').type('Ada').blur();

    cy.get('@input').should('have.callCount', 3);
    cy.get('@change').should('have.been.calledOnce');
    cy.get('@change').its('firstCall.args.0.detail').should('deep.equal', { value: 'Ada' });
    cy.get('gui-textinput').should('have.prop', 'value', 'Ada');
  });
});

// The parts of a date or time field hold more than its value: a partly typed entry has no value
// yet, and the element must report it as bad input at once, not after focus leaves.
describe('native form association of segmented fields', () => {
  const cases = [
    { tag: 'gui-date', first: 'month', cleared: 'day', value: '2026-03-15' },
    { tag: 'gui-time', first: 'hour', cleared: 'minute', value: '10:30:00' },
    { tag: 'gui-date-time', first: 'month', cleared: 'day', value: '2026-03-15T10:30:00' },
  ] as const;

  for (const { tag, first, cleared, value } of cases) {
    describe(tag, () => {
      const part = (type: string) => cy.get(`${tag} [data-type="${type}"]`);
      const field = (initial?: string) =>
        html`<form>
            <${unsafeStatic(tag)}
              name="when"
              label="When"
              locale-id="en-US"
              value=${initial ?? nothing}
            ></${unsafeStatic(tag)}>
          </form>
          <button id="outside">Outside</button>`;
      const expectValid = (valid: boolean) =>
        form().should(([element]) => expect(element.checkValidity()).to.equal(valid));

      it('blocks submission while an entry is partly typed', () => {
        cy.mount(field());

        part(first).type('12');
        expectValid(false);
        control(tag).should(([el]) => expect(el.validity?.badInput).to.equal(true));

        cy.get('#outside').focus();
        expectValid(false);
      });

      it('is valid again once the partly typed entry is deleted', () => {
        cy.mount(field());

        part(first).type('12');
        cy.get('#outside').focus();
        expectValid(false);

        part(first).clear();
        cy.get('#outside').focus();
        expectValid(true);
        form().then(([element]) => expect(new FormData(element).has('when')).to.equal(false));
      });

      it('restores its value and its validity on reset', () => {
        cy.mount(field(value));

        part(cleared).clear();
        cy.get('#outside').focus();
        expectValid(false);

        form().then(([element]) => element.reset());

        part(cleared).invoke('val').should('not.equal', '');
        expectValid(true);
        form().then(([element]) => expect(new FormData(element).get('when')).to.equal(value));
      });
    });
  }
});

// A picker or a range field keeps its previous value while the user types an entry it cannot use,
// so it must report that entry as bad input, like gui-date does.
describe('native form association of pickers and range fields', () => {
  // The time pickers' fields only take typing with allow-custom-time.
  const mount = (tag: string, value?: string) =>
    cy.mount(
      html`<form>
          <${unsafeStatic(tag)}
            name="when"
            label="When"
            locale-id="en-US"
            value=${value ?? nothing}
            ?allow-custom-time=${tag.endsWith('time-picker') && !tag.includes('date')}
          ></${unsafeStatic(tag)}>
        </form>
        <button id="outside">Outside</button>`,
    );
  const part = (tag: string, type: string) => cy.get(`${tag} [data-type="${type}"]`).first();
  const expectValid = (valid: boolean) =>
    form().should(([element]) => expect(element.checkValidity()).to.equal(valid));

  const partlyTyped = [
    { tag: 'gui-date-picker', first: 'month' },
    { tag: 'gui-time-picker', first: 'hour' },
    { tag: 'gui-date-time-picker', first: 'month' },
    { tag: 'gui-range-date', first: 'month' },
    { tag: 'gui-range-time', first: 'hour' },
    { tag: 'gui-range-date-time', first: 'month' },
    { tag: 'gui-range-date-picker', first: 'month' },
    { tag: 'gui-range-time-picker', first: 'hour' },
    { tag: 'gui-range-date-time-picker', first: 'month' },
  ];

  for (const { tag, first } of partlyTyped) {
    it(`${tag} blocks submission while an entry is partly typed, and not once it is deleted`, () => {
      mount(tag);

      part(tag, first).type('12');
      expectValid(false);
      control(tag).should(([el]) => expect(el.validity?.badInput).to.equal(true));
      cy.get('#outside').focus();
      expectValid(false);

      part(tag, first).clear();
      cy.get('#outside').focus();
      expectValid(true);
    });
  }

  const impossible = [
    { tag: 'gui-date-picker', value: '2024-02-10' },
    { tag: 'gui-date-time-picker', value: '2024-02-10T10:00:00' },
  ];

  for (const { tag, value } of impossible) {
    it(`${tag} blocks submission when the typed date is impossible`, () => {
      mount(tag, value);

      part(tag, 'day').clear().type('31');
      cy.get('#outside').focus();

      expectValid(false);
      control(tag).should(([el]) => expect(el.validity?.badInput).to.equal(true));
    });
  }

  it('gui-range-date-picker blocks submission when a typed endpoint is impossible', () => {
    mount('gui-range-date-picker');

    part('gui-range-date-picker', 'month').type('02');
    cy.focused().type('31');
    cy.focused().type('2024');

    expectValid(false);
    control('gui-range-date-picker').should(([el]) => expect(el.validity?.badInput).to.equal(true));
  });
});

// `required` and the bounds block a native submit: a value outside them, set from code or kept by
// the element with an error, makes the element invalid.
describe('native form validity of date and time bounds', () => {
  const cases = [
    {
      tag: 'gui-calendar',
      bounds: { minDate: '2024-01-01' },
      outside: '2020-01-01',
      inside: '2024-06-01',
      flag: 'rangeUnderflow',
    },
    {
      tag: 'gui-date-picker',
      bounds: { maxDate: '2024-12-31' },
      outside: '2025-01-01',
      inside: '2024-06-01',
      flag: 'rangeOverflow',
    },
    {
      tag: 'gui-time-picker',
      bounds: { minTime: '09:00:00' },
      outside: '08:00:00',
      inside: '10:00:00',
      flag: 'rangeUnderflow',
    },
    {
      tag: 'gui-date-time-picker',
      bounds: { minTime: '09:00:00', maxTime: '17:00:00' },
      outside: '2024-03-15T18:00:00',
      inside: '2024-03-15T10:00:00',
      flag: 'customError',
    },
    {
      tag: 'gui-date-time-calendar',
      bounds: { minTime: '09:00:00', maxTime: '17:00:00' },
      outside: '2024-03-15T18:00:00',
      inside: '2024-03-15T10:00:00',
      flag: 'customError',
    },
  ] as const;

  for (const { tag, bounds, outside, inside, flag } of cases) {
    it(`${tag} blocks a value outside its bounds`, () => {
      cy.mount(
        html`<form>
          <${unsafeStatic(tag)}
            ${ref((node) => node && Object.assign(node, { name: 'when', ...bounds, value: outside }))}
          ></${unsafeStatic(tag)}>
        </form>`,
      );

      form().should(([element]) => expect(element.checkValidity()).to.equal(false));
      control(tag).should(([el]) => expect(el.validity?.[flag]).to.equal(true));

      control(tag).then(([el]) => {
        (el as unknown as { value: string }).value = inside;
      });
      form().should(([element]) => expect(element.checkValidity()).to.equal(true));
    });
  }

  it('gui-date-time-picker blocks a typed time outside min-time and max-time', () => {
    cy.mount(
      html`<form>
          <gui-date-time-picker
            name="at"
            locale-id="en-GB"
            min-time="09:00:00"
            max-time="17:00:00"
          ></gui-date-time-picker>
        </form>
        <button id="outside">Outside</button>`,
    );

    cy.get('gui-date-time-picker [data-type="day"]').type('15');
    cy.focused().type('03');
    cy.focused().type('2024');
    cy.focused().should('have.attr', 'data-type', 'hour').type('18');
    cy.focused().type('00');
    cy.get('#outside').focus();

    form().should(([element]) => expect(element.checkValidity()).to.equal(false));
    form().then(([element]) =>
      expect(new FormData(element).get('at')).to.equal('2024-03-15T18:00:00'),
    );
  });
});
