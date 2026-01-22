import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { RepeaterProps } from '@golemui/shared-vanilla';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { repeat } from 'lit-html/directives/repeat.js';
import { customElement, property } from 'lit/decorators.js';
import { Subscription } from 'rxjs';

@customElement('gui-repeater-control')
export class RepeaterElement extends LitElement implements Core.WithField {
  field!: Core.ControlField<Record<string, unknown>[]>;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.controlContext })
  adapter = new Lit.ControlFieldAdapter<Record<string, unknown>[], RepeaterProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-repeater');
    this.adapter.context = this.formContext;
    this.adapter.init(this.field);

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
                  <gui-repeater-field
                    .repeaterIndex=${index}
                    .field=${this.adapter.templateData.template}
                  ></gui-repeater-field>
                  <button type="button" class="gui-button" @click=${() => this.removeItem(index)}>
                    ${this.adapter.templateData.removeLabel ?? 'Remove'}
                  </button>
                </div>
              `,
            )
          : nothing}

        <button
          type="button"
          class="gui-button"
          @click=${() => this.addItem()}
          ?disabled=${!!(
            this.adapter.templateData.limit &&
            this.adapter.templateData.limit === this.adapter.templateData.value?.length
          )}
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

  private addItem() {
    this.adapter.valueChanged([...(this.adapter.templateData.value ?? []), {}]);
    this.requestUpdate();
  }

  private removeItem(index: number) {
    const arr = [...(this.adapter.templateData.value ?? [])];
    arr.splice(index, 1);
    this.adapter.valueChanged(arr);
    this.requestUpdate();
  }
}
