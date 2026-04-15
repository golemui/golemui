import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import * as Lit from '@golemui/lit';
import * as Core from '@golemui/core';
import { consume, provide } from '@lit/context';
import { repeat } from 'lit-html/directives/repeat.js';
import { Subscription } from 'rxjs';
import './product-card.element.scss';

type ProductCardProps = {
  title: string;
};

@customElement('app-product-card')
export class ProductCardElement extends LitElement implements Core.WithWidget {
  widget!: Core.LayoutWidget;

  @consume({ context: Lit.formContext })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.layoutContext })
  adapter = new Lit.LayoutWidgetAdapter<ProductCardProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('product-card');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    return html`
      <div class="product-card__widget" id=${this.widget.uid}>
        <h2 class="product-card__title">${this.adapter.templateData.title}</h2>
        <div class="product-card__content">
          ${repeat(
            this.adapter.templateData.children || [],
            (child: any) => child.uid,
            (child: any) => html`<gui-widget .widget=${child}></gui-widget>`,
          )}
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
