import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { CheckboxProps } from '@golemui/shared-vanilla';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Subscription } from 'rxjs';

@customElement('gui-checkbox-control')
export class CheckboxElement extends LitElement implements Core.WithField {
  field!: Core.ControlField<boolean>;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.controlContext })
  adapter = new Lit.ControlFieldAdapter<boolean, CheckboxProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-checkbox');
    this.adapter.context = this.formContext;
    this.adapter.init(this.field);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    super.render();

    return html`
      <gui-checkbox
        .uid=${this.field.uid}
        .label=${this.adapter.templateData.label}
        .errors=${this.adapter.templateData.errors}
        ?touched=${this.adapter.templateData.touched}
        ?required=${this.adapter.templateData.validator?.required}
        ?disabled=${this.adapter.templateData.disabled}
        ?readonly=${this.adapter.templateData.readonly}
        .value=${this.adapter.templateData.value}
        .hint=${this.adapter.templateData.hint}
        .checkboxPosition=${this.adapter.templateData.checkboxPosition}
        @change=${() => !this.adapter.templateData.readonly && this.valueChanged(event)}
        @blur=${() => this.adapter.onBlur()}
      ></gui-checkbox>
    `;
  }

  valueChanged(event: Event | undefined) {
    const value = (event as CustomEvent)?.detail.value;
    this.adapter.valueChanged(value);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
