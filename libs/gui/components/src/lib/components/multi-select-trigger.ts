import { html, LitElement, nothing, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit-html/directives/style-map.js';
import { safeDefine } from '@golemui/lit/internals';
import { GUIPillsNavigationController } from '../controllers/pills-navigation.controller';
import './pills';
import type { GuiPillItem } from './pills';

export class GuiMultiSelectTrigger extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: Boolean }) touched: boolean | undefined = false;
  @property({ type: Boolean }) required: boolean | undefined = false;
  @property({ type: Boolean }) disabled: boolean | undefined = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly: boolean | undefined = false;
  @property({ type: Array }) errors: string[] | undefined = [];
  @property({ type: Array }) pills: GuiPillItem[] = [];

  @property({ type: String }) placeholder: string | undefined = undefined;
  @property({ type: String }) icon: string | undefined = undefined;
  @property({ type: String }) autocomplete: string | undefined = undefined;
  @property({ type: Boolean, attribute: 'has-label' }) hasLabel = false;
  @property({ type: Boolean, attribute: 'has-hint' }) hasHint = false;
  @property({ type: Boolean, attribute: 'panel-open' }) panelOpen = false;
  @property({ type: String, attribute: 'panel-id' }) panelId: string | undefined = undefined;
  @property({ type: String, attribute: 'remove-aria-label' }) removeAriaLabel: string | undefined =
    undefined;
  @property({ type: String, attribute: 'remove-icon' }) removeIcon: string | undefined = undefined;
  @property({ type: String, attribute: 'compact-aria-label' }) compactAriaLabel:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'toolbar-aria-label' }) toolbarAriaLabel:
    | string
    | undefined = undefined;

  private _pendingEmptyFocus = false;

  private _pillsNav = new GUIPillsNavigationController(this, {
    getPills: () => this.querySelector('gui-pills'),
    getPillCount: () => this.pills?.length ?? 0,
    focusLinkedInput: () => this.focusInput(),
  });

  override createRenderRoot() {
    return this;
  }

  get input(): HTMLInputElement | null {
    return this.querySelector<HTMLInputElement>('input[role="combobox"]');
  }

  public focusInput() {
    this.input?.focus();
  }

  public clearInput() {
    const input = this.input;
    if (input) input.value = '';
  }

  public closePillsDropdown() {
    this.querySelector('gui-pills')?.closeDropdown();
  }

  override updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    if (!changedProperties.has('pills')) return;
    if (this._pendingEmptyFocus && (this.pills?.length ?? 0) === 0) {
      this._pillsNav.focusLinkedInputDeferred();
    }
    this._pendingEmptyFocus = false;
  }

  override render() {
    const pillItems = this.pills ?? [];

    const iconClassMap = {
      'gui-widget-icon': true,
      [this.icon as string]: !!this.icon,
    };

    return html`
      <div
        class=${classMap({
          'gui-widget-input': true,
          'gui-multi-select__field': true,
          'gui-multi-select__field--icon': !!this.icon,
        })}
        role="group"
      >
        ${this.icon
          ? html`<span
              class=${classMap(iconClassMap)}
              data-icon=${this.icon}
              aria-hidden="true"
            ></span>`
          : nothing}

        <gui-pills
          class="gui-multi-select__pills"
          style=${styleMap(pillItems.length ? {} : { 'min-width': 0 })}
          .uid=${this.uid}
          .toolbarAriaLabel=${this.toolbarAriaLabel ?? 'Selected options'}
          .items=${pillItems}
          .errors=${this.errors}
          .touched=${!!this.touched}
          .removable=${true}
          .clickable=${false}
          .bubble=${true}
          .tabbable=${false}
          ?disabled=${this.disabled}
          ?readonly=${this.readOnly}
          .removeAriaLabel=${this.removeAriaLabel ?? 'Remove option'}
          .removeIcon=${this.removeIcon}
          .compactAriaLabel=${this.compactAriaLabel ?? `${pillItems.length} selected`}
          @pillremove=${this.onPillRemove}
          @pillkeydown=${this._pillsNav.onPillKeydown}
          @pillexit=${this._pillsNav.onPillExit}
        ></gui-pills>

        <input
          type="text"
          role="combobox"
          id=${this.uid}
          data-cy=${`${this.uid}_textinput`}
          class="gui-multi-select__input"
          ?required=${this.required}
          ?disabled=${this.disabled}
          ?readonly=${this.readOnly}
          placeholder=${this.placeholder ?? ''}
          autocomplete=${this.autocomplete || nothing}
          aria-expanded=${this.panelOpen ? 'true' : 'false'}
          aria-controls=${this.panelId ?? nothing}
          aria-autocomplete="list"
          aria-labelledby=${this.hasLabel ? `${this.uid}_label` : nothing}
          aria-describedby=${this.hasHint ? `${this.uid}_hint` : nothing}
          @keydown=${this.onInputKeydown}
        />
      </div>
    `;
  }

  private onPillRemove = () => {
    if ((this.pills?.length ?? 0) <= 1) {
      this._pendingEmptyFocus = true;
    }
  };

  private onInputKeydown = (e: KeyboardEvent) => {
    if (this.disabled || this.readOnly) return;

    const input = e.target as HTMLInputElement;
    const count = this.pills?.length ?? 0;
    if (count === 0) return;

    const caretAtStart = input.selectionStart === 0 && input.selectionEnd === 0;

    if (e.key === 'ArrowLeft' && caretAtStart) {
      e.preventDefault();
      e.stopPropagation();
      this._pillsNav.enterPillList();
      return;
    }

    if (e.key === 'Backspace' && input.value === '') {
      e.preventDefault();
      e.stopPropagation();
      this._pillsNav.enterPillList();
      return;
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-multi-select-trigger': GuiMultiSelectTrigger;
  }
}

safeDefine('gui-multi-select-trigger', GuiMultiSelectTrigger);
