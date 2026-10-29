import { ReactiveElement, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { GUIAnchorController } from '../controllers/anchor.controller';
import { booleanAttribute } from '../utils/converters';
import { warnInDevelopment } from '../utils/dev';
import { dispatchToggle, fires, type GuiToggleEventDetail } from '../utils/events';
import { toPlacement, type GuiPlacement } from '../utils/placement';

export type { GuiPlacement } from '../utils/placement';

/** Whether a popover is showing. A browser, or a DOM, without the Popover API never shows one. */
const isShowing = (panel: HTMLElement | null): boolean => {
  try {
    return !!panel?.matches(':popover-open');
  } catch {
    return false;
  }
};

/** A `toggle` or `beforetoggle` event. `source`, the invoker, is newer than the typings. */
type PopoverToggleEvent = ToggleEvent & { source?: Element | null };

/**
 * A floating panel anchored to the element that opens it. The panel is the app's own element
 * with the `popover` attribute, so the browser shows it in the top layer, above everything, and
 * closes it on Escape or on a click outside it. The element places it next to its anchor and
 * keeps it there.
 *
 * ```html
 * <button popovertarget="filters">Filters</button>
 * <gui-popover placement="bottom-start">
 *   <div id="filters" popover>…</div>
 * </gui-popover>
 * ```
 *
 * The anchor is the element the `anchor` attribute names, else the invoker that opened the panel,
 * else the first element whose `popovertarget` or `commandfor` names it. Without one the browser
 * centers the panel in the viewport.
 *
 * When the panel closes with focus inside it, the browser returns focus to the invoker that opened
 * it. A panel opened from code has none, so the element returns focus to the anchor instead,
 * unless a press outside the panel closed it: the user is pointing somewhere else.
 *
 * The element adds nothing to the app's markup: the panel's `popover` attribute and id, and the
 * invoker's `popovertarget`, are the app's, so the server's HTML and the browser's agree.
 *
 * @fires gui-toggle - The user opened or closed the panel. `detail.open` is the new state.
 */
export class GuiPopover extends ReactiveElement {
  /** Where the panel sits next to its anchor. Start and end follow the reading direction. */
  @property() placement: GuiPlacement = 'bottom-start';

  /** The id of the element to anchor the panel to, when it is not the panel's invoker. */
  @property() anchor: string | undefined = undefined;

  /**
   * Whether the panel is open. Without a value it takes the panel's own state. Setting it opens or
   * closes the panel and fires no `gui-toggle`.
   */
  @property({ converter: booleanAttribute, reflect: true }) open: boolean | undefined = undefined;

  /** The invoker that opened the panel last, where the browser reports it. */
  private source: Element | null = null;

  private positioning = new GUIAnchorController(this, {
    floating: () => this.panel,
    anchor: () => this.anchorElement,
    placement: () => toPlacement(this.placement, 'bottom-start'),
  });

  private mutations?: MutationObserver;

  /** Whether the pointer last went down outside the open panel, which light dismisses it. */
  private pressedOutside = false;
  /** Whether the closing panel had focus, which goes to the anchor if the browser drops it. */
  private returnFocus = false;

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    // Neither event bubbles: capturing listeners see the panel's.
    this.addEventListener('beforetoggle', this.onBeforeToggle, true);
    this.addEventListener('toggle', this.onToggle, true);
    // The app can render, or re-render, the panel after the element connects.
    this.mutations = new MutationObserver(() => this.sync());
    this.mutations.observe(this, { childList: true });
    this.sync();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('beforetoggle', this.onBeforeToggle, true);
    this.removeEventListener('toggle', this.onToggle, true);
    this.mutations?.disconnect();
    this.watchPresses(false);
  }

  protected override updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    if (changedProperties.has('open')) this.sync();
    if ((changedProperties.has('placement') || changedProperties.has('anchor')) && this.isOpen) {
      this.positioning.attach();
    }
  }

  /** The app's panel: the element's `[popover]` child. */
  get panel(): HTMLElement | null {
    return this.querySelector(':scope > [popover]');
  }

  private get isOpen(): boolean {
    return isShowing(this.panel);
  }

  /** The element the panel is anchored to: see the class docs. */
  protected get anchorElement(): Element | null {
    const root = this.getRootNode() as Document | ShadowRoot;
    if (this.anchor) return root.getElementById?.(this.anchor) ?? null;
    if (this.source?.isConnected) return this.source;

    const id = this.panel?.id;
    if (!id) return null;
    // Inside a double-quoted attribute value only `"` and `\` need escaping.
    const escaped = id.replace(/["\\]/g, '\\$&');
    const invoker = root.querySelector(`[popovertarget="${escaped}"], [commandfor="${escaped}"]`);
    // A gui-button carries the commandfor of its inner button, the real invoker, once it renders.
    return invoker?.querySelector(`button[commandfor="${escaped}"]`) ?? invoker;
  }

  /** Brings the panel in line with `open`. */
  private sync() {
    const panel = this.panel;
    if (!panel) {
      // A framework can render the children after the element connects: only an open request
      // without a panel is a mistake.
      if (this.open) warnInDevelopment(this, 'has no [popover] child to show.');
      return;
    }

    const open = isShowing(panel);
    if (this.open === undefined) this.open = open;
    else if (this.open && !open) panel.showPopover();
    else if (!this.open && open) panel.hidePopover();
  }

  /** Places the panel before the browser shows it, so it never shows anywhere else. */
  private onBeforeToggle = (event: Event) => {
    const toggle = event as PopoverToggleEvent;
    const panel = this.panel;
    if (!panel || toggle.target !== panel) return;
    if (toggle.newState !== 'open') {
      this.returnFocus = panel.matches(':focus-within') && !this.pressedOutside;
      return;
    }

    this.source = toggle.source ?? null;
    if (!this.anchorElement) {
      warnInDevelopment(
        this,
        'found no anchor: set its anchor attribute, or open its panel with popovertarget or commandfor.',
      );
    }
    this.positioning.attach();
  };

  /** The panel opened or closed: by the user, when it no longer matches `open`. */
  private onToggle = (event: Event) => {
    const toggle = event as PopoverToggleEvent;
    if (toggle.target !== this.panel) return;

    const open = toggle.newState === 'open';
    // The panel is rendered by now: measuring places it here if nothing has yet.
    if (open) this.positioning.update();
    else this.positioning.detach();
    this.watchPresses(open);
    if (!open && this.returnFocus) this.focusAnchor();
    this.panelToggled(open);
    if (open === this.open) return;
    this.open = open;
    dispatchToggle(this, open);
  };

  /** Follows where the pointer goes down while the panel is open. */
  private watchPresses(watch: boolean) {
    this.pressedOutside = false;
    if (typeof document === 'undefined') return;
    if (watch) document.addEventListener('pointerdown', this.onPress, true);
    else document.removeEventListener('pointerdown', this.onPress, true);
  }

  private onPress = (event: PointerEvent) => {
    const panel = this.panel;
    this.pressedOutside = !!panel && !event.composedPath().includes(panel);
  };

  /**
   * The panel closed with focus inside it, and the browser had no invoker to return it to: focus
   * stays in the hidden panel until the browser drops it to the page's body. It goes to the anchor
   * instead, where the user can open the panel again.
   */
  private focusAnchor() {
    this.returnFocus = false;
    const active = this.ownerDocument.activeElement;
    const lost = !active || active === this.ownerDocument.body || !!this.panel?.contains(active);
    if (lost) (this.anchorElement as HTMLElement | null)?.focus?.();
  }

  /** Runs once the panel has opened or closed, however it did: for elements built on this one. */
  protected panelToggled(_open: boolean): void {
    // Nothing to do here.
  }
}

/** The events `gui-popover` fires, with their types. */
export const GuiPopoverEvents = {
  'gui-toggle': fires<CustomEvent<GuiToggleEventDetail>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-popover': GuiPopover;
  }
}

safeDefine('gui-popover', GuiPopover);
