import { html, nothing, type TemplateResult } from 'lit';
import { live } from 'lit/directives/live.js';
import { repeat } from 'lit-html/directives/repeat.js';
import type { GUIPartsController } from '../controllers/parts.controller';
import {
  PART_DEFAULT_ARIA_LABELS,
  type DateTimePartDescriptor,
  type DateTimePartType,
} from './parts';

export interface GUIPartsTemplateData {
  /** BEM block class, e.g. 'gui-date-input'. */
  blockClass: string;
  /** The part groups, e.g. 'start' and 'end' */
  groups: readonly string[];
  /** The locale's format parts for a group, e.g. `getDateFormatParts(localeId)`. */
  formatParts: Intl.DateTimeFormatPart[];
  /** Descriptor lookup by part type. */
  getDescriptor(type: string): DateTimePartDescriptor | undefined;
  /** Value shown inside a part input. */
  getDisplayValue(group: string, type: DateTimePartType): string;
  disabled: boolean | undefined;
  /** The effective parts-readonly state. */
  partsReadonly: boolean;
  /** Accessible name for the dayPeriod toggle. Omitted: 'AM/PM'. */
  dayPeriodAriaLabel?: string;
  /**
   * Accessible name for a numeric part input. Omitted: the part type's
   * English default ('Day', 'Month', ...).
   */
  getPartAriaLabel?(group: string, type: DateTimePartType): string;
}

/**
 * A literal format part: a separator span.
 *
 * @param {Intl.DateTimeFormatPart} part - The literal part.
 * @param {string} blockClass - The input's BEM block class.
 * @return {TemplateResult} The separator span.
 */
export const renderPartLiteral = (
  part: Intl.DateTimeFormatPart,
  blockClass: string,
): TemplateResult => {
  return html`<span class="${blockClass}__separator">${part.value}</span>`;
};

/**
 * One group's part inputs interleaved with their literal separators.
 * When the format contains time parts, the hour..minute/second span is wrapped
 * in an always-LTR time cluster so an RTL row keeps `hour:minute` order.
 *
 * @param {string} group - The group to render.
 * @param {GUIPartsTemplateData} data - Host-specific render data.
 * @param {GUIPartsController} controller - The parts controller handling events.
 * @return {unknown} The renderable (a repeat directive or a template).
 */
export function renderGroupParts(
  group: string,
  data: GUIPartsTemplateData,
  controller: GUIPartsController,
): unknown {
  const parts = data.formatParts;
  const multiGroup = data.groups.length > 1;

  const keyOf = (part: Intl.DateTimeFormatPart) =>
    multiGroup ? `${group}-${part.type}` : part.type;
  const renderPart = (part: Intl.DateTimeFormatPart, index: number) => {
    if (part.type === 'literal') {
      return renderPartLiteral(part, data.blockClass);
    }

    const descriptor = data.getDescriptor(part.type);
    if (!descriptor) return '';

    const tabIndex = group === data.groups[0] && index === 0 ? 0 : -1;
    return renderPartInput(group, descriptor, tabIndex, data, controller);
  };

  const isTimePart = (part: Intl.DateTimeFormatPart) =>
    part.type === 'hour' || part.type === 'minute' || part.type === 'second';
  const first = parts.findIndex(isTimePart);
  if (first === -1) {
    return repeat(parts, keyOf, renderPart);
  }
  let last = parts.length - 1;
  while (!isTimePart(parts[last])) last--;

  return html`
    ${repeat(parts.slice(0, first), keyOf, renderPart)}
    <div class="gui-parts__time-cluster ${data.blockClass}__time-cluster" dir="ltr">
      ${repeat(parts.slice(first, last + 1), keyOf, (part, i) => renderPart(part, first + i))}
    </div>
    ${repeat(parts.slice(last + 1), keyOf, (part, i) => renderPart(part, last + 1 + i))}
  `;
}

/**
 * A single part: a numeric segment input in its touch target, or the dayPeriod
 * toggle for dayPeriod descriptors.
 *
 * @param {string} group - The part's group.
 * @param {DateTimePartDescriptor} descriptor - The part descriptor.
 * @param {number} tabIndex - 0 for the widget's first part, -1 otherwise.
 * @param {GUIPartsTemplateData} data - Host-specific render data.
 * @param {GUIPartsController} controller - The parts controller handling events.
 * @return {TemplateResult} The part template.
 */
