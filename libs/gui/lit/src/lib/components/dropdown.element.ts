import type { InputWidget, WithWidget } from '@golemui/core';
import { InputWidgetAdapter, type LitFormContext, formContext, inputContext } from '@golemui/lit';
import { type DropdownProps, type ListItem } from '@golemui/gui-shared';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { debounceTime, Subject, type Subscription } from 'rxjs';
import { defaultListItemRenderer } from './default-list-item-renderer';
import '@golemui/gui-components/label';
import '@golemui/gui-components/list';
import '@golemui/gui-components/errors';

@customElement('gui-dropdown-input')
export class DropdownElement extends LitElement implements WithWidget {
  widget!: InputWidget<string>;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: inputContext })
  adapter = new InputWidgetAdapter<string, DropdownProps<never>>();

  debouncer = new Subject<string>();
  subscriptions: Subscription[] = [];

  @state() private _range = { start: 0, end: 10 };
  @state() private _filteredItems: ListItem<never>[] = [];
  @state() private _listItems: ListItem<never>[] = [];
  @state() private _focusedIndex = -1;
  @state() private _isFiltering = false;
  @state() private _isListVisible = false;
  @state() private _selectedItem: ListItem<never> | undefined = undefined;

  @query('input') private _inputRef!: any;
  @query('gui-list') private _listRef!: any;

  onDocumentClick = (event: MouseEvent) => {
    if (!this._isListVisible) return;

    const path = event.composedPath();
    const clickedInsideInput = this._inputRef && path.includes(this._inputRef);
    const clickedInsideList = this._listRef && path.includes(this._listRef);

    if (!clickedInsideInput && !clickedInsideList) {
      this._isListVisible = false;
    }
  };

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
    document.addEventListener('click', this.onDocumentClick);
    this.classList.add('gui-dropdown', 'gui-field');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this._filteredItems = this.adapter.templateData.items;

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => {
        const data = this.adapter.templateData;
        if (data.items && this._listItems?.length === 0 && this._filteredItems?.length === 0) {
          this._filteredItems = data.items;
          this._listItems = data.items;
        }
        this.requestUpdate();
      }),
      this.debouncer
        .pipe(debounceTime(this.adapter.templateData.inputDebounce ?? 500))
        .subscribe((value: string) => {
          this._filterItems(value);
        }),
    );
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  private _onRangeChange(e: CustomEvent) {
    this._range = { start: e.detail.startIndex, end: e.detail.endIndex };
  }

  private _onUpdateItems(e: CustomEvent) {
    const items = e.detail || [];
    this._listItems = items;

    // Resolve selected item on initial load when a default value is set
    if (!this._selectedItem && this.adapter.templateData.value != null) {
      const match = items.find(
        (item: ListItem<never>) => item.value === this.adapter.templateData.value,
      );
      if (match) {
        this._selectedItem = match;
      }
    }
  }

  private _onFocusChange(e: CustomEvent) {
    this._focusedIndex = e.detail.index;
  }

  private _onClickItem(item: ListItem<never>, index: number) {
    if (this.adapter.templateData.readonly) return;

    const templateData = this.adapter.templateData;
    this.adapter.valueChanged(item.value);
    this.adapter.filterChanged('');

    this._focusedIndex = index;
    this._selectedItem = item;
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
    const value = e.detail.value;
    this.adapter.valueChanged(value);
    this.adapter.filterChanged('');
    this._selectedItem = this._listItems.find((item) => item.value === value);
    this._isFiltering = false;
    this._isListVisible = false;
  }

  private async _onKeyDown(event: Event) {
    const key = (event as KeyboardEvent).key;

    switch (key) {
      case 'ArrowDown':
        event.preventDefault();
        this._isListVisible = true;
        await this.updateComplete;
        this._listRef.focus();
        this._listRef.scrollToSelectedIndex();
        break;
      case 'Enter':
        if (!this._inputRef.value) {
          // Field is empty and enter pressed, we clear the selection
          this.adapter.valueChanged(null);
          this._isListVisible = false;
          this._isFiltering = false;
        }
        break;
    }
  }

  private _onInput(event: InputEvent) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.debouncer.next(filterValue);
  }

  private _filterItems(filterValue: string) {
    const templateData = this.adapter.templateData;
    const asyncFiltering = !!this.widget.on?.filter;

    this.adapter.filterChanged(filterValue);

    if (filterValue && !asyncFiltering) {
      this._isFiltering = true;
      this._isListVisible = true;

      const searchFields =
        templateData.searchFields ??
        ([templateData.labelField!, templateData.valueField!].filter(
          (field) => !!field,
        ) as string[]);
      const hasSearchFields = searchFields.length > 0;
      const items = templateData.items || [];
      const filteredItems = items.filter((item: any) => {
        const keys = Object.keys(item);

        // If it's a primitive value, we search by value
        const isPrimitiveValue = !keys.length;
        if (isPrimitiveValue) {
          return item.toString().toLowerCase().includes(filterValue.toLowerCase());
        }

        // Otherwise, we search by object
        const reduceFunc = (acc: boolean, prop: string) =>
          acc || item[prop].toString().toLowerCase().includes(filterValue.toLowerCase());

        return hasSearchFields
          ? keys.filter((prop: string) => searchFields.includes(prop)).reduce(reduceFunc, false)
          : keys.reduce(reduceFunc, false);
      });

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
    const showErrors =
      templateData.touched && templateData.errors && templateData.errors.length > 0;
    const visibleItems = this._listItems.slice(this._range.start, this._range.end);

    const itemRenderer = this.adapter.getItemRenderer(
      templateData.itemRenderer,
      defaultListItemRenderer,
    );

    const isSelectedItemObject =
      this._selectedItem?.template !== null && typeof this._selectedItem?.template === 'object';
    const referenceField = isSelectedItemObject ? (templateData.labelField ?? 'label') : null;
    const selectedItemValue = referenceField
      ? this._selectedItem?.template[referenceField]
      : this._selectedItem?.template;

    const asyncFiltering = !!this.widget.on?.filter;

    return html`
      <gui-label
        .targetElement=${[this._listRef, this._inputRef]}
        .uid=${this.widget.uid}
        .label=${templateData.label}
        .hint=${templateData.hint}
        .errors=${templateData.errors}
        .touched=${templateData.touched}
        .required=${templateData.validator?.required}
        .native=${false}
      ></gui-label>

      <div class="gui-widget" aria-expanded=${this._isListVisible}>
        <input
          type="text"
          id=${this.widget.uid}
          data-cy=${`${this.widget.uid}_textinput`}
          class="gui-widget-input"
          .value=${selectedItemValue ?? templateData.value ?? ''}
          ?required=${templateData.validator?.required}
          ?disabled=${templateData.disabled}
          ?readonly=${templateData.readonly}
          placeholder=${templateData.placeholder ?? ''}
          autocomplete=${(templateData.autocomplete as any) || nothing}
          @keydown=${this._onKeyDown}
          @input=${this._onInput}
          @focusout=${this._onFocusOutInput}
          @focus=${this._onFocus}
          aria-labelledby=${templateData.label ? `${this.widget.uid}_label` : nothing}
          aria-describedby=${templateData.hint ? `${this.widget.uid}_hint` : nothing}
        />
        <span class="gui-dropdown__arrow"
          ><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256">
            <path
              d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"
            ></path></svg
        ></span>

        <gui-list
          id=${this.widget.uid}
          .uid=${this.widget.uid}
          .value=${templateData.value ?? ''}
          .valueField=${templateData.valueField! as string}
          .items=${this._isFiltering && !asyncFiltering ? this._filteredItems : templateData.items}
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
          @focus=${this._onFocus}
          @blur=${this._onBlur}
          @change=${this._onValueChange}
        >
          ${visibleItems.map((item, index) => {
            const absoluteIndex = this._range.start + index;
            const isSelected = templateData.value === item.value;
            const isFocused = this._focusedIndex === absoluteIndex;

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
                @click=${() => this._onClickItem(item, absoluteIndex)}
              >
                ${itemRenderer({
                  template: template as string,
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

      ${showErrors
        ? html`<gui-errors
            .uid=${this.widget.uid}
            .errors=${templateData.errors}
            .touched=${templateData.touched}
          ></gui-errors>`
        : nothing}
    `;
  }
}
