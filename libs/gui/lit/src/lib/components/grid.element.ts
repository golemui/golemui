import type { LayoutWidget, NonFunctionWidget, WithWidget } from '@golemui/core';
import { LayoutWidgetAdapter, type LitFormContext, formContext, layoutContext } from '@golemui/lit';
import {
  type FlexProps,
  gridCellClasses,
  gridClasses,
  type GridProps,
  resolveGrid,
} from '@golemui/gui-shared/internals';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine, unsubscribeAll } from '@golemui/lit/internals';
import { type Subscription } from 'rxjs';
import { repeat } from 'lit-html/directives/repeat.js';

/** The grid layout, and the deprecated flex layout, which renders as a grid. */
export class GridElement extends LitElement implements WithWidget {
  widget!: LayoutWidget;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: layoutContext })
  adapter = new LayoutWidgetAdapter<GridProps & FlexProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-field');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    const grid = resolveGrid(this.widget.type, this.adapter.templateData);
    const children = (this.adapter.templateData.children || []) as NonFunctionWidget<string>[];

    return html`
      <div class=${gridClasses(grid)} id=${this.widget?.uid}>
        ${repeat(
          children,
          (child) => child?.uid,
          (child) =>
            html`<div class=${gridCellClasses(grid, child.size)}>
              <gui-widget .widget=${child}></gui-widget>
            </div>`,
        )}
      </div>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    unsubscribeAll(this.subscriptions);
  }
}

safeDefine('gui-grid-layout', GridElement);
