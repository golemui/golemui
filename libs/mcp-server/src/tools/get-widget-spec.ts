import { COMPONENT_SCHEMAS, VALIDATORS_SCHEMA, type WidgetSchema } from '../schemas/index';

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
    validator: { type: 'boolean', required: true, const: true },
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
      items: [
        { value: 'us', template: { kind: 'display', type: 'markdownText', props: { md: 'United States' } } },
        { value: 'ca', template: { kind: 'display', type: 'markdownText', props: { md: 'Canada' } } },
      ],
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
    label: 'Submit',
    on: { click: 'submit' },
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
          { kind: 'input', type: 'textinput', path: 'street', label: 'Street' },
        ],
      },
    },
  },
};

const NOTES: Record<string, string[]> = {
  textinput: [
    '`path` is the dot-path into form data this field writes to.',
    '`validator.format` supports: `email`, `hostname`, `ipv4`, `ipv6`, `url`, `uuid`, `date`, `time`, `date-time`, `duration`.',
  ],
  markdownText: [
    'Display-only widget for rendering markdown. Can be used as a top-level form widget (inside any layout) or inside templates like `dropdown.props.items[].template`.',
    'The required prop is `md` (the markdown string), not `text`.',
  ],
  dropdown: [
    '`props.items[].template` is itself a widget (typically `markdownText`) that renders the option label.',
    'Use `select` instead if you only need plain text options.',
  ],
  select: [
    '`props.options[]` is the simple form: `{ label, value }`. Use `dropdown` for richer rendered options.',
  ],
  flex: ['`children` is an array of any widgets (inputs, displays, nested layouts).'],
  grid: ['`children` is an array of any widgets. `props.columns` controls layout.'],
  tabs: ['`props.tabs[].uid` must match the `tag` on each child widget that belongs to that tab.'],
  repeater: [
    '`props.template` must be a layout widget (flex/grid/etc.) whose children are the per-item fields.',
    'Paths inside the template are relative to each item.',
  ],
  button: ['`on.click` references an event handler name registered in form config.'],
  checkbox: ['Set `validator.const: true` to require the user to tick it (e.g. terms acceptance).'],
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

export const GET_WIDGET_SPEC_TOOL = {
  name: 'get_widget_spec',
  description:
    'Look up the JSON Schema and a minimal working example for a single GolemUI widget. ' +
    'Use this when you need to know which `props` a widget accepts, what `kind` value it uses, ' +
    'or what shape its `validator` takes. Cheaper than dumping the whole API into context.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      widgetType: {
        type: 'string' as const,
        description:
          'The widget `type` constant. One of: ' +
          Object.keys(COMPONENT_SCHEMAS).sort().map((t) => `\`${t}\``).join(', ') +
          '.',
      },
    },
    required: ['widgetType'],
  },
} as const;
