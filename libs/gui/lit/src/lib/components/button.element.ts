import type { ActionWidget, WithWidget } from '@golemui/core';
import { ActionWidgetAdapter, type LitFormContext, actionContext, formContext } from '@golemui/lit';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';
import { type ButtonProps } from '@golemui/gui-shared';
import '@golemui/gui-components/button';

@customElement('gui-button-interactive')
export class ButtonElement extends LitElement implements WithWidget {
  widget!: ActionWidget;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: actionContext })
  adapter = new ActionWidgetAdapter<ButtonProps>();

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
    this.classList.add('gui-button', 'gui-field');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    return html`
      <gui-button
        .uid=${this.widget.uid}
        .actionType=${this.adapter.templateData.actionType ?? 'button'}
        .label=${this.adapter.templateData.label}
        ?disabled=${this.adapter.templateData.disabled === true}
        ?invalid=${this.adapter.templateData.invalid === true}
        .variant=${this.adapter.templateData.variant}
        .icon=${this.adapter.templateData.icon}
        .iconPosition=${this.adapter.templateData.iconPosition}
        @click=${() => this.adapter.click()}
      ></gui-button>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
