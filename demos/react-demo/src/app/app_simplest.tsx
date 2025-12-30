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
        title="0. Simplest Form data."
        description="Shortcuts for everything"
        formDef={{
          name: 'string',
          age: 'number',
          height: 'number',
        }}
      />
      <DemoFormDisplay<FormData>
        title="1. Form data with a validator."
        description="Form data with a single validator.!"
        formDef={{
          name: {
            type: 'text',
            validator: {
              minLength: 3,
            },
          },
        }}
      />
      <DemoFormDisplay<FormData>
        title="2. Combining shortcuts and js definition objects."
        description="Form driven from formDef shortcuts, note that age has a validator"
        warnings={['TBI: Placeholder property and other HTML props in core']}
        formDef={{
          name: 'string',
          age: {
            type: 'number',
            placeholder: 'age < 18',
            validator: {
              minimum: 18,
            },
          },
          height: 'number',
        }}
      />
      <DemoFormDisplay<FormData>
        title="3. Simple dynamic."
        description="Form driven from formDef shortcuts, note that age has a validator"
        warnings={['TBI: Dynamic properties']}
        formDef={{
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
        }}
      />
    </>
  );
}

export default App_simplest;
