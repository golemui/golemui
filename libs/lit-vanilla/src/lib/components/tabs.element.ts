import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { createIntersectionObserver, TabsEventDetail, TabsProps } from '@golemui/shared-vanilla';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing, PropertyValues } from 'lit';
import { repeat } from 'lit-html/directives/repeat.js';
import { customElement, property, query, queryAll, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { Subscription } from 'rxjs';

@customElement('gui-tabs-layout')
export class TabsElement extends LitElement implements Core.WithField {
  field!: Core.LayoutField;

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
  adapter = new Lit.LayoutFieldAdapter<TabsProps>();

  subscriptions: Subscription[] = [];

  private startObserver?: IntersectionObserver;
  private endObserver?: IntersectionObserver;

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-tabs');
    const props: TabsProps = this.field.props as TabsProps;
    this.adapter.context = this.formContext;
    this.adapter.init(this.field);
    this.activeTab = props.defaultOpen ?? props.tabs[0].uid;

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
    const tabs = (this.field.props as TabsProps).tabs;
    const currentIndex = tabs.findIndex((tab) => tab.uid === this.activeTab);
    this.tabButtons[currentIndex].scrollIntoView();
  }

  onClickTab(uid: string) {
    this.activeTab = uid;
    this.adapter.change<TabsEventDetail>(uid);
    this.requestUpdate();
  }

  onKeyDown(event: KeyboardEvent) {
    const tabs = (this.field.props as TabsProps).tabs;
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

  override render() {
    if (!this.adapter.templateData) return html``;

    const activeSection = this.adapter.templateData.children.find(
      (section: any) => section.uid === this.activeTab,
    );
    const activeSectionIndex = this.adapter.templateData.children.findIndex(
      (section: any) => section.uid === this.activeTab,
    );

    const navClasses = {
      'gui-field': true,
      'gui-field--horizontal': true,
      'gui-tabs--start-shadow': !this.isStartVisible,
      'gui-tabs--end-shadow': !this.isEndVisible,
    };

    return html`<nav class=${classMap(navClasses)} role="tablist" id=${this.field.uid}>
        <ul>
          <li role="presentation" id="start-sentinel" class="gui-sentinel"></li>
          ${this.adapter.templateData.tabs
            ? repeat(
                this.adapter.templateData.tabs,
                (tab, index) => html`
                  <li>
                    <button
                      type="button"
                      role="tab"
                      tabindex=${tab.uid === this.activeTab ? nothing : -1}
                      data-cy=${`tab_${this.field.uid}_${index}`}
                      id=${`tab_${this.field.uid}_${index}`}
                      aria-controls=${`tabpanel_${this.field.uid}_${index}`}
                      aria-selected=${tab.uid === this.activeTab ? 'true' : 'false'}
                      class=${classMap({ active: tab.uid === this.activeTab })}
                      @click=${() => this.onClickTab(tab.uid)}
                      @keydown=${(event: KeyboardEvent) => this.onKeyDown(event)}
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
        [activeSection],
        (section) => section?.uid,
        (section) =>
          html`<section
            role="tabpanel"
            tabindex="0"
            data-cy=${`tabpanel_${this.field.uid}_${activeSectionIndex}`}
            id=${`tabpanel_${this.field.uid}_${activeSectionIndex}`}
            aria-labelledby=${`tab_${this.field.uid}_${activeSectionIndex}`}
          >
            <gui-field .field=${section}></gui-field>
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
}
