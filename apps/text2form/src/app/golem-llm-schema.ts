// Simplified Golem Form DSL schema for LLM consumption.
// All $refs are inlined, patternProperties removed, localizable simplified to string.
// Used as Gemini responseSchema + system prompt in gemini.service.ts.

// ─── Shared type helpers ────────────────────────────────────────────────────

const BOOL_OR_WHEN = {
  anyOf: [
    { type: 'boolean' },
    {
      type: 'object',
      properties: {
        when: {
          type: 'string',
          description: 'JS reactive expression, e.g. "$form.isAdmin === true"',
        },
      },
      required: ['when'],
    },
  ],
};

const DOT_PATH = {
  type: 'string',
  description: 'Dot-separated path to form data, e.g. "user.address.city"',
};

const ON = {
  type: 'object',
  description: 'Event handlers. Values are action strings the user will handle',
  properties: {
    load: { type: 'string', description: 'Run on widget load' },
    click: { type: 'string', description: 'Run on click (e.g. "submit")' },
    change: { type: 'string', description: 'Run on value change' },
    filter: { type: 'string', description: 'Run on search/filter input' },
  },
};

const INCLUDE = {
  type: 'object',
  description: 'Show this widget only when the condition is met',
  properties: { when: { type: 'string', description: 'JS expression. Widget shown when truthy.' } },
  required: ['when'],
};

const EXCLUDE = {
  type: 'object',
  description: 'Hide this widget when the condition is met',
  properties: {
    when: { type: 'string', description: 'JS expression. Widget hidden when truthy.' },
  },
  required: ['when'],
};

const BASE = {
  uid: { type: 'string', description: 'Optional unique identifier for this widget' },
  size: { type: 'number', description: 'Grid column span 1-12' },
  include: INCLUDE,
  exclude: EXCLUDE,
};

// Generic children array used by layout widgets. Items are full widget objects.
// The system prompt provides concrete examples.
const CHILDREN = {
  type: 'array',
  description:
    'Child widgets. Each item is a complete widget definition (same schema as top-level form items).',
  items: { type: 'object' },
};

// ─── Input widget schemas ────────────────────────────────────────────────────

const TEXTINPUT = {
  type: 'object',
  description: 'Single-line text input',
  properties: {
    kind: { type: 'string', enum: ['input'] },
    type: { type: 'string', enum: ['textinput'] },
    path: DOT_PATH,
    label: { type: 'string' },
    disabled: BOOL_OR_WHEN,
    readonly: BOOL_OR_WHEN,
    on: ON,
    ...BASE,
    props: {
      type: 'object',
      properties: {
        hint: { type: 'string', description: 'Helper text shown below the field' },
        placeholder: { type: 'string' },
        icon: { type: 'string', description: 'Icon identifier' },
      },
    },
  },
  required: ['kind', 'type', 'path'],
};

const PASSWORD = {
  type: 'object',
  description: 'Password input with show/hide toggle',
  properties: {
    kind: { type: 'string', enum: ['input'] },
    type: { type: 'string', enum: ['password'] },
    path: DOT_PATH,
    label: { type: 'string' },
    disabled: BOOL_OR_WHEN,
    readonly: BOOL_OR_WHEN,
    on: ON,
    ...BASE,
    props: {
      type: 'object',
      properties: {
        hint: { type: 'string' },
        placeholder: { type: 'string' },
        icon: { type: 'string' },
        showPasswordIcon: { type: 'string' },
        hidePasswordIcon: { type: 'string' },
        showPasswordLabel: { type: 'string' },
        hidePasswordLabel: { type: 'string' },
      },
    },
  },
  required: ['kind', 'type', 'path'],
};

const TEXTAREA = {
  type: 'object',
  description: 'Multi-line text input',
  properties: {
    kind: { type: 'string', enum: ['input'] },
    type: { type: 'string', enum: ['textarea'] },
    path: DOT_PATH,
    label: { type: 'string' },
    disabled: BOOL_OR_WHEN,
    readonly: BOOL_OR_WHEN,
    on: ON,
    ...BASE,
    props: {
      type: 'object',
      properties: {
        hint: { type: 'string' },
        placeholder: { type: 'string' },
        icon: { type: 'string' },
        counterMode: {
          type: 'string',
          enum: ['remaining', 'current'],
          description: 'Show character counter',
        },
        minimumHeight: { type: 'number', description: 'Minimum height in pixels' },
        autoGrow: { type: 'boolean', description: 'Grow to fit content' },
        maxLength: { type: 'number' },
      },
    },
  },
  required: ['kind', 'type', 'path'],
};

