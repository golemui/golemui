import * as React from '@golemui/react';
import { useState } from 'react';
import DemoFormDisplay from '../components/DemoFormDisplay';
import {
  // Chapter 1: Getting Started
  fourLinerDemo,
  moreWidgetsDemo,
  customFieldsDemo,
  layoutsDemo,
  buttonsDemo,
  // Chapter 2: Input Widgets
  moreInputTypesDemo,
  selectAndRadioDemo,
  datePickerDemo,
  dropdownDemo,
  markdownDemo,
  rangeDateInputDemo,
  rangeDatePickerDemo,
  alertDemo,
  widgetFieldPlumbingDemo,
  // Chapter 3: Compound Widgets
  tabsAndListDemo,
  accordionDemo,
  repeaterDemo,
  nestedRepeaterDemo,
  // Chapter 4: Custom Widgets
  customDisplayDemo,
  customInputDemo,
  customActionDemo,
  // Chapter 5: Selectors
  globalConfigDemo,
  decoratorOverridesDemo,
  tagsDemo,
  byIdAndByTypeDemo,
  runtimePromotionDemo,
  // Chapter 6: Events
  onChangeCascadingSelectsDemo,
  onLoadInitializationDemo,
  onFilterDropdownDemo,
  onChangeLayoutDemo,
  // Chapter 7: Dynamic
  dynamicInputDemo,
  dynamicButtonDemo,
  dynamicDisplayDemo,
  dynamicCalendarTextareaDemo,
  // Chapter 8: States
  perWidgetOverridesDemo,
  visibilityWithStatesDemo,
  inlineWhenDemo,
  hierarchicalStatesDemo,
  gslStatesDemo,
  // Chapter 9: Real World
  employeeOnboardingDemo,
  supportTicketDemo,
  bookingRequestDemo,
  eventRegistrationDemo,
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
  // Chapter 1: Getting Started
  fourLinerDemo,
  moreWidgetsDemo,
  customFieldsDemo,
  layoutsDemo,
  buttonsDemo,
  // Chapter 2: Input Widgets
  moreInputTypesDemo,
  selectAndRadioDemo,
  datePickerDemo,
  dropdownDemo,
  markdownDemo,
  rangeDateInputDemo,
  rangeDatePickerDemo,
  alertDemo,
  widgetFieldPlumbingDemo,
  // Chapter 3: Compound Widgets
  tabsAndListDemo,
  accordionDemo,
  repeaterDemo,
  nestedRepeaterDemo,
  // Chapter 4: Custom Widgets
  customDisplayDemo,
  customInputDemo,
  customActionDemo,
  // Chapter 5: Selectors
  globalConfigDemo,
  decoratorOverridesDemo,
  tagsDemo,
  byIdAndByTypeDemo,
  runtimePromotionDemo,
  // Chapter 6: Events
  onChangeCascadingSelectsDemo,
  onLoadInitializationDemo,
  onFilterDropdownDemo,
  onChangeLayoutDemo,
  // Chapter 7: Dynamic
  dynamicInputDemo,
  dynamicButtonDemo,
  dynamicDisplayDemo,
  dynamicCalendarTextareaDemo,
  // Chapter 8: States
  perWidgetOverridesDemo,
  visibilityWithStatesDemo,
  inlineWhenDemo,
  hierarchicalStatesDemo,
  gslStatesDemo,
  // Chapter 9: Real World
  employeeOnboardingDemo,
  supportTicketDemo,
  bookingRequestDemo,
  eventRegistrationDemo,
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
                  formConfig={entry.formConfig}
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
