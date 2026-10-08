import { html } from 'lit';
import type { GuiPillItem } from '../../src/lib/components/pills';

const items: GuiPillItem[] = [
  { key: 'a', label: 'Alpha' },
  { key: 'b', label: 'Beta' },
  { key: 'c', label: 'Gamma' },
];

const pills = () => cy.get('gui-pills .gui-pills__strip .gui-pills__pill');
const pill = (index: number) => pills().eq(index);

/** A host narrow enough to collapse the pills into their count. */
const compact = (content: unknown) =>
  html`<div
    style="container-type: inline-size; container-name: gui-pills-widget; position: relative; width: 300px"
  >
    ${content}
  </div>`;

describe('gui-pills', () => {
  describe('rendering', () => {
    it('renders a pill button per item from its attribute, in a named toolbar', () => {
      cy.mount(
        html`<gui-pills
          items='[{"key":"a","label":"Alpha"},{"key":"b","label":"Beta"}]'
          toolbar-aria-label="Chosen"
        ></gui-pills>`,
      );

      cy.get('gui-pills [role="toolbar"]').should('have.attr', 'aria-label', 'Chosen');
      pills().should('have.length', 2);
      pill(0)
        .should('contain.text', 'Alpha')
        .and('have.attr', 'aria-label', 'Alpha')
        .and('have.attr', 'aria-description', 'Remove')
        .and('have.attr', 'tabindex', '0');
      cy.get('gui-pills .gui-pills__pill-remove').should('have.length', 2);
    });

    it("names a pill with its item's ariaLabel and its remove action with remove-aria-label", () => {
      cy.mount(
        html`<gui-pills
          remove-aria-label="Delete"
          .items=${[{ key: 'a', label: 'Alpha', ariaLabel: 'Alpha, first letter' }]}
        ></gui-pills>`,
      );

      pill(0)
        .should('have.attr', 'aria-label', 'Alpha, first letter')
        .and('have.attr', 'aria-description', 'Delete');
    });

    it('renders no pills without items', () => {
      cy.mount(html`<gui-pills .items=${[]}></gui-pills>`);

      cy.get('gui-pills').should('exist');
      cy.get('gui-pills button').should('not.exist');
    });

    it('keeps its pills out of the tab order when not tabbable', () => {
      cy.mount(html`<gui-pills .tabbable=${false} .items=${items}></gui-pills>`);

      pills().each((button) => expect(button).to.have.attr('tabindex', '-1'));
    });
  });

  describe('events', () => {
    it('fires gui-pill-remove from the remove icon, Delete and Backspace', () => {
      const onRemove = cy.spy().as('remove');
      cy.mount(html`<gui-pills .items=${items} @gui-pill-remove=${onRemove}></gui-pills>`);

      cy.get('gui-pills .gui-pills__pill-remove').eq(1).click();
      cy.get('@remove').its('lastCall.args.0.detail').should('deep.equal', { key: 'b' });

      pill(0).focus().type('{del}');
      cy.get('@remove').its('lastCall.args.0.detail').should('deep.equal', { key: 'a' });

      pill(2).focus().type('{backspace}');
      cy.get('@remove').its('lastCall.args.0.detail').should('deep.equal', { key: 'c' });
      cy.get('@remove').should('have.been.calledThrice');
      cy.get('@remove').its('lastCall.args.0.bubbles').should('equal', true);
      cy.get('@remove').its('lastCall.args.0.composed').should('equal', true);
    });

    it('keeps a busy pill from being removed again', () => {
      const onRemove = cy.spy().as('remove');
      cy.mount(
        html`<gui-pills
          .items=${[{ key: 'a', label: 'Alpha', busy: true }]}
          @gui-pill-remove=${onRemove}
        ></gui-pills>`,
      );

      pill(0).should('have.attr', 'aria-busy', 'true').and('not.have.attr', 'aria-description');
      cy.get('gui-pills .gui-pills__pill-busy').should('exist');
      cy.get('gui-pills .gui-pills__pill-remove').should('not.exist');

      pill(0).focus().type('{del}');
      cy.get('@remove').should('not.have.been.called');
    });

    it('fires gui-pill-click from a clickable pill on click, Enter and Space', () => {
      const onClick = cy.spy().as('click');
      cy.mount(html`<gui-pills clickable .items=${items} @gui-pill-click=${onClick}></gui-pills>`);

      pill(1).click();
      cy.get('@click').its('lastCall.args.0.detail').should('deep.equal', { key: 'b' });

      pill(2).trigger('keydown', { key: 'Enter' });
      cy.get('@click').its('lastCall.args.0.detail').should('deep.equal', { key: 'c' });

      pill(0).trigger('keydown', { key: ' ' });
      cy.get('@click').its('lastCall.args.0.detail').should('deep.equal', { key: 'a' });
      cy.get('@click').should('have.been.calledThrice');
    });

    it('fires no gui-pill-click when not clickable', () => {
      const onClick = cy.spy().as('click');
      cy.mount(html`<gui-pills .items=${items} @gui-pill-click=${onClick}></gui-pills>`);

      pill(0).click().trigger('keydown', { key: 'Enter' });

      cy.get('@click').should('not.have.been.called');
    });
  });

  describe('keyboard', () => {
    it('moves focus between pills with the arrow keys, Home and End', () => {
      cy.mount(html`<gui-pills .items=${items}></gui-pills>`);

      pill(0).focus().type('{rightArrow}');
      cy.focused().should('have.attr', 'data-key', 'b');
      cy.focused().type('{end}');
      cy.focused().should('have.attr', 'data-key', 'c');
      cy.focused().type('{leftArrow}');
      cy.focused().should('have.attr', 'data-key', 'b');
      cy.focused().type('{home}');
      cy.focused().should('have.attr', 'data-key', 'a');
    });

    it('fires gui-pill-keydown for keys past its ends and keys it does not handle', () => {
      const onKeydown = cy.spy().as('keydown');
      cy.mount(html`<gui-pills .items=${items} @gui-pill-keydown=${onKeydown}></gui-pills>`);

      pill(2).focus().type('{rightArrow}');
      cy.focused().should('have.attr', 'data-key', 'c');
      cy.get('@keydown').its('lastCall.args.0.detail.key').should('equal', 'c');
      cy.get('@keydown').its('lastCall.args.0.detail.event.key').should('equal', 'ArrowRight');

      pill(0).trigger('keydown', { key: 'x' });
      cy.get('@keydown').its('lastCall.args.0.detail.key').should('equal', 'a');
      cy.get('@keydown').its('lastCall.args.0.detail.event.key').should('equal', 'x');
    });
  });

  describe('dropdown', () => {
    it('opens and closes its dropdown from the count, firing gui-dropdown-toggle', () => {
      const onToggle = cy.spy().as('toggle');
      cy.mount(
        compact(html`<gui-pills .items=${items} @gui-dropdown-toggle=${onToggle}></gui-pills>`),
      );

      cy.get('gui-pills .gui-pills__count')
        .should('be.visible')
        .and('have.attr', 'aria-label', '3 items')
        .and('have.attr', 'aria-expanded', 'false')
        .click();

      cy.get('@toggle').its('lastCall.args.0.detail').should('deep.equal', { open: true });
      cy.get('gui-pills .gui-pills__count').should('have.attr', 'aria-expanded', 'true');
      cy.get('gui-pills .gui-pills__count')
        .invoke('attr', 'aria-controls')
        .then((id) => cy.get(`#${id} .gui-pills__pill`).should('have.length', 3));
      cy.focused().should('have.attr', 'data-key', 'a');

      cy.get('gui-pills .gui-pills__count').click();

      cy.get('@toggle').its('lastCall.args.0.detail').should('deep.equal', { open: false });
      cy.get('gui-pills .gui-pills__dropdown').should('not.exist');
    });

    it('moves through the dropdown with the arrow keys and closes it on Escape', () => {
      const onExit = cy.spy().as('exit');
      const onToggle = cy.spy().as('toggle');
      cy.mount(
        compact(
          html`<gui-pills
            .items=${items}
            @gui-pill-exit=${onExit}
            @gui-dropdown-toggle=${onToggle}
          ></gui-pills>`,
        ),
      );

      cy.get('gui-pills .gui-pills__count').focus().type('{downArrow}');
      cy.focused().should('have.attr', 'data-key', 'a').type('{downArrow}');
      cy.focused().should('have.attr', 'data-key', 'b').type('{esc}');

      cy.get('@exit')
        .its('lastCall.args.0.detail')
        .should('deep.equal', { key: 'b', reason: 'escape' });
      cy.get('@toggle').its('lastCall.args.0.detail').should('deep.equal', { open: false });
      cy.get('gui-pills .gui-pills__dropdown').should('not.exist');
    });
  });

  describe('editable', () => {
    it('fires gui-pill-focus and gui-pills-blur as focus enters and leaves', () => {
      const onFocus = cy.spy().as('focus');
      const onBlur = cy.spy().as('blur');
      cy.mount(
        html`<gui-pills
            editable
            clickable
            selected-key="b"
            .items=${items}
            @gui-pill-focus=${onFocus}
            @gui-pills-blur=${onBlur}
          ></gui-pills>
          <button>Outside</button>`,
      );

      pill(1).should('have.attr', 'aria-pressed', 'true');
      pill(0).should('have.attr', 'aria-pressed', 'false');

      pill(0).focus().type('{rightArrow}');
      cy.get('@focus').its('lastCall.args.0.detail').should('deep.equal', { key: 'b' });
      cy.get('@blur').should('not.have.been.called');

      cy.contains('button', 'Outside').focus();
      cy.get('@blur').should('have.been.calledOnce');
    });

    it('fires gui-pill-edit from the edit icon and F2, and confirm or cancel while editing', () => {
      const onEdit = cy.spy().as('edit');
      const onConfirm = cy.spy().as('confirm');
      const onCancel = cy.spy().as('cancel');
      cy.mount(
        html`<gui-pills
          editable
          clickable
          selected-key="a"
          editing-key="c"
          .items=${items}
          @gui-pill-edit=${onEdit}
          @gui-pill-edit-confirm=${onConfirm}
          @gui-pill-edit-cancel=${onCancel}
        ></gui-pills>`,
      );

      pill(0).find('.gui-pills__pill-action--edit').click();
      cy.get('@edit').its('lastCall.args.0.detail').should('deep.equal', { key: 'a' });

      pill(1).trigger('keydown', { key: 'F2' });
      cy.get('@edit').its('lastCall.args.0.detail').should('deep.equal', { key: 'b' });

      cy.get('gui-pills .gui-pills__pill-action--edit-confirm').click();
      cy.get('@confirm').its('lastCall.args.0.detail').should('deep.equal', { key: 'c' });
      cy.get('gui-pills .gui-pills__pill-action--edit-cancel').click();
      cy.get('@cancel').its('lastCall.args.0.detail').should('deep.equal', { key: 'c' });
    });
  });

  describe('states', () => {
    it('disables its pills and drops the remove hint when read-only or disabled', () => {
      cy.mount(html`<gui-pills readonly .items=${items}></gui-pills>`);

      pills().should('be.disabled').and('not.have.attr', 'aria-description');
      pill(0).should('have.attr', 'tabindex', '-1');

      cy.get('gui-pills').invoke('prop', 'readOnly', false).invoke('prop', 'disabled', true);
      pills().should('be.disabled').and('not.have.attr', 'aria-description');
    });

    it('renders no remove buttons when read-only or disabled', () => {
      cy.mount(html`<gui-pills readonly .items=${items}></gui-pills>`);

      pills().should('have.length', 3);
      cy.get('gui-pills .gui-pills__pill-remove').should('not.exist');

      cy.get('gui-pills').invoke('prop', 'readOnly', false).invoke('prop', 'disabled', true);
      cy.get('gui-pills .gui-pills__pill-remove').should('not.exist');

      cy.get('gui-pills').invoke('prop', 'disabled', false);
      cy.get('gui-pills .gui-pills__pill-remove').should('have.length', 3);
    });

    it('ignores a click on a remove button once read-only', () => {
      const onRemove = cy.spy().as('remove');
      cy.mount(html`<gui-pills .items=${items} @gui-pill-remove=${onRemove}></gui-pills>`);

      // A click that lands on the button as it goes, e.g. while the host turns read-only.
      cy.get('gui-pills .gui-pills__pill-remove')
        .first()
        .then(([remove]) => {
          cy.get('gui-pills').invoke('prop', 'readOnly', true);
          cy.get('gui-pills .gui-pills__pill-remove').should('not.exist');
          cy.then(() => remove.click());
        });

      cy.get('@remove').should('not.have.been.called');
    });
  });
});
