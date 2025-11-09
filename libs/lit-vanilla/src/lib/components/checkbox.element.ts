import * as Core from '@formforge/core';
import * as Lit from '@formforge/lit';
import { consume, provide } from '@lit/context';
import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { CheckboxProps } from '@formforge/shared-vanilla';
import { Subscription } from 'rxjs';

@customElement('ff-checkbox')
export class CheckboxElement extends LitElement implements Core.WithField {
  field!: Core.ControlField<string>;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.controlContext })
  adapter = new Lit.ControlAdapter<string, CheckboxProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('ff-checkbox');
    this.adapter.context = this.formContext;
    this.adapter.init(this.field);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    super.render();

    if (this.adapter.templateData.checkboxPosition === 'left') {
      this.classList.add('ff-checkbox--left');
    } else if (this.classList.contains('ff-checkbox--left')) {
      this.classList.remove('ff-checkbox--left');
    }

    return html`
      <label for=${this.field.uid}>
        ${this.adapter.templateData.label + (this.adapter.templateData.required ? ' *' : '')}
      </label>

      <div class="ff-field">
        <input
          type="checkbox"
          id=${this.field.uid}
          checked=${this.adapter.templateData.value ? true : nothing}
          ?disabled=${this.adapter.templateData.disabled || nothing}
          ?readonly=${this.adapter.templateData.readonly || nothing}
          @click="${() => this.valueChanged(event)}"
          aria-required=${this.adapter.templateData.required || nothing}
          aria-readonly=${this.adapter.templateData.readonly || nothing}
          aria-checked=${this.adapter.templateData.value ? true : nothing}
        />
      </div>
    `;
  }

  valueChanged(event: Event | undefined) {
    const target = event?.target as HTMLInputElement;
    this.adapter.valueChanged(target.checked);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
