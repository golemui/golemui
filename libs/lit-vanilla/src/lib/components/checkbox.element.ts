import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { CheckboxProps } from '@golemui/shared-vanilla';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Subscription } from 'rxjs';
import { addLabel } from '../utils/templates';

@customElement('gui-checkbox-control')
export class CheckboxElement extends LitElement implements Core.WithField {
  field!: Core.ControlField<boolean>;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.controlContext })
  adapter = new Lit.ControlFieldAdapter<boolean, CheckboxProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-checkbox');
    this.adapter.context = this.formContext;
    this.adapter.init(this.field);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    super.render();

    if (this.adapter.templateData.checkboxPosition === 'left') {
      this.classList.add('gui-checkbox--left');
    } else if (this.classList.contains('gui-checkbox--left')) {
      this.classList.remove('gui-checkbox--left');
    }

    return html`
      ${addLabel(this.field.uid, this.adapter.templateData, true)}

      <div class="gui-field gui-field--horizontal">
        <gui-checkbox
          .uid=${this.field.uid}
          .hint=${this.adapter.templateData.hint ?? nothing}
          .touched=${this.adapter.templateData.touched}
          .errors=${this.adapter.templateData.errors}
          ?disabled=${this.adapter.templateData.disabled ?? nothing}
          ?readonly=${this.adapter.templateData.readonly ?? nothing}
          .value=${this.adapter.templateData.value}
          @change="${() => !this.adapter.templateData.readonly && this.valueChanged(event)}"
          @blur="${() => this.adapter.onBlur()}"
        ></gui-checkbox>
      </div>
    `;
  }

  valueChanged(event: Event | undefined) {
    const value = (event as CustomEvent)?.detail.value;
    this.adapter.valueChanged(value);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
