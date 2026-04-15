import { html, LitElement, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import * as Lit from '@golemui/lit';
import * as Core from '@golemui/core';
import { consume, provide } from '@lit/context';
import { Subscription } from 'rxjs';
import './product-rating.element.scss';

type ProductRatingProps = {
  maxRating: number;
};

@customElement('app-product-rating')
export class ProductRatingElement extends LitElement implements Core.WithWidget {
  widget!: Core.InputWidget<number>;

  @consume({ context: Lit.formContext })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.inputContext })
  adapter = new Lit.InputWidgetAdapter<number, ProductRatingProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('product-rating', 'gui-field');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    const { value, errors, touched, maxRating, label } = this.adapter.templateData;
    const stars = maxRating || 5;

    return html`
      <div class="product-rating__widget" id=${this.widget.uid}>
        ${label ? html`<label class="product-rating__label">${label}</label>` : nothing}
        <div
          class="product-rating__stars"
          tabindex="0"
          @blur=${() => this.adapter.onBlur()}
        >
          ${Array.from({ length: stars }, (_, i) => i + 1).map(
            (star) => html`
              <span
                role="button"
                class="product-rating__star ${star <= (value || 0)
                  ? 'product-rating__star--active'
                  : ''}"
                @click=${() => this.adapter.valueChanged(star)}
              >
                ${star <= (value || 0) ? '\u2605' : '\u2606'}
              </span>
            `,
          )}
          ${value ? html`<span class="product-rating__value">${value} / ${stars}</span>` : nothing}
        </div>
        ${touched && errors?.length
          ? html`
              <div class="product-rating__errors">
                ${errors.map(
                  (error: string) =>
                    html`<span class="product-rating__error">${error}</span>`,
                )}
              </div>
            `
          : nothing}
      </div>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
