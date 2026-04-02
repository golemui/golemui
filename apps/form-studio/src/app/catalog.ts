import * as z from 'zod';

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

const optionSchema = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number()]),
});

const extendedOptionSchema = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

const sectionSchema = z.object({
  label: z.string(),
  uid: z.string(),
});

const tabDefSchema = z.object({
  label: z.string(),
  uid: z.string(),
});

const validatorSchema = z.object({
  type: z.enum(['string', 'number', 'integer', 'boolean', 'array']),
  required: z.boolean().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  pattern: z.string().optional(),
  format: z.string().optional(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  minItems: z.number().optional(),
  maxItems: z.number().optional(),
});

// ---------------------------------------------------------------------------
// Shared base field groups (spread into each widget schema)
// ---------------------------------------------------------------------------

const baseFields = {
  uid: z.string(),
  size: z.number().optional(),
};

const inputFields = {
  ...baseFields,
  kind: z.literal('input'),
  path: z.string(),
  label: z.string().optional(),
  disabled: z.boolean().optional(),
  readonly: z.boolean().optional(),
  validator: validatorSchema.optional(),
};

const actionFields = {
  ...baseFields,
  kind: z.literal('action'),
  label: z.string().optional(),
  disabled: z.boolean().optional(),
};

const displayFields = {
  ...baseFields,
  kind: z.literal('display'),
};

const layoutFields = {
  ...baseFields,
  kind: z.literal('layout'),
};

// ---------------------------------------------------------------------------
// Input widgets
// ---------------------------------------------------------------------------

export const textinputSchema = z.object({
  ...inputFields,
  type: z.literal('textinput'),
  defaultValue: z.string().optional(),
  props: z
    .object({
      placeholder: z.string().optional(),
      hint: z.string().optional(),
      icon: z.string().optional(),
    })
    .optional(),
});

export const passwordSchema = z.object({
  ...inputFields,
  type: z.literal('password'),
  defaultValue: z.string().optional(),
  props: z
    .object({
      placeholder: z.string().optional(),
      hint: z.string().optional(),
      icon: z.string().optional(),
      showPasswordIcon: z.string().optional(),
      hidePasswordIcon: z.string().optional(),
      showPasswordLabel: z.string().optional(),
      hidePasswordLabel: z.string().optional(),
    })
    .optional(),
});

export const numberSchema = z.object({
  ...inputFields,
  type: z.literal('number'),
  defaultValue: z.number().optional(),
  props: z
    .object({
      placeholder: z.string().optional(),
      hint: z.string().optional(),
      step: z.number().optional(),
      minimum: z.number().optional(),
      maximum: z.number().optional(),
      autoGrow: z.boolean().optional(),
    })
    .optional(),
});

export const currencySchema = z.object({
  ...inputFields,
  type: z.literal('currency'),
  defaultValue: z.number().optional(),
  props: z
    .object({
      placeholder: z.string().optional(),
      hint: z.string().optional(),
      currency: z.string().optional(),
      step: z.number().optional(),
      maximumFractionDigits: z.number().optional(),
      minimumFractionDigits: z.number().optional(),
      icon: z.string().optional(),
    })
    .optional(),
});

export const textareaSchema = z.object({
  ...inputFields,
  type: z.literal('textarea'),
  defaultValue: z.string().optional(),
  props: z
    .object({
      placeholder: z.string().optional(),
      hint: z.string().optional(),
      icon: z.string().optional(),
      counterMode: z.enum(['remaining', 'current']).optional(),
      minimumHeight: z.number().optional(),
      maxLength: z.number().optional(),
      autoGrow: z.boolean().optional(),
    })
    .optional(),
});

export const checkboxSchema = z.object({
  ...inputFields,
  type: z.literal('checkbox'),
  defaultValue: z.boolean().optional(),
  props: z
    .object({
      hint: z.string().optional(),
      checkboxPosition: z.enum(['left', 'right']).optional(),
    })
    .optional(),
});

export const toggleSchema = z.object({
  ...inputFields,
  type: z.literal('toggle'),
  defaultValue: z.boolean().optional(),
  props: z
    .object({
      hint: z.string().optional(),
      togglePosition: z.enum(['left', 'right']).optional(),
    })
    .optional(),
});

export const selectSchema = z.object({
  ...inputFields,
  type: z.literal('select'),
  props: z
    .object({
      options: z.array(optionSchema).optional(),
      placeholder: z.string().optional(),
      hint: z.string().optional(),
      icon: z.string().optional(),
      labelField: z.string().optional(),
      valueField: z.string().optional(),
    })
    .optional(),
});

export const radiogroupSchema = z.object({
  ...inputFields,
  type: z.literal('radiogroup'),
  props: z
    .object({
      options: z.array(extendedOptionSchema).optional(),
      hint: z.string().optional(),
      labelField: z.string().optional(),
      valueField: z.string().optional(),
    })
    .optional(),
});

export const dateinputSchema = z.object({
  ...inputFields,
  type: z.literal('dateInput'),
  props: z
    .object({
      hint: z.string().optional(),
      icon: z.string().optional(),
    })
    .optional(),
});

export const datepickerSchema = z.object({
  ...inputFields,
  type: z.literal('datePicker'),
  props: z
    .object({
      hint: z.string().optional(),
      placeholder: z.string().optional(),
      icon: z.string().optional(),
      prevMonthIcon: z.string().optional(),
      nextMonthIcon: z.string().optional(),
      prevMonthAriaLabel: z.string().optional(),
      nextMonthAriaLabel: z.string().optional(),
      dayFormat: z.enum(['numeric', '2-digit']).optional(),
      weekdayFormat: z.enum(['short', 'long', 'narrow']).optional(),
      monthFormat: z.enum(['numeric', '2-digit', 'long', 'short', 'narrow']).optional(),
    })
    .optional(),
});

export const calendarSchema = z.object({
  ...inputFields,
  type: z.literal('calendar'),
  props: z
    .object({
      hint: z.string().optional(),
      prevMonthIcon: z.string().optional(),
      nextMonthIcon: z.string().optional(),
      prevMonthAriaLabel: z.string().optional(),
      nextMonthAriaLabel: z.string().optional(),
      dayFormat: z.enum(['numeric', '2-digit']).optional(),
      weekdayFormat: z.enum(['short', 'long', 'narrow']).optional(),
      monthFormat: z.enum(['numeric', '2-digit', 'long', 'short', 'narrow']).optional(),
      minDate: z.string().optional(),
      maxDate: z.string().optional(),
      numberOfMonths: z.number().optional(),
    })
    .optional(),
});

export const rangecalendarSchema = z.object({
  ...inputFields,
  type: z.literal('rangeCalendar'),
  props: z
    .object({
      hint: z.string().optional(),
      prevMonthIcon: z.string().optional(),
      nextMonthIcon: z.string().optional(),
      prevMonthAriaLabel: z.string().optional(),
      nextMonthAriaLabel: z.string().optional(),
      dayFormat: z.enum(['numeric', '2-digit']).optional(),
      weekdayFormat: z.enum(['short', 'long', 'narrow']).optional(),
      monthFormat: z.enum(['numeric', '2-digit', 'long', 'short', 'narrow']).optional(),
      minDate: z.string().optional(),
      maxDate: z.string().optional(),
      numberOfMonths: z.number().optional(),
    })
    .optional(),
});

export const rangedateinputSchema = z.object({
  ...inputFields,
  type: z.literal('rangeDateInput'),
  props: z
    .object({
      hint: z.string().optional(),
      icon: z.string().optional(),
      separator: z.string().optional(),
      removePillAriaLabel: z.string().optional(),
      startDateAriaLabel: z.string().optional(),
      endDateAriaLabel: z.string().optional(),
    })
    .optional(),
});

export const rangedatepickerSchema = z.object({
  ...inputFields,
  type: z.literal('rangeDatePicker'),
  props: z
    .object({
      hint: z.string().optional(),
      icon: z.string().optional(),
      separator: z.string().optional(),
      removePillAriaLabel: z.string().optional(),
      startDateAriaLabel: z.string().optional(),
      endDateAriaLabel: z.string().optional(),
      prevMonthIcon: z.string().optional(),
      nextMonthIcon: z.string().optional(),
      prevMonthAriaLabel: z.string().optional(),
      nextMonthAriaLabel: z.string().optional(),
      dayFormat: z.enum(['numeric', '2-digit']).optional(),
      weekdayFormat: z.enum(['short', 'long', 'narrow']).optional(),
      monthFormat: z.enum(['numeric', '2-digit', 'long', 'short', 'narrow']).optional(),
      minDate: z.string().optional(),
      maxDate: z.string().optional(),
      numberOfMonths: z.number().optional(),
    })
    .optional(),
});

export const dropdownSchema = z.object({
  ...inputFields,
  type: z.literal('dropdown'),
  props: z.object({
    placeholder: z.string().optional(),
    hint: z.string().optional(),
    items: z.array(z.object({ label: z.string(), value: z.union([z.string(), z.number()]) })),
    labelField: z.string().optional(),
    valueField: z.string().optional(),
    searchFields: z.array(z.string()).optional(),
    height: z.number().optional(),
    itemHeight: z.number().optional(),
    itemRenderer: z.string().optional(),
    inputDebounce: z.number().optional(),
  }),
});

export const listSchema = z.object({
  ...inputFields,
  type: z.literal('list'),
  props: z
    .object({
      hint: z.string().optional(),
      items: z
        .array(z.object({ label: z.string(), value: z.union([z.string(), z.number()]) }))
        .optional(),
      labelField: z.string().optional(),
      valueField: z.string().optional(),
      height: z.number().optional(),
      itemHeight: z.number().optional(),
      itemRenderer: z.string().optional(),
    })
    .optional(),
});

export const markdownSchema = z.object({
  ...inputFields,
  type: z.literal('markdown'),
  defaultValue: z.string().optional(),
  props: z
    .object({
      hint: z.string().optional(),
      placeholder: z.string().optional(),
      counterMode: z.enum(['remaining', 'current']).optional(),
      minimumHeight: z.number().optional(),
      autoGrow: z.boolean().optional(),
      defaultOpenPreview: z.boolean().optional(),
      maxLength: z.number().optional(),
      tools: z.array(z.enum(['H', 'B', 'I', 'Q', 'L', 'OL', 'UL', '|'])).optional(),
      writeTabLabel: z.string().optional(),
      previewTabLabel: z.string().optional(),
    })
    .optional(),
});

export const repeaterSchema = z.object({
  ...inputFields,
  type: z.literal('repeater'),
  props: z.object({
    addLabel: z.string().optional(),
    removeLabel: z.string().optional(),
    limit: z.number().optional(),
    template: z.string(),
  }),
});

// ---------------------------------------------------------------------------
// Action widgets
// ---------------------------------------------------------------------------

export const buttonSchema = z.object({
  ...actionFields,
  type: z.literal('button'),
  props: z
    .object({
      variant: z.enum(['filled', 'outlined']).optional(),
      icon: z.string().optional(),
      iconPosition: z.enum(['left', 'right']).optional(),
    })
    .optional(),
});

// ---------------------------------------------------------------------------
// Display widgets
// ---------------------------------------------------------------------------

export const alertSchema = z.object({
  ...displayFields,
  type: z.literal('alert'),
  props: z.object({
    text: z.string(),
    level: z.enum(['default', 'info', 'success', 'warning', 'error']).optional(),
  }),
});

export const markdownTextSchema = z.object({
  ...displayFields,
  type: z.literal('markdownText'),
  props: z.object({
    md: z.string(),
  }),
});

// ---------------------------------------------------------------------------
// Layout widgets (children are UIDs post-processed by the caller)
// ---------------------------------------------------------------------------

export const flexSchema = z.object({
  ...layoutFields,
  type: z.literal('flex'),
  children: z.array(z.string()),
  props: z
    .object({
      direction: z.enum(['row', 'row-reverse', 'column', 'column-reverse']).optional(),
      justify: z.enum(['center', 'start', 'end']).optional(),
      align: z.enum(['center', 'start', 'end', 'space-between', 'space-around', 'space-evenly']).optional(),
      gap: z.number().optional(),
    })
    .optional(),
});

export const gridSchema = z.object({
  ...layoutFields,
  type: z.literal('grid'),
  children: z.array(z.string()),
  props: z
    .object({
      direction: z.enum(['row', 'column']).optional(),
      columnGap: z.number().optional(),
      rowGap: z.number().optional(),
      autoFit: z.boolean().optional(),
    })
    .optional(),
});

export const accordionSchema = z.object({
  ...layoutFields,
  type: z.literal('accordion'),
  children: z.array(z.string()),
  props: z.object({
    singleOpen: z.boolean().optional(),
    defaultOpen: z.record(z.string(), z.boolean()).optional(),
    renderMode: z.enum(['all', 'activeOnly']).optional(),
    sections: z.array(sectionSchema),
  }),
});

export const tabsSchema = z.object({
  ...layoutFields,
  type: z.literal('tabs'),
  children: z.array(z.string()),
  props: z.object({
    defaultOpen: z.string().optional(),
    renderMode: z.enum(['all', 'activeOnly']).optional(),
    tabs: z.array(tabDefSchema),
  }),
});

// ---------------------------------------------------------------------------
// Catalog — the full set of available widgets
// ---------------------------------------------------------------------------

export const catalog = {
  // inputs
  textinput: { schema: textinputSchema, description: 'Single-line text input' },
  password: { schema: passwordSchema, description: 'Password input with masked text' },
  number: { schema: numberSchema, description: 'Numeric input with optional min/max/step' },
  currency: { schema: currencySchema, description: 'Currency / monetary amount input' },
  textarea: { schema: textareaSchema, description: 'Multi-line text input' },
  checkbox: { schema: checkboxSchema, description: 'Boolean checkbox' },
  toggle: { schema: toggleSchema, description: 'Boolean toggle switch' },
  select: { schema: selectSchema, description: 'Dropdown select from a list of options' },
  radiogroup: {
    schema: radiogroupSchema,
    description: 'Radio button group for selecting one option',
  },
  dateInput: { schema: dateinputSchema, description: 'Date text input (ISO string)' },
  datePicker: { schema: datepickerSchema, description: 'Date picker with calendar popup' },
  calendar: { schema: calendarSchema, description: 'Inline calendar widget for picking a date' },
  rangeCalendar: {
    schema: rangecalendarSchema,
    description: 'Inline calendar for picking a date range',
  },
  rangeDateInput: {
    schema: rangedateinputSchema,
    description: 'Text input for a date range (start–end)',
  },
  rangeDatePicker: {
    schema: rangedatepickerSchema,
    description: 'Date range picker with calendar popup',
  },
  dropdown: {
    schema: dropdownSchema,
    description: 'Searchable dropdown with custom item templates',
  },
  list: { schema: listSchema, description: 'Scrollable list for picking one item' },
  markdown: { schema: markdownSchema, description: 'Markdown editor with preview' },
  repeater: { schema: repeaterSchema, description: 'Repeatable section; template is a flex UID' },

  // actions
  button: { schema: buttonSchema, description: 'Clickable button that triggers an action' },

  // display
  alert: { schema: alertSchema, description: 'Informational alert / banner message' },
  markdownText: {
    schema: markdownTextSchema,
    description: 'Renders markdown content as formatted HTML for complex or structured text display',
  },

  // layouts
  flex: { schema: flexSchema, description: 'Flex container; children are widget UIDs' },
  grid: { schema: gridSchema, description: 'Grid container with subgrid alignment; children are widget UIDs' },
  accordion: {
    schema: accordionSchema,
    description: 'Collapsible accordion; sections map UIDs to panels',
  },
  tabs: { schema: tabsSchema, description: 'Tabbed container; tabs map UIDs to tab panels' },
} as const;

export type CatalogKey = keyof typeof catalog;
