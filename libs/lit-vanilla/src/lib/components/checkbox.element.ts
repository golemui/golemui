import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { CheckboxProps } from '@golemui/shared-vanilla';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Subscription } from 'rxjs';
import { addLabel } from '../utils/templates';
import { GUIAriaController } from '../controllers/aria.controller';

@customElement('gui-checkbox')
export class CheckboxElement extends LitElement implements Core.WithField {
  field!: Core.ControlField<string>;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.controlContext })
  adapter = new Lit.ControlFieldAdapter<string, CheckboxProps>();

  private ariaController = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`input[id="${this.field.uid}"]`),
    getState: () => ({
      uid: this.field.uid,
      templateData: this.adapter.templateData,
    }),
  });

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
        <input
          type="checkbox"
          id=${this.field.uid}
          data-cy=${`${this.field.uid}_checkbox`}
          checked=${this.adapter.templateData.value ?? nothing}
          required=${this.adapter.templateData.validator?.required ? '' : nothing}
          ?disabled=${this.adapter.templateData.disabled || nothing}
          ?readonly=${this.adapter.templateData.readonly || nothing}
          @click="${() => !this.adapter.templateData.readonly && this.valueChanged(event)}"
          @blur="${() => this.adapter.onBlur()}"
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
