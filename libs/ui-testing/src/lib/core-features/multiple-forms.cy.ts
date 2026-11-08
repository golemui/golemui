import { defineForm } from '@golemui/core';
import { assertIdsScopedPerForm, type MountComponentFn, type MountOptions } from '../utils';

// One of each kind of widget that renders ids or points at them: a label, a hint, errors, radio
// buttons, a popup list, a calendar popup, tabs, accordion sections and repeater rows.
const formDef = defineForm({
  form: [
    {
      uid: 'name',
      kind: 'input',
      type: 'textinput',
      path: 'name',
      label: 'Name',
      props: { hint: 'Your full name' },
      validator: { type: 'string', required: true },
    },
    {
      uid: 'color',
      kind: 'input',
      type: 'radiogroup',
      path: 'color',
      label: 'Color',
      props: {
        options: [
          { label: 'Red', value: 'red' },
          { label: 'Green', value: 'green' },
        ],
      },
    },
    { uid: 'agree', kind: 'input', type: 'checkbox', path: 'agree', label: 'I agree' },
    {
      uid: 'fruit',
      kind: 'input',
      type: 'dropdown',
      path: 'fruit',
      label: 'Fruit',
      props: { items: ['Apple', 'Banana'], inputDebounce: 0 },
    },
    { uid: 'birthday', kind: 'input', type: 'datePicker', path: 'birthday', label: 'Birthday' },
    {
      uid: 'settings',
      kind: 'layout',
      type: 'tabs',
      props: {
        tabs: [
          { uid: 'general', label: 'General' },
          { uid: 'advanced', label: 'Advanced' },
        ],
      },
      children: [
        { uid: 'general', kind: 'input', type: 'textinput', path: 'general', label: 'General' },
        { uid: 'advanced', kind: 'input', type: 'textinput', path: 'advanced', label: 'Advanced' },
      ],
    },
    {
      uid: 'faq',
      kind: 'layout',
      type: 'accordion',
      props: {
        defaultOpen: { shipping: true },
        sections: [
          { uid: 'shipping', label: 'Shipping' },
          { uid: 'returns', label: 'Returns' },
        ],
      },
      children: [
        { uid: 'shipping', kind: 'input', type: 'textinput', path: 'shipping', label: 'Shipping' },
        { uid: 'returns', kind: 'input', type: 'textinput', path: 'returns', label: 'Returns' },
      ],
    },
    {
      uid: 'people',
      kind: 'input',
      type: 'repeater',
      path: 'people',
      label: 'People',
      props: {
        template: {
          kind: 'layout',
          type: 'grid',
          children: [
            {
              uid: 'person',
              kind: 'input',
              type: 'textinput',
              path: 'people.items.name',
              label: 'Person',
            },
          ],
        },
      },
    },
    { uid: 'submit', kind: 'action', type: 'button', label: 'Submit', actionType: 'submit' },
  ],
});

const data = {
  name: 'Ada',
  color: 'red',
  agree: false,
  fruit: 'Apple',
  birthday: '2026-06-15',
  people: [{ name: 'Grace' }, { name: 'Linus' }],
};

const firstForm = () => cy.get('form').eq(0);
const secondForm = () => cy.get('form').eq(1);

/** The element focus is on is inside the form. */
const expectFocusInside = (form: () => Cypress.Chainable<JQuery<HTMLElement>>) =>
  form().should(([formElement]) => {
    expect(formElement.contains(document.activeElement), 'focus is inside the form').to.equal(true);
  });

/** The data the form submits. */
const submitted = (alias: `@${string}`) =>
  cy.get<sinon.SinonStub>(alias).should('have.been.calledOnce').its('firstCall.args.0.data');

/**
 * Registers the tests for two forms on one page that render the same definition. Every DOM id
 * takes the form's `formName`, so the forms share no id and the labels, hints, errors and popups
 * of each one point at its own fields.
 *
 * @param mountFn - Mounts a form with the options and the framework of the calling package.
 */
