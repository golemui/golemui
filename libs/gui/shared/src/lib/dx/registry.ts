// ===================================================
// The gui widget set registry.
//
// Every shortcut folder exports a pure shortcut type definition
// (`createShortcutType` in its register.ts); this module is the single
// explicit place where they are registered. Registration rides on the
// value-dependency chain (registry -> formDefs -> resolveFormInput), so no
// side-effect import is needed and bundlers cannot drop it.
//
// Adding a shortcut: export its `<name>ShortcutType` from the folder's
// register.ts and add it to `guiShortcutTypes` below. See SHORTCUTS.md.
// ===================================================

import {
  createItemTypeRegistry,
  defineShortcutType as dxDefineShortcutType,
  registerShortcutType,
  type DxCommonFields,
  type GslConfigBase,
  type ShortcutItemKind,
  type ShortcutTypeConfig,
  type ShortcutTypeDefinition,
  type ShortcutTypeSelectors,
} from '@golemui/dx';

import { inputsShortcutType } from './shortcuts/inputs/register';
import { actionsShortcutType } from './shortcuts/actions/register';
import { layoutsShortcutType } from './shortcuts/layouts/register';
import { displayShortcutType } from './shortcuts/display/register';
import { calendarShortcutType } from './shortcuts/calendar/register';
import { dateTimeCalendarShortcutType } from './shortcuts/date-time-calendar/register';
import { dateTimePickerShortcutType } from './shortcuts/date-time-picker/register';
import { textareaShortcutType } from './shortcuts/textarea/register';
import { passwordShortcutType } from './shortcuts/password/register';
import { checkboxShortcutType } from './shortcuts/checkbox/register';
import { dateInputShortcutType } from './shortcuts/date-input/register';
import { timeInputShortcutType } from './shortcuts/time-input/register';
import { timePickerShortcutType } from './shortcuts/time-picker/register';
import { dateTimeInputShortcutType } from './shortcuts/date-time-input/register';
import { currencyShortcutType } from './shortcuts/currency/register';
import { rangeCalendarShortcutType } from './shortcuts/range-calendar/register';
import { selectShortcutType } from './shortcuts/select/register';
import { radiogroupShortcutType } from './shortcuts/radiogroup/register';
import { tabsShortcutType } from './shortcuts/tabs/register';
import { listShortcutType } from './shortcuts/list/register';
import { tagsShortcutType } from './shortcuts/tags/register';
import { alertShortcutType } from './shortcuts/alert/register';
import { markdownTextShortcutType } from './shortcuts/markdown-text/register';
import { datePickerShortcutType } from './shortcuts/date-picker/register';
import { dropdownShortcutType } from './shortcuts/dropdown/register';
import { accordionShortcutType } from './shortcuts/accordion/register';
import { repeaterShortcutType } from './shortcuts/repeater/register';
import { markdownShortcutType } from './shortcuts/markdown/register';
import { rangeDateInputShortcutType } from './shortcuts/range-date-input/register';
import { rangeTimeInputShortcutType } from './shortcuts/range-time-input/register';
import { rangeDateTimeInputShortcutType } from './shortcuts/range-date-time-input/register';
import { rangeDateTimeCalendarShortcutType } from './shortcuts/range-date-time-calendar/register';
import { rangeDateTimePickerShortcutType } from './shortcuts/range-date-time-picker/register';
import { rangeDatePickerShortcutType } from './shortcuts/range-date-picker/register';
import { rangeTimePickerShortcutType } from './shortcuts/range-time-picker/register';
import { customDisplayShortcutType } from './shortcuts/custom-display/register';
import { customInputShortcutType } from './shortcuts/custom-input/register';
import { customActionShortcutType } from './shortcuts/custom-action/register';
import { customLayoutShortcutType } from './shortcuts/custom-layout/register';

const guiShortcutTypes: ShortcutTypeDefinition<any, any, any>[] = [
  inputsShortcutType,
  actionsShortcutType,
  layoutsShortcutType,
  displayShortcutType,
  calendarShortcutType,
  dateTimeCalendarShortcutType,
  dateTimePickerShortcutType,
  textareaShortcutType,
  passwordShortcutType,
  checkboxShortcutType,
  dateInputShortcutType,
  timeInputShortcutType,
  timePickerShortcutType,
  dateTimeInputShortcutType,
  currencyShortcutType,
  rangeCalendarShortcutType,
  selectShortcutType,
  radiogroupShortcutType,
  tabsShortcutType,
  listShortcutType,
  tagsShortcutType,
  alertShortcutType,
  markdownTextShortcutType,
  datePickerShortcutType,
  dropdownShortcutType,
  accordionShortcutType,
  repeaterShortcutType,
  markdownShortcutType,
  rangeDateInputShortcutType,
  rangeTimeInputShortcutType,
  rangeDateTimeInputShortcutType,
  rangeDateTimeCalendarShortcutType,
  rangeDateTimePickerShortcutType,
  rangeDatePickerShortcutType,
  rangeTimePickerShortcutType,
  customDisplayShortcutType,
  customInputShortcutType,
  customActionShortcutType,
  customLayoutShortcutType,
];

/**
 * The item type registry of the gui widget set. Holds one handler per gui
 * shortcut type; the DX pipeline in `formDefs` resolves item types against it.
 */
export const guiRegistry = createItemTypeRegistry();

for (const shortcutType of guiShortcutTypes) {
  registerShortcutType(guiRegistry, shortcutType);
}

/**
 * Legacy shortcut-type config: same shape as the `@golemui/dx` config, but
 * `kind` stays optional because this signature predates widget kinds.
 */
type GuiShortcutTypeConfig<TEntry, TDecorator, TConfig> = Omit<
  ShortcutTypeConfig<TEntry, TDecorator, TConfig>,
  'kind'
> & {
  kind?: ShortcutItemKind;
};

/**
 * Registers a new custom widget type into the gui widget set's DX pipeline.
 *
 * Compatibility wrapper around the `@golemui/dx` `defineShortcutType`, bound to
 * the gui registry. `kind` is optional here for backward compatibility; a type
 * registered without a kind never matches the umbrella selectors
 * (`inputs`, `actions`, `displays`, `layouts`), only selectors naming it exactly.
 *
 * Returns GSL selector factories (`gsl`, `gslByUid`) for styling/configuring
 * widgets of this type.
 */
export function defineShortcutType<
  TEntry,
  TDecorator extends DxCommonFields,
  TConfig extends GslConfigBase<TDecorator> = GslConfigBase<TDecorator>,
>(
  config: GuiShortcutTypeConfig<TEntry, TDecorator, TConfig>,
): ShortcutTypeSelectors<TDecorator, TConfig> {
  // AUDIT BOUNDARY: The cast presents a possibly-kindless config as the
  // kind-required dx config. Safe because `ShortcutTypeDefinition.kind` is
  // optional and its only runtime consumer (`registerItemType`) accepts an
  // absent kind; a kindless type simply never matches umbrella selectors.
  // Do NOT replicate this pattern elsewhere.
  return dxDefineShortcutType(
    guiRegistry,
    config as ShortcutTypeConfig<TEntry, TDecorator, TConfig>,
  );
}
