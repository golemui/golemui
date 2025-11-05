import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import * as Core from '@formforge/core';
import { consume, provide } from '@lit/context';
import * as Lit from '@formforge/lit';
import { AccordionProps } from '@formforge/shared-vanilla';
import { repeat } from 'lit-html/directives/repeat.js';
import { Subscription } from 'rxjs';

@customElement('ff-accordion')
export class AccordionElement extends LitElement implements Core.WithField {
  field!: Core.LayoutField;
  activeSections: { [key: string]: boolean } = {};

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.layoutContext })
  adapter = new Lit.LayoutAdapter<AccordionProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('ff-accordion');
    const props: AccordionProps = this.field.props as AccordionProps;
    this.adapter.context = this.formContext;
    this.adapter.init(this.field);
    this.activeSections = props.defaultOpen ?? {};

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  onClickButton(uid: string) {
    const props: AccordionProps = this.field.props as AccordionProps;
    if (props.singleOpen) {
      Object.keys(this.activeSections)
        .filter((sectionUid) => sectionUid !== uid)
        .forEach((key) => {
          this.activeSections[key] = false;
        });
    }

    this.activeSections[uid] = !this.activeSections[uid];
    this.requestUpdate();
  }

  getChild(uid: string) {
    return this.field.children.find((section) => section.uid === uid) as Core.FormField<string>;
  }

  override render() {
    if (!this.adapter.templateData) return html``;

    return html`
      <div class="field" id=${this.field.uid}>
        ${this.adapter.templateData.sections.map((section: any, index: number) => {
          const sectionContent = this.activeSections[section.uid]
            ? html`<section class="field" role="region">
                <ff-field .field=${this.getChild(section.uid)}></ff-field>
              </section>`
            : nothing;

          return html`<div class="ff-accordion-section">
            <button
              type="button"
              tabindex=${index}
              class=${{
                active: this.activeSections[section.uid],
              }}
              aria-expanded=${this.activeSections[section.uid]}
              @click=${() => this.onClickButton(section.uid)}
            >
              ${section.label}<span class="ff-accordion-icon"></span>
            </button>

            ${sectionContent}
          </div>`;
        })}
      </div>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
