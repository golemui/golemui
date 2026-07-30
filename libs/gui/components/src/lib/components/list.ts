import { html, LitElement, type PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { updateListItems } from './list-items';
import type { ListItem, ListProps, OptionValue } from '@golemui/gui-shared/internals';

@customElement('gui-list')
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

  private syncHostAria() {
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
    const selectedIndex = this._items.findIndex((item) => item.value === this.value);
    this.scrollToIndex(selectedIndex);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.disabled || this.readOnly) return;

    const itemHeight = this.itemHeight ?? 40;
    const visibleCount = Math.ceil(this._viewportHeight / itemHeight);
    const maxIndex = this.items.length - 1;
    let handled = false;

    switch (e.key) {
      case 'ArrowDown':
        this.setFocusedIndex(this.findEnabledIndex(Math.min(this._focusedIndex + 1, maxIndex), 1));
        handled = true;
        break;
      case 'ArrowUp':
        this.setFocusedIndex(this.findEnabledIndex(Math.max(this._focusedIndex - 1, 0), -1));
        handled = true;
        break;
      case 'PageDown':
        this.setFocusedIndex(
          this.findEnabledIndex(Math.min(this._focusedIndex + visibleCount, maxIndex), 1),
        );
        handled = true;
        break;
      case 'PageUp':
        this.setFocusedIndex(
          this.findEnabledIndex(Math.max(this._focusedIndex - visibleCount, 0), -1),
        );
        handled = true;
        break;
      case 'Home':
        this.setFocusedIndex(this.findEnabledIndex(0, 1));
        handled = true;
        break;
      case 'End':
        this.setFocusedIndex(this.findEnabledIndex(maxIndex, -1));
        handled = true;
        break;
      case 'Enter':
      case ' ': {
        const item = this._items[this._focusedIndex];
        if (this._focusedIndex >= 0 && item != null && !item.disabled) {
          this.selectItem(item);
        }
        handled = true;
        break;
      }
    }

    if (handled) {
      e.preventDefault();
    }
  };

  private onFocus = () => {
    if (!this.value || !this.items.length) return;

    const selectedIndex = this._items.findIndex((item) => item.value === this.value);

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
        detail: { value: item.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * First enabled item index walking from `from` in `direction`, or -1 when
   * every item that way is disabled — keyboard navigation skips disabled rows.
   */
  private findEnabledIndex(from: number, direction: 1 | -1): number {
    for (let i = from; i >= 0 && i < this._items.length; i += direction) {
      if (!this._items[i]?.disabled) return i;
    }
    return -1;
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

if (typeof customElements !== 'undefined' && !customElements.get('gui-list')) {
  customElements.define('gui-list', GuiList);
}
