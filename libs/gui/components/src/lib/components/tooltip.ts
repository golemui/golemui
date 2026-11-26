import { ReactiveElement, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { GUIFloatingPanel } from '../controllers/floating-panel';
import { ensureId, setIfMissing, syncAttribute } from '../utils/attributes';
import { booleanAttribute } from '../utils/converters';
import { warnInDevelopment } from '../utils/dev';
import { dispatchToggle, fires, type GuiToggleEventDetail } from '../utils/events';
import { toPlacement, type GuiPlacement } from '../utils/placement';

/** What a tooltip's text is to its target: its description, or its name. */
export type GuiTooltipType = 'description' | 'label';

/**
 * A short text that describes another element, shown next to it while the pointer rests on it or
 * while it has keyboard focus. Its children are the text.
 *
 * ```html
 * <button id="save">Save</button>
 * <gui-tooltip for="save">Saves without publishing</gui-tooltip>
 * ```
 *
 * The element is the floating box: it shows in the top layer, above everything, placed next to its
 * target. It meets WCAG 1.4.13: Escape dismisses it, the pointer can move onto it without it
 * closing, and it stays until the pointer or focus leaves.
 *
 * It gives itself `role="tooltip"`, `popover="manual"` and an id when it has none, and adds the id
 * to the target's `aria-describedby`, so assistive technology reads the text as the target's
 * description. With `type="label"` the text is the target's name instead, such as the name of an
 * icon-only button: the app names the target with the same text (an `aria-label`), and the
 * tooltip adds no description, which would repeat it. It never opens for touch: a tap activates the target instead. A disabled control
 * gets no pointer or focus events, so put the tooltip on an element around it, or use
 * `aria-disabled` instead of `disabled`.
 *
 * @fires gui-toggle - The tooltip opened or closed, from the pointer, focus or Escape.
 *   `detail.open` is the new state.
 */
export class GuiTooltip extends ReactiveElement {
  /** The id of the element the tooltip describes. */
  @property({ attribute: 'for' }) htmlFor: string | undefined = undefined;

  /**
   * What the text is to the target: its `description` (the default), or its name, `label`, which
   * the app gives the target too. A label tooltip adds nothing to the target's `aria-describedby`.
   */
  @property() type: GuiTooltipType = 'description';

  /** Where the tooltip sits next to its target. Start and end follow the reading direction. */
  @property() placement: GuiPlacement = 'top';

  /** How long the pointer or focus rests on the target before the tooltip opens, in ms. */
  @property({ type: Number, attribute: 'open-delay' }) openDelay = 500;

  /** How long it stays after the pointer leaves, in ms: time to move the pointer onto it. */
  @property({ type: Number, attribute: 'close-delay' }) closeDelay = 150;

  /** Whether the tooltip is open. Setting it opens or closes it and fires no `gui-toggle`. */
  @property({ converter: booleanAttribute, reflect: true }) open: boolean | undefined = undefined;

  private target: HTMLElement | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;

  private readonly floating: GUIFloatingPanel;

  constructor() {
    super();
    this.floating = new GUIFloatingPanel({
      panel: () => this,
      anchor: () => this.target,
      placement: () => toPlacement(this.placement, 'top'),
      // Room for the arrow, which points at the target.
      offset: 8,
      arrow: true,
    });
  }

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    setIfMissing(this, 'popover', 'manual');
    setIfMissing(this, 'role', 'tooltip');
    ensureId(this, 'tooltip');
    this.addEventListener('pointerenter', this.onPointerEnterTooltip);
    this.addEventListener('pointerleave', this.onPointerLeave);
    // After the pending update: the target may render in the same pass, such as the button a
    // gui-button renders in its own first update.
    void this.updateComplete.then(() => {
      if (this.isConnected) this.bind();
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('pointerenter', this.onPointerEnterTooltip);
    this.removeEventListener('pointerleave', this.onPointerLeave);
    this.unbind();
    this.cancel();
    this.listenForEscape(false);
    this.floating.dispose();
  }

  protected override updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    if (changedProperties.has('htmlFor')) this.bind();
    else if (changedProperties.has('type') && this.target) this.describe(this.target);
    if (changedProperties.has('open')) {
      this.floating.sync(!!this.open);
      this.listenForEscape(!!this.open);
    } else if (changedProperties.has('placement')) {
      this.floating.place();
    }
  }

  /** Finds the target, listens to it, and adds the tooltip to its description, unless a label. */
  private bind() {
    const root = this.getRootNode() as Document | ShadowRoot;
    const target = this.htmlFor ? (root.getElementById?.(this.htmlFor) ?? null) : null;
    if (!target) {
      this.unbind();
      warnInDevelopment(this, 'found no element to describe: set its for attribute to an id.');
      return;
    }
    if (target === this.target) return;

    this.unbind();
    this.target = target;
    this.describe(target);
    target.addEventListener('pointerenter', this.onPointerEnterTarget);
    target.addEventListener('pointerleave', this.onPointerLeave);
    target.addEventListener('pointerdown', this.onPointerDown);
    target.addEventListener('focusin', this.onFocusIn);
    target.addEventListener('focusout', this.onFocusOut);
  }

  /** Adds the tooltip to the target's description, or takes it out for a label tooltip. */
  private describe(target: HTMLElement, describes = this.type !== 'label') {
    const ids = (target.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
    const others = ids.filter((id) => id !== this.id);
    const next = describes ? [...others, this.id] : others;
    if (describes && ids.includes(this.id)) return;
    if (next.length) syncAttribute(target, 'aria-describedby', next.join(' '));
    else target.removeAttribute('aria-describedby');
  }

  private unbind() {
    const target = this.target;
    if (!target) return;
    this.describe(target, false);
    target.removeEventListener('pointerenter', this.onPointerEnterTarget);
    target.removeEventListener('pointerleave', this.onPointerLeave);
    target.removeEventListener('pointerdown', this.onPointerDown);
    target.removeEventListener('focusin', this.onFocusIn);
    target.removeEventListener('focusout', this.onFocusOut);
    this.target = null;
  }

  /** Opens or closes it for the user, after `delay` ms, and reports the change. */
  private schedule(open: boolean, delay: number) {
    this.cancel();
    const apply = () => {
      if (open === !!this.open) return;
      this.open = open;
      dispatchToggle(this, open);
    };
    if (delay > 0) this.timer = setTimeout(apply, delay);
    else apply();
  }

  private cancel() {
    clearTimeout(this.timer);
    this.timer = undefined;
  }

  private onPointerEnterTarget = (event: PointerEvent) => {
    // A tap activates the target: there is no hover on a touch screen.
    if (event.pointerType === 'touch') return;
    this.schedule(true, this.open ? 0 : this.openDelay);
  };

  /** The pointer moved onto the tooltip: it stays open (WCAG 1.4.13, hoverable). */
  private onPointerEnterTooltip = () => {
    if (this.open) this.cancel();
  };

  private onPointerLeave = (event: PointerEvent) => {
    const to = event.relatedTarget as Node | null;
    // Moving between the target and the tooltip keeps it open.
    if (to && (this.contains(to) || this.target?.contains(to))) return;
    if (this.target?.matches(':focus-visible')) return;
    this.schedule(false, this.open ? this.closeDelay : 0);
  };

  /** Pressing the target (a button click) closes it: the user acted on what it described. */
  private onPointerDown = () => {
    this.schedule(false, 0);
  };

  private onFocusIn = () => {
    // Keyboard focus only: a click also focuses the target, and opens nothing.
    let keyboard = false;
    try {
      keyboard = !!this.target?.matches(':focus-visible');
    } catch {
      keyboard = true;
    }
    if (keyboard) this.schedule(true, this.openDelay);
  };

  private onFocusOut = () => {
    this.schedule(false, 0);
  };

  private listenForEscape(listen: boolean) {
    if (typeof document === 'undefined') return;
    if (listen) document.addEventListener('keydown', this.onKeyDown, true);
    else document.removeEventListener('keydown', this.onKeyDown, true);
  }

  /** Escape dismisses it without moving the pointer or focus (WCAG 1.4.13), and nothing else. */
  private onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !this.open) return;
    event.preventDefault();
    event.stopPropagation();
    this.schedule(false, 0);
  };
}

/** The events `gui-tooltip` fires, with their types. */
export const GuiTooltipEvents = {
  'gui-toggle': fires<CustomEvent<GuiToggleEventDetail>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-tooltip': GuiTooltip;
  }
}

safeDefine('gui-tooltip', GuiTooltip);
