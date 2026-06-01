import type { FormEvent } from '@golemui/core';
import { GuiForm } from '@golemui/gui-react';
import { gui } from '@golemui/gui-shared';

/**
 * Forms as data
 * =============
 * Your backend returns DATA and its SHAPE — not a form definition, not markup.
 * GolemUI turns that shape into a form. Add a field to `schema` and the form
 * grows; change a `type` and the widget changes. You never write form code.
 */

type FieldType = 'string' | 'number' | 'date' | 'boolean' | 'enum';
type Field = { type: FieldType; label: string; options?: string[] };
type Schema = Record<string, Field>;

// What the server sends: the data, plus the shape that describes it.
const response: { data: Record<string, unknown>; schema: Schema } = {
  data: {
    name: 'Alex García',
    email: 'alex@example.com',
    joined: '2024-03-12',
    role: 'lead',
    active: true,
  },
  schema: {
    name: { type: 'string', label: 'Full name' },
    email: { type: 'string', label: 'Email' },
    joined: { type: 'date', label: 'Joined' },
    role: { type: 'enum', label: 'Role', options: ['ic', 'lead', 'director'] },
    active: { type: 'boolean', label: 'Active' },
  },
};

// The only "form code" you write: one GolemUI input per field type.
function toForm(schema: Schema) {
  return [
    ...Object.entries(schema).map(([key, field]) => {
      switch (field.type) {
        case 'number':
          return gui.inputs.numberInput(key, { label: field.label });
        case 'date':
          return gui.inputs.datePicker(key, { label: field.label });
        case 'boolean':
          return gui.inputs.booleanInput(key, { label: field.label });
        case 'enum':
          return gui.inputs.dropdown(key, {
            label: field.label,
            items: field.options ?? [],
          });
        default:
          return gui.inputs.textInput(key, { label: field.label });
      }
    }),
    gui.actions.button({ label: 'Save', uid: 'save', onClick: () => 'save' }),
  ];
}

const config = {
  formDef: toForm(response.schema),
  data: response.data,
};

function handleFormEvent(event: FormEvent) {
  if (event.name === 'save') {
    alert(`Saved:\n${JSON.stringify(event.data, null, 2)}`);
  }
}

export function App() {
  return (
    <>
      <h1>Forms as data</h1>
      <p className="lede">
        The form below was derived from <code>schema</code> — not one line of
        form markup. Edit the schema in <code>src/App.tsx</code> (add a field,
        change a type) and watch the form follow.
      </p>
      <GuiForm config={config} formEvent={handleFormEvent} />
    </>
  );
}
