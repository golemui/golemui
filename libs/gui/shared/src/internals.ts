// ─── Internals ────────────────────────────────────────────────────────────
//
// Risky / private API. These symbols are NOT part of the stable public surface
// (see `index.ts`). They are exposed only so that other `@golemui/*` libraries
// - framework adapters (react/lit/angular/vue) and the renderer component lib -
// can build on top of gui-shared. Importing from
// `@golemui/gui-shared/internals` is a signal that you are reaching into
// internal building blocks; the contract may change without notice.

// ─── Widget contract types (consumed by framework adapters / renderers) ───

export type {
  AccordionProps,
  AlertProps,
  BadgeProps,
  ButtonProps,
  CalendarProps,
  DateTimeCalendarProps,
  DateTimePickerProps,
  CheckboxProps,
  CheckboxGroupProps,
  CurrencyProps,
  DateinputProps,
  DatePickerProps,
  DateTimeInputProps,
  CompleteDateRange,
  DateRange,
  DateTimeRange,
  DisabledTimeRange,
  DropdownProps,
  FileUploadBaseProps,
  FileUploadProps,
  GridGap,
  GridJustify,
  GridProps,
  ListItem,
  ListProps,
  MarkdownProps,
  MarkdownTextProps,
  ProgressProps,
  SpinnerProps,
  TypographyProps,
  TypographyVariant,
  ImageProps,
  ImageRatio,
  ImageFit,
  MenuButtonAction,
  MenuButtonItem,
  MenuButtonProps,
  MenuButtonSeparator,
  MultiDropdownProps,
  MultiFileUploadProps,
  MultiListProps,
  NumberinputProps,
  OneOfProps,
  Option,
  OptionValue,
  OtpProps,
  PasswordProps,
  RadiogroupProps,
  MultiRangeCalendarProps,
  MultiRangeDateInputProps,
  MultiRangeDatePickerProps,
  MultiRangeDateTimeInputProps,
  MultiRangeDateTimeCalendarProps,
  MultiRangeDateTimePickerProps,
  RangeCalendarProps,
  RangeDateInputProps,
  RangeDatePickerProps,
  RangeDateTimeCalendarProps,
  RangeDateTimeInputProps,
  RangeDateTimePickerProps,
  RangeSliderProps,
  RangeTimeInputProps,
  RangeTimePickerProps,
  RatingProps,
  MultiRangeTimeInputProps,
  MultiRangeTimePickerProps,
  RepeaterProps,
  SelectProps,
  SliderFormat,
  SliderMark,
  SliderProps,
  SliderRange,
  TabsProps,
  TagsProps,
  TagsSeparator,
  TextareaProps,
  TextinputProps,
  TimeInputProps,
  TimePickerProps,
  TimeRange,
  ToggleProps,
} from './lib/widget.props';

export type {
  Dependencies,
  FileItem,
  FileStatus,
  MarkdownParser,
  SanitizedHtml,
  UploadService,
} from './lib/shared';

export type { GolemWidget } from './lib/widgets';
export { actionWidgets, displayWidgets, inputWidgets, layoutWidgets } from './lib/widgets';

// ─── golem-form (JSON form builder — currently used only by test libs) ───

export { golemForm } from './lib/golem-form';

// ─── Utils ───

export { isOption } from './lib/utils/one-of';
export {
  accordionButtonId,
  accordionSectionId,
  tabButtonCy,
  tabButtonId,
  tabPanelCy,
  tabPanelId,
} from './lib/utils/layout-ids';
export { repeaterIndexSuffix } from './lib/utils/repeater';
export { imageClasses, typographyClasses, typographyTag } from './lib/utils/content';
export { findRepeaterRowFocus, focusAfterRowRemoval } from './lib/utils/repeater-focus';
export type { RepeaterRowFocus } from './lib/utils/repeater-focus';
export {
  DEFAULT_MENU_BUTTON_PLACEMENT,
  isMenuButtonSeparator,
  menuButtonAriaLabel,
  menuButtonClasses,
  menuButtonPanelId,
} from './lib/utils/menu-button';
export { gridCellClasses, gridClasses, resolveGrid, type ResolvedGrid } from './lib/utils/grid';
