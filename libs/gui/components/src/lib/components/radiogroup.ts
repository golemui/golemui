import { html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { property } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { safeDefine } from '@golemui/lit-utils';
import { GUIAriaController } from '../controllers/aria.controller';
import { addErrors, addLabel, type ControlTemplateData, showsErrors } from '../utils/templates';
import { inferOptionValue, updateOptions } from './one-of';
import type { Option, OptionValue } from '../types';
import { GuiFormControl } from '../gui-form-control';
import { dispatchBlur, dispatchValue, valueEvents } from '../utils/events';

/** What <gui-radiogroup> renders besides the control state: its presentation props. */
export type GuiRadiogroupProps = {
  hint?: string;
  options?: Option[];
  labelField?: string;
  valueField?: string;
  direction?: 'row' | 'column';
};

/**
 * A group of radio buttons to pick one option.
 *
 * @fires gui-input - The user changed the value. `detail.value` is the new value.
 * @fires gui-change - The user committed the value. `detail.value` is the committed value.
 * @fires gui-blur - Focus left the control.
 */
export class GuiRadiogroup extends GuiFormControl {
  /** BCP 47 locale for formatting and parsing, such as `en-US` or `es`. */
  @property({ type: String, attribute: 'locale-id' }) localeId = 'en';
  /** The value of the selected option. */
  @property({ type: String }) value: OptionValue | undefined = undefined;

  /** The options, as values or `{ label, value }` objects. */
  @property({ type: Array }) options: Option[] = [];
  /** For options given as objects, the key of the text to show. */
  @property({ type: String, attribute: 'label-field' }) labelField: string | undefined = undefined;
  /** For options given as objects, the key of the value. */
  @property({ type: String, attribute: 'value-field' }) valueField: string | undefined = undefined;
  /** Lays the options out in a row or a column. */
  @property({ type: String }) direction: 'row' | 'column' | undefined = 'column';

  protected optionsLoading = false;
  protected hasMatchingValue = false;

  private ariaController = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`input[name="${this.uid}"]`),
    getState: () => ({
      uid: this.uid,
      templateData: {
        hint: this.hint,
        errors: this.errors,
        touched: this.touched,
        // Radios can't carry aria-readonly: the group does
        readonly: false,
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

    const templateData: ControlTemplateData<OptionValue> & GuiRadiogroupProps = {
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
    });
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
              // The radios share a name to form one group, and point at a form that does not
              // exist to stay out of the page's form: the element submits the value itself.
              return html`<label for=${`${this.uid}_${index}`}>
                <input
                  type="radio"
                  tabindex=${focusable ? '0' : '-1'}
                  id=${`${this.uid}_${index}`}
                  data-cy=${`${this.uid}_radiogroup_${index}`}
                  name=${this.uid}
                  form=${`${this.uid}_none`}
                  value=${opt.value}
                  .checked=${live(isChecked)}
                  ?required=${templateData.required}
                  ?disabled=${templateData.disabled}
                  @click=${this.onClick}
                  @keydown=${this.onKeydown}
                  @change=${this.valueChanged}
                  @blur=${this.onBlur}
                />
                ${opt.label}
              </label>`;
            },
          )}
        `;

    return html`
      ${addLabel(this.uid, templateData, false, undefined, false)}

      <div
        class="gui-widget${this.direction === 'row' ? ' gui-widget--horizontal' : ''}"
        role="radiogroup"
        id=${this.uid}
        aria-labelledby=${templateData.label ? `${this.uid}_label` : nothing}
        aria-describedby=${templateData.hint ? `${this.uid}_hint` : nothing}
        aria-required=${this.required ? 'true' : nothing}
        aria-readonly=${this.readOnly ? 'true' : nothing}
        aria-invalid=${showsErrors(this.touched, this.errors) ? 'true' : nothing}
        aria-errormessage=${showsErrors(this.touched, this.errors) ? `${this.uid}_errors` : nothing}
      >
        ${options}
      </div>

      ${addErrors(this.uid, templateData)}
    `;
  }

  /** @internal */
  valueChanged(event: Event) {
    event.stopPropagation();

    if (!this.readOnly) {
      const target = event.target as HTMLInputElement;
      this.value = inferOptionValue(target.value, this.options);
      dispatchValue(this, this.value);
    }
  }

  /**
   * A read-only group stays focusable, so the click that would check a radio is cancelled
   * instead: the browser then restores the checked radio and fires no `change`.
   *
   * @internal
   */
  onClick(event: Event) {
    if (this.readOnly) event.preventDefault();
  }

  /**
   * The arrow keys check the next radio as they move to it, and Space checks the focused one:
   * a read-only group ignores them.
   *
   * @internal
   */
  onKeydown(event: KeyboardEvent) {
    if (this.readOnly && (event.key.startsWith('Arrow') || event.key === ' ')) {
      event.preventDefault();
    }
  }

  /** @internal */
  onBlur() {
    dispatchBlur(this);
  }
}

/** The events `gui-radiogroup` fires, with their types. */
export const GuiRadiogroupEvents = {
  ...valueEvents<GuiRadiogroup['value']>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-radiogroup': GuiRadiogroup;
  }
}

safeDefine('gui-radiogroup', GuiRadiogroup);
