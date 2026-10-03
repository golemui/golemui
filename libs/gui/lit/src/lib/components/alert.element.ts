import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine, unsubscribeAll } from '@golemui/lit/internals';
import type { DisplayWidget, WithWidget } from '@golemui/core';
import { consume, provide } from '@lit/context';
import {
  DisplayWidgetAdapter,
  type LitFormContext,
  displayWidgetContext,
  formContext,
} from '@golemui/lit';
import type { AlertProps } from '@golemui/gui-shared/internals';
import { type Subscription } from 'rxjs';
import '@golemui/gui-components/alert';

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
    const { text, level } = this.adapter.templateData;
    return html`<gui-alert id=${this.widget.uid} variant=${level || 'default'}>${text}</gui-alert>`;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    unsubscribeAll(this.subscriptions);
  }
}

safeDefine('gui-alert-display', AlertElement);
