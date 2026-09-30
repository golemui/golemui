import { GUIAriaController } from '../controllers/aria.controller';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { safeDefine } from '@golemui/lit-utils';
import { addErrors, requiredMarker, type ControlTemplateData } from '../utils/templates';
import { GuiFormControl } from '../gui-form-control';
import { dispatchBlur, dispatchValue, valueEvents } from '../utils/events';
import { booleanAttribute } from '../utils/converters';

/** What <gui-checkbox> renders besides the control state: its presentation props. */
export type GuiCheckboxProps = {
  hint?: string;
  checkboxPosition?: 'left' | 'right';
};

/**
 * A checkbox. Its value is `true` or `false`.
 *
 * @fires gui-input - The user changed the value. `detail.value` is the new value.
 * @fires gui-change - The user committed the value. `detail.value` is the committed value.
 * @fires gui-blur - Focus left the control.
 */
export class GuiCheckbox extends GuiFormControl {
  /** BCP 47 locale for formatting and parsing, such as `en-US` or `es`. */
  @property({ type: String, attribute: 'locale-id' }) localeId = 'en';
  /** Whether it is checked. As an attribute, `value` checks it and `value="false"` does not. */
  @property({ converter: booleanAttribute }) value: boolean | undefined = undefined;

  /** Side of the label the checkbox is on. */
  @property({ type: String, attribute: 'checkbox-position' }) checkboxPosition:
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

    const templateData: ControlTemplateData<boolean> & GuiCheckboxProps = {
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
            id=${this.uid}
            data-cy=${`${this.uid}_checkbox`}
            .checked=${live(this.value ?? false)}
            ?required=${this.required}
            ?disabled=${this.disabled}
            @click=${this.onClick}
            @change=${this.valueChanged}
            @blur=${this.onBlur}
          />
        </div>

        <span class="gui-label__container">
          <span class="gui-label__text"
            >${templateData.label}${requiredMarker(templateData.required)}</span
          >
        </span>
      </label>

      <div class="gui-widget-hint" id=${`${templateData.uid}_hint`}>
        ${templateData.hint ?? nothing} ${addErrors(this.uid, templateData)}
      </div>
    `;
  }

  /** @internal */
  valueChanged(event: Event) {
    event.stopPropagation();

    if (!this.readOnly) {
      const target = event.target as HTMLInputElement;
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

/** The events `gui-checkbox` fires, with their types. */
export const GuiCheckboxEvents = {
  ...valueEvents<GuiCheckbox['value']>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-checkbox': GuiCheckbox;
  }
}

safeDefine('gui-checkbox', GuiCheckbox);
