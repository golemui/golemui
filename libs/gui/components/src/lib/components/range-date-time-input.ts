import type { DateTimeRange, RangeDateTimeInputProps } from '@golemui/gui-shared/internals';
import { html, LitElement, nothing, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit/internals';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit-html/directives/style-map.js';
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
  PART_DEFAULT_ARIA_LABELS,
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
import type { GuiPillEventDetail, GuiPillItem } from './pills';
import {
  CANCEL_EDIT_RANGE_LABEL,
  CONFIRM_EDIT_RANGE_LABEL,
  DISABLED_DATE_RANGE_MESSAGE,
  EDIT_RANGE_ARIA_LABEL,
  EDIT_RANGE_CANCELLED_MESSAGE,
  EDIT_RANGE_COMMITTED_MESSAGE,
  EDIT_RANGE_LABEL,
  EDIT_RANGE_STARTED_MESSAGE,
  formatEditMessage,
  INCOMPLETE_DATE_TIME_MESSAGE,
} from '../utils/messages';

export class GuiRangeDateTimeInput extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: String, attribute: 'locale-id' }) localeId: string | undefined = undefined;
  @property({ type: Array }) errors: string[] | undefined = [];
  @property({ type: Boolean }) showErrors: boolean | undefined = true;
  @property({ type: Boolean }) touched: boolean | undefined = false;
  @property({ type: Boolean }) required: boolean | undefined = false;
  @property({ type: Boolean }) disabled: boolean | undefined = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly: boolean | undefined = false;

  @property({ type: String }) icon: string | undefined = '';
  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: String }) dayAriaLabel: string | undefined = undefined;
  @property({ type: String }) monthAriaLabel: string | undefined = undefined;
  @property({ type: String }) yearAriaLabel: string | undefined = undefined;
  @property({ type: String }) hourAriaLabel: string | undefined = undefined;
  @property({ type: String }) minuteAriaLabel: string | undefined = undefined;
  @property({ type: String }) dayPeriodAriaLabel: string | undefined = undefined;

  @property({ type: String, attribute: 'hour-format' }) hourFormat: HourFormat | undefined =
    undefined;
  @property({ type: Number, attribute: 'minute-step' }) minuteStep: number | undefined = 1;
  @property({ type: String, attribute: 'invalid-date-message' }) invalidDateMessage:
    | string
    | undefined = undefined;

  @property({ type: Array }) value: DateTimeRange[] | undefined = [];
  @property({ type: String }) removePillAriaLabel: string | undefined = undefined;
  @property({ type: String }) startDateTimeAriaLabel: string | undefined = undefined;
  @property({ type: String }) endDateTimeAriaLabel: string | undefined = undefined;
  @property({ type: String }) separator: string | undefined = undefined;
  @property({ type: String, attribute: 'min-date-time' }) minDateTime: string | undefined =
    undefined;
  @property({ type: String, attribute: 'max-date-time' }) maxDateTime: string | undefined =
    undefined;
  @property({ type: String, attribute: 'min-date-time-message' }) minDateTimeMessage:
    | string
    | undefined = undefined;
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
  @property({ type: String, attribute: 'disabled-range-message' }) disabledRangeMessage:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'incomplete-message' }) incompleteMessage:
    | string
    | undefined = undefined;
  /** Opt-in select → edit → confirm flow on the pills. */
  @property({ type: Boolean, attribute: 'allow-edit' }) allowEdit: boolean | undefined = false;
  @property({ type: String, attribute: 'edit-label' }) editLabel: string | undefined = undefined;
  @property({ type: String, attribute: 'edit-aria-label' }) editAriaLabel: string | undefined =
    undefined;
  @property({ type: String, attribute: 'confirm-edit-label' }) confirmEditLabel:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'cancel-edit-label' }) cancelEditLabel: string | undefined =
    undefined;
  @property({ type: String, attribute: 'edit-started-message' }) editStartedMessage:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'edit-committed-message' }) editCommittedMessage:
    | string
    | undefined = undefined;
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
    onInputErrorSurfaced: (message) =>
      this.dispatchEvent(new CustomEvent('inputError', { detail: { message }, bubbles: true })),
    onSurfacedErrorCleared: (value) =>
      this.dispatchEvent(
        new CustomEvent('change', {
          detail: { value, commit: false },
          bubbles: true,
          composed: true,
        }),
      ),
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
      started: this.editStartedMessage ?? EDIT_RANGE_STARTED_MESSAGE,
      committed: this.editCommittedMessage ?? EDIT_RANGE_COMMITTED_MESSAGE,
      cancelled: this.editCancelledMessage ?? EDIT_RANGE_CANCELLED_MESSAGE,
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
      this.dispatchEvent(new CustomEvent('blur'));
    },
  });

  protected ariaController: GUIAriaController<unknown, any> = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`.${this.inputBlockClass}`),
    getState: () => ({
      uid: this.uid as string,
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
    const templateData: ControlTemplateData<DateTimeRange[]> & RangeDateTimeInputProps = {
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
        return overrides[type] ?? PART_DEFAULT_ARIA_LABELS[type];
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
      ${this.label ? addLabel(this.uid as string, templateData, false, undefined, false) : nothing}

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
          aria-label=${this.label ?? 'Date-time range input'}
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
            style=${styleMap(pillItems.length ? {} : { 'min-width': 0 })}
            .uid=${this.uid}
            .toolbarAriaLabel=${'Selected date-time ranges'}
            .items=${pillItems}
            .errors=${this.errors}
            .touched=${!!this.touched}
            .removable=${true}
            .clickable=${true}
            .bubble=${true}
            .tabbable=${false}
            ?disabled=${this.disabled}
            ?readonly=${this.readOnly}
            .removeAriaLabel=${this.removePillAriaLabel ?? 'Remove date-time'}
            .compactAriaLabel=${`${pillItems.length} date-time ranges`}
            .editable=${this.editEnabled}
            .selectedKey=${this._edit.selectedKey ?? undefined}
            .editingKey=${this._edit.editing?.key ?? undefined}
            .editLabel=${this.editLabel ?? EDIT_RANGE_LABEL}
            .confirmEditLabel=${this.confirmEditLabel ?? CONFIRM_EDIT_RANGE_LABEL}
            .cancelEditLabel=${this.cancelEditLabel ?? CANCEL_EDIT_RANGE_LABEL}
            @pillremove=${this.onPillRemoveEvent}
            @pillclick=${this.onPillClickEvent}
            @pillfocus=${this.onPillFocusEvent}
            @pillsblur=${this.onPillsBlurEvent}
            @pilledit=${this.onPillEditEvent}
            @pilleditconfirm=${this.onPillEditConfirm}
            @pilleditcancel=${this.onPillEditCancel}
            @pillkeydown=${this._pillsNav.onPillKeydown}
            @pillexit=${this._pillsNav.onPillExit}
          ></gui-pills>

          <div class="gui-range-date-time-input__inputs">
            <div
              class="gui-parts gui-range-date-time-input__field"
              role="group"
              aria-label=${this.startDateTimeAriaLabel ?? 'Start date-time'}
            >
              ${renderGroupParts('start', partsData, this._parts)}
            </div>

            <span class="gui-range-date-time-input__separator">${this.separator ?? '-'}</span>

            <div
              class="gui-parts gui-range-date-time-input__field"
              role="group"
              aria-label=${this.endDateTimeAriaLabel ?? 'End date-time'}
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

      ${this.showErrors && this.errors?.length
        ? addErrors(this.uid as string, templateData)
        : nothing}
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
        editAriaLabel: formatEditMessage(this.editAriaLabel ?? EDIT_RANGE_ARIA_LABEL, item.label),
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
    this.dispatchEvent(
      new CustomEvent('editStateChange', {
        detail: { selected: this._edit.selectedRange, editing: !!this._edit.editing },
      }),
    );
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

  /** Starts editing the selected pill; the host picker's Edit action. */
  startEdit(): boolean {
    return this._edit.startEdit();
  }

  /** Cancels an open edit session; the host picker's Cancel action. */
  cancelEdit(): void {
    this._edit.cancel();
  }

  /**
   * The host picker's Escape layering routes here once its popup declined
   * the key: cancels an open session first, then clears the selection.
   */
  handleSessionEscape(event: KeyboardEvent): boolean {
    return this._edit.handleEscape(event);
  }

  get isEditing(): boolean {
    return !!this._edit.editing;
  }

  get selectedEditRange(): DateTimeRange | null {
    return this._edit.selectedRange;
  }

  /**
   * Attempts to commit the currently-entered parts as a pill, returning
   * whether one was created — the picker's confirm path onto the same
   * {@link tryCreatePill} pipeline typed entry uses.
   */
  commitFromParts(): boolean {
    return this.tryCreatePill();
  }

  private onPillRemoveEvent = (e: CustomEvent<GuiPillEventDetail>) => {
    if (this.disabled || this.readOnly) return;
    const removal = removeRangeByKey(this.value, e.detail.key);
    if (!removal) return;
    this.value = removal.next;
    this.dispatchEvent(
      new CustomEvent('change', { detail: { value: this.value }, bubbles: true, composed: true }),
    );

    if (removal.next.length === 0) {
      // Strip is gone; return focus to the segments.
      this._pillsNav.focusLinkedInputDeferred();
    }
  };

  private onPillClickEvent = (e: CustomEvent<GuiPillEventDetail>) => {
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
    if (!this.editEnabled || this._edit.editing) return;
    if (this._edit.selectedKey !== e.detail.key) this._edit.handlePillClick(e.detail.key);
  };

  /**
   * Focus left the pills for elsewhere: the selection follows it away, so the
   * edit affordance and any calendar marking disappear. An open session keeps
   * its selection — its focus legitimately lives in the compose surface.
   */
  private onPillsBlurEvent = () => {
    if (this._edit.editing) return;
    this._edit.clearSelection();
  };

  /** Edit icon or F2 / E on a pill: select it (if needed) and start editing. */
  private onPillEditEvent = (e: CustomEvent<GuiPillEventDetail>) => {
    if (!this.editEnabled || this._edit.editing?.key === e.detail.key) return;
    if (this._edit.selectedKey !== e.detail.key) this._edit.handlePillClick(e.detail.key);
    this._edit.startEdit();
  };

  private onPillEditConfirm = () => {
    if (!this._edit.editing) return;
    this.commitFromParts();
  };

  private onPillEditCancel = () => {
    if (!this._edit.editing) return;
    this._edit.cancel();
    this._edit.focusSelectedPill();
  };

  private onPillClick(range: DateTimeRange) {
    this.dispatchEvent(
      new CustomEvent('pillClick', { detail: { range }, bubbles: true, composed: true }),
    );
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
   * picker via `partsChange` so its calendar follows the typed endpoints. Each
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

    this.dispatchEvent(
      new CustomEvent('partsChange', {
        detail: { start: this.subGroupISO('start'), end: this.subGroupISO('end') },
        bubbles: true,
        composed: true,
      }),
    );

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
      invalidMessage ?? this.incompleteMessage ?? INCOMPLETE_DATE_TIME_MESSAGE,
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
          ? (this.disabledRangeMessage ?? DISABLED_DATE_RANGE_MESSAGE)
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
    this.dispatchEvent(
      new CustomEvent('change', { detail: { value: this.value }, bubbles: true, composed: true }),
    );

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
   */
  fillDate(group: 'start' | 'end', iso: string | null): void {
    this._parts.setGroupFromISO(group, iso, 'date');
    if (this._edit.editing) this.syncParts();
    this.requestUpdate();
  }

  /** The counterpart of {@link fillDate} for an endpoint's time parts. */
  fillTime(group: 'start' | 'end', iso: string | null): void {
    this._parts.setGroupFromISO(group, iso, 'time', this.localeData.effectiveHourFormat);
    if (this._edit.editing) this.syncParts();
    this.requestUpdate();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-range-date-time': GuiRangeDateTimeInput;
  }
}

safeDefine('gui-range-date-time', GuiRangeDateTimeInput);
