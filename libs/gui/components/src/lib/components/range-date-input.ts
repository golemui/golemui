import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { booleanAttribute } from '../utils/converters';
import { cspStyleMap } from '@golemui/lit-utils';
import { safeDefine } from '@golemui/lit-utils';
import { classMap } from 'lit/directives/class-map.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { GUIEditSessionController } from '../controllers/edit-session.controller';
import { GUIFocusLeaveController } from '../controllers/focus-leave.controller';
import { GUIPartsController } from '../controllers/parts.controller';
import { GUIPillsNavigationController } from '../controllers/pills-navigation.controller';
import {
  getDateFormatParts,
  mergeDateRanges,
  parseISODateString,
  toISODateString,
} from '../utils/date';
import { renderGroupParts, type GUIPartsTemplateData } from '../utils/part-templates';
import {
  dateInputPartDescriptors,
  parseDateGroup,
  type DateTimePartDescriptor,
  type DateTimePartType,
} from '../utils/parts';
import {
  buildPillItems,
  findRangeByKey,
  formatISODateForDisplay,
  formatRangeLabel,
  removeRangeByKey,
  sameRanges,
  sortRangesByStart,
} from '../utils/pill-ranges';
import { commitRange, orderEndpoints, type RangeEndpoint } from '../utils/range-commit';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';
import './pills';
import type { GuiPillEventDetail, GuiPillItem, GuiPillsDropdownEventDetail } from './pills';
import type { DateRange } from '../types';
import { GuiFormControl, type GuiValidity } from '../gui-form-control';
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

/** What <gui-range-date-input> renders besides the control state: its presentation props. */
export type GuiRangeDateInputProps = {
  hint?: string;
};

