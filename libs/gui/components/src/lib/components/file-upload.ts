import { html, LitElement, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { safeDefine } from '@golemui/lit/internals';
import type { Dependencies, FileItem, FileUploadProps } from '@golemui/gui-shared/internals';
import { GUIAriaController } from '../controllers/aria.controller';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';
import { ARROW_CLOCKWISE_PATH, UPLOAD_PATH, X_CIRCLE_PATH, spinnerIcon } from '../utils/icons';
import { clampPct, errorMessage, matchesAccept, newId } from '../utils/file-upload';
import {
  FILE_CANCEL_ARIA_LABEL,
  FILE_FAILED_MESSAGE,
  FILE_REMOVE_ARIA_LABEL,
  FILE_REMOVE_FAILED_MESSAGE,
  FILE_REMOVED_MESSAGE,
  FILE_RETRY_ARIA_LABEL,
  FILE_TOO_LARGE_MESSAGE,
  FILE_TYPE_NOT_ACCEPTED_MESSAGE,
  FILE_UPLOAD_BUTTON_LABEL,
  FILE_UPLOAD_FAILED_MESSAGE,
  FILE_UPLOADED_MESSAGE,
  MISSING_UPLOAD_SERVICE_MESSAGE,
  formatFileMessage,
} from '../utils/messages';

export class GuiFileUpload extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  /** The form data path, forwarded to `uploadService.upload` as `ctx.path`. */
  @property({ type: String }) path: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: Array }) errors: string[] | undefined = [];
  @property({ type: Boolean }) touched: boolean | undefined = false;
  @property({ type: Boolean }) required: boolean | undefined = false;
  @property({ type: Boolean }) disabled: boolean | undefined = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly: boolean | undefined = false;
  @property({ type: Object }) value: FileItem | null | undefined = null;
  @property({ type: Object }) dependencies: Dependencies | undefined = undefined;

  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: String }) icon: string | undefined = undefined;
  @property({ type: Array }) accept: string[] | undefined = undefined;
  @property({ type: Number }) maxSize: number | undefined = undefined;
  @property({ type: String, attribute: 'button-label' }) buttonLabel: string | undefined =
    undefined;
  @property({ type: String, attribute: 'remove-aria-label' }) removeAriaLabel: string | undefined =
    undefined;
  @property({ type: String, attribute: 'cancel-aria-label' }) cancelAriaLabel: string | undefined =
    undefined;
  @property({ type: String, attribute: 'retry-aria-label' }) retryAriaLabel: string | undefined =
    undefined;
  @property({ type: String, attribute: 'remove-icon' }) removeIcon: string | undefined = undefined;
  @property({ type: String, attribute: 'retry-icon' }) retryIcon: string | undefined = undefined;
  @property({ type: String, attribute: 'max-size-message' }) maxSizeMessage: string | undefined =
    undefined;
  @property({ type: String, attribute: 'accept-message' }) acceptMessage: string | undefined =
    undefined;
  @property({ type: String, attribute: 'missing-service-message' }) missingServiceMessage:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'uploaded-message' }) uploadedMessage: string | undefined =
    undefined;
  @property({ type: String, attribute: 'removed-message' }) removedMessage: string | undefined =
    undefined;
  @property({ type: String, attribute: 'failed-message' }) failedMessage: string | undefined =
    undefined;

  /** Progress of the active upload, 0..100. */
  @state() protected _pct = 0;
  /** Ids whose `uploadService.remove()` is in flight (reassigned, never mutated). */
  @state() protected _removingIds: ReadonlySet<string> = new Set();
  /** A rejected `uploadService.remove`, shown in the bar until retried. */
  @state() protected _removeError: { id: string; message: string } | null = null;
  @state() protected _announcement = '';
  @state() protected _dragover = false;

  /** The picked `File`s, kept only while retry is possible. Never emitted. */
  protected _files = new Map<string, File>();
  protected _abort: AbortController | null = null;
  /** Id of the item whose upload is in flight; reactive so the bar switches to progress mode. */
  @state() protected _activeId: string | null = null;
  private _serviceErrorLogged = false;

  private ariaController = new GUIAriaController(this, {
    getTargets: () => this.querySelector('.gui-file-upload__box') as HTMLElement | null,
    getState: () => ({
      uid: this.uid as string,
      templateData: {
        hint: this.hint,
        errors: this.errors,
        readonly: this.readOnly,
        disabled: this.disabled,
        touched: this.touched,
        required: this.required,
      },
    }),
  });

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-field');
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._abort?.abort();
    this._abort = null;
    this._activeId = null;
  }

  // ─── Value access (overridden by the multi variant) ──────────────────────

  protected isMultiple(): boolean {
    return false;
  }

  protected getItems(): FileItem[] {
    return this.value ? [this.value] : [];
  }

  protected commit(items: FileItem[]) {
    const next = items[0] ?? null;
    this.value = next;
    this.emitChange(next);
  }

  protected emitChange(value: unknown) {
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Adds picked or dropped files. The single widget replaces its current
   * file: an in-flight upload is aborted and an uploaded file is removed on
   * the server in the background (the user's intent is the new file, so the
   * new upload is not held back by that call).
   */
  protected acceptFiles(files: File[]) {
    const file = files[0];
    if (!file) return;

    const previous = this.getItems()[0];
    if (previous) {
      if (previous.id === this._activeId) {
        this.abortActive();
      } else if (previous.status === 'uploaded') {
        this.getService()
          ?.remove?.(previous)
          .catch((err) => console.warn('[gui-file-upload] remove failed', err));
      }
      this._files.delete(previous.id);
    }
    this._removeError = null;
    this.commit([this.createItem(file)]);
  }

  protected getDefaultButtonLabel(): string {
    return FILE_UPLOAD_BUTTON_LABEL;
  }

  /** The text on the right of the bar while uploading. */
  protected renderCounter(_item: FileItem): string {
    return `${this._pct}%`;
  }

  /** Uploaded items rendered outside the bar — nothing for the single widget. */
  protected renderUploaded(_items: FileItem[]): TemplateResult | typeof nothing {
    return nothing;
  }

  // ─── Queue ───────────────────────────────────────────────────────────────

  /**
   * The item shown in the bar. The single widget always shows its one item
   * there (name + remove once uploaded); the multi widget shows a failed
   * removal first, else the first item not yet uploaded.
   */
  protected getBarItem(): FileItem | undefined {
    const items = this.getItems();
    if (!this.isMultiple()) return items[0];
    if (this._removeError) {
      const failed = items.find((item) => item.id === this._removeError?.id);
      if (failed) return failed;
    }
    return items.find((item) => item.status !== 'uploaded');
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    this.pumpQueue();
    this.syncInputError();
  }

  private _lastInputError: string | null = null;

  private syncInputError() {
    const item = this.getBarItem();
    const message =
      this._removeError?.message ??
      (item?.status === 'error' ? (item.error ?? FILE_UPLOAD_FAILED_MESSAGE) : null);
    if (message === this._lastInputError) return;
    this._lastInputError = message;
    this.dispatchEvent(
      new CustomEvent('inputError', { detail: { message }, bubbles: true, composed: true }),
    );
  }

  /**
   * Starts the next upload when nothing is in flight. Driven by every value
   * change. Only the FIRST item that is not uploaded may start: a failed item
   * ahead of it pauses the queue until it is retried or removed.
   */
  private pumpQueue() {
    if (this._activeId || !this.getService()) return;
    const next = this.getItems().find((item) => item.status !== 'uploaded');
    if (next?.status === 'uploading' && this._files.has(next.id)) {
      void this.startUpload(next);
    }
  }

  private async startUpload(item: FileItem) {
    const file = this._files.get(item.id);
    const service = this.getService();
    if (!file || !service) return;

    const controller = new AbortController();
    this._abort = controller;
    this._activeId = item.id;
    this._pct = 0;

    try {
      const data = await service.upload(file, {
        id: item.id,
        path: this.path ?? '',
        onProgress: (pct) => {
          if (this._activeId === item.id) this._pct = clampPct(pct);
        },
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      this._files.delete(item.id);
      this.finishActive(item.id);
      this.updateItem(item.id, (current) => ({
        id: current.id,
        name: current.name,
        size: current.size,
        type: current.type,
        status: 'uploaded',
        data,
      }));
      this.announce(formatFileMessage(this.uploadedMessage ?? FILE_UPLOADED_MESSAGE, item.name));
    } catch (err) {
      if (controller.signal.aborted) return;
      this.finishActive(item.id);
      this.updateItem(item.id, (current) => ({
        ...current,
        status: 'error',
        error: errorMessage(err, FILE_UPLOAD_FAILED_MESSAGE),
      }));
      this.announce(formatFileMessage(this.failedMessage ?? FILE_FAILED_MESSAGE, item.name));
    }
  }

  private finishActive(id: string) {
    if (this._activeId !== id) return;
    this._activeId = null;
    this._abort = null;
    this._pct = 0;
  }

  private abortActive() {
    this._abort?.abort();
    this._abort = null;
    this._activeId = null;
    this._pct = 0;
  }

  /** Recomputes from the CURRENT items so a late resolution never clobbers newer state. */
  protected updateItem(id: string, patch: (current: FileItem) => FileItem) {
    let found = false;
    const items = this.getItems().map((item) => {
      if (item.id !== id) return item;
      found = true;
      return patch(item);
    });
    if (found) this.commit(items);
  }

  // ─── Actions ─────────────────────────────────────────────────────────────

  protected createItem(file: File): FileItem {
    const id = newId();
    const rejection = this.checkFile(file);
    if (rejection) {
      return {
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'error',
        error: rejection,
      };
    }
    this._files.set(id, file);
    return { id, name: file.name, size: file.size, type: file.type, status: 'uploading' };
  }

  /** Pre-upload gates against the `File`; returns the reason when refused. */
  protected checkFile(file: File): string | undefined {
    if (this.accept && this.accept.length > 0 && !matchesAccept(file, this.accept)) {
      return this.acceptMessage ?? FILE_TYPE_NOT_ACCEPTED_MESSAGE;
    }
    if (typeof this.maxSize === 'number' && file.size > this.maxSize) {
      return this.maxSizeMessage ?? FILE_TOO_LARGE_MESSAGE;
    }
    return undefined;
  }

  protected cancel(item: FileItem) {
    if (item.id !== this._activeId) return;
    this.abortActive();
    this._files.delete(item.id);
    this.commit(this.getItems().filter((current) => current.id !== item.id));
    void this.focusAfterRemoval();
  }

  protected async removeItem(item: FileItem) {
    if (this._removingIds.has(item.id)) return;
    const service = this.getService();

    if (item.status === 'uploaded' && service?.remove) {
      this._removingIds = new Set([...this._removingIds, item.id]);
      this._removeError = null;
      try {
        await service.remove(item);
      } catch (err) {
        this._removeError = { id: item.id, message: errorMessage(err, FILE_REMOVE_FAILED_MESSAGE) };
        return;
      } finally {
        const next = new Set(this._removingIds);
        next.delete(item.id);
        this._removingIds = next;
      }
    }

    this._files.delete(item.id);
    if (this._removeError?.id === item.id) this._removeError = null;
    this.commit(this.getItems().filter((current) => current.id !== item.id));
    this.announce(formatFileMessage(this.removedMessage ?? FILE_REMOVED_MESSAGE, item.name));
    void this.focusAfterRemoval();
  }

  protected retry(item: FileItem) {
    if (this._removeError?.id === item.id) {
      void this.removeItem(item);
      return;
    }
    if (item.status !== 'error' || !this._files.has(item.id)) return;
    this.updateItem(item.id, (current) => ({
      id: current.id,
      name: current.name,
      size: current.size,
      type: current.type,
      status: 'uploading',
    }));
    void this.focusBarAction();
  }

  private async focusBarAction() {
    await this.updateComplete;
    this.querySelector<HTMLElement>(
      '.gui-file-upload__bar .gui-file-upload__action:not(.gui-file-upload__action--retry)',
    )?.focus();
  }

  protected canRetry(item: FileItem): boolean {
    return (
      this._removeError?.id === item.id || (item.status === 'error' && this._files.has(item.id))
    );
  }

  private onAction(item: FileItem) {
    if (item.id === this._activeId) {
      this.cancel(item);
    } else {
      void this.removeItem(item);
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  protected getService() {
    return this.dependencies?.uploadService;
  }

  protected isInteractive(): boolean {
    return !this.disabled && !this.readOnly && !!this.getService();
  }

  protected async announce(text: string) {
    // Clear first so repeating the same text is announced again.
    this._announcement = '';
    await this.updateComplete;
    this._announcement = text;
  }

  protected async focusAfterRemoval() {
    await this.updateComplete;
    const button = this.querySelector<HTMLElement>('.gui-file-upload__button');
    if (button) {
      button.focus();
      return;
    }
    this.querySelector<HTMLElement>('.gui-file-upload__action')?.focus();
  }

  protected openPicker() {
    if (!this.isInteractive()) return;
    this.querySelector<HTMLInputElement>('input[type="file"]')?.click();
  }

  private onInputChange = (e: Event) => {
    // The native change must not reach the wrapper, which reads `detail.value`.
    e.stopPropagation();
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length) this.acceptFiles(files);
  };

  private onDragOver = (e: DragEvent) => {
    if (!this.isInteractive()) return;
    e.preventDefault();
    this._dragover = true;
  };

  private onDragLeave = () => {
    this._dragover = false;
  };

  private onDrop = (e: DragEvent) => {
    this._dragover = false;
    if (!this.isInteractive()) return;
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files ?? []);
    if (files.length) this.acceptFiles(files);
  };

  private onFocusOut = (e: FocusEvent) => {
    const next = e.relatedTarget as Node | null;
    if (next && this.contains(next)) return;
    this.dispatchEvent(new CustomEvent('blur', { bubbles: true, composed: true }));
  };

  // ─── Rendering ───────────────────────────────────────────────────────────

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (!this.getService() && !this._serviceErrorLogged) {
      this._serviceErrorLogged = true;
      console.error(
        `[gui-file-upload] widget "${this.uid ?? ''}" has no uploadService. Provide one through the form's dependencies: { uploadService: { upload, remove? } }.`,
      );
    }
  }

  override render() {
    const items = this.getItems();
    const barItem = this.getBarItem();
    const uploaded = items.filter((item) => item.status === 'uploaded' && item.id !== barItem?.id);
    const hasService = !!this.getService();
    const showButton =
      hasService && !this.readOnly && !barItem && (this.isMultiple() || items.length === 0);

    const templateData: ControlTemplateData<FileItem[]> & FileUploadProps = {
      uid: this.uid,
      label: this.label,
      hint: this.hint,
      errors: this.errors,
      touched: this.touched,
      required: this.required,
      disabled: this.disabled,
      readonly: this.readOnly,
      value: items,
    };

    return html`
      ${this.label ? addLabel(this.uid as string, templateData, false, undefined, false) : nothing}

      <div class="gui-widget">
        <div
          class=${classMap({
            'gui-widget-input': true,
            'gui-file-upload__box': true,
            'gui-file-upload__box--icon': !!this.icon,
            'gui-file-upload__box--dragover': this._dragover,
            'gui-file-upload__box--disabled': !!this.disabled || !hasService,
            'gui-file-upload__box--readonly': !!this.readOnly,
          })}
          data-cy=${`${this.uid}_file-box`}
          role="group"
          aria-label=${this.label ?? 'File upload'}
          @dragover=${this.onDragOver}
          @dragleave=${this.onDragLeave}
          @drop=${this.onDrop}
          @focusout=${this.onFocusOut}
        >
          ${this.icon
            ? html`<span
                class=${`gui-widget-icon ${this.icon}`}
                data-icon=${this.icon}
                aria-hidden="true"
              ></span>`
            : nothing}
          ${this.renderUploaded(uploaded)} ${barItem ? this.renderBar(barItem) : nothing}
          ${showButton ? this.renderButton() : nothing}
          ${!hasService
            ? html`<div
                class="gui-file-upload__service-error"
                role="alert"
                data-cy=${`${this.uid}_file-service-error`}
              >
                ${this.missingServiceMessage ?? MISSING_UPLOAD_SERVICE_MESSAGE}
              </div>`
            : nothing}

          <input
            type="file"
            class="gui-visually-hidden gui-file-upload__input"
            id=${this.uid ?? nothing}
            data-cy=${`${this.uid}_file-input`}
            tabindex="-1"
            ?multiple=${this.isMultiple()}
            accept=${this.accept?.length ? this.accept.join(',') : nothing}
            ?disabled=${this.disabled || this.readOnly || !hasService}
            @change=${this.onInputChange}
          />
        </div>
      </div>

      <div
        class="gui-visually-hidden"
        role="status"
        aria-live="polite"
        data-cy=${`${this.uid}_file-status`}
      >
        ${this._announcement}
      </div>

      ${addErrors(this.uid as string, templateData)}
    `;
  }

  protected renderButton() {
    return html`<button
      type="button"
      class="gui-file-upload__button"
      data-cy=${`${this.uid}_file-button`}
      ?disabled=${this.disabled}
      @click=${this.openPicker}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 256 256"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d=${UPLOAD_PATH}></path>
      </svg>
      <span>${this.buttonLabel ?? this.getDefaultButtonLabel()}</span>
    </button>`;
  }

  protected renderBar(item: FileItem) {
    const uploading = item.id === this._activeId;
    const pending = item.status === 'uploading' && !uploading;
    const removing = this._removingIds.has(item.id);
    const removeFailed = this._removeError?.id === item.id;
    const showError = item.status === 'error' || removeFailed;
    const pct = uploading ? this._pct : 0;
    const meta =
      uploading || pending
        ? html`<span class="gui-file-upload__pct" data-cy=${`${this.uid}_file-pct`}>
            ${uploading ? this.renderCounter(item) : nothing}
          </span>`
        : nothing;
    const text = html`<span class="gui-file-upload__name" data-cy=${`${this.uid}_file-name`}
        >${item.name}</span
      >${meta}`;
    const actionLabel = uploading
      ? formatFileMessage(this.cancelAriaLabel ?? FILE_CANCEL_ARIA_LABEL, item.name)
      : formatFileMessage(this.removeAriaLabel ?? FILE_REMOVE_ARIA_LABEL, item.name);

    return html`<div
      class=${classMap({
        'gui-file-upload__bar': true,
        'gui-file-upload__bar--uploading': uploading,
        'gui-file-upload__bar--pending': pending,
        'gui-file-upload__bar--error': showError,
        'gui-file-upload__bar--removing': removing,
      })}
      data-cy=${`${this.uid}_file-bar`}
      data-status=${showError ? 'error' : item.status}
      style=${styleMap({ '--gui-upload-pct': `${pct}%` })}
      role=${uploading ? 'progressbar' : nothing}
      aria-valuemin=${uploading ? '0' : nothing}
      aria-valuemax=${uploading ? '100' : nothing}
      aria-valuenow=${uploading ? String(pct) : nothing}
      aria-valuetext=${uploading ? `${item.name}, ${pct}%` : nothing}
      aria-busy=${removing ? 'true' : nothing}
    >
      <span class="gui-file-upload__fill" aria-hidden="true"></span>
      <span class="gui-file-upload__text">
        <span class="gui-file-upload__text-base">${text}</span>
        <span class="gui-file-upload__text-overlay" aria-hidden="true">${text}</span>
      </span>
      ${showError && this.canRetry(item) && !this.readOnly
        ? html`<button
            type="button"
            class="gui-file-upload__action gui-file-upload__action--retry"
            data-cy=${`${this.uid}_file-retry`}
            aria-label=${formatFileMessage(this.retryAriaLabel ?? FILE_RETRY_ARIA_LABEL, item.name)}
            ?disabled=${this.disabled || removing}
            @click=${() => this.retry(item)}
          >
            ${this.retryIcon
              ? html`<span
                  class=${`gui-widget-icon ${this.retryIcon}`}
                  data-icon=${this.retryIcon}
                  aria-hidden="true"
                ></span>`
              : html`<svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 256 256"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d=${ARROW_CLOCKWISE_PATH}></path>
                </svg>`}
          </button>`
        : nothing}
      ${!this.readOnly
        ? html`<button
            type="button"
            class=${classMap({
              'gui-file-upload__action': true,
              'gui-file-upload__action--busy': removing,
            })}
            data-cy=${`${this.uid}_file-remove`}
            aria-label=${actionLabel}
            ?disabled=${this.disabled || removing}
            @click=${() => this.onAction(item)}
          >
            ${removing
              ? html`<span
                  class="gui-file-upload__spinner gui-spinner"
                  data-cy=${`${this.uid}_file-busy`}
                  aria-hidden="true"
                  >${spinnerIcon()}</span
                >`
              : this.removeIcon
                ? html`<span
                    class=${`gui-widget-icon ${this.removeIcon}`}
                    data-icon=${this.removeIcon}
                    aria-hidden="true"
                  ></span>`
                : html`<svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 256 256"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d=${X_CIRCLE_PATH}></path>
                  </svg>`}
          </button>`
        : nothing}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-file-upload': GuiFileUpload;
  }
}

safeDefine('gui-file-upload', GuiFileUpload);
