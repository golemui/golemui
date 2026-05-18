import type { ActionWidget, WithWidget } from '@golemui/core'
import { ActionWidgetAdapter, type LitFormContext, actionContext, formContext } from '@golemui/lit'
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';

@customElement('freedom-button')
export class FreedomButtonElement extends LitElement implements WithWidget {
  widget!: ActionWidget;

  @consume({ context: formContext })
  formContext!: LitFormContext<any>;

  @provide({ context: actionContext })
  adapter = new ActionWidgetAdapter();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('freedom-button');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    return html`
      <button
        type="button"
        class="freedom-button__btn"
        @click=${() => this.adapter.click()}
        ?disabled=${this.adapter.templateData.disabled === true}
      >
        ${this.adapter.templateData.label}
      </button>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
