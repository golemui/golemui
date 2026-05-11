import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Subscription } from 'rxjs';

@customElement('freedom-date-picker')
export class FreedomDatePickerElement extends LitElement implements Core.WithWidget {
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
    this.classList.add('freedom-date-picker');
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
      <label class="freedom-date-picker__label">${td.label ?? ''}</label>
      <input
        type="date"
        class="freedom-date-picker__field ${hasError ? 'freedom-date-picker__field--error' : ''}"
        .value=${td.value ?? ''}
        @input=${(e: Event) =>
          this.adapter.valueChanged((e.target as HTMLInputElement).value)}
        @blur=${() => this.adapter.onBlur()}
      />
      ${hasError
        ? html`<span class="freedom-date-picker__error">${td.errors?.[0]}</span>`
        : null}
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
