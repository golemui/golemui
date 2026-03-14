// Simplified Golem Form DSL schema for LLM consumption.
// Gemini responseSchema does not support anyOf with many variants (too many constraint states).
// Strategy: a single superset widget object — all properties from all widget types, all optional
// except kind+type — so Gemini still gets full field-level constraints without union types.

// ─── Shared type helpers ────────────────────────────────────────────────────

const DOT_PATH = {
  type: 'string',
  description: 'Dot-separated path to form data, e.g. "user.address.city"',
};

const ON = {
  type: 'object',
  description: 'Event handlers. Values are action strings the user will handle.',
  properties: {
    load: { type: 'string', description: 'Run on widget load' },
    click: { type: 'string', description: 'Run on click (e.g. "submit")' },
    change: { type: 'string', description: 'Run on value change' },
    filter: { type: 'string', description: 'Run on search/filter input' },
  },
};

const CONDITION = {
  type: 'object',
  properties: {
    when: { type: 'string', description: 'JS expression' },
  },
  required: ['when'],
};

// ─── Superset props schema ───────────────────────────────────────────────────
// All props fields from all widget types. Field names are unique across widget types.

const PROPS = {
  type: 'object',
  properties: {
    // ── Common ─────────────────────────────────────────────────────────────
    hint: { type: 'string', description: 'Helper text shown below the field' },
    placeholder: { type: 'string' },
    icon: { type: 'string', description: 'Icon identifier' },

    // ── Text / textarea / markdown ──────────────────────────────────────────
    autoGrow: { type: 'boolean', description: 'Grow to fit content' },
    minimumHeight: { type: 'number', description: 'Minimum height in pixels' },
    maxLength: { type: 'number' },
    counterMode: { type: 'string', enum: ['remaining', 'current'] },

    // ── Password ────────────────────────────────────────────────────────────
    showPasswordIcon: { type: 'string' },
    hidePasswordIcon: { type: 'string' },
    showPasswordLabel: { type: 'string' },
    hidePasswordLabel: { type: 'string' },

    // ── Number ──────────────────────────────────────────────────────────────
    step: { type: 'number', description: 'Increment/decrement step' },
    minimum: { type: 'number' },
    maximum: { type: 'number' },

    // ── Currency ────────────────────────────────────────────────────────────
    currency: { type: 'string', description: 'ISO 4217 currency code, e.g. "USD"' },
    maximumFractionDigits: { type: 'number' },
    minimumFractionDigits: { type: 'number' },

    // ── Checkbox ────────────────────────────────────────────────────────────
    checkboxPosition: { type: 'string', enum: ['left', 'right'] },

    // ── Toggle ──────────────────────────────────────────────────────────────
    togglePosition: { type: 'string', enum: ['left', 'right'] },

    // ── Select / radiogroup ─────────────────────────────────────────────────
    options: {
      type: 'array',
      description: 'Static list of options for select/radiogroup',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          value: { type: 'string' },
        },
        required: ['label', 'value'],
      },
    },
    labelField: { type: 'string', description: 'Property used as display label for dynamic data' },
    valueField: { type: 'string', description: 'Property used as value for dynamic data' },

    // ── Dropdown / list ─────────────────────────────────────────────────────
    items: {
      type: 'array',
      description: 'Data items for dropdown/list — each has a template widget and a value',
      items: {
        type: 'object',
        properties: {
          template: { type: 'object' },
          value: { type: 'string' },
        },
        required: ['template', 'value'],
      },
    },
    searchFields: { type: 'array', items: { type: 'string' } },
    itemRenderer: { type: 'string' },
    inputDebounce: { type: 'number', description: 'Debounce ms for search input' },
    height: { type: 'number' },
    itemHeight: { type: 'number' },

    // ── Date pickers ────────────────────────────────────────────────────────
    minDate: { type: 'string', description: 'Minimum selectable date (ISO string)' },
    maxDate: { type: 'string', description: 'Maximum selectable date (ISO string)' },
    numberOfMonths: { type: 'number', description: 'Number of months to display side by side' },
    dayFormat: { type: 'string', enum: ['numeric', '2-digit'] },
    weekdayFormat: { type: 'string', enum: ['short', 'long', 'narrow'] },
    monthFormat: { type: 'string', enum: ['numeric', '2-digit', 'long', 'short', 'narrow'] },

    // ── Button ──────────────────────────────────────────────────────────────
    variant: { type: 'string', enum: ['filled', 'outlined'] },
    iconPosition: { type: 'string', enum: ['left', 'right'] },

    // ── Alert ───────────────────────────────────────────────────────────────
    text: { type: 'string', description: 'The alert message to display' },
    level: { type: 'string', enum: ['default', 'info', 'success', 'warning', 'error'] },

    // ── Flex ────────────────────────────────────────────────────────────────
    direction: { type: 'string', enum: ['row', 'column', 'row-reverse', 'column-reverse'] },
    align: { type: 'string', enum: ['center', 'start', 'end', 'space-between', 'space-around'] },
    gap: { type: 'number', description: 'Gap between flex children in rem units' },

    // ── Accordion ───────────────────────────────────────────────────────────
    sections: {
      type: 'array',
      description: 'Section definitions for accordion — one per child widget, matched positionally',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          uid: { type: 'string' },
        },
        required: ['label', 'uid'],
      },
    },
    singleOpen: { type: 'boolean', description: 'Allow only one accordion section open at a time' },

    // ── Tabs ────────────────────────────────────────────────────────────────
    tabs: {
      type: 'array',
      description: 'Tab definitions — one per child widget, matched positionally',
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

    // ── Repeater ────────────────────────────────────────────────────────────
    template: {
      type: 'object',
      description:
        'Repeater row template — a flex layout widget. Child paths use "items" as the array index token.',
    },
    addLabel: { type: 'string', description: 'Label for the "add row" button' },
    removeLabel: { type: 'string', description: 'Label for the "remove row" button' },
    limit: { type: 'number', description: 'Maximum number of repeater rows allowed' },

    // ── Markdown ────────────────────────────────────────────────────────────
    tools: {
      type: 'array',
      description:
        'Markdown toolbar buttons: H=heading, B=bold, I=italic, Q=quote, L=link, OL=ordered list, UL=unordered list, |=separator',
      items: { type: 'string', enum: ['H', 'B', 'I', 'Q', 'L', 'OL', 'UL', '|'] },
    },
  },
};

