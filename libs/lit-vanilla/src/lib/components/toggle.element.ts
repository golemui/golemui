import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { GUIAriaController, ToggleProps } from '@golemui/shared-vanilla';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Subscription } from 'rxjs';
import { addLabel } from '../utils/templates';

@customElement('gui-toggle-control')
export class ToggleElement extends LitElement implements Core.WithField {
  field!: Core.ControlField<boolean>;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.controlContext })
  adapter = new Lit.ControlFieldAdapter<boolean, ToggleProps>();

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
    this.classList.add('gui-toggle');
    this.adapter.context = this.formContext;
    this.adapter.init(this.field);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    super.render();

    if (this.adapter.templateData.togglePosition === 'left') {
      this.classList.add('gui-toggle--left');
    } else if (this.classList.contains('gui-toggle--left')) {
      this.classList.remove('gui-toggle--left');
    }

    return html`
      ${addLabel(this.field.uid, this.adapter.templateData, true)}

      <div class="gui-field gui-field--horizontal gui-toggle--switch">
        <input
          type="checkbox"
          id=${this.field.uid}
          data-cy=${`${this.field.uid}_toggle`}
          ?checked=${this.adapter.templateData.value}
          ?required=${this.adapter.templateData.validator?.required}
          ?disabled=${this.adapter.templateData.disabled || nothing}
          ?readonly=${this.adapter.templateData.readonly || nothing}
          @click="${() => !this.adapter.templateData.readonly && this.valueChanged(event)}"
        />

        <span class="gui-toggle--slider" role="presentation"></span>
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
