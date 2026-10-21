import type { ActionWidget, WithWidget } from '@golemui/core';
import { ActionWidgetAdapter, type LitFormContext, actionContext, formContext } from '@golemui/lit';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine, unsubscribeAll } from '@golemui/lit/internals';
import { type Subscription } from 'rxjs';
import {
  DEFAULT_MENU_PLACEMENT,
  isMenuSeparator,
  menuButtonAriaLabel,
  menuButtonClasses,
  menuPanelId,
  type MenuProps,
} from '@golemui/gui-shared/internals';
import type { GuiActionEventDetail } from '@golemui/gui-components';
import '@golemui/gui-components/menu';

/**
 * The menu action widget: a button that opens a `gui-menu` of actions. Picking an item emits the
 * widget's `click` event with `{ value }` as its detail.
 */
export class MenuElement extends LitElement implements WithWidget {
  widget!: ActionWidget;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: actionContext })
  adapter = new ActionWidgetAdapter<MenuProps>();

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
    const panelId = menuPanelId(uid);
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
          id=${uid}
          class=${menuButtonClasses({ variant, icon, iconPosition })}
          data-cy=${`${uid}_button`}
          popovertarget=${panelId}
          aria-label=${menuButtonAriaLabel(label, ariaLabel) ?? nothing}
          ?disabled=${disabled === true}
        >
          ${iconOnRight ? nothing : iconPart} ${label ? html`<span>${label}</span>` : nothing}
          ${iconOnRight ? iconPart : nothing}
        </button>
      </div>
      <gui-menu placement=${placement ?? DEFAULT_MENU_PLACEMENT} @gui-action=${this.onAction}>
        <div id=${panelId} data-cy=${panelId} popover>
          ${(items ?? []).map((item) =>
            isMenuSeparator(item)
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
      </gui-menu>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    unsubscribeAll(this.subscriptions);
  }
}

safeDefine('gui-menu-interactive', MenuElement);