const NUMBER = {
  type: 'object',
  description: 'Numeric input field',
  properties: {
    kind: { type: 'string', enum: ['input'] },
    type: { type: 'string', enum: ['number'] },
    path: DOT_PATH,
    label: { type: 'string' },
    disabled: BOOL_OR_WHEN,
    readonly: BOOL_OR_WHEN,
    on: ON,
    ...BASE,
    props: {
      type: 'object',
      properties: {
        hint: { type: 'string' },
        placeholder: { type: 'string' },
        step: { type: 'number', description: 'Increment/decrement step' },
        minimum: { type: 'number' },
        maximum: { type: 'number' },
        autoGrow: { type: 'boolean' },
      },
    },
  },
  required: ['kind', 'type', 'path'],
};

const CURRENCY = {
  type: 'object',
  description: 'Currency / monetary amount input',
  properties: {
    kind: { type: 'string', enum: ['input'] },
    type: { type: 'string', enum: ['currency'] },
    path: DOT_PATH,
    label: { type: 'string' },
    disabled: BOOL_OR_WHEN,
    readonly: BOOL_OR_WHEN,
    on: ON,
    ...BASE,
    props: {
      type: 'object',
      properties: {
        hint: { type: 'string' },
        placeholder: { type: 'string' },
        icon: { type: 'string' },
        currency: { type: 'string', description: 'ISO 4217 currency code, e.g. "USD"' },
        step: { type: 'number' },
        maximumFractionDigits: { type: 'number' },
        minimumFractionDigits: { type: 'number' },
      },
    },
  },
  required: ['kind', 'type', 'path'],
};

const CHECKBOX = {
  type: 'object',
  description: 'Boolean checkbox',
  properties: {
    kind: { type: 'string', enum: ['input'] },
    type: { type: 'string', enum: ['checkbox'] },
    path: DOT_PATH,
    label: { type: 'string' },
    disabled: BOOL_OR_WHEN,
    readonly: BOOL_OR_WHEN,
    on: ON,
    ...BASE,
    props: {
      type: 'object',
      properties: {
        checkboxPosition: {
          type: 'string',
          enum: ['left', 'right'],
          description: 'Position of the checkbox relative to the label',
        },
        hint: { type: 'string' },
      },
    },
  },
  required: ['kind', 'type', 'path'],
};

const TOGGLE = {
  type: 'object',
  description: 'Toggle switch (boolean)',
  properties: {
    kind: { type: 'string', enum: ['input'] },
    type: { type: 'string', enum: ['toggle'] },
    path: DOT_PATH,
    label: { type: 'string' },
    disabled: BOOL_OR_WHEN,
    readonly: BOOL_OR_WHEN,
    on: ON,
    ...BASE,
    props: {
      type: 'object',
      properties: {
        togglePosition: { type: 'string', enum: ['left', 'right'] },
        hint: { type: 'string' },
      },
    },
  },
  required: ['kind', 'type', 'path'],
};

const SELECT = {
  type: 'object',
  description: 'Dropdown select from a static list of options',
  properties: {
    kind: { type: 'string', enum: ['input'] },
    type: { type: 'string', enum: ['select'] },
    path: DOT_PATH,
    label: { type: 'string' },
    disabled: BOOL_OR_WHEN,
    readonly: BOOL_OR_WHEN,
    on: ON,
    ...BASE,
    props: {
      type: 'object',
      properties: {
        hint: { type: 'string' },
        placeholder: { type: 'string' },
        icon: { type: 'string' },
        options: {
          type: 'array',
          description: 'Static list of options',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              value: { type: 'string' },
            },
            required: ['label', 'value'],
          },
        },
        labelField: {
          type: 'string',
          description: 'Property name used as display label when options come from data',
        },
        valueField: {
          type: 'string',
          description: 'Property name used as value when options come from data',
        },
      },
    },
  },
  required: ['kind', 'type', 'path'],
};

