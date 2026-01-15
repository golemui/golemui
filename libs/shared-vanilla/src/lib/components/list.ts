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
  @property({ type: String }) valueField = 'value';
  @property({ type: Array }) items: ListItem<unknown>[] = [];

  @property({ type: Number }) itemHeight = 40;
  @property({ type: Number }) buffer = 5;
  @property({ type: String }) height = '300px';

  @state() private _items: ListItem<any>[] = [];
  @state() private _scrollTop = 0;
  @state() private _viewportHeight = 0;

  @query('.gui-list-scroll-viewport') private viewportElement!: HTMLElement;

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
    const totalHeight = this.items.length * this.itemHeight;
    const { offsetY } = this.calculateRange();

    return html`
      <div
        class="gui-list-scroll-viewport"
        style="height: ${this.height}; overflow-y: auto; position: relative; display: block;"
        @scroll="${this.onScroll}"
      >
        <div
          class="gui-list-spacer"
          style="height: ${totalHeight}px; width: 1px; opacity: 0; pointer-events: none;"
        ></div>

        <div
          class="gui-list-content"
          style="transform: translateY(${offsetY}px); position: absolute; top: 0; left: 0; width: 100%;"
        >
          <slot></slot>
        </div>
      </div>
    `;
  }

  private updateItems() {
    this._items = updateListItems(this.items, { valueField: this.valueField } as ListProps<any>);

    this.dispatchEvent(
      new CustomEvent('gui-list-update-items', {
        detail: this._items,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private emitRangeChange() {
    const { startIndex, endIndex } = this.calculateRange();

    this.dispatchEvent(
      new CustomEvent('gui-list-range-change', {
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
    const totalItems = this.items.length;
    const visibleCount = Math.ceil(this._viewportHeight / this.itemHeight);
    const startNode = Math.floor(this._scrollTop / this.itemHeight);

    const startIndex = Math.max(0, startNode - this.buffer);
    const endIndex = Math.min(totalItems, startNode + visibleCount + this.buffer);

    const offsetY = startIndex * this.itemHeight;

    return { startIndex, endIndex, offsetY };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-list': GuiListControl;
  }
}
