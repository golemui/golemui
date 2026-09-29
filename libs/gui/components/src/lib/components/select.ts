import { html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { property } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { safeDefine } from '@golemui/lit-utils';
import { classMap } from 'lit/directives/class-map.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { addErrors, addIcon, addLabel, type ControlTemplateData } from '../utils/templates';
import { inferOptionValue, updateOptions } from './one-of';
import { CARET_DOWN_PATH } from '../utils/icons';
import type { Option, OptionValue } from '../types';
import { GuiFormControl } from '../gui-form-control';
import { dispatchValue } from '../utils/events';
import { message } from '../utils/messages';

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
  /** The options, as values or `{ label, value }` objects. */
  @property({ type: Array }) options: Option[] = [];
  /** Text shown while the control is empty. */
  @property({ type: String }) placeholder: string | undefined = undefined;
  /** Error when `value` matches no option. `{value}` is the value. */
  @property({ type: String, attribute: 'invalid-option-message' }) invalidOptionMessage:
    | string
    | undefined = undefined;
  /** For options given as objects, the key of the text to show. */
  @property({ type: String }) labelField: string | undefined = undefined;
  /** For options given as objects, the key of the value. */
  @property({ type: String }) valueField: string | undefined = undefined;

  protected optionsLoading = false;
  protected hasMatchingValue = false;

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
      options: this.options,
      placeholder: this.placeholder,
      labelField: this.labelField,
      valueField: this.valueField,
    };

    // Icon
    const selectIcon = addIcon('select', templateData);

    this.options = updateOptions(this.options, {
      labelField: this.labelField,
      valueField: this.valueField,
    });

    this.hasMatchingValue = this.options?.length
      ? this.options.find(({ value }) => value === this.value) !== undefined
      : false;

    const options = this.optionsLoading
      ? html`<span>Loading...</span>`
      : html`
          <option value="" disabled .selected=${live(!this.hasMatchingValue)}>
            ${message('selectAnOption', this.placeholder)}
          </option>
          ${repeat(
            this.options || [],
            (opt: any) => opt?.value,
            (opt: any) =>
              html`<option
                value=${opt.value}
                .selected=${live(this.hasMatchingValue && opt.value === this.value)}
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
          ?required=${templateData.required}
          ?disabled=${templateData.disabled || templateData.readonly}
          autocomplete=${this.autocomplete || nothing}
          @change=${this.valueChanged}
          @blur=${this.onBlur}
        >
          ${options}
        </select>
        <span class="gui-select__arrow"
          ><svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 256 256"
            aria-hidden="true"
          >
            <path d=${CARET_DOWN_PATH}></path></svg
        ></span>
        ${selectIcon.html}
      </div>

      ${addErrors(this.uid, templateData)}
    `;
  }

  override updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('value')) {
      if (!this.hasMatchingValue && this.value) {
        this.dispatchEvent(
          new CustomEvent('gui-input-error', {
            detail: {
              message: message('invalidOption', this.invalidOptionMessage, {
                value: String(this.value),
              }),
            },
            bubbles: true,
          }),
        );
      }
    }
  }

  /** @internal */
  valueChanged(event: Event) {
    event.stopPropagation();

    if (!this.readOnly) {
      const target = event.target as HTMLInputElement;
      this.value = inferOptionValue(target.value, this.options);
      dispatchValue(this, this.value);
    }
  }

  /** @internal */
  onBlur() {
    this.dispatchEvent(
      new CustomEvent('gui-blur', {
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-select': GuiSelect;
  }
}

safeDefine('gui-select', GuiSelect);
