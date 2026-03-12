// ═══════════════════════════════════════════════════
// FormForge DX — Public API
// ═══════════════════════════════════════════════════

// ─── GUI factories (structure) ───

export { _guiInputs } from './shortcuts/inputs/guiInputs.impl';
export { _guiTextInput } from './shortcuts/inputs/guiTextInput.impl';
export { _guiNumberInput } from './shortcuts/inputs/guiNumberInput.impl';
export { _guiBooleanInput } from './shortcuts/inputs/guiBooleanInput.impl';
export { _guiCalendar } from './shortcuts/calendar/guiCalendar.impl';
export { _guiTextarea } from './shortcuts/textarea/guiTextarea.impl';
export { _guiPassword } from './shortcuts/password/guiPassword.impl';
export { _guiCheckbox } from './shortcuts/checkbox/guiCheckbox.impl';
export { _guiDateInput } from './shortcuts/date-input/guiDateInput.impl';
export { _guiCurrency } from './shortcuts/currency/guiCurrency.impl';
export { _guiRangeCalendar } from './shortcuts/range-calendar/guiRangeCalendar.impl';
export { _guiSelect } from './shortcuts/select/guiSelect.impl';
export { _guiRadiogroup } from './shortcuts/radiogroup/guiRadiogroup.impl';
export { _guiTabs } from './shortcuts/tabs/guiTabs.impl';
export { _guiList } from './shortcuts/list/guiList.impl';
export { _guiButton, _guiButtons, _guiSubmitButton } from './shortcuts/actions/guiActions.impl';
export { _guiStack, _guiHorizontalStack, _guiVerticalStack } from './shortcuts/layouts/guiStack.impl';
export { _guiDisplay } from './shortcuts/display/guiDisplay.impl';

// ─── GSL selectors (behavior) ───

export { _gslInputs, _gslInputById } from './shortcuts/inputs/register';
export { _gslTextInputs, _gslNumberInputs, _gslBooleanInputs } from './shortcuts/inputs/gslInputSubtypes';
export { _gslCalendar, _gslCalendarById } from './shortcuts/calendar/register';
export { _gslTextarea, _gslTextareaById } from './shortcuts/textarea/register';
export { _gslPassword, _gslPasswordById } from './shortcuts/password/register';
export { _gslCheckbox, _gslCheckboxById } from './shortcuts/checkbox/register';
export { _gslDateInput, _gslDateInputById } from './shortcuts/date-input/register';
export { _gslCurrency, _gslCurrencyById } from './shortcuts/currency/register';
export { _gslRangeCalendar, _gslRangeCalendarById } from './shortcuts/range-calendar/register';
export { _gslSelect, _gslSelectById } from './shortcuts/select/register';
export { _gslRadiogroup, _gslRadiogroupById } from './shortcuts/radiogroup/register';
export { _gslTabs, _gslTabsById } from './shortcuts/tabs/register';
export { _gslList, _gslListById } from './shortcuts/list/register';
export { _gslActions, _gslActionById } from './shortcuts/actions/register';
export { _gslLayouts, _gslLayoutById } from './shortcuts/layouts/register';
export { _gslDisplays, _gslDisplayById } from './shortcuts/display/register';

// ─── Scope selectors ───

export { _gslRoot } from './shortcuts/scopes/gslRoot.impl';
export { _gslTag } from './shortcuts/scopes/gslTag.impl';

// ─── Public types ───

export type { DxRuntimeParams } from './core/dxUtilityTypes';
export type { DxDefinitions, DxDefinitionItem, FormEvents, DxDisplayRenderFn } from './formDef.domain';
export type {
  TextDataInputDecorator,
  NumberDataInputDecorator,
  BooleanDataInputDecorator,
  InputDecorator,
  ValidShortcutType,
  InputTags,
  SimpleFieldDef,
  GslInputsConfig,
} from './shortcuts/inputs/inputs.domain';
export type { CalendarDecorator, GslCalendarConfig } from './shortcuts/calendar/calendar.domain';
export type { TextareaDecorator, GslTextareaConfig } from './shortcuts/textarea/textarea.domain';
export type { PasswordDecorator, GslPasswordConfig } from './shortcuts/password/password.domain';
export type { CheckboxDecorator, GslCheckboxConfig } from './shortcuts/checkbox/checkbox.domain';
export type { DateInputDecorator, GslDateInputConfig } from './shortcuts/date-input/dateInput.domain';
export type { CurrencyDecorator, GslCurrencyConfig } from './shortcuts/currency/currency.domain';
export type {
  RangeCalendarDecorator,
  GslRangeCalendarConfig,
} from './shortcuts/range-calendar/rangeCalendar.domain';
export type { SelectDecorator, GslSelectConfig } from './shortcuts/select/select.domain';
export type {
  RadiogroupDecorator,
  GslRadiogroupConfig,
} from './shortcuts/radiogroup/radiogroup.domain';
export type { TabsDecorator, GslTabsConfig } from './shortcuts/tabs/tabs.domain';
export type { ListDecorator, GslListConfig } from './shortcuts/list/list.domain';
export type { ActionDecorator, GslActionsConfig } from './shortcuts/actions/actions.domain';
export type { LayoutDecorator, GslLayoutsConfig } from './shortcuts/layouts/layouts.domain';
export type { DisplayDecorator, GslDisplaysConfig } from './shortcuts/display/display.domain';
export type { GslSelectorsInput } from './core/dx.domain';
export { formDefs } from './dx.service';

// ─── Extension API (for adding custom shortcut types) ───

export { defineShortcutType } from './core/defineShortcutType';
export type { ShortcutTypeSelectors } from './core/defineShortcutType';
export { createGslSelector } from './core/dxUtilityTypes';
export type { GslConfigBase, GslDecoratorCallback, DefOrCallback, GuiShortcutOf } from './core/dxUtilityTypes';
export { processAutoLabel, processAutoPlaceholder } from './core/sharedSensibleDefaults.service';
export { extractWidgetProps } from './core/dxPropsHelper';
export type { DxCommonFields, DxInputBase, DxActionBase, DxLayoutBase, DxDisplayBase, DxInternalFields } from './core/dxBase.types';
