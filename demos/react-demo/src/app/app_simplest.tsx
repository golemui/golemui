import * as React from '@golemui/react';
import DemoFormDisplay from '../components/DemoFormDisplay';
import formRegistry from '../services/formRegistry';

export interface FormData {
  name: string;
  age: number;
  height: number;
}

// Register all forms
formRegistry.register({
  key: 'simplest',
  title: '0. Simplest Form data.',
  description: 'Shortcuts for everything',
  formDef: {
    name: 'string',
    age: 'number',
    height: 'number',
  },
});

formRegistry.register({
  key: 'with-validator',
  title: '1. Form data with a validator.',
  description: 'Form data with a single validator.!',
  formDef: {
    name: {
      type: 'text',
      validator: {
        minLength: 3,
      },
    },
  },
});

formRegistry.register({
  key: 'shortcuts-and-objects',
  title: '2. Combining shortcuts and js definition objects.',
  description: 'Form driven from formDef shortcuts, note that age has a validator',
  warnings: ['TBI: Placeholder property and other HTML props in core'],
  formDef: {
    name: 'string',
    age: {
      type: 'number',
      placeholder: 'age < 18',
      validator: {
        minimum: 18,
      },
    },
    height: 'number',
  },
});

formRegistry.register({
  key: 'simple-dynamic',
  title: '3. Simple dynamic.',
  description: 'Form driven from formDef shortcuts, note that age has a validator',
  warnings: ['TBI: Dynamic properties'],
  formDef: {
    name: 'string',
    age: ({ error }) => ({
      label: error ? 'Try again your Age!' : 'Age',
      type: 'number',
      placeholder: 'age < 18',
      validator: {
        minimum: 18,
      },
    }),
    height: 'number',
  },
});

export function App_simplest() {
  // Check if URL has formKey parameter
  const params = new URLSearchParams(window.location.search);
  const formKey = params.get('formKey');

  // If formKey is provided, show only that form
  if (formKey) {
    const entry = formRegistry.get<FormData>(formKey);
    if (entry) {
      return (
        <DemoFormDisplay<FormData>
          title={entry.title}
          description={entry.description}
          formDef={entry.formDef}
          formData={entry.formData}
          warnings={entry.warnings}
          formKey={entry.key}
          showingSingleForm={true}
        />
      );
    }
    // If formKey not found, show error
    return (
      <div style={{ padding: '2rem', color: 'red' }}>
        <h2>Form not found</h2>
        <p>No form registered with key: {formKey}</p>
      </div>
    );
  }

  // Show all forms if no formKey parameter
  return (
    <>
      {formRegistry.getAll().map((entry) => (
        <DemoFormDisplay<FormData>
          key={entry.key}
          title={entry.title}
          description={entry.description}
          formDef={entry.formDef}
          formData={entry.formData}
          warnings={entry.warnings}
          formKey={entry.key}
          showingSingleForm={false}
        />
      ))}
    </>
  );
}

export default App_simplest;
