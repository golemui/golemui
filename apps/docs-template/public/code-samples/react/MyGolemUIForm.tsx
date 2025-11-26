import * as React from '@golemui/react';
import * as Vanilla from '@golemui/react-vanilla';
import { use } from 'react';

export function MyGolemUIForm() {
  const form = use(fetch('/form.json').then((r) => r.json()));
  const data = use(fetch('/data.json').then((r) => r.json()));

  return (
    <div>
      <React.FormComponent
        formDef={form}
        data={data}
        fieldLoader={{ ...Vanilla.vanillaFieldLoaders }}
      />
    </div>
  );
}
