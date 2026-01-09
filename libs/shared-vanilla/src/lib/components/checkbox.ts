import { GUIAriaController } from '../controllers/aria.controller';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { addLabel, ControlTemplateData } from '../utils/templates';
import { CheckboxProps } from '../field.props';

@customElement('gui-checkbox')
export class GuiCheckboxControl extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: String, attribute: 'locale-id' }) localeId = 'en';
  @property({ type: Boolean }) touched = false;
  @property({ type: Array }) errors = [];
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) readonly = false;
  @property({ type: String }) value: string | undefined = undefined;

  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: String }) checkboxPosition: 'left' | 'right' = 'right';

  private ariaController = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`input[id="${this.uid}"]`),
    getState: () => ({
      uid: this.uid as string,
      templateData: {
        hint: this.hint,
        errors: this.errors,
        readonly: this.readonly,
        disabled: this.disabled,
        touched: this.touched,
      },
    }),
  });

  override createRenderRoot() {
    return this;
  }

  override render() {
    super.render();

    const templateData: ControlTemplateData<string> & CheckboxProps = {
      uid: this.uid,
      label: this.label,
      hint: this.hint,
      touched: this.touched,
      errors: this.errors,
      disabled: this.disabled,
      readonly: this.readonly,
      value: this.value,
      checkboxPosition: this.checkboxPosition,
    };

    if (templateData.checkboxPosition === 'left') {
      this.classList.add('gui-checkbox--left');
    } else if (this.classList.contains('gui-checkbox--left')) {
      this.classList.remove('gui-checkbox--left');
    }

    return html`
      ${addLabel(this.uid as string, templateData, true)}

      <div class="gui-field gui-field--horizontal">
        <input
          type="checkbox"
          id=${this.uid}
          data-cy=${`${this.uid}_checkbox`}
          ?checked=${this.value}
          ?disabled=${this.disabled || nothing}
          ?readonly=${this.readonly || nothing}
          @change="${() => !this.readonly && this.valueChanged(event)}"
          @blur="${() => this.onBlur()}"
        />
      </div>
    `;
  }

  valueChanged(event: Event | undefined) {
    event?.stopPropagation();
    const target = event?.target as HTMLInputElement;
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: target.checked },
        bubbles: true,
        composed: true,
      }),
    );
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
