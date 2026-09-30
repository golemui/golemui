import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { safeDefine } from '@golemui/lit-utils';
import { classMap } from 'lit/directives/class-map.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { addErrors, addIcon, addLabel, type ControlTemplateData } from '../utils/templates';
import { GuiFormControl } from '../gui-form-control';
import { dispatchChange, dispatchValue, valueEvents } from '../utils/events';
import { message } from '../utils/messages';

/** What <gui-password> renders besides the control state: its presentation props. */
export type GuiPasswordProps = {
  hint?: string;
  icon?: string;
  placeholder?: string;
  autocomplete?: string;
  showPasswordIcon?: string;
  hidePasswordIcon?: string;
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
};

/**
 * A password field with a button that shows or hides the password.
 *
 * @fires gui-input - The user changed the value. `detail.value` is the new value.
 * @fires gui-change - The user committed the text, on blur or Enter. `detail.value` is the value.
 * @fires gui-blur - Focus left the control.
 */
export class GuiPassword extends GuiFormControl {
  /** BCP 47 locale for formatting and parsing, such as `en-US` or `es`. */
  @property({ type: String, attribute: 'locale-id' }) localeId = 'en';
  /** The password. */
  @property({ type: String }) value: string | undefined = undefined;

  /** Icon class name shown inside the control, for example from an icon font. */
  @property({ type: String }) icon: string | undefined = undefined;
  /** Text shown while the control is empty. */
  @property({ type: String }) placeholder: string | undefined = undefined;
  /** The `autocomplete` hint passed to the inner native control. */
  @property({ type: String }) autocomplete: string | undefined = undefined;
  /** Icon class name of the button while it would show the password. */
  @property({ type: String, attribute: 'show-password-icon' }) showPasswordIcon:
    | string
    | undefined = undefined;
  /** Icon class name of the button while it would hide the password. */
  @property({ type: String, attribute: 'hide-password-icon' }) hidePasswordIcon:
    | string
    | undefined = undefined;
  /** Accessible name of the button that shows the password. */
  @property({ type: String, attribute: 'show-password-label' }) showPasswordLabel:
    | string
    | undefined = undefined;
  /** Accessible name of the button that hides the password. */
  @property({ type: String, attribute: 'hide-password-label' }) hidePasswordLabel:
    | string
    | undefined = undefined;

  /** @internal */
  @state() showPassword = false;

  private ariaController = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`input[id="${this.uid}"]`),
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

    const templateData: ControlTemplateData<string> & GuiPasswordProps = {
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
      ${addLabel(this.uid, templateData)}

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
          @change=${this.valueCommitted}
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
            ? message('showPassword', templateData.showPasswordLabel)
            : message('hidePassword', templateData.hidePasswordLabel)}
          @click=${() => (this.showPassword = !this.showPassword)}
        >
          ${templateData.showPasswordIcon || templateData.hidePasswordIcon
            ? nothing
            : html`<span aria-hidden="true"
                >${!this.showPassword
                  ? message('show', templateData.showPasswordLabel)
                  : message('hide', templateData.hidePasswordLabel)}</span
              >`}
        </button>
      </div>

      ${addErrors(this.uid, templateData)}
    `;
  }

  /** @internal */
  valueChanged(event: InputEvent) {
    event.stopPropagation();

    if (!this.readOnly) {
      const target = event.target as HTMLInputElement;
      this.value = target.value;
      dispatchValue(this, this.value, { commit: false });
    }
  }

  /**
   * The native `change`: the user committed the edit (blur or Enter).
   *
   * @internal
   */
  valueCommitted(event: Event) {
    dispatchChange(this, (event.target as HTMLInputElement).value);
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

/** The events `gui-password` fires, with their types. */
export const GuiPasswordEvents = {
  ...valueEvents<GuiPassword['value']>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-password': GuiPassword;
  }
}

safeDefine('gui-password', GuiPassword);
