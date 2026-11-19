'use client';

import { mockMarkdownParser, mockUploadService, onFormEvent, signup } from '@golemui/apps-shared';
import type { FormHealth, FormSubmitEvent } from '@golemui/core';
import { GuiForm } from '@golemui/gui-react';
import type { Dependencies, GuiFormInitConfig } from '@golemui/gui-shared';
import { useCallback, useState } from 'react';

const dependencies: Dependencies = {
  markdown: mockMarkdownParser,
  uploadService: mockUploadService,
};
const config: GuiFormInitConfig = {
  // Stable id: with SSR the server and client must agree on the form id.
  formName: 'nextjs-json-signup',
  formDef: signup.form,
  data: signup.data,
  dependencies,
};

export default function SignupPage() {
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
