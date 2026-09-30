import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { cspStyleMap } from '@golemui/lit-utils';
import { safeDefine } from '@golemui/lit-utils';
import { classMap } from 'lit/directives/class-map.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';
import { GuiFormControl } from '../gui-form-control';
import { dispatchChange, dispatchValue, valueEvents } from '../utils/events';

/** What <gui-textarea> renders besides the control state: its presentation props. */
export type GuiTextareaProps = {
  hint?: string;
  placeholder?: string;
  autocomplete?: string;
  counterMode?: 'remaining' | 'current';
  minimumHeight?: number;
  autoGrow?: boolean;
  maxLength?: number;
};

/**
 * A multi-line text field, with an optional character counter.
 *
 * @fires gui-input - The user changed the value. `detail.value` is the new value.
 * @fires gui-change - The user committed the text, on blur or Enter. `detail.value` is the value.
 * @fires gui-blur - Focus left the control.
 */
export class GuiTextarea extends GuiFormControl {
  /** BCP 47 locale for formatting and parsing, such as `en-US` or `es`. */
  @property({ type: String, attribute: 'locale-id' }) localeId = 'en';
  /** The text. */
  @property({ type: String }) value: string | undefined = undefined;

  /** Text shown while the control is empty. */
  @property({ type: String }) placeholder: string | undefined = undefined;
  /** The `autocomplete` hint passed to the inner native control. */
  @property({ type: String }) autocomplete: string | undefined = undefined;
  /**
   * With `maxLength`, whether the counter shows the characters left (`remaining`) or used
   * (`current`).
   */
  @property({ type: String, attribute: 'counter-mode' }) counterMode:
    | 'remaining'
    | 'current'
    | undefined;
  /** Minimum height of the field, in pixels. */
  @property({ type: Number, attribute: 'minimum-height' }) minimumHeight: number | undefined =
    undefined;
  /** Grows the field with its content instead of scrolling. */
  @property({ type: Boolean, attribute: 'auto-grow' }) autoGrow: boolean | undefined = false;
  /** Maximum number of characters. */
  @property({ type: Number, attribute: 'maxlength' }) maxLength: number | undefined = undefined;

  private ariaController = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`textarea[id="${this.uid}"]`),
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

    const templateData: ControlTemplateData<string> & GuiTextareaProps = {
      uid: this.uid,
      label: this.label,
      errors: this.errors,
      touched: this.touched,
      required: this.required,
      disabled: this.disabled,
      readonly: this.readOnly,
      value: this.value,
      hint: this.hint,
      placeholder: this.placeholder,
      autocomplete: this.autocomplete,
      counterMode: this.counterMode ?? 'remaining',
      minimumHeight: this.minimumHeight ?? 120,
      autoGrow: this.autoGrow ?? false,
      maxLength: this.maxLength,
    };

    // Counter
    let counter = html``;

    if (templateData.counterMode && templateData.maxLength) {
      const counterClasses = {
        'gui-textarea--counter': true,
        [`gui-textarea--counter__error`]:
          (templateData.value?.length ?? 0) > templateData.maxLength,
      };
      const counterMode =
        templateData.counterMode === 'current'
          ? html`<span>${templateData.value?.length ?? 0}</span>`
          : html`<span>${templateData.maxLength - (templateData.value?.length ?? 0)}</span>`;

      counter = html`<div class=${classMap(counterClasses)}>
        ${counterMode}
        <span> / ${templateData.maxLength}</span>
      </div>`;
    }

    // AutoGrow
    const autoGrowStyles = {
      height: `${templateData.minimumHeight}px`,
      'min-height': `${templateData.minimumHeight}px`,
    };

    const textarea = this.querySelector(`textarea[id="${this.uid}"]`) as HTMLTextAreaElement;

    if (this.autoGrow && textarea) {
      const styles = window.getComputedStyle(textarea);
      const pTop = parseFloat(styles.paddingTop);
      const pBottom = parseFloat(styles.paddingBottom);
      const totalVerticalPadding = pTop + pBottom;

      textarea.style.height = 'auto';
      autoGrowStyles.height = `${Math.max(this.minimumHeight ?? 120, textarea.scrollHeight - totalVerticalPadding)}px`;
    }

    return html`
      ${addLabel(this.uid, templateData)}

      <div class="gui-widget">
        <textarea
          id=${this.uid}
          data-cy=${`${this.uid}_textarea`}
          class="gui-widget-input"
          style=${cspStyleMap(autoGrowStyles)}
          ?required=${templateData.required}
          ?disabled=${templateData.disabled}
          ?readonly=${templateData.readonly}
          placeholder=${templateData.placeholder || nothing}
          autocomplete=${this.autocomplete || nothing}
          .value=${live(this.value ?? '')}
          @input=${this.valueChanged}
          @change=${this.valueCommitted}
          @blur=${this.onBlur}
        ></textarea>
      </div>

      <div class="gui-textarea--validation">
        <div>${addErrors(this.uid, templateData)}</div>
        ${counter}
      </div>
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

/** The events `gui-textarea` fires, with their types. */
export const GuiTextareaEvents = {
  ...valueEvents<GuiTextarea['value']>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-textarea': GuiTextarea;
  }
}

safeDefine('gui-textarea', GuiTextarea);
