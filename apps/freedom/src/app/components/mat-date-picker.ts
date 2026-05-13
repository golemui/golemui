import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Subscription } from 'rxjs';

import '@material/web/textfield/filled-text-field.js';

@customElement('freedom-mat-date-picker')
export class FreedomMatDatePickerElement extends LitElement implements Core.WithWidget {
  widget!: Core.InputWidget<string>;

  @consume({ context: Lit.formContext })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.inputContext })
  adapter = new Lit.InputWidgetAdapter<string, Record<string, never>>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('freedom-mat-date-picker');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    const td = this.adapter.templateData;
    return html`
      <md-filled-text-field
        type="date"
        style="width: 100%;"
        .label=${td.label ?? ''}
        .value=${td.value ?? ''}
        ?error=${td.touched && !!td.errors?.length}
        .errorText=${td.errors?.[0] ?? ''}
        @input=${(e: Event) => this.adapter.valueChanged((e.target as HTMLInputElement).value)}
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
