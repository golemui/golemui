import * as Core from '@golemui/core';
import * as Lit from '@golemui/lit';
import { TextinputProps } from '@golemui/shared-vanilla';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Subscription } from 'rxjs';

@customElement('gui-textinput-input')
export class TextinputElement extends LitElement implements Core.WithWidget {
  widget!: Core.InputWidget<string>;

  @consume({ context: Lit.formContext })
  @property({ attribute: false })
  formContext!: Lit.LitFormContext<any>;

  @provide({ context: Lit.inputContext })
  adapter = new Lit.InputWidgetAdapter<string, TextinputProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-textinput');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

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
      <gui-textinput
        .uid=${this.widget.uid}
        .label=${this.adapter.templateData.label}
        .hint=${this.adapter.templateData.hint}
        .errors=${this.adapter.templateData.errors}
        ?touched=${this.adapter.templateData.touched}
        ?required=${this.adapter.templateData.validator?.required}
        ?disabled=${this.adapter.templateData.disabled}
        ?readonly=${this.adapter.templateData.readonly}
        .value=${this.adapter.templateData.value}
        .icon=${this.adapter.templateData.icon}
        .placeholder=${this.adapter.templateData.placeholder}
        @input=${this.valueChanged}
        @blur=${() => this.adapter.onBlur()}
      ></gui-textinput>
    `;
  }

  valueChanged(event: CustomEvent) {
    const value = event.detail.value;
    this.adapter.valueChanged(value);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
