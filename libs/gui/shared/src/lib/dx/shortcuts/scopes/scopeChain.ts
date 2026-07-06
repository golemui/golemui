import type { GslLeafSelector } from '../../core/dx.domain';

import { _gslInputs, _gslInputByUid } from '../inputs/register';
import { _gslTextInputs, _gslNumberInputs, _gslBooleanInputs } from '../inputs/gslInputSubtypes';
import { _gslSelects, _gslSelectByUid } from '../select/register';
import { _gslDropdowns, _gslDropdownByUid } from '../dropdown/register';
import { _gslRadiogroups, _gslRadiogroupByUid } from '../radiogroup/register';
import { _gslCheckboxes, _gslCheckboxByUid } from '../checkbox/register';
import { _gslTextareas, _gslTextareaByUid } from '../textarea/register';
import { _gslPasswords, _gslPasswordByUid } from '../password/register';
import { _gslCurrencies, _gslCurrencyByUid } from '../currency/register';
import { _gslMarkdowns, _gslMarkdownByUid } from '../markdown/register';
import { _gslLists, _gslListByUid } from '../list/register';
import { _gslCalendars, _gslCalendarByUid } from '../calendar/register';
import { _gslDateInputs, _gslDateInputByUid } from '../date-input/register';
import { _gslDatePickers, _gslDatePickerByUid } from '../date-picker/register';
import { _gslRangeCalendars, _gslRangeCalendarByUid } from '../range-calendar/register';
import { _gslRangeDateInputs, _gslRangeDateInputByUid } from '../range-date-input/register';
import { _gslTimeInputs, _gslTimeInputByUid } from '../time-input/register';
import { _gslDateTimeInputs, _gslDateTimeInputByUid } from '../date-time-input/register';
import { _gslRangeDatePickers, _gslRangeDatePickerByUid } from '../range-date-picker/register';
import { _gslRepeaters, _gslRepeaterByUid } from '../repeater/register';
import { _gslActions, _gslActionByUid } from '../actions/register';
import { _gslLayouts, _gslLayoutByUid } from '../layouts/register';
import { _gslDisplays, _gslDisplayByUid } from '../display/register';
import { _gslAlerts, _gslAlertByUid } from '../alert/register';
import { _gslMarkdownTexts, _gslMarkdownTextByUid } from '../markdown-text/register';
import { _gslTabs, _gslTabsByUid } from '../tabs/register';
import { _gslAccordions, _gslAccordionByUid } from '../accordion/register';
import { _gslCustomInputs, _gslCustomInputByUid } from '../custom-input/register';
import { _gslCustomActions, _gslCustomActionByUid } from '../custom-action/register';
import { _gslCustomDisplays, _gslCustomDisplayByUid } from '../custom-display/register';
import { _gslCustomLayouts, _gslCustomLayoutByUid } from '../custom-layout/register';

type ScopeCondition =
  | { kind: 'tagsAnd'; tags: string[] }
  | { kind: 'tagsOr'; tags: string[] }
  | { kind: 'state'; name: string };

type CfgGsl<F> = F extends (config: infer C, matcher?: any) => GslLeafSelector ? C : never;
type CfgByUid<F> = F extends (uid: string, config: infer C) => GslLeafSelector ? C : never;

export class ScopeChain {
  private constructor(private readonly conditions: readonly ScopeCondition[]) {}

  static root(): ScopeChain {
    return new ScopeChain([]);
  }

  // ─── Scope methods (chain-extending, immutable) ───

  tag(name: string): ScopeChain {
    return new ScopeChain([...this.conditions, { kind: 'tagsAnd', tags: [name] }]);
  }

  state(name: string): ScopeChain {
    return new ScopeChain([...this.conditions, { kind: 'state', name }]);
  }

  tagsAnd(names: string[]): ScopeChain {
    return new ScopeChain([...this.conditions, { kind: 'tagsAnd', tags: names }]);
  }

  tagsOr(names: string[]): ScopeChain {
    return new ScopeChain([...this.conditions, { kind: 'tagsOr', tags: names }]);
  }

