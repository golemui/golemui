import * as React from '@golemui/react';
import GolemForm from '../wrappers/golemForm.component';

export interface FormData {
  name: string;
  age: number;
  height: number;
}

export function App_simplest() {
  return (
    <div>
      <GolemForm<FormData>
        formDef={{
          name: {
            type: 'text',
            validator: {
              type: 'string',
              required: true,
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
    </div>
  );
}

export default App_simplest;