const RADIOGROUP = {
  type: 'object',
  description: 'Radio button group — select one option from a list',
  properties: {
    kind: { type: 'string', enum: ['input'] },
    type: { type: 'string', enum: ['radiogroup'] },
    path: DOT_PATH,
    label: { type: 'string' },
    disabled: BOOL_OR_WHEN,
    readonly: BOOL_OR_WHEN,
    on: ON,
    ...BASE,
    props: {
      type: 'object',
      properties: {
        hint: { type: 'string' },
        options: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              value: { type: 'string' },
            },
            required: ['label', 'value'],
          },
        },
        labelField: { type: 'string' },
        valueField: { type: 'string' },
      },
    },
  },
  required: ['kind', 'type', 'path'],
};

const DROPDOWN = {
  type: 'object',
  description:
    'Virtualized dropdown for large/dynamic data sets (use "select" for small static lists)',
  properties: {
    kind: { type: 'string', enum: ['input'] },
    type: { type: 'string', enum: ['dropdown'] },
    path: DOT_PATH,
    label: { type: 'string' },
    disabled: BOOL_OR_WHEN,
    readonly: BOOL_OR_WHEN,
    on: ON,
    ...BASE,
    props: {
      type: 'object',
      description: 'props.items is required',
      properties: {
        hint: { type: 'string' },
        placeholder: { type: 'string' },
        items: {
          type: 'array',
          description: 'Data items — each has a template (display widget) and a value',
          items: {
            type: 'object',
            properties: {
              template: { type: 'object' },
              value: { type: 'string' },
            },
            required: ['template', 'value'],
          },
        },
        labelField: { type: 'string' },
        valueField: { type: 'string' },
        searchFields: { type: 'array', items: { type: 'string' } },
        itemRenderer: { type: 'string' },
        inputDebounce: { type: 'number', description: 'Debounce ms for search input' },
        height: { type: 'number' },
        itemHeight: { type: 'number' },
      },
      required: ['items'],
    },
  },
  required: ['kind', 'type', 'path', 'props'],
};

const LIST = {
  type: 'object',
  description: 'Virtualized scrollable list for large/dynamic data sets',
  properties: {
    kind: { type: 'string', enum: ['input'] },
    type: { type: 'string', enum: ['list'] },
    path: DOT_PATH,
    label: { type: 'string' },
    disabled: BOOL_OR_WHEN,
    readonly: BOOL_OR_WHEN,
    on: ON,
    ...BASE,
    props: {
      type: 'object',
      properties: {
        hint: { type: 'string' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              template: { type: 'object' },
              value: { type: 'string' },
            },
            required: ['template', 'value'],
          },
        },
        labelField: { type: 'string' },
        valueField: { type: 'string' },
        itemRenderer: { type: 'string' },
        height: { type: 'number' },
        itemHeight: { type: 'number' },
      },
    },
  },
  required: ['kind', 'type', 'path'],
};

const DATEPICKER = {
  type: 'object',
  description: 'Date picker with calendar popup',
  properties: {
    kind: { type: 'string', enum: ['input'] },
    type: { type: 'string', enum: ['datePicker'] },
    path: DOT_PATH,
    label: { type: 'string' },
    disabled: BOOL_OR_WHEN,
    readonly: BOOL_OR_WHEN,
    on: ON,
    ...BASE,
    props: {
      type: 'object',
      properties: {
        hint: { type: 'string' },
        placeholder: { type: 'string' },
        icon: { type: 'string' },
        dayFormat: { type: 'string', enum: ['numeric', '2-digit'] },
        weekdayFormat: { type: 'string', enum: ['short', 'long', 'narrow'] },
        monthFormat: { type: 'string', enum: ['numeric', '2-digit', 'long', 'short', 'narrow'] },
      },
    },
  },
  required: ['kind', 'type', 'path'],
};

const CALENDAR = {
  type: 'object',
  description: 'Inline calendar widget for selecting a date',
  properties: {
    kind: { type: 'string', enum: ['input'] },
    type: { type: 'string', enum: ['calendar'] },
    path: DOT_PATH,
    label: { type: 'string' },
    disabled: BOOL_OR_WHEN,
    readonly: BOOL_OR_WHEN,
    on: ON,
    ...BASE,
    props: {
      type: 'object',
      properties: {
        hint: { type: 'string' },
        minDate: { type: 'string', description: 'Minimum selectable date (ISO string)' },
        maxDate: { type: 'string', description: 'Maximum selectable date (ISO string)' },
        numberOfMonths: { type: 'number', description: 'Number of months to display side by side' },
        dayFormat: { type: 'string', enum: ['numeric', '2-digit'] },
        weekdayFormat: { type: 'string', enum: ['short', 'long', 'narrow'] },
        monthFormat: { type: 'string', enum: ['numeric', '2-digit', 'long', 'short', 'narrow'] },
      },
    },
  },
  required: ['kind', 'type', 'path'],
};

