import type { ImplementationSchemaConfig, WidgetManifestEntry } from '@golemui/schemas';

/**
 * The gui widget manifest, the single source of truth for the generated gui
 * schema files. A spec keeps it in sync with the widget arrays in
 * `libs/gui/shared/src/lib/widgets.ts`.
 */
export const guiWidgetManifest: readonly WidgetManifestEntry[] = [
  { type: 'calendar', schemaFile: 'calendar.schema.json', kind: 'input' },
  { type: 'dateTimeCalendar', schemaFile: 'datetimecalendar.schema.json', kind: 'input' },
  { type: 'checkbox', schemaFile: 'checkbox.schema.json', kind: 'input' },
  { type: 'currency', schemaFile: 'currency.schema.json', kind: 'input' },
  { type: 'dateInput', schemaFile: 'dateinput.schema.json', kind: 'input' },
  { type: 'datePicker', schemaFile: 'datepicker.schema.json', kind: 'input' },
  { type: 'dateTimeInput', schemaFile: 'datetimeinput.schema.json', kind: 'input' },
  { type: 'dateTimePicker', schemaFile: 'datetimepicker.schema.json', kind: 'input' },
  { type: 'dropdown', schemaFile: 'dropdown.schema.json', kind: 'input' },
  { type: 'list', schemaFile: 'list.schema.json', kind: 'input' },
  { type: 'markdown', schemaFile: 'markdown.schema.json', kind: 'input' },
  { type: 'number', schemaFile: 'number.schema.json', kind: 'input' },
  { type: 'password', schemaFile: 'password.schema.json', kind: 'input' },
  { type: 'radiogroup', schemaFile: 'radiogroup.schema.json', kind: 'input' },
  { type: 'rangeCalendar', schemaFile: 'rangecalendar.schema.json', kind: 'input' },
  { type: 'rangeDateInput', schemaFile: 'rangedateinput.schema.json', kind: 'input' },
  { type: 'rangeDatePicker', schemaFile: 'rangedatepicker.schema.json', kind: 'input' },
  { type: 'rangeDateTimeInput', schemaFile: 'rangedatetimeinput.schema.json', kind: 'input' },
  { type: 'rangeDateTimeCalendar', schemaFile: 'rangedatetimecalendar.schema.json', kind: 'input' },
  { type: 'rangeDateTimePicker', schemaFile: 'rangedatetimepicker.schema.json', kind: 'input' },
  { type: 'rangeTimeInput', schemaFile: 'rangetimeinput.schema.json', kind: 'input' },
  { type: 'rangeTimePicker', schemaFile: 'rangetimepicker.schema.json', kind: 'input' },
  { type: 'repeater', schemaFile: 'repeater.schema.json', kind: 'input' },
  { type: 'select', schemaFile: 'select.schema.json', kind: 'input' },
  { type: 'tags', schemaFile: 'tags.schema.json', kind: 'input' },
  { type: 'textarea', schemaFile: 'textarea.schema.json', kind: 'input' },
  { type: 'textinput', schemaFile: 'textinput.schema.json', kind: 'input' },
  { type: 'timeInput', schemaFile: 'timeinput.schema.json', kind: 'input' },
  { type: 'timePicker', schemaFile: 'timepicker.schema.json', kind: 'input' },
  { type: 'toggle', schemaFile: 'toggle.schema.json', kind: 'input' },
  { type: 'accordion', schemaFile: 'accordion.schema.json', kind: 'layout' },
  { type: 'flex', schemaFile: 'flex.schema.json', kind: 'layout' },
  { type: 'grid', schemaFile: 'grid.schema.json', kind: 'layout' },
  { type: 'tabs', schemaFile: 'tabs.schema.json', kind: 'layout' },
  { type: 'alert', schemaFile: 'alert.schema.json', kind: 'display' },
  { type: 'markdownText', schemaFile: 'markdowntext.schema.json', kind: 'display' },
  // No schemaFile: the renderer props contain a render function, which JSON
  // cannot express. Listing it in knownWidgetTypes rejects it in JSON forms.
  { type: 'renderer', kind: 'display' },
  { type: 'button', schemaFile: 'button.schema.json', kind: 'action' },
];

/**
 * The gui schema generation config, consumed by `tools/generate-schemas.ts`
 * (run with `npm run generate:schemas`).
 */
export const guiSchemaConfig: ImplementationSchemaConfig = {
  implementation: 'gui',
  idBase: 'https://golemui.com/schemas/gui/',
  manifest: guiWidgetManifest,
  includeSchemalessTypesInKnownWidgetTypes: true,
};
