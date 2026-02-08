import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { createIntersectionObserver, TabsEventDetail, TabsProps } from '@golemui/shared-vanilla';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing, PropertyValues } from 'lit';
import { repeat } from 'lit-html/directives/repeat.js';
import { customElement, property, query, queryAll, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { Subscription } from 'rxjs';
import { ifDefined } from 'lit-html/directives/if-defined.js';

@customElement('gui-tabs-layout')
export class TabsElement extends LitElement implements Core.WithWidget {
  widget!: Core.LayoutWidget;

  @query('#start-sentinel') startSentinel!: HTMLElement;
  @query('#end-sentinel') endSentinel!: HTMLElement;

  @state() isStartVisible!: boolean;
  @state() isEndVisible!: boolean;

  @queryAll('button[role="tab"]')
  tabButtons!: HTMLButtonElement[];

  @property({ type: String }) activeTab = '';

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.layoutContext })
  adapter = new Lit.LayoutWidgetAdapter<TabsProps>();

  subscriptions: Subscription[] = [];

  private startObserver?: IntersectionObserver;
  private endObserver?: IntersectionObserver;

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-tabs');
    const props: TabsProps = this.widget.props as TabsProps;
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);
    this.activeTab = props.defaultOpen ?? props.tabs[0].uid;

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => {
        this.requestUpdate();
      }),
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
    this.tabButtons[currentIndex].scrollIntoView();
  }

  override render() {
    if (!this.adapter.templateData) return html``;

    const activeSections = this.widget.children.filter(
      (section: any) =>
        section.uid === this.activeTab || this.adapter.templateData.renderMode !== 'activeOnly',
    );

    const navClasses = {
      'gui-widget': true,
      'gui-widget--horizontal': true,
      'gui-tabs--start-shadow': !this.isStartVisible,
      'gui-tabs--end-shadow': !this.isEndVisible,
    };

    return html`<nav class=${classMap(navClasses)} id=${this.widget.uid}>
        <ul role="tablist">
          <li role="presentation" id="start-sentinel" class="gui-sentinel"></li>
          ${this.adapter.templateData.tabs
            ? repeat(
                this.adapter.templateData.tabs,
                (tab, index) => html`
                  <li role="presentation">
                    <button
                      type="button"
                      role="tab"
                      tabindex=${ifDefined(tab.uid === this.activeTab ? undefined : -1)}
                      data-cy=${`tab_${this.widget.uid}_${index}`}
                      id=${`tab_${this.widget.uid}_${index}`}
                      aria-controls=${`tabpanel_${this.widget.uid}_${index}`}
                      aria-selected=${tab.uid === this.activeTab ? 'true' : 'false'}
                      class=${classMap({ active: tab.uid === this.activeTab })}
                      @click=${() => this.onClickTab(tab.uid)}
                      @keydown=${this.onKeyDown}
                      @focus=${(event: FocusEvent) =>
                        (event.target as HTMLButtonElement).scrollIntoView()}
                    >
                      ${tab.label}
                    </button>
                  </li>
                `,
              )
            : nothing}
          <li role="presentation" id="end-sentinel" class="gui-sentinel"></li>
        </ul>
      </nav>
      ${repeat(
        activeSections,
        (section) => section?.uid,
        (section, index) =>
          html`<section
            role="tabpanel"
            tabindex="0"
            data-cy=${`tabpanel_${this.widget.uid}_${index}`}
            id=${`tabpanel_${this.widget.uid}_${index}`}
            ?hidden=${section.uid !== this.activeTab &&
            this.adapter.templateData.renderMode !== 'activeOnly'}
            aria-labelledby=${`tab_${this.widget.uid}_${index}`}
          >
            <gui-widget .widget=${section}></gui-widget>
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

    switch (event.key) {
      case 'ArrowLeft':
        if (currentIndex > 0) {
          this.activeTab = tabs[currentIndex - 1].uid;
          tabButtons[currentIndex - 1].focus();
        }
        break;
      case 'ArrowRight':
        if (currentIndex < tabs.length - 1) {
          this.activeTab = tabs[currentIndex + 1].uid;
          tabButtons[currentIndex + 1].focus();
        }
        break;
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
