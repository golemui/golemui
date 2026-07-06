import type { InputWidget, WithWidget } from '@golemui/core';
import { InputWidgetAdapter, type LitFormContext, formContext, inputContext } from '@golemui/lit';
import {
  addErrors,
  addIcon,
  addLabel,
  buildTimeOptions,
  formatISOTimeForLocale,
  resolveHourFormat,
} from '@golemui/gui-components/internals';
import type { ListItem, TimePickerProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/time-input';
import '@golemui/gui-components/list';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';
import { classMap } from 'lit/directives/class-map.js';
import { defaultListItemRenderer } from './default-list-item-renderer';

@customElement('gui-time-picker-input')
export class TimePickerElement extends LitElement implements WithWidget {
  widget!: InputWidget<string>;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: inputContext })
  adapter = new InputWidgetAdapter<string, TimePickerProps>();

  @query('#time-input') timeInput?: HTMLElement;
  @query('gui-list') private _listRef?: any;

  @state() private _isListVisible = false;
  @state() private _range = { start: 0, end: 10 };
  @state() private _listItems: ListItem<any>[] = [];
  @state() private _focusedIndex = -1;

  subscriptions: Subscription[] = [];

  // Generating and locale-formatting up to a full day of slots is not free,
  // so the option list is memoized per input change
  private _itemsCache: { key: string; items: ListItem<string>[] } | undefined;

  onFocusOut = (event: FocusEvent) => {
    if (!this._isListVisible) return;

    const newFocusTarget = event.relatedTarget as Node;
    if (newFocusTarget && this.contains(newFocusTarget)) {
      return;
    }

    this.closeList();
  };

  onDocumentClick = (event: MouseEvent) => {
    if (!this._isListVisible) return;

    const path = event.composedPath();
    const clickedInsideTime = this.timeInput && path.includes(this.timeInput);
    const clickedInsideList = this._listRef && path.includes(this._listRef);

    if (!clickedInsideTime && !clickedInsideList) {
      this.closeList();
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
    this.addEventListener('focusout', this.onFocusOut);
    this.classList.add('gui-time-picker', 'gui-field');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  /** Selectable slots with locale display labels, disabled inside disabledRanges. */
  private get timeItems(): ListItem<string>[] {
    const templateData = this.adapter.templateData;
    const hourFormat = resolveHourFormat(templateData.lang, templateData.hourFormat);
    const key = [
      templateData.lang,
      hourFormat,
      templateData.minTime,
      templateData.maxTime,
      templateData.minuteStep,
      JSON.stringify(templateData.disabledRanges ?? null),
    ].join('|');

    if (this._itemsCache?.key !== key) {
      this._itemsCache = {
        key,
        items: buildTimeOptions(templateData).map((slot) => ({
          template: formatISOTimeForLocale(slot.value, templateData.lang, hourFormat),
          value: slot.value,
          disabled: slot.disabled,
        })),
      };
    }
    return this._itemsCache.items;
  }

  override render() {
    super.render();

    const templateData = this.adapter.templateData;
    const timePickerIcon = addIcon('timePicker', templateData);
    const visibleItems = this._listItems.slice(this._range.start, this._range.end);

    const itemRenderer = this.adapter.getItemRenderer(
      templateData.itemRenderer,
      defaultListItemRenderer,
    );

    return html`
      ${addLabel(this.widget.uid, {
        ...templateData,
        required: templateData.validator?.required,
      })}

      <div
        role="button"
        tabindex="-1"
        class="gui-widget"
        aria-expanded=${this._isListVisible}
        @keyup=${(e: Event) => this.onKeyUp(e)}
        @keydown=${(e: KeyboardEvent) => this.onKeyDown(e)}
        @click=${(e: Event) => this.toggleList(e)}
      >
        <gui-time
          id="time-input"
          class=${classMap(timePickerIcon.widgetClasses)}
          .uid=${this.widget.uid}
          .hint=${templateData.hint}
          .showErrors=${false}
          .errors=${templateData.errors}
          ?touched=${templateData.touched}
          ?required=${templateData.validator?.required}
          ?disabled=${templateData.disabled}
          ?readonly=${templateData.readonly || !templateData.allowCustomTime}
          .value=${templateData.value}
          .icon=${templateData.icon}
          .localeId=${templateData.lang}
          .hourFormat=${templateData.hourFormat}
          .minuteStep=${templateData.minuteStep}
          .minTime=${templateData.minTime}
          .maxTime=${templateData.maxTime}
          .disabledRanges=${templateData.disabledRanges}
          @inputError=${this.onInputError}
          @blur=${() => this.adapter.onBlur()}
          @focus=${this.openList}
          @change=${this.valueChanged}
        ></gui-time>
        <span class="gui-time-picker__arrow"
          ><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256">
            <path
              d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"
            ></path></svg
        ></span>

        <gui-list
          id=${this.widget.uid}
          .uid=${this.widget.uid}
          .value=${templateData.value ?? ''}
          .items=${this.timeItems}
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
          @change=${this._onValueChange}
        >
          ${visibleItems.map((item, index) => {
            const absoluteIndex = this._range.start + index;
            const isSelected = templateData.value === item.value;
            const isFocused = this._focusedIndex === absoluteIndex;
            const isDisabled = !!templateData.disabled || !!item.disabled;

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
                  template: item.template as string,
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

      ${addErrors(this.widget.uid, templateData)}
    `;
  }

  valueChanged(event: CustomEvent) {
    this.adapter.injectValidationIssues(null);
    this.adapter.valueChanged(event.detail.value);
  }

  onInputError(event: CustomEvent) {
    this.adapter.injectValidationIssues([event.detail.message]);
  }

  onKeyUp(event: Event) {
    const evt = event as KeyboardEvent;
    if (evt.target !== evt.currentTarget) return;
    if (evt?.key === 'Enter' || evt?.key === ' ') {
      this._isListVisible = !this._isListVisible;
    }
  }

  onKeyDown(event: KeyboardEvent) {
    const templateData = this.adapter.templateData;
    if (templateData.allowCustomTime || templateData.readonly || templateData.disabled) return;
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

    // Only when focus is in the (readonly) time input; the open list handles
    // its own arrow navigation
    const target = event.target as HTMLElement;
    if (!target.closest('gui-time')) return;

    event.preventDefault();
    this.selectAdjacentOption(event.key === 'ArrowDown' ? 1 : -1);
  }

  /**
   * Select-like keyboard behavior when custom time entry is off: ArrowDown/
   * ArrowUp move the value to the next/previous enabled option (the first or
   * last one when nothing is selected yet).
   */
  private selectAdjacentOption(direction: 1 | -1) {
    const items = this.timeItems;
    if (!items.length) return;

    const currentIndex = items.findIndex(
      (item) => item.value === this.adapter.templateData.value,
    );
    let index =
      currentIndex === -1 ? (direction === 1 ? 0 : items.length - 1) : currentIndex + direction;
    while (index >= 0 && index < items.length && items[index].disabled) {
      index += direction;
    }
    if (index < 0 || index >= items.length) return;

    this.adapter.injectValidationIssues(null);
    this.adapter.valueChanged(items[index].value as string);
    this._focusedIndex = index;
    this.openList();
    this.updateComplete.then(() => this._listRef?.scrollToSelectedIndex());
  }

  toggleList(event: Event) {
    const target = event.target as HTMLElement;

    if (target.closest('.gui-list__item-wrapper')) return;

    const isInputClick = target.closest('.gui-time-input__part');
    const isListClick = target.closest('gui-list');
    if (isInputClick || isListClick) {
      this.openList();
    } else {
      this._isListVisible = !this._isListVisible;
    }
  }

  openList = () => {
    if (!this._isListVisible) {
      this._isListVisible = true;
      this.updateComplete.then(() => this._listRef?.scrollToSelectedIndex());
    }
  };

  closeList() {
    this._isListVisible = false;
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

    this.adapter.injectValidationIssues(null);
    this.adapter.valueChanged(item.value as string);
    this._focusedIndex = index;
    this.closeList();
  }

  // Enter/Space selection inside the list commits a single time, so close
  private _onValueChange(e: CustomEvent) {
    this.adapter.injectValidationIssues(null);
    this.adapter.valueChanged(e.detail.value);
    this.closeList();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.onDocumentClick);
    this.removeEventListener('focusout', this.onFocusOut);
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
