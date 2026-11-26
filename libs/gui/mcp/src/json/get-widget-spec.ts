import { COMPONENT_SCHEMAS, VALIDATORS_SCHEMA, type WidgetSchema } from './schemas/index';

export type GetWidgetSpecInput = {
  widgetType: string;
};

export type GetWidgetSpecResult = {
  widgetType: string;
  schema: WidgetSchema;
  kind: string;
  example: Record<string, unknown>;
  notes: string[];
};

const EXAMPLES: Record<string, Record<string, unknown>> = {
  accordion: {
    kind: 'layout',
    type: 'accordion',
    props: {
      sections: [
        { uid: 'personal', label: 'Personal' },
        { uid: 'preferences', label: 'Preferences' },
      ],
    },
    children: [
      { kind: 'input', type: 'textinput', path: 'firstName', label: 'First name' },
      { kind: 'input', type: 'checkbox', path: 'newsletter', label: 'Newsletter' },
    ],
  },
  textinput: {
    kind: 'input',
    type: 'textinput',
    path: 'firstName',
    label: 'First name',
    validator: { type: 'string', required: true, minLength: 1 },
    props: { placeholder: 'Jane' },
  },
  textarea: {
    kind: 'input',
    type: 'textarea',
    path: 'bio',
    label: 'Bio',
    props: { minimumHeight: 120, autoGrow: true },
  },
  tags: {
    kind: 'input',
    type: 'tags',
    path: 'keywords',
    label: 'Keywords',
    defaultValue: [],
    props: {
      placeholder: 'Add a keyword and press Enter',
      separators: ['Enter', ','],
      trim: true,
    },
    validator: {
      type: 'array',
      minItems: 1,
      maxItems: 10,
    },
  },
  password: {
    kind: 'input',
    type: 'password',
    path: 'password',
    label: 'Password',
    validator: { type: 'string', required: true, minLength: 8 },
  },
  otp: {
    kind: 'input',
    type: 'otp',
    path: 'verificationCode',
    label: 'Verification code',
    props: { groups: [3, 3] },
    validator: {
      type: 'string',
      required: true,
      exactLength: 6,
      messages: {
        required: 'Enter the code',
        invalid: 'Enter the code',
        exactLength: 'Enter all 6 digits',
      },
    },
  },
  number: {
    kind: 'input',
    type: 'number',
    path: 'age',
    label: 'Age',
    validator: { type: 'integer', required: true, minimum: 0 },
  },
  currency: {
    kind: 'input',
    type: 'currency',
    path: 'salary',
    label: 'Salary',
    props: { currency: 'USD' },
  },
  slider: {
    kind: 'input',
    type: 'slider',
    path: 'volume',
    label: 'Volume',
    props: { maximum: 100, step: 10, marks: true },
    validator: { type: 'number', required: true, messages: { invalid: 'Pick a volume' } },
  },
  rangeSlider: {
    kind: 'input',
    type: 'rangeSlider',
    path: 'price',
    label: 'Price per night',
    props: {
      maximum: 500,
      step: 10,
      format: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 },
    },
    validator: { type: 'range', required: true, messages: { required: 'Pick a price range' } },
  },
  checkbox: {
    kind: 'input',
    type: 'checkbox',
    path: 'termsAccepted',
    label: 'I accept the terms',
    validator: {
      type: 'boolean',
      required: true,
      const: true,
      messages: {
        invalid: 'You must accept the terms',
        const: 'You must accept the terms',
      },
    },
  },
  toggle: {
    kind: 'input',
    type: 'toggle',
    path: 'notifications',
    label: 'Email notifications',
  },
  dropdown: {
    kind: 'input',
    type: 'dropdown',
    path: 'country',
    label: 'Country',
    props: {
      labelField: 'label',
      valueField: 'value',
      items: [
        { label: 'United States', value: 'us', flag: '🇺🇸' },
        { label: 'Canada', value: 'ca', flag: '🇨🇦' },
      ],
    },
  },
  multiDropdown: {
    kind: 'input',
    type: 'multiDropdown',
    path: 'countries',
    label: 'Countries',
    defaultValue: ['us'],
    props: {
      labelField: 'label',
      valueField: 'value',
      items: [
        { label: 'United States', value: 'us', flag: '🇺🇸' },
        { label: 'Canada', value: 'ca', flag: '🇨🇦' },
      ],
    },
  },
  multiList: {
    kind: 'input',
    type: 'multiList',
    path: 'toppings',
    label: 'Toppings',
    props: {
      items: ['Cheese', 'Bacon', 'Mushrooms'],
    },
  },
  fileUpload: {
    kind: 'input',
    type: 'fileUpload',
    path: 'cv',
    label: 'CV',
    props: {
      accept: ['application/pdf', '.docx'],
      maxSize: 5242880,
      buttonLabel: 'Upload CV',
      hint: 'PDF or Word, 5 MB max',
    },
    validator: {
      type: 'file',
      required: true,
      messages: {
        required: 'Please upload your CV',
        pendingUploads: 'Wait for the upload to finish',
      },
    },
  },
  multiFileUpload: {
    kind: 'input',
    type: 'multiFileUpload',
    path: 'attachments',
    label: 'Attachments',
    props: {
      accept: ['image/*'],
      buttonLabel: 'Upload images',
    },
    validator: {
      type: 'files',
      required: true,
      maxItems: 3,
      messages: {
        required: 'Add at least one image',
        maxItems: 'No more than 3 images',
      },
    },
  },
  select: {
    kind: 'input',
    type: 'select',
    path: 'plan',
    label: 'Plan',
    props: {
      options: [
        { label: 'Free', value: 'free' },
        { label: 'Pro', value: 'pro' },
      ],
    },
  },
  radiogroup: {
    kind: 'input',
    type: 'radiogroup',
    path: 'shippingSpeed',
    label: 'Shipping',
    props: {
      options: [
        { label: 'Standard', value: 'standard' },
        { label: 'Express', value: 'express' },
      ],
    },
  },
  checkboxGroup: {
    kind: 'input',
    type: 'checkboxGroup',
    path: 'toppings',
    label: 'Toppings',
    props: {
      options: [
        { label: 'Cheese', value: 'cheese' },
        { label: 'Ham', value: 'ham' },
        { label: 'Olives', value: 'olives' },
      ],
    },
    validator: {
      type: 'array',
      required: true,
      maxItems: 2,
      messages: {
        invalid: 'Pick a topping',
        required: 'Pick a topping',
        maxItems: 'Pick at most two',
      },
    },
  },
  rating: {
    kind: 'input',
    type: 'rating',
    path: 'service',
    label: 'Service',
    validator: {
      type: 'integer',
      required: true,
      maximum: 5,
      messages: { invalid: 'Rate the service' },
    },
  },
  dateInput: {
    kind: 'input',
    type: 'dateInput',
    path: 'birthDate',
    label: 'Birth date',
  },
  datePicker: {
    kind: 'input',
    type: 'datePicker',
    path: 'startDate',
    label: 'Start date',
  },
  calendar: {
    kind: 'input',
    type: 'calendar',
    path: 'eventDate',
    label: 'Event date',
  },
  button: {
    kind: 'action',
    type: 'button',
    actionType: 'submit',
    label: 'Submit',
    props: { variant: 'filled' },
  },
  menuButton: {
    uid: 'rowActions',
    kind: 'action',
    type: 'menuButton',
    label: 'Actions',
    on: { click: 'rowAction' },
    props: {
      items: [
        { label: 'Edit', value: 'edit' },
        { label: 'Duplicate', value: 'duplicate' },
        { separator: true },
        { label: 'Delete', value: 'delete' },
      ],
    },
  },
  breadcrumb: {
    uid: 'trail',
    kind: 'action',
    type: 'breadcrumb',
    on: { click: 'navigate' },
    props: {
      items: [
        { label: 'Orders', value: 'orders' },
        { label: '2026', value: 'orders-2026' },
        { label: 'A-1042', value: 'order' },
      ],
    },
  },
  menu: {
    uid: 'mainMenu',
    kind: 'action',
    type: 'menu',
    label: 'Main',
    on: { click: 'navigate' },
    props: {
      current: '{{ $meta.view }}',
      items: [
        { label: 'Orders', value: 'orders', icon: 'receipt_long' },
        {
          label: 'Settings',
          value: 'settings',
          icon: 'settings',
          items: [
            { label: 'Profile', value: 'profile' },
            { label: 'Billing', value: 'billing' },
          ],
        },
      ],
    },
  },
  alert: {
    kind: 'display',
    type: 'alert',
    props: { level: 'info', text: 'Heads up!' },
  },
  badge: {
    kind: 'display',
    type: 'badge',
    props: { text: 'Paid', level: 'success' },
  },
  progress: {
    kind: 'display',
    type: 'progress',
    props: { label: 'Profile', value: 40, showValue: true },
  },
  spinner: {
    kind: 'display',
    type: 'spinner',
    include: { in: ['loading'] },
    props: { label: 'Loading results' },
  },
  typography: {
    kind: 'display',
    type: 'typography',
    props: { text: 'Your booking', variant: 'h2' },
  },
  image: {
    kind: 'display',
    type: 'image',
    props: {
      src: 'https://example.com/room.jpg',
      alt: 'Double room with a sea view',
      ratio: '16/9',
      fit: 'cover',
      caption: 'Room 204',
    },
  },
  table: {
    kind: 'display',
    type: 'table',
    props: {
      caption: 'Open orders',
      columns: [
        { key: 'id', label: 'Order' },
        { key: 'date', label: 'Date', type: 'date' },
        { key: 'total', label: 'Total', type: 'number' },
      ],
      rows: [
        { id: 'A-1042', date: '2026-11-20', total: 1280.5 },
        { id: 'A-1043', date: '2026-11-22', total: 310 },
      ],
      emptyMessage: 'No open orders',
    },
  },
  markdownText: {
    kind: 'display',
    type: 'markdownText',
    props: { md: 'Welcome to the form.' },
  },
  grid: {
    kind: 'layout',
    type: 'grid',
    props: { direction: 'row' },
    children: [
      { kind: 'input', type: 'textinput', path: 'firstName', label: 'First name' },
      { kind: 'input', type: 'textinput', path: 'lastName', label: 'Last name' },
    ],
  },
  tabs: {
    kind: 'layout',
    type: 'tabs',
    props: {
      tabs: [
        { uid: 'personal', label: 'Personal' },
        { uid: 'address', label: 'Address' },
      ],
    },
    children: [
      { kind: 'input', type: 'textinput', path: 'firstName', label: 'First name' },
      { kind: 'input', type: 'textinput', path: 'street', label: 'Street' },
    ],
  },
  sidebar: {
    uid: 'shell',
    kind: 'layout',
    type: 'sidebar',
    props: { sideLabel: 'Main', toggleLabel: 'Open menu' },
    children: [
      {
        uid: 'mainMenu',
        kind: 'action',
        type: 'menu',
        label: 'Main',
        on: { click: 'navigate' },
        props: {
          current: '{{ $meta.view }}',
          items: [
            { label: 'Orders', value: 'orders' },
            { label: 'Customers', value: 'customers' },
          ],
        },
      },
      {
        uid: 'content',
        kind: 'layout',
        type: 'grid',
        children: [{ kind: 'input', type: 'textinput', path: 'search', label: 'Search' }],
      },
    ],
  },
  repeater: {
    kind: 'input',
    type: 'repeater',
    path: 'addresses',
    label: 'Addresses',
    props: {
      addLabel: 'Add address',
      removeLabel: 'Remove',
      template: {
        kind: 'layout',
        type: 'grid',
        children: [
          // Child paths inside a repeater template MUST be `<repeater.path>.items.<field>` —
          // `items` is the reserved segment that the runtime expands per array entry.
          { kind: 'input', type: 'textinput', path: 'addresses.items.street', label: 'Street' },
          { kind: 'input', type: 'textinput', path: 'addresses.items.city', label: 'City' },
        ],
      },
    },
  },
};

