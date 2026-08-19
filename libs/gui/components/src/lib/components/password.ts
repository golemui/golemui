import { html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { safeDefine } from '@golemui/lit/internals';
import { classMap } from 'lit/directives/class-map.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { addErrors, addIcon, addLabel, type ControlTemplateData } from '../utils/templates';
import type { PasswordProps } from '@golemui/gui-shared/internals';

export class GuiPassword extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: String, attribute: 'locale-id' }) localeId = 'en';
  @property({ type: Array }) errors: string[] | undefined = [];
  @property({ type: Boolean }) touched: boolean | undefined = false;
  @property({ type: Boolean }) required: boolean | undefined = false;
  @property({ type: Boolean }) disabled: boolean | undefined = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly: boolean | undefined = false;
  @property({ type: String }) value: string | undefined = undefined;

  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: String }) icon: string | undefined = undefined;
  @property({ type: String }) placeholder: string | undefined = undefined;
  @property({ type: String }) autocomplete: string | undefined = undefined;
  @property({ type: String }) showPasswordIcon: string | undefined = undefined;
  @property({ type: String }) hidePasswordIcon: string | undefined = undefined;
  @property({ type: String }) showPasswordLabel: string | undefined = undefined;
  @property({ type: String }) hidePasswordLabel: string | undefined = undefined;

  @state() showPassword = false;

  private ariaController = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`input[id="${this.uid}"]`),
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

    const templateData: ControlTemplateData<string> & PasswordProps = {
      uid: this.uid,
      label: this.label,
      hint: this.hint,
      errors: this.errors,
      touched: this.touched,
      required: this.required,
      disabled: this.disabled,
      readonly: this.readOnly,
      value: this.value,
      icon: this.icon,
      placeholder: this.placeholder,
      autocomplete: this.autocomplete,
      showPasswordIcon: this.showPasswordIcon,
      hidePasswordIcon: this.hidePasswordIcon,
      showPasswordLabel: this.showPasswordLabel,
      hidePasswordLabel: this.hidePasswordLabel,
    };

    // Icon
    const passwordIcon = addIcon('password', templateData);

    const fieldClasses: { [key: string]: boolean } = {
      'gui-widget-input': true,
      [`gui-password--icon`]: !!this.icon,
    };

    return html`
      ${addLabel(this.uid as string, templateData)}

      <div class="gui-widget">
        <input
          type=${this.showPassword ? 'text' : 'password'}
          id=${this.uid}
          data-cy=${`${this.uid}_password`}
          class=${classMap(fieldClasses)}
          .value=${live(this.value ?? '')}
          ?required=${this.required}
          ?disabled=${this.disabled}
          ?readonly=${this.readOnly}
          placeholder=${this.placeholder || nothing}
          autocomplete=${this.autocomplete || nothing}
          @input=${this.valueChanged}
          @blur=${this.onBlur}
        />
        ${passwordIcon.html}
        <button
          class=${`gui-password__toggle gui-widget-icon ${this.showPassword && templateData.showPasswordIcon ? templateData.showPasswordIcon : ''} ${!this.showPassword && templateData.hidePasswordIcon ? templateData.hidePasswordIcon : ''}`}
          data-icon=${this.showPassword
            ? templateData.showPasswordIcon
            : templateData.hidePasswordIcon}
          type="button"
          ?disabled=${this.disabled}
          aria-label=${!this.showPassword
            ? (templateData.showPasswordLabel ?? 'Show password')
            : (templateData.hidePasswordLabel ?? 'Hide password')}
          @click=${() => (this.showPassword = !this.showPassword)}
        >
          ${templateData.showPasswordIcon || templateData.hidePasswordIcon
            ? nothing
            : html`<span aria-hidden="true"
                >${!this.showPassword
                  ? (templateData.showPasswordLabel ?? 'Show')
                  : (templateData.hidePasswordLabel ?? 'Hide')}</span
              >`}
        </button>
      </div>

      ${addErrors(this.uid as string, templateData)}
    `;
  }

  valueChanged(event: InputEvent) {
    event.stopPropagation();

    if (!this.readOnly) {
      const target = event.target as HTMLInputElement;
      this.dispatchEvent(
        new CustomEvent('input', {
          detail: { value: target.value },
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
    'gui-password': GuiPassword;
  }
}

safeDefine('gui-password', GuiPassword);
