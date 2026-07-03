// ─── Web components ───

export { GuiButton } from './lib/components/button';
export { GuiCalendar } from './lib/components/calendar';
export type { CalendarDay } from './lib/components/calendar';
export { GuiCheckbox } from './lib/components/checkbox';
export { GuiCurrency } from './lib/components/currency';
export { GuiDate } from './lib/components/date-input';
export { GuiErrors } from './lib/components/errors';
export { GuiLabel } from './lib/components/label';
export { GuiList } from './lib/components/list';
export {
  createListItemMapper,
  isListItem,
  isListItemValue,
  isProtoListItem,
  updateListItems,
} from './lib/components/list-items';
export type { ListItemValue } from './lib/components/list-items';
export { GuiMarkdown } from './lib/components/markdown';
export { GuiMarkdownText } from './lib/components/markdown-text';
export { GuiNumber } from './lib/components/number';
export {
  createOptionMapper,
  inferOptionValue,
  isOptionValue,
  isProtoOption,
  updateOptions,
} from './lib/components/one-of';
export { GuiPassword } from './lib/components/password';
export { GuiPills } from './lib/components/pills';
export type {
  GuiPillItem,
  GuiPillEventDetail,
  GuiPillKeydownEventDetail,
  GuiPillsDropdownEventDetail,
} from './lib/components/pills';
export { GuiRadiogroup } from './lib/components/radiogroup';
export { GuiRangeCalendar } from './lib/components/range-calendar';
export type { RangeCalendarDay } from './lib/components/range-calendar';

export { GuiRangeDateInput } from './lib/components/range-date-input';
export { GuiSelect } from './lib/components/select';
export { GuiTags } from './lib/components/tags';
export { GuiTextarea } from './lib/components/textarea';
export { GuiTextinput } from './lib/components/textinput';
export { GuiTime } from './lib/components/time-input';
export { GuiToggle } from './lib/components/toggle';
export { weekInfoData } from './lib/utils/week-info';
export type { WeekInfo } from './lib/utils/week-info';

// ─── Controllers ───

export { GUIAriaController } from './lib/controllers/aria.controller';

// ─── Date utilities ───

export {
  createDateRange,
  getDateFormatParts,
  getDayLabel,
  getMonthName,
  getMonthYearParts,
  getOrderedWeekDays,
  getWeekdayLabels,
  isDateInVisibleMonths,
  isSameDay,
  isToday,
  maxValidDayInMonth,
  mergeDateRanges,
  toISODateString,
  weekDaysOrder,
} from './lib/utils/date';

// ─── Time utilities ───

export {
  from24Hour,
  getDayPeriodLabels,
  getTimeFormatParts,
  parseISODateTimeString,
  parseISOTimeString,
  resolveHourFormat,
  to24Hour,
  toISODateTimeString,
  toISOTimeString,
  type HourFormat,
} from './lib/utils/time';
