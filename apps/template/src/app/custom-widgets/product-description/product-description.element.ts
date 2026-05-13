import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import * as Lit from '@golemui/lit';
import * as Core from '@golemui/core';
import { consume, provide } from '@lit/context';
import { Subscription } from 'rxjs';
import '@golemui/gui-components';
import './product-description.element.scss';

type ProductDescriptionProps = {
  img: string;
  description: string;
};

@customElement('app-product-description')
export class ProductDescriptionElement extends LitElement implements Core.WithWidget {
  widget!: Core.DisplayWidget;

  @consume({ context: Lit.formContext })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.displayWidgetContext })
  adapter = new Lit.DisplayWidgetAdapter<ProductDescriptionProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('product-description');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    const { img, description } = this.adapter.templateData;

    return html`
      <div class="product-description__widget" id=${this.widget.uid}>
        ${img ? html`<img class="product-description__image" src=${img} alt="Product" />` : null}
        ${description
          ? html`<gui-markdown-text
              .md=${description}
              .dependencies=${this.adapter.templateData.deps}
            ></gui-markdown-text>`
          : null}
      </div>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
