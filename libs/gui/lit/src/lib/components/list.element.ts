import type { InputWidget, WithWidget } from '@golemui/core';
import { InputWidgetAdapter, type LitFormContext, formContext, inputContext } from '@golemui/lit';
import type { ListItem, ListProps } from '@golemui/gui-shared/internals';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';
import { defaultListItemRenderer } from './default-list-item-renderer';
import '@golemui/gui-components/label';
import '@golemui/gui-components/list';
import '@golemui/gui-components/errors';

@customElement('gui-list-input')
export class ListElement extends LitElement implements WithWidget {
  widget!: InputWidget<string>;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: inputContext })
  adapter = new InputWidgetAdapter<string, ListProps<any>>();

  subscriptions: Subscription[] = [];

  @state() private _range = { start: 0, end: 10 };
  @state() private _listItems: ListItem<any>[] = [];
  @state() private _focusedIndex = -1;

  @query('gui-list') private _guiListRef!: any;

  override createRenderRoot() {
    return this;
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

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-list', 'gui-field');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

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

  override render() {
    const templateData = this.adapter.templateData;
    const showErrors =
      templateData.touched && templateData.errors && templateData.errors.length > 0;
    const visibleItems = this._listItems.slice(this._range.start, this._range.end);

    const itemRenderer = this.adapter.getItemRenderer(
      templateData.itemRenderer,
      defaultListItemRenderer,
    );

    return html`
      <gui-label
        .targetElement=${this._guiListRef}
        .uid=${this.widget.uid}
        .label=${templateData.label}
        .hint=${templateData.hint}
        .errors=${templateData.errors}
        .touched=${templateData.touched}
        .required=${templateData.validator?.required}
        .native=${false}
      ></gui-label>

      <div class="gui-widget">
        <gui-list
          .uid=${this.widget.uid}
          .value=${templateData.value ?? ''}
          .valueField=${templateData.valueField as string}
          .items=${templateData.items}
          .itemHeight=${templateData.itemHeight}
          .height=${templateData.height}
          ?required=${templateData.validator?.required}
          ?touched=${templateData.touched}
          ?disabled=${templateData.disabled}
          ?readonly=${templateData.readonly}
          aria-labelledby=${templateData.label ? `${this.widget.uid}_label` : nothing}
          aria-describedby=${templateData.hint ? `${this.widget.uid}_hint` : nothing}
          @gui-range-change=${this._onRangeChange}
          @gui-update-items=${this._onUpdateItems}
          @gui-focus-change=${this._onFocusChange}
          @blur=${() => this.adapter.onBlur()}
          @change=${this._valueChanged}
        >
          ${visibleItems.map((item, index) => {
            const absoluteIndex = this._range.start + index;
            const isSelected = templateData.value === item.value;
            const isFocused = this._focusedIndex === absoluteIndex;
            const isDisabled = !!templateData.disabled || !!item.disabled;

            const labelField = templateData.labelField ?? 'label';
            const isObject = item.template !== null && typeof item.template === 'object';
            const template =
              isObject && labelField && !templateData.itemRenderer
                ? item.template[labelField]
                : item.template;

            return html`
              <div
                role="option"
                tabindex="-1"
                class="gui-list__item-wrapper"
                id="${this.widget.uid}-item-${absoluteIndex}"
                style="height: ${templateData.itemHeight || 40}px"
                aria-selected=${isSelected ? 'true' : 'false'}
                aria-disabled=${isDisabled ? 'true' : 'false'}
                @click=${() => this._onClickItem(item, absoluteIndex)}
              >
                ${itemRenderer({
                  template: template as string,
                  value: item.value,
                  index: absoluteIndex,
                  selected: isSelected,
                  disabled: isDisabled,
                  focused: isFocused,
                })}
              </div>
            `;
          })}
        </gui-list>
      </div>

      ${showErrors
        ? html`<gui-errors
            .uid=${this.widget.uid}
            .errors=${templateData.errors}
            .touched=${templateData.touched}
          ></gui-errors>`
        : nothing}
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
    if (this.adapter.templateData.disabled || item.disabled) return;

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
