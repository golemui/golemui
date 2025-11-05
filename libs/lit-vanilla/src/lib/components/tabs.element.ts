import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import * as Core from '@formforge/core';
import { consume, provide } from '@lit/context';
import * as Lit from '@formforge/lit';
import { TabsProps } from '@formforge/shared';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit-html/directives/repeat.js';

@customElement('ff-tabs')
export class TabsElement extends LitElement implements Core.WithField {
  field!: Core.LayoutField;
  @property({ type: String }) activeTab = '';

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.layoutContext })
  adapter = new Lit.LayoutAdapter<TabsProps>();

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('ff-tabs');
    const props: TabsProps = this.field.props as TabsProps;
    this.adapter.context = this.formContext;
    this.adapter.init(this.field);
    this.activeTab = props.defaultOpen ?? props.tabs[0].uid;
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

    return html`<nav class="field horizontal" role="tablist" id=${this.field.uid}>
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
    <section class="field" role="tabpanel">
      ${repeat(
        [activeSection],
        (section) => section?.uid,
        (section) => html`<ff-field .field=${section}></ff-field>`
      )}
    </section>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
  }
}
