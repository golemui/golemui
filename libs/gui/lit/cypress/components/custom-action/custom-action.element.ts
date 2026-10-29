import type { ActionWidget, WithWidget } from '@golemui/core';
import { ActionWidgetAdapter, type LitFormContext, formContext } from '@golemui/lit';
import { consume } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';

/** A custom action widget: a native button that sends the click of the widget. */
@customElement('app-custom-action')
export class CustomActionElement extends LitElement implements WithWidget {
  widget!: ActionWidget;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  adapter = new ActionWidgetAdapter<{ label?: string }>();

  private subscription?: Subscription;

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);
    this.subscription = this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate());
  }

  override render() {
    return html`<button
      id=${this.widget.uid}
      type="button"
      data-cy="custom-action"
      @click=${() => this.adapter.click()}
    >
      ${this.adapter.templateData.label}
    </button>`;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscription?.unsubscribe();
  }
}
