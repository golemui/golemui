import { inferOptionValue, updateOptions } from './one-of';
import { html, LitElement, nothing } from 'lit';
import { repeat } from 'lit-html/directives/repeat.js';
import { customElement, property } from 'lit/decorators.js';
import { Subscription } from 'rxjs';
import { addErrors, addIcon, addLabel, ControlTemplateData } from '../utils/templates';
import { OneOfProps, Option, SelectProps } from '../field.props';
import { GUIAriaController } from '../controllers';
import { classMap } from 'lit/directives/class-map.js';

@customElement('gui-select')
export class GuiSelectControl extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: String, attribute: 'locale-id' }) localeId = 'en';
  @property({ type: Boolean }) touched = false;
  @property({ type: Array }) errors = [];
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly = false;
  @property({ type: String }) value: string | undefined = undefined;

  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: String }) icon: string | undefined = undefined;
  @property({ type: String }) iconPosition: 'left' | 'right' = 'left';
  @property({ type: String }) options: Option[] = [];
  @property({ type: String }) placeholder: string | undefined = undefined;
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
      },
    }),
  });

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override render() {
    super.render();

    const templateData: ControlTemplateData<string> & SelectProps = {
      uid: this.uid,
      label: this.label,
      touched: this.touched,
      errors: this.errors,
      disabled: this.disabled,
      readonly: this.readOnly,
      value: this.value,
      hint: this.hint,
      icon: this.icon,
      iconPosition: this.iconPosition,
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
          <option value="" disabled selected=${this.hasMatchingValue ? nothing : ''}>
            ${this.placeholder ?? 'Select an option'}
          </option>
          ${repeat(
            this.options || [],
            (opt: any) => opt?.value,
            (opt: any) =>
              html`<option
                value=${opt.value}
                selected=${this.hasMatchingValue && opt.value === this.value ? '' : nothing}
              >
                ${opt.label}
              </option>`,
          )}
        `;

    return html`
      ${addLabel(this.uid as string, templateData)}

      <div class="gui-field">
        <select
          id=${this.uid}
          data-cy=${`${this.uid}_select`}
          class=${classMap(selectIcon.fieldClasses)}
          ?disabled=${templateData.disabled || templateData.readonly || nothing}
          @change="${() => this.valueChanged(event as Event)}"
          @blur="${() => this.onBlur()}"
        >
          ${options}
        </select>
        ${selectIcon.html}
      </div>

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
