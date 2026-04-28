import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Subscription } from 'rxjs';

export type FreedomInputProps = {
  type?: string;
  placeholder?: string;
};

@customElement('freedom-input')
export class FreedomInputElement extends LitElement implements Core.WithWidget {
  widget!: Core.InputWidget<string>;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.inputContext })
  adapter = new Lit.InputWidgetAdapter<string, FreedomInputProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('freedom-input');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    const td = this.adapter.templateData;
    const hasError = td.touched && !!td.errors?.length;
    return html`
      <label class="freedom-input__label">${td.label}</label>
      <input
        class="freedom-input__field ${hasError ? 'freedom-input__field--error' : ''}"
        type=${td.type ?? 'text'}
        placeholder=${td.placeholder ?? ''}
        .value=${td.value ?? ''}
        @input=${(e: Event) =>
          this.adapter.valueChanged((e.target as HTMLInputElement).value)}
        @blur=${() => this.adapter.onBlur()}
      />
      ${hasError
        ? html`<span class="freedom-input__error">${td.errors?.[0]}</span>`
        : null}
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
