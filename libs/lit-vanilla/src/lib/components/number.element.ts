import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { NumberinputProps } from '@golemui/shared-vanilla';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Subscription } from 'rxjs';

@customElement('gui-number-control')
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

    return html`
      <gui-number
        .uid=${this.field.uid}
        .label=${this.adapter.templateData.label}
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
      ></gui-number>
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
