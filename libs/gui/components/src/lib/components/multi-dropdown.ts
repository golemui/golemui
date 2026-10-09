import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { safeDefine } from '@golemui/lit-utils';
import './multi-list';
import './multi-select-trigger';
import type { GuiMultiSelectTrigger } from './multi-select-trigger';
import type { GuiPillEventDetail, GuiPillsDropdownEventDetail } from './pills';
import { GuiDropdown, type GuiFilterEventDetail } from './dropdown';
import type { ListItem, OptionValue } from '../types';
import { dispatchValue, fires, valueEvents } from '../utils/events';
import { selectedPills } from '../utils/items';
import type { addIcon } from '../utils/templates';

/**
 * A text field that searches a list of items and picks several, shown as pills. Its value is
 * `values`; the inherited `value` is not used.
 *
 * @fires gui-input - The user picked or removed an item. `detail.value` is the new `values`.
 * @fires gui-change - The user picked or removed an item. `detail.value` is the new `values`.
 * @fires gui-blur - Focus left the control.
 * @fires gui-filter - The user typed to search the items, after `input-debounce`. `detail.query` is
 *   the text, `''` when the search is cleared.
 * @cssprop --gui-pill-height - Height of each pill.
 * @cssprop --gui-pill-font-size - Font size of the pill text.
 * @cssprop --gui-pill-action-size - Size of the icons inside a pill.
 * @cssprop --gui-pill-action-hit - Clickable area of the buttons inside a pill.
 */
export class GuiMultiDropdown extends GuiDropdown {
  /** The values of the selected items. */
  @property({ type: Array }) values: OptionValue[] | undefined = [];
  /** Accessible name of each pill's remove button. An empty value keeps the default. */
  @property({ type: String, attribute: 'remove-aria-label' }) removeAriaLabel: string | undefined =
    undefined;
  /** Icon class name of the pills' remove buttons. */
  @property({ type: String, attribute: 'remove-icon' }) removeIcon: string | undefined = undefined;

  protected override get controlValue(): unknown {
    return this.values;
  }

  protected override set controlValue(values: unknown) {
    this.values = values as OptionValue[] | undefined;
  }

  protected override get fieldClass() {
    return 'gui-multi-dropdown';
  }

  private get trigger(): GuiMultiSelectTrigger | null {
    return this.querySelector('gui-multi-select-trigger');
  }

  protected override ariaTargets(): HTMLElement | null {
    // The trigger marks its own field and input.
    return null;
  }

  private get currentValues(): OptionValue[] {
    return Array.isArray(this.values) ? this.values : [];
  }

  protected override renderField(open: boolean, _icon: ReturnType<typeof addIcon>): unknown {
    const pills = selectedPills(this.currentValues, this.allItems, this.labelField, this.listItems);

    return html`<gui-multi-select-trigger
      .uid=${this.uid}
      .pills=${pills}
      .errors=${this.errors}
      .touched=${this.touched}
      ?required=${this.required}
      ?disabled=${this.disabled}
      ?readonly=${this.readOnly}
      .placeholder=${this.placeholder ?? ''}
      .icon=${this.icon}
      .autocomplete=${this.autocomplete}
      .hasLabel=${!!this.label}
      .hasHint=${!!this.hint}
      .panelOpen=${open}
      .panelId=${`${this.uid}-list`}
      .removeAriaLabel=${this.removeAriaLabel}
      .removeIcon=${this.removeIcon}
      @keydown=${this.onInputKeyDown}
      @input=${this.onInput}
      @focusin=${this.onTriggerFocusIn}
      @gui-pill-remove=${this.onPillRemove}
      @gui-dropdown-toggle=${this.onPillsDropdownToggle}
    ></gui-multi-select-trigger>`;
  }

  protected override renderList(options: unknown): unknown {
    return html`<gui-multi-list
      id=${`${this.uid}-list`}
      .uid=${this.uid}
      .label=${this.label}
      .items=${this.shownItems}
      .valueField=${this.valueField}
      .values=${live(this.currentValues)}
      .itemHeight=${this.itemHeight}
      .height=${this.height}
      ?disabled=${this.disabled}
      ?readonly=${this.readOnly}
      @gui-range-change=${this.onRangeChange}
      @gui-focus-change=${this.onFocusChange}
      @gui-update-items=${this.stop}
      @gui-item-toggle=${this.onItemToggle}
      @gui-input=${this.stop}
      @gui-change=${this.stop}
      @gui-blur=${this.stop}
      >${options}</gui-multi-list
    >`;
  }

  protected override renderOptionPrefix(): unknown {
    return html`<span class="gui-list__item-check" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 256 256">
        <path
          d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"
        ></path>
      </svg>
    </span>`;
  }

  protected override isSelected(value: OptionValue): boolean {
    return this.currentValues.includes(value);
  }

  /** The user picked an item: it's added to `values`, or taken out. The panel stays open. */
  protected override pick(item: ListItem<unknown>, index: number) {
    if (this.disabled || this.readOnly || item.disabled) return;
    this.toggle(item.value as OptionValue);
    this.focusedIndex = index;
    this.list?.focusItemAtIndex(index);
  }

  protected override clear() {
    // Pills are removed one by one, from their remove buttons or the keyboard.
  }

  protected override beforeOpen() {
    this.trigger?.closePillsDropdown();
  }

  private toggle(value: OptionValue) {
    const values = this.currentValues;
    this.values = values.includes(value)
      ? values.filter((current) => current !== value)
      : [...values, value];
    dispatchValue(this, this.values);
  }

  /** The list toggled its active item, from the keyboard. */
  private onItemToggle(event: CustomEvent<{ value: OptionValue }>) {
    event.stopPropagation();
    if (this.disabled || this.readOnly) return;
    this.toggle(event.detail.value);
  }

  /** Focus entering the search field opens the panel, not focus on a pill. */
  private onTriggerFocusIn = (event: FocusEvent) => {
    if (event.target === this.trigger?.input) this.popup.show();
  };

  private onPillRemove(event: CustomEvent<GuiPillEventDetail>) {
    event.stopPropagation();
    const value = this.currentValues.find((current) => String(current) === event.detail.key);
    if (value !== undefined) this.toggle(value);
  }

  /** The pills' own dropdown, the overflow list, opened: the panel closes. */
  private onPillsDropdownToggle(event: CustomEvent<GuiPillsDropdownEventDetail>) {
    event.stopPropagation();
    if (event.detail?.open) this.popup.close();
  }
}

/** The events `gui-multi-dropdown` fires, with their types. */
export const GuiMultiDropdownEvents = {
  ...valueEvents<GuiMultiDropdown['values']>(),
  'gui-filter': fires<CustomEvent<GuiFilterEventDetail>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-multi-dropdown': GuiMultiDropdown;
  }
}

safeDefine('gui-multi-dropdown', GuiMultiDropdown);
