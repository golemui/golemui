import type { DisplayWidget, WithWidget } from '@golemui/core';
import {
  DisplayWidgetAdapter,
  type LitFormContext,
  displayWidgetContext,
  formContext,
} from '@golemui/lit';
import type { RendererProps } from '@golemui/gui-shared/internals';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine, unsubscribeAll } from '@golemui/lit/internals';
import { type Subscription } from 'rxjs';

export class RendererElement extends LitElement implements WithWidget {
  widget!: DisplayWidget;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: displayWidgetContext })
  adapter = new DisplayWidgetAdapter<RendererProps>();

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
    this.classList.add('gui-renderer', 'gui-field');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    return html`
      <div class="gui-widget" id=${this.widget.uid}>${this.adapter.templateData.render}</div>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    unsubscribeAll(this.subscriptions);
  }
}

safeDefine('gui-renderer-component', RendererElement);
