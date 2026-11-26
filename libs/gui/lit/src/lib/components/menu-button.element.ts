import type { ActionWidget, WithWidget } from '@golemui/core';
import { ActionWidgetAdapter, type LitFormContext, actionContext, formContext } from '@golemui/lit';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine, unsubscribeAll } from '@golemui/lit/internals';
import { type Subscription } from 'rxjs';
import {
  DEFAULT_MENU_BUTTON_PLACEMENT,
  isMenuButtonSeparator,
  menuButtonAriaLabel,
  menuButtonClasses,
  menuButtonPanelId,
  widgetTooltip,
  type MenuButtonProps,
} from '@golemui/gui-shared/internals';
import type { GuiActionEventDetail } from '@golemui/gui-components';
import '@golemui/gui-components/menu-button';
import '@golemui/gui-components/tooltip';

/**
 * The menuButton action widget: a button that opens a menu of actions, with `gui-menu-button`.
 * Picking an item emits the widget's `click` event with `{ value }` as its detail.
 */
export class MenuButtonElement extends LitElement implements WithWidget {
  widget!: ActionWidget;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: actionContext })
  adapter = new ActionWidgetAdapter<MenuButtonProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-menu-button', 'gui-field');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  private onAction = (event: CustomEvent<GuiActionEventDetail>) => {
    this.adapter.click({ value: event.detail.value });
  };

  override render() {
    const { label, disabled, items, placement, variant, icon, iconPosition, ariaLabel } =
      this.adapter.templateData;
    const uid = this.widget.uid;
    const { domId } = this.adapter;
    const panelId = menuButtonPanelId(domId);
    const tooltip = widgetTooltip(domId, this.adapter.templateData.tooltip, label, ariaLabel);
    const name = tooltip?.type === 'label' ? tooltip.text : ariaLabel;
    const iconPart = icon
      ? html`<span
          class="gui-widget-icon gui-button-icon ${icon}"
          data-icon=${icon}
          aria-hidden="true"
        ></span>`
      : nothing;
    const iconOnRight = iconPosition === 'right';

    return html`
      <div class="gui-widget">
        <button
          type="button"
          id=${domId}
          class=${menuButtonClasses({ variant, icon, iconPosition })}
          data-cy=${`${uid}_button`}
          popovertarget=${panelId}
          aria-label=${menuButtonAriaLabel(label, name) ?? nothing}
          aria-describedby=${tooltip?.type === 'description' ? tooltip.id : nothing}
          ?disabled=${disabled === true}
        >
          ${iconOnRight ? nothing : iconPart} ${label ? html`<span>${label}</span>` : nothing}
          ${iconOnRight ? iconPart : nothing}
        </button>
      </div>
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
      <gui-menu-button
        placement=${placement ?? DEFAULT_MENU_BUTTON_PLACEMENT}
        @gui-action=${this.onAction}
      >
        <div id=${panelId} data-cy=${menuButtonPanelId(uid)} popover>
          ${(items ?? []).map((item) =>
            isMenuButtonSeparator(item)
              ? html`<hr />`
              : html`<button
                  type="button"
                  value=${item.value}
                  data-cy=${`${uid}_item_${item.value}`}
                  ?disabled=${item.disabled === true}
                >
                  ${item.label}
                </button>`,
          )}
        </div>
      </gui-menu-button>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    unsubscribeAll(this.subscriptions);
  }
}

safeDefine('gui-menu-button-interactive', MenuButtonElement);
