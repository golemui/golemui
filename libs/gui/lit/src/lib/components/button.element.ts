import type { ActionWidget, WithWidget } from '@golemui/core';
import { ActionWidgetAdapter, type LitFormContext, actionContext, formContext } from '@golemui/lit';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine, unsubscribeAll } from '@golemui/lit/internals';
import { type Subscription } from 'rxjs';
import { widgetTooltip, type ButtonProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/button';
import '@golemui/gui-components/tooltip';

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

    const { invalid, actionType } = this.adapter.templateData;
    this.classList.toggle('gui-button--invalid', invalid === true && actionType === 'submit');
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
    const { domId } = this.adapter;
    const { label, ariaLabel, tooltip: text } = this.adapter.templateData;
    const tooltip = widgetTooltip(domId, text, label, ariaLabel);
    return html`
      <gui-button
        .uid=${this.widget.uid}
        .idPrefix=${this.adapter.formName}
        .type=${this.adapter.templateData.actionType ?? 'button'}
        .label=${this.adapter.templateData.label}
        ?disabled=${this.adapter.templateData.disabled === true}
        .variant=${this.adapter.templateData.variant}
        .icon=${this.adapter.templateData.icon}
        .iconPosition=${this.adapter.templateData.iconPosition}
        .buttonAriaLabel=${(tooltip?.type === 'label' ? tooltip.text : ariaLabel) as string}
        aria-describedby=${tooltip?.type === 'description' ? tooltip.id : nothing}
        @click=${() => this.adapter.click()}
      ></gui-button>
      ${tooltip
        ? html`<gui-tooltip
            id=${tooltip.id}
            role="tooltip"
            popover="manual"
            for=${domId}
            type=${tooltip.type}
            >${tooltip.text}</gui-tooltip
          >`
        : nothing}
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    unsubscribeAll(this.subscriptions);
  }
}

safeDefine('gui-button-interactive', ButtonElement);
