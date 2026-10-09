import { css, html, render, type PropertyValues } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { cspStyleMap } from '@golemui/lit-utils';
import { safeDefine } from '@golemui/lit-utils';
import { gridKeyStep, listPageSize, nextEnabledIndex } from '../utils/grid-nav';
import { updateListItems } from './list-items';
import type { GuiVisibleItem, ListItem, ListItemInput, OptionValue } from '../types';
import { GuiFormControl } from '../gui-form-control';
import { dispatch, dispatchBlur, dispatchValue, fires, valueEvents } from '../utils/events';
import { addErrors, showsErrors } from '../utils/templates';

/**
 * A virtualized listbox to pick one item, with keyboard navigation. It renders no items: render
 * `visibleItems` as its children, and update them on `gui-visible-items-change`. A click on an
 * option picks it.
 *
 * @fires gui-visible-items-change - The items to render changed: the user scrolled, `items`
 *   changed, or an item was selected or became the active one. `detail` is the new
 *   `visibleItems`.
 * @fires gui-input - The user changed the value. `detail.value` is the new value.
 * @fires gui-change - The user committed the value. `detail.value` is the committed value.
 * @fires gui-blur - Focus left the control.
 * @fires gui-focus-change - The focused item changed. `detail.index` is its index, or -1.
 * @fires gui-range-change - The rendered items changed while scrolling. `detail` has the
 *   `startIndex` and `endIndex`.
 * @fires gui-update-items - The items were normalized. `detail` is the list of items.
 */
export class GuiList extends GuiFormControl {
  // Inline `style` attributes are blocked by a strict `style-src` CSP: static rules
  // live here (adopted stylesheet) and dynamic values go through `cspStyleMap` (CSSOM)
  static override styles = css`
    .gui-list__scroll-viewport {
      display: block;
      position: relative;
      min-height: 40px;
      overflow-y: auto;
    }

    .gui-list__spacer {
      width: 1px;
      opacity: 0;
      pointer-events: none;
    }

    .gui-list__content {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
    }
  `;

  /** The value of the selected item. */
  @property({ type: String }) value: OptionValue | undefined = undefined;
  /** For items given as objects, the key of the value. */
  @property({ type: String, attribute: 'value-field' }) valueField: string | undefined = undefined;
  /**
   * The items of the list: values, or objects whose value `value-field` names. The list
   * normalizes them to `{ template, value }` objects, the detail of `gui-update-items`.
   */
  @property({ type: Array }) items: ListItemInput[] = [];

  /** Height of each item, in pixels. Needed to virtualize the list. */
  @property({ type: Number, attribute: 'item-height' }) itemHeight: number | undefined = undefined;
  /** Height of the scrollable list, in pixels. */
  @property({ type: Number }) height: number | undefined = undefined;

  @state() private _items: ListItem<any>[] = [];
  @state() private _scrollTop = 0;
  @state() private _viewportHeight = 0;
  @state() private _focusedIndex = -1;

  @query('.gui-list__scroll-viewport') private viewportElement!: HTMLElement;

  private _visibleItems: GuiVisibleItem[] = [];

  /**
   * The items to render: the ones in view and five more on each side, each with its index, its
   * option id and its state. Render one option per entry, as the list's children.
   */
  get visibleItems(): GuiVisibleItem[] {
    return this._visibleItems;
  }

  private buffer = 5;
  // Whether the list shows errors set on it, and so owns its invalid state (see syncHostAria).
  private showsOwnErrors = false;
  private errorsElement: HTMLElement | undefined = undefined;

  override willUpdate(changedProperties: PropertyValues) {
    super.willUpdate(changedProperties);
    if (changedProperties.has('items')) {
      this.updateItems();
    }
    if (
      changedProperties.has('items') ||
      changedProperties.has('_scrollTop') ||
      changedProperties.has('height')
    ) {
      this.emitRangeChange();
    }
    this.updateVisibleItems();
    this.syncHostAria();
  }

  protected syncHostAria() {
    this.setAttribute('role', 'listbox');
    this.tabIndex = this.disabled ? -1 : 0;

    const toggleAttr = (attr: string, value: string | null) => {
      if (value === null) {
        this.removeAttribute(attr);
      } else {
        this.setAttribute(attr, value);
      }
    };

    toggleAttr('aria-required', this.required ? 'true' : null);
    toggleAttr('aria-disabled', this.disabled ? 'true' : null);
    toggleAttr('aria-readonly', this.readOnly ? 'true' : null);

    // GolemUI Forms leaves `errors` unset: its host renders them next to the list and its
    // <gui-label> marks the list invalid. So the list only sets, and clears, the invalid state
    // of errors set on it, and leaves the host's alone.
    const showErrors = showsErrors(this.touched, this.errors);
    if (showErrors || this.showsOwnErrors) {
      toggleAttr('aria-invalid', showErrors ? 'true' : null);
      toggleAttr('aria-errormessage', showErrors ? `${this.uid}_errors` : null);
    }
    this.showsOwnErrors = showErrors;

    toggleAttr(
      'aria-activedescendant',
      this._focusedIndex >= 0 ? `${this.uid}-item-${this._focusedIndex}` : null,
    );
    toggleAttr('aria-label', this.label ?? null);
    toggleAttr('aria-description', this.hint ?? null);
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('keydown', this.onKeyDown);
    this.addEventListener('focus', this.onFocus);
    this.addEventListener('focusout', this.onFocusOut);
    this.addEventListener('click', this.onClick);
  }