const RANGECALENDAR = {
  type: 'object',
  description: 'Inline calendar for selecting a date range (start and end date)',
  properties: {
    kind: { type: 'string', enum: ['input'] },
    type: { type: 'string', enum: ['rangeCalendar'] },
    path: DOT_PATH,
    label: { type: 'string' },
    disabled: BOOL_OR_WHEN,
    readonly: BOOL_OR_WHEN,
    on: ON,
    ...BASE,
    props: {
      type: 'object',
      properties: {
        hint: { type: 'string' },
        minDate: { type: 'string' },
        maxDate: { type: 'string' },
        numberOfMonths: { type: 'number' },
        dayFormat: { type: 'string', enum: ['numeric', '2-digit'] },
        weekdayFormat: { type: 'string', enum: ['short', 'long', 'narrow'] },
        monthFormat: { type: 'string', enum: ['numeric', '2-digit', 'long', 'short', 'narrow'] },
      },
    },
  },
  required: ['kind', 'type', 'path'],
};

const DATEINPUT = {
  type: 'object',
  description: 'Manual date entry field (typed input, no calendar popup)',
  properties: {
    kind: { type: 'string', enum: ['input'] },
    type: { type: 'string', enum: ['dateInput'] },
    path: DOT_PATH,
    label: { type: 'string' },
    disabled: BOOL_OR_WHEN,
    readonly: BOOL_OR_WHEN,
    on: ON,
    ...BASE,
    props: {
      type: 'object',
      properties: {
        hint: { type: 'string' },
        icon: { type: 'string' },
      },
    },
  },
  required: ['kind', 'type', 'path'],
};

const MARKDOWN = {
  type: 'object',
  description: 'Markdown editor with preview tab',
  properties: {
    kind: { type: 'string', enum: ['input'] },
    type: { type: 'string', enum: ['markdown'] },
    path: DOT_PATH,
    label: { type: 'string' },
    disabled: BOOL_OR_WHEN,
    readonly: BOOL_OR_WHEN,
    on: ON,
    ...BASE,
    props: {
      type: 'object',
      properties: {
        hint: { type: 'string' },
        placeholder: { type: 'string' },
        autoGrow: { type: 'boolean' },
        minimumHeight: { type: 'number' },
        maxLength: { type: 'number' },
        counterMode: { type: 'string', enum: ['remaining', 'current'] },
        tools: {
          type: 'array',
          description:
            'Toolbar buttons to show. H=heading, B=bold, I=italic, Q=quote, L=link, OL=ordered list, UL=unordered list, |=separator',
          items: { type: 'string', enum: ['H', 'B', 'I', 'Q', 'L', 'OL', 'UL', '|'] },
        },
      },
    },
  },
  required: ['kind', 'type', 'path'],
};

// ─── Action widget schemas ───────────────────────────────────────────────────

const BUTTON = {
  type: 'object',
  description: 'Action button',
  properties: {
    kind: { type: 'string', enum: ['action'] },
    type: { type: 'string', enum: ['button'] },
    label: { type: 'string' },
    disabled: BOOL_OR_WHEN,
    on: ON,
    ...BASE,
    props: {
      type: 'object',
      properties: {
        variant: { type: 'string', enum: ['filled', 'outlined'] },
        icon: { type: 'string' },
        iconPosition: { type: 'string', enum: ['left', 'right'] },
      },
    },
  },
  required: ['kind', 'type'],
};

// ─── Display widget schemas ──────────────────────────────────────────────────

const ALERT = {
  type: 'object',
  description: 'Alert / notification banner',
  properties: {
    kind: { type: 'string', enum: ['display'] },
    type: { type: 'string', enum: ['alert'] },
    ...BASE,
    props: {
      type: 'object',
      description: 'props.text is required',
      properties: {
        text: { type: 'string', description: 'The alert message to display' },
        level: { type: 'string', enum: ['default', 'info', 'success', 'warning', 'error'] },
      },
      required: ['text'],
    },
  },
  required: ['kind', 'type', 'props'],
};

// ─── Layout widget schemas ───────────────────────────────────────────────────

