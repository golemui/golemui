import type { InputWidget, WithWidget } from '@golemui/core'
import { InputWidgetAdapter, type LitFormContext, formContext, inputContext } from '@golemui/lit'
import { type TextareaProps } from '@golemui/gui-shared';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';

@customElement('gui-textarea-input')
export class TextareaElement extends LitElement implements WithWidget {
  widget!: InputWidget<string>;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: inputContext })
  adapter = new InputWidgetAdapter<string, TextareaProps>();

  subscriptions: Subscription[] = [];

  override createRenderRoot() {
    return this;
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

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-textarea', 'gui-field');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    super.render();

    return html`
      <gui-textarea
        .uid=${this.widget.uid}
        .label=${this.adapter.templateData.label}
        .errors=${this.adapter.templateData.errors}
        ?touched=${this.adapter.templateData.touched}
        ?required=${this.adapter.templateData.validator?.required}
        ?disabled=${this.adapter.templateData.disabled}
        ?readonly=${this.adapter.templateData.readonly}
        .value=${this.adapter.templateData.value}
        .hint=${this.adapter.templateData.hint}
        .placeholder=${this.adapter.templateData.placeholder}
        .autocomplete=${this.adapter.templateData.autocomplete}
        .counterMode=${this.adapter.templateData.counterMode}
        .minimumHeight=${this.adapter.templateData.minimumHeight}
        .autoGrow=${this.adapter.templateData.autoGrow}
        .maxLength=${this.adapter.templateData.validator?.maxLength}
        @input=${this.valueChanged}
        @blur=${() => this.adapter.onBlur()}
      ></gui-textarea>
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
