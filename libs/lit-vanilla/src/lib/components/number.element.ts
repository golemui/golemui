import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { NumberinputProps } from '@golemui/shared-vanilla';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { Subscription } from 'rxjs';

@customElement('gui-number')
export class NumberElement extends LitElement implements Core.WithField {
  field!: Core.ControlField<number>;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.controlContext })
  adapter = new Lit.ControlFieldAdapter<number, NumberinputProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-number');
    this.adapter.context = this.formContext;
    this.adapter.init(this.field);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    super.render();

    // Hint
    const hint = this.adapter.templateData.hint
      ? html`<div class="gui-field-hint" id=${`${this.field.uid}_hint`}>
          ${this.adapter.templateData.hint}
        </div>`
      : html``;

    // Icon
    const numberIcon: { [key: string]: boolean } = {
      'gui-number--icon': false,
      'gui-number--icon-right': false,
    };
    let icon;
    if (this.adapter.templateData.icon) {
      numberIcon['gui-number--icon'] = true;
      numberIcon['gui-number--icon-right'] = this.adapter.templateData.iconPosition === 'right';

      const classes = {
        'gui-field-icon': true,
        'gui-field-icon--right': this.adapter.templateData.iconPosition === 'right',
        [this.adapter.templateData.icon]: true,
      };
      icon = html`<span class=${classMap(classes)}></span>`;
    } else {
      icon = html``;
    }

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
        <input
          type="number"
          inputmode="numeric"
          id=${this.field.uid}
          class=${classMap(numberIcon)}
          value=${this.adapter.templateData.value ?? ''}
          ?disabled=${this.adapter.templateData.disabled || nothing}
          ?readonly=${this.adapter.templateData.readonly || nothing}
          min=${typeof this.adapter.templateData.min === 'number'
            ? this.adapter.templateData.min
            : nothing}
          max=${typeof this.adapter.templateData.max === 'number'
            ? this.adapter.templateData.max
            : nothing}
          step=${typeof this.adapter.templateData.step === 'number'
            ? this.adapter.templateData.step
            : nothing}
          placeholder=${this.adapter.templateData.placeholder || nothing}
          @input="${() => this.valueChanged(event)}"
          @blur="${() => this.adapter.onBlur()}"
          aria-invalid=${showErrors || nothing}
          aria-errormessage=${`${this.field.uid}-error`}
          aria-required=${this.adapter.templateData.validator?.required || nothing}
          aria-describedby=${this.adapter.templateData.hint ? `${this.field.uid}_hint` : nothing}
        />
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

  valueChanged(event: Event | undefined) {
    const target = event?.target as HTMLInputElement;
    this.adapter.valueChanged(target.valueAsNumber);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
