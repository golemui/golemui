import { html, LitElement, type PropertyValues } from 'lit';
import { property, query } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit/internals';
import { classMap } from 'lit/directives/class-map.js';
import './time-input';
import './time-list';
import type { GuiTime } from './time-input';
import type { GuiTimeList } from './time-list';
import { GUIFocusLeaveController } from '../controllers/focus-leave.controller';
import { GUIPopupController } from '../controllers/popup.controller';
import { buildTimeOptions, isTimeDisabled, type HourFormat, type TimeRange } from '../utils/time';
import { timeBoundsError } from '../utils/parts';
import { addErrors, addIcon, addLabel, addPickerPanel } from '../utils/templates';
import { INVALID_DISABLED_TIME_RANGE_MESSAGE } from '../utils/messages';
import { CARET_DOWN_PATH } from '../utils/icons';

export class GuiTimePicker extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: String }) icon: string | undefined = '';
  @property({ type: String, attribute: 'toggle-aria-label' }) toggleAriaLabel: string | undefined =
    undefined;
  @property({ type: String }) hourAriaLabel: string | undefined = undefined;
  @property({ type: String }) minuteAriaLabel: string | undefined = undefined;
  @property({ type: String }) dayPeriodAriaLabel: string | undefined = undefined;
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
  @property({ type: String, attribute: 'incomplete-message' }) incompleteMessage:
    | string
    | undefined = undefined;
  /**
   * Set by hosts (the date-time calendars) that run their own focus-leave
   * check over a subtree containing this picker: skips the picker's own
   * incomplete-on-leave handling.
   */
  @property({ type: Boolean, attribute: 'defer-focus-leave' }) deferFocusLeave:
    | boolean
    | undefined = false;

  @query('gui-time-list') private _listRef?: GuiTimeList;

  private _focusLeave = new GUIFocusLeaveController(this, {
    onLeave: () => {
      // Embedded in a calendar: that host owns focus reporting for the subtree.
      if (this.deferFocusLeave) return;
      this.dispatchEvent(new CustomEvent('blur'));
      this.reportIncompleteOnLeave();
    },
  });

  private _popup = new GUIPopupController(this, {
    focusRestoreSelector: 'gui-time input, gui-time button',
    focusPopupSelector: '.gui-time-list__option[tabindex="0"]',
    isDisabled: () => !!this.disabled,
    clickIntent: (target) => {
      if (target.closest('.gui-time-list__option')) return 'ignore';
      return target.closest('gui-time') || target.closest('.gui-picker__panel') ? 'open' : 'toggle';
    },
    keyToggleMode: 'openClose',
    onOpenChanged: (open) => {
      this.dispatchListToggle(open);
      if (open) {
        this.updateComplete.then(() => this._listRef?.scrollToSelectedValue());
      }
    },
  });

  override createRenderRoot() {
    return this;
  }

  override updated(changed: PropertyValues) {
    if (changed.has('value') && this._listRef && this._listRef.value !== this.value) {
      this._listRef.value = this.value;
    }
  }

  override render() {
    const timePickerIcon = addIcon('timePicker', { icon: this.icon });

    return html`
      ${addLabel(
        this.uid ?? '',
        {
          label: this.label,
          hint: this.hint,
          required: this.required,
        },
        false,
        undefined,
        false,
      )}

      <div
        class="gui-widget"
        @keydown=${this.onKeyDown}
        @click=${this._popup.onAnchorClick}
        @focusout=${this._focusLeave.onFocusOut}
      >
        <gui-time
          id="time-input"
          class=${classMap(timePickerIcon.widgetClasses)}
          .uid=${this.uid}
          .hint=${this.hint}
          .showErrors=${false}
          .deferFocusLeave=${true}
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
          .hourAriaLabel=${this.hourAriaLabel}
          .minuteAriaLabel=${this.minuteAriaLabel}
          .dayPeriodAriaLabel=${this.dayPeriodAriaLabel}
          .minTimeMessage=${this.minTimeMessage}
          .maxTimeMessage=${this.maxTimeMessage}
          .incompleteMessage=${this.incompleteMessage}
          @blur=${this.onTimeBlur}
          @focus=${this._popup.show}
          @change=${this.onTimeChange}
        ></gui-time>
        <button
          type="button"
          class="gui-time-picker__arrow"
          aria-label=${this.toggleAriaLabel ?? 'Show time list'}
          aria-haspopup="dialog"
          aria-expanded=${this._popup.open ? 'true' : 'false'}
          aria-controls=${`${this.uid}_popup`}
          ?disabled=${this.disabled}
          @click=${this.onToggleClick}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 256 256"
            aria-hidden="true"
          >
            <path d=${CARET_DOWN_PATH}></path>
          </svg>
        </button>

        ${addPickerPanel(
          this.uid ?? '',
          { errors: this.errors, touched: this.touched, showErrors: this.showErrors },
          // Dual hidden: tests select the inner list's [hidden]; the panel's
          // own [hidden] removes the card chrome. Both bind to the same state.
          html`<gui-time-list
            id=${`${this.uid}_popup`}
            role="dialog"
            aria-label=${this.label ?? 'Time list'}
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
            ?hidden=${!this._popup.open}
            @change=${this.onListChange}
          ></gui-time-list>`,
          { hidden: !this._popup.open },
        )}
      </div>

      ${this.showErrors
        ? addErrors(this.uid ?? '', { errors: this.errors, touched: this.touched })
        : ''}
    `;
  }

  private onToggleClick = (event: Event) => {
    // The wrapper's clickIntent handler must not double-handle the toggle.
    event.stopPropagation();
    if (this._popup.open) {
      this._popup.close();
    } else {
      this._popup.openAndFocus();
    }
  };

  private onTimeChange(event: CustomEvent) {
    event.stopPropagation();
    this.commitValue(event.detail.value);
  }

  /**
   * The field's per-part blur stays inside the widget: moving from a segment
   * into the time list is not leaving the control, so it must not be reported
   * as a blur (which the form layer reads as "validate now"). The picker
   * reports blur from its own focus-leave check instead.
   */
  private onTimeBlur(event: Event) {
    event.stopPropagation();
  }

  private onListChange(event: CustomEvent) {
    event.stopPropagation();
    // Picking an option from the list is a deliberate, final selection.
    this.commitValue(event.detail.value, true);
    this._popup.restoreFocusToInput();
    this._popup.close();
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
    const boundsError = timeBoundsError(value, {
      minTime: this.minTime,
      maxTime: this.maxTime,
      minTimeMessage: this.minTimeMessage,
      maxTimeMessage: this.maxTimeMessage,
    });
    if (boundsError) return boundsError;
    if (isTimeDisabled(value, this.disabledRanges)) {
      return this.disabledRangeMessage ?? INVALID_DISABLED_TIME_RANGE_MESSAGE;
    }
    return null;
  }

  /**
   * Select-like keyboard behavior when custom time entry is off: ArrowDown/
   * ArrowUp move the value to the next/previous enabled option (the first or
   * last one when nothing is selected yet).
   */
  private onKeyDown = (event: KeyboardEvent) => {
    if (this._popup.onAnchorKeyDown(event)) return;

    if (event.key === 'Enter') {
      const target = event.target as HTMLElement;
      if (target.closest('gui-time')) {
        if (this._popup.open) this._popup.close();
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
    this._popup.show();
    this.updateComplete.then(() => this._listRef?.scrollToSelectedValue());
  }

  /** Public close hook kept for the date-time calendars, which close the
   * embedded time-picker's list imperatively. */
  closeList() {
    this._popup.close();
  }

  /**
   * Hands the embedded input its deferred settlement: a partially typed time
   * left behind surfaces the incomplete message, an emptied one clears a
   * message it surfaced earlier. The input's resulting change bubbles back
   * through {@link onTimeChange}, so the picker's value follows.
   */
  private reportIncompleteOnLeave(): void {
    this.querySelector<GuiTime>('gui-time')?.settleOnFocusLeave();
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
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-time-picker': GuiTimePicker;
  }
}

safeDefine('gui-time-picker', GuiTimePicker);
