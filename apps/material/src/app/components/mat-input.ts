import type { InputWidget, WithWidget } from '@golemui/core'
import { InputWidgetAdapter, type LitFormContext, formContext, inputContext } from '@golemui/lit'
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';

import '@material/web/textfield/filled-text-field.js';

export type MatTextInputProps = {
  type?: string;
};

@customElement('mat-text-input')
export class MatTextInputElement extends LitElement implements WithWidget {
  widget!: InputWidget<string>;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: inputContext })
  adapter = new InputWidgetAdapter<string, MatTextInputProps>();

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
