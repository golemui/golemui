/**
 * The modal dialogs `gui-dialog` has open, oldest first. A modal dialog makes the rest of the page
 * inert, top layer included, so an element that must stay usable while one is open, such as the
 * toaster, moves inside the topmost one.
 *
 * Only `gui-dialog` registers here: a `<dialog>` the app opens with `showModal()` on its own is
 * not tracked.
 */

interface ModalStackState {
  dialogs: HTMLDialogElement[];
  listeners: Set<() => void>;
}

// On globalThis, so every copy of the package shares one stack (see safeDefine).
const STATE_KEY = Symbol.for('golemui.modal-stack');
const state: ModalStackState = ((globalThis as Record<symbol, ModalStackState | undefined>)[
  STATE_KEY
] ??= { dialogs: [], listeners: new Set() });

/**
 * Records whether a dialog is open as a modal. The latest to open is the topmost.
 *
 * @param dialog - The `<dialog>` of a `gui-dialog`.
 * @param modal - Whether it is open as a modal now.
 */
export function trackModal(dialog: HTMLDialogElement, modal: boolean): void {
  const index = state.dialogs.indexOf(dialog);
  if (modal === index >= 0) return;
  if (modal) state.dialogs.push(dialog);
  else state.dialogs.splice(index, 1);
  for (const listener of state.listeners) listener();
}

/** The topmost open modal dialog `gui-dialog` opened, if any. */
export function topmostModal(): HTMLDialogElement | null {
  return state.dialogs.at(-1) ?? null;
}

/**
 * Calls `listener` whenever a modal dialog opens or closes.
 *
 * @returns A function that stops listening.
 */
export function onModalsChange(listener: () => void): () => void {
  state.listeners.add(listener);
  return () => state.listeners.delete(listener);
}
