import { ReactiveElement, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { booleanAttribute } from '../utils/converters';
import { warnInDevelopment } from '../utils/dev';
import { dispatchToggle, fires, type GuiToggleEventDetail } from '../utils/events';

/** Where a dialog shows: centered, or as a drawer along one edge of the viewport. */
export type GuiDialogPlacement = 'center' | 'start' | 'end' | 'top' | 'bottom';

/**
 * A modal dialog: the app's `<dialog>`, which the browser shows in the top layer with the rest of
 * the page inert, Escape to close it, and focus returned to what opened it. The element opens it
 * with `open`, places it (centered, or as a drawer), locks the page's scroll while it is open, and
 * reports when it opens and closes.
 *
 * ```html
 * <button commandfor="edit" command="show-modal">Edit</button>
 * <gui-dialog placement="end">
 *   <dialog id="edit" aria-labelledby="edit-title">
 *     <h2 id="edit-title">Edit profile</h2>
 *     …
 *     <button commandfor="edit" command="close">Cancel</button>
 *   </dialog>
 * </gui-dialog>
 * ```
 *
 * The dialog needs an accessible name (`aria-labelledby` or `aria-label`): the element warns in
 * development when it has none. With `alert` the element gives the dialog the `alertdialog` role,
 * for a dialog that asks the user to confirm or acknowledge something urgent.
 *
 * A centered dialog is `--gui-dialog-size` wide (32rem), and a drawer `--gui-drawer-size` (24rem),
 * within the viewport. They don't fit their content, so a form inside, which takes the width it is
 * given, has room.
 *
 * @fires gui-toggle - The dialog opened or closed, from an invoker, Escape, a backdrop click or a
 *   button that closes it. `detail.open` is the new state. Setting `open` fires nothing.
 */
export class GuiDialog extends ReactiveElement {
  /** Whether the dialog is open. Without a value it takes the dialog's own state. */
  @property({ converter: booleanAttribute, reflect: true }) open: boolean | undefined = undefined;

  /**
   * `center` (the default), or a drawer along the `start`, `end`, `top` or `bottom` edge. It
   * reflects, for the stylesheet: set from a framework as a property, it still places the dialog.
   */
  @property({ reflect: true }) placement: GuiDialogPlacement | undefined = undefined;

  /** Whether a click on the backdrop closes the dialog. An alert dialog ignores it. */
  @property({ converter: booleanAttribute }) dismissible: boolean | undefined = undefined;

  /** Whether the dialog is an alert dialog: it gets the `alertdialog` role. */
  @property({ converter: booleanAttribute }) alert: boolean | undefined = undefined;

  private mutations?: MutationObserver;
  /** The dialog the element gave the `alertdialog` role, to take it back from. */
  private roleGiven: HTMLDialogElement | null = null;
  /** Whether the pointer went down on the backdrop: a drag out of the dialog is not a click on it. */
  private pressedBackdrop = false;

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    // The app can render, or re-render, the dialog after the element connects, and opens and
    // closes it through invokers and its own buttons: the `open` attribute tells every change.
    this.mutations = new MutationObserver(this.onMutation);
    this.mutations.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['open'],
    });
    this.addEventListener('pointerdown', this.onPointerDown);
    this.addEventListener('click', this.onClick);
    this.sync();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.mutations?.disconnect();
    this.removeEventListener('pointerdown', this.onPointerDown);
    this.removeEventListener('click', this.onClick);
  }

  protected override updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    if (changedProperties.has('open') || changedProperties.has('alert')) this.sync();
  }

  /** The app's dialog: the element's `<dialog>` child. */
  get dialog(): HTMLDialogElement | null {
    return this.querySelector(':scope > dialog');
  }

  /** The dialog's state as the element last applied or saw it: a change from it is the user's. */
  private known: boolean | undefined = undefined;

  /** Brings the dialog in line with `open`, and gives it the alert role when `alert` asks. */
  private sync() {
    const dialog = this.dialog;
    if (!dialog) {
      if (this.open) warnInDevelopment(this, 'has no <dialog> child to open.');
      return;
    }
    this.syncRole(dialog);

    if (this.open === undefined) {
      this.open = this.known = dialog.open;
      return;
    }
    this.known = this.open;
    if (this.open && !dialog.open) this.show(dialog);
    else if (!this.open && dialog.open) dialog.close();
  }

  /** The dialog opened or closed, or the app rendered it: the user's changes update `open`. */
  private onMutation = () => {
    const dialog = this.dialog;
    if (!dialog) return;
    this.syncRole(dialog);
    if (this.known === undefined || dialog.open === this.known) return;
    this.known = dialog.open;
    this.open = dialog.open;
    dispatchToggle(this, dialog.open);
  };

  private show(dialog: HTMLDialogElement) {
    if (!dialog.isConnected) return;
    if (!dialog.hasAttribute('aria-label') && !dialog.hasAttribute('aria-labelledby')) {
      warnInDevelopment(this, 'has a <dialog> with no accessible name: set aria-labelledby.');
    }
    dialog.showModal();
  }

  private syncRole(dialog: HTMLDialogElement) {
    if (this.roleGiven && this.roleGiven !== dialog) this.roleGiven = null;
    if (this.alert && !dialog.hasAttribute('role')) {
      dialog.setAttribute('role', 'alertdialog');
      this.roleGiven = dialog;
    } else if (!this.alert && this.roleGiven === dialog) {
      dialog.removeAttribute('role');
      this.roleGiven = null;
    }
  }

  /** Whether a pointer event fell on the dialog's backdrop, outside its box. */
  private onBackdrop(event: MouseEvent): boolean {
    const dialog = this.dialog;
    if (!dialog || event.target !== dialog || !dialog.matches(':modal')) return false;
    const box = dialog.getBoundingClientRect();
    return (
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom
    );
  }

  private onPointerDown = (event: PointerEvent) => {
    this.pressedBackdrop = this.onBackdrop(event);
  };

  /** A click on the backdrop asks the dialog to close, as Escape does: `cancel` can veto it. */
  private onClick = (event: MouseEvent) => {
    const pressed = this.pressedBackdrop;
    this.pressedBackdrop = false;
    if (!this.dismissible || this.alert || !pressed || !this.onBackdrop(event)) return;
    const dialog = this.dialog as HTMLDialogElement;
    if (typeof dialog.requestClose === 'function') {
      dialog.requestClose();
    } else if (dialog.dispatchEvent(new Event('cancel', { cancelable: true }))) {
      dialog.close();
    }
  };
}

/** The events `gui-dialog` fires, with their types. */
export const GuiDialogEvents = {
  'gui-toggle': fires<CustomEvent<GuiToggleEventDetail>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-dialog': GuiDialog;
  }
}

safeDefine('gui-dialog', GuiDialog);
