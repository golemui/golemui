import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { ListItem, ListProps } from '@golemui/shared-vanilla';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { Subscription } from 'rxjs';
import { defaultListItemRenderer } from './default-list-item-renderer';

@customElement('gui-list-control')
export class ListElement extends LitElement implements Core.WithField {
  field!: Core.ControlField<string>;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.controlContext })
  adapter = new Lit.ControlFieldAdapter<string, ListProps<any>>();

  subscriptions: Subscription[] = [];

  @state() private _range = { start: 0, end: 10 };
  @state() private _listItems: ListItem<any>[] = [];
  @state() private _focusedIndex = -1;

  @query('gui-list') private _guiListRef!: any;

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-list');
    this.adapter.context = this.formContext;
    this.adapter.init(this.field);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => {
        const data = this.adapter.templateData;
        if (data.items && this._listItems.length === 0) {
          this._listItems = data.items;
        }
        this.requestUpdate();
      }),
    );
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  override updated(changedProperties: any) {
    super.updated(changedProperties);

    const size = this.adapter.templateData.size;

    if (size) {
      this.style.flex = String(size);
    } else {
      this.style.removeProperty('flex');
    }
  }

  override render() {
    const data = this.adapter.templateData;
    const visibleItems = this._listItems.slice(this._range.start, this._range.end);

    const itemRenderer = this.adapter.getItemRenderer(data.itemRenderer, defaultListItemRenderer);

    return html`
      <gui-label
        .targetElement=${this._guiListRef}
        .uid=${this.field.uid}
        .label=${data.label}
        .hint=${data.hint}
        .errors=${data.errors}
        .touched=${data.touched}
        .required=${data.validator?.required}
      ></gui-label>

      <div class="gui-field">
        <gui-list
          id=${this.field.uid}
          .uid=${this.field.uid}
          .value=${data.value ?? ''}
          .valueField=${data.valueField}
          .items=${data.items}
          .itemHeight=${data.itemHeight}
          .height=${data.height}
          ?required=${data.validator?.required}
          ?touched=${data.touched}
          ?disabled=${data.disabled}
          ?readonly=${data.readonly}
          @gui-range-change=${this._onRangeChange}
          @gui-update-items=${this._onUpdateItems}
          @gui-focus-change=${this._onFocusChange}
          @blur=${() => this.adapter.onBlur()}
          @change=${this._valueChanged}
        >
          ${visibleItems.map((item, index) => {
            const absoluteIndex = this._range.start + index;
            const isSelected = data.value === item.value;
            const isFocused = this._focusedIndex === absoluteIndex;

            return html`
              <div
                role="option"
                tabindex="-1"
                class="gui-list__item-wrapper"
                id="${this.field.uid}-item-${absoluteIndex}"
                style="height: ${data.itemHeight || 40}px"
                aria-selected=${isSelected ? 'true' : 'false'}
                aria-disabled=${data.disabled ? 'true' : 'false'}
                @click=${() => this._onClickItem(item, absoluteIndex)}
              >
                ${itemRenderer({
                  template: item.template as string,
                  value: item.value,
                  index: absoluteIndex,
                  selected: isSelected,
                  disabled: !!data.disabled,
                  focused: isFocused,
                })}
              </div>
            `;
          })}
        </gui-list>
      </div>

      <gui-errors .errors=${data.errors} .touched=${data.touched}></gui-errors>
    `;
  }

  private _onRangeChange(e: CustomEvent) {
    this._range = { start: e.detail.startIndex, end: e.detail.endIndex };
  }

  private _onUpdateItems(e: CustomEvent) {
    this._listItems = e.detail || [];
  }

  private _onFocusChange(e: CustomEvent) {
    this._focusedIndex = e.detail.index;
  }

  private _onClickItem(item: ListItem<any>, index: number) {
    if (this.adapter.templateData.disabled) return;

    this.adapter.valueChanged(item.value);

    this._focusedIndex = index;

    if (this._guiListRef && typeof this._guiListRef.focusItemAtIndex === 'function') {
      this._guiListRef.focusItemAtIndex(index);
    }
  }

  private _valueChanged(e: CustomEvent) {
    if (!this.adapter.templateData.readonly) {
      this.adapter.valueChanged(e.detail.value);
    }
  }
}
