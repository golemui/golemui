import { html, nothing, ReactiveElement, render, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { safeDefine } from '@golemui/lit-utils';
import { dispatch, fires, type GuiActionEventDetail } from '../utils/events';
import { X_PATH } from '../utils/icons';
import { requiredName, trackMessages } from '../utils/messages';
import { onModalsChange, topmostModal } from '../utils/modal-stack';

/** The intents a toast can show, as `gui-alert` does. */
export type GuiToastVariant = 'default' | 'info' | 'success' | 'warning' | 'error';

/** Where a toaster stacks its toasts: a corner, or the middle of the top or bottom edge. */
export type GuiToasterPlacement =
  | 'top-start'
  | 'top'
  | 'top-end'
  | 'bottom-start'
  | 'bottom'
  | 'bottom-end';

/**
 * Why a toast closed: its time ran out, the user pressed its close button, pressed Escape in it or
 * pressed its action, or the app dismissed it.
 */
export type GuiDismissReason = 'timeout' | 'close' | 'escape' | 'action' | 'api';

/** The detail of `gui-dismiss`: the toast that closed, and why. */
export type GuiDismissEventDetail = { id: string; reason: GuiDismissReason };

/** What {@link toast} shows. */
export interface GuiToastOptions {
  /** The text of the toast. */
  message: string;
  /** A short heading above the message. */
  title?: string;
  /** The intent it shows. An error is announced at once, the rest when the user is idle. */
  variant?: GuiToastVariant;
  /**
   * Milliseconds before it closes on its own, with the time paused while the pointer is over the
   * toasts, the focus is in them or the tab is hidden. `Infinity` keeps it until the user closes it.
   * Defaults to 5000, and to `Infinity` for an error or a toast with an action, which the user
   * must have time to reach.
   */
  duration?: number;
  /** A button that runs `onAction`, then closes the toast. */
  action?: { label: string; onAction: () => void };
  /** Names the toast: a toast with the id of a showing one replaces it. */
  id?: string;
  /** The `id` of the `gui-toaster` to show it in. Defaults to the first one in the page. */
  toaster?: string;
  /** Runs when the toast closes, with the reason. */
  onDismiss?: (reason: GuiDismissReason) => void;
}

/** A toast {@link toast} showed, or queued. */
export interface GuiToastHandle {
  readonly id: string;
  /** Closes the toast, or drops it from the queue. */
  dismiss(): void;
}

/** The default time on screen. */
const DEFAULT_DURATION = 5000;
/** How long an announcement stays in a live region before it is cleared. */
const ANNOUNCEMENT_LIFETIME = 7000;

interface ToastEntry {
  id: string;
  options: GuiToastOptions;
  /** On screen, rather than queued. */
  shown: boolean;
  /** Playing its exit animation. */
  leaving: boolean;
  /** Milliseconds left on screen. */
  remaining: number;
  timer?: ReturnType<typeof setTimeout>;
  startedAt?: number;
}

interface ToastState {
  /** The connected toasters, in the order they connected. */
  toasters: GuiToaster[];
  /** Toasts sent before their toaster connected. */
  pending: { id: string; options: GuiToastOptions }[];
  count: number;
}

// On globalThis, so every copy of the package shares the toasters and the queue (see safeDefine).
const STATE_KEY = Symbol.for('golemui.toasts');
const state: ToastState = ((globalThis as Record<symbol, ToastState | undefined>)[STATE_KEY] ??= {
  toasters: [],
  pending: [],
  count: 0,
});

const findToaster = (name?: string) =>
  name ? state.toasters.find((toaster) => toaster.id === name) : state.toasters[0];

const durationOf = ({ duration, variant, action }: GuiToastOptions) =>
  duration ?? (variant === 'error' || action ? Infinity : DEFAULT_DURATION);

const isPopoverOpen = (element: HTMLElement) => {
  try {
    return element.matches(':popover-open');
  } catch {
    return false;
  }
};

/**
 * Shows a toast: a short message that doesn't interrupt the user, in the page's `gui-toaster`.
 * It is a plain function, so it works from any framework.
 *
 * - The toaster shows a few at a time and queues the rest.
 * - Before its toaster connects, the toast waits for it; on the server it does nothing.
 * - While a `gui-dialog` modal is open, the toasts show inside it: outside, the modal would make
 *   them unreachable.
 *
 * ```ts
 * toast({ message: 'Draft saved', variant: 'success' });
 * toast({ message: 'Item deleted', action: { label: 'Undo', onAction: restore } });
 * ```
 */
export function toast(options: GuiToastOptions): GuiToastHandle {
  const id = options.id ?? `gui-toast-${++state.count}`;
  const handle: GuiToastHandle = { id, dismiss: () => dismissToast(id) };
  if (typeof document === 'undefined') return handle;

  const toaster = findToaster(options.toaster);
  if (toaster) {
    toaster.show(id, options);
  } else {
    state.pending = state.pending.filter((entry) => entry.id !== id);
    state.pending.push({ id, options });
  }
  return handle;
}

function dismissToast(id: string) {
  state.pending = state.pending.filter((entry) => entry.id !== id);
  for (const toaster of state.toasters) toaster.dismiss(id, 'api');
}

/**
 * Where {@link toast} shows its toasts: an empty element the app renders once, usually at the end
 * of the page. Rendering it up front matters: a live region announces only what changes after it
 * is in the page.
 *
 * ```html
 * <gui-toaster placement="bottom-end"></gui-toaster>
 * ```
 *
 * The toasts show in the top layer, in a region named "Notifications": a status message is
 * announced when the user is idle, an error at once. Each toast has a close button, and Escape in
 * it closes it too. Its time pauses while the pointer is over the toasts, the focus is in them or
 * the tab is hidden.
 *
 * While a `gui-dialog` modal is open, the region moves inside its `<dialog>`, which keeps the
 * toasts usable; a `<dialog>` the app opens with `showModal()` itself hides them.
 *
 * @fires gui-dismiss - A toast closed. `detail.id` is its id and `detail.reason` why it closed.
 * @fires gui-action - The user pressed a toast's action. `detail.value` is the toast's id and
 *   `detail.item` the toast.
 */
export class GuiToaster extends ReactiveElement {
  /** Where the toasts stack. */
  @property({ reflect: true }) placement: GuiToasterPlacement | undefined = 'bottom-end';
  /** How many toasts show at once; the rest wait. */
  @property({ type: Number }) max: number | undefined = 3;
  /** The region's accessible name. Defaults to "Notifications". */
  @property({ attribute: 'region-label' }) regionLabel: string | undefined = undefined;
  /** The close buttons' accessible name. Defaults to "Dismiss notification". */
  @property({ attribute: 'dismiss-label' }) dismissLabel: string | undefined = undefined;

  /** Shown and queued toasts, oldest first. */
  private toasts: ToastEntry[] = [];
  private region?: HTMLElement;
  private list?: HTMLOListElement;
  private politeRegion?: HTMLElement;
  private assertiveRegion?: HTMLElement;
  private hovered = false;
  private focused = false;
  private pageHidden = false;
  /** Where the focus was before it entered the toasts, to return it when its toast closes. */
  private returnFocus: HTMLElement | null = null;
  private stopModals?: () => void;

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    trackMessages(this, true);
    this.region ??= this.createRegion();
    this.stopModals = onModalsChange(this.place);
    this.pageHidden = document.hidden;
    document.addEventListener('visibilitychange', this.onVisibility);
    state.toasters.push(this);

    const mine = state.pending.filter(({ options }) =>
      options.toaster ? options.toaster === this.id : true,
    );
    state.pending = state.pending.filter((entry) => !mine.includes(entry));
    for (const { id, options } of mine) this.show(id, options);

    this.place();
    this.syncTimers();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    trackMessages(this, false);
    this.stopModals?.();
    document.removeEventListener('visibilitychange', this.onVisibility);
    state.toasters = state.toasters.filter((toaster) => toaster !== this);
    for (const entry of this.toasts) this.stopTimer(entry);
    // The region may be inside a dialog: take it along.
    this.region?.remove();
  }

  protected override updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    const region = this.region;
    const list = this.list;
    if (!region || !list) return;
    region.setAttribute('aria-label', requiredName('notifications', this.regionLabel));
    region.dataset['placement'] = this.placement || 'bottom-end';

    const shown = this.toasts.filter((entry) => entry.shown);
    // Newest next to the edge the toasts stack from, in the reading order too.
    const ordered = region.dataset['placement'].startsWith('top') ? [...shown].reverse() : shown;
    const dismissName = requiredName('dismissNotification', this.dismissLabel);
    render(
      html`${repeat(
        ordered,
        (entry) => entry.id,
        (entry) => this.toastTemplate(entry, dismissName),
      )}`,
      list,
    );
    this.syncOpen();
  }

  private toastTemplate({ id, options, leaving }: ToastEntry, dismissName: string) {
    return html`<li
      class="gui-toast"
      data-id=${id}
      data-variant=${options.variant || 'default'}
      ?data-leaving=${leaving}
    >
      <div class="gui-toast__body">
        ${options.title ? html`<p class="gui-toast__title">${options.title}</p>` : nothing}
        <p class="gui-toast__message">${options.message}</p>
      </div>
      ${options.action
        ? html`<button type="button" class="gui-toast__action">${options.action.label}</button>`
        : nothing}
      <button type="button" class="gui-toast__close" aria-label=${dismissName}>
        <svg viewBox="0 0 256 256" width="16" height="16" fill="currentColor" aria-hidden="true">
          <path d=${X_PATH}></path>
        </svg>
      </button>
    </li>`;
  }

  /**
   * Shows a toast, or queues it when the toaster is full. A toast with the id of one already here
   * replaces it. {@link toast} calls it.
   */
  show(id: string, options: GuiToastOptions): void {
    const existing = this.toasts.find((entry) => entry.id === id && !entry.leaving);
    if (existing) {
      this.stopTimer(existing);
      existing.options = options;
      existing.remaining = durationOf(options);
      if (existing.shown) {
        this.announce(options);
        this.startTimer(existing);
      }
    } else {
      this.toasts.push({
        id,
        options,
        shown: false,
        leaving: false,
        remaining: durationOf(options),
      });
      this.promote();
    }
    this.requestUpdate();
  }

  /**
   * Closes a toast, or drops it from the queue, and fires `gui-dismiss`.
   *
   * @returns Whether the toaster had it.
   */
  dismiss(id: string, reason: GuiDismissReason): boolean {
    const entry = this.toasts.find((candidate) => candidate.id === id && !candidate.leaving);
    if (!entry) return false;
    this.stopTimer(entry);
    entry.leaving = true;
    dispatch<GuiDismissEventDetail>(this, 'gui-dismiss', { id, reason });
    entry.options.onDismiss?.(reason);

    if (!entry.shown) {
      this.drop(entry);
      return true;
    }
    const item = this.itemOf(id);
    if (item?.contains(document.activeElement)) this.moveFocusFrom(item);
    this.requestUpdate();
    void this.updateComplete.then(async () => {
      // Waits for the exit animation, which the stylesheet starts from `data-leaving`.
      const leaving = this.itemOf(id);
      await Promise.all(
        (leaving?.getAnimations?.() ?? []).map((animation) =>
          animation.finished.catch(() => undefined),
        ),
      );
      this.drop(entry);
    });
    return true;
  }

  /** Takes a toast out for good, and shows the next queued one. */
  private drop(entry: ToastEntry) {
    this.toasts = this.toasts.filter((candidate) => candidate !== entry);
    this.promote();
    this.requestUpdate();
  }

  /** Shows queued toasts while there is room. */
  private promote() {
    const max = Math.max(1, this.max || 3);
    let active = this.toasts.filter((entry) => entry.shown && !entry.leaving).length;
    for (const entry of this.toasts) {
      if (active >= max) break;
      if (entry.shown || entry.leaving) continue;
      entry.shown = true;
      active++;
      this.announce(entry.options);
      this.startTimer(entry);
    }
  }

  private itemOf(id: string): HTMLElement | undefined {
    return Array.from(this.list?.children ?? []).find(
      (item) => (item as HTMLElement).dataset['id'] === id,
    ) as HTMLElement | undefined;
  }

  /** The focus is in a closing toast: it goes to the next toast, or back to where it came from. */
  private moveFocusFrom(item: HTMLElement) {
    const next = Array.from(this.list?.children ?? []).find(
      (candidate) => candidate !== item && !candidate.hasAttribute('data-leaving'),
    );
    const target = next?.querySelector<HTMLElement>('button') ?? this.returnFocus;
    if (target?.isConnected) target.focus();
    else (document.activeElement as HTMLElement | null)?.blur();
  }

  // ─── Region ───

  private createRegion(): HTMLElement {
    const region = document.createElement('section');
    region.className = 'gui-toaster__region';
    region.setAttribute('popover', 'manual');

    const list = document.createElement('ol');
    list.className = 'gui-toaster__list';

    // Announcements go to two live regions of their own: the polite one waits until the user is
    // idle, the assertive one interrupts, for errors.
    const polite = document.createElement('div');
    polite.className = 'gui-visually-hidden';
    polite.setAttribute('role', 'status');
    polite.setAttribute('aria-atomic', 'false');
    const assertive = document.createElement('div');
    assertive.className = 'gui-visually-hidden';
    assertive.setAttribute('role', 'alert');
    assertive.setAttribute('aria-atomic', 'false');

    region.append(list, polite, assertive);
    region.addEventListener('pointerenter', () => this.setPaused('hovered', true));
    region.addEventListener('pointerleave', () => this.setPaused('hovered', false));
    region.addEventListener('focusin', this.onFocusIn);
    region.addEventListener('focusout', this.onFocusOut);
    region.addEventListener('keydown', this.onKeyDown);
    region.addEventListener('click', this.onClick);

    this.list = list;
    this.politeRegion = polite;
    this.assertiveRegion = assertive;
    return region;
  }

  /** Puts the region in the topmost `gui-dialog` modal, or back in the toaster. */
  private place = () => {
    const region = this.region;
    if (!region || !this.isConnected) return;
    const target = topmostModal() ?? this;
    // Moving an open popover closes it: `syncOpen` shows it again.
    if (region.parentNode !== target) target.append(region);
    this.syncOpen();
  };

  /** Shows the region while there are toasts, and hides it when there are none. */
  private syncOpen() {
    const region = this.region;
    if (!region?.isConnected || typeof region.showPopover !== 'function') return;
    const hasToasts = this.toasts.some((entry) => entry.shown);
    const open = isPopoverOpen(region);
    if (hasToasts && !open) region.showPopover();
    else if (!hasToasts && open) region.hidePopover();
  }

  /** Reads a toast out. The text goes in after the region shows, or it isn't announced. */
  private announce({ title, message, variant }: GuiToastOptions) {
    const live = variant === 'error' ? this.assertiveRegion : this.politeRegion;
    if (!live) return;
    const text = document.createElement('p');
    setTimeout(() => {
      text.textContent = title ? `${title}. ${message}` : message;
      live.append(text);
      setTimeout(() => text.remove(), ANNOUNCEMENT_LIFETIME);
    }, 100);
  }

  // ─── Timers ───

  private setPaused(reason: 'hovered' | 'focused' | 'pageHidden', value: boolean) {
    this[reason] = value;
    this.syncTimers();
  }

  private get paused() {
    return this.hovered || this.focused || this.pageHidden;
  }

  /** Runs the shown toasts' timers, or pauses them. */
  private syncTimers() {
    for (const entry of this.toasts) {
      if (this.paused || !this.isConnected) this.stopTimer(entry);
      else this.startTimer(entry);
    }
  }

  private startTimer(entry: ToastEntry) {
    if (entry.timer !== undefined || !entry.shown || entry.leaving) return;
    if (!Number.isFinite(entry.remaining) || this.paused || !this.isConnected) return;
    entry.startedAt = Date.now();
    entry.timer = setTimeout(() => {
      entry.timer = undefined;
      this.dismiss(entry.id, 'timeout');
    }, entry.remaining);
  }

  private stopTimer(entry: ToastEntry) {
    if (entry.timer === undefined) return;
    clearTimeout(entry.timer);
    entry.timer = undefined;
    entry.remaining -= Date.now() - (entry.startedAt ?? Date.now());
  }

  // ─── Events ───

  private onVisibility = () => this.setPaused('pageHidden', document.hidden);

  private onFocusIn = (event: FocusEvent) => {
    const from = event.relatedTarget as HTMLElement | null;
    if (!this.region?.contains(from)) this.returnFocus = from;
    this.setPaused('focused', true);
  };

  private onFocusOut = (event: FocusEvent) => {
    if (this.region?.contains(event.relatedTarget as Node | null)) return;
    this.setPaused('focused', false);
  };

  private toastOf(event: Event): HTMLElement | null {
    return (event.target as Element).closest?.<HTMLElement>('.gui-toast') ?? null;
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    const item = this.toastOf(event);
    if (!item?.dataset['id']) return;
    // Escape closes the toast, not the dialog the toasts may be in.
    event.preventDefault();
    event.stopPropagation();
    this.dismiss(item.dataset['id'], 'escape');
  };

  private onClick = (event: MouseEvent) => {
    const item = this.toastOf(event);
    const id = item?.dataset['id'];
    if (!item || !id) return;
    const button = (event.target as Element).closest('button');
    if (button?.classList.contains('gui-toast__close')) {
      this.dismiss(id, 'close');
    } else if (button?.classList.contains('gui-toast__action')) {
      const entry = this.toasts.find((candidate) => candidate.id === id);
      entry?.options.action?.onAction();
      dispatch<GuiActionEventDetail>(this, 'gui-action', { value: id, item });
      this.dismiss(id, 'action');
    }
  };
}

/** The events `gui-toaster` fires, with their types. */
export const GuiToasterEvents = {
  'gui-dismiss': fires<CustomEvent<GuiDismissEventDetail>>(),
  'gui-action': fires<CustomEvent<GuiActionEventDetail>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-toaster': GuiToaster;
  }
}

safeDefine('gui-toaster', GuiToaster);
