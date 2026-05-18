import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { DisplayWidgetAdapter, type LitFormContext, displayWidgetContext, formContext } from '@golemui/lit'
import type { DisplayWidget, WithWidget } from '@golemui/core'
import { consume, provide } from '@lit/context';
import './heading.element.scss';
import { type Subscription } from 'rxjs';

type OwnWidgetProps = {
  text: string;
  level?: number;
};

@customElement('app-heading')
export class HeadingElement extends LitElement implements WithWidget {
  widget!: DisplayWidget;

  @consume({ context: formContext })
  formContext!: LitFormContext<any>;

  @provide({ context: displayWidgetContext })
  adapter: DisplayWidgetAdapter<OwnWidgetProps> = new DisplayWidgetAdapter();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    super.render();
    let heading;
    switch (this.adapter.templateData.level) {
      case 6:
        heading = html`<h6 class="heading">${this.adapter.templateData.text}</h6>`;
        break;
      case 5:
        heading = html`<h5 class="heading">${this.adapter.templateData.text}</h5>`;
        break;
      case 4:
        heading = html`<h4 class="heading">${this.adapter.templateData.text}</h4>`;
        break;
      case 3:
        heading = html`<h3 class="heading">${this.adapter.templateData.text}</h3>`;
        break;
      case 2:
        heading = html`<h2 class="heading">${this.adapter.templateData.text}</h2>`;
        break;
      case 1:
      default:
        heading = html`<h1 class="heading">${this.adapter.templateData.text}</h1>`;
        break;
    }

    return html`<div class="gui-widget">${heading}</div>`;
  }

  disconnectedCallback() {
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
