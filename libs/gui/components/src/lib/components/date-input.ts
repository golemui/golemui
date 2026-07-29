import type { DateinputProps } from '@golemui/gui-shared/internals';
import { html, LitElement, nothing, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { GUIPartsController } from '../controllers/parts.controller';
import { dateBoundsError, getDateFormatParts } from '../utils/date';
import { renderGroupParts, type GUIPartsTemplateData } from '../utils/part-templates';
import {
  dateInputPartDescriptors,
  parseDateGroup,
  type DateTimePartDescriptor,
} from '../utils/parts';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';

@customElement('gui-date')
export class GuiDate extends LitElement {
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

  @property({ type: String }) value: string | undefined = undefined;
  @property({ type: String, attribute: 'invalid-date-message' }) invalidDateMessage:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'min-date' }) minDate: string | undefined = undefined;
  @property({ type: String, attribute: 'max-date' }) maxDate: string | undefined = undefined;
  @property({ type: String, attribute: 'min-date-message' }) minDateMessage: string | undefined =
    undefined;
  @property({ type: String, attribute: 'max-date-message' }) maxDateMessage: string | undefined =
    undefined;

  private readonly inputBlockClass = 'gui-date-input';
  private readonly groups = ['default'] as const;

  private readonly partDescriptors = dateInputPartDescriptors();

  private _parts = new GUIPartsController(this, {
    blockClass: this.inputBlockClass,
    groups: this.groups,
    getDescriptor: (type) => this.getPartDescriptor(type),
    commitGroup: (group) => this.validateAndEmit(group),
    isReadonly: () => !!this.readOnly,
    isDisabled: () => !!this.disabled,
    onEmptyPartBlur: () =>
      this.dispatchEvent(new CustomEvent('change', { detail: { value: null }, bubbles: true })),
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

  override willUpdate(changedProperties: PropertyValues): void {
    if (changedProperties.has('value')) {
      this._parts.setGroupFromISO('default', this.value ?? '', 'date');
    }
  }

  override render() {
    const templateData: ControlTemplateData<string> & DateinputProps = {
      uid: this.uid,
      label: this.label,
      errors: this.errors,
      touched: this.touched,
      required: this.required,
      disabled: this.disabled,
      readonly: this.readOnly,
      value: this.value,
      icon: this.icon,
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

    const iconClassMap = {
      'gui-widget-icon': true,
      [this.icon as string]: true,
    };

    return html`
      ${this.label ? addLabel(this.uid as string, templateData) : nothing}

      <div class="gui-widget">
        <div
          class="gui-widget-input gui-parts gui-parts-ring gui-date-input ${this.icon
            ? 'gui-calendar--icon'
            : ''}"
          role="group"
        >
          ${renderGroupParts('default', partsData, this._parts)}
        </div>
        ${this.icon
          ? html`<span
              class=${classMap(iconClassMap)}
              data-icon=${this.icon}
              aria-hidden="true"
            ></span>`
          : nothing}
      </div>

      ${this.showErrors && this.errors?.length
        ? addErrors(this.uid as string, templateData)
        : nothing}
    `;
  }

  private validateAndEmit(group: string): void {
    // Clamp out-of-range values and write them back so the user sees the
    // corrected part immediately
    const { result, writeBacks } = parseDateGroup(this._parts.values[group] ?? {}, {
      descriptors: this.partDescriptors,
      invalidDateMessage: this.invalidDateMessage,
    });
    this._parts.applyWriteBacks(group, writeBacks);

    if (result.kind === 'invalid') {
      // Date is complete but invalid
      this.dispatchEvent(
        new CustomEvent('inputError', {
          detail: { message: result.message },
          bubbles: true,
        }),
      );
    } else if (result.kind === 'valid') {
      const boundsError = dateBoundsError(result.iso, this.minDate, this.maxDate, undefined, {
        minDateMessage: this.minDateMessage,
        maxDateMessage: this.maxDateMessage,
      });

      if (boundsError) {
        this.dispatchEvent(
          new CustomEvent('change', {
            detail: { value: result.iso },
            bubbles: true,
          }),
        );
        this.dispatchEvent(
          new CustomEvent('inputError', {
            detail: { message: boundsError },
            bubbles: true,
          }),
        );
        this.requestUpdate();
        return;
      }

      this.value = result.iso;

      this.dispatchEvent(
        new CustomEvent('change', {
          detail: { value: this.value },
          bubbles: true,
        }),
      );
    }

    this.requestUpdate();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-date': GuiDate;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('gui-date')) {
  customElements.define('gui-date', GuiDate);
}
