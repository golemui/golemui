import { html, nothing } from 'lit';
import type { GuiDialog } from '../../src/lib/components/dialog';
import { options } from '../support/elements';
import { overlaySuite } from '../support/overlay';
import { realPress, takesRealInput } from '../support/real-input';

type Options = { dismissible?: boolean; alert?: boolean; placement?: string; open?: boolean };

const edit = ({ dismissible, alert, placement, open }: Options = {}) =>
  html`<button type="button" commandfor="edit" command="show-modal">Edit</button>
    <gui-dialog
      ?dismissible=${dismissible}
      ?alert=${alert}
      ?open=${open}
      placement=${placement ?? nothing}
    >
      <dialog id="edit" aria-labelledby="edit-title">
        <h2 id="edit-title">Edit profile</h2>
        <p>Your name shows on every comment you leave.</p>
        <button type="button" id="edit-save">Save</button>
        <button type="button" commandfor="edit" command="close">Cancel</button>
      </dialog>
    </gui-dialog>`;

const host = () => cy.get<GuiDialog>('gui-dialog');
const dialog = () => cy.get<HTMLDialogElement>('#edit');
const openButton = () => cy.get('button[commandfor="edit"][command="show-modal"]');
const isOpen = (expected: boolean) =>
  dialog().should(([element]) => expect(element.matches(':modal')).to.equal(expected));

/** A click on the backdrop, at the viewport's top left corner, outside the centered dialog. */
const clickBackdrop = () =>
  dialog()
    .trigger('pointerdown', { clientX: 2, clientY: 2 })
    .trigger('click', { clientX: 2, clientY: 2 });

overlaySuite({
  name: 'gui-dialog',
  template: () => edit({ dismissible: true }),
  invoker: 'button[commandfor="edit"][command="show-modal"]',
  floating: '#edit',
  host: 'gui-dialog',
  openState: ':modal',
  focusable: '#edit-save',
  outsideClick: 'closes',
});

