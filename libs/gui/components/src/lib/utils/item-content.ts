import { html, noChange, render } from 'lit';
import {
  AsyncDirective,
  directive,
  PartType,
  type ElementPart,
  type PartInfo,
} from 'lit/async-directive.js';
import type { ListItem } from '../types';

/** The state of an option, as `renderItem` gets it. */
export type GuiItemState = {
  /** The item is selected. */
  selected: boolean;
  /** The item is the active one, the one the keyboard is on. */
  focused: boolean;
  /** The item can't be picked. */
  disabled: boolean;
  /** The item's index in the items shown. */
  index: number;
};

/** What `renderItem` gets besides the item. */
export type GuiItemRenderContext = GuiItemState & {
  /** Lit's `html` tag, so the content can be a template without importing Lit. */
  html: typeof html;
  /**
   * The element the option's content goes into. To render into it yourself, with a component of
   * your framework, return nothing.
   */
  root: HTMLElement;
  /**
   * Registers what to run when the option leaves the list: when it scrolls out, the search hides
   * it or the panel closes. Only the last one registered runs.
   */
  onCleanup(cleanup: () => void): void;
};

/**
 * Renders the content of an option. It returns a template made with `html`, a text, which shows as
 * text and never as markup, or a node. Or it renders into `root` itself and returns nothing.
 */
export type GuiItemRenderer<T = any> = (
  item: ListItem<T>,
  context: GuiItemRenderContext,
) => unknown;

class ItemContentDirective extends AsyncDirective {
  private cleanup: (() => void) | undefined = undefined;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.ELEMENT) {
      throw new Error('itemContent() goes on an element');
    }
  }

  render(_renderer: GuiItemRenderer, _item: ListItem<unknown>, _state: GuiItemState) {
    return noChange;
  }

  override update(part: ElementPart, [renderer, item, state]: Parameters<this['render']>) {
    const root = part.element as HTMLElement;
    const content = renderer(item, {
      ...state,
      html,
      root,
      onCleanup: (cleanup) => {
        this.cleanup = cleanup;
      },
    });
    // Nothing returned: the renderer owns the element, so Lit must not render into it.
    if (content !== undefined) render(content, root);
    return noChange;
  }

  protected override disconnected() {
    const cleanup = this.cleanup;
    this.cleanup = undefined;
    cleanup?.();
  }
}

/** Renders an option's content into the element it's on, with a `renderItem` function. */
export const itemContent = directive(ItemContentDirective);
