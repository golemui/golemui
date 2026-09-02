import type { DisplayWidget, WithWidget } from '@golemui/core';
import {
  DisplayWidgetAdapter,
  displayWidgetContext,
  formContext,
  safeDefine,
  type LitFormContext,
} from '@golemui/lit';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { type Subscription } from 'rxjs';
import './heading.element.scss';

type OwnWidgetProps = {
  text: string;
  level?: number;
};

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
    const { text, level } = this.adapter.templateData;
    let heading;
    switch (level) {
      case 6:
        heading = html`<h6 class="heading">${text}</h6>`;
        break;
      case 5:
        heading = html`<h5 class="heading">${text}</h5>`;
        break;
      case 4:
        heading = html`<h4 class="heading">${text}</h4>`;
        break;
      case 3:
        heading = html`<h3 class="heading">${text}</h3>`;
        break;
      case 2:
        heading = html`<h2 class="heading">${text}</h2>`;
        break;
      case 1:
      default:
        heading = html`<h1 class="heading">${text}</h1>`;
        break;
    }

    return html`<div class="gui-widget">${heading}</div>`;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}

// Registered through safeDefine rather than customElements.define / @customElement: that is
// what makes a custom widget server renderable (its connectedCallback runs on the server
// and its context requests reach the form) and what honors `defer-hydration` on the
// client, so the element stays inert in the server markup until the form resumes.
safeDefine('app-heading', HeadingElement);
