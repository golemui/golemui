import { html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { property } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { safeDefine } from '@golemui/lit-utils';
import { GUIAriaController } from '../controllers/aria.controller';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';
import { message } from '../utils/messages';
import { inferOptionValue, isOptionValueOf, updateOptions } from './one-of';
import type { Option, OptionInput, OptionValue } from '../types';
import { GuiFormControl } from '../gui-form-control';
import { dispatchBlur, dispatchValue, valueEvents } from '../utils/events';

/** What <gui-checkbox-group> renders besides the control state: its presentation props. */
export type GuiCheckboxGroupProps = {
  hint?: string;
  options?: Option[];
  labelField?: string;
  valueField?: string;
  direction?: 'row' | 'column';
};

/**
 * A group of checkboxes to pick any number of options. Its value is the list of the checked
 * options' values, in the options' order, whatever order the user checks them in.
 *
 * ```html
 * <gui-checkbox-group label="Toppings" name="toppings" direction="row"></gui-checkbox-group>
 * ```
 *
 * The checkboxes are native, in a group named by the label. A `required` group needs at least one
 * checked: its name says so to screen readers, since a group has no required state of its own. A
 * value that matches no option is kept, after the options' values, and checks nothing.
 *
 * Its look comes from the `--gui-checkbox-*` tokens it shares with `gui-checkbox`, so one
 * setting styles both: `--gui-checkbox-size`, `--gui-checkbox-radius`, `--gui-checkbox-bg`,
 * `--gui-checkbox-border`, `--gui-checkbox-tick` and `--gui-checkbox-gap`, the space between the
 * box and its text.
 *
 * @fires gui-input - The user checked or unchecked an option. `detail.value` is the new value.
 * @fires gui-change - The user committed the value. `detail.value` is the committed value.
 * @fires gui-blur - Focus left the group.
 */
export class GuiCheckboxGroup extends GuiFormControl {
  /** BCP 47 locale for formatting and parsing, such as `en-US` or `es`. */
  @property({ type: String, attribute: 'locale-id' }) localeId = 'en';
  /** The values of the checked options, in the options' order. */
  @property({ type: Array }) values: OptionValue[] | undefined = undefined;

  /**
   * The options: values, which are both the text and the value, `{ label, value }` objects, or
   * any objects read through `label-field` and `value-field`.
   */
  @property({ type: Array }) options: OptionInput[] = [];
  /** For options given as objects, the key of the text to show. */
  @property({ type: String, attribute: 'label-field' }) labelField: string | undefined = undefined;
  /** For options given as objects, the key of the value. */
  @property({ type: String, attribute: 'value-field' }) valueField: string | undefined = undefined;
  /** Lays the options out in a row or a column. */
  @property({ type: String }) direction: 'row' | 'column' | undefined = 'column';

  /** `values`, under the name every form control takes its value by. */
  get value(): OptionValue[] | undefined {
    return this.values;
  }

  set value(values: OptionValue[] | undefined) {
    this.values = values;
  }

  /** `options` as `{ label, value }` objects, refreshed on every render. */
  protected normalizedOptions: Option[] = [];

  private ariaController = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`input[data-group="${this.domId}"]`),
    getState: () => ({
      domId: this.domId,
      templateData: {
        hint: this.hint,
        errors: this.errors,
        touched: this.touched,
        // On a checkbox, aria-required would mean that box must be checked: the group's name says
        // the group is required instead.
        readonly: this.readOnly,
        disabled: false,
        required: false,
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

  protected override get controlValue(): unknown {
    return this.values;
  }

  protected override set controlValue(values: unknown) {
    this.values = values as OptionValue[] | undefined;
  }

  /** Whether an option's value is among the checked ones. */
  private isChecked(value: OptionValue): boolean {
    return (this.values ?? []).some((checked) => isOptionValueOf(value, checked));
  }

  override render() {
    super.render();

    const templateData: ControlTemplateData<OptionValue[]> & GuiCheckboxGroupProps = {
      label: this.label,
      errors: this.errors,
      touched: this.touched,
      required: this.required,
      disabled: this.disabled,
      readonly: this.readOnly,
      value: this.values,
      hint: this.hint,
      labelField: this.labelField,
      valueField: this.valueField,
      direction: this.direction,
    };

    this.normalizedOptions = updateOptions(this.options ?? [], {
      labelField: this.labelField,
      valueField: this.valueField,
    });
    templateData.options = this.normalizedOptions;

    const labelledBy = [
      templateData.label ? `${this.domId}_label` : '',
      this.required ? `${this.domId}_required` : '',
    ]
      .filter(Boolean)
      .join(' ');

    return html`
      ${addLabel(this, templateData, false, undefined, false)}

      <div
        class="gui-widget${this.direction === 'row' ? ' gui-widget--horizontal' : ''}"
        role="group"
        id=${this.domId}
        aria-labelledby=${labelledBy || nothing}
        aria-describedby=${templateData.hint ? `${this.domId}_hint` : nothing}
        @focusout=${this.onFocusOut}
      >
        ${this.required
          ? html`<span class="gui-visually-hidden" id=${`${this.domId}_required`}
              >${message('requiredGroup')}</span
            >`
          : nothing}
        ${repeat(
          this.normalizedOptions,
          (option) => option.value,
          // The checkboxes point at a form that does not exist to stay out of the page's form:
          // the element submits the value itself.
          (option, index) =>
            html`<label for=${`${this.domId}_${index}`}>
              <input
                type="checkbox"
                id=${`${this.domId}_${index}`}
                data-cy=${`${this.uid}_checkbox_${index}`}
                data-group=${this.domId}
                form=${`${this.domId}_none`}
                value=${String(option.value)}
                .checked=${live(this.isChecked(option.value))}
                ?disabled=${templateData.disabled}
                @click=${this.onClick}
                @change=${this.valueChanged}
              />
              ${option.label}
            </label>`,
        )}
      </div>

      ${addErrors(this, templateData)}
    `;
  }

  /**
   * A checkbox changed: the value is every checked option, in the options' order, then the values
   * that match no option, which the user can't see or change.
   *
   * @internal
   */
  valueChanged(event: Event) {
    event.stopPropagation();
    if (this.readOnly) return;

    const target = event.target as HTMLInputElement;
    const toggled = inferOptionValue(target.value, this.normalizedOptions);
    const checked = this.normalizedOptions
      .map((option) => option.value)
      .filter((value) =>
        isOptionValueOf(value, toggled) ? target.checked : this.isChecked(value),
      );
    const unknown = (this.values ?? []).filter(
      (value) => !this.normalizedOptions.some((option) => isOptionValueOf(option.value, value)),
    );
    this.values = [...checked, ...unknown];
    dispatchValue(this, this.values);
  }

  /**
   * A read-only group stays focusable, so the click that would toggle a checkbox is cancelled
   * instead: the browser then restores it and fires no `change`.
   *
   * @internal
   */
  onClick(event: Event) {
    if (this.readOnly) event.preventDefault();
  }

  /**
   * Tab moves focus from one checkbox to the next: only focus that leaves the group is a blur.
   *
   * @internal
   */
  onFocusOut(event: FocusEvent) {
    if (event.relatedTarget instanceof Node && this.contains(event.relatedTarget)) return;
    dispatchBlur(this);
  }
}

/** The events `gui-checkbox-group` fires, with their types. */
export const GuiCheckboxGroupEvents = {
  ...valueEvents<GuiCheckboxGroup['values']>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-checkbox-group': GuiCheckboxGroup;
  }
}

safeDefine('gui-checkbox-group', GuiCheckboxGroup);
