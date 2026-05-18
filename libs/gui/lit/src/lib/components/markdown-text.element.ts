import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type * as Core from '@golemui/core';
import { consume, provide } from '@lit/context';
import * as Lit from '@golemui/lit';
import { type MarkdownTextProps } from '@golemui/gui-shared';
import { type Subscription } from 'rxjs';

@customElement('gui-markdown-text-display')
export class MarkdownTextElement extends LitElement implements Core.WithWidget {
  widget!: Core.DisplayWidget;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.displayWidgetContext })
  adapter = new Lit.DisplayWidgetAdapter<MarkdownTextProps>();

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
    this.classList.add('gui-markdown-text', 'gui-field');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    return html`
      <div class="gui-widget" id=${this.widget.uid}>
        <gui-markdown-text
          .md=${this.adapter.templateData.md}
          .dependencies=${this.adapter.templateData.deps}
        ></gui-markdown-text>
      </div>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
