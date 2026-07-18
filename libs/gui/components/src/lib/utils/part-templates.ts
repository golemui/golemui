import { html, nothing, type TemplateResult } from 'lit';
import { live } from 'lit/directives/live.js';
import { repeat } from 'lit-html/directives/repeat.js';
import type { GUIPartsController } from '../controllers/parts.controller';
import type { DateTimePartDescriptor, DateTimePartType } from './parts';

/**
 * Pure lit-html templates for the segmented date/time part inputs, extracted
 * from the render layer of `AbstractDateTimeInput` (renderGroupParts /
 * renderPartInput / renderDayPeriodToggle / renderLiteral). The emitted DOM is
 * byte-identical to the abstract's: same classes, data-type/data-group
 * attributes, aria wiring and the LTR time-cluster grouping inside RTL rows.
 * Event handling is delegated to a {@link GUIPartsController}; everything
 * host-specific arrives through {@link GUIPartsTemplateData}.
 */

export interface GUIPartsTemplateData {
  /** BEM block class (the abstract's `inputBlockClass`), e.g. 'gui-date-input'. */
  blockClass: string;
  /**
   * The part groups (the abstract's `groups`). More than one group keys the
   * repeat directives per group and stamps `data-group` on every part.
   */
  groups: readonly string[];
  /**
   * The locale's format parts for a group (the abstract's `getFormatParts()`),
   * e.g. `getDateFormatParts(localeId)`.
   */
  formatParts: Intl.DateTimeFormatPart[];
  /** Descriptor lookup by part type (the abstract's `getPartDescriptor`). */
  getDescriptor(type: string): DateTimePartDescriptor | undefined;
  /**
   * Value shown inside a part input (the abstract's `getPartDisplayValue`).
   * Pass `controller.getPartDisplay` for the default stored-value display
   * (with the optional dayPeriod label mapping).
   */
  getDisplayValue(group: string, type: DateTimePartType): string;
  required: boolean | undefined;
  disabled: boolean | undefined;
  /** The effective parts-readonly state (the abstract's `partsReadonly`). */
  partsReadonly: boolean;
  /**
   * Accessible name for the dayPeriod toggle (the abstract's
   * `dayPeriodAriaLabel()`). Omitted: 'AM/PM', the English default no input
   * overrides.
   */
  dayPeriodAriaLabel?: string;
}

/**
 * A literal format part (the abstract's renderLiteral): a separator span.
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
 * One group's part inputs interleaved with their literal separators (the
 * abstract's renderGroupParts). Parts are keyed for `repeat` per group when
 * multiple groups exist; the first part of the first group gets tabindex 0.
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
 * A single part (the abstract's renderPartInput): a numeric segment input in
 * its touch target, or the dayPeriod toggle for dayPeriod descriptors.
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

  return html`
    <div class="gui-parts__touch-target ${block}__touch-target">
      <input
        type="text"
        inputmode="numeric"
        class="gui-parts__part ${block}__part ${modifierClass}"
        data-type=${type}
        data-group=${data.groups.length > 1 ? group : nothing}
        maxlength=${descriptor.maxLength}
        placeholder=${descriptor.placeholder}
        tabindex=${tabIndex}
        ?required=${data.required}
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
 * The dayPeriod part (the abstract's renderDayPeriodToggle): a toggle button,
 * not a free-text input — clicking it (or Enter/Space natively) swaps AM and
 * PM. A typed shortcut cannot work across locales (e.g. Japanese 午前/午後
 * share their first character) and mobile keyboards have no arrow keys, so
 * the switch interaction is the one that works everywhere.
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
