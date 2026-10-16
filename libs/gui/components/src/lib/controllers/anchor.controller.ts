import { type ReactiveController, type ReactiveControllerHost } from 'lit';
import { computePosition, placementStyles, type GuiPlacement } from '../utils/placement';

export interface GUIAnchorControllerOptions {
  /** The floating element. It must be in the top layer: an open `[popover]` or a modal dialog. */
  floating(): HTMLElement | null | undefined;
  /** The element it is placed next to. */
  anchor(): Element | null | undefined;
  placement(): GuiPlacement;
  /** The gap between the anchor and the floating element, in pixels. Default 4. */
  offset?: number;
}

let nextAnchor = 0;

/** Whether the browser places elements with CSS anchor positioning. */
const supportsAnchorPositioning = () =>
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  CSS.supports('position-area', 'self-block-end') &&
  CSS.supports('anchor-name', '--gui-anchor');

/**
 * Places a floating element next to an anchor element, and keeps it there while it is open.
 *
 * Where the browser has CSS anchor positioning, the controller names the anchor (a name of its
 * own, so instances never collide) and gives the floating element the `position-area` of the
 * placement, with the fallbacks that flip it when it does not fit. The browser then follows
 * scrolling and resizing on its own.
 *
 * Elsewhere, or where CSS would place it wrongly (see `shouldMeasure`), it measures both elements,
 * moves the floating one into place from the viewport's corner, flips it the same way, and places
 * it again on scroll, on resize and when either element changes size. TODO(2028-07): remove this
 * path once anchor positioning is widely available and Firefox places mixed directions right.
 *
 * On both paths the floating element gets the anchor's width in `--gui-anchor-width`, for its
 * stylesheet to size it from: a dropdown's panel is as wide as its field.
 *
 * Every style goes through the CSSOM, never a `style` attribute, so a strict Content Security
 * Policy allows it.
 *
 * ```ts
 * const anchor = new GUIAnchorController(this, {
 *   floating: () => this.panel,
 *   anchor: () => this.invoker,
 *   placement: () => this.placement,
 * });
 * anchor.attach(); // once the floating element is open
 * anchor.detach(); // when it closes
 * ```
 */
export class GUIAnchorController implements ReactiveController {
  /** Forces the measuring path where the CSS path is available: for tests only. */
  static forceFallback = false;

  private readonly name = `--gui-anchor-${++nextAnchor}`;
  private readonly options: GUIAnchorControllerOptions;

  /** The anchor that carries the name, and the anchor-name it had before. */
  private named?: { element: HTMLElement | SVGElement; previous: string };
  /** The floating element the controller styled, and the properties it set. */
  private styled?: { element: HTMLElement; properties: Set<string> };

  /** Whether the element in place measures, decided on each `attach()`. */
  private measuring = false;
  private tracking = false;
  private frame = 0;
  private resizeObserver?: ResizeObserver;

  /**
   * @param host - The Lit element whose disconnection clears the controller, or `null` for code
   *   without one, which calls `dispose()` itself.
   */
  constructor(host: ReactiveControllerHost | null, options: GUIAnchorControllerOptions) {
    this.options = options;
    host?.addController(this);
  }

  /**
   * Whether the controller places this floating element by measuring it rather than with CSS:
   * where the browser has no anchor positioning, and where the element's direction differs from
   * the page's. Firefox (156) places the inline axis wrongly then, e.g. a right-to-left panel in a
   * left-to-right page. TODO: drop the direction check once Firefox fixes it.
   */
  private shouldMeasure(floating: HTMLElement): boolean {
    if (GUIAnchorController.forceFallback || !supportsAnchorPositioning()) return true;
    const pageDirection = getComputedStyle(floating.ownerDocument.documentElement).direction;
    return getComputedStyle(floating).direction !== pageDirection;
  }

