import { html, LitElement, type PropertyValues } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit/internals';
import { gridKeyStep, listPageSize, nextEnabledIndex } from '../utils/grid-nav';
import { updateListItems } from './list-items';
import type { ListItem, ListProps, OptionValue } from '@golemui/gui-shared/internals';

export class GuiList extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: Boolean }) touched: boolean | undefined = false;
  @property({ type: Boolean }) required: boolean | undefined = false;
  @property({ type: Boolean }) disabled: boolean | undefined = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly: boolean | undefined = false;
  @property({ type: String }) value: OptionValue | undefined = undefined;
  @property({ type: String }) valueField: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: Array }) items: ListItem<unknown>[] = [];

  @property({ type: Number }) itemHeight: number | undefined = undefined;
  @property({ type: Number }) height: number | undefined = undefined;

  @state() private _items: ListItem<any>[] = [];
  @state() private _scrollTop = 0;
  @state() private _viewportHeight = 0;
  @state() private _focusedIndex = -1;

  @query('.gui-list__scroll-viewport') private viewportElement!: HTMLElement;

  private buffer = 5;

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
    toggleAttr('aria-disabled', this.disabled || this.readOnly ? 'true' : null);
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
  }

  override firstUpdated() {
    this.measureViewport();
    new ResizeObserver(() => this.measureViewport()).observe(this.viewportElement);
  }

  override render() {
    const height = this.height ?? 300;
    const itemHeight = this.itemHeight ?? 40;
    const totalHeight = (this.items?.length ?? 0) * itemHeight;
    const { offsetY } = this.calculateRange();

    return html`
      <div
        class="gui-list__scroll-viewport"
        style="max-height: ${height}px; min-height: 40px; overflow-y: auto; position: relative; display: block;"
        tabindex="-1"
        @scroll="${this.onScroll}"
      >
        <div
          class="gui-list__spacer"
          style="height: ${totalHeight}px; width: 1px; opacity: 0; pointer-events: none;"
        ></div>

        <div
          class="gui-list__content"
          style="transform: translateY(${offsetY}px); position: absolute; top: 0; left: 0; width: 100%;"
        >
          <slot></slot>
        </div>
      </div>
    `;
  }

  public focusItemAtIndex(index: number) {
    this._focusedIndex = index;
  }

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
    if (this.disabled || this.readOnly) return;

    if (e.key === 'Enter' || e.key === ' ') {
      const item = this._items[this._focusedIndex];
      if (this._focusedIndex >= 0 && item != null && !item.disabled) {
        this.selectItem(item);
      }
      e.preventDefault();
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

  private onFocus = () => {
    if (!this.hasSelection() || !this.items.length) return;

    const selectedIndex = this.findSelectedIndex();

    this._focusedIndex = selectedIndex;
    this.scrollToIndex(selectedIndex);

    this.dispatchEvent(
      new CustomEvent('gui-focus-change', {
        detail: { index: selectedIndex },
        bubbles: true,
        composed: true,
      }),
    );
  };

  private onFocusOut = (e: FocusEvent) => {
    if (e.relatedTarget && this.contains(e.relatedTarget as Node)) {
      return;
    }

    this._focusedIndex = -1;

    this.dispatchEvent(
      new CustomEvent('gui-focus-change', {
        detail: { index: -1 },
        bubbles: true,
        composed: true,
      }),
    );

    this.dispatchEvent(new CustomEvent('blur', { bubbles: true, composed: true }));
  };

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

  private selectItem(item: ListItem<any>) {
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: item.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private setFocusedIndex(index: number) {
    if (index < 0 || index >= this._items.length) return;

    this._focusedIndex = index;
    this.scrollToIndex(index);

    this.dispatchEvent(
      new CustomEvent('gui-focus-change', {
        detail: { index },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private updateItems() {
    this._items = updateListItems(this.items, { valueField: this.valueField } as ListProps<any>);

    this.dispatchEvent(
      new CustomEvent('gui-update-items', {
        detail: this._items,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private emitRangeChange() {
    const { startIndex, endIndex } = this.calculateRange();

    this.dispatchEvent(
      new CustomEvent('gui-range-change', {
        detail: { startIndex, endIndex },
        bubbles: true,
        composed: true,
      }),
    );
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
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-list': GuiList;
  }
}

safeDefine('gui-list', GuiList);
