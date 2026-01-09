import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { RadiogroupProps } from '@golemui/shared-vanilla';
import { consume, provide } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Subscription } from 'rxjs';

@customElement('gui-radiogroup-control')
export class RadiogroupElement extends LitElement implements Core.WithField {
  field!: Core.ControlField<string>;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.controlContext })
  adapter = new Lit.ControlFieldAdapter<string, RadiogroupProps>();

  protected optionsLoading = false;
  protected hasMatchingValue = false;

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-radiogroup');
    this.adapter.context = this.formContext;
    this.adapter.init(this.field);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    super.render();

    return html`
      <gui-radiogroup
        .uid=${this.field.uid}
        .label=${this.adapter.templateData.label}
        ?touched=${this.adapter.templateData.touched}
        .errors=${this.adapter.templateData.errors}
        ?disabled=${this.adapter.templateData.disabled || nothing}
        ?readonly=${this.adapter.templateData.readonly || nothing}
        .value=${this.adapter.templateData.value ?? ''}
        .hint=${this.adapter.templateData.hint}
        .options=${this.adapter.templateData.options}
        .labelField=${this.adapter.templateData.labelField || nothing}
        .valueField=${this.adapter.templateData.valueField || nothing}
        @change="${() => this.valueChanged(event)}"
        @blur="${() => this.adapter.onBlur()}"
      ></gui-radiogroup>
    `;
  }

  valueChanged(event: Event | undefined) {
    const value = (event as CustomEvent).detail.value;
    this.adapter.valueChanged(value);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
