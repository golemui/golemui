import { html, LitElement, nothing } from 'lit';
import { repeat } from 'lit-html/directives/repeat.js';
import { customElement, property } from 'lit/decorators.js';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';
import { GUIAriaController } from '../controllers';
import { type OptionValue, type Option, type RadiogroupProps, type OneOfProps } from '@golemui/gui-shared';
import { inferOptionValue, updateOptions } from './one-of';

@customElement('gui-radiogroup')
export class GuiRadiogroup extends LitElement {
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
  @property({ type: String }) options: Option[] = [];
  @property({ type: String }) labelField: string | undefined = undefined;
  @property({ type: String }) valueField: string | undefined = undefined;
  @property({ type: String }) direction: 'row' | 'column' | undefined = 'column';

  protected optionsLoading = false;
  protected hasMatchingValue = false;

  private ariaController = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`input[name="${this.uid}"]`),
    getState: () => ({
      uid: this.uid as string,
      templateData: {
        hint: this.hint,
        errors: this.errors,
        touched: this.touched,
        // Radiogroup inputs can't be readonly
        readonly: false,
        disabled: false,
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

    const templateData: ControlTemplateData<OptionValue> & RadiogroupProps = {
      uid: this.uid,
      label: this.label,
      errors: this.errors,
      touched: this.touched,
      required: this.required,
      disabled: this.disabled,
      readonly: this.readOnly,
      value: this.value,
      hint: this.hint,
      options: this.options,
      labelField: this.labelField,
      valueField: this.valueField,
      direction: this.direction,
    };

    this.options = updateOptions(this.options, {
      labelField: this.labelField,
      valueField: this.valueField,
    } as OneOfProps);
    const selection = this.value;
    this.hasMatchingValue = this.options?.length
      ? this.options.find(({ value }) => value === selection) !== undefined
      : false;

    const options = this.optionsLoading
      ? html`<span>Loading...</span>`
      : html`
          ${repeat(
            this.options || [],
            (opt: any) => opt?.value,
            (opt: any, index) => {
              const isChecked = this.hasMatchingValue && opt.value === templateData.value;
              const isFirstUnchecked = !this.hasMatchingValue && index === 0;
              const focusable = isChecked || isFirstUnchecked;
              return html`<label for=${`${this.uid}_${index}`}>
                <input
                  type="radio"
                  tabindex=${focusable ? '0' : '-1'}
                  id=${`${this.uid}_${index}`}
                  data-cy=${`${this.uid}_radiogroup_${index}`}
                  name=${this.uid}
                  value=${opt.value}
                  ?checked=${isChecked}
                  ?required=${templateData.required}
                  ?disabled=${templateData.disabled || templateData.readonly}
                  @change=${this.valueChanged}
                  @blur=${this.onBlur}
                />
                ${opt.label}
              </label>`;
            },
          )}
        `;

    return html`
      ${addLabel(this.uid as string, templateData, false, undefined, false)}

      <div
        class="gui-widget${this.direction === 'row' ? ' gui-widget--horizontal' : ''}"
        role="radiogroup"
        id=${this.uid}
        aria-labelledby=${templateData.label ? `${this.uid}_label` : nothing}
        aria-describedby=${templateData.hint ? `${this.uid}_hint` : nothing}
      >
        ${options}
      </div>

      ${addErrors(this.uid as string, templateData)}
    `;
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
    'gui-radiogroup': GuiRadiogroup;
  }
}
