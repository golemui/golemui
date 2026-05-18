import { GuiForm } from '@golemui/gui-react';
import {
  type DxDefinitions,
  type DxFormConfig,
  formDefs,
  type GslSelectorsInput,
} from '@golemui/gui-shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { type DemoLogEntry, type DemoLogFn } from '../utils/demoLog';
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
        <div
          style={{
            padding: '1rem',
            border: '2px solid red',
            borderRadius: '4px',
            backgroundColor: '#fff5f5',
          }}
        >
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
  formDef?: DxDefinitions | ((log: DemoLogFn) => DxDefinitions);
  formDefSource?: string;
  formData?: T;
  warnings?: string[];
  formKey?: string;
  showingSingleForm?: boolean;
  formSelectors?: () => GslSelectorsInput;
  formConfig?: () => DxFormConfig;
}

export function FormDisplayLayout<T extends Record<string, any>>({
  title,
  description,
  formDef,
  formDefSource,
  formData,
  warnings,
  formKey,
  showingSingleForm = false,
  formSelectors,
  formConfig,
}: FormDisplayLayoutProps<T>) {
  const [isConfigExpanded, setIsConfigExpanded] = useState(showingSingleForm);
  const [logEntries, setLogEntries] = useState<DemoLogEntry[]>([]);
  const logPanelRef = useRef<HTMLDivElement>(null);

  const demoLog: DemoLogFn = useCallback((label: string, ...args: any[]) => {
    setLogEntries((prev) => [...prev, { timestamp: new Date().toLocaleTimeString(), label, args }]);
  }, []);

  useEffect(() => {
    if (logPanelRef.current) {
      logPanelRef.current.scrollTop = logPanelRef.current.scrollHeight;
    }
  }, [logEntries]);

  // Check if dx is a function to get source code with helper functions
  const isFormDefFunction = typeof formDef === 'function';
  const resolvedFormDef = useMemo(
    () => (isFormDefFunction ? (formDef as (log: DemoLogFn) => DxDefinitions)(demoLog) : formDef),
    [formDef, isFormDefFunction, demoLog],
  );

  // For display: show function source if it's a function, otherwise serialize the value
  // If it's a function, strip the "() => " wrapper from the beginning
  const serialized = formDefSource
    ? formDefSource
    : formDef
      ? isFormDefFunction
        ? // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
          (formDef as Function).toString().replace(/^\(\)\s*=>\s*/, '')
        : serializeFormDefForDisplay(formDef)
      : '';
  const resolvedFormSelectors = useMemo(
    () => (formSelectors ? formSelectors() : undefined),
    [formSelectors],
  );
  const resolvedFormConfig = useMemo(() => (formConfig ? formConfig() : undefined), [formConfig]);

  const serializedFormSelectors = formSelectors
    ? formSelectors.toString().replace(/^\(\)\s*=>\s*/, '')
    : '';

  const serializedFormConfig = formConfig ? formConfig.toString().replace(/^\(\)\s*=>\s*/, '') : '';

  const processedConfig = useMemo(
    () =>
      resolvedFormDef
        ? formDefs.processDxFacade(resolvedFormDef, resolvedFormSelectors, resolvedFormConfig)
        : null,
    [resolvedFormDef, resolvedFormSelectors, resolvedFormConfig],
  );

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
                <GuiForm
                  formDef={resolvedFormDef}
                  data={formData}
                  formSelectors={resolvedFormSelectors}
                  formConfig={resolvedFormConfig}
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

            {serializedFormSelectors && (
              <div>
                <h4 className={styles.sectionTitle}>formSelectors</h4>
                <pre className={styles.codeBlock}>
                  <code>{serializedFormSelectors}</code>
                </pre>
              </div>
            )}

            {serializedFormConfig && (
              <div>
                <h4 className={styles.sectionTitle}>formConfig</h4>
                <pre className={styles.codeBlock}>
                  <code>{serializedFormConfig}</code>
                </pre>
              </div>
            )}

            <div>
              <h4 className={styles.sectionTitle}>Log</h4>
              <div ref={logPanelRef} className={styles.logPanel}>
                {logEntries.length === 0 ? (
                  <span className={styles.logEmpty}>No log entries yet.</span>
                ) : (
                  logEntries.map((entry, i) => (
                    <div key={i} className={styles.logEntry}>
                      <span className={styles.logTimestamp}>{entry.timestamp}</span>
                      <span className={styles.logLabel}>{entry.label}</span>
                      {entry.args.length > 0 && (
                        <span className={styles.logArgs}>
                          {entry.args
                            .map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
                            .join(' ')}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

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
            DxResult (processDxFacade output)
          </button>
          {isConfigExpanded && (
            <div>
              <h5 className={styles.sectionTitle}>form</h5>
              <pre className={styles.codeBlock}>
                <code>{serializeFormDefForDisplay(processedConfig.form)}</code>
              </pre>
              {processedConfig.events && (
                <>
                  <h5 className={styles.sectionTitle}>events</h5>
                  <pre className={styles.codeBlock}>
                    <code>{processedConfig.events.toString()}</code>
                  </pre>
                </>
              )}
              {processedConfig.dependencies && (
                <>
                  <h5 className={styles.sectionTitle}>dependencies</h5>
                  <pre className={styles.codeBlock}>
                    <code>{serializeFormDefForDisplay(processedConfig.dependencies)}</code>
                  </pre>
                </>
              )}
              {processedConfig.validateOn && (
                <>
                  <h5 className={styles.sectionTitle}>validateOn</h5>
                  <pre className={styles.codeBlock}>
                    <code>{JSON.stringify(processedConfig.validateOn)}</code>
                  </pre>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
