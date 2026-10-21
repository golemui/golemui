import { html } from 'lit';
import '../../src/lib/components/dialog';
import type { GuiDialog } from '../../src/lib/components/dialog';
import { toast, type GuiToastOptions } from '../../src/lib/components/toast';
import { configureMessages } from '../../src/lib/utils/messages';
import { realPress, takesRealInput } from '../support/real-input';

const region = () => cy.get('.gui-toaster__region');
const toasts = () => cy.get('.gui-toaster__region .gui-toast');
const toastWith = (text: string) => cy.contains('.gui-toast', text);
const isOpen = (expected: boolean) =>
  region().should(([element]) =>
    expect(element.matches(':popover-open'), 'region open').to.equal(expected),
  );

/** Mounts a toaster with a spy on its events, and a button to start the focus from. */
const mountToaster = (attributes = '') => {
  const onDismiss = cy.spy().as('dismiss');
  const onAction = cy.spy().as('action');
  cy.mount(
    html`<div @gui-dismiss=${onDismiss} @gui-action=${onAction}>
      <button type="button" id="before">Before</button>
      <gui-toaster .placement=${attributes || 'bottom-end'}></gui-toaster>
    </div>`,
  );
};

/** Sends a toast from inside the test, so it reaches the toaster the test mounted. */
const send = (options: GuiToastOptions) => cy.then(() => toast(options));

const dismissals = () =>
  cy
    .get('@dismiss')
    .then((spy) =>
      (spy as unknown as sinon.SinonSpy).getCalls().map((call) => call.args[0].detail),
    );

