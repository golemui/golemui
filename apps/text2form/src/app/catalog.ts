import * as z from 'zod';

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

const optionSchema = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number()]),
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
  props: z
    .object({
      placeholder: z.string().optional(),
      hint: z.string().optional(),
    })
    .optional(),
});

export const passwordSchema = z.object({
  ...inputFields,
  type: z.literal('password'),
  props: z
    .object({
      placeholder: z.string().optional(),
      hint: z.string().optional(),
    })
    .optional(),
});

export const numberinputSchema = z.object({
  ...inputFields,
  type: z.literal('numberinput'),
  props: z
    .object({
      placeholder: z.string().optional(),
      hint: z.string().optional(),
      step: z.number().optional(),
      minimum: z.number().optional(),
      maximum: z.number().optional(),
    })
    .optional(),
});

export const currencySchema = z.object({
  ...inputFields,
  type: z.literal('currency'),
  props: z
    .object({
      placeholder: z.string().optional(),
      hint: z.string().optional(),
      currency: z.string().optional(),
      step: z.number().optional(),
      minimum: z.number().optional(),
      maximum: z.number().optional(),
    })
    .optional(),
});

export const textareaSchema = z.object({
  ...inputFields,
  type: z.literal('textarea'),
  props: z
    .object({
      placeholder: z.string().optional(),
      hint: z.string().optional(),
      maxLength: z.number().optional(),
      autoGrow: z.boolean().optional(),
    })
    .optional(),
});

export const checkboxSchema = z.object({
  ...inputFields,
  type: z.literal('checkbox'),
  props: z
    .object({
      hint: z.string().optional(),
    })
    .optional(),
});

export const toggleSchema = z.object({
  ...inputFields,
  type: z.literal('toggle'),
  props: z
    .object({
      hint: z.string().optional(),
    })
    .optional(),
});

export const selectSchema = z.object({
  ...inputFields,
  type: z.literal('select'),
  props: z.object({
    options: z.array(optionSchema),
    placeholder: z.string().optional(),
    hint: z.string().optional(),
  }),
});

export const radiogroupSchema = z.object({
  ...inputFields,
  type: z.literal('radiogroup'),
  props: z.object({
    options: z.array(optionSchema),
    hint: z.string().optional(),
  }),
});

export const dateinputSchema = z.object({
  ...inputFields,
  type: z.literal('dateinput'),
  props: z
    .object({
      hint: z.string().optional(),
    })
    .optional(),
});

export const datepickerSchema = z.object({
  ...inputFields,
  type: z.literal('datepicker'),
  props: z
    .object({
      hint: z.string().optional(),
      minDate: z.string().optional(),
      maxDate: z.string().optional(),
    })
    .optional(),
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

// ---------------------------------------------------------------------------
// Layout widgets (only stack; children are UIDs post-processed by the caller)
// ---------------------------------------------------------------------------

export const stackSchema = z.object({
  ...layoutFields,
  type: z.literal('stack'),
  children: z.array(z.string()),
});

// ---------------------------------------------------------------------------
// Catalog — the full set of available widgets
// ---------------------------------------------------------------------------

export const catalog = {
  // inputs
  textinput: { schema: textinputSchema, description: 'Single-line text input' },
  password: { schema: passwordSchema, description: 'Password input with masked text' },
  numberinput: {
    schema: numberinputSchema,
    description: 'Numeric input with optional min/max/step',
  },
  currency: { schema: currencySchema, description: 'Currency / monetary amount input' },
  textarea: { schema: textareaSchema, description: 'Multi-line text input' },
  checkbox: { schema: checkboxSchema, description: 'Boolean checkbox' },
  toggle: { schema: toggleSchema, description: 'Boolean toggle switch' },
  select: { schema: selectSchema, description: 'Dropdown select from a list of options' },
  radiogroup: {
    schema: radiogroupSchema,
    description: 'Radio button group for selecting one option',
  },
  dateinput: { schema: dateinputSchema, description: 'Date text input (ISO string)' },
  datepicker: { schema: datepickerSchema, description: 'Date picker with calendar popup' },

  // actions
  button: { schema: buttonSchema, description: 'Clickable button that triggers an action' },

  // display
  alert: { schema: alertSchema, description: 'Informational alert / banner message' },

  // layouts
  stack: { schema: stackSchema, description: 'Vertical stack container; children are widget UIDs' },
} as const;

export type CatalogKey = keyof typeof catalog;