const FLEX = {
  type: 'object',
  description: 'Flexbox layout container. Use to arrange widgets side by side or in a column.',
  properties: {
    kind: { type: 'string', enum: ['layout'] },
    type: { type: 'string', enum: ['flex'] },
    children: CHILDREN,
    ...BASE,
    props: {
      type: 'object',
      properties: {
        direction: { type: 'string', enum: ['row', 'column', 'row-reverse', 'column-reverse'] },
        align: {
          type: 'string',
          enum: ['center', 'start', 'end', 'space-between', 'space-around'],
        },
        gap: { type: 'number', description: 'Gap between children in rem units' },
      },
    },
  },
  required: ['kind', 'type', 'children'],
};

const ACCORDION = {
  type: 'object',
  description:
    'Accordion with collapsible sections. children are positionally matched to sections by index.',
  properties: {
    kind: { type: 'string', enum: ['layout'] },
    type: { type: 'string', enum: ['accordion'] },
    children: CHILDREN,
    on: ON,
    ...BASE,
    props: {
      type: 'object',
      description:
        'props.sections is required. Each section corresponds to one child widget by index.',
      properties: {
        sections: {
          type: 'array',
          description: 'Section definitions — one per child widget',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string', description: 'Section header label' },
              uid: { type: 'string', description: 'Unique section identifier' },
            },
            required: ['label', 'uid'],
          },
        },
        singleOpen: { type: 'boolean', description: 'Allow only one section open at a time' },
      },
      required: ['sections'],
    },
  },
  required: ['kind', 'type', 'children', 'props'],
};

const TABS = {
  type: 'object',
  description: 'Tab container. children are positionally matched to tabs by index.',
  properties: {
    kind: { type: 'string', enum: ['layout'] },
    type: { type: 'string', enum: ['tabs'] },
    children: CHILDREN,
    on: ON,
    ...BASE,
    props: {
      type: 'object',
      description: 'props.tabs is required. Each tab corresponds to one child widget by index.',
      properties: {
        tabs: {
          type: 'array',
          description: 'Tab definitions — one per child widget',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              uid: { type: 'string' },
            },
            required: ['label', 'uid'],
          },
        },
        defaultOpen: { type: 'string', description: 'uid of the tab to open by default' },
      },
      required: ['tabs'],
    },
  },
  required: ['kind', 'type', 'children', 'props'],
};

const REPEATER = {
  type: 'object',
  description:
    'Dynamic repeater for arrays — lets the user add/remove rows. Each row is defined by props.template (a flex widget).',
  properties: {
    kind: { type: 'string', enum: ['input'] },
    type: { type: 'string', enum: ['repeater'] },
    path: DOT_PATH,
    label: { type: 'string' },
    on: ON,
    ...BASE,
    props: {
      type: 'object',
      description: 'props.template is required — it defines one row as a flex layout.',
      properties: {
        template: {
          type: 'object',
          description:
            'A flex widget defining one repeatable row. Child widgets use absolute paths (with parent prefix) and items as the index token. (e.g. "addresses.items.street" becomes "addresses.3.street")',
          properties: {
            kind: { type: 'string', enum: ['layout'] },
            type: { type: 'string', enum: ['flex'] },
            children: CHILDREN,
            props: {
              type: 'object',
              properties: {
                direction: {
                  type: 'string',
                  enum: ['row', 'column', 'row-reverse', 'column-reverse'],
                },
                align: {
                  type: 'string',
                  enum: ['center', 'start', 'end', 'space-between', 'space-around'],
                },
                gap: { type: 'number' },
              },
            },
          },
          required: ['kind', 'type', 'children'],
        },
        addLabel: { type: 'string', description: 'Label for the "add row" button' },
        removeLabel: { type: 'string', description: 'Label for the "remove row" button' },
        limit: { type: 'number', description: 'Maximum number of rows allowed' },
      },
      required: ['template'],
    },
  },
  required: ['kind', 'type', 'path', 'props'],
};

// ─── Top-level schema ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GOLEM_LLM_SCHEMA: any = {
  type: 'object',
  description: 'A Golem form definition',
  properties: {
    states: {
      type: 'object',
      description:
        'Named reactive state variables. Keys are state names, values are JS expressions evaluated against $form data. Reference them in widget expressions using $states.name.',
    },
    form: {
      type: 'array',
      description: 'Ordered list of widgets that make up the form',
      items: {
        anyOf: [
          TEXTINPUT,
          PASSWORD,
          TEXTAREA,
          NUMBER,
          CURRENCY,
          CHECKBOX,
          TOGGLE,
          SELECT,
          RADIOGROUP,
          DROPDOWN,
          LIST,
          DATEPICKER,
          CALENDAR,
          RANGECALENDAR,
          DATEINPUT,
          MARKDOWN,
          BUTTON,
          ALERT,
          FLEX,
          ACCORDION,
          TABS,
          REPEATER,
        ],
      },
    },
  },
  required: ['form'],
};

