import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Subscription } from 'rxjs';

import '@material/web/textfield/filled-text-field.js';

export type FreedomMatTextInputProps = {
  type?: string;
};

@customElement('freedom-mat-text-input')
export class FreedomMatTextInputElement extends LitElement implements Core.WithWidget {
  widget!: Core.InputWidget<string>;

  @consume({ context: Lit.formContext })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.inputContext })
  adapter = new Lit.InputWidgetAdapter<string, FreedomMatTextInputProps>();

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