/**
 * A field to type one or more date ranges, shown as pills.
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
export class GuiRangeDateInput extends GuiFormControl {
  /** BCP 47 locale for formatting and parsing, such as `en-US` or `es`. */
  @property({ type: String, attribute: 'locale-id' }) localeId: string | undefined = undefined;
  /**
   * Whether the element renders its own error list. Elements that embed it turn it off and show the
   * errors themselves.
   */
  @property({ attribute: 'show-errors', converter: booleanAttribute }) showErrors:
    | boolean
    | undefined = true;
  /**
   * Whether the element renders its hint. Elements that embed it turn it off and show the hint
   * themselves: `aria-describedby` still points at the hint by its id.
   */
  @property({ attribute: 'show-hint', converter: booleanAttribute }) showHint: boolean | undefined =
    true;

  /** Icon class name shown inside the control, for example from an icon font. */
  @property({ type: String }) icon: string | undefined = '';
  /** Accessible name of the day part. An empty value keeps the default. */
  @property({ type: String, attribute: 'day-aria-label' }) dayAriaLabel: string | undefined =
    undefined;
  /** Accessible name of the month part. An empty value keeps the default. */
  @property({ type: String, attribute: 'month-aria-label' }) monthAriaLabel: string | undefined =
    undefined;
  /** Accessible name of the year part. An empty value keeps the default. */
  @property({ type: String, attribute: 'year-aria-label' }) yearAriaLabel: string | undefined =
    undefined;

  /** The date ranges, as `{ start, end }` ISO dates. */
  @property({ type: Array }) value: DateRange[] | undefined = [];
  /** Error for a complete but impossible date, such as February 31. */
  @property({ type: String, attribute: 'invalid-date-message' }) invalidDateMessage:
    | string
    | undefined = undefined;

  /** Accessible name of the remove button of each range pill. An empty value keeps the default. */
  @property({ type: String, attribute: 'remove-pill-aria-label' }) removePillAriaLabel:
    | string
    | undefined = undefined;
  /** Accessible name of the start date field. An empty value removes it. */
  @property({ type: String, attribute: 'start-date-aria-label' }) startDateAriaLabel:
    | string
    | undefined = undefined;
  /** Accessible name of the end date field. An empty value removes it. */
  @property({ type: String, attribute: 'end-date-aria-label' }) endDateAriaLabel:
    | string
    | undefined = undefined;
  /** Text shown between the start and end of a range. */
  @property({ type: String }) separator: string | undefined = undefined;
  /** Error when focus leaves a partly filled value. */
  @property({ type: String, attribute: 'incomplete-message' }) incompleteMessage:
    | string
    | undefined = undefined;
  /** Lets the user edit a range in place from its pill. */
  @property({ attribute: 'allow-edit', converter: booleanAttribute }) allowEdit:
    | boolean
    | undefined = false;
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
   *
   * @internal
   */
  @property({ attribute: 'defer-focus-leave', converter: booleanAttribute }) deferFocusLeave:
    | boolean
    | undefined = false;

  private readonly inputBlockClass = 'gui-range-date-input';
  private readonly groups = ['start', 'end'] as const;

  private readonly partDescriptors = dateInputPartDescriptors();

  private readonly datePartTypes: readonly DateTimePartType[] = ['day', 'month', 'year'];

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
      // Unlike gui-date, an empty part never commits a null value
    },
    onNavigatePastStart: () => this._pillsNav.enterPillList(),
    onEmptyPartDelete: () => {
      if (this.disabled || this.readOnly) return;
      const allEmpty =
        this._parts.isGroupEmpty('start', this.datePartTypes) &&
        this._parts.isGroupEmpty('end', this.datePartTypes);
      if (allEmpty) this._pillsNav.enterPillList();
    },
    onEnter: () => {
      const wasEditing = !!this._edit.editing;
      this.tryCreatePill();
      if (!wasEditing && this.value && this.value.length > 0) {
        const lastRange = this.value[this.value.length - 1];
        this.onPillClick(lastRange);
      }
    },
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

  private _edit = new GUIEditSessionController<DateRange>(this, {
    isEnabled: () => this.editEnabled,
    getRanges: () => this.value,
    compareStarts: (a, b) => parseISODateString(a).getTime() - parseISODateString(b).getTime(),
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

  override willUpdate() {
    this._edit.reconcileValue(this.value);
  }

  private getPartDescriptor(type: string): DateTimePartDescriptor | undefined {
    return this.partDescriptors[type as keyof typeof this.partDescriptors];
  }

  override render() {
    const templateData: ControlTemplateData<DateRange[]> & GuiRangeDateInputProps = {
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
      formatParts: getDateFormatParts(this.localeId),
      getDescriptor: (type) => this.getPartDescriptor(type),
      getDisplayValue: this._parts.getPartDisplay,
      getPartAriaLabel: (_group: string, type: DateTimePartType) => {
        const overrides: Partial<Record<DateTimePartType, string | undefined>> = {
          day: this.dayAriaLabel,
          month: this.monthAriaLabel,
          year: this.yearAriaLabel,
        };
        return message(type, overrides[type]);
      },
      disabled: this.disabled,
      partsReadonly: !!this.readOnly,
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
        this.showHint !== false ? templateData : { ...templateData, hint: undefined },
        false,
        undefined,
        false,
      )}

      <div
        class="gui-widget"
        @focusout=${this._focusLeave.onFocusOut}
        @keydown=${this.onWidgetKeyDown}
      >
        ${this.allowEdit
          ? html`<div class="gui-visually-hidden" aria-live="polite">
              ${this._edit.announcement}
            </div>`
          : nothing}

        <div
          class="gui-widget-input gui-parts-ring gui-range-date-input ${this.icon
            ? 'gui-range-date-input--icon'
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
            class="gui-range-date-input__pills"
            style=${cspStyleMap(pillItems.length ? {} : { 'min-width': 0 })}
            .uid=${this.uid}
            .toolbarAriaLabel=${message('selectedDateRanges')}
            .items=${pillItems}
            .errors=${this.errors}
            .touched=${!!this.touched}
            .removable=${true}
            .clickable=${true}
            .bubble=${true}
            .tabbable=${false}
            ?disabled=${this.disabled}
            ?readonly=${this.readOnly}
            .removeAriaLabel=${requiredName('removeDate', this.removePillAriaLabel)}
            .compactAriaLabel=${requiredName('dateRangeCount', undefined, {
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

          <div class="gui-range-date-input__inputs">
            <div
              class="gui-parts gui-range-date-input__field"
              role="group"
              aria-label=${optionalName('startDate', this.startDateAriaLabel) ?? nothing}
            >
              ${renderGroupParts('start', partsData, this._parts)}
            </div>

            <span class="gui-range-date-input__separator" aria-hidden="true"
              >${this.separator ?? '-'}</span
            >

            <div
              class="gui-parts gui-range-date-input__field"
              role="group"
              aria-label=${optionalName('endDate', this.endDateAriaLabel) ?? nothing}
            >
              ${renderGroupParts('end', partsData, this._parts)}
            </div>
          </div>
        </div>
      </div>

      ${this.showErrors !== false && this.errors?.length
        ? addErrors(this.uid, templateData)
        : nothing}
    `;
  }

  private formatPillLabel(range: DateRange): string {
    return formatRangeLabel(range, (iso) => formatISODateForDisplay(iso, this.localeId));
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
    const format = (iso: string | null) =>
      iso ? formatISODateForDisplay(iso, this.localeId) : '…';
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

  private loadRangeForEdit(range: DateRange) {
    this._parts.clearSurfacedInputError(this.value ?? []);
    this._parts.setGroupFromISO('start', range.start, 'date');
    this._parts.setGroupFromISO('end', range.end ?? range.start, 'date');
    this._validationTriggered = true;
    this.syncParts();
    this._parts.focusFirst('start', true);
  }

  private clearCompose() {
    this._parts.clearGroup('start');
    this._parts.clearGroup('end');
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
  get selectedEditRange(): DateRange | null {
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

  private getSortedPills(): DateRange[] {
    return sortRangesByStart(
      this.value,
      (a, b) => parseISODateString(a).getTime() - parseISODateString(b).getTime(),
    );
  }

  private onPillClick(range: DateRange) {
    dispatch(this, 'gui-range-click', { range });
  }

  /** A draft the element cannot add as a range (see partsBadInput), then `required`. */
  protected override validate(): GuiValidity | null {
    const badInput = this.partsBadInput();
    return (badInput ? { flags: { badInput: true }, message: badInput } : null) ?? super.validate();
  }

  /**
   * The bad input the draft holds now: the error the field shows, or a date that is partly
   * typed or impossible. An empty draft has none, and neither has a complete one, which leaving or
   * Enter adds as a range. Read when the validity is written, and by the picker that embeds the
   * element. It parses without clamping, so reading it changes nothing.
   *
   * @internal
   */
  partsBadInput(): string | null {
    if (this.groups.every((group) => this._parts.isGroupEmpty(group, this.datePartTypes)))
      return null;
    if (this._parts.surfacedInputError) return this._parts.surfacedInputError;

    const results = this.groups.map(
      (group) =>
        parseDateGroup(this._parts.values[group] ?? {}, {
          descriptors: this.partDescriptors,
          invalidDateMessage: this.invalidDateMessage,
        }).result,
    );
    for (const result of results) {
      if (result.kind === 'invalid') return result.message;
    }
    if (results.every((result) => result.kind === 'valid')) return null;
    return message('incompleteDate', this.incompleteMessage);
  }

  private validateDateParts(group: string): RangeEndpoint<Date> {
    // Clamp out-of-range values and write them back so the user sees the
    // corrected part immediately
    const { result, writeBacks } = parseDateGroup(this._parts.values[group] ?? {}, {
      descriptors: this.partDescriptors,
      invalidDateMessage: this.invalidDateMessage,
    });
    this._parts.applyWriteBacks(group, writeBacks);

    if (result.kind === 'invalid') return { kind: 'invalid', message: result.message };
    if (result.kind === 'valid' && result.instant) return { kind: 'valid', value: result.instant };
    return { kind: 'incomplete' };
  }

  /**
   * Re-parses both endpoints so per-endpoint problems (impossible date, out of
   * bounds) surface while the user types, and notifies the host picker via
   * `gui-parts-change` so its calendar follows the typed endpoints. Runs on every
   * part change.
   */
  private syncParts() {
    const start = this.validateDateParts('start');
    const end = this.validateDateParts('end');

    const iso = (endpoint: RangeEndpoint<Date>) =>
      endpoint.kind === 'valid' ? toISODateString(endpoint.value) : null;

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
   * one endpoint filled and the other still empty (a picked start with no end
   * lands here too). Both surface the incomplete message — or the endpoint's
   * own message when one is outright invalid, which is more useful than
   * "incomplete". `_validationTriggered` makes the next edit re-evaluate, so
   * the message clears as soon as the user comes back and continues (or
   * empties the fields).
   *
   * @internal
   */
  finalizeOnLeave(): void {
    if (this._edit.editing) {
      const results = this.groups.map((group) => this.validateDateParts(group));
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
      result: this.validateDateParts(group),
      empty: this._parts.isGroupEmpty(group, this.datePartTypes),
    }));

    // Nothing entered: nothing to settle, but a message surfaced over fields
    // the user has since emptied must not outlive them.
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
      invalidMessage ?? message('incompleteDate', this.incompleteMessage),
    );
  }

  /**
   * Parses the range and updates the error state, without ever committing.
   * Shared by the Enter commit and by {@link revalidate}.
   */
  private evaluateRange() {
    const { start, end } = this.syncParts();

    const outcome = commitRange(start, end, this._edit.baseRanges(this.value), {
      // Swap if end < start
      order: (s, e) => orderEndpoints(s, e, (a, b) => a.getTime() - b.getTime()),
      toRange: ({ start: rangeStart, end: rangeEnd }): DateRange => {
        const startStr = toISODateString(rangeStart);
        const endStr = toISODateString(rangeEnd);
        this._lastComposedStart = startStr;
        return startStr === endStr ? { start: startStr } : { start: startStr, end: endStr };
      },
      merge: mergeDateRanges,
    });

    // A completed-but-impossible date in either group is surfaced right away.
    if (outcome.kind === 'invalid') {
      this._parts.surfaceInputError(outcome.message);
    }

    // Not both complete yet: no group is invalid, so clear any error a
    // now-corrected group left behind, then wait for the rest of the range.
    if (outcome.kind === 'incomplete') {
      this._parts.clearSurfacedInputError(this.value ?? []);
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
      sameRanges(this.getSortedPills(), sortRangesByStart(outcome.value, this.compareStarts))
    ) {
      this._edit.cancel();
      return false;
    }

    this.value = outcome.value;
    this._validationTriggered = false;

    // Clear the inputs
    this._parts.clearGroup('start');
    this._parts.clearGroup('end');

    // The commit's own change clears any injected error downstream.
    this._parts.resetSurfacedInputError();
    dispatchValue(this, this.value);

    if (wasEditing) {
      // Selection and focus move to the committed (possibly merged) pill.
      this._edit.completed(this._lastComposedStart ?? '', { focus: refocus });
    } else if (refocus) {
      // Focus the first start date input
      this._parts.focusFirst('start');
    }

    this.requestUpdate();
    return true;
  }

  private compareStarts = (a: string, b: string): number =>
    parseISODateString(a).getTime() - parseISODateString(b).getTime();

  /**
   * Echo a range into the input parts without committing it (no pill, no change
   * event). Used by the picker to show a range the calendar rejected.
   *
   * @internal
   */
  public showRange(startISO: string, endISO: string): void {
    this._parts.setGroupFromISO('start', startISO, 'date');
    this._parts.setGroupFromISO('end', endISO, 'date');
  }

  /** @internal */
  public surfaceHostError(message: string): void {
    this._parts.surfaceInputError(message);
  }

  /**
   * Fills one endpoint's parts from an ISO date, or clears them when given
   * null. The range date picker calls this so a day picked in the calendar
   * lands in the visible field straight away — the reverse of typed parts
   * moving the calendar's selection.
   *
   * @internal
   */
  fillGroup(group: 'start' | 'end', iso: string | null): void {
    this._parts.setGroupFromISO(group, iso, 'date');
    if (this._edit.editing) this.syncParts();
    this.requestUpdate();
  }

  /**
   * Clear both groups' parts (e.g. once a valid range is committed).
   *
   * @internal
   */
  public clearRangeInputs(): void {
    this._parts.clearGroup('start');
    this._parts.clearGroup('end');
  }
}

/** The events `gui-range-date` fires, with their types. */
export const GuiRangeDateInputEvents = {
  'gui-dropdown-toggle': fires<CustomEvent<GuiPillsDropdownEventDetail>>(),
  ...valueEvents<GuiRangeDateInput['value']>(),
  'gui-focus': fires<CustomEvent<FocusEvent>>(),
  'gui-input-error': fires<CustomEvent<GuiInputErrorEventDetail>>(),
  'gui-parts-change': fires<CustomEvent<{ start: string | null; end: string | null }>>(),
  'gui-edit-state-change': fires<CustomEvent<{ selected: DateRange | null; editing: boolean }>>(),
  'gui-range-click': fires<CustomEvent<{ range: DateRange }>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-range-date': GuiRangeDateInput;
  }
}

safeDefine('gui-range-date', GuiRangeDateInput);