// ─── Superset widget schema ──────────────────────────────────────────────────
// Single object covering all widget types. kind+type are required; everything else is optional.

const WIDGET = {
  type: 'object',
  description:
    'A Golem widget. kind+type determine which fields apply. See system prompt for per-type rules.',
  properties: {
    kind: { type: 'string', enum: ['input', 'action', 'display', 'layout'] },
    type: {
      type: 'string',
      enum: [
        'textinput',
        'password',
        'textarea',
        'number',
        'currency',
        'checkbox',
        'toggle',
        'select',
        'radiogroup',
        'dropdown',
        'list',
        'datePicker',
        'calendar',
        'rangeCalendar',
        'dateInput',
        'markdown',
        'button',
        'alert',
        'flex',
        'accordion',
        'tabs',
        'repeater',
      ],
    },
    path: DOT_PATH,
    label: { type: 'string' },
    // disabled/readonly: true/false handled via system prompt; conditional form uses `disabledWhen`
    disabled: { type: 'boolean' },
    disabledWhen: CONDITION,
    readonly: { type: 'boolean' },
    readonlyWhen: CONDITION,
    on: ON,
    uid: { type: 'string', description: 'Optional unique identifier for this widget' },
    size: { type: 'number', description: 'Grid column span 1-12' },
    include: CONDITION,
    exclude: CONDITION,
    children: {
      type: 'array',
      description: 'Child widgets for layout types (flex, accordion, tabs).',
      items: { type: 'object' },
    },
    props: PROPS,
  },
  required: ['kind', 'type'],
};

// ─── Top-level schema ────────────────────────────────────────────────────────

export const GOLEM_LLM_SCHEMA: any = {
  type: 'object',
  description: 'A Golem form definition',
  properties: {
    form: {
      type: 'array',
      description: 'Ordered list of widgets that make up the form',
      items: WIDGET,
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
- \`disabled\` / \`readonly\` accept a boolean. For conditional disable/readonly use \`disabledWhen\` / \`readonlyWhen\` with \`{ "when": "expression" }\`.
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
