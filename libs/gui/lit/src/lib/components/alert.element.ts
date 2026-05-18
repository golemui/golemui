import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { DisplayWidget, WithWidget } from '@golemui/core';
import { consume, provide } from '@lit/context';
import {
  DisplayWidgetAdapter,
  type LitFormContext,
  displayWidgetContext,
  formContext,
} from '@golemui/lit';
import { type AlertProps } from '@golemui/gui-shared';
import { type Subscription } from 'rxjs';

@customElement('gui-alert-display')
export class AlertElement extends LitElement implements WithWidget {
  widget!: DisplayWidget;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: displayWidgetContext })
  adapter = new DisplayWidgetAdapter<AlertProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
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

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-alert', 'gui-field');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    return html`
      <div class="gui-widget" id=${this.widget.uid}>
        <div
          role="alert"
          class="gui-alert-notification gui-alert-notification--${this.adapter.templateData.level ||
          'default'}"
        >
          ${this.adapter.templateData.text}
        </div>
      </div>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