  override firstUpdated() {
    this.measureViewport();
    new ResizeObserver(() => this.measureViewport()).observe(this.viewportElement);
  }

  override updated() {
    this.renderErrors();
  }

  /**
   * Renders the errors set on the list into its light DOM, slotted under the items: that is where
   * `aria-errormessage` can reach them, since an id reference does not cross into a shadow root.
   * Created on the first errors, so a list whose host renders them gets none.
   */
  private renderErrors() {
    if (!this.errorsElement) {
      if (!this.showsOwnErrors) return;
      this.errorsElement = document.createElement('div');
      this.errorsElement.slot = 'errors';
      this.errorsElement.className = 'gui-list__errors';
      this.append(this.errorsElement);
    }
    render(addErrors(this.uid, { errors: this.errors, touched: this.touched }), this.errorsElement);
  }

  override render() {
    const height = this.height ?? 300;
    const itemHeight = this.itemHeight ?? 40;
    const totalHeight = (this.items?.length ?? 0) * itemHeight;
    const { offsetY } = this.calculateRange();

    return html`
      <div
        class="gui-list__scroll-viewport"
        style=${cspStyleMap({ 'max-height': `${height}px` })}
        tabindex="-1"
        @scroll="${this.onScroll}"
      >
        <div class="gui-list__spacer" style=${cspStyleMap({ height: `${totalHeight}px` })}></div>

        <div
          class="gui-list__content"
          style=${cspStyleMap({ transform: `translateY(${offsetY}px)` })}
        >
          <slot></slot>
        </div>
      </div>
      <slot name="errors"></slot>
    `;
  }

  /** @internal */
  public focusItemAtIndex(index: number) {
    this._focusedIndex = index;
  }

  /** @internal */
  public scrollToSelectedIndex() {
    this.scrollToIndex(this.findSelectedIndex());
  }

  protected hasSelection(): boolean {
    return !!this.value;
  }

  protected isSelected(value: OptionValue): boolean {
    return value === this.value;
  }

  /** Index of the (first) selected item, or -1 when nothing is selected */
  protected findSelectedIndex(): number {
    return this._items.findIndex((item) => this.isSelected(item.value));
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Read-only: the items can be browsed, not picked.
      if (this.readOnly) return;
      const item = this._items[this._focusedIndex];
      if (this._focusedIndex >= 0 && item != null && !item.disabled) {
        this.selectItem(item);
      }
      return;
    }

    const intent = gridKeyStep(e.key, {
      columns: 1,
      isRTL: false,
      pageSize: listPageSize(this._viewportHeight || this.height, this.itemHeight, 1),
    });
    if (intent.kind === 'none') return;

    e.preventDefault();

    const length = this._items.length;
    const isDisabled = (i: number) => !!this._items[i]?.disabled;

    if (intent.kind === 'edge') {
      const start = intent.edge === 'first' ? 0 : length - 1;
      const step = intent.edge === 'first' ? 1 : -1;
      this.setFocusedIndex(
        nextEnabledIndex(start, step, length, isDisabled, {
          includeStart: true,
          outOfBounds: 'none',
        }),
      );
      return;
    }

