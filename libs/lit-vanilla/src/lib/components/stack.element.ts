import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { StackProps } from '@golemui/shared-vanilla';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Subscription } from 'rxjs';
import { repeat } from 'lit-html/directives/repeat.js';

@customElement('gui-stack-layout')
export class StackElement extends LitElement implements Core.WithField {
  field!: Core.LayoutField;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.layoutContext })
  adapter = new Lit.LayoutFieldAdapter<StackProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-stack');
    this.adapter.context = this.formContext;
    this.adapter.init(this.field);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    const classes = {
      horizontal: this.adapter.templateData.direction === 'horizontal',
    };

    return html`
      <div
        class=${classes.horizontal
          ? 'gui-stack__field gui-stack__field--horizontal'
          : 'gui-stack__field'}
        id=${this.field?.uid}
      >
        ${repeat(
          this.adapter.templateData.children || [],
          (child: any) => child?.uid,
          (child: any) => html`<gui-field .field=${child}></gui-field>`,
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
