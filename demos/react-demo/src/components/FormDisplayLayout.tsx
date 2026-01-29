import * as React from 'react';
import GolemForm from '../wrappers/golemForm.component';
import { FormDefFacade } from '../services/formDef/formDef.domain';
import { FormConfig } from '../services/formDef/fomConfig.domain';
import { serializeFormDefForDisplay } from '../utils/formDefSerializer';
import styles from './FormDisplayLayout.module.css';

export interface FormDisplayLayoutProps<T extends Record<string, any>> {
  title: string;
  description: string;
  formDef?: FormDefFacade<T> | (() => FormDefFacade<T>);
  formData?: T;
  warnings?: string[];
  formKey?: string;
  showingSingleForm?: boolean;
  formConfig?: FormConfig<T>;
}

export function FormDisplayLayout<T extends Record<string, any>>({
  title,
  description,
  formDef,
  formData,
  warnings,
  formKey,
  showingSingleForm = false,
  formConfig,
}: FormDisplayLayoutProps<T>) {
  const [processedConfig, setProcessedConfig] = React.useState<any>(null);
  const [isConfigExpanded, setIsConfigExpanded] = React.useState(showingSingleForm);

  // Check if formDef is a function to get source code with helper functions
  const isFormDefFunction = typeof formDef === 'function';
  const resolvedFormDef = React.useMemo(
    () => (isFormDefFunction ? (formDef as () => FormDefFacade<T>)() : formDef),
    [formDef, isFormDefFunction]
  );

  // For display: show function source if it's a function, otherwise serialize the value
  // If it's a function, strip the "() => " wrapper from the beginning
  const serialized = formDef
    ? (isFormDefFunction
        ? (formDef as Function).toString().replace(/^\(\)\s*=>\s*/, '')
        : serializeFormDefForDisplay(formDef))
    : '';
  const serializedFormConfig = formConfig ? serializeFormDefForDisplay(formConfig) : '';

  const handleConfigProcessed = React.useCallback((config: any) => {
    setProcessedConfig((prev: any) => {
      // Only update if it's actually different to prevent infinite loops
      if (prev === config) return prev;
      return config;
    });
  }, []);

  const handleOpenInNewTab = () => {
    if (!formKey) return;
    const url = new URL(window.location.href);
    url.searchParams.set('formKey', formKey);
    window.open(url.toString(), '_blank');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {formKey && !showingSingleForm && (
          <button onClick={handleOpenInNewTab} className={styles.openButton}>
            Open in New Tab ↗
          </button>
        )}
      </div>

      <div className={styles.content}>
        {/* Left Column: Description + Form */}
        <div className={styles.leftColumn}>
          <div>
            <h4 className={styles.sectionTitle}>Description</h4>
            <p className={styles.description}>{description}</p>
          </div>

          {resolvedFormDef && (
            <div className={styles.formSection}>
              <h4 className={styles.sectionTitle}>Form</h4>
              <GolemForm<T>
                formDef={resolvedFormDef}
                formData={formData}
                onConfigProcessed={handleConfigProcessed}
                formConfig={formConfig}
              />
            </div>
          )}
        </div>

        {/* Right Column: formDef + formConfig + Warnings */}
        {resolvedFormDef && (
          <div className={styles.rightColumn}>
            <div>
              <h4 className={styles.sectionTitle}>formDef</h4>
              <pre className={styles.codeBlock}>
                <code>{serialized}</code>
              </pre>
            </div>

            {formConfig && (
              <div>
                <h4 className={styles.sectionTitle}>formConfig</h4>
                <pre className={styles.codeBlock}>
                  <code>{serializedFormConfig}</code>
                </pre>
              </div>
            )}

            {warnings && warnings.length > 0 && (
              <div className={styles.warningsContainer}>
                <div className={styles.warningsHeader}>
                  <span className={styles.warningIcon}>⚠️</span>
                  <h5 className={styles.warningsTitle}>Warnings</h5>
                </div>
                <ul className={styles.warningsList}>
                  {warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Collapsible Processed Config Section */}
      {processedConfig && (
        <div className={styles.configSection}>
          <button
            onClick={() => setIsConfigExpanded(!isConfigExpanded)}
            className={styles.configToggle}
          >
            <span className={styles.configToggleIcon}>{isConfigExpanded ? '▼' : '▶'}</span>
            Processed Config (console.log output)
          </button>
          {isConfigExpanded && (
            <pre className={styles.codeBlock}>
              <code>{serializeFormDefForDisplay(processedConfig)}</code>
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
