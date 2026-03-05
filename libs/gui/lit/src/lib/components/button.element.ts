import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { Subscription } from 'rxjs';
import { ButtonProps } from '@golemui/gui-shared';

@customElement('gui-button-action')
export class ButtonElement extends LitElement implements Core.WithWidget {
  widget!: Core.ActionWidget;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.actionContext })
  adapter = new Lit.ActionWidgetAdapter<ButtonProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-button');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
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

  override render() {
    const templateData = this.adapter.templateData;
    const icon = templateData.icon;
    const label = templateData.label;
    const iconPosition = templateData.iconPosition || 'left';

    const buttonClasses = {
      'gui-button-with-icon': !!icon,
      [`gui-button-icon-${iconPosition}`]: !!icon,
    };

    const iconTemplate = icon
      ? html`<span class="gui-button-icon ${icon}"></span>`
      : nothing;

    return html`
      <div class="gui-widget">
        <button
          type="button"
          id=${this.widget.uid}
          class=${classMap(buttonClasses)}
          data-cy=${`${this.widget.uid}_button`}
          @click=${() => this.adapter.click()}
          ?disabled=${templateData.disabled === true}
        >
          ${iconPosition === 'left' ? iconTemplate : nothing}
          ${label ? html`<span>${label}</span>` : nothing}
          ${iconPosition === 'right' ? iconTemplate : nothing}
        </button>
      </div>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
