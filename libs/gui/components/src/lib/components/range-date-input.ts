import type { DateRange, RangeDateInputProps } from '@golemui/gui-shared/internals';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { GUIPartsController } from '../controllers/parts.controller';
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
} from '../utils/parts';
import {
  buildPillItems,
  findRangeByKey,
  formatISODateForDisplay,
  formatRangeLabel,
  removeRangeByKey,
  sortRangesByStart,
} from '../utils/pill-ranges';
import { commitRange, orderEndpoints, type RangeEndpoint } from '../utils/range-commit';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';
import './pills';
import type { GuiPillEventDetail, GuiPillItem } from './pills';
import { styleMap } from 'lit-html/directives/style-map.js';

@customElement('gui-range-date')
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

  @property({ type: Array }) value: DateRange[] | undefined = [];
  @property({ type: String, attribute: 'invalid-date-message' }) invalidDateMessage:
    | string
    | undefined = undefined;

  @property({ type: String }) removePillAriaLabel: string | undefined = undefined;
  @property({ type: String }) startDateAriaLabel: string | undefined = undefined;
  @property({ type: String }) endDateAriaLabel: string | undefined = undefined;
  @property({ type: String }) separator: string | undefined = undefined;

  private readonly inputBlockClass = 'gui-range-date-input';
  private readonly groups = ['start', 'end'] as const;

  private readonly partDescriptors = dateInputPartDescriptors();

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
    onEnter: () => {
      this.tryCreatePill();
      if (this.value && this.value.length > 0) {
        const lastRange = this.value[this.value.length - 1];
        this.onPillClick(lastRange);
      }
    },
    onInputErrorSurfaced: (message) =>
      this.dispatchEvent(new CustomEvent('inputError', { detail: { message }, bubbles: true })),
    onSurfacedErrorCleared: (value) =>
      this.dispatchEvent(
        new CustomEvent('change', { detail: { value }, bubbles: true, composed: true }),
      ),
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
      required: this.required,
      disabled: this.disabled,
      partsReadonly: !!this.readOnly,
    };

    const pillItems: GuiPillItem[] = buildPillItems(
      this.getSortedPills(),
      (pill) => formatRangeLabel(pill, (iso) => formatISODateForDisplay(iso, this.localeId)),
      this.removePillAriaLabel ?? 'Remove date',
    );

    const iconClassMap = {
      'gui-widget-icon': true,
      [this.icon as string]: !!this.icon,
    };

    return html`
      ${this.label ? addLabel(this.uid as string, templateData, false, undefined, false) : nothing}

      <div class="gui-widget">
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
            .items=${pillItems}
            .removable=${true}
            .clickable=${true}
            .bubble=${true}
            ?disabled=${this.disabled}
            ?readonly=${this.readOnly}
            .removeAriaLabel=${this.removePillAriaLabel ?? 'Remove date'}
            .compactAriaLabel=${`${pillItems.length} date ranges`}
            @pillremove=${this.onPillRemoveEvent}
            @pillclick=${this.onPillClickEvent}
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

        ${this.showErrors && this.errors?.length
          ? addErrors(this.uid as string, templateData)
          : nothing}
      </div>
    `;
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
      requestAnimationFrame(() => {
        const firstInput = this.querySelector<HTMLInputElement>(
          '.gui-range-date-input__field input',
        );
        firstInput?.focus();
      });
    }
  };

  private onPillClickEvent = (e: CustomEvent<GuiPillEventDetail>) => {
    const range = findRangeByKey(this.getSortedPills(), e.detail.key);
    if (range) this.onPillClick(range);
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
   * bounds) surface while the user types. Runs on every part change.
   */
  private syncParts() {
    return {
      start: this.validateDateParts('start'),
      end: this.validateDateParts('end'),
    };
  }

  /**
   * Parses the range and updates the error state, without ever committing.
   * Shared by the Enter commit and by {@link revalidate}.
   */
  private evaluateRange() {
    const { start, end } = this.syncParts();

    const outcome = commitRange(start, end, this.value, {
      // Swap if end < start
      order: (s, e) => orderEndpoints(s, e, (a, b) => a.getTime() - b.getTime()),
      toRange: ({ start: rangeStart, end: rangeEnd }): DateRange => {
        const startStr = toISODateString(rangeStart);
        const endStr = toISODateString(rangeEnd);
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

  private tryCreatePill() {
    this._validationTriggered = true;

    const outcome = this.evaluateRange();
    if (outcome.kind !== 'commit') return;

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

    // Focus the first start date input
    this._parts.focusFirst('start');

    this.requestUpdate();
  }

  /**
   * Echo a range into the input parts without committing it (no pill, no change
   * event). Used by the picker to show a range the calendar rejected.
   */
  public showRange(startISO: string, endISO: string): void {
    this._parts.setGroupFromISO('start', startISO, 'date');
    this._parts.setGroupFromISO('end', endISO, 'date');
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

if (typeof customElements !== 'undefined' && !customElements.get('gui-range-date')) {
  customElements.define('gui-range-date', GuiRangeDateInput);
}