describe('gui-toaster', () => {
  afterEach(() => configureMessages(null));

  describe('showing', () => {
    it('shows a toast in a named region in the top layer, closed until then', () => {
      mountToaster();
      region()
        .should('have.attr', 'aria-label', 'Notifications')
        .and('have.attr', 'popover', 'manual');
      isOpen(false);

      send({ title: 'Update available', message: 'Reload to get version 2.1.', variant: 'info' });

      isOpen(true);
      toastWith('Reload to get version 2.1.')
        .should('have.attr', 'data-variant', 'info')
        .find('.gui-toast__title')
        .should('have.text', 'Update available');
      toasts().find('.gui-toast__close').should('have.attr', 'aria-label', 'Dismiss notification');
    });

    it('announces a status politely, and an error at once', () => {
      mountToaster();

      send({ message: 'Draft saved' });
      send({ title: 'Upload failed', message: 'Try again.', variant: 'error' });

      region().find('[role="status"]').should('contain.text', 'Draft saved');
      region().find('[role="alert"]').should('contain.text', 'Upload failed. Try again.');
    });

    it('shows three at a time, and the next when one closes', () => {
      mountToaster();
      const handles: ReturnType<typeof toast>[] = [];
      cy.then(() => {
        for (const n of [1, 2, 3, 4, 5]) handles.push(toast({ message: `Message ${n}` }));
      });

      toasts().should('have.length', 3);
      toastWith('Message 4').should('not.exist');
      cy.then(() => handles[0].dismiss());
      toastWith('Message 4').should('exist');
      toastWith('Message 1').should('not.exist');
      dismissals().then((details) =>
        expect(details).to.deep.include({ id: handles[0].id, reason: 'api' }),
      );
    });

    it('replaces a toast that has the same id', () => {
      mountToaster();

      send({ id: 'save', message: 'Saving…' });
      toastWith('Saving…').should('exist');
      send({ id: 'save', message: 'Saved.', variant: 'success' });

      toasts().should('have.length', 1).and('contain.text', 'Saved.');
      toasts().should('have.attr', 'data-variant', 'success');
    });

    it('stacks the newest at the top for a top placement, first in the reading order too', () => {
      mountToaster('top-end');

      send({ message: 'Older' });
      send({ message: 'Newer' });

      toasts().first().should('contain.text', 'Newer');
    });
  });

  describe('routing', () => {
    it('waits for its toaster to connect', () => {
      cy.mount(html`<p>No toaster yet</p>`);
      send({ message: 'Sent early' });

      mountToaster();
      toastWith('Sent early').should('exist');
    });

    it('shows a toast in the toaster it names', () => {
      cy.mount(html`<gui-toaster id="main"></gui-toaster><gui-toaster id="side"></gui-toaster>`);

      send({ message: 'For the side', toaster: 'side' });

      cy.get('#side .gui-toast').should('contain.text', 'For the side');
      cy.get('#main .gui-toast').should('not.exist');
    });

    it('moves into the topmost gui-dialog modal while it is open, and back', () => {
      cy.mount(
        html`<gui-dialog>
            <dialog id="publish" aria-label="Publish">
              <button type="button">Publish</button>
            </dialog>
          </gui-dialog>
          <gui-toaster></gui-toaster>`,
      );
      send({ message: 'Before the dialog' });
      cy.get<GuiDialog>('gui-dialog').invoke('prop', 'open', true);
      cy.get('#publish').should('match', ':modal');

      cy.get('#publish > .gui-toaster__region').should('exist');
      isOpen(true);
      // In the dialog, the toast is the one under the pointer: the modal leaves it reachable.
      toasts()
        .find('.gui-toast__close')
        .should(([button]) => {
          const { x, y, width, height } = button.getBoundingClientRect();
          const hit = button.ownerDocument.elementFromPoint(x + width / 2, y + height / 2);
          expect(button.contains(hit)).to.equal(true);
        });

      cy.get<GuiDialog>('gui-dialog').invoke('prop', 'open', false);
      cy.get('gui-toaster > .gui-toaster__region').should('exist');
      isOpen(true);
      toastWith('Before the dialog').should('exist');
    });
  });

  describe('timing', () => {
    it('closes after its duration and fires gui-dismiss', () => {
      cy.clock();
      mountToaster();
      const onDismiss = cy.spy().as('onDismiss');
      send({ id: 'brief', message: 'Brief', duration: 1000, onDismiss });

      cy.tick(999);
      dismissals().should('deep.equal', []);
      cy.tick(1);
      dismissals().should('deep.equal', [{ id: 'brief', reason: 'timeout' }]);
      cy.get('@onDismiss').should('have.been.calledOnceWith', 'timeout');
      toastWith('Brief').should('not.exist');
      isOpen(false);
    });

    it('keeps an error and a toast with an action until the user closes them', () => {
      cy.clock();
      mountToaster();

      send({ message: 'Failed', variant: 'error' });
      send({ message: 'Deleted', action: { label: 'Undo', onAction: () => undefined } });
      send({ message: 'Done' });
      cy.tick(60_000);

      toastWith('Failed').should('exist');
      toastWith('Deleted').should('exist');
      toastWith('Done').should('not.exist');
    });

    it('pauses while the pointer is over the toasts', () => {
      cy.clock();
      mountToaster();
      send({ message: 'Hover me', duration: 1000 });

      cy.tick(500);
      region().trigger('pointerenter', { force: true });
      cy.tick(5000);
      toastWith('Hover me').should('exist');
      region().trigger('pointerleave', { force: true });
      cy.tick(499);
      toastWith('Hover me').should('exist');
      cy.tick(1);
      toastWith('Hover me').should('not.exist');
    });

    it('pauses while the focus is in a toast', () => {
      cy.clock();
      mountToaster();
      send({ message: 'Focus me', duration: 1000 });

      toasts().find('.gui-toast__close').focus();
      cy.tick(5000);
      toastWith('Focus me').should('exist');
      cy.get('#before').focus();
      cy.tick(1000);
      toastWith('Focus me').should('not.exist');
    });
  });

  describe('closing', () => {
    it('closes from its close button, and returns the focus to where it came from', () => {
      mountToaster();
      send({ message: 'Close me' });

      cy.get('#before').focus();
      toasts().find('.gui-toast__close').focus().click();

      dismissals().should((details) =>
        expect(details.map(({ reason }) => reason)).to.deep.equal(['close']),
      );
      toastWith('Close me').should('not.exist');
      cy.focused().should('have.id', 'before');
    });

    it('moves the focus to the next toast when there is one', () => {
      mountToaster();
      send({ message: 'First' });
      send({ message: 'Second' });

      toastWith('First').find('.gui-toast__close').focus().click();
      cy.focused().closest('.gui-toast').should('contain.text', 'Second');
    });

    it('closes on Escape in the toast', () => {
      mountToaster();
      send({ id: 'esc', message: 'Escape me', variant: 'error' });

      toasts().find('.gui-toast__close').focus().trigger('keydown', { key: 'Escape' });

      dismissals().should('deep.equal', [{ id: 'esc', reason: 'escape' }]);
      toastWith('Escape me').should('not.exist');
    });

    if (takesRealInput()) {
      it('closes the toast on Escape, not the dialog it is in', () => {
        cy.mount(
          html`<gui-dialog open>
              <dialog id="edit" aria-label="Edit"><button type="button">Save</button></dialog>
            </gui-dialog>
            <gui-toaster></gui-toaster>`,
        );
        cy.get('#edit').should('match', ':modal');
        send({ message: 'Escape me', variant: 'error' });

        cy.get('#edit .gui-toast__close').focus();
        realPress('Escape');

        toastWith('Escape me').should('not.exist');
        cy.get('#edit').should('match', ':modal');
      });
    }

    it('runs its action, fires gui-action and closes', () => {
      mountToaster();
      const onAction = cy.spy().as('onAction');
      send({ id: 'undo', message: 'Deleted', action: { label: 'Undo', onAction } });

      toasts().find('.gui-toast__action').should('have.text', 'Undo').click();

      cy.get('@onAction').should('have.been.calledOnce');
      cy.get('@action').its('firstCall.args.0.detail.value').should('equal', 'undo');
      dismissals().should('deep.equal', [{ id: 'undo', reason: 'action' }]);
    });
  });

  describe('placement', () => {
    /** The gap to the viewport's edges, `--gui-space-4`, measured. */
    const gapOf = (element: Element) => {
      const probe = element.ownerDocument.createElement('div');
      probe.style.setProperty('inline-size', 'var(--gui-space-4)');
      element.ownerDocument.body.append(probe);
      const gap = probe.getBoundingClientRect().width;
      probe.remove();
      return gap;
    };
    const corner = (placement: string, check: (box: DOMRect, width: number, gap: number) => void) =>
      it(`stacks at ${placement}`, () => {
        mountToaster(placement);
        send({ message: 'Placed' });
        region().should(([element]) =>
          check(
            element.getBoundingClientRect(),
            element.ownerDocument.documentElement.clientWidth,
            gapOf(element),
          ),
        );
      });

    corner('top-start', (box, _width, gap) => {
      expect(box.top).to.be.closeTo(gap, 1);
      expect(box.left).to.be.closeTo(gap, 1);
    });
    corner('bottom-end', (box, width, gap) => {
      expect(box.right).to.be.closeTo(width - gap, 1);
    });
    corner('top', (box, width) => {
      expect(box.left + box.width / 2).to.be.closeTo(width / 2, 1);
    });

    it('mirrors start and end in right to left', () => {
      const onDismiss = cy.spy().as('dismiss');
      cy.mount(
        html`<div dir="rtl" @gui-dismiss=${onDismiss}>
          <gui-toaster placement="top-start"></gui-toaster>
        </div>`,
      );
      send({ message: 'Placed' });

      region().should(([element]) => {
        const width = element.ownerDocument.documentElement.clientWidth;
        expect(element.getBoundingClientRect().right).to.be.closeTo(width - gapOf(element), 1);
      });
    });
  });

  describe('strings', () => {
    it('translates its names through configureMessages, under its own props', () => {
      configureMessages(
        (key) =>
          ({ notifications: 'Notificaciones', dismissNotification: 'Descartar' })[key as string],
      );
      mountToaster();
      send({ message: 'Hola' });

      region().should('have.attr', 'aria-label', 'Notificaciones');
      toasts().find('.gui-toast__close').should('have.attr', 'aria-label', 'Descartar');

      cy.get('gui-toaster').invoke('prop', 'dismissLabel', 'Cerrar');
      toasts().find('.gui-toast__close').should('have.attr', 'aria-label', 'Cerrar');
    });
  });
});
