import type { InputWidget, WithWidget } from '@golemui/core';
import { InputWidgetAdapter, type LitFormContext, formContext, inputContext } from '@golemui/lit';
import type { ListItem, MultiDropdownProps, OptionValue } from '@golemui/gui-shared/internals';
import type {
  GuiMultiSelectTrigger,
  GuiPillEventDetail,
  GuiPillItem,
  GuiPillsDropdownEventDetail,
} from '@golemui/gui-components';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit/internals';
import { debounceTime, Subject, type Subscription } from 'rxjs';
import { defaultMultiListItemRenderer } from './default-multi-list-item-renderer';
import '@golemui/gui-components/label';
import '@golemui/gui-components/multi-list';
import '@golemui/gui-components/multi-select-trigger';
import '@golemui/gui-components/errors';

export class MultiDropdownElement extends LitElement implements WithWidget {
  widget!: InputWidget<OptionValue[]>;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: inputContext })
  adapter = new InputWidgetAdapter<OptionValue[], MultiDropdownProps<any>>();

  debouncer = new Subject<string>();
  subscriptions: Subscription[] = [];

  @state() private _range = { start: 0, end: 10 };
  @state() private _filteredItems: ListItem<any>[] = [];
  @state() private _listItems: ListItem<any>[] = [];
  @state() private _focusedIndex = -1;
  @state() private _isFiltering = false;
  @state() private _isListVisible = false;

  @query('gui-multi-select-trigger') private _triggerRef!: GuiMultiSelectTrigger;
  @query('gui-multi-list') private _listRef!: any;
  @query('.gui-picker__panel') private _panelRef!: any;

  private _ignoreNextFocus = false;

  onDocumentClick = (event: MouseEvent) => {
    if (!this._isListVisible) return;

    const path = event.composedPath();
    const clickedInsideTrigger = this._triggerRef && path.includes(this._triggerRef);
    const clickedInsidePanel = this._panelRef && path.includes(this._panelRef);

    if (!clickedInsideTrigger && !clickedInsidePanel) {
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
    this.classList.add('gui-multi-dropdown', 'gui-field');
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
    document.removeEventListener('click', this.onDocumentClick);
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  private _currentValues(): OptionValue[] {
    const value = this.adapter.templateData.value;
    return Array.isArray(value) ? value : [];
  }

  private _pillItems(values: OptionValue[]): GuiPillItem[] {
    const labelField = (this.adapter.templateData.labelField as string) ?? 'label';
    return values.map((value) => {
      const item = this._listItems.find((i) => i.value === value);
      const isObject = item != null && item.template !== null && typeof item.template === 'object';
      const label =
        item == null
          ? String(value)
          : isObject
            ? String((item.template as any)[labelField])
            : String(item.template);
      return { key: String(value), label };
    });
  }

  private _toggleValue(value: OptionValue) {
    const templateData = this.adapter.templateData;
    if (templateData.disabled || templateData.readonly) return;

    const current = this._currentValues();
    if (current.includes(value)) {
      this.adapter.valueChanged(current.filter((v) => v !== value));
      return;
    }
    this.adapter.valueChanged([...current, value]);
  }

  private async _openPanel() {
    this._triggerRef?.closePillsDropdown();
    this._isListVisible = true;
    await this.updateComplete;
    this._listRef?.scrollToSelectedIndex();
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
    if (this.adapter.templateData.readonly || item.disabled) return;

    this._toggleValue(item.value);
    this._focusedIndex = index;

    if (this._listRef) {
      this._listRef.focusItemAtIndex(index);
    }
  }

  private _onValueChange(e: CustomEvent) {
    if (this.adapter.templateData.readonly) return;
    this._toggleValue(e.detail.value);
  }

  private _onPillRemove(e: CustomEvent<GuiPillEventDetail>) {
    const value = this._currentValues().find((v) => String(v) === e.detail.key);
    if (value === undefined) return;
    this._toggleValue(value);
  }

  private _onPillsDropdownToggle(e: CustomEvent<GuiPillsDropdownEventDetail>) {
    if (e.detail?.open && this._isListVisible) {
      this._isListVisible = false;
    }
  }

  private async _onKeyDown(event: Event) {
    const key = (event as KeyboardEvent).key;

    switch (key) {
      case 'ArrowDown':
        event.preventDefault();
        await this._openPanel();
        this._listRef?.focus();
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
        const isPrimitiveValue = item === null || typeof item !== 'object';

        if (isPrimitiveValue) {
          return item != null && item.toString().toLowerCase().includes(filterValue.toLowerCase());
        }

        const keys = Object.keys(item);
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

  private _onWidgetKeyDown(event: Event) {
    if ((event as KeyboardEvent).key !== 'Escape' || !this._isListVisible) return;
    event.preventDefault();
    event.stopPropagation();
    this._isListVisible = false;
    this._isFiltering = false;
    this._ignoreNextFocus = true;
    this._triggerRef?.focusInput();
    setTimeout(() => {
      this._ignoreNextFocus = false;
    });
  }

  private async _onFocusIn(e: FocusEvent) {
    if (this._ignoreNextFocus) return;

    const input = this._triggerRef?.input;
    const isListTarget = this._listRef && e.target === this._listRef;
    if (e.target !== input && !isListTarget) return;

    await this._openPanel();
  }

  private _onPanelMouseDown(event: MouseEvent) {
    const target = event.target as Node;
    if (this._listRef && this._listRef.contains(target)) return;
    event.preventDefault();
  }

  private _onFocusOutInput(event: FocusEvent) {
    const newFocusTarget = event.relatedTarget as Node;

    if (newFocusTarget && this.contains(newFocusTarget)) {
      return;
    }

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
    const values = this._currentValues();
    const pillItems = this._pillItems(values);

    const itemRenderer = this.adapter.getItemRenderer(
      templateData.itemRenderer,
      defaultMultiListItemRenderer,
    );

    const asyncFiltering = !!this.widget.on?.filter;

    return html`
      <gui-label
        .targetElement=${[this._listRef, this._triggerRef?.input]}
        .uid=${this.widget.uid}
        .label=${templateData.label}
        .hint=${templateData.hint}
        .errors=${templateData.errors}
        .touched=${templateData.touched}
        .required=${templateData.validator?.required}
        .native=${false}
      ></gui-label>

      <div class="gui-widget" @keydown=${this._onWidgetKeyDown}>
        <gui-multi-select-trigger
          .uid=${this.widget.uid}
          .pills=${pillItems}
          .errors=${templateData.errors}
          .touched=${!!templateData.touched}
          ?required=${templateData.validator?.required}
          ?disabled=${templateData.disabled}
          ?readonly=${templateData.readonly}
          .placeholder=${templateData.placeholder ?? ''}
          .autocomplete=${templateData.autocomplete as string}
          .hasLabel=${!!templateData.label}
          .hasHint=${!!templateData.hint}
          .panelOpen=${this._isListVisible}
          .panelId=${`${this.widget.uid}-list`}
          .removeAriaLabel=${templateData.removeAriaLabel}
          .removeIcon=${templateData.removeIcon}
          .compactAriaLabel=${`${pillItems.length} selected`}
          @keydown=${this._onKeyDown}
          @input=${this._onInput}
          @focusin=${this._onFocusIn}
          @focusout=${this._onFocusOutInput}
          @pillremove=${this._onPillRemove}
          @dropdowntoggle=${this._onPillsDropdownToggle}
        ></gui-multi-select-trigger>
        <span class="gui-dropdown__arrow"
          ><svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 256 256"
            aria-hidden="true"
          >
            <path
              d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"
            ></path></svg
        ></span>

        <div
          class="gui-picker__panel"
          ?hidden=${!this._isListVisible}
          @mousedown=${this._onPanelMouseDown}
        >
          <gui-multi-list
            id=${`${this.widget.uid}-list`}
            .uid=${this.widget.uid}
            .values=${values}
            .valueField=${templateData.valueField! as string}
            .items=${this._isFiltering && !asyncFiltering
              ? this._filteredItems
              : templateData.items}
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
            @blur=${this._onBlur}
            @change=${this._onValueChange}
          >
            ${visibleItems.map((item, index) => {
              const absoluteIndex = this._range.start + index;
              const isSelected = values.includes(item.value);
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
          </gui-multi-list>
          ${showErrors
            ? html`<gui-errors
                panel
                .uid=${this.widget.uid}
                .errors=${templateData.errors}
                .touched=${templateData.touched}
              ></gui-errors>`
            : nothing}
        </div>
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

safeDefine('gui-multi-dropdown-input', MultiDropdownElement);
