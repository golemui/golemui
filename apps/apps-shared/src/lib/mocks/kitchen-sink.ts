import type { Form } from '@golemui/core';
import { resolveChunkRefsSync } from '../utils/resolve-chunk-refs-sync';
import { type Example } from './types';
import kitchenSinkJson from './kitchen-sink.form.json';
import alertChunk from './tabs/alert.form-chunk.json';
import buttonChunk from './tabs/button.form-chunk.json';
import markdownTextChunk from './tabs/markdown-text.form-chunk.json';
import accordionChunk from './tabs/accordion.form-chunk.json';
import flexChunk from './tabs/flex.form-chunk.json';
import gridChunk from './tabs/grid.form-chunk.json';
import textinputChunk from './tabs/textinput.form-chunk.json';
import passwordChunk from './tabs/password.form-chunk.json';
import numberChunk from './tabs/number.form-chunk.json';
import currencyChunk from './tabs/currency.form-chunk.json';
import dateinputChunk from './tabs/dateinput.form-chunk.json';
import calendarChunk from './tabs/calendar.form-chunk.json';
import datepickerChunk from './tabs/datepicker.form-chunk.json';
import rangedateinputChunk from './tabs/rangedateinput.form-chunk.json';
import rangetimeinputChunk from './tabs/rangetimeinput.form-chunk.json';
import rangedatetimeinputChunk from './tabs/rangedatetimeinput.form-chunk.json';
import rangedatetimecalendarChunk from './tabs/rangedatetimecalendar.form-chunk.json';
import rangedatetimepickerChunk from './tabs/rangedatetimepicker.form-chunk.json';
import rangetimepickerChunk from './tabs/rangetimepicker.form-chunk.json';
import rangecalendarChunk from './tabs/rangecalendar.form-chunk.json';
import rangedatepickerChunk from './tabs/rangedatepicker.form-chunk.json';
import timeinputChunk from './tabs/timeinput.form-chunk.json';
import timepickerChunk from './tabs/timepicker.form-chunk.json';
import datetimeinputChunk from './tabs/datetimeinput.form-chunk.json';
import datetimecalendarChunk from './tabs/datetimecalendar.form-chunk.json';
import datetimepickerChunk from './tabs/datetimepicker.form-chunk.json';
import markdownChunk from './tabs/markdown.form-chunk.json';
import textareaChunk from './tabs/textarea.form-chunk.json';
import checkboxChunk from './tabs/checkbox.form-chunk.json';
import toggleChunk from './tabs/toggle.form-chunk.json';
import radiogroupChunk from './tabs/radiogroup.form-chunk.json';
import selectChunk from './tabs/select.form-chunk.json';
import dropdownChunk from './tabs/dropdown.form-chunk.json';
import listChunk from './tabs/list.form-chunk.json';
import repeaterChunk from './tabs/repeater.form-chunk.json';
import tagsChunk from './tabs/tags.form-chunk.json';

// Chunk modules keyed by the exact $ref strings used in kitchen-sink.form.json.
// The resolver throws on a ref with no entry here, and kitchen-sink.equivalence.spec.ts
// imports this file, so a new tab chunk without a map entry fails that spec.
const chunks: Record<string, unknown> = {
  './tabs/alert.form-chunk.json': alertChunk,
  './tabs/button.form-chunk.json': buttonChunk,
  './tabs/markdown-text.form-chunk.json': markdownTextChunk,
  './tabs/accordion.form-chunk.json': accordionChunk,
  './tabs/flex.form-chunk.json': flexChunk,
  './tabs/grid.form-chunk.json': gridChunk,
  './tabs/textinput.form-chunk.json': textinputChunk,
  './tabs/password.form-chunk.json': passwordChunk,
  './tabs/number.form-chunk.json': numberChunk,
  './tabs/currency.form-chunk.json': currencyChunk,
  './tabs/dateinput.form-chunk.json': dateinputChunk,
  './tabs/calendar.form-chunk.json': calendarChunk,
  './tabs/datepicker.form-chunk.json': datepickerChunk,
  './tabs/rangedateinput.form-chunk.json': rangedateinputChunk,
  './tabs/rangetimeinput.form-chunk.json': rangetimeinputChunk,
  './tabs/rangedatetimeinput.form-chunk.json': rangedatetimeinputChunk,
  './tabs/rangedatetimecalendar.form-chunk.json': rangedatetimecalendarChunk,
  './tabs/rangedatetimepicker.form-chunk.json': rangedatetimepickerChunk,
  './tabs/rangetimepicker.form-chunk.json': rangetimepickerChunk,
  './tabs/rangecalendar.form-chunk.json': rangecalendarChunk,
  './tabs/rangedatepicker.form-chunk.json': rangedatepickerChunk,
  './tabs/timeinput.form-chunk.json': timeinputChunk,
  './tabs/timepicker.form-chunk.json': timepickerChunk,
  './tabs/datetimeinput.form-chunk.json': datetimeinputChunk,
  './tabs/datetimecalendar.form-chunk.json': datetimecalendarChunk,
  './tabs/datetimepicker.form-chunk.json': datetimepickerChunk,
  './tabs/markdown.form-chunk.json': markdownChunk,
  './tabs/textarea.form-chunk.json': textareaChunk,
  './tabs/checkbox.form-chunk.json': checkboxChunk,
  './tabs/toggle.form-chunk.json': toggleChunk,
  './tabs/radiogroup.form-chunk.json': radiogroupChunk,
  './tabs/select.form-chunk.json': selectChunk,
  './tabs/dropdown.form-chunk.json': dropdownChunk,
  './tabs/list.form-chunk.json': listChunk,
  './tabs/repeater.form-chunk.json': repeaterChunk,
  './tabs/tags.form-chunk.json': tagsChunk,
};

const data = {
  listName: 'Development Team',
  currency: 1000000,
  dropdowns: {
    defaultListRenderer: 0,
    disabledList: 0,
    customItemRenderer: 'two',
  },
  lists: {
    defaultListRenderer: 0,
    disabledList: 0,
    customItemRenderer: 'one',
  },
  selects: {
    greeting: 'bye',
    wrongGreeting: 'aaaaaa',
    greetingIndex: 2,
  },
  radiogroups: {
    greeting: 'bye',
    wrongGreeting: 'aaaaaa',
    greetingIndex: 2,
  },
  repeaters: {
    users: [
      {
        firstName: 'Alice',
        lastName: 'Johnson',
      },
      {
        firstName: '',
        lastName: 'Smith',
      },
      {
        firstName: 'Charlie',
      },
      {
        firstName: 'Diana',
        lastName: 'Rodriguez',
      },
    ],
  },
  tags: {
    basic: ['hello', 'world'],
    withIcon: [],
    noDuplicates: ['unique'],
    limited: [],
    scrollable: [
      'design',
      'product',
      'engineering',
      'research',
      'marketing',
      'analytics',
      'operations',
      'support',
      'finance',
      'legal',
      'people',
    ],
    validated: ['design', 'product'],
    disabled: ['read', 'only'],
    readonly: ['frozen'],
  },
};

/**
 * i18next Resource Bundle
 */
const resources = {};

export const kitchenSink: Example = {
  data,
  form: resolveChunkRefsSync(kitchenSinkJson, chunks) as unknown as Form<string>,
  resources,
};