  private apply(leaf: GslLeafSelector): GslLeafSelector {
    if (this.conditions.length === 0) return leaf;

    const stateCondition = this.conditions.find(
      (c): c is { kind: 'state'; name: string } => c.kind === 'state',
    );
    const tagConditions = this.conditions.filter(
      (c): c is { kind: 'tagsAnd' | 'tagsOr'; tags: string[] } => c.kind !== 'state',
    );

    const baseMatcher = leaf.matcher;
    return {
      ...leaf,
      matcher: (d: any) => {
        if (!baseMatcher(d)) return false;
        for (const cond of tagConditions) {
          const widgetTags: string[] = d.tags ?? [];
          if (cond.kind === 'tagsAnd') {
            for (const tag of cond.tags) {
              if (!widgetTags.includes(tag)) return false;
            }
          } else {
            if (cond.tags.length === 0) continue;
            if (!cond.tags.some((tag) => widgetTags.includes(tag))) return false;
          }
        }
        return true;
      },
      ...(stateCondition ? { targetState: stateCondition.name } : {}),
    };
  }

  // ─── Type selectors — inputs ───

  inputs(config: CfgGsl<typeof _gslInputs>): GslLeafSelector {
    return this.apply(_gslInputs(config));
  }
  inputByUid(uid: string, config: CfgByUid<typeof _gslInputByUid>): GslLeafSelector {
    return this.apply(_gslInputByUid(uid, config));
  }
  textInputs(config: Parameters<typeof _gslTextInputs>[0]): GslLeafSelector {
    return this.apply(_gslTextInputs(config));
  }
  numberInputs(config: Parameters<typeof _gslNumberInputs>[0]): GslLeafSelector {
    return this.apply(_gslNumberInputs(config));
  }
  booleanInputs(config: Parameters<typeof _gslBooleanInputs>[0]): GslLeafSelector {
    return this.apply(_gslBooleanInputs(config));
  }

  selects(config: CfgGsl<typeof _gslSelects>): GslLeafSelector {
    return this.apply(_gslSelects(config));
  }
  selectByUid(uid: string, config: CfgByUid<typeof _gslSelectByUid>): GslLeafSelector {
    return this.apply(_gslSelectByUid(uid, config));
  }

  dropdowns(config: CfgGsl<typeof _gslDropdowns>): GslLeafSelector {
    return this.apply(_gslDropdowns(config));
  }
  dropdownByUid(uid: string, config: CfgByUid<typeof _gslDropdownByUid>): GslLeafSelector {
    return this.apply(_gslDropdownByUid(uid, config));
  }

  radiogroups(config: CfgGsl<typeof _gslRadiogroups>): GslLeafSelector {
    return this.apply(_gslRadiogroups(config));
  }
  radiogroupByUid(uid: string, config: CfgByUid<typeof _gslRadiogroupByUid>): GslLeafSelector {
    return this.apply(_gslRadiogroupByUid(uid, config));
  }

  checkboxes(config: CfgGsl<typeof _gslCheckboxes>): GslLeafSelector {
    return this.apply(_gslCheckboxes(config));
  }
  checkboxByUid(uid: string, config: CfgByUid<typeof _gslCheckboxByUid>): GslLeafSelector {
    return this.apply(_gslCheckboxByUid(uid, config));
  }

  textareas(config: CfgGsl<typeof _gslTextareas>): GslLeafSelector {
    return this.apply(_gslTextareas(config));
  }
  textareaByUid(uid: string, config: CfgByUid<typeof _gslTextareaByUid>): GslLeafSelector {
    return this.apply(_gslTextareaByUid(uid, config));
  }

  passwords(config: CfgGsl<typeof _gslPasswords>): GslLeafSelector {
    return this.apply(_gslPasswords(config));
  }
  passwordByUid(uid: string, config: CfgByUid<typeof _gslPasswordByUid>): GslLeafSelector {
    return this.apply(_gslPasswordByUid(uid, config));
  }

