import type { ArrayValidator } from '@golemui/gui-validators';
import type { RangeCalendarProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '../../core/dxBase.types';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '../../core/dxUtilityTypes';

export interface RangeCalendarDecorator
  extends DxInputBase,
    DxCommonFields,
    Partial<RangeCalendarProps> {
  type: 'rangeCalendar';
  validator?: Omit<ArrayValidator, 'type'>;
}

export interface GslRangeCalendarConfig extends GslConfigBase<RangeCalendarDecorator> {
  suppressAutomaticLabels?: boolean;
}

export type RangeCalendarEntry = { key: string; def: DefOrCallback<RangeCalendarDecorator> };
export type GuiRangeCalendarShortcut = GuiShortcutOf<'RANGE_CALENDAR', RangeCalendarEntry>;
