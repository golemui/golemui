import { html } from 'lit';
import type { GuiTags } from '../../src/lib/components/tags';

const input = () => cy.get('gui-tags input');
const group = () => cy.get('gui-tags [role="group"]');
const pills = () => cy.get('gui-tags .gui-pills__strip .gui-pills__pill');
const element = () => cy.get<GuiTags>('gui-tags');

describe('gui-tags', () => {
  // Wide enough for the strip of pills rather than the compact count bubble.
  beforeEach(() => cy.viewport(1000, 600));

  describe('rendering', () => {
    it('renders its value as pills and names its group after the label', () => {
      cy.mount(
        html`<gui-tags label="Tags" value='["lit", "css"]' placeholder="Add a tag"></gui-tags>`,
      );

      pills().should('have.length', 2);
      pills().first().should('have.attr', 'aria-label', 'lit');
      pills().last().should('have.attr', 'aria-label', 'css');
      input().should('have.attr', 'placeholder', 'Add a tag');
      group().should('have.attr', 'aria-label', 'Tags');
      cy.get('gui-tags .gui-label').should('contain.text', 'Tags');
    });

    it('describes its group with the hint and points it at its errors', () => {
      cy.mount(html`<gui-tags label="Tags" hint="Press Enter" .errors=${['Too few']}></gui-tags>`);

      group()
        .invoke('attr', 'aria-describedby')
        .then((id) => cy.get(`#${id}`).should('have.text', 'Press Enter'));
      group().should('have.attr', 'aria-invalid', 'true');
      group()
        .invoke('attr', 'aria-errormessage')
        .then((id) => cy.get(`#${id}`).should('contain.text', 'Too few'));
    });

    it('renders its hint without a label, for the aria-describedby of its group', () => {
      cy.mount(html`<gui-tags hint="Press Enter"></gui-tags>`);

      group()
        .invoke('attr', 'aria-describedby')
        .then((id) => cy.get(`#${id}`).should('have.text', 'Press Enter'));
    });

    it('describes the remove action of each pill with remove-aria-label', () => {
      cy.mount(html`<gui-tags label="Tags" value='["lit"]' remove-aria-label="Quitar"></gui-tags>`);

      pills().first().should('have.attr', 'aria-description', 'Quitar');
    });

    it('renders its icon hidden from assistive technology', () => {
      cy.mount(html`<gui-tags label="Tags" icon="icon-tag"></gui-tags>`);

      cy.get('gui-tags .icon-tag').should('have.attr', 'aria-hidden', 'true');
    });
  });

  describe('value', () => {
    it('adds the trimmed draft as a tag on Enter, firing gui-input and gui-change', () => {
      const onInput = cy.spy().as('input');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-tags label="Tags" @gui-input=${onInput} @gui-change=${onChange}></gui-tags>`,
      );

      input().type('  lit {enter}');

      input().should('have.value', '');
      pills().should('have.length', 1);
      cy.get('@input').should('have.been.calledOnce');
      cy.get('@input')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { value: ['lit'] });
      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { value: ['lit'] });
      element().should(([el]) => expect(el.value).to.deep.equal(['lit']));
    });

    it('adds a tag on comma, Tab and blur, and fires gui-blur', () => {
      const onChange = cy.spy().as('change');
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-tags label="Tags" @gui-change=${onChange} @gui-blur=${onBlur}></gui-tags>`,
      );

      input().type('lit,');
      input().type('css').trigger('keydown', { key: 'Tab' });
      input().type('vue').blur();

      cy.get('@change')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { value: ['lit', 'css', 'vue'] });
      cy.get('@change').should('have.callCount', 3);
      cy.get('@blur').should('have.been.calledOnce');
    });

    it('adds nothing for a blank draft', () => {
      const onChange = cy.spy().as('change');
      cy.mount(html`<gui-tags label="Tags" @gui-change=${onChange}></gui-tags>`);

      input().type('   {enter}');

      cy.get('@change').should('not.have.been.called');
      pills().should('not.exist');
    });

    it('splits on its own separators only', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-tags label="Tags" separators='["Enter"]' @gui-change=${onChange}></gui-tags>`,
      );

      input().type('a,b{enter}');

      cy.get('@change').should('have.been.calledOnce');
      cy.get('@change')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { value: ['a,b'] });
    });

    it('adds a tag as a custom separator is typed', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-tags label="Tags" separators='[";", " "]' @gui-change=${onChange}></gui-tags>`,
      );

      input().type('lit;css vue,js;');

      input().should('have.value', '');
      cy.get('@change')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { value: ['lit', 'css', 'vue,js'] });
      cy.get('@change').should('have.callCount', 3);
    });

    it('turns allow-duplicates and trim off from their attributes', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-tags
          label="Tags"
          value='["lit"]'
          allow-duplicates="false"
          trim="false"
          @gui-change=${onChange}
        ></gui-tags>`,
      );

      element().should('have.prop', 'allowDuplicates', false).and('have.prop', 'trim', false);
      input().type('lit{enter}');
      cy.get('@change').should('not.have.been.called');
      input().type(' css {enter}');
      cy.get('@change')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { value: ['lit', ' css '] });
    });

    it('skips a repeated tag with allowDuplicates false', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-tags
          label="Tags"
          value='["lit"]'
          .allowDuplicates=${false}
          @gui-change=${onChange}
        ></gui-tags>`,
      );

      input().type('lit{enter}');

      input().should('have.value', '');
      cy.get('@change').should('not.have.been.called');
      pills().should('have.length', 1);
    });

    it('splits pasted text into tags and keeps the rest as the draft', () => {
      const onChange = cy.spy().as('change');
      cy.mount(html`<gui-tags label="Tags" @gui-change=${onChange}></gui-tags>`);

      input().trigger('paste', { clipboardData: { getData: () => 'lit, css,vue' } });

      cy.get('@change')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { value: ['lit', 'css'] });
      input().should('have.value', 'vue');
    });

    it('removes a tag with its remove button', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-tags label="Tags" value='["lit", "css"]' @gui-change=${onChange}></gui-tags>`,
      );

      pills().first().find('.gui-pills__pill-remove').click();

      cy.get('@change')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { value: ['css'] });
      pills().should('have.length', 1);
    });

    it('shows a value set from outside', () => {
      cy.mount(html`<gui-tags label="Tags" value='["lit"]'></gui-tags>`);

      element().invoke('prop', 'value', ['css', 'vue']);

      pills().should('have.length', 2);
      pills().first().should('have.attr', 'aria-label', 'css');
    });
  });

  describe('events', () => {
    it('fires none of the events of its pills', () => {
      const pillEvents = [
        'gui-pill-remove',
        'gui-pill-keydown',
        'gui-pill-exit',
        'gui-dropdown-toggle',
      ];
      const leaked = cy.spy().as('leaked');
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<div style="width: 300px">
          <gui-tags label="Tags" value='["lit", "css"]' @gui-change=${onChange}></gui-tags>
        </div>`,
      );
      cy.get('div').then(([wrapper]) => {
        for (const type of pillEvents) wrapper.addEventListener(type, leaked);
      });

      // Into the collapsed pills (gui-dropdown-toggle), past their end (gui-pill-keydown), out
      // with Escape (gui-pill-exit), and a removal (gui-pill-remove).
      input().focus().type('{downArrow}');
      cy.focused().should('have.attr', 'data-key', '0-lit').type('{downArrow}{downArrow}x');
      cy.focused().type('{esc}');
      cy.focused().should('have.class', 'gui-tags__input');
      cy.get('gui-tags .gui-pills__pill-remove').first().click({ force: true });

      cy.get('@change')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { value: ['css'] });
      cy.get('@leaked').should('not.have.been.called');
    });
  });

  describe('keyboard', () => {
    it('clears the draft on Escape', () => {
      const onChange = cy.spy().as('change');
      cy.mount(html`<gui-tags label="Tags" @gui-change=${onChange}></gui-tags>`);

      input().type('lit{esc}');

      input().should('have.value', '');
      cy.get('@change').should('not.have.been.called');
    });

    it('moves to the last tag on Backspace and removes it with Delete', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-tags label="Tags" value='["lit", "css"]' @gui-change=${onChange}></gui-tags>`,
      );

      input().type('{backspace}');
      cy.focused().should('have.attr', 'aria-label', 'css').type('{del}');

      cy.get('@change')
        .its('firstCall.args.0.detail')
        .should('deep.equal', { value: ['lit'] });
      cy.focused().should('have.attr', 'aria-label', 'lit');
    });
  });

  describe('states', () => {
    it('makes the input read-only and ignores the separators', () => {
      const onChange = cy.spy().as('change');
      cy.mount(
        html`<gui-tags label="Tags" value='["lit"]' readonly @gui-change=${onChange}></gui-tags>`,
      );

      input().should('have.attr', 'readonly');
      input().should('have.attr', 'aria-readonly', 'true');
      input().focus().should('be.focused');
      pills().first().should('be.disabled');
      input().trigger('keydown', { key: 'Enter' });
      cy.get('@change').should('not.have.been.called');
    });

    it('shows its tags without remove buttons when read-only', () => {
      cy.mount(html`<gui-tags label="Tags" value='["lit", "css"]' readonly></gui-tags>`);

      pills().should('have.length', 2);
      cy.get('gui-tags .gui-pills__pill-remove').should('not.exist');
    });

    it('disables the input and the pills', () => {
      cy.mount(html`<gui-tags label="Tags" value='["lit"]' disabled></gui-tags>`);

      input().should('be.disabled');
      pills().first().should('be.disabled');
    });
  });
});
