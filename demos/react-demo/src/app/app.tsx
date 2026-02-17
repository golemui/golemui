import * as React from '@golemui/react';
import DemoFormDisplay from '../components/DemoFormDisplay';
import {
  // 1. Inputs
  inputShortcutsDemo,
  inputFullObjectsDemo,
  inputWithValidatorsDemo,
  inputMixedDemo,
  inputDynamicDemo,
  gslSuppressLabelsDemo,
  gslSuppressPlaceholdersDemo,
  gslInputDecoratorDemo,
  gslInputDecoratorMixedDemo,
  // 2. Actions
  submitButtonDemo,
  customButtonDemo,
  multipleButtonsDemo,
  onClickSubmitDemo,
  gslRootOnSubmitDemo,
  gslRootSuppressSubmitDemo,
  gslActionsDemo,
  gslActionByIdDemo,
  // 3. Layouts
  horizontalStackDemo,
  verticalStackDemo,
  nestedLayoutsDemo,
  gslLayoutByIdDemo,
  gslRootSuppressStackDemo,
  // 4. Tags
  tagsBasicDemo,
  tagsMultipleDemo,
  // 5. Combinations
  gslRootWithChildrenDemo,
  fullCombinationDemo,
} from './demos';
import formRegistry from './formRegistry.domain';

export interface FormData {
  name: string;
  age: number;
  height: number;
}

// Register all forms
formRegistry.registerAll([
  // 1. Inputs
  inputShortcutsDemo,
  inputFullObjectsDemo,
  inputWithValidatorsDemo,
  inputMixedDemo,
  inputDynamicDemo,
  gslSuppressLabelsDemo,
  gslSuppressPlaceholdersDemo,
  gslInputDecoratorDemo,
  gslInputDecoratorMixedDemo,
  // 2. Actions
  submitButtonDemo,
  customButtonDemo,
  multipleButtonsDemo,
  onClickSubmitDemo,
  gslRootOnSubmitDemo,
  gslRootSuppressSubmitDemo,
  gslActionsDemo,
  gslActionByIdDemo,
  // 3. Layouts
  horizontalStackDemo,
  verticalStackDemo,
  nestedLayoutsDemo,
  gslLayoutByIdDemo,
  gslRootSuppressStackDemo,
  // 4. Tags
  tagsBasicDemo,
  tagsMultipleDemo,
  // 5. Combinations
  gslRootWithChildrenDemo,
  fullCombinationDemo,
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
          formSelectors={entry.formSelectors}
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
          formSelectors={entry.formSelectors}
        />
      ))}
    </>
  );
}

export default App;
