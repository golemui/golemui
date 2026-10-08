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
import { renderGroupParts, type GUIPartsTemplateData } from '../utils/part-templates';
import {
  getTimeLocaleData,
  parseTimeGroup,
  timeBoundsError,
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
import {
  compareISOTimes,
  formatISOTimeForLocale,
  getTimeFormatParts,
  isTimeRangeDisabled,
  mergeTimeRanges,
  type HourFormat,
} from '../utils/time';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';
import './pills';
import type { GuiPillEventDetail, GuiPillItem, GuiPillsDropdownEventDetail } from './pills';
import type { TimeRange } from '../types';
import { GuiFormControl, type GuiValidity } from '../gui-form-control';
import { timeRangesValidity } from '../utils/range-validity';
import {
  dispatch,
  dispatchBlur,
  dispatchInputError,
  dispatchValue,
  fires,
  valueEvents,
  type GuiInputErrorEventDetail,
} from '../utils/events';
import { message, optionalName, requiredName } from '../utils/messages';

/** What <gui-range-time-input> renders besides the control state: its presentation props. */
export type GuiRangeTimeInputProps = {
  hint?: string;
};

/**
 * A field to type one or more time ranges, shown as pills.
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
export class GuiRangeTimeInput extends GuiFormControl {
  /** BCP 47 locale for formatting and parsing, such as `en-US` or `es`. */
  @property({ type: String, attribute: 'locale-id' }) localeId: string | undefined = undefined;
  /**
   * Whether the element renders its own error list. Elements that embed it turn it off and show the
   * errors themselves.
   */
  @property({ type: Boolean, attribute: 'show-errors' }) showErrors: boolean | undefined = true;
  /**
   * Whether the element renders its hint. Elements that embed it turn it off and show the hint
   * themselves: `aria-describedby` still points at the hint by its id.
   */
  @property({ type: Boolean, attribute: 'show-hint' }) showHint: boolean | undefined = true;

  /** Icon class name shown inside the control, for example from an icon font. */
  @property({ type: String }) icon: string | undefined = '';
  /** Accessible name of the hour part. An empty value keeps the default. */
  @property({ type: String, attribute: 'hour-aria-label' }) hourAriaLabel: string | undefined =
    undefined;
  /** Accessible name of the minute part. An empty value keeps the default. */
  @property({ type: String, attribute: 'minute-aria-label' }) minuteAriaLabel: string | undefined =
    undefined;
  /** Accessible name of the AM/PM part. An empty value keeps the default. */
  @property({ type: String, attribute: 'day-period-aria-label' }) dayPeriodAriaLabel:
    | string
    | undefined = undefined;

  /** 12- or 24-hour clock. Defaults to the locale's. */
  @property({ type: String, attribute: 'hour-format' }) hourFormat: HourFormat | undefined =
    undefined;
  /** Minutes between the times offered in the list. */
  @property({ type: Number, attribute: 'minute-step' }) minuteStep: number | undefined = 1;
  /** Earliest selectable time, as an ISO time (`HH:mm:ss`). */
  @property({ type: String, attribute: 'min-time' }) minTime: string | undefined = undefined;
  /** Latest selectable time, as an ISO time (`HH:mm:ss`). */
  @property({ type: String, attribute: 'max-time' }) maxTime: string | undefined = undefined;
  /** Error for a time before `minTime`. */
  @property({ type: String, attribute: 'min-time-message' }) minTimeMessage: string | undefined =
    undefined;
  /** Error for a time after `maxTime`. */
  @property({ type: String, attribute: 'max-time-message' }) maxTimeMessage: string | undefined =
    undefined;

  /** The time ranges, as `{ start, end }` ISO times. */
  @property({ type: Array }) value: TimeRange[] | undefined = [];
  /** Error when the end time is not after the start time. */
  @property({ type: String, attribute: 'range-order-message' }) rangeOrderMessage:
    | string
    | undefined = undefined;
  /** Accessible name of the remove button of each range pill. An empty value keeps the default. */
  @property({ type: String, attribute: 'remove-pill-aria-label' }) removePillAriaLabel:
    | string
    | undefined = undefined;
  /** Accessible name of the start time field. An empty value removes it. */
  @property({ type: String, attribute: 'start-time-aria-label' }) startTimeAriaLabel:
    | string
    | undefined = undefined;
  /** Accessible name of the end time field. An empty value removes it. */
  @property({ type: String, attribute: 'end-time-aria-label' }) endTimeAriaLabel:
    | string
    | undefined = undefined;
  /** Text shown between the start and end of a range. */
  @property({ type: String }) separator: string | undefined = undefined;
  /** Allows typing any time, not only picking one from the list. */
  @property({ type: Boolean, attribute: 'allow-custom-time' }) allowCustomTime:
    | boolean
    | undefined = undefined;
  /** Times that cannot be picked, as `{ start, end }` ISO time ranges. */
  @property({ type: Array, attribute: 'disabled-ranges' }) disabledRanges: TimeRange[] | undefined =
    undefined;
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
   * moving focus from this input into the picker's popup must not count as
   * leaving, so the embedded input skips its incomplete-on-leave handling.
   *
   * @internal
   */
  @property({ type: Boolean, attribute: 'defer-focus-leave' }) deferFocusLeave:
    | boolean
    | undefined = false;

  private readonly inputBlockClass = 'gui-range-time-input';
  private readonly groups = ['start', 'end'] as const;

  private readonly timePartTypes: readonly DateTimePartType[] = ['hour', 'minute'];

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
    onInputErrorSurfaced: (message) => dispatchInputError(this, message),
    onSurfacedErrorCleared: (value) => dispatchValue(this, value, { commit: false }),
    isReadonly: () => !!this.readOnly || this.allowCustomTime === false,
    isDisabled: () => !!this.disabled,
    onEmptyPartBlur: () => {
      // Unlike gui-time, an empty part never commits a null value
    },
    onNavigatePastStart: () => this._pillsNav.enterPillList(),
    onEmptyPartDelete: () => {
      if (this.disabled || this.readOnly) return;
      const allEmpty =
        this._parts.isGroupEmpty('start', this.timePartTypes) &&
        this._parts.isGroupEmpty('end', this.timePartTypes);
      if (allEmpty) this._pillsNav.enterPillList();
    },
    onEnter: () => {
      const wasEditing = !!this._edit.editing;
      this.tryCreatePill();
      if (!wasEditing && this.value && this.value.length > 0) {
        this.onPillClick(this.value[this.value.length - 1]);
      }
    },
    getHourFormat: () => this.timeLocaleData.effectiveHourFormat,
    getDayPeriodLabels: () => this.timeLocaleData.dayPeriodLabels,
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

  private _edit = new GUIEditSessionController<TimeRange>(this, {
    isEnabled: () => this.editEnabled,
    getRanges: () => this.value,
    compareStarts: compareISOTimes,
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
    requiresLabel: true,
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

  private get timeLocaleData() {
    return getTimeLocaleData(this.localeId, this.hourFormat, this.minuteStep);
  }

  private getPartDescriptor(type: string): DateTimePartDescriptor | undefined {
    return this.timeLocaleData.descriptors[type as DateTimePartType];
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

  /** A range outside `minTime`/`maxTime` or over a disabled range, then `required`. */
  protected override validate(): GuiValidity | null {
    const badInput = this.partsBadInput();
    return (
      timeRangesValidity(this.value, this) ??
      (badInput ? { flags: { badInput: true }, message: badInput } : null) ??
      super.validate()
    );
  }

  override render() {
    const templateData: ControlTemplateData<TimeRange[]> & GuiRangeTimeInputProps = {
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
      formatParts: getTimeFormatParts(this.localeId, this.timeLocaleData.effectiveHourFormat),
      getDescriptor: (type) => this.getPartDescriptor(type),
      getDisplayValue: this._parts.getPartDisplay,
      getPartAriaLabel: (_group: string, type: DateTimePartType) => {
        const overrides: Partial<Record<DateTimePartType, string | undefined>> = {
          hour: this.hourAriaLabel,
          minute: this.minuteAriaLabel,
        };
        return message(type, overrides[type]);
      },
      dayPeriodAriaLabel: this.dayPeriodAriaLabel,
      disabled: this.disabled,
      partsReadonly: !!this.readOnly || this.allowCustomTime === false,
    };

    const pillItems: GuiPillItem[] = this.decoratePillItems(
      buildPillItems(this.getSortedPills(), (pill) => this.formatPillLabel(pill)),
    );

    const iconClassMap = {
      'gui-widget-icon': true,
      [this.icon as string]: !!this.icon,
    };

    return html`
      ${addLabel(
        this.uid,
        this.showHint ? templateData : { ...templateData, hint: undefined },
        false,
        undefined,
        false,
      )}

      <div
        class="gui-widget"
        @focusout=${this._focusLeave.onFocusOut}
        @keydown=${this.onWidgetKeyDown}
      >
        <div
          class="gui-widget-input gui-parts-ring gui-range-time-input ${this.icon
            ? 'gui-range-time-input--icon'
            : ''}"
          role="group"
          aria-labelledby=${`${this.uid}_label`}
        >
          ${this.icon
            ? html`<span
                class=${classMap(iconClassMap)}
                data-icon=${this.icon}
                aria-hidden="true"
              ></span>`
            : nothing}

          <gui-pills
            class="gui-range-time-input__pills"
            style=${cspStyleMap(pillItems.length ? {} : { 'min-width': 0 })}
            .uid=${this.uid}
            .toolbarAriaLabel=${message('selectedTimeRanges')}
            .items=${pillItems}
            .errors=${this.errors}
            .touched=${!!this.touched}
            .removable=${true}
            .clickable=${true}
            .bubble=${true}
            .tabbable=${false}
            ?disabled=${this.disabled}
            ?readonly=${this.readOnly}
            .removeAriaLabel=${requiredName('removeTime', this.removePillAriaLabel)}
            .compactAriaLabel=${requiredName('timeRangeCount', undefined, {
              count: pillItems.length,
            })}
            .editable=${this.editEnabled}
            .selectedKey=${this._edit.selectedKey ?? undefined}
            .editingKey=${this._edit.editing?.key ?? undefined}
            .editLabel=${requiredName('editRange', this.editLabel)}
            .confirmEditLabel=${requiredName('confirmEditRange', this.confirmEditLabel)}
            .cancelEditLabel=${requiredName('cancelEditRange', this.cancelEditLabel)}
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

          <div class="gui-range-time-input__inputs">
            <div
              class="gui-parts gui-range-time-input__field"
              role="group"
              aria-label=${optionalName('startTime', this.startTimeAriaLabel) ?? nothing}
            >
              ${renderGroupParts('start', partsData, this._parts)}
            </div>

            <span class="gui-range-time-input__separator" aria-hidden="true"
              >${this.separator ?? '-'}</span
            >

            <div
              class="gui-parts gui-range-time-input__field"
              role="group"
              aria-label=${optionalName('endTime', this.endTimeAriaLabel) ?? nothing}
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

  private formatPillLabel(range: TimeRange): string {
    return formatRangeLabel(range, (iso) => this.formatTimeForDisplay(iso));
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
    const format = (iso: string | null) => (iso ? this.formatTimeForDisplay(iso) : '…');
    return `${format(this._workingISO.start)} - ${format(this._workingISO.end)}`;
  }

  private onWidgetKeyDown = (e: KeyboardEvent) => {
    if (this.deferFocusLeave) return;
    this._edit.handleEscape(e);
  };

  private emitEditState() {
    dispatch(this, 'gui-edit-state-change', {
      selected: this._edit.selectedRange,
      editing: !!this._edit.editing,
    });
  }

  private loadRangeForEdit(range: TimeRange) {
    this._parts.clearSurfacedInputError(this.value ?? []);
    this._parts.setGroupFromISO(
      'start',
      range.start,
      'time',
      this.timeLocaleData.effectiveHourFormat,
    );
    this._parts.setGroupFromISO('end', range.end, 'time', this.timeLocaleData.effectiveHourFormat);
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
  get selectedEditRange(): TimeRange | null {
    return this._edit.selectedRange;
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

  private onPillClick(range: TimeRange) {
    dispatch(this, 'gui-range-click', { range });
  }

  private formatTimeForDisplay(isoTime: string): string {
    return formatISOTimeForLocale(isoTime, this.localeId, this.timeLocaleData.effectiveHourFormat);
  }

  private getSortedPills(): TimeRange[] {
    return sortRangesByStart(this.value, compareISOTimes);
  }

  /**
   * The bad input the draft holds now: the error the field shows, or a time that is partly
   * typed or impossible. An empty draft has none, and neither has a complete one, which leaving or
   * Enter adds as a range. Read when the validity is written, and by the picker that embeds the
   * element. It parses without clamping, so reading it changes nothing.
   *
   * @internal
   */
  partsBadInput(): string | null {
    if (this.groups.every((group) => this._parts.isGroupEmpty(group, this.timePartTypes)))
      return null;
    if (this._parts.surfacedInputError) return this._parts.surfacedInputError;

    const { effectiveHourFormat, descriptors } = this.timeLocaleData;
    const results = this.groups.map(
      (group) =>
        parseTimeGroup(this._parts.values[group] ?? {}, {
          hourFormat: effectiveHourFormat,
          descriptors,
        }).result,
    );
    for (const result of results) {
      if (result.kind === 'invalid') return result.message;
    }
    if (results.every((result) => result.kind === 'valid')) return null;
    return message('incompleteTime', this.incompleteMessage);
  }

  /**
   * Parses a group's parts into an ISO time via the shared clamp/bounds
   * pipeline, surfacing a bounds violation as a `gui-input-error`. Returns null while
   * the group is incomplete or out of bounds.
   */
  private validateTimeParts(group: string): RangeEndpoint<string> {
    const { effectiveHourFormat, descriptors } = this.timeLocaleData;
    const { result, writeBacks } = parseTimeGroup(this._parts.values[group] ?? {}, {
      hourFormat: effectiveHourFormat,
      descriptors,
    });
    this._parts.applyWriteBacks(group, writeBacks);

    if (result.kind !== 'valid') return { kind: 'incomplete' };

    const boundsError = timeBoundsError(result.iso, {
      minTime: this.minTime,
      maxTime: this.maxTime,
      minTimeMessage: this.minTimeMessage,
      maxTimeMessage: this.maxTimeMessage,
    });
    if (boundsError) return { kind: 'invalid', message: boundsError };

    return { kind: 'valid', value: result.iso };
  }

  /**
   * Fills a group's segmented parts from an ISO time. The range time picker
   * calls this so a list pick lands in the visible input (start/end field)
   * before it attempts to commit — see {@link commitFromParts}.
   *
   * @internal
   */
  fillGroup(group: 'start' | 'end', iso: string): void {
    this._parts.setGroupFromISO(group, iso, 'time', this.timeLocaleData.effectiveHourFormat);
    if (this._edit.editing) this.syncParts();
    this.requestUpdate();
  }

  /**
   * Attempts to commit the currently-entered parts as a pill, returning whether
   * one was created. A public entry point onto the same {@link tryCreatePill}
   * pipeline typed entry uses, so the picker's list-driven commits validate
   * (order + bounds + disabled ranges) through one path.
   *
   * @internal
   */
  commitFromParts(): boolean {
    return this.tryCreatePill();
  }

  /**
   * Re-parses both endpoints (surfacing per-endpoint bounds errors as the user
   * types) and notifies the host picker via `gui-parts-change` so its time lists
   * follow the typed values. Runs on every part change.
   */
  private syncParts(): { start: RangeEndpoint<string>; end: RangeEndpoint<string> } {
    const start = this.validateTimeParts('start');
    const end = this.validateTimeParts('end');

    const iso = (endpoint: RangeEndpoint<string>) =>
      endpoint.kind === 'valid' ? endpoint.value : null;

    this._workingISO = { start: iso(start), end: iso(end) };
    if (this._edit.editing) this.requestUpdate();

    dispatch(this, 'gui-parts-change', { start: iso(start), end: iso(end) });

    return { start, end };
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
   * one endpoint filled and the other still empty (a start picked from the
   * list with no end lands here too). Both surface the incomplete message — or
   * the endpoint's own message when one is outright invalid, which is more
   * useful than "incomplete". `_validationTriggered` makes the next edit
   * re-evaluate, so the message clears as soon as the user comes back and
   * continues (or empties the fields).
   *
   * @internal
   */
  finalizeOnLeave(): void {
    if (this._edit.editing) {
      const results = this.groups.map((group) => this.validateTimeParts(group));
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
      result: this.validateTimeParts(group),
      empty: this._parts.isGroupEmpty(group, this.timePartTypes),
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
      invalidMessage ?? message('incompleteTime', this.incompleteMessage),
    );
  }

  /**
   * Parses the range and updates the error state, without ever committing.
   * Shared by the Enter commit and by {@link revalidate}.
   */
  private evaluateRange() {
    const { start, end } = this.syncParts();

    const outcome = commitRange(start, end, this._edit.baseRanges(this.value), {
      validate: (ordered) =>
        compareISOTimes(ordered.end, ordered.start) <= 0
          ? message('timeRangeOrder', this.rangeOrderMessage)
          : isTimeRangeDisabled(ordered.start, ordered.end, this.disabledRanges)
            ? message('disabledTimeRange', this.disabledRangeMessage)
            : null,
      toRange: (ordered) => {
        this._lastComposedStart = ordered.start;
        return { start: ordered.start, end: ordered.end };
      },
      merge: mergeTimeRanges,
    });

    if (outcome.kind === 'incomplete') {
      this._parts.clearSurfacedInputError(this.value ?? []);
    }

    if (outcome.kind === 'invalid') {
      this._parts.surfaceInputError(outcome.message);
    }

    return outcome;
  }

  /**
   * Once the user has attempted a commit, every later edit re-runs validation
   * so a corrected range clears its error immediately, otherwise the message
   * would linger until the next Enter and the user could not tell the problem
   * was solved.
   */
  private revalidate() {
    const outcome = this.evaluateRange();

    if (outcome.kind === 'commit') {
      this._parts.clearSurfacedInputError(this.value ?? []);
    }
  }

  private tryCreatePill({ refocus = true }: { refocus?: boolean } = {}): boolean {
    const wasEditing = !!this._edit.editing;
    this._validationTriggered = true;

    const outcome = this.evaluateRange();
    if (outcome.kind !== 'commit') return false;

    if (
      wasEditing &&
      sameRanges(this.getSortedPills(), sortRangesByStart(outcome.value, compareISOTimes))
    ) {
      this._edit.cancel();
      return false;
    }

    this.value = outcome.value;
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
}

/** The events `gui-range-time` fires, with their types. */
export const GuiRangeTimeInputEvents = {
  'gui-dropdown-toggle': fires<CustomEvent<GuiPillsDropdownEventDetail>>(),
  ...valueEvents<GuiRangeTimeInput['value']>(),
  'gui-focus': fires<CustomEvent<FocusEvent>>(),
  'gui-input-error': fires<CustomEvent<GuiInputErrorEventDetail>>(),
  'gui-parts-change': fires<CustomEvent<{ start: string | null; end: string | null }>>(),
  'gui-edit-state-change': fires<CustomEvent<{ selected: TimeRange | null; editing: boolean }>>(),
  'gui-range-click': fires<CustomEvent<{ range: TimeRange }>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-range-time': GuiRangeTimeInput;
  }
}

safeDefine('gui-range-time', GuiRangeTimeInput);
