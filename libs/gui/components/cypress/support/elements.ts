import type { RuleObject } from 'axe-core';
import type { FileItem } from '../../src/lib/types';

/** Every GolemUI element, with the props it needs to render something meaningful. */
export interface ElementCase {
  tag: string;
  /** Props set before the element connects. */
  props: Record<string, unknown>;
  /** For a form control: the property that holds its value, and a sample value. */
  form?: { property: 'value' | 'values'; sample: unknown };
  /** axe rules off for this element, each with the reason next to it. */
  rules?: RuleObject;
  /** Nodes axe skips, each with the reason next to it. */
  exclude?: string[];
  /** Renders no children of its own: its host renders them. */
  hostRendersChildren?: boolean;
}

export const options = [
  { label: 'Red', value: 'red' },
  { label: 'Green', value: 'green' },
];

export const file: FileItem = {
  id: 'file-1',
  name: 'notes.txt',
  size: 3,
  type: 'text/plain',
  status: 'uploaded',
};

const dateRange = [{ start: '2026-03-01', end: '2026-03-05' }];
const dateTimeRange = [{ start: '2026-03-01T09:00:00', end: '2026-03-05T17:00:00' }];
const timeRange = [{ start: '09:00:00', end: '17:00:00' }];

// A listbox's options are its host's children (GolemUI Forms renders them), so on its own it
// has none.
const hostRenderedOptions: RuleObject = { 'aria-required-children': { enabled: false } };

// Without an upload service the whole field is inactive, and WCAG 1.4.3 exempts the text of
// inactive components from contrast: the message explaining why is inside it.
const inactiveUpload = ['.gui-file-upload__service-error'];

export const elements: ElementCase[] = [
  { tag: 'gui-button', props: { label: 'Save' } },
  {
    tag: 'gui-calendar',
    props: { label: 'Day' },
    form: { property: 'value', sample: '2026-03-15' },
  },
  { tag: 'gui-checkbox', props: { label: 'I agree' }, form: { property: 'value', sample: true } },
  { tag: 'gui-currency', props: { label: 'Price' }, form: { property: 'value', sample: 12.5 } },
  { tag: 'gui-date', props: { label: 'Start' }, form: { property: 'value', sample: '2026-03-15' } },
  {
    tag: 'gui-date-picker',
    props: { label: 'Start' },
    form: { property: 'value', sample: '2026-03-15' },
  },
  {
    tag: 'gui-date-time',
    props: { label: 'Start' },
    form: { property: 'value', sample: '2026-03-15T10:30:00' },
  },
  {
    tag: 'gui-date-time-calendar',
    props: { label: 'Start' },
    form: { property: 'value', sample: '2026-03-15T10:30:00' },
  },
  {
    tag: 'gui-date-time-picker',
    props: { label: 'Start' },
    form: { property: 'value', sample: '2026-03-15T10:30:00' },
  },
  { tag: 'gui-errors', props: { errors: ['Required'], touched: true } },
  {
    tag: 'gui-file-upload',
    props: { label: 'Avatar' },
    form: { property: 'value', sample: file },
    exclude: inactiveUpload,
  },
  { tag: 'gui-label', props: { label: 'Name', hint: 'Your full name' } },
  {
    tag: 'gui-list',
    props: { label: 'Color', items: options, valueField: 'value' },
    form: { property: 'value', sample: 'red' },
    rules: hostRenderedOptions,
    hostRendersChildren: true,
  },
  { tag: 'gui-markdown', props: { label: 'Bio' }, form: { property: 'value', sample: '# Hi' } },
  {
    tag: 'gui-markdown-text',
    props: { md: 'Hello', dependencies: { markdown: { parse: (md: string) => `<p>${md}</p>` } } },
  },
  {
    tag: 'gui-multi-file-upload',
    props: { label: 'Files' },
    form: { property: 'values', sample: [file] },
    exclude: inactiveUpload,
  },
  {
    tag: 'gui-multi-list',
    props: { label: 'Colors', items: options, valueField: 'value' },
    form: { property: 'values', sample: ['red'] },
    rules: hostRenderedOptions,
    hostRendersChildren: true,
  },
  { tag: 'gui-multi-select-trigger', props: {} },
  { tag: 'gui-number', props: { label: 'Age' }, form: { property: 'value', sample: 42 } },
  {
    tag: 'gui-password',
    props: { label: 'Password' },
    form: { property: 'value', sample: 'secret' },
  },
  {
    tag: 'gui-pills',
    props: {
      items: [
        { key: 'a', label: 'Alpha' },
        { key: 'b', label: 'Beta' },
      ],
      removable: true,
    },
  },
  {
    tag: 'gui-radiogroup',
    props: { label: 'Color', options },
    form: { property: 'value', sample: 'red' },
  },
  {
    tag: 'gui-range-calendar',
    props: { label: 'Stay' },
    form: { property: 'value', sample: dateRange },
  },
  {
    tag: 'gui-range-date',
    props: { label: 'Stay' },
    form: { property: 'value', sample: dateRange },
  },
  {
    tag: 'gui-range-date-picker',
    props: { label: 'Stay' },
    form: { property: 'value', sample: dateRange },
  },
  {
    tag: 'gui-range-date-time',
    props: { label: 'Stay' },
    form: { property: 'value', sample: dateTimeRange },
  },
  {
    tag: 'gui-range-date-time-calendar',
    props: { label: 'Stay' },
    form: { property: 'value', sample: dateTimeRange },
  },
  {
    tag: 'gui-range-date-time-picker',
    props: { label: 'Stay' },
    form: { property: 'value', sample: dateTimeRange },
  },
  {
    tag: 'gui-range-time',
    props: { label: 'Shift' },
    form: { property: 'value', sample: timeRange },
  },
  {
    tag: 'gui-range-time-picker',
    props: { label: 'Shift' },
    form: { property: 'value', sample: timeRange },
  },
  {
    tag: 'gui-select',
    props: { label: 'Color', options },
    form: { property: 'value', sample: 'red' },
  },
  {
    tag: 'gui-tags',
    props: { label: 'Tags' },
    form: { property: 'value', sample: ['lit', 'css'] },
  },
  { tag: 'gui-textarea', props: { label: 'Bio' }, form: { property: 'value', sample: 'Hello' } },
  { tag: 'gui-textinput', props: { label: 'Name' }, form: { property: 'value', sample: 'Ada' } },
  { tag: 'gui-time', props: { label: 'At' }, form: { property: 'value', sample: '10:30:00' } },
  { tag: 'gui-time-list', props: { label: 'At' } },
  {
    tag: 'gui-time-picker',
    props: { label: 'At' },
    form: { property: 'value', sample: '10:30:00' },
  },
  {
    tag: 'gui-toggle',
    props: { label: 'Notifications' },
    form: { property: 'value', sample: true },
  },
];
