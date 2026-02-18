import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { FlexProps } from '@golemui/shared-vanilla';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Subscription } from 'rxjs';
import { repeat } from 'lit-html/directives/repeat.js';
import { classMap } from 'lit/directives/class-map.js';

@customElement('gui-flex-layout')
export class FlexElement extends LitElement implements Core.WithWidget {
  widget!: Core.LayoutWidget;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.layoutContext })
  adapter = new Lit.LayoutWidgetAdapter<FlexProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-flex');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
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

  override render() {
    const classes = {
      'gui-flex__widget': true,
      'gui-flex__widget--horizontal': this.adapter.templateData.direction === 'horizontal',
      'gui-flex__widget--align-start': this.adapter.templateData.align === 'start',
      'gui-flex__widget--align-end': this.adapter.templateData.align === 'end',
      'gui-flex__widget--align-center': this.adapter.templateData.align === 'center',
      'gui-flex__widget--align-space-between': this.adapter.templateData.align === 'space-between',
      'gui-flex__widget--align-space-around': this.adapter.templateData.align === 'space-around',
    };

    return html`
      <div class=${classMap(classes)} id=${this.widget?.uid}>
        ${repeat(
          this.adapter.templateData.children || [],
          (child: any) => child?.uid,
          (child: any) => html`<gui-widget .widget=${child}></gui-widget>`,
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