  /**
   * Places the floating element next to the anchor, and follows the anchor until `detach()`.
   * Calling it again, with a new anchor or placement, places it again.
   */
  attach(): void {
    const floating = this.options.floating();
    const anchor = this.options.anchor();
    if (!floating || !anchor) return;

    // Starts over: the element, the anchor or the path may have changed since the last time.
    this.clear();
    const offset = this.options.offset ?? 4;

    this.measuring = this.shouldMeasure(floating);
    if (this.measuring) {
      // Pinned to the top left corner and moved with `translate`: its size, which shrinks to fit
      // the room its position leaves, then never depends on where it is.
      this.set(floating, { position: 'fixed', inset: '0 auto auto 0', margin: '0' });
      this.update();
      this.track(anchor, floating);
      return;
    }

    this.nameAnchor(anchor);
    this.set(floating, {
      position: 'fixed',
      inset: 'auto',
      'position-anchor': this.name,
      ...placementStyles(this.options.placement(), offset),
      '--gui-anchor-width': 'anchor-size(width)',
    });
  }

  /**
   * Stops following the anchor. The floating element keeps its place, so it does not jump while
   * it animates out.
   */
  detach(): void {
    if (!this.tracking) return;
    this.tracking = false;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    window.removeEventListener('scroll', this.schedule, true);
    window.removeEventListener('resize', this.schedule);
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
  }

  /**
   * Places the floating element again now, on the measuring path. It waits while the element is
   * not rendered yet (a popover about to open): its size would read as zero.
   */
  update(): void {
    const floating = this.options.floating();
    const anchor = this.options.anchor();
    if (!floating || !anchor || !this.measuring || !floating.getClientRects().length) return;

    const anchorBox = anchor.getBoundingClientRect();
    this.set(floating, { '--gui-anchor-width': `${anchorBox.width}px` });

    const view = floating.ownerDocument.documentElement;
    const { x, y } = computePosition({
      anchor: anchorBox,
      // The layout size: an entry transition may be scaling the element.
      floating: { width: floating.offsetWidth, height: floating.offsetHeight },
      viewport: { width: view.clientWidth, height: view.clientHeight },
      placement: this.options.placement(),
      offset: this.options.offset ?? 4,
      rtl: getComputedStyle(floating).direction === 'rtl',
    });
    this.set(floating, { translate: `${x}px ${y}px` });
  }

  /** Stops following the anchor and removes every style the controller set. */
  dispose(): void {
    this.detach();
    this.clear();
  }

  hostDisconnected(): void {
    this.dispose();
  }

  private track(anchor: Element, floating: HTMLElement) {
    if (this.tracking) this.detach();
    this.tracking = true;
    // Scrolling any container can move the anchor: the capture phase sees every scroll event.
    window.addEventListener('scroll', this.schedule, { capture: true, passive: true });
    window.addEventListener('resize', this.schedule, { passive: true });
    if (typeof ResizeObserver !== 'undefined') {
      // Resize observations arrive after layout and before paint, so placing the element there
      // draws it in place from its first frame, even when it was measured hidden.
      this.resizeObserver = new ResizeObserver(() => this.update());
      this.resizeObserver.observe(anchor);
      this.resizeObserver.observe(floating);
    }
  }

  private schedule = () => {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.update();
    });
  };

  private nameAnchor(anchor: Element) {
    const element = anchor as HTMLElement | SVGElement;
    const previous = element.style.getPropertyValue('anchor-name');
    this.named = { element, previous };
    element.style.setProperty('anchor-name', previous ? `${previous}, ${this.name}` : this.name);
  }

  private unname() {
    if (!this.named) return;
    const { element, previous } = this.named;
    if (previous) element.style.setProperty('anchor-name', previous);
    else element.style.removeProperty('anchor-name');
    this.named = undefined;
  }

  private set(element: HTMLElement, declarations: Record<string, string>) {
    if (!this.styled) this.styled = { element, properties: new Set() };
    for (const [property, value] of Object.entries(declarations)) {
      element.style.setProperty(property, value);
      this.styled.properties.add(property);
    }
  }

  /** Removes every style the controller set, from both elements. */
  private clear() {
    this.unname();
    if (!this.styled) return;
    const { element, properties } = this.styled;
    for (const property of properties) element.style.removeProperty(property);
    this.styled = undefined;
  }
}
