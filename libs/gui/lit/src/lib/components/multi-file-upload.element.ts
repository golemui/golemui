import type { InputWidget, WithWidget } from '@golemui/core';
import { InputWidgetAdapter, type LitFormContext, formContext, inputContext } from '@golemui/lit';
import type { Dependencies, FileItem, MultiFileUploadProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/multi-file-upload';
import { consume, provide } from '@lit/context';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine, unsubscribeAll } from '@golemui/lit/internals';
import { type Subscription } from 'rxjs';

export class MultiFileUploadElement extends LitElement implements WithWidget {
  widget!: InputWidget<FileItem[]>;

  @consume({ context: formContext })
  @property({ attribute: false })
  formContext!: LitFormContext<any>;

  @provide({ context: inputContext })
  adapter = new InputWidgetAdapter<FileItem[], MultiFileUploadProps>();

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
    this.classList.add('gui-multi-file-upload', 'gui-field');
    this.adapter.context = this.formContext;
    this.adapter.init(this.widget);

    this.subscriptions.push(
      this.adapter.templateDataChanged$.subscribe(() => this.requestUpdate()),
    );
  }

  override render() {
    super.render();
    const templateData = this.adapter.templateData;

    return html`
      <gui-multi-file-upload
        .uid=${this.widget.uid}
        .path=${this.widget.path}
        .label=${templateData.label}
        .hint=${templateData.hint}
        .errors=${templateData.errors}
        ?touched=${templateData.touched}
        ?required=${templateData.validator?.required}
        ?disabled=${templateData.disabled}
        ?readonly=${templateData.readonly}
        .values=${templateData.value ?? []}
        .dependencies=${templateData.deps as Dependencies}
        .icon=${templateData.icon}
        .accept=${templateData.accept}
        .maxSize=${templateData.maxSize}
        .buttonLabel=${templateData.buttonLabel}
        .removeAriaLabel=${templateData.removeAriaLabel}
        .cancelAriaLabel=${templateData.cancelAriaLabel}
        .retryLabel=${templateData.retryLabel}
        .removeIcon=${templateData.removeIcon}
        .maxSizeMessage=${templateData.maxSizeMessage}
        .acceptMessage=${templateData.acceptMessage}
        .missingServiceMessage=${templateData.missingServiceMessage}
        .uploadedMessage=${templateData.uploadedMessage}
        .removedMessage=${templateData.removedMessage}
        .failedMessage=${templateData.failedMessage}
        @change=${this.valueChanged}
        @blur=${() => this.adapter.onBlur()}
      ></gui-multi-file-upload>
    `;
  }

  valueChanged(event: CustomEvent) {
    const value = event.detail.value as FileItem[];
    this.adapter.valueChanged(value);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.adapter.destroy();
    unsubscribeAll(this.subscriptions);
  }
}

safeDefine('gui-multi-file-upload-input', MultiFileUploadElement);