    const landing = Math.max(0, Math.min(this._focusedIndex + intent.delta, length - 1));
    this.setFocusedIndex(
      nextEnabledIndex(landing, intent.delta > 0 ? 1 : -1, length, isDisabled, {
        includeStart: true,
        outOfBounds: 'none',
      }),
    );
  };

  /** A click on one of the list's options picks its item, as Enter does. */
  private onClick = (e: MouseEvent) => {
    if (this.disabled || this.readOnly) return;

    // The option is the element with this list's option id: an app may nest elements inside it.
    const prefix = `${this.uid}-item-`;
    const option = (e.target as Element | null)?.closest?.(`[id^="${CSS.escape(prefix)}"]`);
    if (!option || !this.contains(option)) return;
    const index = Number(option.id.slice(prefix.length));
    const item = this._items[index];
    if (!item || item.disabled) return;

    this._focusedIndex = index;
    dispatch(this, 'gui-focus-change', { index });
    this.selectItem(item);
  };

  private onFocus = () => {
    if (!this.hasSelection() || !this.items.length) return;

    const selectedIndex = this.findSelectedIndex();

    this._focusedIndex = selectedIndex;
    this.scrollToIndex(selectedIndex);

    dispatch(this, 'gui-focus-change', { index: selectedIndex });
  };

  private onFocusOut = (e: FocusEvent) => {
    if (e.relatedTarget && this.contains(e.relatedTarget as Node)) {
      return;
    }

    this._focusedIndex = -1;

    dispatch(this, 'gui-focus-change', { index: -1 });
    dispatchBlur(this);
  };

  /** @internal */
  public scrollToIndex(index: number) {
    const itemHeight = this.itemHeight ?? 40;
    const viewportHeight = this.height ?? 300;

    const itemTop = index * itemHeight;
    const itemBottom = itemTop + itemHeight;

    const scrollTop = this.viewportElement.scrollTop;
    const scrollBottom = scrollTop + viewportHeight;

    if (itemTop < scrollTop) {
      this.viewportElement.scrollTop = itemTop;
    } else if (itemBottom > scrollBottom) {
      this.viewportElement.scrollTop = itemBottom - viewportHeight;
    }
  }

  /** The user picked an item: the list reports it as its new value. */
  protected selectItem(item: ListItem<any>) {
    this.value = item.value;
    dispatchValue(this, item.value);
  }

  private setFocusedIndex(index: number) {
    if (index < 0 || index >= this._items.length) return;

    this._focusedIndex = index;
    this.scrollToIndex(index);

    dispatch(this, 'gui-focus-change', { index });
  }

  private updateItems() {
    this._items = updateListItems(this.items, { valueField: this.valueField });

    dispatch(this, 'gui-update-items', this._items);
  }

  /** Recomputes `visibleItems`, and reports them when they changed. */
  private updateVisibleItems() {
    const { startIndex, endIndex } = this.calculateRange();
    const next = this._items.slice(startIndex, endIndex).map((item, offset): GuiVisibleItem => {
      const index = startIndex + offset;
      return {
        template: item.template,
        value: item.value,
        index,
        id: `${this.uid}-item-${index}`,
        selected: this.isSelected(item.value),
        focused: index === this._focusedIndex,
        disabled: !!this.disabled || !!item.disabled,
      };
    });

    const previous = this._visibleItems;
    const same =
      next.length === previous.length &&
      next.every((entry, i) => {
        const old = previous[i];
        return (
          entry.template === old.template &&
          entry.value === old.value &&
          entry.index === old.index &&
          entry.id === old.id &&
          entry.selected === old.selected &&
          entry.focused === old.focused &&
          entry.disabled === old.disabled
        );
      });
    if (same) return;

    this._visibleItems = next;
    dispatch(this, 'gui-visible-items-change', next);
  }

  private emitRangeChange() {
    const { startIndex, endIndex } = this.calculateRange();

    dispatch(this, 'gui-range-change', { startIndex, endIndex });
  }

  private measureViewport() {
    if (this.viewportElement) {
      this._viewportHeight = this.viewportElement.offsetHeight;
      this.emitRangeChange();
    }
  }

  private onScroll(e: Event) {
    const target = e.target as HTMLElement;
    this._scrollTop = target.scrollTop;
  }

  private calculateRange() {
    const itemHeight = this.itemHeight ?? 40;
    const totalItems = this.items?.length ?? 0;
    const visibleCount = Math.ceil(this._viewportHeight / itemHeight);
    const startNode = Math.floor(this._scrollTop / itemHeight);

    const startIndex = Math.max(0, startNode - this.buffer);
    const endIndex = Math.min(totalItems, startNode + visibleCount + this.buffer);

    const offsetY = startIndex * itemHeight;

    return { startIndex, endIndex, offsetY };
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this.onKeyDown);
    this.removeEventListener('focus', this.onFocus);
    this.removeEventListener('focusout', this.onFocusOut);
    this.removeEventListener('click', this.onClick);
  }
}

/** The events `gui-list` fires, with their types. */
export const GuiListEvents = {
  ...valueEvents<GuiList['value']>(),
  'gui-focus-change': fires<CustomEvent<{ index: number }>>(),
  'gui-range-change': fires<CustomEvent<{ startIndex: number; endIndex: number }>>(),
  'gui-update-items': fires<CustomEvent<ListItem<unknown>[]>>(),
  'gui-visible-items-change': fires<CustomEvent<GuiVisibleItem[]>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-list': GuiList;
  }
}

safeDefine('gui-list', GuiList);
