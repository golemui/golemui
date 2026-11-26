import type { LayoutWidget, WithWidget } from '@golemui/core';
import { LayoutWidgetAdapter, type LitFormContext, formContext, layoutContext } from '@golemui/lit';
import { safeDefine, unsubscribeAll } from '@golemui/lit/internals';
import type { GuiToggleEventDetail } from '@golemui/gui-components';
import {
  sidebarRegions,
  sidebarSideId,
  sidebarSideLabel,
  sidebarToggleLabel,
  type SidebarProps,
} from '@golemui/gui-shared/internals';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';
import '@golemui/gui-components/sidebar';

/**
 * The sidebar layout widget: the side child next to the main one, with `gui-sidebar`. Below
 * 768px of its own width the side region becomes a drawer the toggle opens: the same element, so
 * the side child is rendered once and keeps its state.
 */
export class SidebarElement extends LitElement implements WithWidget {
  widget!: LayoutWidget;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: layoutContext })
  adapter = new LayoutWidgetAdapter<SidebarProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-sidebar', 'gui-field');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  // A menu inside reports its groups with gui-toggle too: only the drawer's counts.
  private onToggle = (event: CustomEvent<GuiToggleEventDetail>) => {
    if (event.target !== event.currentTarget) return;
    this.adapter.change({ open: event.detail.open });
  };

  override render() {
    const { side: placement, sideSize, sideLabel, toggleLabel } = this.adapter.templateData;
    const { side, main } = sidebarRegions(
      this.widget.uid,
      this.widget.children,
      this.adapter.templateData.children || [],
    );
    const uid = this.widget.uid;
    const { domId } = this.adapter;
    const sideId = sidebarSideId(domId);

    return html`
      <gui-sidebar
        id=${domId}
        side=${placement ?? nothing}
        side-size=${sideSize ?? nothing}
        @gui-toggle=${this.onToggle}
      >
        ${side
          ? html`<button
                type="button"
                class="gui-sidebar__toggle"
                popovertarget=${sideId}
                aria-label=${sidebarToggleLabel(toggleLabel)}
                data-cy=${`${uid}_toggle`}
              ></button>
              <aside
                class="gui-sidebar__side"
                id=${sideId}
                popover
                aria-label=${sidebarSideLabel(sideLabel)}
                data-cy=${`${uid}_side`}
              >
                <gui-widget .widget=${side}></gui-widget>
              </aside>`
          : nothing}
        <div class="gui-sidebar__main" data-cy=${`${uid}_main`}>
          ${main ? html`<gui-widget .widget=${main}></gui-widget>` : nothing}
        </div>
      </gui-sidebar>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    unsubscribeAll(this.subscriptions);
  }
}

safeDefine('gui-sidebar-layout', SidebarElement);