// ─── System prompt ───────────────────────────────────────────────────────────

export const GOLEM_SYSTEM_PROMPT = `
You are a Golem form builder. Your job is to generate valid Golem Form DSL JSON in response to user requests.

## Overview

A Golem form is a JSON object with:
- \`form\` (required): an array of widget objects
- \`states\` (optional): named reactive expressions computed from \`$form\` data

Each widget has \`kind\` and \`type\` (required). Most input widgets also require \`path\` (a dot-separated path to the form data field they bind to).

## Examples

### Simple login form
\`\`\`json
{
  "form": [
    { "kind": "input", "type": "textinput", "path": "email", "label": "Email", "props": { "placeholder": "you@example.com" } },
    { "kind": "input", "type": "password", "path": "password", "label": "Password" },
    { "kind": "action", "type": "button", "label": "Sign In", "on": { "click": "submit" } }
  ]
}
\`\`\`

### Conditional fields
\`\`\`json
{
  "form": [
    {
      "kind": "input", "type": "select", "path": "role", "label": "Role",
      "props": { "options": [{ "label": "User", "value": "user" }, { "label": "Admin", "value": "admin" }] }
    },
    {
      "kind": "input", "type": "textinput", "path": "adminCode", "label": "Admin Code",
      "include": { "when": "$form.role === 'admin'" }
    },
    { "kind": "action", "type": "button", "label": "Submit", "on": { "click": "submit" } }
  ]
}
\`\`\`

### Accordion with multiple sections
\`\`\`json
{
  "form": [
    {
      "kind": "layout", "type": "accordion",
      "props": {
        "sections": [
          { "label": "Personal Info", "uid": "personal" },
          { "label": "Contact Details", "uid": "contact" }
        ]
      },
      "children": [
        { "kind": "input", "type": "textinput", "path": "name", "label": "Full Name" },
        { "kind": "input", "type": "textinput", "path": "email", "label": "Email" }
      ]
    },
    { "kind": "action", "type": "button", "label": "Save", "on": { "click": "submit" } }
  ]
}
\`\`\`

### Repeater (dynamic list of rows)
\`\`\`json
{
  "form": [
    {
      "kind": "input", "type": "repeater", "path": "addresses", "label": "Addresses",
      "props": {
        "addLabel": "Add Address",
        "removeLabel": "Remove",
        "limit": 5,
        "template": {
          "kind": "layout", "type": "flex",
          "props": { "direction": "row", "gap": 2 },
          "children": [
            { "kind": "input", "type": "textinput", "path": "addresses.items.street", "label": "Street" },
            { "kind": "input", "type": "textinput", "path": "addresses.items.city", "label": "City" }
          ]
        }
      }
    }
  ]
}
\`\`\`

## Key rules

- Always include both \`kind\` and \`type\`. All input widgets require \`path\`.
- \`path\` uses dot notation to bind to form data: \`"user.address.city"\`.
- \`disabled\` and \`readonly\` accept \`true\`/\`false\` or \`{ "when": "expression" }\`.
- \`include\` / \`exclude\` accept \`{ "when": "expression" }\` to conditionally show/hide widgets.
- Use \`$form.fieldPath\` in expressions to read other field values.
- \`size\` is a grid column span from 1 to 12. Omit it to use full width.
- Layout widgets (\`flex\`, \`accordion\`, \`tabs\`) use \`children\`.
- For \`accordion\` and \`tabs\`, each entry in \`props.sections\`/\`props.tabs\` corresponds positionally to one child widget.
- \`repeater\` requires \`props.template\` — a \`flex\` layout that defines one row. Use absolute paths with items as the token for the array index inside repeater rows (e.g. \`"addresses.items.street"\` becomes \`"addresses.3.street"\`).
- Use \`select\` or \`radiogroup\` for small static option lists. Use \`dropdown\`/\`list\` for large or dynamic datasets.
- \`alert\` is \`kind: "display"\` and requires \`props.text\`.
- \`button\` is \`kind: "action"\` and uses \`on.click\` for the action (e.g. \`"submit"\`).
`;
