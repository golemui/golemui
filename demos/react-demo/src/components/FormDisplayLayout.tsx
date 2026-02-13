import * as React from 'react';
import { Component, ErrorInfo, ReactNode } from 'react';
import GolemForm from '../wrappers/golemForm.component';
import { DxDefinitions } from '../services/dx/formDef.domain';
import { DxSelectors } from '../services/dx/dxSelectors.domain';
import { serializeFormDefForDisplay } from '../utils/formDefSerializer';
import styles from './FormDisplayLayout.module.css';

class FormErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error in form rendering:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '1rem', border: '2px solid red', borderRadius: '4px', backgroundColor: '#fff5f5' }}>
          <h4 style={{ color: 'red', margin: '0 0 0.5rem 0' }}>Form Rendering Error</h4>
          <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>
            {this.state.error?.message || 'An error occurred while rendering the form'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export interface FormDisplayLayoutProps<T extends Record<string, any>> {
  title: string;
  description: string;
  formDef?: DxDefinitions<T> | (() => DxDefinitions<T>);
  formData?: T;
  warnings?: string[];
  formKey?: string;
  showingSingleForm?: boolean;
  formConfig?: DxSelectors<T>;
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

  // Check if dx is a function to get source code with helper functions
  const isFormDefFunction = typeof formDef === 'function';
  const resolvedFormDef = React.useMemo(
    () => (isFormDefFunction ? (formDef as () => DxDefinitions<T>)() : formDef),
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
              <FormErrorBoundary>
                <GolemForm<T>
                  formDef={resolvedFormDef}
                  formData={formData}
                  onConfigProcessed={handleConfigProcessed}
                  formConfig={formConfig}
                />
              </FormErrorBoundary>
            </div>
          )}
        </div>

        {/* Right Column: dx + formConfig + Warnings */}
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
