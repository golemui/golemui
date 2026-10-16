import { ReactiveElement, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { GUIFloatingPanel } from '../controllers/floating-panel';
import { ensureId, setIfMissing } from '../utils/attributes';
import { booleanAttribute } from '../utils/converters';
import { warnInDevelopment } from '../utils/dev';
import { dispatchToggle, fires, type GuiToggleEventDetail } from '../utils/events';
import { toPlacement, type GuiPlacement } from '../utils/placement';

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
 * description. It never opens for touch: a tap activates the target instead. A disabled control
 * gets no pointer or focus events, so put the tooltip on an element around it, or use
 * `aria-disabled` instead of `disabled`.
 *
 * @fires gui-toggle - The tooltip opened or closed, from the pointer, focus or Escape.
 *   `detail.open` is the new state.
 */
export class GuiTooltip extends ReactiveElement {
  /** The id of the element the tooltip describes. */
  @property({ attribute: 'for' }) htmlFor: string | undefined = undefined;

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
      offset: 6,
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
    this.bind();
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
    if (changedProperties.has('open')) {
      this.floating.sync(!!this.open);
      this.listenForEscape(!!this.open);
    } else if (changedProperties.has('placement')) {
      this.floating.place();
    }
  }

  /** Finds the target, listens to it, and adds the tooltip to its description. */
  private bind() {
    const root = this.getRootNode() as Document | ShadowRoot;
    const target = this.htmlFor ? (root.getElementById?.(this.htmlFor) ?? null) : null;
    if (target === this.target) return;

    this.unbind();
    this.target = target;
    if (!target) {
      warnInDevelopment(this, 'found no element to describe: set its for attribute to an id.');
      return;
    }
    const ids = (target.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
    if (!ids.includes(this.id))
      target.setAttribute('aria-describedby', [...ids, this.id].join(' '));
    target.addEventListener('pointerenter', this.onPointerEnterTarget);
    target.addEventListener('pointerleave', this.onPointerLeave);
    target.addEventListener('pointerdown', this.onPointerDown);
    target.addEventListener('focusin', this.onFocusIn);
    target.addEventListener('focusout', this.onFocusOut);
  }

  private unbind() {
    const target = this.target;
    if (!target) return;
    const ids = (target.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .filter((id) => id && id !== this.id);
    if (ids.length) target.setAttribute('aria-describedby', ids.join(' '));
    else target.removeAttribute('aria-describedby');
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
