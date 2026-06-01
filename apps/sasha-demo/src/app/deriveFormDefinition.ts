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
          ...(field.format === 'email'
            ? {
                validator: {
                  format: 'email',
                  messages: { format: 'Please enter a valid email address' },
                },
              }
            : {}),
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
