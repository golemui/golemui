import { html } from 'lit';
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