  currencies(config: CfgGsl<typeof _gslCurrencies>): GslLeafSelector {
    return this.apply(_gslCurrencies(config));
  }
  currencyByUid(uid: string, config: CfgByUid<typeof _gslCurrencyByUid>): GslLeafSelector {
    return this.apply(_gslCurrencyByUid(uid, config));
  }

  markdowns(config: CfgGsl<typeof _gslMarkdowns>): GslLeafSelector {
    return this.apply(_gslMarkdowns(config));
  }
  markdownByUid(uid: string, config: CfgByUid<typeof _gslMarkdownByUid>): GslLeafSelector {
    return this.apply(_gslMarkdownByUid(uid, config));
  }

  lists(config: CfgGsl<typeof _gslLists>): GslLeafSelector {
    return this.apply(_gslLists(config));
  }
  listByUid(uid: string, config: CfgByUid<typeof _gslListByUid>): GslLeafSelector {
    return this.apply(_gslListByUid(uid, config));
  }

  calendars(config: CfgGsl<typeof _gslCalendars>): GslLeafSelector {
    return this.apply(_gslCalendars(config));
  }
  calendarByUid(uid: string, config: CfgByUid<typeof _gslCalendarByUid>): GslLeafSelector {
    return this.apply(_gslCalendarByUid(uid, config));
  }

  dateInputs(config: CfgGsl<typeof _gslDateInputs>): GslLeafSelector {
    return this.apply(_gslDateInputs(config));
  }
  dateInputByUid(uid: string, config: CfgByUid<typeof _gslDateInputByUid>): GslLeafSelector {
    return this.apply(_gslDateInputByUid(uid, config));
  }

  timeInputs(config: CfgGsl<typeof _gslTimeInputs>): GslLeafSelector {
    return this.apply(_gslTimeInputs(config));
  }
  timeInputByUid(uid: string, config: CfgByUid<typeof _gslTimeInputByUid>): GslLeafSelector {
    return this.apply(_gslTimeInputByUid(uid, config));
  }

  dateTimeInputs(config: CfgGsl<typeof _gslDateTimeInputs>): GslLeafSelector {
    return this.apply(_gslDateTimeInputs(config));
  }
  dateTimeInputByUid(
    uid: string,
    config: CfgByUid<typeof _gslDateTimeInputByUid>,
  ): GslLeafSelector {
    return this.apply(_gslDateTimeInputByUid(uid, config));
  }

  datePickers(config: CfgGsl<typeof _gslDatePickers>): GslLeafSelector {
    return this.apply(_gslDatePickers(config));
  }
  datePickerByUid(uid: string, config: CfgByUid<typeof _gslDatePickerByUid>): GslLeafSelector {
    return this.apply(_gslDatePickerByUid(uid, config));
  }

  rangeCalendars(config: CfgGsl<typeof _gslRangeCalendars>): GslLeafSelector {
    return this.apply(_gslRangeCalendars(config));
  }
  rangeCalendarByUid(
    uid: string,
    config: CfgByUid<typeof _gslRangeCalendarByUid>,
  ): GslLeafSelector {
    return this.apply(_gslRangeCalendarByUid(uid, config));
  }

  rangeDateInputs(config: CfgGsl<typeof _gslRangeDateInputs>): GslLeafSelector {
    return this.apply(_gslRangeDateInputs(config));
  }
  rangeDateInputByUid(
    uid: string,
    config: CfgByUid<typeof _gslRangeDateInputByUid>,
  ): GslLeafSelector {
    return this.apply(_gslRangeDateInputByUid(uid, config));
  }

  rangeDatePickers(config: CfgGsl<typeof _gslRangeDatePickers>): GslLeafSelector {
    return this.apply(_gslRangeDatePickers(config));
  }
  rangeDatePickerByUid(
    uid: string,
    config: CfgByUid<typeof _gslRangeDatePickerByUid>,
  ): GslLeafSelector {
    return this.apply(_gslRangeDatePickerByUid(uid, config));
  }

