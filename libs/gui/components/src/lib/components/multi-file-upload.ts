import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit/internals';
import type { FileItem } from '@golemui/gui-shared/internals';
import { GuiFileUpload } from './file-upload';
import { MULTI_FILE_UPLOAD_BUTTON_LABEL, formatFileMessage } from '../utils/messages';
import { FILE_REMOVE_ARIA_LABEL } from '../utils/messages';
import './pills';
import type { GuiPillEventDetail, GuiPillItem } from './pills';

export class GuiMultiFileUpload extends GuiFileUpload {
  @property({ type: Array }) values: FileItem[] | undefined = [];

  protected override isMultiple(): boolean {
    return true;
  }

  protected override getItems(): FileItem[] {
    return Array.isArray(this.values) ? this.values : [];
  }

  protected override commit(items: FileItem[]) {
    this.values = items;
    this.emitChange(items);
  }

  protected override acceptFiles(files: File[]) {
    if (files.length === 0) return;
    this.commit([...this.getItems(), ...files.map((file) => this.createItem(file))]);
  }

  protected override getDefaultButtonLabel(): string {
    return MULTI_FILE_UPLOAD_BUTTON_LABEL;
  }

  protected override renderCounter(item: FileItem): string {
    const items = this.getItems();
    const position = items.findIndex((current) => current.id === item.id) + 1;
    return `${position}/${items.length} · ${this._pct}%`;
  }

  protected override renderUploaded(items: FileItem[]) {
    if (items.length === 0) return nothing;
    const pillItems: GuiPillItem[] = items.map((item) => ({
      key: item.id,
      label: item.name,
      busy: this._removingIds.has(item.id),
    }));
    const removeAriaLabel = formatFileMessage(
      this.removeAriaLabel ?? FILE_REMOVE_ARIA_LABEL,
      '',
    ).trim();

    return html`<gui-pills
      class="gui-file-upload__pills"
      .uid=${this.uid}
      .toolbarAriaLabel=${'Uploaded files'}
      .items=${pillItems}
      .errors=${this.errors}
      .touched=${!!this.touched}
      .removable=${!this.readOnly}
      .clickable=${false}
      .bubble=${true}
      .tabbable=${true}
      ?disabled=${this.disabled}
      ?readonly=${this.readOnly}
      .removeAriaLabel=${removeAriaLabel}
      .removeIcon=${this.removeIcon}
      .compactAriaLabel=${`${items.length} files`}
      @pillremove=${this.onPillRemove}
    ></gui-pills>`;
  }

  private onPillRemove = (e: CustomEvent<GuiPillEventDetail>) => {
    if (this.disabled || this.readOnly) return;
    const item = this.getItems().find((current) => current.id === e.detail.key);
    if (item) void this.removeItem(item);
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-multi-file-upload': GuiMultiFileUpload;
  }
}

safeDefine('gui-multi-file-upload', GuiMultiFileUpload);
