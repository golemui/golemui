import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import type { FormSubmitEvent } from '@golemui/core';
import { FormComponent } from '@golemui/gui-angular';
import { gui, type GuiFormInitConfig } from '@golemui/gui-shared';

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
            ...(field.format === 'email' ? { validator: { format: 'email' } } : {}),
          });
      }
    }),
    gui.actions.button({ label: 'Save', actionType: 'submit' }),
  ];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormComponent],
  templateUrl: './app.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class App {
  protected config: GuiFormInitConfig = {
    formDef: toForm(response.schema),
    data: response.data,
  };

  protected saved: Record<string, unknown> | null = null;

  protected onFormSubmit(event: FormSubmitEvent) {
    // event.data is the typed payload the backend would receive.
    this.saved = event.data;
  }

  protected get savedJson(): string {
    return `// what the backend receives\n${JSON.stringify(this.saved, null, 2)}`;
  }
}