export const runMultipleFormsComponentTests = (mountFn: MountComponentFn) => {
  describe('Multiple forms on one page', () => {
    const mountTwo = (options: Partial<MountOptions> = {}) => {
      const firstSubmit = cy.stub().as('firstSubmit');
      const secondSubmit = cy.stub().as('secondSubmit');
      mountFn({
        formDef,
        data,
        formName: 'first',
        formSubmit: firstSubmit,
        extraForms: [{ formName: 'second', formSubmit: secondSubmit }],
        ...options,
      });
      cy.get('form').should('have.length', 2);
      cy.get('[data-cy="person[1]_textinput"]').should('have.length', 2);
    };

    it('renders no id twice and keeps every id reference inside its form', () => {
      mountTwo();

      cy.get('form').eq(0).should('have.attr', 'id', 'first');
      cy.get('form').eq(1).should('have.attr', 'id', 'second');
      secondForm().find('[data-cy="name_textinput"]').should('have.attr', 'id', 'second-name');
      secondForm().find('[data-cy="name_label"]').should('have.attr', 'for', 'second-name');
      assertIdsScopedPerForm();
    });

    it('scopes the ids of forms without a formName too', () => {
      mountTwo({ formName: undefined, extraForms: [{ formSubmit: cy.stub() }] });

      cy.get('form').then((forms) => {
        expect(forms[0].id, 'generated form names').not.to.equal(forms[1].id);
      });
      assertIdsScopedPerForm();
    });

    it('keeps the ids scoped with the popups of the second form open', () => {
      mountTwo();

      secondForm().find('[data-cy="fruit_textinput"]').click();
      secondForm().find('gui-list:not([hidden])').should('exist');
      firstForm().find('gui-list:not([hidden])').should('not.exist');
      assertIdsScopedPerForm();
      secondForm().find('[data-cy="fruit_textinput"]').type('{esc}');

      secondForm().find('.gui-date-picker__arrow').click();
      secondForm().find('gui-calendar').should('exist');
      firstForm().find('gui-calendar').should('not.exist');
      assertIdsScopedPerForm();
    });

    it('focuses the field of the second form from its label', () => {
      mountTwo();

      secondForm().find('[data-cy="name_label"]').click();
      expectFocusInside(secondForm);
      cy.focused().should('have.attr', 'id', 'second-name');

      secondForm().find('[data-cy="agree_label"]').click();
      secondForm().find('[data-cy="agree_checkbox"]').should('be.checked');
      firstForm().find('[data-cy="agree_checkbox"]').should('not.be.checked');
    });

    it('changes only the data of the second form from its radios and popups', () => {
      mountTwo();

      secondForm().find('[data-cy="color_radiogroup_1"]').click();
      firstForm().find('[data-cy="color_radiogroup_0"]').should('be.checked');

      secondForm().find('[data-cy="fruit_textinput"]').click();
      secondForm()
        .find('gui-list:not([hidden]) .gui-list__item-wrapper')
        .contains('Banana')
        .click();
      secondForm().find('[data-cy="fruit_textinput"]').should('have.value', 'Banana');
      firstForm().find('[data-cy="fruit_textinput"]').should('have.value', 'Apple');

      secondForm().find('.gui-date-picker__arrow').click();
      secondForm().find('gui-calendar button[data-date="2026-06-20"]').click();
      secondForm().find('gui-calendar').should('not.exist');
      firstForm().find('gui-calendar').should('not.exist');

      secondForm().find('[data-cy="submit_button"]').click();
      submitted('@secondSubmit').should('deep.include', {
        color: 'green',
        fruit: 'Banana',
        birthday: '2026-06-20',
      });

      firstForm().find('[data-cy="submit_button"]').click();
      submitted('@firstSubmit').should('deep.include', {
        color: 'red',
        fruit: 'Apple',
        birthday: '2026-06-15',
      });
    });

    it('announces the errors of the second form from the second form', () => {
      mountTwo({ data: { ...data, name: '' } });

      secondForm().find('[data-cy="submit_button"]').click();
      secondForm().find('[data-cy="name_validator-errors"]').should('exist');
      firstForm().find('[data-cy="name_validator-errors"]').should('not.exist');

      secondForm()
        .find('[data-cy="name_textinput"]')
        .should('have.attr', 'aria-errormessage', 'second-name_errors')
        .and('have.attr', 'aria-describedby', 'second-name_hint');
      secondForm().find('[id="second-name_errors"]').should('not.be.empty');
      secondForm().find('[id="second-name_hint"]').should('have.text', 'Your full name');
      assertIdsScopedPerForm();
    });
  });
};
