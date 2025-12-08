import { customElement, property } from 'lit/decorators.js';
import { html, LitElement, nothing } from 'lit';
import * as Core from '@golemui/core';
import { consume, provide } from '@lit/context';
import * as Lit from '@golemui/lit';
import {
  createOptionMapper,
  inferOptionValue,
  isOption,
  isOptionValue,
  isProtoOption,
  OptionValue,
  RadiogroupProps,
} from '@golemui/shared-vanilla';
import { Subscription } from 'rxjs';
import { repeat } from 'lit-html/directives/repeat.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { addErrors, addLabel } from '../utils/templates';

@customElement('gui-radiogroup')
export class RadiogroupElement extends LitElement implements Core.WithField {
  field!: Core.ControlField<string>;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.controlContext })
  adapter = new Lit.ControlFieldAdapter<string, RadiogroupProps>();

  protected optionsLoading = false;
  protected hasMatchingValue = false;

  private ariaController = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`input[name="${this.field.uid}"]`),
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
    this.classList.add('gui-radiogroup');
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
      } else if (isProtoOption(opts[0], this.field.props as RadiogroupProps)) {
        const optionMapper = createOptionMapper(opts[0], this.field.props as RadiogroupProps);
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

    const options = this.optionsLoading
      ? html`<span>Loading...</span>`
      : html`
          ${repeat(
            this.adapter.templateData.options || [],
            (opt: any) => opt?.value,
            (opt: any, index) =>
              html`<label for=${`${this.field.uid}_${index}`}>
                <input
                  type="radio"
                  id=${`${this.field.uid}_${index}`}
                  name=${this.field.uid}
                  required=${this.adapter.templateData.validator?.required ? '' : nothing}
                  value=${opt.value}
                  checked=${this.hasMatchingValue && opt.value === this.adapter.templateData.value
                    ? ''
                    : nothing}
                  disabled=${this.adapter.templateData.disabled ||
                  this.adapter.templateData.readonly
                    ? ''
                    : nothing}
                  @input="${() => this.valueChanged(event)}"
                  @blur="${() => this.adapter.onBlur()}"
                />
                ${opt.label}
              </label>`,
          )}
        `;

    return html`
      ${addLabel(this.field.uid, this.adapter.templateData)}

      <div class="gui-field">${options}</div>

      ${addErrors(this.field.uid, this.adapter.templateData)}
    `;
  }

  valueChanged(event: Event | undefined) {
    if (this.adapter.templateData.readonly) {
      event?.preventDefault();
    } else {
      const target = event?.target as HTMLInputElement;
      this.adapter.valueChanged(inferOptionValue(target.value, this.adapter.templateData.options));
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