  repeaters(config: CfgGsl<typeof _gslRepeaters>): GslLeafSelector {
    return this.apply(_gslRepeaters(config));
  }
  repeaterByUid(uid: string, config: CfgByUid<typeof _gslRepeaterByUid>): GslLeafSelector {
    return this.apply(_gslRepeaterByUid(uid, config));
  }

  // ─── Type selectors — actions, displays, layouts ───

  actions(config: CfgGsl<typeof _gslActions>): GslLeafSelector {
    return this.apply(_gslActions(config));
  }
  actionByUid(uid: string, config: CfgByUid<typeof _gslActionByUid>): GslLeafSelector {
    return this.apply(_gslActionByUid(uid, config));
  }

  layouts(config: CfgGsl<typeof _gslLayouts>): GslLeafSelector {
    return this.apply(_gslLayouts(config));
  }
  layoutByUid(uid: string, config: CfgByUid<typeof _gslLayoutByUid>): GslLeafSelector {
    return this.apply(_gslLayoutByUid(uid, config));
  }

  displays(config: CfgGsl<typeof _gslDisplays>): GslLeafSelector {
    return this.apply(_gslDisplays(config));
  }
  displayByUid(uid: string, config: CfgByUid<typeof _gslDisplayByUid>): GslLeafSelector {
    return this.apply(_gslDisplayByUid(uid, config));
  }

  alerts(config: CfgGsl<typeof _gslAlerts>): GslLeafSelector {
    return this.apply(_gslAlerts(config));
  }
  alertByUid(uid: string, config: CfgByUid<typeof _gslAlertByUid>): GslLeafSelector {
    return this.apply(_gslAlertByUid(uid, config));
  }

  markdownTexts(config: CfgGsl<typeof _gslMarkdownTexts>): GslLeafSelector {
    return this.apply(_gslMarkdownTexts(config));
  }
  markdownTextByUid(uid: string, config: CfgByUid<typeof _gslMarkdownTextByUid>): GslLeafSelector {
    return this.apply(_gslMarkdownTextByUid(uid, config));
  }

  tabs(config: CfgGsl<typeof _gslTabs>): GslLeafSelector {
    return this.apply(_gslTabs(config));
  }
  tabsByUid(uid: string, config: CfgByUid<typeof _gslTabsByUid>): GslLeafSelector {
    return this.apply(_gslTabsByUid(uid, config));
  }

  accordions(config: CfgGsl<typeof _gslAccordions>): GslLeafSelector {
    return this.apply(_gslAccordions(config));
  }
  accordionByUid(uid: string, config: CfgByUid<typeof _gslAccordionByUid>): GslLeafSelector {
    return this.apply(_gslAccordionByUid(uid, config));
  }

  // ─── Type selectors — custom kinds ───

  customInputs(config: CfgGsl<typeof _gslCustomInputs>): GslLeafSelector {
    return this.apply(_gslCustomInputs(config));
  }
  customInputByUid(uid: string, config: CfgByUid<typeof _gslCustomInputByUid>): GslLeafSelector {
    return this.apply(_gslCustomInputByUid(uid, config));
  }

  customActions(config: CfgGsl<typeof _gslCustomActions>): GslLeafSelector {
    return this.apply(_gslCustomActions(config));
  }
  customActionByUid(uid: string, config: CfgByUid<typeof _gslCustomActionByUid>): GslLeafSelector {
    return this.apply(_gslCustomActionByUid(uid, config));
  }

  customDisplays(config: CfgGsl<typeof _gslCustomDisplays>): GslLeafSelector {
    return this.apply(_gslCustomDisplays(config));
  }
  customDisplayByUid(
    uid: string,
    config: CfgByUid<typeof _gslCustomDisplayByUid>,
  ): GslLeafSelector {
    return this.apply(_gslCustomDisplayByUid(uid, config));
  }

  customLayouts(config: CfgGsl<typeof _gslCustomLayouts>): GslLeafSelector {
    return this.apply(_gslCustomLayouts(config));
  }
  customLayoutByUid(uid: string, config: CfgByUid<typeof _gslCustomLayoutByUid>): GslLeafSelector {
    return this.apply(_gslCustomLayoutByUid(uid, config));
  }
}
