import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import * as Lit from '@golemui/lit';
import * as Core from '@golemui/core';
import { consume, provide } from '@lit/context';
import { Subscription } from 'rxjs';
import './product-share.element.scss';

interface ShareNetwork {
  id: string;
  label: string;
  icon?: string;
}

interface ProductShareProps {
  networks?: ShareNetwork[];
}

const DEFAULT_NETWORKS: ShareNetwork[] = [
  { id: 'twitter', label: 'X' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'linkedin', label: 'LinkedIn' },
];

function isInlineSvg(icon: string): boolean {
  return icon.trim().startsWith('<svg');
}

@customElement('app-product-share')
export class ProductShareElement extends LitElement implements Core.WithWidget {
  widget!: Core.ActionWidget;

  @consume({ context: Lit.formContext })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.actionContext })
  adapter = new Lit.ActionWidgetAdapter<ProductShareProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('product-share');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    const networks = this.adapter.templateData.networks ?? DEFAULT_NETWORKS;

    return html`
      <div class="product-share__widget" id=${this.widget.uid}>
        <span class="product-share__label">Share this product:</span>
        <div class="product-share__buttons">
          ${networks.map(
            (network) => html`
              <button
                type="button"
                class="product-share__button"
                @click=${() => this.formContext.emitEvent('click', this.widget, network.id)}
                title=${network.label}
                aria-label=${network.label}
              >
                ${network.icon
                  ? isInlineSvg(network.icon)
                    ? html`<span class="product-share__icon">${unsafeHTML(network.icon)}</span>`
                    : html`<img
                        class="product-share__icon"
                        src=${network.icon}
                        alt=""
                        aria-hidden="true"
                      />`
                  : html`<span class="product-share__network">${network.label}</span>`}
              </button>
            `,
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
