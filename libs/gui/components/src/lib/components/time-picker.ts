import { html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import './time-input';
import './time-list';
import type { GuiTimeList } from './time-list';
import { buildTimeOptions, type HourFormat, type TimeRange } from '../utils/time';
import { addErrors, addIcon, addLabel } from '../utils/templates';

@customElement('gui-time-picker')
export class GuiTimePicker extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: String }) icon: string | undefined = '';
  @property({ type: Array }) errors: string[] | undefined = [];
  @property({ type: Boolean }) showErrors: boolean | undefined = true;
  @property({ type: Boolean }) touched: boolean | undefined = false;
  @property({ type: Boolean }) required: boolean | undefined = false;
  @property({ type: Boolean }) disabled: boolean | undefined = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly: boolean | undefined = false;
  @property({ type: String, attribute: 'locale-id' }) localeId: string | undefined = undefined;
  @property({ type: String }) value: string | undefined = undefined;
  @property({ type: String, attribute: 'hour-format' }) hourFormat: HourFormat | undefined =
    undefined;
  @property({ type: Number, attribute: 'minute-step' }) minuteStep: number | undefined = undefined;
  @property({ type: String, attribute: 'min-time' }) minTime: string | undefined = undefined;
  @property({ type: String, attribute: 'max-time' }) maxTime: string | undefined = undefined;
  @property({ type: Array, attribute: 'disabled-ranges' }) disabledRanges:
    | TimeRange[]
    | undefined = undefined;
  @property({ type: Boolean, attribute: 'allow-custom-time' }) allowCustomTime:
    | boolean
    | undefined = false;
  @property({ type: Number }) height: number | undefined = undefined;
  @property({ type: Number, attribute: 'item-height' }) itemHeight: number | undefined = undefined;
  @property({ type: String, attribute: 'min-time-message' }) minTimeMessage: string | undefined =
    undefined;
  @property({ type: String, attribute: 'max-time-message' }) maxTimeMessage: string | undefined =
    undefined;
  @property({ type: String, attribute: 'disabled-range-message' }) disabledRangeMessage:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'no-available-times-message' }) noAvailableTimesMessage:
    | string
    | undefined = undefined;

  @query('gui-time') private _timeRef?: HTMLElement;
  @query('gui-time-list') private _listRef?: GuiTimeList;

  @state() private _isListOpen = false;

  private _restoringFocus = false;

  onDocumentClick = (event: MouseEvent) => {
    if (!this._isListOpen) return;

    const path = event.composedPath();
    const clickedInsideTime = this._timeRef && path.includes(this._timeRef);
    const clickedInsideList = this._listRef && path.includes(this._listRef);

    if (!clickedInsideTime && !clickedInsideList) {
      this.closeList();
    }
  };

  onFocusOut = (event: FocusEvent) => {
    if (!this._isListOpen) return;

    const newFocusTarget = event.relatedTarget as Node;
    if (newFocusTarget && this.contains(newFocusTarget)) {
      return;
    }

    this.closeList();
  };

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this.onDocumentClick);
    this.addEventListener('focusout', this.onFocusOut);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.onDocumentClick);
    this.removeEventListener('focusout', this.onFocusOut);
  }

  override render() {
    const timePickerIcon = addIcon('timePicker', { icon: this.icon });

    return html`
      ${addLabel(this.uid ?? '', {
        label: this.label,
        hint: this.hint,
        required: this.required,
      })}

      <div
        role="button"
        tabindex="-1"
        class="gui-widget"
        aria-expanded=${this._isListOpen}
        @keyup=${this.onKeyUp}
        @keydown=${this.onKeyDown}
        @click=${this.toggleList}
      >
        <gui-time
          id="time-input"
          class=${classMap(timePickerIcon.widgetClasses)}
          .uid=${this.uid}
          .hint=${this.hint}
          .showErrors=${false}
          .errors=${this.errors}
          ?touched=${this.touched}
          ?required=${this.required}
          ?disabled=${this.disabled}
          ?readonly=${this.readOnly || !this.allowCustomTime}
          .value=${this.value}
          .icon=${this.icon}
          .localeId=${this.localeId}
          .hourFormat=${this.hourFormat}
          .minuteStep=${this.minuteStep}
          .minTime=${this.minTime}
          .maxTime=${this.maxTime}
          .disabledRanges=${this.disabledRanges}
          .minTimeMessage=${this.minTimeMessage}
          .maxTimeMessage=${this.maxTimeMessage}
          .disabledRangeMessage=${this.disabledRangeMessage}
          @blur=${this.onTimeBlur}
          @focus=${this.openList}
          @change=${this.onTimeChange}
        ></gui-time>
        <span class="gui-time-picker__arrow"
          ><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256">
            <path
              d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"
            ></path></svg
        ></span>

        <gui-time-list
          .uid=${this.uid}
          .value=${this.value}
          .label=${this.label}
          .localeId=${this.localeId}
          .hourFormat=${this.hourFormat}
          .minuteStep=${this.minuteStep}
          .minTime=${this.minTime}
          .maxTime=${this.maxTime}
          .disabledRanges=${this.disabledRanges}
          .height=${this.height}
          .itemHeight=${this.itemHeight}
          .noAvailableTimesMessage=${this.noAvailableTimesMessage}
          ?readonly=${this.readOnly}
          ?hidden=${!this._isListOpen}
          @change=${this.onListChange}
        ></gui-time-list>
      </div>

      ${this.showErrors
        ? addErrors(this.uid ?? '', { errors: this.errors, touched: this.touched })
        : ''}
    `;
  }

  private onTimeChange(event: CustomEvent) {
    this.value = event.detail.value ?? undefined;
  }

  private onTimeBlur() {
    this.dispatchEvent(new CustomEvent('blur'));
  }

  private onListChange(event: CustomEvent) {
    this.value = event.detail.value;
    this.restoreFocusToInput();
    this.closeList();
  }

  private onKeyUp = (event: KeyboardEvent) => {
    if (this.disabled) return;
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      this._isListOpen = !this._isListOpen;
    }
  };

  /**
   * Select-like keyboard behavior when custom time entry is off: ArrowDown/
   * ArrowUp move the value to the next/previous enabled option (the first or
   * last one when nothing is selected yet).
   */
  private onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && this._isListOpen) {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' && target.closest('gui-time')) {
        this.closeList();
        return;
      }
    }

    if (this.allowCustomTime || this.readOnly || this.disabled) return;
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

    const target = event.target as HTMLElement;
    if (!target.closest('gui-time')) return;

    event.preventDefault();
    this.selectAdjacentOption(event.key === 'ArrowDown' ? 1 : -1);
  };

  private selectAdjacentOption(direction: 1 | -1) {
    const options = buildTimeOptions({
      minTime: this.minTime,
      maxTime: this.maxTime,
      minuteStep: this.minuteStep,
      disabledRanges: this.disabledRanges,
    });
    if (!options.length) return;

    const currentIndex = options.findIndex((option) => option.value === this.value);
    let index =
      currentIndex === -1 ? (direction === 1 ? 0 : options.length - 1) : currentIndex + direction;
    while (index >= 0 && index < options.length && options[index].disabled) {
      index += direction;
    }
    if (index < 0 || index >= options.length) return;

    this.value = options[index].value;
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );
    this.openList();
    this.updateComplete.then(() => this._listRef?.scrollToSelectedValue());
  }

  private toggleList = (event: Event) => {
    if (this.disabled) return;
    const target = event.target as HTMLElement;

    if (target.closest('.gui-time-list__option')) return;

    const isInputClick = target.closest('.gui-time-input__part');
    const isListClick = target.closest('gui-time-list');
    if (isInputClick || isListClick) {
      this.openList();
    } else {
      this._isListOpen = !this._isListOpen;
    }
  };

  openList = () => {
    if (this.disabled || this._restoringFocus) return;
    if (!this._isListOpen) {
      this._isListOpen = true;
      this.updateComplete.then(() => this._listRef?.scrollToSelectedValue());
    }
  };

  closeList() {
    this._isListOpen = false;
  }

  private restoreFocusToInput() {
    const part = this.querySelector<HTMLElement>('gui-time input, gui-time button');
    if (!part) return;
    this._restoringFocus = true;
    part.focus();
    setTimeout(() => {
      this._restoringFocus = false;
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-time-picker': GuiTimePicker;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('gui-time-picker')) {
  customElements.define('gui-time-picker', GuiTimePicker);
}
