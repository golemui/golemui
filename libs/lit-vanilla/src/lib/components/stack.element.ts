import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import * as Core from '@formforge/core';
import { consume, provide } from '@lit/context';
import * as Lit from '@formforge/lit';
import { StackProps } from '@formforge/shared-vanilla';
import { Subscription } from 'rxjs';

@customElement('ff-stack')
export class StackElement extends LitElement implements Core.WithField {
  field!: Core.LayoutField;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.layoutContext })
  adapter = new Lit.LayoutAdapter<StackProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('ff-stack');
    this.adapter.context = this.formContext;
    this.adapter.init(this.field);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate())
    );
  }

  override render() {
    if (!this.adapter.templateData) return html``;

    const classes = {
      field: true,
      horizontal: this.adapter.templateData.direction === 'horizontal',
    };

    return html`
      <div class=${classes.horizontal ? 'field horizontal' : 'field'} id=${this.field?.uid}>
        ${this.adapter.templateData.children.map(
          (child: any) => html`<ff-field .field=${child}></ff-field>`,
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
