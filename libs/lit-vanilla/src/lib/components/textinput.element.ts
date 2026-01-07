import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { TextinputProps } from '@golemui/shared-vanilla';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Subscription } from 'rxjs';

@customElement('gui-textinput-control')
export class TextinputElement extends LitElement implements Core.WithField {
  field!: Core.ControlField<string>;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.controlContext })
  adapter = new Lit.ControlFieldAdapter<string, TextinputProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-textinput');
    this.adapter.context = this.formContext;
    this.adapter.init(this.field);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    super.render();

    return html`
      <gui-textinput
        .uid=${this.field.uid}
        .label=${this.adapter.templateData.label}
        .hint=${this.adapter.templateData.hint}
        ?touched=${this.adapter.templateData.touched}
        .errors=${this.adapter.templateData.errors}
        ?disabled=${this.adapter.templateData.disabled || nothing}
        ?readonly=${this.adapter.templateData.readonly || nothing}
        .value=${this.adapter.templateData.value ?? ''}
        .icon=${this.adapter.templateData.icon}
        .iconPosition=${this.adapter.templateData.iconPosition}
        .placeholder=${this.adapter.templateData.placeholder || nothing}
        @input="${() => this.valueChanged(event)}"
        @blur="${() => this.adapter.onBlur()}"
      ></gui-textinput>
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
