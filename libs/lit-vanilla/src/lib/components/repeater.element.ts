import * as Core from '@formforge/core';
import * as Lit from '@formforge/lit';
import { consume, provide } from '@lit/context';
import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { RepeaterProps } from '@formforge/shared-vanilla';
import { repeat } from 'lit-html/directives/repeat.js';
import { Subscription } from 'rxjs';

@customElement('ff-repeater')
export class RepeaterElement extends LitElement implements Core.WithField {
  field!: Core.ControlField<Record<string, unknown>[]>;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.controlContext })
  adapter = new Lit.ControlAdapter<Record<string, unknown>[], RepeaterProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('ff-repeater');
    this.adapter.context = this.formContext;
    this.adapter.init(this.field);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  addItem() {
    this.adapter.valueChanged([...(this.adapter.templateData.value ?? []), {}]);
    this.requestUpdate();
  }

  removeItem(index: number) {
    const arr = [...(this.adapter.templateData.value ?? [])];
    arr.splice(index, 1);
    this.adapter.valueChanged(arr);
    this.requestUpdate();
  }

  override render() {
    super.render();

    return html`
      <div id=${this.field.uid}>
        <h2>${this.adapter.templateData.label}</h2>

        ${this.adapter.templateData.value
          ? repeat(
              this.adapter.templateData.value,
              (field) => field['uid'],
              (field, index) => html`
                <div class="card">
                  <ff-repeater-field
                    .repeaterIndex=${index}
                    .field=${this.adapter.templateData.template}
                  ></ff-repeater-field>
                  <button type="button" class="ff-button" @click=${() => this.removeItem(index)}>
                    ${this.adapter.templateData.removeLabel ?? 'Remove'}
                  </button>
                </div>
              `,
            )
          : nothing}

        <button
          type="button"
          class="ff-button"
          @click=${() => this.addItem()}
          disabled=${this.adapter.templateData.limit &&
          this.adapter.templateData.limit === this.adapter.templateData.value?.length
            ? true
            : nothing}
        >
          ${this.adapter.templateData.addLabel ?? 'Add'}
        </button>
      </div>
    `;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
