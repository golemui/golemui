import { GUIAriaController } from '../controllers/aria.controller';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { safeDefine } from '@golemui/lit-utils';
import { addErrors, requiredMarker, type ControlTemplateData } from '../utils/templates';
import { GuiFormControl } from '../gui-form-control';
import { dispatchBlur, dispatchValue, valueEvents } from '../utils/events';
import { booleanAttribute } from '../utils/converters';

/** What <gui-toggle> renders besides the control state: its presentation props. */
export type GuiToggleProps = {
  hint?: string;
  togglePosition?: 'left' | 'right';
};

/**
 * An on/off switch. Its value is `true` or `false`.
 *
 * @fires gui-input - The user changed the value. `detail.value` is the new value.
 * @fires gui-change - The user committed the value. `detail.value` is the committed value.
 * @fires gui-blur - Focus left the control.
 * @cssprop --gui-toggle-width - Width of the switch.
 * @cssprop --gui-toggle-height - Height of the switch.
 * @cssprop --gui-toggle-slider-width - Width of the knob.
 * @cssprop --gui-toggle-slider-height - Height of the knob.
 * @cssprop --gui-toggle-slider-transform - Distance the knob moves when on.
 */
export class GuiToggle extends GuiFormControl {
  /** BCP 47 locale for formatting and parsing, such as `en-US` or `es`. */
  @property({ type: String, attribute: 'locale-id' }) localeId = 'en';
  /** Whether it is on. As an attribute, `value` turns it on and `value="false"` does not. */
  @property({ converter: booleanAttribute }) value: boolean | undefined = undefined;

  /** Side of the label the switch is on. */
  @property({ type: String, attribute: 'toggle-position' }) togglePosition:
    | 'left'
    | 'right'
    | undefined = 'left';

  private ariaController = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`input[id="${this.uid}"]`),
    getState: () => ({
      uid: this.uid,
      templateData: {
        hint: this.hint,
        errors: this.errors,
        touched: this.touched,
        readonly: this.readOnly,
        disabled: false,
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

    const templateData: ControlTemplateData<boolean> & GuiToggleProps = {
      uid: this.uid,
      label: this.label,
      hint: this.hint,
      errors: this.errors,
      touched: this.touched,
      required: this.required,
      disabled: this.disabled,
      readonly: this.readOnly,
      value: this.value,
      togglePosition: this.togglePosition,
    };

    if (templateData.togglePosition === 'right') {
      this.classList.add('gui-toggle--right');
    } else if (this.classList.contains('gui-toggle--right')) {
      this.classList.remove('gui-toggle--right');
    }

    // The hint and the errors share the third row of a grid cell. The hint's id is on its text
    // alone, so `aria-describedby` doesn't read the errors as the description.
    return html`
      <label
        class="gui-label"
        for=${this.uid}
        data-cy=${`${this.uid}_label`}
        id=${`${this.uid}_label`}
      >
        <div class="gui-widget gui-widget--horizontal gui-toggle--switch">
          <input
            type="checkbox"
            role="switch"
            id=${this.uid}
            data-cy=${`${this.uid}_toggle`}
            .checked=${live(templateData.value ?? false)}
            ?disabled=${templateData.disabled}
            @click=${this.onClick}
            @change=${this.valueChanged}
            @blur=${this.onBlur}
          />

          <span class="gui-toggle--slider" role="presentation"></span>
        </div>

        <span class="gui-label__container">
          <span class="gui-label__text"
            >${templateData.label}${requiredMarker(templateData.required)}</span
          >
        </span>
      </label>

      <div class="gui-widget-hint">
        ${templateData.hint
          ? html`<span id=${`${templateData.uid}_hint`}>${templateData.hint}</span>`
          : nothing}
        ${addErrors(this.uid, templateData)}
      </div>
    `;
  }

  /** @internal */
  valueChanged(event: Event | undefined) {
    event?.stopPropagation();

    if (!this.readOnly) {
      const target = event?.target as HTMLInputElement;
      this.value = target.checked;
      dispatchValue(this, this.value);
    }
  }

  /**
   * A read-only control stays focusable, so its click is cancelled instead: the browser then
   * restores the checked state and fires no `change`.
   *
   * @internal
   */
  onClick(event: Event) {
    if (this.readOnly) event.preventDefault();
  }

  /** @internal */
  onBlur() {
    dispatchBlur(this);
  }
}

/** The events `gui-toggle` fires, with their types. */
export const GuiToggleEvents = {
  ...valueEvents<GuiToggle['value']>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-toggle': GuiToggle;
  }
}

safeDefine('gui-toggle', GuiToggle);
