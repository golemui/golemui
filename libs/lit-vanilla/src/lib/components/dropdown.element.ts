import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { DropdownProps, ListItem } from '@golemui/shared-vanilla';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { Subscription } from 'rxjs';
import { defaultListItemRenderer } from './default-list-item-renderer';

@customElement('gui-dropdown-control')
export class DropdownElement extends LitElement implements Core.WithField {
  field!: Core.ControlField<string>;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.controlContext })
  adapter = new Lit.ControlFieldAdapter<string, DropdownProps<any>>();

  subscriptions: Subscription[] = [];

  @state() private _range = { start: 0, end: 10 };
  @state() private _filteredItems: ListItem<any>[] = [];
  @state() private _listItems: ListItem<any>[] = [];
  @state() private _focusedIndex = -1;
  @state() private _isFiltering = false;
  @state() private _isListVisible = false;

  @query('input') private _inputRef!: any;
  @query('gui-list') private _listRef!: any;

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this.onDocumentClick);
    this.classList.add('gui-dropdown');
    this.adapter.context = this.formContext;
    this.adapter.init(this.field);

    this._filteredItems = this.adapter.templateData.items;

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => {
        const data = this.adapter.templateData;
        if (data.items && this._listItems.length === 0 && this._filteredItems.length === 0) {
          this._filteredItems = data.items;
          this._listItems = data.items;
        }
        this.requestUpdate();
      }),
    );
  }

  onDocumentClick = (event: MouseEvent) => {
    if (!this._isListVisible) return;

    const path = event.composedPath();
    const clickedInsideInput = this._inputRef && path.includes(this._inputRef);
    const clickedInsideList = this._listRef && path.includes(this._listRef);

    if (!clickedInsideInput && !clickedInsideList) {
      this._isListVisible = false;
    }
  };

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
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
    const templateData = this.adapter.templateData;
    this.adapter.valueChanged(item.value);

    this._focusedIndex = index;
    this._isFiltering = false;
    this._isListVisible = false;

    if (this._listRef) {
      this._listRef.focusItemAtIndex(index);
      this._inputRef.value = templateData.valueField
        ? (item.template as any)[templateData.valueField]
        : item.template;
    }
  }

  private _onValueChange(e: CustomEvent) {
    this.adapter.valueChanged(e.detail.value);
    this._inputRef.value = e.detail.value;
  }

  private _onKeyDown(event: Event) {
    if ((event as KeyboardEvent).key === 'ArrowDown') {
      event.preventDefault();
      this._listRef.focus();
      this._listRef.scrollToSelectedIndex();
    }
  }

  private _filterItems(event: InputEvent) {
    const templateData = this.adapter.templateData;
    const filterValue = (event.target as HTMLInputElement).value;

    if (filterValue) {
      const filteredItems = templateData.items.filter((item: any) =>
        templateData.valueField
          ? item[templateData.valueField].toString().includes(filterValue)
          : item.toString().includes(filterValue),
      );
      this._isFiltering = true;
      this._filteredItems = [...filteredItems];
    } else {
      this._isFiltering = false;
      this._filteredItems = [...templateData.items];
    }
  }

  private async _onFocus() {
    this._isListVisible = true;

    await this.updateComplete;

    this._listRef.scrollToSelectedIndex();
  }

  private _onFocusOutInput(event: FocusEvent) {
    const newFocusTarget = event.relatedTarget as Node;

    // We're focusing on an element inside this component
    if (newFocusTarget && this.contains(newFocusTarget)) {
      return;
    }

    // We're focusing outside this component
    this.adapter.onBlur();
    this._isListVisible = false;
    this._isFiltering = false;
  }

  private _onBlur() {
    this.adapter.onBlur();
    this._isListVisible = false;
    this._isFiltering = false;
  }

  override render() {
    const templateData = this.adapter.templateData;
    const visibleItems = this._listItems.slice(this._range.start, this._range.end);

    const itemRenderer = this.adapter.getItemRenderer(
      templateData.itemRenderer,
      defaultListItemRenderer,
    );

    return html`
      <gui-label
        .targetElement=${[this._listRef, this._inputRef]}
        .uid=${this.field.uid}
        .label=${templateData.label}
        .hint=${templateData.hint}
        .errors=${templateData.errors}
        .touched=${templateData.touched}
        .required=${templateData.validator?.required}
      ></gui-label>

      <div class="gui-field">
        <input
          type="text"
          id=${this.field.uid}
          data-cy=${`${this.field.uid}_textinput`}
          ?required=${templateData.validator?.required}
          ?disabled=${templateData.disabled}
          ?readonly=${templateData.readonly}
          placeholder=${templateData.placeholder ?? ''}
          @keydown=${(event: KeyboardEvent) => this._onKeyDown(event)}
          @input=${(event: InputEvent) => this._filterItems(event)}
          @focusout=${(e: FocusEvent) => this._onFocusOutInput(e)}
          @focus=${() => this._onFocus()}
        />

        <gui-list
          id=${this.field.uid}
          .uid=${this.field.uid}
          .value=${templateData.value ?? ''}
          .valueField=${templateData.valueField}
          .items=${this._isFiltering ? this._filteredItems : templateData.items}
          .itemHeight=${templateData.itemHeight}
          .height=${templateData.height}
          ?required=${templateData.validator?.required}
          ?touched=${templateData.touched}
          ?disabled=${templateData.disabled}
          ?readonly=${templateData.readonly}
          ?hidden=${!this._isListVisible}
          @gui-range-change=${this._onRangeChange}
          @gui-update-items=${this._onUpdateItems}
          @gui-focus-change=${this._onFocusChange}
          @focus=${() => this._onFocus()}
          @blur=${() => this._onBlur()}
          @change=${(e: CustomEvent) => this._onValueChange(e)}
        >
          ${visibleItems.map((item, index) => {
            const absoluteIndex = this._range.start + index;
            const isSelected = templateData.value === item.value;
            const isFocused = this._focusedIndex === absoluteIndex;

            return html`
              <div
                role="option"
                tabindex="-1"
                class="gui-list__item-wrapper"
                id="${this.field.uid}-item-${absoluteIndex}"
                style="height: ${templateData.itemHeight || 40}px"
                aria-selected=${isSelected ? 'true' : 'false'}
                @click=${() => this._onClickItem(item, absoluteIndex)}
              >
                ${itemRenderer({
                  template: item.template as string,
                  value: item.value,
                  index: absoluteIndex,
                  selected: isSelected,
                  disabled: !!templateData.disabled,
                  focused: isFocused,
                })}
              </div>
            `;
          })}
        </gui-list>
      </div>

      <gui-errors .errors=${templateData.errors} .touched=${templateData.touched}></gui-errors>
    `;
  }
}
