import type { InputWidget, WithWidget } from '@golemui/core';
import { InputWidgetAdapter, type LitFormContext, formContext, inputContext } from '@golemui/lit';
import type { MarkdownProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/markdown';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine, unsubscribeAll } from '@golemui/lit/internals';
import { type Subscription } from 'rxjs';

export class MarkdownElement extends LitElement implements WithWidget {
  widget!: InputWidget<string>;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: inputContext })
  adapter = new InputWidgetAdapter<string, MarkdownProps>();

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
    this.classList.add('gui-markdown', 'gui-field');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    super.render();

    return html`
      <gui-markdown
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
        .tools=${this.adapter.templateData.tools}
        .headingTitle=${this.adapter.templateData.headingTitle}
        .boldTitle=${this.adapter.templateData.boldTitle}
        .italicTitle=${this.adapter.templateData.italicTitle}
        .strikethroughTitle=${this.adapter.templateData.strikethroughTitle}
        .quoteTitle=${this.adapter.templateData.quoteTitle}
        .linkTitle=${this.adapter.templateData.linkTitle}
        .orderedListTitle=${this.adapter.templateData.orderedListTitle}
        .unorderedListTitle=${this.adapter.templateData.unorderedListTitle}
        .splitViewTitle=${this.adapter.templateData.splitViewTitle}
        .toolbarAriaLabel=${this.adapter.templateData.toolbarAriaLabel}
        .defaultOpenPreview=${this.adapter.templateData.defaultOpenPreview}
        .maxLength=${this.adapter.templateData.validator?.maxLength}
        .dependencies=${this.adapter.templateData.deps}
        @input=${this.valueChanged}
        @blur=${() => this.adapter.onBlur()}
      ></gui-markdown>
    `;
  }

  valueChanged(event: CustomEvent) {
    const value = event.detail.value;
    this.adapter.valueChanged(value);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    unsubscribeAll(this.subscriptions);
  }
}

safeDefine('gui-markdown-input', MarkdownElement);
