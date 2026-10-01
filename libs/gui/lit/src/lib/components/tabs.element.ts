import type { LayoutWidget, WithWidget } from '@golemui/core';
import { LayoutWidgetAdapter, type LitFormContext, formContext, layoutContext } from '@golemui/lit';
import type { GuiTabChangeEventDetail } from '@golemui/gui-components';
import type { TabsEventDetail } from '@golemui/gui-components/internals';
import { safeDefine, unsubscribeAll } from '@golemui/lit/internals';
import {
  repeaterIndexSuffix,
  tabButtonId,
  tabPanelId,
  type TabsProps,
} from '@golemui/gui-shared/internals';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { property, state } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';
import '@golemui/gui-components/tabs';

export class TabsElement extends LitElement implements WithWidget {
  widget!: LayoutWidget;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: layoutContext })
  adapter = new LayoutWidgetAdapter<TabsProps>();

  /** The tab uid, without row indexes: the panel children carry them, see `rowIndexSuffix`. */
  @state() private activeTab = '';

  subscriptions: Subscription[] = [];
  private rowIndexSuffix = '';

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
    this.classList.add('gui-tabs', 'gui-field');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);
    const templateData = this.adapter.templateData;
    this.activeTab = templateData.defaultOpen ?? templateData.tabs?.[0]?.uid ?? '';
    this.rowIndexSuffix = repeaterIndexSuffix(this.widget.uid);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => {
        this.requestUpdate();
      }),
    );
  }

  override render() {
    if (!this.adapter.templateData) return html``;

    const { tabs = [], children = [], renderMode } = this.adapter.templateData;
    // Panels come from the tab list, so a tab and its panel always carry the same uid. A tab whose
    // child is hidden by a `when` keeps its header and gets no panel.
    const panels = tabs
      .map((tab) => ({
        tab,
        child: children.find((child: any) => child.uid === `${tab.uid}${this.rowIndexSuffix}`),
        isActive: tab.uid === this.activeTab,
      }))
      .filter(({ child, isActive }) => child && (isActive || renderMode !== 'activeOnly'));

    return html`<gui-tabs
      id=${this.widget.uid}
      .active=${this.activeTab}
      @gui-tab-change=${this.onTabChange}
    >
      <gui-tab-list>
        ${repeat(
          tabs,
          (tab) => tab.uid,
          (tab) =>
            html`<gui-tab
              panel=${tab.uid}
              id=${tabButtonId(this.widget.uid, tab.uid)}
              data-cy=${tabButtonId(this.widget.uid, tab.uid)}
              >${tab.label}</gui-tab
            >`,
        )}
      </gui-tab-list>
      ${repeat(
        panels,
        ({ tab }) => tab.uid,
        ({ tab, child, isActive }) =>
          html`<gui-tab-panel
            name=${tab.uid}
            id=${tabPanelId(this.widget.uid, tab.uid)}
            data-cy=${tabPanelId(this.widget.uid, tab.uid)}
            ?hidden=${!isActive}
          >
            <gui-widget .widget=${child}></gui-widget>
          </gui-tab-panel>`,
      )}
    </gui-tabs>`;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    unsubscribeAll(this.subscriptions);
  }

  private onTabChange = (event: CustomEvent<GuiTabChangeEventDetail>) => {
    // A tab set nested in a panel fires its own.
    if (event.target !== event.currentTarget) return;
    this.activeTab = event.detail.value;
    this.adapter.change<TabsEventDetail>(event.detail.value);
  };
}

safeDefine('gui-tabs-layout', TabsElement);
