import type { ArrayValidator } from '@golemui/gui-validators';
import type { RangeCalendarProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';
import type { DxValidator } from '@golemui/dx';

export interface RangeCalendarDecorator
  extends DxInputBase,
    DxCommonFields,
    Partial<RangeCalendarProps> {
  type: 'rangeCalendar';
  validator?: DxValidator<ArrayValidator>;
}

export interface GslRangeCalendarConfig extends GslConfigBase<RangeCalendarDecorator> {
  suppressAutomaticLabels?: boolean;
}

export type RangeCalendarEntry = { key: string; def: DefOrCallback<RangeCalendarDecorator> };
export type GuiRangeCalendarShortcut = GuiShortcutOf<'RANGE_CALENDAR', RangeCalendarEntry>;
