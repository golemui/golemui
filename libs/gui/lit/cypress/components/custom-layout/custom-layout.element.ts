import type { LayoutWidget, NonFunctionWidget, WithWidget } from '@golemui/core';
import { LayoutWidgetAdapter, type LitFormContext, formContext, layoutContext } from '@golemui/lit';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { type Subscription } from 'rxjs';

type OwnWidgetProps = {
  title?: string;
};

/** A custom layout widget that shows its `title` prop and renders its children. */
@customElement('app-custom-layout')
export class CustomLayoutElement extends LitElement implements WithWidget {
  widget!: LayoutWidget;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: layoutContext })
  adapter = new LayoutWidgetAdapter<OwnWidgetProps>();

  private subscription?: Subscription;

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);
    this.subscription = this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate());
  }

  override render() {
    const children = (this.adapter.templateData.children ?? []) as NonFunctionWidget<string>[];
    return html`<section id=${this.widget.uid} data-cy="custom-layout">
      <h4 data-cy="custom-layout-title">${this.adapter.templateData.title}</h4>
      ${repeat(
        children,
        (child) => child.uid,
        (child) => html`<gui-widget .widget=${child}></gui-widget>`,
      )}
    </section>`;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscription?.unsubscribe();
  }
}
