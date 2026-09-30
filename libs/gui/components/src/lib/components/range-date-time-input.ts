import { html, nothing, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { cspStyleMap } from '@golemui/lit-utils';
import { safeDefine } from '@golemui/lit-utils';
import { classMap } from 'lit/directives/class-map.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { GUIEditSessionController } from '../controllers/edit-session.controller';
import { GUIFocusLeaveController } from '../controllers/focus-leave.controller';
import { GUIPartsController } from '../controllers/parts.controller';
import { GUIPillsNavigationController } from '../controllers/pills-navigation.controller';
import {
  dateTimeBoundsError,
  dateTimeRangeOverlaps,
  formatISODateTimeForLocale,
  getDateTimeFormatParts,
  mergeDateTimeRanges,
  orderDateTimeRange,
  parseISODateTimeString,
  type HourFormat,
} from '../utils/time';
import { renderGroupParts, type GUIPartsTemplateData } from '../utils/part-templates';
import {
  getTimeLocaleData,
  parseDateTimeGroup,
  parseDateTimeSubGroups,
  type DateTimePartDescriptor,
  type DateTimePartType,
} from '../utils/parts';
import { commitRange, type RangeEndpoint } from '../utils/range-commit';
import {
  buildPillItems,
  findRangeByKey,
  formatRangeLabel,
  removeRangeByKey,
  sameRanges,
  sortRangesByStart,
} from '../utils/pill-ranges';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';
import './pills';
import type { GuiPillEventDetail, GuiPillItem, GuiPillsDropdownEventDetail } from './pills';
import type { DateTimeRange } from '../types';
import { GuiFormControl } from '../gui-form-control';
import {
  dispatch,
  dispatchBlur,
  dispatchInputError,
  dispatchValue,
  fires,
  valueEvents,
  type GuiInputErrorEventDetail,
} from '../utils/events';
import { message } from '../utils/messages';

/** What <gui-range-date-time-input> renders besides the control state: its presentation props. */
export type GuiRangeDateTimeInputProps = {
  hint?: string;
};

/**
 * A field to type one or more date-time ranges, shown as pills.
 *
 * @fires gui-input - The user changed the value. `detail.value` is the new value.
 * @fires gui-change - The user added, removed or finished editing a range. `detail.value` is the
 *   list of ranges.
 * @fires gui-blur - Focus left the control.
 * @fires gui-focus - One of the parts of the field received focus.
 * @fires gui-input-error - The element rejected what the user entered, such as an impossible date
 *   or a value out of bounds. `detail.message` is the error; show it through `errors`.
 * @fires gui-parts-change - The typed parts changed before they form a complete value, for a host
 *   that mirrors them.
 * @fires gui-edit-state-change - Editing a range in place started, changed selection or ended.
 *   `detail` has the `selected` range and whether it is `editing`.
 * @fires gui-range-click - The user clicked a range pill. `detail.range` is the range.
 * @fires gui-dropdown-toggle - The count of ranges opened or closed its dropdown. `detail.open` is
 *   the new state.
 * @cssprop --gui-pill-height - Height of each pill.
 * @cssprop --gui-pill-font-size - Font size of the pill text.
 * @cssprop --gui-pill-action-size - Size of the icons inside a pill.
 * @cssprop --gui-pill-action-hit - Clickable area of the buttons inside a pill.
 */
export class GuiRangeDateTimeInput extends GuiFormControl {
  /** BCP 47 locale for formatting and parsing, such as `en-US` or `es`. */
  @property({ type: String, attribute: 'locale-id' }) localeId: string | undefined = undefined;
  /**
   * Whether the element renders its own error list. Elements that embed it turn it off and show the
   * errors themselves.
   */
  @property({ type: Boolean, attribute: 'show-errors' }) showErrors: boolean | undefined = true;

  /** Icon class name shown inside the control, for example from an icon font. */
  @property({ type: String }) icon: string | undefined = '';
  /** Accessible name of the day part. */
  @property({ type: String, attribute: 'day-aria-label' }) dayAriaLabel: string | undefined =
    undefined;
  /** Accessible name of the month part. */
  @property({ type: String, attribute: 'month-aria-label' }) monthAriaLabel: string | undefined =
    undefined;
  /** Accessible name of the year part. */
  @property({ type: String, attribute: 'year-aria-label' }) yearAriaLabel: string | undefined =
    undefined;
  /** Accessible name of the hour part. */
  @property({ type: String, attribute: 'hour-aria-label' }) hourAriaLabel: string | undefined =
    undefined;
  /** Accessible name of the minute part. */
  @property({ type: String, attribute: 'minute-aria-label' }) minuteAriaLabel: string | undefined =
    undefined;
  /** Accessible name of the AM/PM part. */
  @property({ type: String, attribute: 'day-period-aria-label' }) dayPeriodAriaLabel:
    | string
    | undefined = undefined;

  /** 12- or 24-hour clock. Defaults to the locale's. */
  @property({ type: String, attribute: 'hour-format' }) hourFormat: HourFormat | undefined =
    undefined;
  /** Minutes between the times offered in the list. */
  @property({ type: Number, attribute: 'minute-step' }) minuteStep: number | undefined = 1;
  /** Error for a complete but impossible date, such as February 31. */
  @property({ type: String, attribute: 'invalid-date-message' }) invalidDateMessage:
    | string
    | undefined = undefined;

  /** The date-time ranges, as `{ start, end }` ISO date-times. */
  @property({ type: Array }) value: DateTimeRange[] | undefined = [];
  /** Accessible name of the remove button of each range pill. */
  @property({ type: String, attribute: 'remove-pill-aria-label' }) removePillAriaLabel:
    | string
    | undefined = undefined;
  /** Accessible name of the start date-time field. */
  @property({ type: String, attribute: 'start-date-time-aria-label' }) startDateTimeAriaLabel:
    | string
    | undefined = undefined;
  /** Accessible name of the end date-time field. */
  @property({ type: String, attribute: 'end-date-time-aria-label' }) endDateTimeAriaLabel:
    | string
    | undefined = undefined;
  /** Text shown between the start and end of a range. */
  @property({ type: String }) separator: string | undefined = undefined;
  /** Earliest allowed date-time, as an ISO date-time (`YYYY-MM-DDTHH:mm:ss`). */
  @property({ type: String, attribute: 'min-date-time' }) minDateTime: string | undefined =
    undefined;
  /** Latest allowed date-time, as an ISO date-time (`YYYY-MM-DDTHH:mm:ss`). */
  @property({ type: String, attribute: 'max-date-time' }) maxDateTime: string | undefined =
    undefined;
  /** Error for a date-time before `minDateTime`. */
  @property({ type: String, attribute: 'min-date-time-message' }) minDateTimeMessage:
    | string
    | undefined = undefined;
  /** Error for a date-time after `maxDateTime`. */
  @property({ type: String, attribute: 'max-date-time-message' }) maxDateTimeMessage:
    | string
    | undefined = undefined;
  /**
   * Disabled instant spans a typed range must not overlap. Not part of the
   * standalone rangeDateTimeInput widget's public API (typed inputs in this
   * family stay hole-unaware, matching rangeTimeInput); this is here just to
   * pass them down to the range date-time picker's calendar
   */
  @property({ type: Array, attribute: 'disabled-ranges' }) disabledRanges:
    | DateTimeRange[]
    | undefined = undefined;
  /** Error for a time inside `disabledRanges`. */
  @property({ type: String, attribute: 'disabled-range-message' }) disabledRangeMessage:
    | string
    | undefined = undefined;
  /** Error when focus leaves a partly filled value. */
  @property({ type: String, attribute: 'incomplete-message' }) incompleteMessage:
    | string
    | undefined = undefined;
  /** Opt-in select → edit → confirm flow on the pills. */
  @property({ type: Boolean, attribute: 'allow-edit' }) allowEdit: boolean | undefined = false;
  /** Tooltip of the edit button of a range pill. */
  @property({ type: String, attribute: 'edit-label' }) editLabel: string | undefined = undefined;
  /** Hint that a range pill can be edited. `{label}` is the range. */
  @property({ type: String, attribute: 'edit-aria-label' }) editAriaLabel: string | undefined =
    undefined;
  /** Tooltip of the confirm button of a range being edited. */
  @property({ type: String, attribute: 'confirm-edit-label' }) confirmEditLabel:
    | string
    | undefined = undefined;
  /** Tooltip of the cancel button of a range being edited. */
  @property({ type: String, attribute: 'cancel-edit-label' }) cancelEditLabel: string | undefined =
    undefined;
  /** Announcement when editing a range starts. `{label}` is the range. */
  @property({ type: String, attribute: 'edit-started-message' }) editStartedMessage:
    | string
    | undefined = undefined;
  /** Announcement when an edited range is saved. `{label}` is the new range. */
  @property({ type: String, attribute: 'edit-committed-message' }) editCommittedMessage:
    | string
    | undefined = undefined;
  /** Announcement when editing a range is cancelled. */
  @property({ type: String, attribute: 'edit-cancelled-message' }) editCancelledMessage:
    | string
    | undefined = undefined;
  /**
   * Set by host pickers that run their own whole-widget focus-leave check:
   * moving focus from this input into the picker's popover must not count as
   * leaving, so the embedded input skips its incomplete-on-leave handling.
   */
  @property({ type: Boolean, attribute: 'defer-focus-leave' }) deferFocusLeave:
    | boolean
    | undefined = false;

  private readonly inputBlockClass = 'gui-range-date-time-input';
  private readonly groups = ['start', 'end'] as const;

  private readonly dateTimePartTypes: readonly DateTimePartType[] = [
    'day',
    'month',
    'year',
    'hour',
    'minute',
  ];

  /**
   * Set on the first commit attempt (Enter). While set, every part change
   * re-runs validation so a resolved error clears without another Enter.
   * Cleared once a pill is committed, so the next range starts quiet.
   */
  private _validationTriggered = false;

  private _parts = new GUIPartsController(this, {
    blockClass: this.inputBlockClass,
    groups: this.groups,
    getDescriptor: (type) => this.getPartDescriptor(type),
    commitGroup: () => {
      if (this._validationTriggered) {
        this.revalidate();
      } else {
        this.syncParts();
      }
    },
    isReadonly: () => !!this.readOnly,
    isDisabled: () => !!this.disabled,
    onEmptyPartBlur: () => {
      // Unlike gui-date-time, an empty part never commits a null value
    },
    onNavigatePastStart: () => this._pillsNav.enterPillList(),
    onEmptyPartDelete: () => {
      if (this.disabled || this.readOnly) return;
      const allEmpty =
        this._parts.isGroupEmpty('start', this.dateTimePartTypes) &&
        this._parts.isGroupEmpty('end', this.dateTimePartTypes);
      if (allEmpty) this._pillsNav.enterPillList();
    },
    onEnter: () => {
      const wasEditing = !!this._edit.editing;
      this.tryCreatePill();
      if (!wasEditing && this.value && this.value.length > 0) {
        this.onPillClick(this.value[this.value.length - 1]);
      }
    },
    getHourFormat: () => this.localeData.effectiveHourFormat,
    getDayPeriodLabels: () => this.localeData.dayPeriodLabels,
    onInputErrorSurfaced: (message) => dispatchInputError(this, message),
    onSurfacedErrorCleared: (value) => dispatchValue(this, value, { commit: false }),
  });

  private _pillsNav = new GUIPillsNavigationController(this, {
    getPills: () => this.querySelector('gui-pills'),
    getPillCount: () => this.value?.length ?? 0,
    focusLinkedInput: () => this._parts.focusFirst('start', true),
  });

  /** Ordered start of the last composed range; read back after a commit. */
  private _lastComposedStart: string | null = null;
  /** Last synced endpoints — the editing pill's live label. */
  private _workingISO: { start: string | null; end: string | null } = { start: null, end: null };

  private _edit = new GUIEditSessionController<DateTimeRange>(this, {
    isEnabled: () => this.editEnabled,
    getRanges: () => this.value,
    compareStarts: (a, b) =>
      parseISODateTimeString(a).getTime() - parseISODateTimeString(b).getTime(),
    formatLabel: (range) => this.formatPillLabel(range),
    loadRange: (range) => this.loadRangeForEdit(range),
    clearCompose: () => this.clearCompose(),
    onStateChanged: () => this.emitEditState(),
    getPills: () => this.querySelector('gui-pills'),
    getMessages: () => ({
      started: message('editRangeStarted', this.editStartedMessage),
      committed: message('editRangeCommitted', this.editCommittedMessage),
      cancelled: message('editRangeCancelled', this.editCancelledMessage),
    }),
  });

  private get editEnabled(): boolean {
    return !!this.allowEdit && !this.disabled && !this.readOnly;
  }

  /**
   * The single point where the input reports focus leaving the control. It
   * settles what is in the fields FIRST, then blurs — the form layer reads a
   * blur as "validate now", and storing a value runs no validator, so blurring
   * first would validate the value the commit is about to replace and leave a
   * `required` error standing over a range the user did finish. Hopping
   * between segments is not a departure and never reaches here.
   */
  private _focusLeave = new GUIFocusLeaveController(this, {
    resolveSyncOnRelatedTarget: true,
    onLeave: () => {
      // Embedded in a picker: that host owns focus reporting for the subtree.
      if (this.deferFocusLeave) return;
      this.finalizeOnLeave();
      dispatchBlur(this);
    },
  });

  protected ariaController: GUIAriaController<unknown, any> = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`.${this.inputBlockClass}`),
    getState: () => ({
      uid: this.uid,
      templateData: {
        hint: this.hint,
        errors: this.errors,
        readonly: this.readOnly,
        disabled: this.disabled,
        touched: this.touched,
        required: this.required,
      },
    }),
  });

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-field');
  }

  private get localeData() {
    return getTimeLocaleData(this.localeId, this.hourFormat, this.minuteStep, true);
  }

  private getPartDescriptor(type: string): DateTimePartDescriptor | undefined {
    return this.localeData.descriptors[type as DateTimePartType];
  }

  override willUpdate(changedProperties: PropertyValues): void {
    if (
      !this.hasUpdated ||
      changedProperties.has('hourFormat') ||
      changedProperties.has('localeId')
    ) {
      this._parts.seedDayPeriods();
    }
    this._edit.reconcileValue(this.value);
  }

  override render() {
    const templateData: ControlTemplateData<DateTimeRange[]> & GuiRangeDateTimeInputProps = {
      uid: this.uid,
      label: this.label,
      errors: this.errors,
      touched: this.touched,
      required: this.required,
      disabled: this.disabled,
      readonly: this.readOnly,
      value: this.value,
      hint: this.hint,
    };

    const partsData: GUIPartsTemplateData = {
      blockClass: this.inputBlockClass,
      groups: this.groups,
      formatParts: getDateTimeFormatParts(this.localeId, this.localeData.effectiveHourFormat),
      getDescriptor: (type) => this.getPartDescriptor(type),
      getDisplayValue: this._parts.getPartDisplay,
      getPartAriaLabel: (_group: string, type: DateTimePartType) => {
        const overrides: Partial<Record<DateTimePartType, string | undefined>> = {
          day: this.dayAriaLabel,
          month: this.monthAriaLabel,
          year: this.yearAriaLabel,
          hour: this.hourAriaLabel,
          minute: this.minuteAriaLabel,
        };
        return message(type, overrides[type]);
      },
      dayPeriodAriaLabel: this.dayPeriodAriaLabel,
      disabled: this.disabled,
      partsReadonly: !!this.readOnly,
    };

    const pillItems: GuiPillItem[] = this.decoratePillItems(
      buildPillItems(this.getSortedPills(), (range) => this.formatPillLabel(range)),
    );

    const iconClassMap = {
      'gui-widget-icon': true,
      [this.icon as string]: !!this.icon,
    };

    return html`
      ${addLabel(this.uid, templateData, false, undefined, false)}

      <div
        class="gui-widget"
        @focusout=${this._focusLeave.onFocusOut}
        @keydown=${this.onWidgetKeyDown}
      >
        <div
          class="gui-widget-input gui-parts-ring gui-range-date-time-input ${this.icon
            ? 'gui-range-date-time-input--icon'
            : ''}"
          role="group"
          aria-label=${message('dateTimeRangeInput', this.label)}
        >
          ${this.icon
            ? html`<span
                class=${classMap(iconClassMap)}
                data-icon=${this.icon}
                aria-hidden="true"
              ></span>`
            : nothing}

          <gui-pills
            class="gui-range-date-time-input__pills"
            style=${cspStyleMap(pillItems.length ? {} : { 'min-width': 0 })}
            .uid=${this.uid}
            .toolbarAriaLabel=${message('selectedDateTimeRanges')}
            .items=${pillItems}
            .errors=${this.errors}
            .touched=${!!this.touched}
            .removable=${true}
            .clickable=${true}
            .bubble=${true}
            .tabbable=${false}
            ?disabled=${this.disabled}
            ?readonly=${this.readOnly}
            .removeAriaLabel=${message('removeDateTime', this.removePillAriaLabel)}
            .compactAriaLabel=${message('dateTimeRangeCount', undefined, {
              count: pillItems.length,
            })}
            .editable=${this.editEnabled}
            .selectedKey=${this._edit.selectedKey ?? undefined}
            .editingKey=${this._edit.editing?.key ?? undefined}
            .editLabel=${message('editRange', this.editLabel)}
            .confirmEditLabel=${message('confirmEditRange', this.confirmEditLabel)}
            .cancelEditLabel=${message('cancelEditRange', this.cancelEditLabel)}
            @gui-pill-remove=${this.onPillRemoveEvent}
            @gui-pill-click=${this.onPillClickEvent}
            @gui-pill-focus=${this.onPillFocusEvent}
            @gui-pills-blur=${this.onPillsBlurEvent}
            @gui-pill-edit=${this.onPillEditEvent}
            @gui-pill-edit-confirm=${this.onPillEditConfirm}
            @gui-pill-edit-cancel=${this.onPillEditCancel}
            @gui-pill-keydown=${this._pillsNav.onPillKeydown}
            @gui-pill-exit=${this._pillsNav.onPillExit}
          ></gui-pills>

          <div class="gui-range-date-time-input__inputs">
            <div
              class="gui-parts gui-range-date-time-input__field"
              role="group"
              aria-label=${message('startDateTime', this.startDateTimeAriaLabel)}
            >
              ${renderGroupParts('start', partsData, this._parts)}
            </div>

            <span class="gui-range-date-time-input__separator">${this.separator ?? '-'}</span>

            <div
              class="gui-parts gui-range-date-time-input__field"
              role="group"
              aria-label=${message('endDateTime', this.endDateTimeAriaLabel)}
            >
              ${renderGroupParts('end', partsData, this._parts)}
            </div>
          </div>
        </div>

        ${this.allowEdit
          ? html`<div class="gui-visually-hidden" aria-live="polite">
              ${this._edit.announcement}
            </div>`
          : nothing}
      </div>

      ${this.showErrors && this.errors?.length ? addErrors(this.uid, templateData) : nothing}
    `;
  }

  private formatPillLabel(range: DateTimeRange): string {
    return formatRangeLabel(range, (iso) => this.formatDateTimeForDisplay(iso));
  }

  /**
   * allowEdit decoration on the pill items: the editing pill's label
   * live-previews the working value, and every pill carries the interpolated
   * edit hint for its `aria-description`.
   */
  private decoratePillItems(items: GuiPillItem[]): GuiPillItem[] {
    if (!this.editEnabled) return items;
    const editingKey = this._edit.editing?.key;
    return items.map((item) => {
      const label = item.key === editingKey ? this.workingLabel() : item.label;
      return {
        ...item,
        label,
        ariaLabel: label,
        editAriaLabel: message('editRangeHint', this.editAriaLabel, { label: item.label }),
      };
    });
  }

  /** The live label of the range being composed, one `…` per empty endpoint. */
  private workingLabel(): string {
    const format = (iso: string | null) => (iso ? this.formatDateTimeForDisplay(iso) : '…');
    return `${format(this._workingISO.start)} - ${format(this._workingISO.end)}`;
  }

  private onWidgetKeyDown = (e: KeyboardEvent) => {
    // Embedded in a picker: the picker owns the Escape layering.
    if (this.deferFocusLeave) return;
    this._edit.handleEscape(e);
  };

  private emitEditState() {
    dispatch(this, 'gui-edit-state-change', {
      selected: this._edit.selectedRange,
      editing: !!this._edit.editing,
    });
  }

  private loadRangeForEdit(range: DateTimeRange) {
    this._parts.clearSurfacedInputError(this.value ?? []);
    const [startDate, startTime] = range.start.split('T');
    const [endDate, endTime] = range.end.split('T');
    this.fillDate('start', startDate);
    this.fillTime('start', startTime ?? null);
    this.fillDate('end', endDate);
    this.fillTime('end', endTime ?? null);
    this._validationTriggered = true;
    this.syncParts();
    this._parts.focusFirst('start', true);
  }

  private clearCompose() {
    this._parts.clearGroup('start');
    this._parts.clearGroup('end');
    this._parts.seedDayPeriods();
    this._validationTriggered = false;
    this._parts.clearSurfacedInputError(this.value ?? []);
    this.syncParts();
  }

  /**
   * Starts editing the selected pill; the host picker's Edit action.
   *
   * @internal
   */
  startEdit(): boolean {
    return this._edit.startEdit();
  }

  /**
   * Cancels an open edit session; the host picker's Cancel action.
   *
   * @internal
   */
  cancelEdit(): void {
    this._edit.cancel();
  }

  /**
   * The host picker's Escape layering routes here once its popup declined
   * the key: cancels an open session first, then clears the selection.
   *
   * @internal
   */
  handleSessionEscape(event: KeyboardEvent): boolean {
    return this._edit.handleEscape(event);
  }

  /** @internal */
  get isEditing(): boolean {
    return !!this._edit.editing;
  }

  /** @internal */
  get selectedEditRange(): DateTimeRange | null {
    return this._edit.selectedRange;
  }

  /**
   * Attempts to commit the currently-entered parts as a pill, returning
   * whether one was created — the picker's confirm path onto the same
   * {@link tryCreatePill} pipeline typed entry uses.
   *
   * @internal
   */
  commitFromParts(): boolean {
    return this.tryCreatePill();
  }

  private onPillRemoveEvent = (e: CustomEvent<GuiPillEventDetail>) => {
    e.stopPropagation();
    if (this.disabled || this.readOnly) return;
    const removal = removeRangeByKey(this.value, e.detail.key);
    if (!removal) return;
    this.value = removal.next;
    dispatchValue(this, this.value);

    if (removal.next.length === 0) {
      // Strip is gone; return focus to the segments.
      this._pillsNav.focusLinkedInputDeferred();
    }
  };

  private onPillClickEvent = (e: CustomEvent<GuiPillEventDetail>) => {
    e.stopPropagation();
    const range = findRangeByKey(this.getSortedPills(), e.detail.key);
    if (!range) return;
    const outcome = this._edit.handlePillClick(e.detail.key);
    // 'cancelled' ends the session without navigating; 'ignored' (allowEdit
    // off) and 'selected' both keep the navigate event.
    if (outcome === 'cancelled') return;
    // 'ignored' (allowEdit off) and 'selected' both keep the navigate event.
    this.onPillClick(range);
  };

  /**
   * Keyboard navigation landed on a pill: the selection follows focus, so the
   * focused pill offers the edit affordance and drives the calendar marking.
   * An open session is left alone (its pill keeps focus semantics of its own).
   */
  private onPillFocusEvent = (e: CustomEvent<GuiPillEventDetail>) => {
    e.stopPropagation();
    if (!this.editEnabled || this._edit.editing) return;
    if (this._edit.selectedKey !== e.detail.key) this._edit.handlePillClick(e.detail.key);
  };

  /**
   * Focus left the pills for elsewhere: the selection follows it away, so the
   * edit affordance and any calendar marking disappear. An open session keeps
   * its selection — its focus legitimately lives in the compose surface.
   */
  private onPillsBlurEvent = (e: Event) => {
    e.stopPropagation();
    if (this._edit.editing) return;
    this._edit.clearSelection();
  };

  /** Edit icon or F2 / E on a pill: select it (if needed) and start editing. */
  private onPillEditEvent = (e: CustomEvent<GuiPillEventDetail>) => {
    e.stopPropagation();
    if (!this.editEnabled || this._edit.editing?.key === e.detail.key) return;
    if (this._edit.selectedKey !== e.detail.key) this._edit.handlePillClick(e.detail.key);
    this._edit.startEdit();
  };

  private onPillEditConfirm = (e: Event) => {
    e.stopPropagation();
    if (!this._edit.editing) return;
    this.commitFromParts();
  };

  private onPillEditCancel = (e: Event) => {
    e.stopPropagation();
    if (!this._edit.editing) return;
    this._edit.cancel();
    this._edit.focusSelectedPill();
  };

  private onPillClick(range: DateTimeRange) {
    dispatch(this, 'gui-range-click', { range });
  }

  private formatDateTimeForDisplay(iso: string): string {
    return formatISODateTimeForLocale(iso, this.localeId, this.localeData.effectiveHourFormat);
  }

  private getSortedPills(): DateTimeRange[] {
    return sortRangesByStart(
      this.value,
      (a, b) => parseISODateTimeString(a).getTime() - parseISODateTimeString(b).getTime(),
    );
  }

  /**
   * Parses a group into an ISO date-time via the shared clamp/bounds pipeline,
   * distinguishing an incomplete group (nothing to report) from a
   * complete-but-rejected one (an impossible date or an out-of-bounds
   * date-time). It does not emit: the caller decides whether to surface or
   * clear an error, so fixing one group clears its error even while the other
   * is still empty.
   *
   * Each endpoint is an instant, so it is bounded by instants. A date-only
   * bound could not express this: `maxDate: 2026-02-10` is ambiguous about
   * whether the 10th is allowed until 00:00 or 23:59, and independent date/time
   * axes would wrongly reject Feb 11 08:00 for a `minTime` of 09:00.
   */
  private validateDateTimeParts(group: string): RangeEndpoint<string> {
    const { effectiveHourFormat, descriptors } = this.localeData;
    const { result, writeBacks } = parseDateTimeGroup(this._parts.values[group] ?? {}, {
      hourFormat: effectiveHourFormat,
      descriptors,
      invalidDateMessage: this.invalidDateMessage,
    });
    this._parts.applyWriteBacks(group, writeBacks);

    if (result.kind === 'incomplete') return { kind: 'incomplete' };
    if (result.kind === 'invalid') return { kind: 'invalid', message: result.message };

    const boundsError = dateTimeBoundsError(result.iso, this.minDateTime, this.maxDateTime, {
      minDateTimeMessage: this.minDateTimeMessage,
      maxDateTimeMessage: this.maxDateTimeMessage,
    });
    if (boundsError) return { kind: 'invalid', message: boundsError };

    return { kind: 'valid', value: result.iso };
  }

  /**
   * Re-parses both endpoints so per-endpoint problems (impossible date-time,
   * out of instant bounds) surface while the user types, and notifies the host
   * picker via `gui-parts-change` so its calendar follows the typed endpoints. Each
   * endpoint reports its date and time halves separately, so a day highlights
   * as soon as it is complete even with the time still empty. Runs on every
   * part change.
   */
  private syncParts() {
    const start = this.validateDateTimeParts('start');
    const end = this.validateDateTimeParts('end');

    this._workingISO = {
      start: start.kind === 'valid' ? start.value : null,
      end: end.kind === 'valid' ? end.value : null,
    };
    if (this._edit.editing) this.requestUpdate();

    dispatch(this, 'gui-parts-change', {
      start: this.subGroupISO('start'),
      end: this.subGroupISO('end'),
    });

    return { start, end };
  }

  /** One endpoint's date and time halves, each null until it parses complete. */
  private subGroupISO(group: string): { date: string | null; time: string | null } {
    const { effectiveHourFormat, descriptors } = this.localeData;
    const { date, time } = parseDateTimeSubGroups(this._parts.values[group] ?? {}, {
      hourFormat: effectiveHourFormat,
      descriptors,
      invalidDateMessage: this.invalidDateMessage,
    });
    return {
      date: date.kind === 'valid' ? date.iso : null,
      time: time.kind === 'valid' ? time.iso : null,
    };
  }

  /**
   * What leaving does with whatever is in the fields. Public so a host picker
   * can call it from its own whole-widget focus-leave check.
   *
   * A complete range is finished work, so leaving commits it exactly as Enter
   * does — a user who typed a whole range and moved on gets the pill they
   * plainly meant, and the same validation decides whether it is allowed.
   *
   * A half-entered one is abandoned work: some parts of one endpoint typed, or
   * one endpoint filled and the other still empty (a span picked in the
   * calendar with no times lands here too). Both surface the incomplete
   * message — or the endpoint's own message when one is outright invalid,
   * which is more useful than "incomplete". `_validationTriggered` makes the
   * next edit re-evaluate, so the message clears as soon as the user comes
   * back and continues (or empties the fields).
   *
   * @internal
   */
  finalizeOnLeave(): void {
    if (this._edit.editing) {
      const results = this.groups.map((group) => this.validateDateTimeParts(group));
      if (results.every((result) => result.kind === 'valid')) {
        this.tryCreatePill({ refocus: false });
      }
      if (this._edit.editing) this._edit.cancel();
      this._edit.handleFocusLeave();
      return;
    }

    // Focus left the widget: drop the selection so the pill actions hide.
    this._edit.handleFocusLeave();

    const endpoints = this.groups.map((group) => ({
      result: this.validateDateTimeParts(group),
      empty: this._parts.isGroupEmpty(group, this.dateTimePartTypes),
    }));

    if (endpoints.every((endpoint) => endpoint.empty)) {
      this._parts.clearSurfacedInputError(this.value ?? []);
      return;
    }

    if (endpoints.every((endpoint) => endpoint.result.kind === 'valid')) {
      this.tryCreatePill({ refocus: false });
      return;
    }

    const invalidMessage = endpoints
      .map((endpoint) => (endpoint.result.kind === 'invalid' ? endpoint.result.message : undefined))
      .find(Boolean);

    this._validationTriggered = true;
    this._parts.surfaceInputError(
      invalidMessage ?? message('incompleteDateTime', this.incompleteMessage),
    );
  }

  /**
   * Parses the range and updates the error state, without ever committing.
   * Shared by the Enter commit and by {@link revalidate}.
   */
  private evaluateRange() {
    const { start, end } = this.syncParts();

    const result = commitRange(start, end, this._edit.baseRanges(this.value), {
      // Date-time ranges are two instants: a backward selection reorders (swap)
      // rather than erroring — mirroring the range calendar's date swap.
      order: (s, e) => {
        const ordered = orderDateTimeRange(s, e);
        return { start: ordered.start, end: ordered.end };
      },
      validate: (ordered) =>
        dateTimeRangeOverlaps({ start: ordered.start, end: ordered.end }, this.disabledRanges)
          ? message('disabledDateRange', this.disabledRangeMessage)
          : null,
      toRange: (ordered) => {
        this._lastComposedStart = ordered.start;
        return { start: ordered.start, end: ordered.end };
      },
      merge: mergeDateTimeRanges,
    });

    // A completed-but-rejected group (impossible date, or out of bounds) is
    // surfaced right away, using its own specific message.
    if (result.kind === 'invalid') {
      this._parts.surfaceInputError(result.message);
    }

    // Not both complete yet: no group is rejected, so clear any error a
    // now-corrected group left behind, then wait for the rest of the range.
    if (result.kind === 'incomplete') {
      this._parts.clearSurfacedInputError(this.value ?? []);
    }

    return result;
  }

  /**
   * Once the user has attempted a commit, every later edit re-runs validation
   * so a corrected range clears its error immediately, otherwise the message
   * would linger until the next Enter and the user could not tell the problem
   * was solved.
   */
  private revalidate() {
    const result = this.evaluateRange();

    if (result.kind === 'commit') {
      this._parts.clearSurfacedInputError(this.value ?? []);
    }
  }

  private tryCreatePill({ refocus = true }: { refocus?: boolean } = {}): boolean {
    const wasEditing = !!this._edit.editing;
    this._validationTriggered = true;

    const result = this.evaluateRange();
    if (result.kind !== 'commit') return false;

    if (
      wasEditing &&
      sameRanges(this.getSortedPills(), sortRangesByStart(result.value, this.compareStarts))
    ) {
      this._edit.cancel();
      return false;
    }

    this.value = result.value;
    this._validationTriggered = false;

    this._parts.clearGroup('start');
    this._parts.clearGroup('end');
    this._parts.seedDayPeriods();

    // The commit's own change clears any injected error downstream.
    this._parts.resetSurfacedInputError();
    dispatchValue(this, this.value);

    if (wasEditing) {
      // Selection and focus move to the committed (possibly merged) pill.
      this._edit.completed(this._lastComposedStart ?? '', { focus: refocus });
    } else if (refocus) {
      this._parts.focusFirst('start');
    }
    this.requestUpdate();
    return true;
  }

  private compareStarts = (a: string, b: string): number =>
    parseISODateTimeString(a).getTime() - parseISODateTimeString(b).getTime();

  /**
   * Paints only one endpoint's date parts from an ISO date (null clears
   * them), leaving its time parts untouched. The range date-time picker calls
   * this so a day picked in the calendar lands in the visible field straight
   * away — the reverse of typed parts moving the calendar's selection.
   *
   * @internal
   */
  fillDate(group: 'start' | 'end', iso: string | null): void {
    this._parts.setGroupFromISO(group, iso, 'date');
    if (this._edit.editing) this.syncParts();
    this.requestUpdate();
  }

  /**
   * The counterpart of {@link fillDate} for an endpoint's time parts.
   *
   * @internal
   */
  fillTime(group: 'start' | 'end', iso: string | null): void {
    this._parts.setGroupFromISO(group, iso, 'time', this.localeData.effectiveHourFormat);
    if (this._edit.editing) this.syncParts();
    this.requestUpdate();
  }
}

/** The events `gui-range-date-time` fires, with their types. */
export const GuiRangeDateTimeInputEvents = {
  'gui-dropdown-toggle': fires<CustomEvent<GuiPillsDropdownEventDetail>>(),
  ...valueEvents<GuiRangeDateTimeInput['value']>(),
  'gui-focus': fires<CustomEvent<FocusEvent>>(),
  'gui-input-error': fires<CustomEvent<GuiInputErrorEventDetail>>(),
  'gui-parts-change': fires<
    CustomEvent<{
      start: { date: string | null; time: string | null };
      end: { date: string | null; time: string | null };
    }>
  >(),
  'gui-edit-state-change':
    fires<CustomEvent<{ selected: DateTimeRange | null; editing: boolean }>>(),
  'gui-range-click': fires<CustomEvent<{ range: DateTimeRange }>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-range-date-time': GuiRangeDateTimeInput;
  }
}

safeDefine('gui-range-date-time', GuiRangeDateTimeInput);
