import { customElement, property } from 'lit/decorators.js';
import { html, LitElement, nothing } from 'lit';
import * as Core from '@golemui/core';
import { consume, provide } from '@lit/context';
import * as Lit from '@golemui/lit';
import { createOptionMapper, isOption, isProtoOption, SelectProps } from '@golemui/shared-vanilla';
import { Subscription } from 'rxjs';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit-html/directives/repeat.js';

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
      } else if (Core.isLiteral(opts[0])) {
        this.adapter.templateData = {
          ...this.adapter.templateData,
          options: (this.adapter.templateData.options as unknown as Core.LiteralValue[]).map(
            (opt) => ({
              label: opt.toString(),
              value: opt,
            }),
          ),
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

    // Hint
    const hint = this.adapter.templateData.hint
      ? html`<div class="gui-field-hint" id=${`${this.field.uid}_hint`}>
          ${this.adapter.templateData.hint}
        </div>`
      : html``;

    // Icon
    const selectIcon: { [key: string]: boolean } = {
      'gui-select--icon': false,
      'gui-select--icon-right': false,
    };
    let icon;
    if (this.adapter.templateData.icon) {
      selectIcon['gui-select--icon'] = true;
      selectIcon['gui-select--icon-right'] = this.adapter.templateData.iconPosition === 'right';

      const classes = {
        'gui-field-icon': true,
        'gui-field-icon--right': this.adapter.templateData.iconPosition === 'right',
        [this.adapter.templateData.icon]: true,
      };
      icon = html`<span class=${classMap(classes)}></span>`;
    } else {
      icon = html``;
    }

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

    const showErrors =
      this.adapter.templateData.touched &&
      this.adapter.templateData.errors &&
      this.adapter.templateData.errors.length > 0;

    return html`
      <label for=${this.field.uid}>
        ${this.adapter.templateData.label +
        (this.adapter.templateData.validator?.required ? ' *' : '')}
        ${hint}
      </label>

      <div class="gui-field">
        <select
          type="text"
          id=${this.field.uid}
          class=${classMap(selectIcon)}
          .value=${this.adapter.templateData.value ?? ''}
          ?disabled=${this.adapter.templateData.disabled || nothing}
          ?readonly=${this.adapter.templateData.readonly || nothing}
          @input="${() => this.valueChanged(event as Event)}"
          @blur="${() => this.adapter.onBlur()}"
          aria-invalid=${showErrors || nothing}
          aria-errormessage=${`${this.field.uid}-error`}
          aria-required=${this.adapter.templateData.validator?.required || nothing}
          aria-describedby=${this.adapter.templateData.hint ? `${this.field.uid}_hint` : nothing}
        >
          ${options}
        </select>
        ${icon}
      </div>

      ${showErrors
        ? html`<ul class="gui-validator">
            ${this.adapter.templateData.errors?.map(
              (error: any) =>
                html`<li class="gui-validator__error" role="status" id=${`${this.field.uid}-error`}>
                  ${error}
                </li>`,
            )}
          </ul>`
        : ''}
    `;
  }

  valueChanged(event: Event) {
    if (this.adapter.templateData.readonly) {
      event.preventDefault();
    } else {
      const target = event.target as HTMLSelectElement;
      this.adapter.valueChanged(target.value);
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
