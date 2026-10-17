import { html } from 'lit';
import { overlaySuite } from '../support/overlay';
import { realPress, takesRealInput } from '../support/real-input';

const actions = () =>
  html`<button type="button" id="actions" popovertarget="row-actions">Actions</button>
    <gui-menu>
      <div id="row-actions" popover>
        <button type="button" value="edit">Edit</button>
        <button type="button" value="duplicate">Duplicate</button>
        <button type="button" value="archive" disabled>Archive</button>
        <a href="#download">Download</a>
        <hr />
        <button type="button" value="delete">Delete</button>
      </div>
    </gui-menu>
    <button type="button" id="after">After</button>`;

const panel = () => cy.get('#row-actions');
const button = () => cy.get('#actions');
const item = (text: string) => cy.contains('#row-actions > *', text);
const isOpen = (expected: boolean) =>
  panel().should(([element]) => expect(element.matches(':popover-open')).to.equal(expected));

overlaySuite({
  name: 'gui-menu',
  template: actions,
  invoker: '#actions',
  floating: '#row-actions',
  host: 'gui-menu',
  openState: ':popover-open',
  focusable: '#row-actions > button:first-child',
  outsideClick: 'closes',
  anchored: 'start',
});

describe('gui-menu', () => {
  describe('semantics', () => {
    it('gives the panel, its items and its button their roles, and names the menu', () => {
      cy.mount(actions());

      panel().should('have.attr', 'role', 'menu').and('have.attr', 'aria-labelledby', 'actions');
      cy.get('#row-actions > :is(button, a)').each(($item) => {
        cy.wrap($item).should('have.attr', 'role', 'menuitem').and('have.attr', 'tabindex', '-1');
      });
      button().should('have.attr', 'aria-haspopup', 'menu');
    });

    it('keeps the roles and the name the app gives it', () => {
      cy.mount(
        html`<button type="button" popovertarget="sort">Sort</button>
          <gui-menu>
            <div id="sort" popover role="menu" aria-label="Sort by">
              <button type="button" role="menuitemradio" aria-checked="true">Name</button>
            </div>
          </gui-menu>`,
      );

      cy.get('#sort')
        .should('have.attr', 'aria-label', 'Sort by')
        .and('not.have.attr', 'aria-labelledby');
      cy.get('#sort button').should('have.attr', 'role', 'menuitemradio');
    });
  });

  describe('layout', () => {
    it('keeps its items in a column while it fades out', () => {
      cy.mount(actions());

      button().click();
      isOpen(true);
      panel().then(([element]) => {
        element.hidePopover();
        // Where it fades out (Chromium keeps `display` until the fade ends; Firefox hides it at
        // once), the items must stay a column, not fall into a row.
        expect(getComputedStyle(element).flexDirection).to.equal('column');
      });
    });
  });

  describe('opening', () => {
    it('focuses the first item when it opens', () => {
      cy.mount(actions());

      button().click();
      isOpen(true);
      cy.focused().should('have.text', 'Edit');
    });

    it('opens from its button with ArrowDown at the first item, and ArrowUp at the last', () => {
      cy.mount(actions());

      button().focus().trigger('keydown', { key: 'ArrowDown' });
      isOpen(true);
      cy.focused().should('have.text', 'Edit');

      panel().then(([element]) => element.hidePopover());
      button().focus().trigger('keydown', { key: 'ArrowUp' });
      isOpen(true);
      cy.focused().should('have.text', 'Delete');
    });
  });

  describe('keyboard', () => {
    beforeEach(() => {
      cy.mount(actions());
      button().click();
      cy.focused().should('have.text', 'Edit');
    });

    it('moves with the arrows, skipping a disabled item, and wraps at the ends', () => {
      cy.focused().trigger('keydown', { key: 'ArrowDown' });
      cy.focused().should('have.text', 'Duplicate');
      cy.focused().trigger('keydown', { key: 'ArrowDown' });
      cy.focused().should('have.text', 'Download');
      cy.focused().trigger('keydown', { key: 'ArrowDown' });
      cy.focused().trigger('keydown', { key: 'ArrowDown' });
      cy.focused().should('have.text', 'Edit');
      cy.focused().trigger('keydown', { key: 'ArrowUp' });
      cy.focused().should('have.text', 'Delete');
    });

    it('goes to the ends with Home and End', () => {
      cy.focused().trigger('keydown', { key: 'End' });
      cy.focused().should('have.text', 'Delete');
      cy.focused().trigger('keydown', { key: 'Home' });
      cy.focused().should('have.text', 'Edit');
    });

    it('moves to the next item that starts with the letters typed', () => {
      cy.focused().trigger('keydown', { key: 'd' });
      cy.focused().should('have.text', 'Duplicate');
      cy.focused().trigger('keydown', { key: 'd' });
      cy.focused().should('have.text', 'Download');
    });

    it('closes when Tab moves the focus out', () => {
      cy.get('#after').focus();
      isOpen(false);
    });
  });

  describe('picking', () => {
    it('fires gui-action with the value, closes and returns focus to the button', () => {
      const onAction = cy.spy().as('action');
      cy.mount(html`<div @gui-action=${onAction}>${actions()}</div>`);

      button().click();
      item('Duplicate').click();
      cy.get('@action').should('have.been.calledOnce');
      cy.get('@action').its('firstCall.args.0.detail.value').should('equal', 'duplicate');
      isOpen(false);
      cy.focused().should('have.id', 'actions');
    });

    it("takes the item's text as the value when it has none", () => {
      const onAction = cy.spy().as('action');
      cy.mount(html`<div @gui-action=${onAction}>${actions()}</div>`);
      cy.get('a[href="#download"]').then(([link]) =>
        link.addEventListener('click', (e) => e.preventDefault()),
      );

      button().click();
      item('Download').click();
      cy.get('@action').its('firstCall.args.0.detail.value').should('equal', 'Download');
    });

    it('ignores a disabled item', () => {
      const onAction = cy.spy().as('action');
      cy.mount(html`<div @gui-action=${onAction}>${actions()}</div>`);

      button().click();
      item('Archive').click({ force: true });
      cy.get('@action').should('not.have.been.called');
      isOpen(true);
    });

    if (takesRealInput()) {
      it('picks the focused item with Enter and with Space', () => {
        const onAction = cy.spy().as('action');
        cy.mount(html`<div @gui-action=${onAction}>${actions()}</div>`);

        button().click();
        realPress('Enter');
        cy.get('@action').its('lastCall.args.0.detail.value').should('equal', 'edit');
        button().click();
        cy.focused().trigger('keydown', { key: 'End' });
        cy.focused().trigger('keydown', { key: 'ArrowUp' });
        cy.focused().should('have.text', 'Download');
        cy.focused().then(([link]) => link.addEventListener('click', (e) => e.preventDefault()));
        realPress('Space');
        cy.get('@action').its('lastCall.args.0.detail.value').should('equal', 'Download');
      });
    }
  });
});
