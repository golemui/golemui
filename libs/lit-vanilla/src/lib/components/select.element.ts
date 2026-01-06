import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import {
  createOptionMapper,
  GUIAriaController,
  inferOptionValue,
  isOption,
  isOptionValue,
  isProtoOption,
  OptionValue,
  SelectProps,
} from '@golemui/shared-vanilla';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { repeat } from 'lit-html/directives/repeat.js';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { Subscription } from 'rxjs';
import { addErrors, addIcon, addLabel } from '../utils/templates';

@customElement('gui-select')
export class SelectElement extends LitElement implements Core.WithField {
  field!: Core.ControlField<string>;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.controlContext })
  adapter = new Lit.ControlFieldAdapter<string, SelectProps>();

  protected optionsLoading = false;
  protected hasMatchingValue = false;

  private ariaController = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`select[id="${this.field.uid}"]`),
    getState: () => ({
      uid: this.field.uid,
      templateData: this.adapter.templateData,
    }),
  });

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-select');
    this.adapter.context = this.formContext;
    this.adapter.init(this.field);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  private updateOptions() {
    const opts = this.adapter.templateData.options;
    if (Array.isArray(opts) && opts.length > 0) {
      if (isOption(opts[0])) {
        // nothing to do
      } else if (isOptionValue(opts[0])) {
        this.adapter.templateData = {
          ...this.adapter.templateData,
          options: (this.adapter.templateData.options as unknown as OptionValue[]).map((opt) => ({
            label: opt.toString(),
            value: opt,
          })),
        };
      } else if (isProtoOption(opts[0], this.field.props as SelectProps)) {
        const optionMapper = createOptionMapper(opts[0], this.field.props as SelectProps);
        this.adapter.templateData = {
          ...this.adapter.templateData,
          options: this.adapter.templateData.options.map(optionMapper),
        };
      } else {
        throw new Error('Invalid option shape');
      }
      const selection = this.adapter.templateData.value;
      this.hasMatchingValue =
        this.adapter.templateData.options.find(({ value }) => value === selection) !== undefined;
    }
  }

  override render() {
    super.render();

    this.updateOptions();

    // Icon
    const selectIcon = addIcon('select', this.adapter.templateData);

    const options = this.optionsLoading
      ? html`<option disabled selected>Loading...</option>`
      : html`
          <option value="" disabled selected=${this.hasMatchingValue ? nothing : ''}>
            ${this.adapter.templateData.placeholder ?? 'Select an option'}
          </option>
          ${repeat(
            this.adapter.templateData.options || [],
            (opt: any) => opt?.value,
            (opt: any) =>
              html`<option
                value=${opt.value}
                selected=${this.hasMatchingValue && opt.value === this.adapter.templateData.value
                  ? ''
                  : nothing}
              >
                ${opt.label}
              </option>`,
          )}
        `;

    return html`
      ${addLabel(this.field.uid, this.adapter.templateData)}

      <div class="gui-field">
        <select
          type="text"
          id=${this.field.uid}
          data-cy=${`${this.field.uid}_select`}
          class=${classMap(selectIcon.fieldClasses)}
          required=${this.adapter.templateData.validator?.required ? '' : nothing}
          .value=${this.adapter.templateData.value ?? ''}
          ?disabled=${this.adapter.templateData.disabled ||
          this.adapter.templateData.readonly ||
          nothing}
          @input="${() => this.valueChanged(event as Event)}"
          @blur="${() => this.adapter.onBlur()}"
        >
          ${options}
        </select>
        ${selectIcon.html}
      </div>

      ${addErrors(this.field.uid, this.adapter.templateData)}
    `;
  }

  valueChanged(event: Event) {
    if (this.adapter.templateData.readonly) {
      event.preventDefault();
    } else {
      const target = event.target as HTMLSelectElement;
      this.adapter.valueChanged(inferOptionValue(target.value, this.adapter.templateData.options));
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
