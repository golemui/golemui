import * as Core from '@golemui/core';
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  field: Core.NonFunctionWidget<string, any>;
}

interface State {
  error: Error | null;
}

export default class FieldErrorBoundary extends Component<Props, State> {
  public state: State = { error: null };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    const { error } = this.state;
    const { children, field } = this.props;

    if (error) {
      return fallback(error, field);
    }

    return children;
  }
}

function fallback(error: Error, field: Props['field']) {
  return (
    <div style={{ border: '1px solid red', padding: '4px' }}>
      Component{' '}
      <code style={{ fontWeight: 'bold' }}>
        {field.widget}[{field.uid}]
      </code>{' '}
      failed with:
      <p style={{ color: 'red', marginTop: '4px' }}>
        <code>{error.message}</code>
      </p>
    </div>
  );
}
