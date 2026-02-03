import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import * as Lit from '@golemui/lit';
import * as Core from '@golemui/core';
import { consume, provide } from '@lit/context';
import './heading.element.scss';
import { Subscription } from 'rxjs';

type OwnWidgetProps = {
  text: string;
  level?: number;
};

@customElement('app-heading')
export class HeadingElement extends LitElement implements Core.WithWidget {
  widget!: Core.DisplayWidget;

  @consume({ context: Lit.formContext })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.displayFieldContext })
  adapter: Lit.DisplayFieldAdapter<OwnWidgetProps> = new Lit.DisplayFieldAdapter();

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

    return html`<div class="gui-field">${heading}</div>`;
  }

  disconnectedCallback() {
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