// Shared by `dropdown` and `multiDropdown`: an agent reads one spec at a time, so each repeats them.
const DROPDOWN_LOAD_NOTE =
  'Items can load at runtime: set `props.items: []` (the key is required) and `on: { load: "<event name>" }`. The widget emits the event once when it mounts, in the browser only. The host handles it in `formEvent` and answers `event.callback({ type: "OVERRIDE_WIDGET_PROP", payload: { path: "<widget path>", prop: "items", value: [...] } })`. The event does not say which widget sent it: use one event name per field.';
const DROPDOWN_FILTER_NOTE =
  'Server-side search: add `on: { filter: "<event name>" }`. The widget then stops filtering locally: it emits the typed text as `event.detail`, `props.inputDebounce` ms after the last keystroke (default 500), and the host answers with the same `OVERRIDE_WIDGET_PROP`. Without `on.filter`, the widget filters its current items itself.';

/** The value note of the multiRange* widgets: an array of ranges, never one range. */
function multiRangeNote(example: string, single?: string): string {
  return (
    `The value is a LIST of ranges, an array such as \`[${example}]\`, never one \`{ start, end }\` object. ` +
    'The user adds ranges one at a time and each shows as a pill. Validate with an array validator: ' +
    '`{ type: "array", required: true, minItems: 1 }`; `maxItems` sets the most ranges the value may hold.' +
    (single ? ` For ONE range (check-in and check-out, a trip), use \`${single}\`.` : '')
  );
}

