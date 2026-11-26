import type { ActionWidget, WithWidget } from '@golemui/core';
import { ActionWidgetAdapter, type LitFormContext, actionContext, formContext } from '@golemui/lit';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine, unsubscribeAll } from '@golemui/lit/internals';
import { type Subscription } from 'rxjs';
import {
  breadcrumbLabel,
  breadcrumbTrail,
  type BreadcrumbProps,
} from '@golemui/gui-shared/internals';
import type { GuiActionEventDetail } from '@golemui/gui-components';
import '@golemui/gui-components/breadcrumb';

/**
 * The breadcrumb action widget: a trail to the current page, with `gui-breadcrumb`. Picking a
 * step emits the widget's `click` event with `{ value }` as its detail.
 */
export class BreadcrumbElement extends LitElement implements WithWidget {
  widget!: ActionWidget;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: actionContext })
  adapter = new ActionWidgetAdapter<BreadcrumbProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-breadcrumb', 'gui-field');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  private onAction = (event: CustomEvent<GuiActionEventDetail>) => {
    this.adapter.click({ value: event.detail.value });
  };

  override render() {
    const { label, disabled, items } = this.adapter.templateData;
    const uid = this.widget.uid;

    return html`
      <gui-breadcrumb @gui-action=${this.onAction}>
        <nav id=${this.adapter.domId} aria-label=${breadcrumbLabel(label)}>
          <ol>
            ${breadcrumbTrail(items).map(
              (step) =>
                html`<li>
                  ${step.current
                    ? html`<span aria-current="page" data-cy=${`${uid}_item_${step.value}`}
                        >${step.label}</span
                      >`
                    : html`<button
                        type="button"
                        value=${step.value}
                        data-cy=${`${uid}_item_${step.value}`}
                        ?disabled=${disabled === true}
                      >
                        ${step.label}
                      </button>`}
                </li>`,
            )}
          </ol>
        </nav>
      </gui-breadcrumb>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    unsubscribeAll(this.subscriptions);
  }
}

safeDefine('gui-breadcrumb-interactive', BreadcrumbElement);
