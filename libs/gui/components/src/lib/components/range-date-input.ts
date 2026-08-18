import type { DateRange, RangeDateInputProps } from '@golemui/gui-shared/internals';
import { html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit/internals';
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
import {
  CANCEL_EDIT_RANGE_LABEL,
  CONFIRM_EDIT_RANGE_LABEL,
  EDIT_RANGE_ARIA_LABEL,
  EDIT_RANGE_CANCELLED_MESSAGE,
  EDIT_RANGE_COMMITTED_MESSAGE,
  EDIT_RANGE_LABEL,
  EDIT_RANGE_STARTED_MESSAGE,
  formatEditMessage,
  INCOMPLETE_DATE_MESSAGE,
} from '../utils/messages';
import { renderGroupParts, type GUIPartsTemplateData } from '../utils/part-templates';
import {
  dateInputPartDescriptors,
  parseDateGroup,
  PART_DEFAULT_ARIA_LABELS,
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
import type { GuiPillEventDetail, GuiPillItem } from './pills';
import { styleMap } from 'lit-html/directives/style-map.js';

export class GuiRangeDateInput extends LitElement {
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

  @property({ type: Array }) value: DateRange[] | undefined = [];
  @property({ type: String, attribute: 'invalid-date-message' }) invalidDateMessage:
    | string
    | undefined = undefined;

  @property({ type: String }) removePillAriaLabel: string | undefined = undefined;
  @property({ type: String }) startDateAriaLabel: string | undefined = undefined;
  @property({ type: String }) endDateAriaLabel: string | undefined = undefined;
  @property({ type: String }) separator: string | undefined = undefined;
  @property({ type: String, attribute: 'incomplete-message' }) incompleteMessage:
    | string
    | undefined = undefined;
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

  override willUpdate() {
    this._edit.reconcileValue(this.value);
  }

  private getPartDescriptor(type: string): DateTimePartDescriptor | undefined {
    return this.partDescriptors[type as keyof typeof this.partDescriptors];
  }

  override render() {
    const templateData: ControlTemplateData<DateRange[]> & RangeDateInputProps = {
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
        return overrides[type] ?? PART_DEFAULT_ARIA_LABELS[type];
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
      ${this.label ? addLabel(this.uid as string, templateData, false, undefined, false) : nothing}

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
          aria-label=${this.label ?? 'Date range input'}
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
            style=${styleMap(pillItems.length ? {} : { 'min-width': 0 })}
            .uid=${this.uid}
            .toolbarAriaLabel=${'Selected date ranges'}
            .items=${pillItems}
            .errors=${this.errors}
            .touched=${!!this.touched}
            .removable=${true}
            .clickable=${true}
            .bubble=${true}
            .tabbable=${false}
            ?disabled=${this.disabled}
            ?readonly=${this.readOnly}
            .removeAriaLabel=${this.removePillAriaLabel ?? 'Remove date'}
            .compactAriaLabel=${`${pillItems.length} date ranges`}
            .editable=${this.editEnabled}
            .selectedKey=${this._edit.selectedKey ?? undefined}
            .editingKey=${this._edit.editing?.key ?? undefined}
            .editLabel=${this.editLabel ?? EDIT_RANGE_LABEL}
            .confirmEditLabel=${this.confirmEditLabel ?? CONFIRM_EDIT_RANGE_LABEL}
            .cancelEditLabel=${this.cancelEditLabel ?? CANCEL_EDIT_RANGE_LABEL}
            @pillremove=${this.onPillRemoveEvent}
            @pillclick=${this.onPillClickEvent}
            @pillfocus=${this.onPillFocusEvent}
            @pilledit=${this.onPillEditEvent}
            @pilleditconfirm=${this.onPillEditConfirm}
            @pilleditcancel=${this.onPillEditCancel}
            @pillkeydown=${this._pillsNav.onPillKeydown}
            @pillexit=${this._pillsNav.onPillExit}
          ></gui-pills>

          <div class="gui-range-date-input__inputs">
            <div
              class="gui-parts gui-range-date-input__field"
              role="group"
              aria-label=${this.startDateAriaLabel ?? 'Start date'}
            >
              ${renderGroupParts('start', partsData, this._parts)}
            </div>

            <span class="gui-range-date-input__separator">${this.separator ?? '-'}</span>

            <div
              class="gui-parts gui-range-date-input__field"
              role="group"
              aria-label=${this.endDateAriaLabel ?? 'End date'}
            >
              ${renderGroupParts('end', partsData, this._parts)}
            </div>
          </div>
        </div>
      </div>

      ${this.showErrors && this.errors?.length
        ? addErrors(this.uid as string, templateData)
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
        editAriaLabel: formatEditMessage(this.editAriaLabel ?? EDIT_RANGE_ARIA_LABEL, item.label),
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
    this.dispatchEvent(
      new CustomEvent('editStateChange', {
        detail: { selected: this._edit.selectedRange, editing: !!this._edit.editing },
      }),
    );
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

  /** Starts editing the selected pill; the host picker's Edit action. */
  startEdit(): boolean {
    return this._edit.startEdit();
  }

  /** Cancels an open edit session; the host picker's Cancel action. */
  cancelEdit(): void {
    this._edit.cancel();
  }

  get isEditing(): boolean {
    return !!this._edit.editing;
  }

  get selectedEditRange(): DateRange | null {
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
      new CustomEvent('change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
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
    if (outcome === 'deselected' || outcome === 'cancelled') return;
    this.onPillClick(range);
  };

  /**
   * Keyboard navigation landed on another pill: the selection follows focus
   * away, so only the focused pill offers the edit affordance. An open
   * session is left alone (its pill keeps focus semantics of its own).
   */
  private onPillFocusEvent = (e: CustomEvent<GuiPillEventDetail>) => {
    if (!this.editEnabled || this._edit.editing) return;
    if (this._edit.selectedKey && this._edit.selectedKey !== e.detail.key) {
      this._edit.clearSelection();
    }
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

  private getSortedPills(): DateRange[] {
    return sortRangesByStart(
      this.value,
      (a, b) => parseISODateString(a).getTime() - parseISODateString(b).getTime(),
    );
  }

  private onPillClick(range: DateRange) {
    this.dispatchEvent(
      new CustomEvent('pillClick', {
        detail: { range },
        bubbles: true,
        composed: true,
      }),
    );
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
   * `partsChange` so its calendar follows the typed endpoints. Runs on every
   * part change.
   */
  private syncParts() {
    const start = this.validateDateParts('start');
    const end = this.validateDateParts('end');

    const iso = (endpoint: RangeEndpoint<Date>) =>
      endpoint.kind === 'valid' ? toISODateString(endpoint.value) : null;

    this._workingISO = { start: iso(start), end: iso(end) };
    if (this._edit.editing) this.requestUpdate();

    this.dispatchEvent(
      new CustomEvent('partsChange', {
        detail: { start: iso(start), end: iso(end) },
        bubbles: true,
        composed: true,
      }),
    );

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
      invalidMessage ?? this.incompleteMessage ?? INCOMPLETE_DATE_MESSAGE,
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
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );

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
   */
  public showRange(startISO: string, endISO: string): void {
    this._parts.setGroupFromISO('start', startISO, 'date');
    this._parts.setGroupFromISO('end', endISO, 'date');
  }

  public surfaceHostError(message: string): void {
    this._parts.surfaceInputError(message);
  }

  /**
   * Fills one endpoint's parts from an ISO date, or clears them when given
   * null. The range date picker calls this so a day picked in the calendar
   * lands in the visible field straight away — the reverse of typed parts
   * moving the calendar's selection.
   */
  fillGroup(group: 'start' | 'end', iso: string | null): void {
    this._parts.setGroupFromISO(group, iso, 'date');
    this.requestUpdate();
  }

  /** Clear both groups' parts (e.g. once a valid range is committed). */
  public clearRangeInputs(): void {
    this._parts.clearGroup('start');
    this._parts.clearGroup('end');
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-range-date-input': GuiRangeDateInput;
  }
}

safeDefine('gui-range-date', GuiRangeDateInput);
