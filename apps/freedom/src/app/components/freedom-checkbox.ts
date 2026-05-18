import type * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';

@customElement('freedom-checkbox')
export class FreedomCheckboxElement extends LitElement implements Core.WithWidget {
  widget!: Core.InputWidget<boolean>;

  @consume({ context: Lit.formContext })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.inputContext })
  adapter = new Lit.InputWidgetAdapter<boolean, Record<string, never>>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('freedom-checkbox');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    const td = this.adapter.templateData;
    const checked = td.value === true;
    return html`
      <label class="freedom-checkbox__row">
        <input
          type="checkbox"
          class="freedom-checkbox__box"
          .checked=${checked}
          @change=${(e: Event) => this.adapter.valueChanged((e.target as HTMLInputElement).checked)}
          @blur=${() => this.adapter.onBlur()}
        />
        <span class="freedom-checkbox__visual ${checked ? 'is-checked' : ''}" aria-hidden="true">
          ${checked ? '✓' : ''}
        </span>
        <span class="freedom-checkbox__label">${td.label ?? ''}</span>
      </label>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