export function renderPartInput(
  group: string,
  descriptor: DateTimePartDescriptor,
  tabIndex: number,
  data: GUIPartsTemplateData,
  controller: GUIPartsController,
): TemplateResult {
  const block = data.blockClass;
  const type = descriptor.type;

  if (descriptor.kind === 'dayPeriod') {
    return renderDayPeriodToggle(group, descriptor, tabIndex, data, controller);
  }

  const modifierClass = type === 'year' ? `gui-parts__year ${block}__year` : '';
  const displayValue = data.getDisplayValue(group, type);
  const numericValue = parseInt(displayValue, 10);

  return html`
    <div class="gui-parts__touch-target ${block}__touch-target">
      <input
        type="text"
        inputmode="numeric"
        role="spinbutton"
        class="gui-parts__part ${block}__part ${modifierClass}"
        data-type=${type}
        data-group=${data.groups.length > 1 ? group : nothing}
        maxlength=${descriptor.maxLength}
        placeholder=${descriptor.placeholder}
        tabindex=${tabIndex}
        aria-label=${data.getPartAriaLabel?.(group, type) ?? PART_DEFAULT_ARIA_LABELS[type]}
        aria-valuemin=${descriptor.min}
        aria-valuemax=${descriptor.max}
        aria-valuenow=${isNaN(numericValue) ? nothing : numericValue}
        ?disabled=${data.disabled}
        ?readonly=${data.partsReadonly}
        autocomplete="off"
        .value=${live(data.getDisplayValue(group, type))}
        @keydown=${(e: KeyboardEvent) => controller.handleKeyDown(e, group, type)}
        @keyup=${(e: KeyboardEvent) => controller.handleKeyUp(e, group, type)}
        @focus=${controller.handleFocus}
        @blur=${(e: FocusEvent) => controller.handleBlur(e, group, type)}
        @change=${(e: Event) => controller.handleChange(e, group, type)}
      />
      <div class="gui-parts__visual-underline ${block}__visual-underline"></div>
    </div>
  `;
}

/**
 * The dayPeriod part: a toggle button, clicking it (or Enter/Space natively)
 * swaps AM and PM. A typed shortcut cannot work across locales (e.g. Japanese 午前/午後
 * share their first character) and mobile keyboards have no arrow keys, so
 * the switch interaction is the one that works everywhere.
 *
 * TODO: Avoid Enter/Intro here so users have to switch with spacebar?? Better for UX
 *
 * @param {string} group - The part's group.
 * @param {DateTimePartDescriptor} descriptor - The dayPeriod descriptor.
 * @param {number} tabIndex - 0 for the widget's first part, -1 otherwise.
 * @param {GUIPartsTemplateData} data - Host-specific render data.
 * @param {GUIPartsController} controller - The parts controller handling events.
 * @return {TemplateResult} The toggle template.
 */
export function renderDayPeriodToggle(
  group: string,
  descriptor: DateTimePartDescriptor,
  tabIndex: number,
  data: GUIPartsTemplateData,
  controller: GUIPartsController,
): TemplateResult {
  const block = data.blockClass;
  const type = descriptor.type;

  return html`
    <div class="gui-parts__touch-target ${block}__touch-target">
      <button
        type="button"
        class="gui-parts__part gui-parts__dayperiod ${block}__part ${block}__dayperiod"
        data-type=${type}
        data-group=${data.groups.length > 1 ? group : nothing}
        tabindex=${tabIndex}
        ?disabled=${data.disabled}
        aria-label=${data.dayPeriodAriaLabel ?? 'AM/PM'}
        @click=${() => controller.toggleDayPeriod(group, type)}
        @keydown=${controller.handleDayPeriodKeyDown}
        @keyup=${(e: KeyboardEvent) => controller.handleKeyUp(e, group, type)}
        @focus=${controller.handleFocus}
        @blur=${(e: FocusEvent) => controller.handleBlur(e, group, type)}
      >
        ${data.getDisplayValue(group, type)}
      </button>
      <div class="gui-parts__visual-underline ${block}__visual-underline"></div>
    </div>
  `;
}
