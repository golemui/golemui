import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { TextareaProps } from '@golemui/shared-vanilla';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Subscription } from 'rxjs';

@customElement('gui-textarea-control')
export class TextareaElement extends LitElement implements Core.WithField {
  field!: Core.ControlField<string>;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.controlContext })
  adapter = new Lit.ControlFieldAdapter<string, TextareaProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-textarea');
    this.adapter.context = this.formContext;
    this.adapter.init(this.field);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    super.render();

    return html`
      <gui-textarea
        .uid=${this.field.uid}
        .label=${this.adapter.templateData.label}
        ?touched=${this.adapter.templateData.touched}
        .errors=${this.adapter.templateData.errors}
        ?disabled=${this.adapter.templateData.disabled || nothing}
        ?readonly=${this.adapter.templateData.readonly || nothing}
        .value=${this.adapter.templateData.value ?? ''}
        .hint=${this.adapter.templateData.hint}
        .placeholder=${this.adapter.templateData.placeholder || nothing}
        .icon=${this.adapter.templateData.icon}
        .counterMode=${this.adapter.templateData.counterMode}
        .minimumHeight=${this.adapter.templateData.minimumHeight}
        .autoGrow=${this.adapter.templateData.autoGrow}
        .maxLength=${this.adapter.templateData.validator?.maxLength}
        @input="${() => this.valueChanged(event)}"
        @blur="${() => this.adapter.onBlur()}"
      ></gui-textarea>
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