/** The value note of the single range widgets: one range with both ends, never a list. */
function singleRangeNote(example: string, multi: string): string {
  return (
    `The value is ONE range, an object such as \`${example}\`, with both ends set, or nothing. Never a list: ` +
    `for several ranges, use \`${multi}\`. A one-day range has the same start and end, and the value never ` +
    'holds a range with one end. Validate with the range validator: `{ type: "range", required: true }` ' +
    '(it also rejects anything that is not a `{ start, end }` with `start <= end`). Message keys: `required`, ' +
    '`invalid`.'
  );
}

const SINGLE_DATE_PICK_NOTE =
  'Picking takes two clicks: the first starts a new range and stops showing the old one, the second sets ' +
  'the value. Escape drops an unfinished pick.';
const DATE_RANGE = '{ "start": "2026-02-02", "end": "2026-02-06" }';
const DATE_TIME_RANGE = '{ "start": "2026-02-13T09:00:00", "end": "2026-02-13T11:00:00" }';
const TIME_RANGE = '{ "start": "09:00", "end": "12:30" }';

const DATE_TIME_BOUNDS_NOTE =
  '`minDateTime`, `maxDateTime` and `disabledRanges` (`{ start, end }` ISO date-time spans) are props, not validator rules: a range outside them or over a disabled span is rejected whole with `minDateTimeMessage`, `maxDateTimeMessage` or `disabledRangeMessage`, and the value stays as it was.';

