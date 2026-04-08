import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { GridProps } from '@golemui/gui-shared';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Subscription } from 'rxjs';
import { repeat } from 'lit-html/directives/repeat.js';
import { classMap } from 'lit/directives/class-map.js';

@customElement('gui-grid-layout')
export class GridElement extends LitElement implements Core.WithWidget {
  widget!: Core.LayoutWidget;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.layoutContext })
  adapter = new Lit.LayoutWidgetAdapter<GridProps>();

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
    this.classList.add('gui-grid', 'gui-field');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    const isColumn = this.adapter.templateData.direction === 'column';
    const isRow = !isColumn;
    const autoFit = this.adapter.templateData.autoFit ?? true;
    const classes = {
      'gui-grid__widget': true,
      'gui-grid__widget--row': isRow,
      'gui-grid__widget--row--auto-fit': isRow && autoFit,
      'gui-grid__widget--column': isColumn,
      'gui-grid__widget--align-center': this.adapter.templateData.align === 'center',
      'gui-grid__widget--align-start': this.adapter.templateData.align === 'start',
      'gui-grid__widget--align-end': this.adapter.templateData.align === 'end',
      'gui-grid__widget--align-space-between': this.adapter.templateData.align === 'space-between',
      'gui-grid__widget--align-space-around': this.adapter.templateData.align === 'space-around',
      'gui-grid__widget--align-space-evenly': this.adapter.templateData.align === 'space-evenly',
      'gui-grid__widget--align-stretch': !this.adapter.templateData.align || this.adapter.templateData.align === 'stretch',
      'gui-grid__widget--justify-center': this.adapter.templateData.justify === 'center',
      'gui-grid__widget--justify-start': this.adapter.templateData.justify === 'start',
      'gui-grid__widget--justify-end': this.adapter.templateData.justify === 'end',
      'gui-grid__widget--justify-stretch': this.adapter.templateData.justify === 'stretch',
    };

    const styles: string[] = [];
    if (this.adapter.templateData.columnGap !== undefined) {
      styles.push(`column-gap: ${this.adapter.templateData.columnGap}px`);
    }
    if (this.adapter.templateData.rowGap !== undefined) {
      styles.push(`row-gap: ${this.adapter.templateData.rowGap}px`);
    }

    return html`
      <div class=${classMap(classes)} id=${this.widget?.uid} style=${styles.join('; ')}>
        ${repeat(
          this.adapter.templateData.children || [],
          (child: any) => child?.uid,
          (child: any) => html`<div class="gui-grid__cell" style="grid-column: span ${child.size || 1}">
            <gui-widget .widget=${child}></gui-widget>
          </div>`,
        )}
      </div>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