describe('gui-dialog', () => {
  describe('opening and closing', () => {
    it('opens as a modal from its invoker, and fires gui-toggle', () => {
      const onToggle = cy.spy().as('toggle');
      cy.mount(html`<div @gui-toggle=${onToggle}>${edit()}</div>`);

      openButton().click();
      isOpen(true);
      host().should('have.prop', 'open', true).and('have.attr', 'open');
      cy.get('@toggle').its('lastCall.args.0.detail').should('deep.equal', { open: true });

      cy.get('button[command="close"]').click();
      isOpen(false);
      host().should('have.prop', 'open', false).and('not.have.attr', 'open');
      cy.get('@toggle').its('lastCall.args.0.detail').should('deep.equal', { open: false });
      cy.get('@toggle').should('have.been.calledTwice');
    });

    it('opens and closes with open, and fires nothing', () => {
      const onToggle = cy.spy().as('toggle');
      cy.mount(html`<div @gui-toggle=${onToggle}>${edit()}</div>`);

      host().invoke('prop', 'open', true);
      isOpen(true);
      host().invoke('prop', 'open', false);
      isOpen(false);
      cy.get('@toggle').should('not.have.been.called');
    });

    it('opens when it connects with open set', () => {
      cy.mount(edit({ open: true }));

      isOpen(true);
    });

    it("locks the page's scroll while it is open", () => {
      cy.mount(edit());

      cy.document().its('documentElement').should('not.have.css', 'overflow', 'hidden');
      host().invoke('prop', 'open', true);
      cy.document().its('documentElement').should('have.css', 'overflow', 'hidden');
      host().invoke('prop', 'open', false);
      cy.document().its('documentElement').should('not.have.css', 'overflow', 'hidden');
    });
  });

  describe('dismissal', () => {
    it('stays open on a backdrop click unless it is dismissible', () => {
      cy.mount(edit());

      host().invoke('prop', 'open', true);
      clickBackdrop();
      isOpen(true);
    });

    it('closes on a backdrop click when it is dismissible, unless cancel vetoes it', () => {
      const onToggle = cy.spy().as('toggle');
      cy.mount(html`<div @gui-toggle=${onToggle}>${edit({ dismissible: true })}</div>`);

      host().invoke('prop', 'open', true);
      const veto = (event: Event) => event.preventDefault();
      dialog().then(([element]) => element.addEventListener('cancel', veto));
      clickBackdrop();
      isOpen(true);

      dialog().then(([element]) => element.removeEventListener('cancel', veto));
      clickBackdrop();
      isOpen(false);
      cy.get('@toggle').its('lastCall.args.0.detail').should('deep.equal', { open: false });
    });

    it('stays open when a drag that started inside it ends on the backdrop', () => {
      cy.mount(edit({ dismissible: true }));

      host().invoke('prop', 'open', true);
      cy.get('#edit-title').trigger('pointerdown');
      dialog().trigger('click', { clientX: 2, clientY: 2 });
      isOpen(true);
    });
  });

  describe('alert dialog', () => {
    it('gives its dialog the alertdialog role, and takes it back', () => {
      cy.mount(edit({ alert: true }));

      dialog().should('have.attr', 'role', 'alertdialog');
      host().invoke('prop', 'alert', false);
      dialog().should('not.have.attr', 'role');
    });

    it('keeps a role the app gives its dialog', () => {
      cy.mount(
        html`<gui-dialog alert>
          <dialog id="edit" role="dialog" aria-label="Settings">Settings</dialog>
        </gui-dialog>`,
      );

      host().invoke('prop', 'alert', false);
      dialog().should('have.attr', 'role', 'dialog');
    });

    it('ignores a backdrop click, even when dismissible', () => {
      cy.mount(edit({ alert: true, dismissible: true }));

      host().invoke('prop', 'open', true);
      clickBackdrop();
      isOpen(true);
    });
  });

  // The browser closes a modal dialog on a trusted Escape only, which Cypress sends in Chromium.
  if (takesRealInput()) {
    describe('Escape inside it', () => {
      it("closes an open dropdown's panel first, and the dialog on the next one", () => {
        cy.mount(
          html`<gui-dialog open>
            <dialog id="edit" aria-label="Edit">
              <gui-dropdown label="Plan" .items=${options}></gui-dropdown>
            </dialog>
          </gui-dialog>`,
        );

        cy.get('gui-dropdown .gui-dropdown__arrow').click();
        cy.get('gui-dropdown .gui-picker__panel').should('match', ':popover-open');
        realPress('Escape');
        cy.get('gui-dropdown .gui-picker__panel').should('not.match', ':popover-open');
        isOpen(true);
        realPress('Escape');
        isOpen(false);
      });

      it('closes an open tooltip first, and the dialog on the next one', () => {
        cy.mount(
          html`<gui-dialog open>
            <dialog id="edit" aria-label="Edit">
              <button type="button" id="copy">Copy link</button>
              <gui-tooltip for="copy">Copies a link to this page</gui-tooltip>
            </dialog>
          </gui-dialog>`,
        );

        cy.get('gui-tooltip').invoke('prop', 'open', true);
        cy.get('gui-tooltip').should('match', ':popover-open');
        realPress('Escape');
        cy.get('gui-tooltip').should('not.match', ':popover-open');
        isOpen(true);
        realPress('Escape');
        isOpen(false);
      });
    });
  }

  describe('drawers', () => {
    // Where each drawer's box sits once it has slid in, in a left-to-right page.
    const flush: Record<string, (box: DOMRect, width: number, height: number) => void> = {
      start: (box, _width, height) => {
        expect(box.left).to.be.closeTo(0, 1);
        expect(box.height).to.be.closeTo(height, 1);
      },
      end: (box, width, height) => {
        expect(box.right).to.be.closeTo(width, 1);
        expect(box.height).to.be.closeTo(height, 1);
      },
      top: (box, width) => {
        expect(box.top).to.be.closeTo(0, 1);
        expect(box.width).to.be.closeTo(width, 1);
      },
      bottom: (box, width, height) => {
        expect(box.bottom).to.be.closeTo(height, 1);
        expect(box.width).to.be.closeTo(width, 1);
      },
    };

    for (const [placement, check] of Object.entries(flush)) {
      it(`slides in flush with the ${placement} edge`, () => {
        cy.mount(edit({ placement }));

        host().invoke('prop', 'open', true);
        dialog().should(([element]) => {
          const view = element.ownerDocument.documentElement;
          check(element.getBoundingClientRect(), view.clientWidth, view.clientHeight);
        });
      });
    }

    it('mirrors start and end in right to left', () => {
      cy.mount(html`<div dir="rtl">${edit({ placement: 'end' })}</div>`);

      host().invoke('prop', 'open', true);
      dialog().should(([element]) =>
        expect(element.getBoundingClientRect().left).to.be.closeTo(0, 1),
      );
    });
  });
});
