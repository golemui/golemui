import type { InputWidget, WithWidget } from '@golemui/core';
import { InputWidgetAdapter, type LitFormContext, formContext, inputContext } from '@golemui/lit';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';

import '@material/web/textfield/filled-text-field.js';

export type FreedomMatTextInputProps = {
  type?: string;
};

@customElement('freedom-mat-text-input')
export class FreedomMatTextInputElement extends LitElement implements WithWidget {
  widget!: InputWidget<string>;

  @consume({ context: formContext })
  formContext!: LitFormContext<any>;

  @provide({ context: inputContext })
  adapter = new InputWidgetAdapter<string, FreedomMatTextInputProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('freedom-mat-text-input');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    return html`
      <md-filled-text-field
        type=${this.adapter.templateData.type ?? 'text'}
        style="width: 100%;"
        .label=${this.adapter.templateData.label}
        .value=${this.adapter.templateData.value ?? ''}
        ?error=${this.adapter.templateData.touched && !!this.adapter.templateData.errors?.length}
        .errorText=${this.adapter.templateData.errors?.[0] ?? ''}
        @input=${(e: any) => this.adapter.valueChanged(e.target.value)}
        @blur=${() => this.adapter.onBlur()}
      ></md-filled-text-field>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
