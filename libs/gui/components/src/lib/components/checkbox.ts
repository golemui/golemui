import { GUIAriaController } from '../controllers/aria.controller';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { addErrors, type ControlTemplateData } from '../utils/templates';
import type { CheckboxProps } from '@golemui/gui-shared/internals';

@customElement('gui-checkbox')
export class GuiCheckbox extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: String, attribute: 'locale-id' }) localeId = 'en';
  @property({ type: Array }) errors: string[] | undefined = [];
  @property({ type: Boolean }) touched: boolean | undefined = undefined;
  @property({ type: Boolean }) required: boolean | undefined = undefined;
  @property({ type: Boolean }) disabled: boolean | undefined = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly: boolean | undefined = false;
  @property({ type: String }) value: boolean | undefined = undefined;

  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: String }) checkboxPosition: 'left' | 'right' | undefined = 'left';

  private ariaController = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`input[id="${this.uid}"]`),
    getState: () => ({
      uid: this.uid as string,
      templateData: {
        hint: this.hint,
        errors: this.errors,
        touched: this.touched,
        // Checkboxes can't have aria-readonly
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

    const templateData: ControlTemplateData<boolean> & CheckboxProps = {
      uid: this.uid,
      label: this.label,
      hint: this.hint,
      errors: this.errors,
      touched: this.touched,
      required: this.required,
      disabled: this.disabled,
      readonly: this.readOnly,
      value: this.value,
      checkboxPosition: this.checkboxPosition,
    };

    if (templateData.checkboxPosition === 'right') {
      this.classList.add('gui-checkbox--right');
    } else if (this.classList.contains('gui-checkbox--right')) {
      this.classList.remove('gui-checkbox--right');
    }

    return html`
      <label
        class="gui-label"
        for=${this.uid}
        data-cy=${`${this.uid}_label`}
        id=${`${this.uid}_label`}
      >
        <div class="gui-widget gui-widget--horizontal">
          <input
            type="checkbox"
            tabindex="0"
            id=${this.uid}
            data-cy=${`${this.uid}_checkbox`}
            ?checked=${this.value}
            ?required=${this.required}
            ?disabled=${this.disabled || this.readOnly}
            @change=${this.valueChanged}
            @blur=${this.onBlur}
          />
        </div>

        <span class="gui-label__container">
          ${templateData.label + (templateData.required ? ' *' : '')}
        </span>
      </label>

      <div class="gui-widget-hint" id=${`${templateData.uid}_hint`}>
        ${templateData.hint ?? nothing} ${addErrors(this.uid as string, templateData)}
      </div>
    `;
  }

  valueChanged(event: Event) {
    event.stopPropagation();

    if (!this.readOnly) {
      const target = event.target as HTMLInputElement;
      this.dispatchEvent(
        new CustomEvent('change', {
          detail: { value: target.checked },
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
    'gui-checkbox': GuiCheckbox;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('gui-checkbox')) {
  customElements.define('gui-checkbox', GuiCheckbox);
}
