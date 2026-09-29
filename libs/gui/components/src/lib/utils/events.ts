// Every GolemUI event bubbles, so a listener on any ancestor can handle it, like the native
// `input` and `change` events it mirrors.
const eventInit = { bubbles: true, composed: true };

/** The detail of `gui-input` and `gui-change`: the element's new value. */
export type GuiValueEventDetail<T = unknown> = { value: T };

/**
 * Reports a value the user changed: `gui-input`, then `gui-change`.
 *
 * Pass `commit: false` while the user is still editing the value (typing in a text field). The
 * element then dispatches `gui-change` itself when the edit is committed, see
 * {@link dispatchChange}.
 */
export function dispatchValue(
  host: HTMLElement,
  value: unknown,
  { commit = true }: { commit?: boolean } = {},
): void {
  host.dispatchEvent(
    new CustomEvent<GuiValueEventDetail>('gui-input', { detail: { value }, ...eventInit }),
  );
  if (commit) {
    dispatchChange(host, value);
  }
}

/** Reports that the user committed the value: `gui-change`. */
export function dispatchChange(host: HTMLElement, value: unknown): void {
  host.dispatchEvent(
    new CustomEvent<GuiValueEventDetail>('gui-change', { detail: { value }, ...eventInit }),
  );
}

/**
 * Stops an inner element's event at the element that composes it, which reports the change as
 * its own event.
 */
export const stopPropagation = (event: Event): void => event.stopPropagation();
