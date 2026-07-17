import type { ArrayValidator } from '@golemui/gui-validators';
import type { RangeDateTimeCalendarProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '../../core/dxBase.types';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '../../core/dxUtilityTypes';
import type { DxValidator } from '../../core/dxValidatorHelper';

export interface RangeDateTimeCalendarDecorator
  extends DxInputBase,
    DxCommonFields,
    Partial<RangeDateTimeCalendarProps> {
  type: 'rangeDateTimeCalendar';
  validator?: DxValidator<ArrayValidator>;
}

export interface GslRangeDateTimeCalendarConfig
  extends GslConfigBase<RangeDateTimeCalendarDecorator> {
  suppressAutomaticLabels?: boolean;
}

export type RangeDateTimeCalendarEntry = {
  key: string;
  def: DefOrCallback<RangeDateTimeCalendarDecorator>;
};
export type GuiRangeDateTimeCalendarShortcut = GuiShortcutOf<
  'RANGE_DATE_TIME_CALENDAR',
  RangeDateTimeCalendarEntry
>;
