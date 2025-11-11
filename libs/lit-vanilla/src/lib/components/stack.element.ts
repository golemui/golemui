import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import * as Core from '@golemui/core';
import { consume, provide } from '@lit/context';
import * as Lit from '@golemui/lit';
import { StackProps } from '@golemui/shared-vanilla';
import { Subscription } from 'rxjs';

@customElement('gui-stack')
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
    this.classList.add('gui-stack');
    this.adapter.context = this.formContext;
    this.adapter.init(this.field);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    if (!this.adapter.templateData) return html``;

    const classes = {
      field: true,
      horizontal: this.adapter.templateData.direction === 'horizontal',
    };

    return html`
      <div
        class=${classes.horizontal ? 'gui-field gui-field--horizontal' : 'gui-field'}
        id=${this.field?.uid}
      >
        ${this.adapter.templateData.children.map(
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
