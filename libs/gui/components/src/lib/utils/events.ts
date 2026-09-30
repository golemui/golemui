// Every GolemUI event bubbles, so a listener on any ancestor can handle it, like the native
// `input` and `change` events it mirrors.
const eventInit = { bubbles: true, composed: true };

/** The detail of `gui-input` and `gui-change`: the element's new value. */
export type GuiValueEventDetail<T = unknown> = { value: T };

/** `gui-input` or `gui-change`, carrying the element's new value. */
export type GuiValueEvent<T = unknown> = CustomEvent<GuiValueEventDetail<T>>;

/** The detail of `gui-input-error`: why the element rejected what the user entered. */
export type GuiInputErrorEventDetail = { message: string };

/**
 * An entry of an element's events map (`GuiTextinputEvents`, exported next to each element): an
 * event the element fires, typed. Its runtime value is `true`; only the type carries the event.
 * Framework bindings read the maps: the React components turn each event into an `on*` prop, and
 * the Vue typings into a typed handler.
 */
export type GuiEventType<T extends Event = Event> = true & { readonly __event: T };

/** Declares an event in an element's events map, e.g. `'gui-blur': fires()`. */
export const fires = <T extends Event = Event>(): GuiEventType<T> => true as GuiEventType<T>;

/** The events of an element that edits a value: `gui-input`, `gui-change` and `gui-blur`. */
export const valueEvents = <T>() => ({
  'gui-input': fires<GuiValueEvent<T>>(),
  'gui-change': fires<GuiValueEvent<T>>(),
  'gui-blur': fires(),
});

/**
 * The event types of an events map, by name: `GuiEventMap<typeof GuiTextinputEvents>['gui-change']`
 * is `CustomEvent<{ value: string | undefined }>`.
 */
export type GuiEventMap<Events> = {
  [Name in keyof Events]: Events[Name] extends GuiEventType<infer T> ? T : Event;
};

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
