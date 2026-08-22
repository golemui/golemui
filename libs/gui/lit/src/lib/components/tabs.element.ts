import type { LayoutWidget, WithWidget } from '@golemui/core';
import { LayoutWidgetAdapter, type LitFormContext, formContext, layoutContext } from '@golemui/lit';
import {
  createIntersectionObserver,
  type TabsEventDetail,
} from '@golemui/gui-components/internals';
import { safeDefine } from '@golemui/lit/internals';
import {
  repeaterIndexSuffix,
  tabButtonId,
  tabPanelId,
  type TabsProps,
} from '@golemui/gui-shared/internals';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing, type PropertyValues } from 'lit';
import { repeat } from 'lit-html/directives/repeat.js';
import { property, query, queryAll, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { type Subscription } from 'rxjs';

export class TabsElement extends LitElement implements WithWidget {
  widget!: LayoutWidget;

  // Queried by class: this element renders into the light DOM, so a fixed id would be duplicated
  // across every tabs instance on the page.
  @query('.gui-sentinel__start') startSentinel!: HTMLElement;
  @query('.gui-sentinel__end') endSentinel!: HTMLElement;

  @state() isStartVisible!: boolean;
  @state() isEndVisible!: boolean;

  @queryAll('button[role="tab"]')
  tabButtons!: HTMLButtonElement[];

  @property({ type: String }) activeTab = '';

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: layoutContext })
  adapter = new LayoutWidgetAdapter<TabsProps>();

  subscriptions: Subscription[] = [];

  // `activeTab` holds the raw props uid, children arrive from the store with row indexes applied.
  private rowIndexSuffix = '';

  private startObserver?: IntersectionObserver;
  private endObserver?: IntersectionObserver;

  private get activeChildUid() {
    return this.childUid(this.activeTab);
  }

  private childUid(tabUid: string) {
    return `${tabUid}${this.rowIndexSuffix}`;
  }

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
    const props: TabsProps = this.widget.props as TabsProps;
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);
    this.activeTab = props.defaultOpen ?? props.tabs[0].uid;
    this.rowIndexSuffix = repeaterIndexSuffix(this.widget.uid);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => {
        this.requestUpdate();
      }),
    );
  }

  protected override firstUpdated(_changedProperties: PropertyValues) {
    this.startObserver = createIntersectionObserver(
      this.startSentinel,
      (isIntersecting) => (this.isStartVisible = isIntersecting),
    );
    this.endObserver = createIntersectionObserver(
      this.endSentinel,
      (isIntersecting) => (this.isEndVisible = isIntersecting),
    );

    // Scroll into view the active tab, just in case it's out of view
    const tabs = (this.widget.props as TabsProps).tabs;
    const currentIndex = tabs.findIndex((tab) => tab.uid === this.activeTab);
    this.tabButtons[currentIndex].scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  override render() {
    if (!this.adapter.templateData) return html``;

    // Panels come from the tab list, so a tab and its panel always carry the same uid. A tab whose
    // child is hidden by a `when` keeps its header and gets no panel.
    const children = this.adapter.templateData.children ?? [];
    const panels = (this.adapter.templateData.tabs ?? [])
      .map((tab) => {
        const child = children.find((section: any) => section.uid === this.childUid(tab.uid));
        return { tab, child, isActive: child?.uid === this.activeChildUid };
      })
      .filter(
        ({ child, isActive }) =>
          child !== undefined &&
          (isActive || this.adapter.templateData.renderMode !== 'activeOnly'),
      );

    const navClasses = {
      'gui-widget': true,
      'gui-widget--horizontal': true,
      'gui-tabs--start-shadow': !this.isStartVisible,
      'gui-tabs--end-shadow': !this.isEndVisible,
    };

    return html`<nav class=${classMap(navClasses)} id=${this.widget.uid}>
        <ul role="tablist">
          <li role="presentation" class="gui-sentinel gui-sentinel__start"></li>
          ${this.adapter.templateData.tabs
            ? repeat(
                this.adapter.templateData.tabs,
                (tab) => html`
                  <li role="presentation">
                    <button
                      type="button"
                      role="tab"
                      tabindex=${tab.uid === this.activeTab ? '0' : '-1'}
                      data-cy=${tabButtonId(this.widget.uid, tab.uid)}
                      id=${tabButtonId(this.widget.uid, tab.uid)}
                      aria-controls=${tabPanelId(this.widget.uid, tab.uid)}
                      aria-selected=${tab.uid === this.activeTab ? 'true' : 'false'}
                      class=${classMap({ active: tab.uid === this.activeTab })}
                      @click=${() => this.onClickTab(tab.uid)}
                      @keydown=${this.onKeyDown}
                      @focus=${(event: FocusEvent) =>
                        (event.target as HTMLButtonElement).scrollIntoView({
                          block: 'nearest',
                          inline: 'nearest',
                        })}
                    >
                      ${tab.label}
                    </button>
                  </li>
                `,
              )
            : nothing}
          <li role="presentation" class="gui-sentinel gui-sentinel__end"></li>
        </ul>
      </nav>
      ${repeat(
        panels,
        ({ tab }) => tab.uid,
        ({ tab, child, isActive }) =>
          html`<section
            role="tabpanel"
            tabindex="0"
            data-cy=${tabPanelId(this.widget.uid, tab.uid)}
            id=${tabPanelId(this.widget.uid, tab.uid)}
            ?hidden=${!isActive}
            aria-labelledby=${tabButtonId(this.widget.uid, tab.uid)}
          >
            <gui-widget .widget=${child}></gui-widget>
          </section>`,
      )}`;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.startObserver?.disconnect();
    this.endObserver?.disconnect();
  }

  private onClickTab(uid: string) {
    this.activeTab = uid;
    this.adapter.change<TabsEventDetail>(uid);
    this.requestUpdate();
  }

  private onKeyDown(event: KeyboardEvent) {
    const tabs = (this.widget.props as TabsProps).tabs;
    const currentIndex = tabs.findIndex((tab) => tab.uid === this.activeTab);
    const tabButtons = Array.from(this.tabButtons);
    const isRTL = window.getComputedStyle(this).direction === 'rtl';

    switch (event.key) {
      case 'ArrowLeft': {
        const nextIndex = currentIndex + (isRTL ? 1 : -1);

        if (nextIndex >= 0 && nextIndex < tabs.length) {
          this.activeTab = tabs[nextIndex].uid;
          tabButtons[nextIndex].focus();
        }
        break;
      }
      case 'ArrowRight': {
        const nextIndex = currentIndex + (isRTL ? -1 : 1);

        if (nextIndex >= 0 && nextIndex < tabs.length) {
          this.activeTab = tabs[nextIndex].uid;
          tabButtons[nextIndex].focus();
        }
        break;
      }
      case 'Home':
        this.activeTab = tabs[0].uid;
        tabButtons[0].focus();
        break;
      case 'End':
        this.activeTab = tabs[tabs.length - 1].uid;
        tabButtons[tabs.length - 1].focus();
        break;
      default:
        return;
    }
  }
}

safeDefine('gui-tabs-layout', TabsElement);
