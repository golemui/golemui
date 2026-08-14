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
      allowDuplicates: false,
      limit: 10,
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
  alert: {
    kind: 'display',
    type: 'alert',
    props: { level: 'info', text: 'Heads up!' },
  },
  markdownText: {
    kind: 'display',
    type: 'markdownText',
    props: { md: 'Welcome to the form.' },
  },
  flex: {
    kind: 'layout',
    type: 'flex',
    props: { direction: 'column', gap: 12 },
    children: [
      {
        kind: 'input',
        type: 'textinput',
        path: 'firstName',
        label: 'First name',
      },
    ],
  },
  grid: {
    kind: 'layout',
    type: 'grid',
    props: { columnGap: 12, rowGap: 12 },
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
        type: 'flex',
        props: { direction: 'column' },
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

const NOTES: Record<string, string[]> = {
  textinput: [
    '`path` is the dot-path into form data this field writes to.',
    '`validator.format` supports: `email`, `hostname`, `ipv4`, `ipv6`, `url`, `uuid`, `date`, `time`, `date-time`, `duration`.',
    'Add custom `validator.messages` (per-rule map) on production forms — the library defaults are developer-facing. When `required: true`, ALWAYS also set `messages.invalid` with the same text as `messages.required`: an `undefined`/`null` value (pristine or cleared) fails the base type check and shows the `invalid` message, not the `required` one. Call `get_concept({ concept: "validation" })` for the full explanation.',
    'Root props `label`, `disabled`, `readonly`, `validator`, and `size` accept state suffixes — e.g. `"label.<stateName>": "New label"` overrides the label only when that named state is active. Props inside `props` (e.g. `hint`, `placeholder`) also accept suffixes as `"hint.<stateName>"`. Call `get_concept({ concept: "states" })` for the full pattern.',
    '`props.icon` accepts a Google Material Icons ligature name (e.g. `"search"`, `"email"`, `"lock"`) to display a decorative icon inside the input field. ' +
      'Supports state suffix: `"icon.<stateName>": "check"` to swap the icon when a state is active. ' +
      'Call `get_concept({ concept: "icons" })` for setup and the full list of icon-capable widgets.',
  ],
  markdownText: [
    'Display-only widget for rendering markdown. Can be used as a top-level form widget (inside any layout) or inside templates like `dropdown.props.items[].template`.',
    'The required prop is `md` (the markdown string), not `text`.',
  ],
  tags: [
    'Use `tags` for free-form arrays of primitive values (typically `string[]`) — e.g. keywords, email lists, hashtags. Backing data is `string[]`. For arrays of structured objects, use `repeater` instead.',
    '`props.separators` controls which keys/characters commit a new tag. Defaults emit on `Enter` and `,`; you can also include `"Tab"` or `"blur"`. `props.trim` strips whitespace from each tag; `props.allowDuplicates: false` rejects repeats; `props.limit` caps the array length.',
    'Validate with an `arrayValidator`: `{ type: "array", minItems, maxItems, uniqueItems }`. The `tags` widget complements that with UI-level enforcement (`allowDuplicates`, `limit`) but the validator is still authoritative for form-level required/min/max constraints.',
  ],
  dropdown: [
    'PREFER `select` for plain label/value lists (countries, plans, sizes). `dropdown` is for richer item shapes: when each item has extra fields (icons, flags, metadata) that an `itemRenderer` or `labelField`/`valueField` can use.',
    '`props.items` is EITHER primitives `["one", 2, ...]` OR arbitrary objects `[{ label, value, ...extras }]`. Pair the object form with `labelField`/`valueField` to tell the dropdown which fields to render as label and which to use as the value. **Widget templates inside items (the `{template, value}` shape) are NOT supported — only `repeater` accepts widget templates.**',
  ],
  select: [
    '`props.options[]` is the simple form: `[{ label: "United States", value: "us" }, ...]`. Use this for ANY plain text list — countries, plans, sizes, status enums. Only switch to `dropdown` if you need custom per-item rendering (icons, flags, rich layouts).',
    'For very large lists (>50 items) consider `dropdown` for its virtualization (`height`, `itemHeight`, `searchFields`).',
  ],
  flex: [
    'Use `flex` for page scaffolding and directional grouping: a column stack of sections, a row of side-by-side panels, a row of action buttons. ' +
      'For field-level layout (inputs that should sit in columns with aligned labels), prefer `grid` instead.',
    '`props.direction`: `"row"` (default) | `"column"` | `"row-reverse"` | `"column-reverse"` — controls the main axis. ' +
      '`"column"` stacks children vertically; `"row"` places them side by side.',
    '`props.gap`: number (pixels) — uniform spacing between all children along the main axis.',
    '`props.justify`: `"center"` | `"start"` | `"end"` | `"stretch"` — aligns children along the cross-axis (perpendicular to `direction`).',
    '`props.align`: `"center"` | `"start"` | `"end"` | `"space-between"` | `"space-around"` | `"space-evenly"` — distributes children along the main axis.',
    'All `flex` props support state suffixes: `"direction.<stateName>": "column"` swaps the direction when a state is active. Call `get_concept({ concept: "states" })` for the full pattern.',
  ],
  grid: [
    'Use `grid` when you want multiple form fields to sit side by side with their labels and inputs aligned across columns. ' +
      "GolemUI's `grid` uses CSS subgrid internally: each child widget gets two implicit sub-tracks (one for its label, one for its input) " +
      'that align to the parent grid columns, giving consistent label/input alignment across all rows without manual sizing.',
    'For loose page scaffolding — stacking sections, wrapping a group in a header — use `flex` instead.',
    '`props.columnGap`: number (pixels) — horizontal gap between columns.',
    '`props.rowGap`: number (pixels) — vertical gap between rows.',
    '`props.autoFit`: boolean — when `true`, the grid auto-fits as many columns as will fit in the available container width, using `columnGap` as the gutter. ' +
      'Useful for responsive layouts where the number of columns should adapt to the viewport.',
    '`props.direction`: `"row"` | `"column"` — controls how children flow into the grid tracks.',
    '`props.align` and `props.justify` accept the same values as `flex`.',
    'All `grid` props support state suffixes. Call `get_concept({ concept: "states" })` for the full pattern.',
  ],
  tabs: [
    'Children are associated with tabs by **`uid` matching**, not by array order: each direct child must have a `uid` field at the widget level (alongside `kind`/`type`) whose string value equals one of the `props.tabs[].uid` entries. There is no `tag` property — that is not a real GolemUI field.',
    'Children are typically written in display order for readability, but rearranging them does not change which tab they belong to — only the `uid` string match does.',
  ],
  accordion: [
    'Children are associated with sections by **`uid` matching** (same pattern as `tabs`): each direct child must have a `uid` field at the widget level whose value equals one of the `props.sections[].uid` entries. There is no `tag` property.',
    '`props.defaultOpen` is a map of `{ <sectionUid>: boolean }` controlling which sections start expanded.',
  ],
  repeater: [
    '`props.template` must be a layout widget (flex/grid/tabs/accordion) whose children are the per-item fields.',
    'Child paths inside the template MUST follow the form `<repeater.path>.items.<fieldName>`. The `items` segment is reserved — the runtime substitutes it with the current array index per row. For example, a repeater at `path: "users"` with a child `firstName` uses `path: "users.items.firstName"`. Plain `firstName` will NOT bind to the array.',
    'Nested repeaters chain the convention: a repeater at `path: "teams"` whose template contains a repeater at `path: "teams.items.members"` whose children use `path: "teams.items.members.items.<field>"`.',
    '`addLabel` supports state suffixes: `"addLabel.<stateName>": "Limit reached"` swaps the add-button label when a named state is active — useful for capping array length. Call `get_concept({ concept: "states" })` for the full pattern.',
  ],
  button: [
    '`actionType` controls the button\'s role. `actionType: "submit"` makes the button fire the form\'s `formSubmit` event natively — the host listens for it via `(formSubmit)` (Angular), `@formSubmit` (Vue), `onFormSubmit` (React), or the `form-submit` event (Lit). No custom handler needed. Use this for the primary submit button on a form.',
    '`actionType: "button"` (the default, can be omitted) is a regular action button. Wire it via `on.click: "<handlerName>"` where `<handlerName>` is registered in the form config\'s event handlers.',
    'Supports state-suffixed props: `"label.<stateName>"` and `"disabled.<stateName>"` swap the label or disabled state when a named state is active — e.g. disable the submit button until terms are accepted, then re-enable it. Call `get_concept({ concept: "states" })` for the full pattern.',
    '`props.icon` accepts a Google Material Icons ligature name (e.g. `"send"`, `"check"`, `"arrow_forward"`) to render an icon on the button. ' +
      '`props.iconPosition` controls placement: `"left"` (default) or `"right"`. ' +
      'Both support state suffixes: `"icon.<stateName>": "hourglass_empty"` swaps the icon while a state is active. ' +
      'Call `get_concept({ concept: "icons" })` for setup instructions and the full list of icon-capable widgets.',
  ],
  checkbox: [
    'MANDATORY CHECKBOX (e.g. terms acceptance): `required: true` alone is a silent trap — it only rejects a MISSING value; an unchecked box holding `false` is a valid boolean and passes. `const: true` is what rejects `false` — but alone it lets the pristine `undefined` pass (non-required validators are optional). Use BOTH: `validator: { type: "boolean", required: true, const: true }`.',
    'Set BOTH `messages.invalid` and `messages.const` to the same user-facing text: a never-touched box fails the type check (`invalid` message), a checked-then-unchecked box fails the `const` rule. Call `get_concept({ concept: "validation" })` for the full explanation.',
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
    'what `kind` value it uses, or what shape its `validator` takes. **If you are writing `gui.*` DX ' +
    'code (TypeScript), you do NOT need this** — use `dx_list_factories` + `dx_get_spec` instead; ' +
    'fetching both surfaces for the same widget is redundant. Cheaper than dumping the whole API into context.',
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
