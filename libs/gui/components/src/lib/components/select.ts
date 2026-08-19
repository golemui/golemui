import type { OneOfProps, Option, OptionValue, SelectProps } from '@golemui/gui-shared/internals';
import { html, LitElement, nothing } from 'lit';
import { repeat } from 'lit-html/directives/repeat.js';
import { property } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { safeDefine } from '@golemui/lit/internals';
import { classMap } from 'lit/directives/class-map.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { addErrors, addIcon, addLabel, type ControlTemplateData } from '../utils/templates';
import { inferOptionValue, updateOptions } from './one-of';

export class GuiSelect extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: String, attribute: 'locale-id' }) localeId = 'en';
  @property({ type: Array }) errors: string[] | undefined = [];
  @property({ type: Boolean }) touched: boolean | undefined = false;
  @property({ type: Boolean }) required: boolean | undefined = false;
  @property({ type: Boolean }) disabled: boolean | undefined = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly: boolean | undefined = false;
  @property({ type: String }) value: OptionValue | undefined = undefined;

  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: String }) icon: string | undefined = undefined;
  @property({ type: String }) autocomplete: string | undefined = undefined;
  @property({ type: Array }) options: Option[] = [];
  @property({ type: String }) placeholder: string | undefined = undefined;
  @property({ type: String, attribute: 'invalid-option-message' }) invalidOptionMessage:
    | string
    | undefined = undefined;
  @property({ type: String }) labelField: string | undefined = undefined;
  @property({ type: String }) valueField: string | undefined = undefined;

  protected optionsLoading = false;
  protected hasMatchingValue = false;

  private ariaController = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`select[id="${this.uid}"]`),
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

  override render() {
    super.render();

    const templateData: ControlTemplateData<OptionValue> & SelectProps = {
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
    } as OneOfProps);

    this.hasMatchingValue = this.options?.length
      ? this.options.find(({ value }) => value === this.value) !== undefined
      : false;

    const options = this.optionsLoading
      ? html`<span>Loading...</span>`
      : html`
          <option value="" disabled .selected=${live(!this.hasMatchingValue)}>
            ${this.placeholder ?? 'Select an option'}
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
      ${addLabel(this.uid as string, templateData)}

      <div class="gui-widget">
        <select
          id=${this.uid as string}
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
            <path
              d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"
            ></path></svg
        ></span>
        ${selectIcon.html}
      </div>

      ${addErrors(this.uid as string, templateData)}
    `;
  }

  override updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('value')) {
      if (!this.hasMatchingValue && this.value) {
        this.dispatchEvent(
          new CustomEvent('inputError', {
            detail: {
              message: (
                this.invalidOptionMessage ?? `Invalid selection: '{value}' is not a valid option.`
              ).replace('{value}', String(this.value)),
            },
            bubbles: true,
          }),
        );
      }
    }
  }

  valueChanged(event: Event) {
    event.stopPropagation();

    if (!this.readOnly) {
      const target = event.target as HTMLInputElement;
      this.dispatchEvent(
        new CustomEvent('change', {
          detail: { value: inferOptionValue(target.value, this.options) },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  onBlur() {
    this.dispatchEvent(
      new CustomEvent('blur', {
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
