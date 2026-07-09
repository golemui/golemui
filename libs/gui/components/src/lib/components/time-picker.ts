import { html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import './time-input';
import './time-list';
import type { GuiTimeList } from './time-list';
import { buildTimeOptions, isTimeDisabled, type HourFormat, type TimeRange } from '../utils/time';
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
  @property({ type: Array, attribute: 'disabled-ranges' }) disabledRanges: TimeRange[] | undefined =
    undefined;
  @property({ type: Boolean, attribute: 'allow-custom-time' }) allowCustomTime:
    | boolean
    | undefined = false;
  @property({ type: Number }) height: number | undefined = undefined;
  @property({ type: Number, attribute: 'item-height' }) itemHeight: number | undefined = undefined;
  @property({ type: Number }) columns: number | undefined = undefined;
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
          .minTimeMessage=${this.minTimeMessage}
          .maxTimeMessage=${this.maxTimeMessage}
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
          .columns=${this.columns}
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
    event.stopPropagation();
    this.commitValue(event.detail.value);
  }

  private onTimeBlur() {
    this.dispatchEvent(new CustomEvent('blur'));
  }

  private onListChange(event: CustomEvent) {
    event.stopPropagation();
    // Picking an option from the list is a deliberate, final selection.
    this.commitValue(event.detail.value, true);
    this.restoreFocusToInput();
    this.closeList();
  }

  /**
   * @param commit Marks the change as a deliberate final selection (list pick
   *   or Enter) as opposed to continuous field editing (typing/arrows). A host
   *   popover (the date-time calendar) closes only on a committed change, so
   *   editing the time in place doesn't dismiss it mid-entry.
   */
  private commitValue(value: string | null | undefined, commit = false) {
    this.value = value ?? undefined;
    const error = this.validateBounds(this.value);
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: value ?? null, commit },
        bubbles: true,
        composed: true,
      }),
    );
    if (error) {
      this.dispatchEvent(
        new CustomEvent('inputError', {
          detail: { message: error },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private validateBounds(value: string | undefined): string | null {
    if (!value) return null;
    if (isTimeDisabled(value, this.disabledRanges)) {
      return this.disabledRangeMessage ?? 'Invalid time: time is within a disabled range.';
    }
    return null;
  }

  private onKeyUp = (event: KeyboardEvent) => {
    if (this.disabled) return;
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      if (this._isListOpen) this.closeList();
      else this.openList();
    }
  };

  /**
   * Select-like keyboard behavior when custom time entry is off: ArrowDown/
   * ArrowUp move the value to the next/previous enabled option (the first or
   * last one when nothing is selected yet).
   */
  private onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this._isListOpen) {
      event.preventDefault();
      event.stopPropagation();
      this.restoreFocusToInput();
      this.closeList();
      return;
    }

    if (event.key === 'Enter') {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' && target.closest('gui-time')) {
        if (this._isListOpen) this.closeList();
        this.commitValue(this.value, true);
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

    this.commitValue(options[index].value);
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
    } else if (this._isListOpen) {
      this.closeList();
    } else {
      this.openList();
    }
  };

  openList = () => {
    if (this.disabled || this._restoringFocus || this._isListOpen) return;
    this._isListOpen = true;
    this.dispatchListToggle(true);
    this.updateComplete.then(() => this._listRef?.scrollToSelectedValue());
  };

  closeList() {
    if (!this._isListOpen) return;
    this._isListOpen = false;
    this.dispatchListToggle(false);
  }

  private dispatchListToggle(open: boolean) {
    this.dispatchEvent(
      new CustomEvent('listtoggle', {
        detail: { open },
        bubbles: true,
        composed: true,
      }),
    );
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
