import {
  createOptionMapper,
  GUIAriaController,
  inferOptionValue,
  isOption,
  isOptionValue,
  isProtoOption,
  Option,
  OptionValue,
  RadiogroupProps,
} from '@golemui/shared-vanilla';
import { html, LitElement, nothing } from 'lit';
import { repeat } from 'lit-html/directives/repeat.js';
import { customElement, property } from 'lit/decorators.js';
import { Subscription } from 'rxjs';
import { addErrors, addLabel, ControlTemplateData } from '../utils/templates';

@customElement('gui-radiogroup')
export class RadiogroupElement extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: String, attribute: 'locale-id' }) localeId = 'en';
  @property({ type: Boolean }) touched = false;
  @property({ type: Array }) errors = [];
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly = false;
  @property({ type: String }) value: string | undefined = undefined;

  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: String }) options: Option[] = [];
  @property({ type: String }) labelField: string | undefined = undefined;
  @property({ type: String }) valueField: string | undefined = undefined;

  protected optionsLoading = false;
  protected hasMatchingValue = false;

  private ariaController = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`input[name="${this.uid}"]`),
    getState: () => ({
      uid: this.uid as string,
      templateData: {
        hint: this.hint,
        errors: this.errors,
        readonly: this.readOnly,
        disabled: this.disabled,
        touched: this.touched,
      },
    }),
  });

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  private updateOptions() {
    const opts = this.options;
    const props = { labelField: this.labelField, valueField: this.valueField } as RadiogroupProps;

    if (Array.isArray(opts) && opts.length > 0) {
      if (isOption(opts[0])) {
        // nothing to do
      } else if (isOptionValue(opts[0])) {
        this.options = (this.options as unknown as OptionValue[]).map((opt) => ({
          label: opt.toString(),
          value: opt,
        }));
      } else if (isProtoOption(opts[0], props)) {
        const optionMapper = createOptionMapper(opts[0], props);
        this.options = this.options.map(optionMapper);
      } else {
        throw new Error('Invalid option shape');
      }
      const selection = this.value;
      this.hasMatchingValue = this.options.find(({ value }) => value === selection) !== undefined;
    }
  }

  override render() {
    super.render();

    const templateData: ControlTemplateData<string> & RadiogroupProps = {
      uid: this.uid,
      label: this.label,
      touched: this.touched,
      errors: this.errors,
      disabled: this.disabled,
      readonly: this.readOnly,
      value: this.value,
      hint: this.hint,
      options: this.options,
      labelField: this.labelField,
      valueField: this.valueField,
    };

    this.updateOptions();

    const options = this.optionsLoading
      ? html`<span>Loading...</span>`
      : html`
          ${repeat(
            this.options || [],
            (opt: any) => opt?.value,
            (opt: any, index) =>
              html`<label for=${`${this.uid}_${index}`}>
                <input
                  type="radio"
                  id=${`${this.uid}_${index}`}
                  data-cy=${`${this.uid}_radiogroup_${index}`}
                  name=${this.uid}
                  value=${opt.value}
                  checked=${this.hasMatchingValue && opt.value === templateData.value
                    ? ''
                    : nothing}
                  disabled=${templateData.disabled || templateData.readonly ? '' : nothing}
                  @change="${() => this.valueChanged(event)}"
                  @blur="${() => this.onBlur()}"
                />
                ${opt.label}
              </label>`,
          )}
        `;

    return html`
      ${addLabel(this.uid as string, templateData)}

      <div class="gui-field">${options}</div>

      ${addErrors(this.uid as string, templateData)}
    `;
  }

  valueChanged(event: Event | undefined) {
    event?.stopPropagation();

    if (!this.readOnly) {
      const target = event?.target as HTMLInputElement;
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
