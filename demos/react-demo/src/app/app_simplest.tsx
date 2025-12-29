import * as React from '@golemui/react';
import GolemForm, { ControllerDef, DataInput } from '../wrappers/golemForm.component';

export interface FormData {
  name: string;
  age: number;
  height: number;
}

export function App_simple() {
  const dataInputs: DataInput<FormData> = {
    name: {
      type: 'text',
      validator: {
        type: 'string', //<- this should be removed
        minLength: 3,
      },
    },
    age: {
      type: 'number',
    },
    height: {
      type: 'text',
    },
  };

  const submitButton: ControllerDef = {
    type: 'button',
    label: 'Create',
    on: {
      click: 'submit',
    },
  };

  return (
    <div>
      GolemForm below!
      <GolemForm<FormData>
        formDef={[
          ['data_inputs', dataInputs],
          ['controllers', submitButton],
        ]}
        formData={{
          name: 'preset name',
          age: 18,
          height: 1.8,
        }}
      />
    </div>
  );
}

export default App_simple;
