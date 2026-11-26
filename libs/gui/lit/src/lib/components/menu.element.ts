import type { ActionWidget, WithWidget } from '@golemui/core';
import { ActionWidgetAdapter, type LitFormContext, actionContext, formContext } from '@golemui/lit';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine, unsubscribeAll } from '@golemui/lit/internals';
import { type Subscription } from 'rxjs';
import {
  isMenuGroup,
  menuGroupId,
  menuItemCy,
  menuOpenGroups,
  toggleMenuGroup,
  type MenuItem,
  type MenuProps,
} from '@golemui/gui-shared/internals';
import type { GuiActionEventDetail, GuiMenuToggleEventDetail } from '@golemui/gui-components';
import '@golemui/gui-components/menu';

/**
 * The menu action widget: a navigation menu, with `gui-menu`. Picking a destination emits the
 * widget's `click` event with `{ value }` as its detail; a group's button only opens the group.
 * The groups that hold `current` open when it changes, and the user's own toggles stay until then.
 */
export class MenuElement extends LitElement implements WithWidget {
  widget!: ActionWidget;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: actionContext })
  adapter = new ActionWidgetAdapter<MenuProps>();

  subscriptions: Subscription[] = [];

  /** The values of the groups open in place. */
  private open: string[] = [];
  /** The `current` the open groups last followed. */
  private followed: unknown = undefined;

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-menu', 'gui-field');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override willUpdate() {
    const { items, current } = this.adapter.templateData;
    if (current !== this.followed) {
      this.followed = current;
      this.open = menuOpenGroups(this.open, items, current);
    }
  }

  private onAction = (event: CustomEvent<GuiActionEventDetail>) => {
    this.adapter.click({ value: event.detail.value });
  };

  // The element has opened or closed the group already: the state follows it.
  private onToggle = (event: CustomEvent<GuiMenuToggleEventDetail>) => {
    this.open = toggleMenuGroup(this.open, event.detail.value, event.detail.open);
  };

  private renderItems(items: MenuItem[] | undefined, dropdowns: boolean): TemplateResult[] {
    const { disabled, current } = this.adapter.templateData;
    const uid = this.widget.uid;
    const { domId } = this.adapter;

    return (items ?? []).map((item) => {
      const off = disabled === true || item.disabled === true;
      const content = html`${item.icon
          ? html`<span
              class="gui-widget-icon ${item.icon}"
              data-icon=${item.icon}
              aria-hidden="true"
            ></span>`
          : nothing}<span>${item.label}</span>`;

      if (!isMenuGroup(item)) {
        return html`<li>
          <button
            type="button"
            value=${item.value}
            data-cy=${menuItemCy(uid, item.value)}
            aria-current=${item.value === current ? 'page' : nothing}
            ?disabled=${off}
          >
            ${content}
          </button>
        </li>`;
      }

      const listId = menuGroupId(domId, item.value);
      if (dropdowns) {
        return html`<li>
          <button
            type="button"
            value=${item.value}
            data-cy=${menuItemCy(uid, item.value)}
            popovertarget=${listId}
            ?disabled=${off}
          >
            ${content}
          </button>
          <gui-popover>
            <ul id=${listId} popover>
              ${this.renderItems(item.items, false)}
            </ul>
          </gui-popover>
        </li>`;
      }

      const open = this.open.includes(item.value);
      return html`<li>
        <button
          type="button"
          value=${item.value}
          data-cy=${menuItemCy(uid, item.value)}
          aria-expanded=${String(open)}
          aria-controls=${listId}
          ?disabled=${off}
        >
          ${content}
        </button>
        <ul id=${listId} ?hidden=${!open}>
          ${this.renderItems(item.items, false)}
        </ul>
      </li>`;
    });
  }

  override render() {
    const { label, items, orientation } = this.adapter.templateData;
    const horizontal = orientation === 'horizontal';

    return html`
      <gui-menu
        orientation=${horizontal ? 'horizontal' : nothing}
        @gui-action=${this.onAction}
        @gui-toggle=${this.onToggle}
      >
        <nav
          id=${this.adapter.domId}
          aria-label=${typeof label === 'string' && label !== '' ? label : nothing}
        >
          <ul>
            ${this.renderItems(items, horizontal)}
          </ul>
        </nav>
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
