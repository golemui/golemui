import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { NumberinputProps } from '@golemui/shared-vanilla';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { Subscription } from 'rxjs';
import { addErrors, addLabel } from '../utils/templates';

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

    const numberClasses = {
      'gui-field-icon': true,
      'gui-field-icon--right': this.adapter.templateData.iconPosition === 'right',
      [this.adapter.templateData.icon as string]: true,
    };

    return html`
      ${addLabel(this.field.uid, this.adapter.templateData)}

      <div class="gui-field">
        <gui-number-control
          .uid=${this.field.uid}
          .hint=${this.adapter.templateData.hint}
          ?touched=${this.adapter.templateData.touched}
          .errors=${this.adapter.templateData.errors}
          ?disabled=${this.adapter.templateData.disabled || nothing}
          ?readonly=${this.adapter.templateData.readonly || nothing}
          .value=${this.adapter.templateData.value ?? ''}
          .step=${typeof this.adapter.templateData.step === 'number'
            ? this.adapter.templateData.step
            : nothing}
          .icon=${this.adapter.templateData.icon}
          .iconPosition=${this.adapter.templateData.iconPosition}
          .placeholder=${this.adapter.templateData.placeholder || nothing}
          @input="${() => this.valueChanged(event)}"
          @blur="${() => this.adapter.onBlur()}"
        ></gui-number-control>
        ${this.adapter.templateData.icon
          ? html`<div class=${classMap(numberClasses)}></div>`
          : nothing}
      </div>

      ${addErrors(this.field.uid, this.adapter.templateData)}
    `;
  }

  valueChanged(event: Event | undefined) {
    const value = (event as CustomEvent).detail.value;
    this.adapter.valueChanged(value);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
