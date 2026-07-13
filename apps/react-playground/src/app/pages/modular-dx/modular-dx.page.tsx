import { modularDx, onFormEvent } from '@golemui/apps-shared';
import type { FormHealth, FormSubmitEvent } from '@golemui/core';
import { GuiForm } from '@golemui/gui-react';
import type { Dependencies } from '@golemui/gui-shared';
import { useCallback, useState } from 'react';
import snarkdown from 'snarkdown';

const md = modularDx;
const dependencies: Dependencies = {
  markdown: { parse: (markdown: string) => snarkdown(markdown) },
};
const config = {
  formDef: md.formDef,
  data: md.data,
  formSelectors: md.formSelectors,
  formConfig: md.formConfig,
  dependencies,
};

export function ModularDxPage() {
  const [errors, setErrors] = useState<string[]>([]);

  const onFormSubmit = useCallback((event: FormSubmitEvent) => {
    console.log('👉 onFormSubmit', event.data);
  }, []);

  const onFormHealth = useCallback((event: FormHealth) => {
    if (event.status === 'errored') {
      setErrors((prev) => [...prev, event.message]);
    }
  }, []);

  return (
    <div>
      {errors.length > 0 && (
        <div
          style={{
            border: '2px solid red',
            padding: '8px 12px',
            marginBottom: '12px',
            color: 'red',
          }}
        >
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      <GuiForm
        config={config}
        formEvent={onFormEvent}
        formSubmit={onFormSubmit}
        formHealth={onFormHealth}
      />
    </div>
  );
}

export default ModularDxPage;
