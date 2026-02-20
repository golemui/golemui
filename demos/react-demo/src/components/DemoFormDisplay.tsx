import * as React from '@golemui/react';
import { Component, ErrorInfo, ReactNode } from 'react';
import { DxDefinitions } from '../services/dx/formDef.domain';
import { GslSelectorsInput } from '../services/dx/core/dx.domain';
import { FormDisplayLayout } from './FormDisplayLayout';

interface DemoFormDisplayProps<T extends Record<string, any>> {
  title: string;
  description: string;
  formDef?: DxDefinitions | (() => DxDefinitions);
  formDefSource?: string;
  formData?: T;
  warnings?: string[];
  formKey?: string;
  showingSingleForm?: boolean;
  formSelectors?: () => GslSelectorsInput;
}

class DemoErrorBoundary extends Component<
  { children: ReactNode; title: string; formKey?: string; showingSingleForm?: boolean },
  { hasError: boolean; error?: Error }
> {
  constructor(props: {
    children: ReactNode;
    title: string;
    formKey?: string;
    showingSingleForm?: boolean;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error in demo:', this.props.title, error, errorInfo);
  }

  handleOpenInNewTab = () => {
    if (!this.props.formKey) return;
    const url = new URL(window.location.href);
    url.searchParams.set('formKey', this.props.formKey);
    window.open(url.toString(), '_blank');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{ padding: '2rem', border: '2px solid red', margin: '1rem', borderRadius: '8px' }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <h2 style={{ color: 'red', margin: 0 }}>Error in: {this.props.title}</h2>
            {this.props.formKey && !this.props.showingSingleForm && (
              <button
                onClick={this.handleOpenInNewTab}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                Open in New Tab ↗
              </button>
            )}
          </div>
          <p style={{ color: '#666' }}>
            {this.state.error?.message || 'An error occurred while rendering this demo'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export function DemoFormDisplay<T extends Record<string, any>>({
  title,
  description,
  formDef,
  formDefSource,
  formData,
  warnings,
  formKey,
  showingSingleForm = false,
  formSelectors,
}: DemoFormDisplayProps<T>) {
  return (
    <DemoErrorBoundary title={title} formKey={formKey} showingSingleForm={showingSingleForm}>
      <FormDisplayLayout<T>
        title={title}
        description={description}
        formDef={formDef}
        formDefSource={formDefSource}
        formData={formData}
        warnings={warnings}
        formKey={formKey}
        showingSingleForm={showingSingleForm}
        formSelectors={formSelectors}
      />
    </DemoErrorBoundary>
  );
}

export default DemoFormDisplay;