const NOTES: Record<string, string[]> = {
  rangeCalendar: [
    singleRangeNote(DATE_RANGE, 'multiRangeCalendar'),
    SINGLE_DATE_PICK_NOTE,
    'Days outside `minDate` and `maxDate` or inside `disabledRanges` cannot be picked, and a range over a disabled day is rejected whole with `disabledDateRangeMessage`. They are props, not validator rules.',
    'There is no way to clear the calendar once a range is set; use `rangeDatePicker` or `rangeDateInput` when the field may be left empty again.',
  ],
  rangeDateInput: [
    singleRangeNote(DATE_RANGE, 'multiRangeDateInput'),
    'The user types the start and the end date. A reversed pair is stored in order. Emptying both dates clears the value; leaving with one date typed shows `incompleteMessage`.',
  ],
  rangeDatePicker: [
    singleRangeNote(DATE_RANGE, 'multiRangeDatePicker'),
    `${SINGLE_DATE_PICK_NOTE} The popup closes when the range is complete. The dates can be typed too, as in \`rangeDateInput\`.`,
    '`minDate`, `maxDate` and `disabledRanges` are props, not validator rules: a range outside them or over a disabled day is rejected whole, picked or typed, with `minDateMessage`, `maxDateMessage` or `disabledDateRangeMessage`, and the value stays as it was.',
  ],
  multiRangeCalendar: [multiRangeNote(DATE_RANGE, 'rangeCalendar')],
  multiRangeDateInput: [multiRangeNote(DATE_RANGE, 'rangeDateInput')],
  multiRangeDatePicker: [multiRangeNote(DATE_RANGE, 'rangeDatePicker')],
  rangeTimeInput: [
    singleRangeNote(TIME_RANGE, 'multiRangeTimeInput'),
    'The user types the start and the end time. The end must be strictly after the start, so a range never runs past midnight: otherwise `rangeOrderMessage` shows and the times are not swapped. A time outside `minTime`/`maxTime` shows `minTimeMessage`/`maxTimeMessage`. Emptying both times clears the value; leaving with one time typed shows `incompleteMessage`.',
  ],
  rangeTimePicker: [
    singleRangeNote(TIME_RANGE, 'multiRangeTimePicker'),
    'A start and an end time list in a popup. Picking a start begins a new range and empties the end; picking an end sets the value and closes the popup; picking only an end changes the end of the range. The end list offers only times after the start. Times come only from the lists unless `allowCustomTime: true`.',
    '`minTime`, `maxTime` and `disabledRanges` (`{ start, end }` ISO times) are props, not validator rules: a range outside them or over a disabled time is rejected with `minTimeMessage`, `maxTimeMessage` or `disabledRangeMessage`, and the value stays as it was.',
  ],
  rangeDateTimeCalendar: [
    singleRangeNote(DATE_TIME_RANGE, 'multiRangeDateTimeCalendar'),
    "Two time pickers above the days show the range's times. Two clicks on the days pick new days with those times: the first starts the pick and stops showing the old range, the second sets the value. Picking a time changes that time of the range. On an empty calendar both days and both times are needed, in any order. Escape drops an unfinished pick.",
    DATE_TIME_BOUNDS_NOTE,
  ],
  rangeDateTimeInput: [
    singleRangeNote(DATE_TIME_RANGE, 'multiRangeDateTimeInput'),
    'The user types the start and the end, each a date and a time. A reversed pair is stored in order. Emptying both clears the value; leaving with one end typed shows `incompleteMessage`.',
    DATE_TIME_BOUNDS_NOTE,
  ],
  rangeDateTimePicker: [
    singleRangeNote(DATE_TIME_RANGE, 'multiRangeDateTimePicker'),
    'Picked in the calendar as in `rangeDateTimeCalendar`, or typed as in `rangeDateTimeInput`. The popup closes when the range is complete.',
    DATE_TIME_BOUNDS_NOTE,
  ],
  multiRangeDateTimeCalendar: [multiRangeNote(DATE_TIME_RANGE, 'rangeDateTimeCalendar')],
  multiRangeDateTimeInput: [multiRangeNote(DATE_TIME_RANGE, 'rangeDateTimeInput')],
  multiRangeDateTimePicker: [multiRangeNote(DATE_TIME_RANGE, 'rangeDateTimePicker')],
  multiRangeTimeInput: [multiRangeNote(TIME_RANGE, 'rangeTimeInput')],
  multiRangeTimePicker: [multiRangeNote(TIME_RANGE, 'rangeTimePicker')],
  textinput: [
    '`path` is the dot-path into form data this field writes to.',
    '`validator.format` supports: `email`, `hostname`, `ipv4`, `ipv6`, `url`, `uuid`, `date`, `time`, `date-time`, `duration`.',
    'Add custom `validator.messages` (per-rule map) on production forms — the library defaults are developer-facing. When `required: true`, ALWAYS also set `messages.invalid` with the same text as `messages.required`: an `undefined`/`null` value (pristine or cleared) fails the base type check and shows the `invalid` message, not the `required` one. Call `get_concept({ concept: "validation" })` for the full explanation.',
    'Root props `label`, `disabled`, `readonly`, `validator`, and `size` accept state suffixes — e.g. `"label.<stateName>": "New label"` overrides the label only when that named state is active. Props inside `props` (e.g. `hint`, `placeholder`) also accept suffixes as `"hint.<stateName>"`. Call `get_concept({ concept: "states" })` for the full pattern.',
    '`props.icon` accepts a Google Material Icons ligature name (e.g. `"search"`, `"email"`, `"lock"`) to display a decorative icon inside the input field. ' +
      'Supports state suffix: `"icon.<stateName>": "check"` to swap the icon when a state is active. ' +
      'Call `get_concept({ concept: "icons" })` for setup and the full list of icon-capable widgets.',
  ],
  markdown: [
    'The preview needs a `dependencies.markdown` parser in the form init config, or the preview stays blank. The preview inserts the parser output as HTML without sanitizing it, so for markdown from users or stored data the parser must remove raw HTML and `javascript:` links. Call `get_concept({ concept: "host-services" })`.',
  ],
  markdownText: [
    'Display-only widget for rendering markdown. Can be used as a top-level form widget (inside any layout) or inside templates like `dropdown.props.items[].template`.',
    'The required prop is `md` (the markdown string), not `text`.',
    'For a heading or a line of plain text with no links, lists or emphasis, use `typography` instead: it needs no parser and looks the same.',
    'REQUIRES a `dependencies.markdown` parser in the form init config, or it renders blank. The widget inserts the parser output as HTML without sanitizing it, so for markdown from users or stored data the parser must remove raw HTML and `javascript:` links. Call `get_concept({ concept: "host-services" })`.',
  ],
  tags: [
    'Use `tags` for free-form arrays of primitive values (typically `string[]`) — e.g. keywords, email lists, hashtags. Backing data is `string[]`. For arrays of structured objects, use `repeater` instead.',
    '`props.separators` controls which keys/characters commit a new tag. Defaults emit on `Enter` and `,`; you can also include `"Tab"` or `"blur"`. `props.trim` strips whitespace from each tag; a repeated tag is skipped unless `props.allowDuplicates` is `true`.',
    'Validate with an `arrayValidator`: `{ type: "array", minItems, maxItems, uniqueItems }`. Entry is never silently blocked — cap the tag count with `maxItems` so the user is told why.',
  ],
  fileUpload: [
    'Single-file upload rendered as a one-line input: the box is the drop target and holds the upload button; while the file uploads the box itself becomes the progress bar; once done it shows the file name with a remove button.',
    'REQUIRES a host transport in the form init config: `dependencies: { uploadService: { upload(file, { id, path, onProgress, signal }) => Promise<unknown>, remove?(item) => Promise<void> } }` (a sibling of `dependencies.markdown`). Keep the object reference stable — a new config identity re-initializes the form. Without it the widget renders disabled with an inline error. Call `get_concept({ concept: "host-services" })`.',
    'The value is a plain envelope, never the `File`: `{ id, name, size, type, status: "uploading" | "uploaded" | "error", error?, data? }` where `data` is exactly what `upload` resolved with. Preload from the server with `status: "uploaded"`. Removing awaits `uploadService.remove(item)` (when provided) before clearing. An item restored with `status: "uploading"` cannot resume — the `File` only existed in the session that picked it — so the widget shows it as failed with `props.interruptedMessage` (default: `{name} was not uploaded. Remove it and pick the file again.`) but leaves the stored value untouched: no `change` fires until the user removes it.',
    'Server file cleanup is the HOST\'s job. `uploadService.remove` runs only on an explicit user removal and when this widget replaces its file with a new pick (not awaited, failure only logged). A deleted repeater row, a field pruned by a state, `setData`, a config replacement or an abandoned form all leave the file on the server — the widget cannot know which of those makes it unwanted. Treat every `upload` result as provisional and reconcile server files against the submitted value (promote what the payload references, sweep the rest, e.g. with a TTL). Call `get_concept({ concept: "host-services" })`.',
    'Validate with a `fileValidator`: `{ type: "file", required, blockPendingUploads }`. `blockPendingUploads` defaults to true and fails while the file is uploading or failed, so an unfinished upload cannot be submitted. Message keys: `invalid`, `required`, `pendingUploads`.',
    '`props.accept` (`[".pdf", "image/*"]`) and `props.maxSize` (bytes) are checked BEFORE uploading; a refused or failed file stays in the box with retry/remove icon buttons — never dropped silently. The reason (server `reject(new Error(...))` message, or the default) surfaces in the standard error area below the input, like a date widget\'s invalid-date error. Text props: `buttonLabel`, `acceptMessage`, `maxSizeMessage`, `missingServiceMessage`, `removeAriaLabel`, `cancelAriaLabel`, `retryAriaLabel`, `uploadedMessage`, `removedMessage`, `failedMessage` (`{name}` token); icon overrides: `removeIcon`, `retryIcon`.',
  ],
  multiFileUpload: [
    'The array variant of `fileUpload`: same box, button, progress bar and `uploadService`. Files upload ONE AT A TIME; every finished file becomes a pill inside the box and the value is an array of envelopes.',
    'A failed file pauses the queue until it is retried or removed. The count is never silently blocked — cap it with `maxItems` so the user is told why.',
    'Same cleanup contract as `fileUpload`: `uploadService.remove` runs only when the user removes a pill; every other way an envelope leaves the array keeps the file on the server, so the HOST reconciles uploads against the submitted value.',
    'Validate with a `filesValidator`: `{ type: "files", required, minItems, maxItems, blockPendingUploads }`. Message keys: `invalid`, `required`, `minItems`, `maxItems`, `pendingUploads`.',
  ],
  radiogroup: [
    '`props.appearance: "segmented"` shows the options as a segmented control: a row of joined buttons, the selected one filled, for a few short options (Day / Week / Month, List / Grid). It is the same radio group (same value, keyboard, validation), not a separate widget. It is always a row, so `props.direction` does not apply, and it stacks in a narrow form. Past about five options, or with long labels, keep the default appearance or use a `dropdown`.',
  ],
  checkboxGroup: [
    "Checkboxes to pick ANY number of options from `props.options` (the same shapes as `radiogroup`: values, `{ label, value }`, or objects with `labelField` / `valueField`). The value is an ARRAY of the checked values, kept in the options' order whatever order they are checked in. For one option use `radiogroup`; for a long list use `multiList` or `multiDropdown`; for a single yes/no use `checkbox`.",
    'Validate with an array validator: `{ type: "array", required, minItems, maxItems }`. `required` means at least one checked. Message keys: `invalid`, `required`, `minItems`, `maxItems`; word the empty group with both `required` and `invalid` (an untouched group is undefined). `props.direction: "row"` lays it out in a row.',
  ],
  rating: [
    'A score in stars: an integer from 1 to the validator\'s `maximum`, which is also the number of stars (5 without one). There is no `max` prop: put `maximum` on an integer validator, `{ type: "integer", maximum: 10 }`. For a longer or finer scale, use `slider`.',
    'It has NO value until a star is picked; the user can clear it (a click on the picked star, or Delete / Backspace), also when the validator is `required`: a cleared required rating shows its error, as an emptied text field does. Word the missing value with `messages.invalid`: an unset value fails the integer type check. A `defaultValue` must be a whole number from 1.',
  ],
  otp: [
    'A one-time code (a verification code sent by SMS, email or an authenticator app): one box per digit. The value is a STRING of digits, so leading zeros survive (`"012345"`). For any other short text, use `textinput`.',
    'Digits only: anything else is dropped as it is typed or pasted, so `123-456` pastes as `"123456"`. The number of digits is the validator\'s `exactLength` (6 without one). `props.groups` splits the boxes visually, e.g. `[3, 3]`; the sizes must add up to that length, and the value never contains a separator.',
    'Validate with a string validator: `{ type: "string", required: true, exactLength: 6 }`, and word the empty code with both `messages.required` and `messages.invalid` (an untouched code is undefined, which fails the string check first). `exactLength` sets the code\'s length AND makes a code with only some of its digits invalid: word that with `messages.exactLength` (localizable). There is no `length` prop, and no need for `minLength`, `maxLength` or `pattern`: the widget keeps digits only, at most `exactLength` of them.',
    'Its input has `autocomplete="one-time-code"`, so phones offer the code from an SMS, and password managers fill it.',
  ],
  slider: [
    'A number picked by dragging a thumb along a track, between `props.minimum` (default 0) and `props.maximum` (default 100) in `props.step` (default 1). For an exact number the user types, use `number`.',
    'It has NO value until the user moves the thumb (the thumb rests at the minimum and the value shows "–"), so `required` works. Set `defaultValue` to start somewhere else. Validate with a number validator: `{ type: "number", required: true }`; set `messages.invalid` too, which is what an unset value shows.',
    "`props.marks`: `true` draws a tick at every step (up to 101), or a list of values and `{ value, label }` objects draws ticks there, with the labels under the track (`label` is localizable). `props.format` takes `Intl.NumberFormat` options (`style`: `decimal` | `currency` | `percent` | `unit`, `currency`, `unit`, fraction digits) for the value and the marks, in the form's locale.",
    '`props.valuePlacement`: `"label"` (default) shows the value at the end of the label, `"bubble"` over the thumb while it is hovered, focused or dragged, `"both"`, or `"hidden"`. Screen readers read the formatted value in every case.',
  ],
  rangeSlider: [
    'A range picked with two thumbs on one track. The value is ONE object `{ start, end }` of numbers, not an array (unlike the `multiRange*` date and time widgets). The thumbs can meet but not cross.',
    'Same props as `slider`: `minimum`, `maximum`, `step`, `marks`, `format`, `valuePlacement`. `props.startLabel` and `props.endLabel` rename the thumbs for screen readers (default "Minimum" and "Maximum"), e.g. "From" and "To".',
    'Validate with a range validator: `{ type: "range", required: true }`. It has no other rules: `required` fails while there is no range, and anything that is not a `{ start, end }` with both ends set and `start <= end` is `invalid`. Message keys: `required`, `invalid`.',
  ],
  dropdown: [
    'Use `dropdown` when the user finds one value by typing: it has a filter box (`searchFields`, default `labelField`) and virtual scrolling (`height`, `itemHeight`). Typical cases: a long list, items loaded at runtime, or records where the user reads a name and the form stores an id (`labelField: "name"`, `valueField: "id"`). For a short fixed list of plain options, use `select`.',
    '`props.items` is EITHER primitives `["one", 2, ...]` OR arbitrary objects `[{ label, value, ...extras }]`. Pair the object form with `labelField`/`valueField` to tell the dropdown which fields to render as label and which to use as the value. **Widget templates inside items (the `{template, value}` shape) are NOT supported — only `repeater` accepts widget templates.**',
    DROPDOWN_LOAD_NOTE,
    DROPDOWN_FILTER_NOTE,
  ],
  multiDropdown: [
    'Like `dropdown`, but the user picks several values: the value is an array of the selected item values, shown as removable pills next to the filter box. Validate with an array validator: `{ type: "array", required: true, minItems, maxItems }`; cap the count with `maxItems` so the user is told why.',
    DROPDOWN_LOAD_NOTE,
    DROPDOWN_FILTER_NOTE,
  ],
  select: [
    '`props.options[]` is the simple form: `[{ label: "United States", value: "us" }, ...]`. Use this for ANY short fixed list of plain text options — countries, plans, sizes, status enums. Switch to `dropdown` when the user needs to search, the list is long, the items load at runtime, or the items need custom rendering (icons, flags, rich layouts).',
    'For very large lists (>50 items) consider `dropdown` for its virtualization (`height`, `itemHeight`, `searchFields`).',
  ],
  grid: [
    'The one layout for everything: stacking sections, putting fields side by side, wrapping them in columns and placing a row of buttons.',
    '`props.direction`: `"column"` (default) stacks the children; `"row"` puts them on one line, sharing the width by each child\'s `size` (a child with `size: 2` is twice as wide as one with `size: 1`).',
    '`props.columns`: a number from 1 to 12, or `"auto"` — wraps the children in that many equal columns (a child spans `size` of them), or in as many as fit. Overrides `direction`.',
    '`props.gap`: `"none"` | `"xs"` | `"sm"` | `"md"` (default) | `"lg"` | `"xl"` — the space between the children. Never a number.',
    '`props.justify`, rows only: `"stretch"` (default) shares the width by `size`; `"start"` | `"center"` | `"end"` | `"space-between"` keep each child at its own width and place them. Use `{ direction: "row", justify: "end" }` for submit/cancel buttons on the right.',
    'In a row or columns, fields line up by part: labels and hints on top, controls in the middle (checkboxes, toggles and buttons centred on them), errors below. No sizing or alignment props are needed for that.',
    'Every grid stacks its children when its container is narrower than 480px.',
    'All `grid` props support state suffixes: `"direction.<stateName>": "column"` swaps the direction when a state is active. Call `get_concept({ concept: "states" })` for the full pattern.',
  ],
  tabs: [
    'Children are associated with tabs by **`uid` matching**, not by array order: each direct child must have a `uid` field at the widget level (alongside `kind`/`type`) whose string value equals one of the `props.tabs[].uid` entries. There is no `tag` property — that is not a real GolemUI field.',
    'Children are typically written in display order for readability, but rearranging them does not change which tab they belong to — only the `uid` string match does.',
  ],
  sidebar: [
    "An app layout with EXACTLY two `children`: the side region FIRST (usually a `menu`), the main region SECOND (usually a `grid`). A `sidebar` can't be the side child.",
    'It follows its own width, not the viewport: from 768px the side is a sticky column; below, the side hides and a toggle opens the SAME side region as a drawer over the content. It is rendered once, so it keeps its state (open menu groups, typed text) across the switch. Nothing to configure for that.',
    '`props.side`: `"start"` (default) or `"end"`. `props.sideSize`: `"sm"`, `"md"` (default) or `"lg"`. `props.sideLabel` names the side region (default "Menu"); `props.toggleLabel` names the toggle button (default "Open menu"). Both are localizable.',
    'The drawer closes on Escape, a click outside it, Tab out of it, and when the user picks something in it: an item of a `menu`, `breadcrumb` or `menuButton`, or a `button`. `on.change` reports `{ open }` when the drawer opens or closes. Keep forms in the main region: the drawer is not a modal dialog.',
    'If a state hides the side child, the main one takes the full width and there is no toggle.',
  ],
  accordion: [
    'Children are associated with sections by **`uid` matching** (same pattern as `tabs`): each direct child must have a `uid` field at the widget level whose value equals one of the `props.sections[].uid` entries. There is no `tag` property.',
    '`props.defaultOpen` is a map of `{ <sectionUid>: boolean }` controlling which sections start expanded.',
  ],
  repeater: [
    '`props.template` must be a layout widget (grid/tabs/accordion) whose children are the per-item fields.',
    'Child paths inside the template MUST follow the form `<repeater.path>.items.<fieldName>`. The `items` segment is reserved — the runtime substitutes it with the current array index per row. For example, a repeater at `path: "users"` with a child `firstName` uses `path: "users.items.firstName"`. Plain `firstName` will NOT bind to the array.',
    'Nested repeaters chain the convention: a repeater at `path: "teams"` whose template contains a repeater at `path: "teams.items.members"` whose children use `path: "teams.items.members.items.<field>"`.',
    '`addLabel` supports state suffixes: `"addLabel.<stateName>": "Limit reached"` swaps the add-button label when a named state is active — useful for capping array length. Call `get_concept({ concept: "states" })` for the full pattern.',
    '`readonly` hides the add and remove buttons, `disabled` disables them; the rows still render. Both take `true`, `{ when }` and a state suffix. They do NOT pass down to the template widgets: give those their own `readonly`/`disabled`, e.g. the same `{ when }` expression or state.',
  ],
  button: [
    '`actionType` controls the button\'s role. `actionType: "submit"` makes the button fire the form\'s `formSubmit` event natively — the host listens for it via `(formSubmit)` (Angular), `@formSubmit` (Vue), `onFormSubmit` (React), or the `form-submit` event (Lit). No custom handler needed. Use this for the primary submit button on a form.',
    '`actionType: "button"` (the default, can be omitted) is a regular action button. Wire it via `on.click: "<handlerName>"` where `<handlerName>` is registered in the form config\'s event handlers.',
    'Supports state-suffixed props: `"label.<stateName>"` and `"disabled.<stateName>"` swap the label or disabled state when a named state is active — e.g. disable the submit button until terms are accepted, then re-enable it. Call `get_concept({ concept: "states" })` for the full pattern.',
    '`props.icon` accepts a Google Material Icons ligature name (e.g. `"send"`, `"check"`, `"arrow_forward"`) to render an icon on the button. ' +
      '`props.iconPosition` controls placement: `"left"` (default) or `"right"`. ' +
      'Both support state suffixes: `"icon.<stateName>": "hourglass_empty"` swaps the icon while a state is active. ' +
      'Call `get_concept({ concept: "icons" })` for setup instructions and the full list of icon-capable widgets.',
    'An icon-only button (no `label`) MUST set `props.ariaLabel` (localizable), its accessible name for screen readers, e.g. `{ "icon": "close", "ariaLabel": "Close" }`. With a `label`, the label is the name and `ariaLabel` is ignored.',
    '`props.tooltip` (localizable) shows a short text next to the button while the pointer rests on it or it has keyboard focus, e.g. `{ "icon": "delete", "ariaLabel": "Delete", "tooltip": "Deletes the order for everyone" }`. It is the button\'s description, not its name: an icon-only button still needs `ariaLabel`. It never shows on touch, and a disabled button shows none (it takes no pointer or focus). Supports state suffixes.',
  ],
  menuButton: [
    'A button that opens a menu of actions. Picking an item dispatches ONE event, `on.click`, with the item\'s `value` in `detail.value`: the host\'s `formEvent` handler receives `{ name: "rowAction", detail: { value: "edit" } }` and switches on the value. There is no event name per item.',
    '`props.items` is an array of actions `{ label, value, disabled? }` and separators `{ separator: true }`. `label` is localizable. A menu is not an input: it has no `path` and stores nothing in the form data.',
    '`props.placement` sets where the menu opens next to its button (default `"bottom-start"`; `"bottom-end"` suits a menu at the end of a row). `props.variant`, `props.icon` and `props.iconPosition` style the button like a `button` widget.',
    '`label` is optional. An icon-only button (e.g. `props.icon: "more_vert"` for a "⋮" row menu) MUST set `props.ariaLabel`, the button\'s accessible name; the menu is named after the button too. `ariaLabel` is ignored while a `label` is shown.',
    '`props.tooltip` (localizable) shows a short text next to the button while the pointer rests on it or it has keyboard focus, as on a `button`. It describes the button and does not name it: keep `ariaLabel` on an icon-only button.',
    'In a repeater, every row gets its own menu, and the event carries the row it was picked in, as every action does.',
    'Keyboard and screen reader support come from `gui-menu-button`: the button gets `aria-haspopup="menu"`, the arrows move through the items, typing jumps to an item, Escape closes it and returns focus to the button.',
    'For navigation (the destinations of an app, groups that open, the current page marked) use `menu` instead: `menuButton` is a button with a list of actions.',
  ],
  breadcrumb: [
    "A trail from the top level down to the current page. Picking a step dispatches ONE event, `on.click`, with the step's `value` in `detail.value`; the host navigates. There is no `href`: the widget emits, the host moves.",
    '`props.items` is an array of `{ label, value }`, top level first. The LAST item is the current page: it shows as plain text with `aria-current="page"`, and can\'t be picked. `label` is localizable.',
    '`label` (optional) names the trail\'s navigation landmark; without one it is "Breadcrumb". The labels inside `items` are not interpolated: build the items for the page the host shows, or switch them with a state suffix (`"items.<state>"`).',
    'A long trail wraps onto more lines. The separators are drawn in CSS and point the other way right to left.',
  ],
  menu: [
    "A navigation menu: destinations, and groups of them that open, to any depth. Picking a destination dispatches ONE event, `on.click`, with its `value` in `detail.value`; the host navigates. A group's button only opens and closes the group: it emits nothing. There is no `href`.",
    '`props.items` is an array of `{ label, value, icon?, disabled?, items? }`. An item with `items` is a group, and its `items` take the same shape (recursive). Every `value` must be unique in the whole menu: groups use it for their ids and their open state.',
    '`props.current` is the `value` of the current page\'s item. It is marked with `aria-current="page"`, and the groups that hold it start open. It is interpolated, so `"{{ $meta.view }}"` or `"{{ $form.section }}"` follows what the host shows; the user\'s own opening and closing stays until it changes.',
    '`props.orientation`: `"vertical"` (default) is a column whose groups open in place, indented. `"horizontal"` is a row: its first-level groups open dropdowns, deeper groups open in place inside them, and a row that does not fit scrolls.',
    'Set `label`, the name of the navigation landmark (e.g. "Main"): two unnamed navigations on a page sound the same to a screen reader.',
    'Keyboard: every item stays in the Tab order, Enter or Space opens a group, Escape closes the group around the focus. It follows the disclosure navigation pattern, not `role="menu"`.',
    'For a button that opens a list of actions (e.g. a "⋮" row menu with Edit and Delete), use `menuButton` instead.',
  ],
  checkbox: [
    'MANDATORY CHECKBOX (e.g. terms acceptance): `required: true` alone is a silent trap — it only rejects a MISSING value; an unchecked box holding `false` is a valid boolean and passes. `const: true` is what rejects `false` — but alone it lets the pristine `undefined` pass (non-required validators are optional). Use BOTH: `validator: { type: "boolean", required: true, const: true }`.',
    'Set BOTH `messages.invalid` and `messages.const` to the same user-facing text: a never-touched box fails the type check (`invalid` message), a checked-then-unchecked box fails the `const` rule. Call `get_concept({ concept: "validation" })` for the full explanation.',
  ],
  badge: [
    "A short label for a status or a count, inline with the content around it. `props.text` is required and localizable; `props.level` (`default`, `info`, `success`, `warning`, `error`, as an alert's) sets its color. The intent prop is `level`, never `variant`.",
    'Screen readers do not read the color, so the text must carry the meaning on its own: "3 new messages", not "3"; "Payment overdue", not a red "!".',
    'A status that changes with the data uses state suffixes: `"text.overdue": "Overdue"`, `"level.overdue": "error"`. `text` is a top-level string, so it can also interpolate (`"{{ $form.unread }} new messages"`).',
  ],
  progress: [
    "A progress bar for how far a task has got. `props.label` is required: it names the bar for screen readers. `props.value` goes from 0 to `props.max` (default 100); without a `value` the bar is indeterminate. `props.showValue: true` shows the percentage, formatted in the form's language.",
    '`value` is a NUMBER, so it cannot interpolate `{{ }}` (that always yields a string). Move it with state suffixes (`"value": 25, "value.step2": 50, "value.step3": 75`) or from the host. It is a display widget: it has no `path` and submits nothing.',
  ],
  typography: [
    'A heading or a line of PLAIN text. `props.text` is required and localizable, and interpolates `{{ }}` like any top-level string. A line break in the text is a line break on screen. For links, lists, emphasis or several paragraphs use `markdownText`.',
    '`props.variant` sets the look AND the tag: `h1` to `h6` render that heading, `body` (the default) and `small` (secondary text such as a note or a timestamp) a paragraph. There is no `lead`, `caption` or `title` variant.',
    "Headings are the page's outline for screen readers: don't skip levels (an `h2` before any `h3`), and when the form sits in a page that has its own `h1`, start the form's headings at `h2`.",
    'It has no outer margins: the gap of its layout spaces it. Put it in a `grid` with the fields it introduces.',
  ],
  image: [
    'An image that fills the width of its cell (set the width with the grid\'s `size`). `props.src` and `props.alt` are required. `alt` says what the image shows; set it to `""` only for a decorative image, which screen readers skip.',
    '`props.ratio` is one of `"1/1"`, `"4/3"`, `"3/2"`, `"16/9"`, `"21/9"` (no other values, no CSS); without it the image keeps its own proportions. `props.fit` (`cover` by default, `contain`, `fill`, `none`) says how it fills that box. `props.caption` (localizable) shows below it. `props.loading` is `lazy` by default; use `eager` for an image at the top of the page.',
    '`src` interpolates `{{ }}` like any top-level string, so a definition can put form data in an image URL that the browser then requests. The host controls where images may load from with its Content Security Policy (`img-src`). Prefer fixed URLs, and never interpolate personal data into `src`.',
    'A broken image shows its `alt` text, as the browser does; there is no fallback image.',
  ],
  table: [
    "A data table written in the definition. `props.caption` (localizable) is REQUIRED: it names the table for screen readers. `props.columns` is an array of `{ key, label, type?, align? }`; `props.rows` an array of objects keyed by the columns' `key`, each cell a string, a number, a boolean or null. Keys no column names are ignored, so a record can be passed as it is. `props.emptyMessage` is the one row shown when `rows` is empty.",
    'Column `type`: `text` (default) shows the value as it is; `number` formats it in the form\'s language (and aligns it at the end unless `align` says otherwise); `date` formats an ISO date such as `"2026-11-20"`. Pass numbers and ISO dates, not formatted strings: the widget formats them. A value that doesn\'t parse is shown as it is.',
    'The rows travel in the definition, so keep a table to a few dozen rows. Strings inside `rows` do NOT interpolate `{{ }}`, and rows cannot read `$form`: a table shows what the definition (or a state override such as `"rows.<stateName>"`) gives it. There is no sorting, paging, row selection or row actions.',
    'A table wider than its cell scrolls sideways inside its own region, never the page, and the region is keyboard-focusable while it does. Labels and the caption are localizable; cell text is not translated.',
  ],
  spinner: [
    'An indeterminate spinner for a wait of unknown length. Show it only while a named state holds: `include: { in: ["loading"] }` with a state such as `"loading": "$form.status === \'loading\'"`. Call `get_concept({ concept: "states" })` for the pattern.',
    '`props.label` says what the wait is for ("Loading results") and is announced by screen readers when it changes; without it the spinner is decorative. Use `progress` instead when how far the task has got is known.',
  ],
  alert: [
    'Use `include: { in: ["stateName"] }` to show this alert only when a named state is active, or `exclude: { from: ["stateName"] }` to hide it when a state is active. This is cleaner than `include: { when: "..." }` when the same condition is reused across multiple widgets. Call `get_concept({ concept: "states" })` for the full states pattern.',
    'Props inside `props` (e.g. `text`, `level`) accept state suffixes: `"text.<stateName>": "New message"` swaps the message when that state is active.',
  ],
};

