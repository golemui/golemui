import * as React from '@golemui/react';
import DemoFormDisplay from '../components/DemoFormDisplay';
import {
  shortcutsAndObjectsDemo,
  simpleDynamicDemo,
  simplestDemo,
  withValidatorDemo,
} from './demos';
import formRegistry from './formRegistry.domain';
import { formConfigSimplest } from './demos/05_formConfig';
import { formConfigShortcut } from './demos/06_formConfigShortcut';
import { formConfigMixed } from './demos/07_formConfigMixed';
import { simplestTagging } from './demos/09_tagging';
import { mixingLayouts } from './demos/08_MixingLayouts';
import { allBasicFunctionality } from './demos/10_allBasicFuncitonality';
import { manyTypes } from './demos/01_addingManyTypes';

export interface FormData {
  name: string;
  age: number;
  height: number;
}

// Register all forms
formRegistry.registerAll([
  simplestDemo,
  withValidatorDemo,
  shortcutsAndObjectsDemo,
  simpleDynamicDemo,
  formConfigSimplest,
  formConfigShortcut,
  formConfigMixed,
  mixingLayouts,
  simplestTagging,
  allBasicFunctionality,
  manyTypes,
]);

export function App() {
  // Check if URL has formKey parameter
  const params = new URLSearchParams(window.location.search);
  const formKey = params.get('formKey');

  // If formKey is provided, show only that form
  if (formKey) {
    const entry = formRegistry.get<FormData>(formKey);
    if (entry) {
      const index = formRegistry.getAll().findIndex((e) => e.key === entry.key);
      return (
        <DemoFormDisplay<FormData>
          title={`${index + 1}. ${entry.title}`}
          description={entry.description}
          formDef={entry.formDef}
          formData={entry.formData}
          warnings={entry.warnings}
          formKey={entry.key}
          showingSingleForm={true}
          formConfig={entry.formConfig}
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
      {formRegistry.getAll().map((entry, index) => (
        <DemoFormDisplay<FormData>
          key={entry.key}
          title={`${index + 1}. ${entry.title}`}
          description={entry.description}
          formDef={entry.formDef}
          formData={entry.formData}
          warnings={entry.warnings}
          formKey={entry.key}
          showingSingleForm={false}
          formConfig={entry.formConfig}
        />
      ))}
    </>
  );
}

export default App;
