// ─── Web components ───

export { GuiAccordion, GuiAccordionEvents } from './lib/components/accordion';
export {
  GuiAccordionItem,
  GuiAccordionItemEvents,
  type GuiToggleEventDetail,
} from './lib/components/accordion-item';
export { GuiAlert, type GuiAlertVariant } from './lib/components/alert';
export { GuiButton } from './lib/components/button';
export { GuiCalendar, GuiCalendarEvents } from './lib/components/calendar';
export type { CalendarDay } from './lib/components/calendar';
export { GuiCheckbox, GuiCheckboxEvents } from './lib/components/checkbox';
export type { GuiCheckboxProps } from './lib/components/checkbox';
export { GuiCurrency, GuiCurrencyEvents } from './lib/components/currency';
export type { GuiCurrencyProps } from './lib/components/currency';
export { GuiDate, GuiDateEvents } from './lib/components/date-input';
export type { GuiDateProps } from './lib/components/date-input';
export { GuiDatePicker, GuiDatePickerEvents } from './lib/components/date-picker';
export { GuiDateTime, GuiDateTimeEvents } from './lib/components/date-time-input';
export type { GuiDateTimeProps } from './lib/components/date-time-input';
export {
  GuiDateTimeCalendar,
  GuiDateTimeCalendarEvents,
} from './lib/components/date-time-calendar';
export { GuiDateTimePicker, GuiDateTimePickerEvents } from './lib/components/date-time-picker';
export { GuiDropdown, GuiDropdownEvents } from './lib/components/dropdown';
export type { GuiFilterEventDetail } from './lib/components/dropdown';
export { GuiErrors } from './lib/components/errors';
export { GuiLabel } from './lib/components/label';
export { GuiList, GuiListEvents } from './lib/components/list';
export {
  createListItemMapper,
  isListItem,
  isListItemValue,
  isProtoListItem,
  updateListItems,
} from './lib/components/list-items';
export type { ListItemValue } from './lib/components/list-items';
export { GuiFileUpload, GuiFileUploadEvents } from './lib/components/file-upload';
export type { GuiFileUploadProps } from './lib/components/file-upload';
export { matchesAccept } from './lib/utils/file-upload';
export { GuiMarkdown, GuiMarkdownEvents } from './lib/components/markdown';
export type { GuiMarkdownProps } from './lib/components/markdown';
export { GuiMarkdownText } from './lib/components/markdown-text';
export { GuiMultiDropdown, GuiMultiDropdownEvents } from './lib/components/multi-dropdown';
export { GuiMultiFileUpload, GuiMultiFileUploadEvents } from './lib/components/multi-file-upload';
export { GuiMultiList, GuiMultiListEvents } from './lib/components/multi-list';
export {
  GuiMultiSelectTrigger,
  GuiMultiSelectTriggerEvents,
} from './lib/components/multi-select-trigger';
export { GuiNumber, GuiNumberEvents } from './lib/components/number';
export type { GuiNumberProps } from './lib/components/number';
export {
  createOptionMapper,
  inferOptionValue,
  isOptionValue,
  isProtoOption,
  updateOptions,
} from './lib/components/one-of';
export { GuiPassword, GuiPasswordEvents } from './lib/components/password';
export type { GuiPasswordProps } from './lib/components/password';
export { GuiPills, GuiPillsEvents } from './lib/components/pills';
export type {
  GuiPillItem,
  GuiPillEventDetail,
  GuiPillExitEventDetail,
  GuiPillKeydownEventDetail,
  GuiPillsDropdownEventDetail,
} from './lib/components/pills';
export { GuiRadiogroup, GuiRadiogroupEvents } from './lib/components/radiogroup';
export type { GuiRadiogroupProps } from './lib/components/radiogroup';
export { GuiRangeCalendar, GuiRangeCalendarEvents } from './lib/components/range-calendar';
export type { RangeCalendarDay } from './lib/components/range-calendar';

export { GuiRangeDateInput, GuiRangeDateInputEvents } from './lib/components/range-date-input';
export type { GuiRangeDateInputProps } from './lib/components/range-date-input';
export {
  GuiRangeDateTimeInput,
  GuiRangeDateTimeInputEvents,
} from './lib/components/range-date-time-input';
export type { GuiRangeDateTimeInputProps } from './lib/components/range-date-time-input';
export {
  GuiRangeDateTimeCalendar,
  GuiRangeDateTimeCalendarEvents,
} from './lib/components/range-date-time-calendar';
export {
  GuiRangeDateTimePicker,
  GuiRangeDateTimePickerEvents,
} from './lib/components/range-date-time-picker';
export { GuiRangeTimeInput, GuiRangeTimeInputEvents } from './lib/components/range-time-input';
export type { GuiRangeTimeInputProps } from './lib/components/range-time-input';
export { GuiRangeDatePicker, GuiRangeDatePickerEvents } from './lib/components/range-date-picker';
export { GuiRangeTimePicker, GuiRangeTimePickerEvents } from './lib/components/range-time-picker';
export { GuiSelect, GuiSelectEvents } from './lib/components/select';
export type { GuiSelectProps } from './lib/components/select';
export { GuiTab } from './lib/components/tab';
export { GuiTabList } from './lib/components/tab-list';
export { GuiTabPanel } from './lib/components/tab-panel';
export { GuiTabs, GuiTabsEvents, type GuiTabChangeEventDetail } from './lib/components/tabs';
export { GuiTags, GuiTagsEvents } from './lib/components/tags';
export type { GuiTagsProps } from './lib/components/tags';
export { GuiTextarea, GuiTextareaEvents } from './lib/components/textarea';
export type { GuiTextareaProps } from './lib/components/textarea';
export { GuiTextinput, GuiTextinputEvents } from './lib/components/textinput';
export type { GuiTextinputProps } from './lib/components/textinput';
export { GuiTime, GuiTimeEvents } from './lib/components/time-input';
export type { GuiTimeProps } from './lib/components/time-input';
export { GuiTimeList, GuiTimeListEvents } from './lib/components/time-list';
export { GuiTimePicker, GuiTimePickerEvents } from './lib/components/time-picker';
export { GuiToggle, GuiToggleEvents } from './lib/components/toggle';
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
  GuiVisibleItem,
  ListItem,
  ListItemInput,
  MarkdownParser,
  Option,
  OptionInput,
  OptionValue,
  TimeRange,
  UploadService,
} from './lib/types';
export type { GuiItemRenderContext, GuiItemRenderer, GuiItemState } from './lib/utils/item-content';

// ─── Messages ───

export { configureMessages, DEFAULT_MESSAGES } from './lib/utils/messages';
export type { GuiMessageKey, GuiMessageParams, GuiTranslate } from './lib/utils/messages';

// ─── Server rendering ───
//
// The browser side. The server side, renderTemplate, is in @golemui/gui-components/ssr.

export { resumeServerRendered } from '@golemui/lit-utils';

// ─── Events ───

export type {
  GuiEventMap,
  GuiEventType,
  GuiInputErrorEventDetail,
  GuiValueEvent,
  GuiValueEventDetail,
} from './lib/utils/events';

// ─── Controllers ───

export { GUIAriaController } from './lib/controllers/aria.controller';
