import * as React from '@golemui/react';
import DemoFormDisplay from '../components/DemoFormDisplay';

export interface FormData {
  name: string;
  age: number;
  height: number;
}

export function App_simplest() {
  return (
    <>
      <DemoFormDisplay<FormData>
        title="1. Form data."
        description="Form driven from form data with a hint. Note that the field name has a validator!"
        formDef={{
          name: {
            type: 'text',
            validator: {
              minLength: 3,
            },
          },
        }}
        formData={{
          name: 'preset name',
          age: 18,
          height: 1.8,
        }}
      />
      <DemoFormDisplay<FormData>
        title="2. Form def shortcuts."
        description="Form driven from formDef shortcuts, note that age has a validator"
        formDef={{
          name: 'string',
          age: {
            type: 'number',
            validator: {
              minimum: 18,
            },
          },
          height: 'number',
        }}
      />
    </>
  );
}

export default App_simplest;
