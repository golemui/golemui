import * as React from '@golemui/react';
import { useState } from 'react';
import DemoFormDisplay from '../components/DemoFormDisplay';
import {
  // 1. Inputs
  inputShortcutsDemo,
  inputFullObjectsDemo,
  inputWithValidatorsDemo,
  inputMixedDemo,
  gslSuppressLabelsDemo,
  gslSuppressPlaceholdersDemo,
  gslInputDecoratorDemo,
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
  // 4. Functions
  inputCallbackDemo,
  actionCallbackDemo,
  inputAndActionCallbacksDemo,
  inputCallbackWithGslDecoratorDemo,
  gslInputRuntimeFunctionDemo,
  gslActionRuntimeFunctionDemo,
  gslMixedRuntimeFunctionDemo,
  // 5. Displays
  displayShortcutDemo,
  // 6. Tags
  tagsBasicDemo,
  tagsMultipleDemo,
  // 7. Combinations
  smartContactFormDemo,
} from './demos';
import formRegistry from './formRegistry.domain';
import styles from './app.module.css';

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
  gslSuppressLabelsDemo,
  gslSuppressPlaceholdersDemo,
  gslInputDecoratorDemo,
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
  // 4. Functions
  inputCallbackDemo,
  actionCallbackDemo,
  inputAndActionCallbacksDemo,
  inputCallbackWithGslDecoratorDemo,
  gslInputRuntimeFunctionDemo,
  gslActionRuntimeFunctionDemo,
  gslMixedRuntimeFunctionDemo,
  // 5. Displays
  displayShortcutDemo,
  // 6. Tags
  tagsBasicDemo,
  tagsMultipleDemo,
  // 7. Combinations
  smartContactFormDemo,
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
          formDefSource={entry.formDefSource}
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

  // Show all forms grouped by category
  return <CategoryGroupedDemos />;
}

function CategoryGroupedDemos() {
  const categories = formRegistry.getByCategory();
  const initialCollapsed = Object.fromEntries(categories.map(({ category }) => [category, true]));
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(initialCollapsed);

  const toggleCategory = (category: string) => {
    setCollapsed((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  return (
    <>
      {categories.map(({ category, entries }, catIndex) => (
        <div key={category} className={styles.categorySection}>
          <button
            onClick={() => toggleCategory(category)}
            className={styles.categoryToggle}
          >
            <span className={styles.categoryToggleIcon}>
              {collapsed[category] ? '▶' : '▼'}
            </span>
            {catIndex + 1}. {category}
            <span className={styles.categoryCount}>({entries.length})</span>
          </button>
          {!collapsed[category] && (
            <div className={styles.categoryContent}>
              {entries.map((entry, index) => (
                <DemoFormDisplay<FormData>
                  key={entry.key}
                  title={`${catIndex + 1}.${index + 1}. ${entry.title}`}
                  description={entry.description}
                  formDef={entry.formDef}
                  formDefSource={entry.formDefSource}
                  formData={entry.formData}
                  warnings={entry.warnings}
                  formKey={entry.key}
                  showingSingleForm={false}
                  formSelectors={entry.formSelectors}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );
}

export default App;
