import { gui } from '@golemui/gui-shared';

/**
 * The contract a backend sends: a data record plus per-field type metadata.
 * No form definition — just typed data.
 */
export type FieldType = 'string' | 'number' | 'date' | 'enum' | 'boolean';

export type FieldSchema = {
  type: FieldType;
  label: string;
  format?: 'email';
  options?: (string | { label: string; value: string })[];
};

export type RecordSchema = Record<string, FieldSchema>;

export type EndpointPayload = {
  data: Record<string, unknown>;
  schema: RecordSchema;
};

/**
 * Generic. Knows nothing about any specific field — point it at any typed
 * record and it produces a working form definition.
 */
export function deriveFormDefinition(schema: RecordSchema) {
  const fields = Object.entries(schema).map(([path, field]) => {
    switch (field.type) {
      case 'number':
        return gui.inputs.numberInput(path, { label: field.label });

      case 'date':
        return gui.inputs.datePicker(path, { label: field.label });

      case 'boolean':
        return gui.inputs.booleanInput(path, { label: field.label });

      case 'enum': {
        const items = (field.options ?? []).map((o) =>
          typeof o === 'string' ? { label: o, value: o } : o,
        );
        return gui.inputs.dropdown(path, {
          label: field.label,
          items,
          labelField: 'label',
          valueField: 'value',
        });
      }

      case 'string':
      default:
        return gui.inputs.textInput(path, {
          label: field.label,
          // Forward whatever validation the schema declared — the mapper
          // never names a field. Content in, form out.
          ...(field.format ? { validator: { format: field.format } } : {}),
        });
    }
  });

  return [
    ...fields,
    gui.actions.button({
      label: 'Save',
      actionType: 'submit',
    }),
  ];
}

/**
 * The same mapping as `deriveFormDefinition`, but emitted as the plain {gui.}
 * JSON form-definition DSL — the honest twin of the builder calls above. The
 * SERVER column edits the schema; this is the GolemUI definition that schema
 * produces, and the right column renders exactly this. Kept declarative (no
 * functions) so it serializes cleanly for display.
 */
export function deriveFormDsl(schema: RecordSchema): {
  form: Record<string, unknown>[];
} {
  const form: Record<string, unknown>[] = Object.entries(schema).map(([path, field]) => {
    switch (field.type) {
      case 'number':
        return { type: 'number', path, label: field.label };
      case 'date':
        return { type: 'date', path, label: field.label };
      case 'boolean':
        return { type: 'boolean', path, label: field.label };
      case 'enum': {
        const items = (field.options ?? []).map((o) =>
          typeof o === 'string' ? { label: o, value: o } : o,
        );
        return { type: 'dropdown', path, label: field.label, items, labelField: 'label', valueField: 'value' };
      }
      case 'string':
      default:
        return {
          type: 'text',
          path,
          label: field.label,
          ...(field.format ? { validator: { format: field.format } } : {}),
        };
    }
  });

  form.push({ type: 'button', actionType: 'submit', label: 'Save' });
  return { form };
}
