import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { AccordionProps } from '@golemui/gui-shared';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Subscription } from 'rxjs';
import { repeat } from 'lit-html/directives/repeat.js';
import { classMap } from 'lit/directives/class-map.js';
import { AccordionEventDetail } from '@golemui/gui-components';

@customElement('gui-accordion-layout')
export class AccordionElement extends LitElement implements Core.WithWidget {
  widget!: Core.LayoutWidget;
  activeSections: { [key: string]: boolean } = {};

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.layoutContext })
  adapter = new Lit.LayoutWidgetAdapter<AccordionProps>();

  subscriptions: Subscription[] = [];

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
    this.classList.add('gui-accordion', 'gui-field');
    const props: AccordionProps = this.widget.props as AccordionProps;
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);
    this.activeSections = props.defaultOpen ?? {};

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  onClickButton(uid: string) {
    const props: AccordionProps = this.widget.props as AccordionProps;
    if (props.singleOpen) {
      Object.keys(this.activeSections)
        .filter((sectionUid) => sectionUid !== uid)
        .forEach((key) => {
          this.activeSections[key] = false;
        });
    }

    this.activeSections[uid] = !this.activeSections[uid];
    this.adapter.change<AccordionEventDetail>(this.activeSections);
    this.requestUpdate();
  }

  getChild(uid: string) {
    return this.widget.children.find((section) => section.uid === uid) as Core.FormWidget<string>;
  }

  override render() {
    if (!this.adapter.templateData) return html``;

    return html`
      <div class="gui-widget" id=${this.widget.uid}>
        ${this.adapter.templateData.sections
          ? repeat(
              this.adapter.templateData.sections,
              (section: any) => section.uid,
              (section: any) => {
                const sectionContent =
                  this.activeSections[section.uid] ||
                  this.adapter.templateData.renderMode !== 'activeOnly'
                    ? html`<section
                        class="gui-widget"
                        role="region"
                        id=${`accordion_section_${section.uid}`}
                        ?hidden=${!this.activeSections[section.uid] &&
                        this.adapter.templateData.renderMode !== 'activeOnly'}
                        aria-labelledby=${`accordion_button_${section.uid}`}
                      >
                        <gui-widget .widget=${this.getChild(section.uid)}></gui-widget>
                      </section>`
                    : nothing;

                return html`<div class="gui-accordion__section">
                  <button
                    type="button"
                    class=${classMap({
                      active: this.activeSections[section.uid],
                    })}
                    id=${`accordion_button_${section.uid}`}
                    aria-controls=${`accordion_section_${section.uid}`}
                    aria-expanded=${this.activeSections[section.uid] ? 'true' : 'false'}
                    @click=${() => this.onClickButton(section.uid)}
                  >
                    ${section.label}<span class="gui-accordion__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256"><path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path></svg></span>
                  </button>

                  ${sectionContent}
                </div>`;
              },
            )
          : nothing}
      </div>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
