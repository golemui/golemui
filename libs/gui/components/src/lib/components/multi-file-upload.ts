import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { GuiFileUpload } from './file-upload';
import { message } from '../utils/messages';
import './pills';
import type { GuiPillEventDetail, GuiPillItem } from './pills';
import type { FileItem } from '../types';
import { fires, valueEvents, type GuiInputErrorEventDetail } from '../utils/events';

/**
 * A file upload that accepts several files, shown as pills.
 *
 * @cssprop --gui-pill-height - Height of each pill.
 * @cssprop --gui-pill-font-size - Font size of the pill text.
 * @cssprop --gui-pill-action-size - Size of the icons inside a pill.
 * @cssprop --gui-pill-action-hit - Clickable area of the buttons inside a pill.
 */
export class GuiMultiFileUpload extends GuiFileUpload {
  /** The files, when several can be uploaded. */
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
    this._removeError = null;
    this.commit([...this.getItems(), ...files.map((file) => this.createItem(file))]);
  }

  protected override getDefaultButtonLabel(): string {
    return message('uploadFiles');
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
    const removeAriaLabel = message('removeFile', this.removeAriaLabel, { name: '' }).trim();

    return html`<gui-pills
      class="gui-file-upload__pills"
      .uid=${this.uid}
      .toolbarAriaLabel=${message('uploadedFiles')}
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
      .compactAriaLabel=${message('fileCount', undefined, { count: items.length })}
      @gui-pill-remove=${this.onPillRemove}
    ></gui-pills>`;
  }

  private onPillRemove = (e: CustomEvent<GuiPillEventDetail>) => {
    if (this.disabled || this.readOnly) return;
    const item = this.getItems().find((current) => current.id === e.detail.key);
    if (item) void this.removeItem(item);
  };
}

/** The events `gui-multi-file-upload` fires, with their types. */
export const GuiMultiFileUploadEvents = {
  ...valueEvents<GuiMultiFileUpload['value']>(),
  'gui-input-error': fires<CustomEvent<GuiInputErrorEventDetail>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-multi-file-upload': GuiMultiFileUpload;
  }
}

safeDefine('gui-multi-file-upload', GuiMultiFileUpload);
