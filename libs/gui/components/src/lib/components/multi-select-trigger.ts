import { html, nothing, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { booleanAttribute } from '../utils/converters';
import { classMap } from 'lit/directives/class-map.js';
import { cspStyleMap } from '@golemui/lit-utils';
import { safeDefine } from '@golemui/lit-utils';
import { GUIAriaController } from '../controllers/aria.controller';
import { GUIPillsNavigationController } from '../controllers/pills-navigation.controller';
import './pills';
import type { GuiPillEventDetail, GuiPillItem, GuiPillsDropdownEventDetail } from './pills';
import { GuiElement } from '../gui-element';
import { message, requiredName } from '../utils/messages';
import { fires } from '../utils/events';

/**
 * The field of a multi-select dropdown: the selected options as pills and a search input. A
 * building block of GolemUI Forms.
 *
 * @fires gui-pill-remove - The user removed a selected option from its pill. `detail.key` is the
 *   pill's key.
 * @fires gui-dropdown-toggle - The count bubble opened or closed its dropdown. `detail.open` is the
 *   new state.
 * @cssprop --gui-pill-height - Height of each pill.
 * @cssprop --gui-pill-font-size - Font size of the pill text.
 * @cssprop --gui-pill-action-size - Size of the icons inside a pill.
 * @cssprop --gui-pill-action-hit - Clickable area of the buttons inside a pill.
 */
export class GuiMultiSelectTrigger extends GuiElement {
  /** Whether that field was touched. */
  @property({ converter: booleanAttribute }) touched: boolean | undefined = undefined;
  /** Whether that field is required. */
  @property({ converter: booleanAttribute }) required: boolean | undefined = false;
  /** Disables the trigger. */
  @property({ converter: booleanAttribute }) disabled: boolean | undefined = false;
  /** Shows the selection without letting the user change it. */
  @property({ attribute: 'readonly', converter: booleanAttribute }) readOnly: boolean | undefined =
    false;
  /** Errors of the field the trigger belongs to. */
  @property({ type: Array }) errors: string[] | undefined = [];
  /** @internal */
  @property({ type: Array }) pills: GuiPillItem[] = [];

  /** Text shown while nothing is selected. */
  @property({ type: String }) placeholder: string | undefined = undefined;
  /** Icon class name shown inside the trigger. */
  @property({ type: String }) icon: string | undefined = undefined;
  /** The `autocomplete` hint of the search field. */
  @property({ type: String }) autocomplete: string | undefined = undefined;
  /** @internal */
  @property({ attribute: 'has-label', converter: booleanAttribute }) hasLabel: boolean | undefined =
    false;
  /** @internal */
  @property({ attribute: 'has-hint', converter: booleanAttribute }) hasHint: boolean | undefined =
    false;
  /** @internal */
  @property({ attribute: 'panel-open', converter: booleanAttribute }) panelOpen:
    | boolean
    | undefined = false;
  /** @internal */
  @property({ type: String, attribute: 'panel-id' }) panelId: string | undefined = undefined;
  /** Accessible name of each remove button. An empty value keeps the default. */
  @property({ type: String, attribute: 'remove-aria-label' }) removeAriaLabel: string | undefined =
    undefined;
  /** Icon class name of the remove buttons. */
  @property({ type: String, attribute: 'remove-icon' }) removeIcon: string | undefined = undefined;
  /**
   * Accessible name of the count shown when the options do not fit. `{count}` is the number
   * selected. An empty value keeps the default.
   */
  @property({ type: String, attribute: 'compact-aria-label' }) compactAriaLabel:
    | string
    | undefined = undefined;
  /** Accessible name of the selected options. An empty value removes it. */
  @property({ type: String, attribute: 'toolbar-aria-label' }) toolbarAriaLabel:
    | string
    | undefined = undefined;

  private _pendingEmptyFocus = false;

  private _aria = new GUIAriaController(this, {
    getTargets: () => {
      const field = this.querySelector<HTMLElement>('.gui-multi-select__field');
      const input = this.input;
      return [field, input].filter((el): el is HTMLElement => !!el);
    },
    getState: () => ({
      uid: this.uid,
      templateData: {
        hint: this.hasHint ? `${this.uid}_hint` : undefined,
        errors: this.errors,
        readonly: this.readOnly,
        disabled: this.disabled,
        touched: this.touched,
        required: this.required,
      },
    }),
  });

  private _pillsNav = new GUIPillsNavigationController(this, {
    getPills: () => this.querySelector('gui-pills'),
    getPillCount: () => this.pills?.length ?? 0,
    focusLinkedInput: () => this.focusInput(),
  });

  override createRenderRoot() {
    return this;
  }

  /** @internal */
  get input(): HTMLInputElement | null {
    return this.querySelector<HTMLInputElement>('input[role="combobox"]');
  }

  /** @internal */
  public focusInput() {
    this.input?.focus();
  }

  /** @internal */
  public clearInput() {
    const input = this.input;
    if (input) input.value = '';
  }

  /** @internal */
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

    // Of the pills' events, gui-pill-remove and gui-dropdown-toggle pass through as the trigger's
    // own. The navigation controller stops gui-pill-keydown and gui-pill-exit, and the pills fire
    // no other event unless clickable or editable.
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
          style=${cspStyleMap(pillItems.length ? {} : { 'min-width': 0 })}
          .uid=${this.uid}
          .toolbarAriaLabel=${message('selectedOptions', this.toolbarAriaLabel)}
          .items=${pillItems}
          .errors=${this.errors}
          .touched=${this.touched}
          .removable=${true}
          .clickable=${false}
          .bubble=${true}
          .tabbable=${false}
          ?disabled=${this.disabled}
          ?readonly=${this.readOnly}
          .removeAriaLabel=${requiredName('removeOption', this.removeAriaLabel)}
          .removeIcon=${this.removeIcon}
          .compactAriaLabel=${requiredName('selectedCount', this.compactAriaLabel, {
            count: pillItems.length,
          })}
          @gui-pill-remove=${this.onPillRemove}
          @gui-pill-keydown=${this._pillsNav.onPillKeydown}
          @gui-pill-exit=${this._pillsNav.onPillExit}
        ></gui-pills>

        <input
          type="text"
          role="combobox"
          id=${this.uid}
          data-cy=${`${this.uid}_textinput`}
          class="gui-multi-select__input"
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

/** The events `gui-multi-select-trigger` fires, with their types. */
export const GuiMultiSelectTriggerEvents = {
  'gui-pill-remove': fires<CustomEvent<GuiPillEventDetail>>(),
  'gui-dropdown-toggle': fires<CustomEvent<GuiPillsDropdownEventDetail>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-multi-select-trigger': GuiMultiSelectTrigger;
  }
}

safeDefine('gui-multi-select-trigger', GuiMultiSelectTrigger);
