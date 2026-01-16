import { html, LitElement, PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { ListItem, ListProps } from '../field.props';
import { OptionValue } from './one-of';
import { updateListItems } from './list-items';

@customElement('gui-list')
export class GuiListControl extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: Array }) errors: string[] | undefined = [];
  @property({ type: Boolean }) touched: boolean | undefined = false;
  @property({ type: Boolean }) required: boolean | undefined = false;
  @property({ type: Boolean }) disabled: boolean | undefined = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly: boolean | undefined = false;
  @property({ type: String }) value: OptionValue | undefined = undefined;
  @property({ type: String }) valueField: string | undefined = undefined;
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
    const activeId = this._focusedIndex >= 0 ? `${this.uid}-item-${this._focusedIndex}` : undefined;

    return html`
      <div
        role="listbox"
        tabindex=${this.disabled ? -1 : 0}
        class="gui-list__scroll-viewport"
        style="height: ${height}px; overflow-y: auto; position: relative; display: block;"
        @scroll="${this.onScroll}"
        @keydown="${this.onKeyDown}"
        @focus="${this.onFocus}"
        @focusout="${this.onFocusOut}"
        aria-required=${this.required}
        aria-disabled=${this.disabled || this.readOnly ? 'true' : 'false'}
        aria-labelledby=${`${this.uid}_label`}
        aria-describedby=${`${this.uid}_hint`}
        aria-activedescendant="${activeId || ''}"
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

  private onKeyDown(e: KeyboardEvent) {
    if (this.disabled || this.readOnly) return;

    const itemHeight = this.itemHeight ?? 40;
    const visibleCount = Math.ceil(this._viewportHeight / itemHeight);
    const maxIndex = this.items.length - 1;
    let handled = false;

    switch (e.key) {
      case 'ArrowDown':
        this.setFocusedIndex(Math.min(this._focusedIndex + 1, maxIndex));
        handled = true;
        break;
      case 'ArrowUp':
        this.setFocusedIndex(Math.max(this._focusedIndex - 1, 0));
        handled = true;
        break;
      case 'PageDown':
        this.setFocusedIndex(Math.min(this._focusedIndex + visibleCount, maxIndex));
        handled = true;
        break;
      case 'PageUp':
        this.setFocusedIndex(Math.max(this._focusedIndex - visibleCount, 0));
        handled = true;
        break;
      case 'Home':
        this.setFocusedIndex(0);
        handled = true;
        break;
      case 'End':
        this.setFocusedIndex(maxIndex);
        handled = true;
        break;
      case 'Enter':
      case ' ': {
        const value = this.items[this._focusedIndex];
        const hasValue = value !== undefined && value !== null;
        if (this._focusedIndex >= 0 && hasValue) {
          this.selectItem(this.items[this._focusedIndex]);
        }
        handled = true;
        break;
      }
    }

    if (handled) {
      e.preventDefault();
    }
  }

  private onFocus() {
    if (!this.value || !this.items.length) return;

    const selectedIndex = this.items.findIndex((item) => {
      const itemValue = this.valueField ? item[this.valueField as keyof ListItem<any>] : item;
      return itemValue === this.value;
    });

    this._focusedIndex = selectedIndex;

    this.dispatchEvent(
      new CustomEvent('gui-focus-change', {
        detail: { index: selectedIndex },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private onFocusOut(e: FocusEvent) {
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
  }

  private scrollToIndex(index: number) {
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
        detail: { value: this.valueField ? item[this.valueField as keyof ListItem<any>] : item },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private setFocusedIndex(index: number) {
    if (index < 0 || index >= this.items.length) return;

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
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-list': GuiListControl;
  }
}
