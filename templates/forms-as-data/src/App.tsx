import type { FormSubmitEvent } from '@golemui/core';
import { GuiForm } from '@golemui/gui-react';
import { gui } from '@golemui/gui-shared';
import { useState } from 'react';

/**
 * Forms as data
 * =============
 * Your backend returns DATA and its SHAPE — not a form definition, not markup.
 * GolemUI turns that shape into a form. Add a field to `schema` and the form
 * grows; change a `type` and the widget changes. You never write form code.
 *
 * The return trip is real too: the email field validates, and Save only fires
 * once the form is valid — handing you back a TYPED payload (numbers are
 * numbers, booleans are booleans), not a bag of strings.
 */

type FieldType = 'string' | 'number' | 'date' | 'boolean' | 'enum';
type Field = { type: FieldType; label: string; format?: 'email'; options?: string[] };
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
    email: { type: 'string', label: 'Email', format: 'email' },
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
          return gui.inputs.textInput(key, {
            label: field.label,
            ...(field.format === 'email'
              ? { validator: { format: 'email' } }
              : {}),
          });
      }
    }),
    // actionType:'submit' validates the whole form first — formSubmit only
    // fires when it's valid.
    gui.actions.button({ label: 'Save', actionType: 'submit' }),
  ];
}

const config = {
  formDef: toForm(response.schema),
  data: response.data,
};

export function App() {
  const [saved, setSaved] = useState<Record<string, unknown> | null>(null);

  function handleSubmit(event: FormSubmitEvent) {
    // event.data is the typed payload the backend would receive.
    setSaved(event.data);
  }

  return (
    <>
      <h1>Forms as data</h1>
      <p className="lede">
        The form below was derived from <code>schema</code> — not one line of
        form markup. Edit the schema in <code>src/App.tsx</code> (add a field,
        change a type) and watch the form follow. Try a bad email, then Save.
      </p>
      <GuiForm config={config} formSubmit={handleSubmit} />
      {saved && (
        <pre className="received">
          {`// what the backend receives\n${JSON.stringify(saved, null, 2)}`}
        </pre>
      )}
    </>
  );
}
