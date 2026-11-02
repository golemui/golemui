import { html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { property } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { safeDefine } from '@golemui/lit-utils';
import { classMap } from 'lit/directives/class-map.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { addErrors, addIcon, addLabel, type ControlTemplateData } from '../utils/templates';
import { inferOptionValue, isOptionValueOf, updateOptions } from './one-of';
import type { Option, OptionInput, OptionValue } from '../types';
import { GuiFormControl, type GuiValidity } from '../gui-form-control';
import {
  dispatchBlur,
  dispatchInputError,
  dispatchValue,
  fires,
  valueEvents,
  type GuiInputErrorEventDetail,
} from '../utils/events';
import { message, requiredName } from '../utils/messages';

/** What <gui-select> renders besides the control state: its presentation props. */
export type GuiSelectProps = {
  hint?: string;
  icon?: string;
  autocomplete?: string;
  options?: Option[];
  placeholder?: string;
  labelField?: string;
  valueField?: string;
};

/**
 * A native select to pick one option.
 *
 * @fires gui-input - The user changed the value. `detail.value` is the new value.
 * @fires gui-change - The user committed the value. `detail.value` is the committed value.
 * @fires gui-blur - Focus left the control.
 * @fires gui-input-error - The element rejected what the user entered, such as an impossible date
 *   or a value out of bounds. `detail.message` is the error; show it through `errors`.
 */
export class GuiSelect extends GuiFormControl {
  /** BCP 47 locale for formatting and parsing, such as `en-US` or `es`. */
  @property({ type: String, attribute: 'locale-id' }) localeId = 'en';
  /** The value of the selected option. */
  @property({ type: String }) value: OptionValue | undefined = undefined;

  /** Icon class name shown inside the control, for example from an icon font. */
  @property({ type: String }) icon: string | undefined = undefined;
  /** The `autocomplete` hint passed to the inner native control. */
  @property({ type: String }) autocomplete: string | undefined = undefined;
  /**
   * The options: values, which are both the text and the value, `{ label, value }` objects, or
   * any objects read through `label-field` and `value-field`.
   */
  @property({ type: Array }) options: OptionInput[] = [];
  /** Text shown while the control is empty. */
  @property({ type: String }) placeholder: string | undefined = undefined;
  /** Error when `value` matches no option. `{value}` is the value. */
  @property({ type: String, attribute: 'invalid-option-message' }) invalidOptionMessage:
    | string
    | undefined = undefined;
  /** For options given as objects, the key of the text to show. */
  @property({ type: String, attribute: 'label-field' }) labelField: string | undefined = undefined;
  /** For options given as objects, the key of the value. */
  @property({ type: String, attribute: 'value-field' }) valueField: string | undefined = undefined;

  protected optionsLoading = false;
  protected hasMatchingValue = false;
  /** `options` as `{ label, value }` objects, refreshed on every render. */
  protected normalizedOptions: Option[] = [];
  // Whether the last gui-input-error about the value still stands, to withdraw it.
  private reportedInvalidOption = false;

  private ariaController = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`select[id="${this.uid}"]`),
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

  override render() {
    super.render();

    const templateData: ControlTemplateData<OptionValue> & GuiSelectProps = {
      uid: this.uid,
      label: this.label,
      errors: this.errors,
      touched: this.touched,
      required: this.required,
      disabled: this.disabled,
      readonly: this.readOnly,
      value: this.value,
      hint: this.hint,
      icon: this.icon,
      autocomplete: this.autocomplete,
      placeholder: this.placeholder,
      labelField: this.labelField,
      valueField: this.valueField,
    };

    // Icon
    const selectIcon = addIcon('select', templateData);

    this.normalizedOptions = updateOptions(this.options ?? [], {
      labelField: this.labelField,
      valueField: this.valueField,
    });
    templateData.options = this.normalizedOptions;

    this.hasMatchingValue = this.normalizedOptions.length
      ? this.normalizedOptions.some(({ value }) => isOptionValueOf(value, this.value))
      : false;

    const options = this.optionsLoading
      ? html`<span>Loading...</span>`
      : html`
          <option value="" disabled .selected=${live(!this.hasMatchingValue)}>
            ${message('selectAnOption', this.placeholder)}
          </option>
          ${repeat(
            this.normalizedOptions,
            (opt: any) => opt?.value,
            (opt: any) =>
              html`<option
                value=${opt.value}
                .selected=${live(this.hasMatchingValue && isOptionValueOf(opt.value, this.value))}
              >
                ${opt.label}
              </option>`,
          )}
        `;

    return html`
      ${addLabel(this.uid, templateData)}

      <div class="gui-widget">
        <select
          id=${this.uid}
          data-cy=${`${this.uid}_select`}
          class=${classMap({ 'gui-widget-input': true, ...selectIcon.widgetClasses })}
          ?disabled=${templateData.disabled}
          autocomplete=${this.autocomplete || nothing}
          @mousedown=${this.onMousedown}
          @keydown=${this.onKeydown}
          @change=${this.valueChanged}
          @blur=${this.onBlur}
        >
          ${options}
        </select>
        <span class="gui-select__arrow"><span class="gui-caret" aria-hidden="true"></span></span>
        ${selectIcon.html}
      </div>

      ${addErrors(this.uid, templateData)}
    `;
  }

  override updated(changedProperties: Map<string, any>) {
    if (!changedProperties.has('value') && !changedProperties.has('options')) return;

    // Options that make the value valid withdraw the error.
    const invalid = this.matchesNoOption();
    // Reported once per value: hosts re-render with new options arrays as they show the error.
    if (invalid && (changedProperties.has('value') || !this.reportedInvalidOption)) {
      dispatchInputError(this, this.invalidOptionError());
    } else if (!invalid && this.reportedInvalidOption) {
      dispatchInputError(this, '');
    }
    this.reportedInvalidOption = invalid;
  }

  /**
   * A value the options do not hold: the select shows the placeholder, as a native select can't
   * hold it. Options often arrive after the value (loaded from a server), so no options yet is not
   * an invalid value.
   */
  private matchesNoOption(): boolean {
    const hasValue = this.value !== undefined && this.value !== null && this.value !== '';
    return hasValue && !!this.normalizedOptions.length && !this.hasMatchingValue;
  }

  /**
   * A value that matches no option is missing when `required`, as the placeholder shows, and
   * invalid otherwise. Then `required`.
   */
  protected override validate(): GuiValidity | null {
    if (!this.matchesNoOption()) return super.validate();
    if (this.required) {
      return { flags: { valueMissing: true }, message: message('valueMissing') };
    }
    return { flags: { customError: true }, message: this.invalidOptionError() };
  }

  /**
   * The error for a value that matches no option. An empty override or translation falls back to
   * the default: `''` would clear the error in `gui-input-error`, and `setValidity` throws on it.
   */
  private invalidOptionError(): string {
    return requiredName('invalidOption', this.invalidOptionMessage, { value: String(this.value) });
  }

  /** A value that matches no option is not submitted, as the select does not show it. */
  protected override formValue(): string | FormData | null {
    return this.matchesNoOption() ? null : super.formValue();
  }

  /** @internal */
  valueChanged(event: Event) {
    event.stopPropagation();

    if (!this.readOnly) {
      const target = event.target as HTMLInputElement;
      this.value = inferOptionValue(target.value, this.normalizedOptions);
      // A picked option is valid, and its gui-input already replaces the error for the host.
      this.reportedInvalidOption = false;
      dispatchValue(this, this.value);
    }
  }

  /**
   * A read-only select stays focusable but never opens its list: the mouse only focuses it.
   *
   * @internal
   */
  onMousedown(event: MouseEvent) {
    if (!this.readOnly) return;
    event.preventDefault();
    (event.currentTarget as HTMLSelectElement).focus();
  }

  /**
   * Every key but Tab would open the list or change the option (arrows, Space, typing), so a
   * read-only select ignores them.
   *
   * @internal
   */
  onKeydown(event: KeyboardEvent) {
    if (this.readOnly && event.key !== 'Tab') event.preventDefault();
  }

  /** @internal */
  onBlur() {
    dispatchBlur(this);
  }
}

/** The events `gui-select` fires, with their types. */
export const GuiSelectEvents = {
  ...valueEvents<GuiSelect['value']>(),
  'gui-input-error': fires<CustomEvent<GuiInputErrorEventDetail>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-select': GuiSelect;
  }
}

safeDefine('gui-select', GuiSelect);
