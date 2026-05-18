import type * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';

import '@material/web/textfield/filled-text-field.js';

export type MatTextInputProps = {
  type?: string;
};

@customElement('mat-text-input')
export class MatTextInputElement extends LitElement implements Core.WithWidget {
  widget!: Core.InputWidget<string>;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.inputContext })
  adapter = new Lit.InputWidgetAdapter<string, MatTextInputProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('mat-text-input');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override updated(changedProperties: any) {
    super.updated(changedProperties);

    const size = this.adapter.templateData.size;

    if (size) {
      this.style.flex = String(size);
    } else {
      this.style.removeProperty('flex');
    }
  }

  override render() {
    super.render();

    return html`
      <md-filled-text-field
        type=${this.adapter.templateData.type}
        style="width: 100%;"
        .label=${this.adapter.templateData.label}
        .value=${this.adapter.templateData.value ?? ''}
        ?error=${this.adapter.templateData.touched && !!this.adapter.templateData.errors?.length}
        .errorText=${this.adapter.templateData.errors?.[0] ?? ''}
        @input=${(e: any) => this.adapter.valueChanged(e.target.value)}
        @blur=${() => this.adapter.onBlur()}
      >
      </md-filled-text-field>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
