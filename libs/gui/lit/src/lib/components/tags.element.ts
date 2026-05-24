import type { InputWidget, WithWidget } from '@golemui/core';
import { InputWidgetAdapter, type LitFormContext, formContext, inputContext } from '@golemui/lit';
import { type TagsProps } from '@golemui/gui-shared';
import '@golemui/gui-components/tags';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type Subscription } from 'rxjs';

@customElement('gui-tags-input')
export class TagsElement extends LitElement implements WithWidget {
  widget!: InputWidget<string[]>;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: inputContext })
  adapter = new InputWidgetAdapter<string[], TagsProps>();

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
    this.classList.add('gui-tags', 'gui-field');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    super.render();

    return html`
      <gui-tags
        .uid=${this.widget.uid}
        .label=${this.adapter.templateData.label}
        .hint=${this.adapter.templateData.hint}
        .errors=${this.adapter.templateData.errors}
        ?touched=${this.adapter.templateData.touched}
        ?required=${this.adapter.templateData.validator?.required}
        ?disabled=${this.adapter.templateData.disabled}
        ?readonly=${this.adapter.templateData.readonly}
        .value=${this.adapter.templateData.value}
        .placeholder=${this.adapter.templateData.placeholder}
        .icon=${this.adapter.templateData.icon}
        .separators=${this.adapter.templateData.separators}
        .allowDuplicates=${this.adapter.templateData.allowDuplicates ?? true}
        .trim=${this.adapter.templateData.trim ?? true}
        .limit=${this.adapter.templateData.limit}
        .removeAriaLabel=${this.adapter.templateData.removeAriaLabel}
        .removeIcon=${this.adapter.templateData.removeIcon}
        @change=${this.valueChanged}
        @blur=${() => this.adapter.onBlur()}
      ></gui-tags>
    `;
  }

  valueChanged(event: CustomEvent) {
    const value = event.detail.value as string[];
    this.adapter.valueChanged(value);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
