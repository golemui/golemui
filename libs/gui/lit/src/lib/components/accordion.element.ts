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
import { safeDefine, unsubscribeAll } from '@golemui/lit/internals';
import { type Subscription } from 'rxjs';
import { repeat } from 'lit/directives/repeat.js';
import type { GuiToggleEventDetail } from '@golemui/gui-components';
import type { AccordionEventDetail } from '@golemui/gui-components/internals';
import '@golemui/gui-components/accordion';

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

  onToggle(event: CustomEvent<GuiToggleEventDetail>, uid: string) {
    // An accordion nested in a section fires its own.
    if (event.target !== event.currentTarget) return;
    const { open } = event.detail;
    if (!!this.activeSections[uid] === open) return;

    if (open && this.adapter.templateData.singleOpen) {
      Object.keys(this.activeSections).forEach((key) => {
        this.activeSections[key] = false;
      });
    }

    this.activeSections[uid] = open;
    // A copy, because the next toggle writes into `this.activeSections` again.
    this.adapter.change<AccordionEventDetail>({ ...this.activeSections });
    this.requestUpdate();
  }

  getChild(uid: string) {
    const children = this.adapter.templateData.children ?? [];
    return children.find((section) => section.uid === `${uid}${this.rowIndexSuffix}`);
  }

  override render() {
    if (!this.adapter.templateData) return html``;
    const { sections = [], singleOpen, renderMode } = this.adapter.templateData;

    return html`
      <gui-accordion id=${this.widget.uid} ?multiple=${!singleOpen}>
        ${repeat(
          sections,
          (section) => section.uid,
          (section) => {
            const isOpen = !!this.activeSections[section.uid];
            // A `when`-hidden child is absent from the store's children: no section region.
            const child = this.getChild(section.uid);
            const content =
              child !== undefined && (isOpen || renderMode !== 'activeOnly')
                ? html`<section
                    class="gui-widget"
                    role="region"
                    id=${accordionSectionId(this.widget.uid, section.uid)}
                    aria-labelledby=${accordionButtonId(this.widget.uid, section.uid)}
                  >
                    <gui-widget .widget=${child}></gui-widget>
                  </section>`
                : nothing;

            return html`<gui-accordion-item
              .open=${isOpen}
              @gui-toggle=${(event: CustomEvent<GuiToggleEventDetail>) =>
                this.onToggle(event, section.uid)}
            >
              <details ?open=${isOpen}>
                <summary id=${accordionButtonId(this.widget.uid, section.uid)}>
                  ${section.label}
                </summary>
                ${content}
              </details>
            </gui-accordion-item>`;
          },
        )}
      </gui-accordion>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    unsubscribeAll(this.subscriptions);
  }
}

safeDefine('gui-accordion-layout', AccordionElement);
