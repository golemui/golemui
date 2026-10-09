import { html, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { live } from 'lit/directives/live.js';
import { repeat } from 'lit/directives/repeat.js';
import { cspStyleMap, safeDefine } from '@golemui/lit-utils';
import './list';
import type { GuiList } from './list';
import { updateListItems } from './list-items';
import { GUIAriaController } from '../controllers/aria.controller';
import { GUIFocusLeaveController } from '../controllers/focus-leave.controller';
import { GUIPopupController } from '../controllers/popup.controller';
import { GuiFormControl } from '../gui-form-control';
import type { ListItem, ListItemInput, OptionValue } from '../types';
import { dispatch, dispatchBlur, dispatchValue, fires, valueEvents } from '../utils/events';
import { itemContent, type GuiItemRenderer, type GuiItemState } from '../utils/item-content';
import { itemLabel, searchItems } from '../utils/items';
import { requiredName } from '../utils/messages';
import { addErrors, addIcon, addLabel, addPickerPanel } from '../utils/templates';

/** The detail of `gui-filter`: what the user typed to search the items. */
export type GuiFilterEventDetail = { query: string };

/**
 * A text field that searches a list of items and picks one, with a virtualized popup list.
 *
 * Typing filters the items. With `remote-filter`, the dropdown only reports what was typed with
 * `gui-filter`, and shows `items` as you give them: load the matching items yourself.
 *
 * @fires gui-input - The user picked an item, or cleared the field. `detail.value` is the new
 *   value.
 * @fires gui-change - The user picked an item, or cleared the field. `detail.value` is the new
 *   value.
 * @fires gui-blur - Focus left the control.
 * @fires gui-filter - The user typed to search the items, after `input-debounce`. `detail.query` is
 *   the text, `''` when the search is cleared.
 */
export class GuiDropdown extends GuiFormControl {
  /** The value of the selected item. */
  @property({ type: String }) value: OptionValue | undefined = undefined;
  /**
   * The items: values, which are both the text and the value, or objects read through
   * `label-field` and `value-field`. An object with `disabled: true` can't be picked.
   */
  @property({ type: Array }) items: ListItemInput[] = [];
  /** For items given as objects, the key of the text to show. `label` by default. */
  @property({ type: String, attribute: 'label-field' }) labelField: string | undefined = undefined;
  /** For items given as objects, the key of the value. `value` by default. */
  @property({ type: String, attribute: 'value-field' }) valueField: string | undefined = undefined;
  /**
   * For items given as objects, the keys the search looks in. By default `label-field` and
   * `value-field`, or every key when neither is set.
   */
  @property({ type: Array, attribute: 'search-fields' }) searchFields: string[] | undefined =
    undefined;
  /**
   * The search is the app's: the dropdown shows `items` as they are and reports what the user
   * types with `gui-filter`.
   */
  @property({ type: Boolean, attribute: 'remote-filter' }) remoteFilter = false;
  /** Milliseconds to wait after the last keystroke before searching. */
  @property({ type: Number, attribute: 'input-debounce' }) inputDebounce = 500;
  /**
   * Renders the content of each option, instead of its text. It gets the item and the option's
   * state with Lit's `html`, and returns a template, a text or a node.
   */
  @property({ attribute: false }) renderItem: GuiItemRenderer | undefined = undefined;

  /** Text shown while the field is empty. */
  @property({ type: String }) placeholder: string | undefined = undefined;
  /** Icon class name shown inside the control, for example from an icon font. */
  @property({ type: String }) icon: string | undefined = undefined;
  /** The `autocomplete` hint passed to the inner text field. */
  @property({ type: String }) autocomplete: string | undefined = undefined;
  /** Accessible name of the button that opens the list. An empty value keeps the default. */
  @property({ type: String, attribute: 'toggle-aria-label' }) toggleAriaLabel: string | undefined =
    undefined;
  /** Height of each item, in pixels. */
  @property({ type: Number, attribute: 'item-height' }) itemHeight: number | undefined = undefined;
  /** Height of the list, in pixels. It scrolls past it. */
  @property({ type: Number }) height: number | undefined = undefined;

  // What the user typed, and whether the field shows it instead of the selected item's text.
  @state() protected query = '';
  @state() protected editing = false;
  // The query the items are filtered by: `query` once the debounce settles.
  @state() private searchedQuery = '';
  @state() private range = { startIndex: 0, endIndex: 10 };
  @state() protected focusedIndex = -1;

  /** Every item, normalized. */
  protected allItems: ListItem<unknown>[] = [];
  /** The items the list shows: every item, or the ones that match the search. */
  protected shownItems: ListItemInput[] = [];
  protected listItems: ListItem<unknown>[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | undefined = undefined;
  // Whether the app was told about a search, so it hears when the search clears.
  private reportedQuery = false;

  protected popup = new GUIPopupController(this, {
    focusRestoreSelector: 'input[role="combobox"]',
    isDisabled: () => !!this.disabled,
    // The panel opens from focus and from the toggle button, not from clicks on the field.
    clickIntent: () => 'ignore',
    keyToggleMode: 'toggle',
    beforeOpen: () => this.beforeOpen(),
    onOpenChanged: (open) => {
      if (open) {
        this.updateComplete.then(() => this.list?.scrollToSelectedIndex());
      } else {
        this.resetQuery();
      }
    },
  });

  private focusLeave = new GUIFocusLeaveController(this, {
    onLeave: () => dispatchBlur(this),
  });

  private ariaController = new GUIAriaController(this, {
    requiresLabel: true,
    getTargets: () => this.ariaTargets(),
    getState: () => ({
      uid: this.uid,
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
    this.classList.add(this.fieldClass, 'gui-field');
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.debounceTimer);
  }

  /** The class the stylesheet styles the element by. */
  protected get fieldClass() {
    return 'gui-dropdown';
  }

  /** The text field the user types in. */
  protected get input(): HTMLInputElement | null {
    return this.querySelector<HTMLInputElement>('input[role="combobox"]');
  }

  protected get list(): GuiList | null {
    return this.querySelector<GuiList>(`[id="${this.uid}-list"]`);
  }

  protected ariaTargets(): HTMLElement | null {
    return this.input;
  }

  override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has('items') || changed.has('valueField')) {
      this.allItems = updateListItems(this.items ?? [], { valueField: this.valueField });
    }
    // Only when they change: new arrays would make the list report its range again, and that
    // report renders the dropdown again.
    const searchChanged = [
      'items',
      'valueField',
      'labelField',
      'searchFields',
      'remoteFilter',
    ].some((name) => changed.has(name));
    if (this.hasUpdated && !searchChanged && !changed.has('searchedQuery')) return;
    const searching = !this.remoteFilter && this.searchedQuery !== '';
    this.shownItems = searching
      ? searchItems(this.items ?? [], this.searchedQuery, this)
      : (this.items ?? []);
    this.listItems = searching
      ? updateListItems(this.shownItems, { valueField: this.valueField })
      : this.allItems;
  }

  override render() {
    const open = this.popup.open;
    const icon = addIcon('dropdown', { icon: this.icon });

    return html`
      ${addLabel(this.uid, { label: this.label, hint: this.hint, required: this.required })}

      <div
        class="gui-widget"
        @keydown=${this.onWidgetKeyDown}
        @focusout=${this.focusLeave.onFocusOut}
      >
        ${this.renderField(open, icon)}
        <button
          type="button"
          class="gui-dropdown__arrow"
          aria-label=${requiredName('showOptions', this.toggleAriaLabel)}
          aria-haspopup="listbox"
          aria-expanded=${open ? 'true' : 'false'}
          aria-controls=${`${this.uid}-list`}
          ?disabled=${this.disabled}
          @mousedown=${this.onToggleMouseDown}
          @click=${this.onToggleClick}
        >
          <span class="gui-caret" aria-hidden="true"></span>
        </button>
        ${addPickerPanel(
          this.uid,
          { errors: this.errors, touched: this.touched, showErrors: true },
          this.renderList(open ? this.renderVisibleOptions() : nothing),
          { hidden: !open },
        )}
      </div>

      ${addErrors(this.uid, { errors: this.errors, touched: this.touched })}
    `;
  }

  /** The field the user types in, with the selected item's text while not searching. */
  protected renderField(open: boolean, icon: ReturnType<typeof addIcon>): unknown {
    const selected = this.allItems.find((item) => item.value === this.value);
    const text = selected
      ? itemLabel(selected.template, this.labelField)
      : this.value != null
        ? String(this.value)
        : '';

    return html`${icon.html}
      <input
        type="text"
        role="combobox"
        id=${this.uid}
        data-cy=${`${this.uid}_textinput`}
        class=${classMap({ 'gui-widget-input': true, ...icon.widgetClasses })}
        .value=${live(this.editing ? this.query : text)}
        ?disabled=${this.disabled}
        ?readonly=${this.readOnly}
        placeholder=${this.placeholder ?? nothing}
        autocomplete=${this.autocomplete || nothing}
        aria-expanded=${open ? 'true' : 'false'}
        aria-controls=${`${this.uid}-list`}
        aria-autocomplete="list"
        @keydown=${this.onInputKeyDown}
        @input=${this.onInput}
        @focus=${this.onInputFocus}
      />`;
  }

  /** The list in the panel, holding the options. */
  protected renderList(options: unknown): unknown {
    return html`<gui-list
      id=${`${this.uid}-list`}
      .uid=${this.uid}
      .label=${this.label}
      .items=${this.shownItems}
      .valueField=${this.valueField}
      .value=${live(this.value)}
      .itemHeight=${this.itemHeight}
      .height=${this.height}
      ?disabled=${this.disabled}
      ?readonly=${this.readOnly}
      @gui-range-change=${this.onRangeChange}
      @gui-focus-change=${this.onFocusChange}
      @gui-update-items=${this.stop}
      @gui-input=${this.onListInput}
      @gui-change=${this.stop}
      @gui-blur=${this.stop}
      >${options}</gui-list
    >`;
  }

  /** The options in view, and five more on each side: the list virtualizes the rest. */
  private renderVisibleOptions() {
    const { startIndex, endIndex } = this.range;
    const height = `${this.itemHeight ?? 40}px`;
    const renderer = this.renderItem ?? this.defaultRenderer;

    return repeat(
      this.listItems.slice(startIndex, endIndex),
      (item) => item.value,
      (item, offset) => {
        const index = startIndex + offset;
        const state: GuiItemState = {
          index,
          selected: this.isSelected(item.value),
          focused: index === this.focusedIndex,
          disabled: !!this.disabled || !!item.disabled,
        };

        return html`<div
          role="option"
          tabindex="-1"
          class="gui-list__item-wrapper"
          id=${`${this.uid}-item-${index}`}
          style=${cspStyleMap({ height })}
          aria-selected=${state.selected ? 'true' : 'false'}
          aria-disabled=${state.disabled ? 'true' : 'false'}
          @click=${() => this.onOptionClick(item, index)}
        >
          <div
            class=${classMap({
              'gui-list__item': true,
              'gui-list__item-selected': state.selected,
              'gui-list__item-focused': state.focused,
              'gui-list__item-disabled': state.disabled,
            })}
          >
            ${this.renderOptionPrefix()}
            <div class="gui-list__item-content" ${itemContent(renderer, item, state)}></div>
          </div>
        </div>`;
      },
    );
  }

  /** What an option shows before its content. */
  protected renderOptionPrefix(): unknown {
    return nothing;
  }

  private defaultRenderer: GuiItemRenderer = (item) => itemLabel(item.template, this.labelField);

  protected isSelected(value: OptionValue): boolean {
    return value === this.value;
  }

  /** The user picked an item: it becomes the value, and the panel closes. */
  protected pick(item: ListItem<unknown>, _index: number) {
    if (this.disabled || this.readOnly || item.disabled) return;
    this.value = item.value as OptionValue;
    dispatchValue(this, this.value);
    this.popup.restoreFocusToInput();
    this.popup.close();
  }

  /** The user emptied the field and pressed Enter: the value clears. */
  protected clear() {
    if (this.disabled || this.readOnly || this.value == null) return;
    this.value = undefined;
    dispatchValue(this, null);
    this.popup.close();
  }

  /** Runs before the panel opens. */
  protected beforeOpen() {
    // Nothing to do before the single dropdown opens.
  }

  private onOptionClick(item: ListItem<unknown>, index: number) {
    this.pick(item, index);
  }

  /** The list picked its active item, from the keyboard. */
  private onListInput(event: CustomEvent<{ value: OptionValue }>) {
    event.stopPropagation();
    const item = this.listItems.find((candidate) => candidate.value === event.detail.value);
    if (item) this.pick(item, this.listItems.indexOf(item));
  }

  /** The list's own events stay inside the dropdown. */
  protected stop = (event: Event) => event.stopPropagation();

  protected onRangeChange(event: CustomEvent<{ startIndex: number; endIndex: number }>) {
    event.stopPropagation();
    const { startIndex, endIndex } = event.detail;
    if (startIndex !== this.range.startIndex || endIndex !== this.range.endIndex) {
      this.range = { startIndex, endIndex };
    }
  }

  protected onFocusChange(event: CustomEvent<{ index: number }>) {
    event.stopPropagation();
    this.focusedIndex = event.detail.index;
  }

  /** Escape closes the panel and returns focus to the field. */
  private onWidgetKeyDown = (event: KeyboardEvent) => {
    this.popup.onAnchorKeyDown(event);
  };

  /** Arrow down moves into the list. Enter in an empty field clears the value. */
  protected onInputKeyDown = async (event: KeyboardEvent) => {
    if (event.key === 'Enter' && this.input?.value === '') {
      this.clear();
      return;
    }
    if (event.key !== 'ArrowDown') return;
    event.preventDefault();
    this.popup.show();
    await this.updateComplete;
    this.list?.focus();
  };

  protected onInput = (event: Event) => {
    if (this.readOnly) return;
    this.query = (event.target as HTMLInputElement).value;
    this.editing = true;
    this.popup.show();
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.search(this.query), this.inputDebounce);
  };

  protected onInputFocus = () => {
    this.popup.show();
  };

  private search(query: string) {
    this.searchedQuery = query;
    // The search is reported even when the dropdown filters by itself: the app may track it.
    if (query || this.reportedQuery) {
      dispatch<GuiFilterEventDetail>(this, 'gui-filter', { query });
    }
    this.reportedQuery = query !== '';
  }

  /** Back to the selected item's text: the panel closed or an item was picked. */
  protected resetQuery() {
    clearTimeout(this.debounceTimer);
    this.query = '';
    this.editing = false;
    if (this.searchedQuery || this.reportedQuery) this.search('');
  }

  // Focus stays in the field while the toggle button is pressed.
  private onToggleMouseDown = (event: MouseEvent) => event.preventDefault();

  private onToggleClick = (event: Event) => {
    event.stopPropagation();
    if (this.popup.open) {
      this.popup.restoreFocusToInput();
      this.popup.close();
    } else {
      this.popup.show();
      this.input?.focus();
    }
  };
}

/** The events `gui-dropdown` fires, with their types. */
export const GuiDropdownEvents = {
  ...valueEvents<GuiDropdown['value'] | null>(),
  'gui-filter': fires<CustomEvent<GuiFilterEventDetail>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-dropdown': GuiDropdown;
  }
}

safeDefine('gui-dropdown', GuiDropdown);
