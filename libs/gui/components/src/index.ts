// ─── Web components ───

export { GuiButton } from './lib/components/button';
export { GuiCalendar } from './lib/components/calendar';
export type { CalendarDay } from './lib/components/calendar';
export { GuiCheckbox } from './lib/components/checkbox';
export type { GuiCheckboxProps } from './lib/components/checkbox';
export { GuiCurrency } from './lib/components/currency';
export type { GuiCurrencyProps } from './lib/components/currency';
export { GuiDate } from './lib/components/date-input';
export type { GuiDateProps } from './lib/components/date-input';
export { GuiDatePicker } from './lib/components/date-picker';
export { GuiDateTime } from './lib/components/date-time-input';
export type { GuiDateTimeProps } from './lib/components/date-time-input';
export { GuiDateTimeCalendar } from './lib/components/date-time-calendar';
export { GuiDateTimePicker } from './lib/components/date-time-picker';
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
export { GuiFileUpload } from './lib/components/file-upload';
export type { GuiFileUploadProps } from './lib/components/file-upload';
export { matchesAccept } from './lib/utils/file-upload';
export { GuiMarkdown } from './lib/components/markdown';
export type { GuiMarkdownProps } from './lib/components/markdown';
export { GuiMarkdownText } from './lib/components/markdown-text';
export { GuiMultiFileUpload } from './lib/components/multi-file-upload';
export { GuiMultiList } from './lib/components/multi-list';
export { GuiMultiSelectTrigger } from './lib/components/multi-select-trigger';
export { GuiNumber } from './lib/components/number';
export type { GuiNumberProps } from './lib/components/number';
export {
  createOptionMapper,
  inferOptionValue,
  isOptionValue,
  isProtoOption,
  updateOptions,
} from './lib/components/one-of';
export { GuiPassword } from './lib/components/password';
export type { GuiPasswordProps } from './lib/components/password';
export { GuiPills } from './lib/components/pills';
export type {
  GuiPillItem,
  GuiPillEventDetail,
  GuiPillKeydownEventDetail,
  GuiPillsDropdownEventDetail,
} from './lib/components/pills';
export { GuiRadiogroup } from './lib/components/radiogroup';
export type { GuiRadiogroupProps } from './lib/components/radiogroup';
export { GuiRangeCalendar } from './lib/components/range-calendar';
export type { RangeCalendarDay } from './lib/components/range-calendar';

export { GuiRangeDateInput } from './lib/components/range-date-input';
export type { GuiRangeDateInputProps } from './lib/components/range-date-input';
export { GuiRangeDateTimeInput } from './lib/components/range-date-time-input';
export type { GuiRangeDateTimeInputProps } from './lib/components/range-date-time-input';
export { GuiRangeDateTimeCalendar } from './lib/components/range-date-time-calendar';
export { GuiRangeDateTimePicker } from './lib/components/range-date-time-picker';
export { GuiRangeTimeInput } from './lib/components/range-time-input';
export type { GuiRangeTimeInputProps } from './lib/components/range-time-input';
export { GuiRangeDatePicker } from './lib/components/range-date-picker';
export { GuiRangeTimePicker } from './lib/components/range-time-picker';
export { GuiSelect } from './lib/components/select';
export type { GuiSelectProps } from './lib/components/select';
export { GuiTags } from './lib/components/tags';
export type { GuiTagsProps } from './lib/components/tags';
export { GuiTextarea } from './lib/components/textarea';
export type { GuiTextareaProps } from './lib/components/textarea';
export { GuiTextinput } from './lib/components/textinput';
export type { GuiTextinputProps } from './lib/components/textinput';
export { GuiTime } from './lib/components/time-input';
export type { GuiTimeProps } from './lib/components/time-input';
export { GuiTimeList } from './lib/components/time-list';
export { GuiTimePicker } from './lib/components/time-picker';
export { GuiToggle } from './lib/components/toggle';
export type { GuiToggleProps } from './lib/components/toggle';
export { weekInfoData } from './lib/utils/week-info';
export type { WeekInfo } from './lib/utils/week-info';

// ─── Value and service types ───

export type {
  DateRange,
  DateTimeRange,
  DisabledTimeRange,
  FileItem,
  FileStatus,
  ListItem,
  MarkdownParser,
  Option,
  OptionValue,
  TimeRange,
  UploadService,
} from './lib/types';

// ─── Messages ───

export { configureMessages, DEFAULT_MESSAGES } from './lib/utils/messages';
export type { GuiMessageKey, GuiMessageParams, GuiTranslate } from './lib/utils/messages';

// ─── Events ───

export type { GuiValueEventDetail } from './lib/utils/events';

// ─── Controllers ───

export { GUIAriaController } from './lib/controllers/aria.controller';
