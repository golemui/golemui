import { type GuiPlacement } from '../utils/placement';
import { GUIAnchorController } from './anchor.controller';

export interface GUIFloatingPanelOptions {
  /** The panel, when it floats: `null`, or a panel without `popover`, stays where it is rendered. */
  panel(): HTMLElement | null | undefined;
  /** The element it is placed next to: the field. */
  anchor(): Element | null | undefined;
  /** Default `bottom-start`. A function is read on each placement, for one that changes. */
  placement?: GuiPlacement | (() => GuiPlacement);
  /** The gap between the field and the panel, in pixels. Default 2. */
  offset?: number;
  /** Whether the panel points an arrow at the field: see `GUIAnchorController`. */
  arrow?: boolean;
}

/** Whether a popover is showing. A DOM without the Popover API never shows one. */
const isShowing = (panel: HTMLElement): boolean => {
  try {
    return panel.matches(':popover-open');
  } catch {
    return false;
  }
};

/**
 * Shows a field's panel in the top layer while it is open, above every container that would clip
 * it (an `overflow` box, a modal dialog, a transformed drawer), placed next to the field and
 * flipped at the viewport's edges. The panel is rendered with `popover="manual"`; its owner keeps
 * deciding when it opens and closes, and calls `sync()` after each render.
 *
 * It needs no Lit host, so the Forms adapters of every framework use it too:
 *
 * ```ts
 * const floating = new GUIFloatingPanel({ panel: () => panelRef, anchor: () => fieldRef });
 * floating.sync(open); // after every render
 * floating.dispose(); // on unmount
 * ```
 */
export class GUIFloatingPanel {
  private readonly options: GUIFloatingPanelOptions;
  private readonly anchor: GUIAnchorController;
  /** The panel shown in the top layer, while it is open. */
  private shown: HTMLElement | null = null;

  constructor(options: GUIFloatingPanelOptions) {
    this.options = options;
    this.anchor = new GUIAnchorController(null, {
      floating: () => this.shown,
      anchor: () => options.anchor(),
      placement: () => {
        const { placement = 'bottom-start' } = options;
        return typeof placement === 'function' ? placement() : placement;
      },
      offset: options.offset ?? 2,
      arrow: options.arrow,
    });
  }

  /**
   * Shows the rendered panel in the top layer once it opens, and hides it once it closes. A panel
   * rendered only while open leaves the top layer with the DOM on its own.
   */
  sync(open: boolean): void {
    const panel = open ? (this.options.panel() ?? null) : null;
    if (panel === this.shown && (!panel || isShowing(panel))) return;

    this.hide();
    if (!panel?.hasAttribute('popover')) return;
    try {
      panel.showPopover();
    } catch {
      // No Popover API: the panel stays where it is rendered.
      return;
    }
    this.shown = panel;
    this.anchor.attach();
  }

  /** Places the shown panel again, after its placement or its anchor changed. */
  place(): void {
    if (this.shown) this.anchor.attach();
  }

  /** Hides the panel and stops placing it: on unmount. */
  dispose(): void {
    this.hide();
    this.anchor.dispose();
  }

  private hide() {
    if (!this.shown) return;
    if (this.shown.isConnected && isShowing(this.shown)) this.shown.hidePopover();
    this.anchor.detach();
    this.shown = null;
  }
}
