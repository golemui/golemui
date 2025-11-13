import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { TabsProps } from '@golemui/shared-vanilla';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { repeat } from 'lit-html/directives/repeat.js';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { Subscription } from 'rxjs';

@customElement('gui-tabs')
export class TabsElement extends LitElement implements Core.WithField {
  field!: Core.LayoutField;
  @property({ type: String }) activeTab = '';

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.layoutContext })
  adapter = new Lit.LayoutFieldAdapter<TabsProps>();

  subscriptions: Subscription[] = [];

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
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  onClickTab(uid: string) {
    this.activeTab = uid;
    this.requestUpdate();
  }

  override render() {
    if (!this.adapter.templateData) return html``;

    const activeSection = this.adapter.templateData.children.find(
      (section: any) => section.uid === this.activeTab,
    );

    return html`<nav class="gui-field gui-field--horizontal" role="tablist" id=${this.field.uid}>
        ${this.adapter.templateData.tabs.map(
          (tab: any, index: number) => html`
            <a
              role="tab"
              tabindex=${index}
              class=${classMap({ active: tab.uid === this.activeTab })}
              @click=${() => this.onClickTab(tab.uid)}
              @keydown=${() => this.onClickTab(tab.uid)}
            >
              ${tab.label}
            </a>
          `,
        )}
      </nav>
      <section role="tabpanel">
        ${repeat(
          [activeSection],
          (section) => section?.uid,
          (section) => html`<gui-field .field=${section}></gui-field>`,
        )}
      </section> `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