function synthesizeExample(widgetType: string, schema: WidgetSchema): Record<string, unknown> {
  const props = schema['properties'] as Record<string, unknown> | undefined;
  const kindProp = (props?.['kind'] as { const?: string } | undefined)?.const ?? 'input';
  const ex: Record<string, unknown> = { kind: kindProp, type: widgetType };
  if (props?.['path']) ex['path'] = 'field';
  if (props?.['label']) ex['label'] = 'Field';
  return ex;
}

export function getWidgetSpec(input: GetWidgetSpecInput): GetWidgetSpecResult {
  const schema = COMPONENT_SCHEMAS[input.widgetType];
  if (!schema) {
    const known = Object.keys(COMPONENT_SCHEMAS).sort().join(', ');
    throw new Error(`Unknown widget type \`${input.widgetType}\`. Known: ${known}.`);
  }
  const props = schema['properties'] as Record<string, unknown> | undefined;
  const kindProp = (props?.['kind'] as { const?: string } | undefined)?.const ?? 'unknown';
  return {
    widgetType: input.widgetType,
    schema,
    kind: kindProp,
    example: EXAMPLES[input.widgetType] ?? synthesizeExample(input.widgetType, schema),
    notes: NOTES[input.widgetType] ?? [],
  };
}

export function listWidgetTypes(): string[] {
  return Object.keys(COMPONENT_SCHEMAS).sort();
}

export function getValidatorsSchema() {
  return VALIDATORS_SCHEMA;
}

export const JSON_GET_WIDGET_SPEC_TOOL = {
  name: 'json_get_widget_spec',
  description:
    'Look up the JSON Schema and a minimal working example for a single GolemUI widget on the ' +
    '**JSON form-definition** surface. Use this when you need to know which `props` a widget accepts, ' +
    'what `kind` value it uses, or what shape its `validator` takes. ' +
    'Cheaper than dumping the whole API into context.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      widgetType: {
        type: 'string' as const,
        description:
          'The widget `type` constant. One of: ' +
          Object.keys(COMPONENT_SCHEMAS)
            .sort()
            .map((t) => `\`${t}\``)
            .join(', ') +
          '.',
      },
    },
    required: ['widgetType'],
  },
} as const;
