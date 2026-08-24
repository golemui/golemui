import type { LayoutWidget, WithWidget } from '@golemui/core';
import { LayoutWidgetAdapter, type LitFormContext, formContext, layoutContext } from '@golemui/lit';
import {
  accordionButtonId,
  accordionSectionId,
  type AccordionProps,
  repeaterIndexSuffix,
} from '@golemui/gui-shared/internals';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit/internals';
import { type Subscription } from 'rxjs';
import { repeat } from 'lit-html/directives/repeat.js';
import { classMap } from 'lit/directives/class-map.js';
import type { AccordionEventDetail } from '@golemui/gui-components/internals';

export class AccordionElement extends LitElement implements WithWidget {
  widget!: LayoutWidget;
  activeSections: { [key: string]: boolean } = {};

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: layoutContext })
  adapter = new LayoutWidgetAdapter<AccordionProps>();

  subscriptions: Subscription[] = [];

  // Section uids come from raw props, children arrive from the store with row indexes applied.
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
    this.classList.add('gui-accordion', 'gui-field');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);
    // Copy: repeater rows share one `defaultOpen` object, a direct write would open the section in every row
    this.activeSections = { ...(this.adapter.templateData.defaultOpen ?? {}) };
    this.rowIndexSuffix = repeaterIndexSuffix(this.widget.uid);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  onClickButton(uid: string) {
    if (this.adapter.templateData.singleOpen) {
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
    const children = this.adapter.templateData.children ?? [];
    return children.find((section) => section.uid === `${uid}${this.rowIndexSuffix}`);
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
                // A `when`-hidden child is absent from the store's children: no section region.
                const child = this.getChild(section.uid);
                const sectionContent =
                  child !== undefined &&
                  (this.activeSections[section.uid] ||
                    this.adapter.templateData.renderMode !== 'activeOnly')
                    ? html`<section
                        class="gui-widget"
                        role="region"
                        id=${accordionSectionId(this.widget.uid, section.uid)}
                        ?hidden=${!this.activeSections[section.uid] &&
                        this.adapter.templateData.renderMode !== 'activeOnly'}
                        aria-labelledby=${accordionButtonId(this.widget.uid, section.uid)}
                      >
                        <gui-widget .widget=${child}></gui-widget>
                      </section>`
                    : nothing;

                return html`<div class="gui-accordion__section">
                  <button
                    type="button"
                    tabindex="0"
                    class=${classMap({
                      active: this.activeSections[section.uid],
                    })}
                    id=${accordionButtonId(this.widget.uid, section.uid)}
                    aria-controls=${accordionSectionId(this.widget.uid, section.uid)}
                    aria-expanded=${this.activeSections[section.uid] ? 'true' : 'false'}
                    @click=${() => this.onClickButton(section.uid)}
                  >
                    ${section.label}<span class="gui-accordion__arrow"
                      ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 256 256"
                      >
                        <path
                          d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"
                        ></path></svg
                    ></span>
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

safeDefine('gui-accordion-layout', AccordionElement);
