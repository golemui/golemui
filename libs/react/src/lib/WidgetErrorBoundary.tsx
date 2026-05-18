import type * as Core from '@golemui/core';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  widget: Core.NonFunctionWidget<string, any>;
}

interface State {
  error: Error | null;
}

export default class WidgetErrorBoundary extends Component<Props, State> {
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
    const { children, widget } = this.props;

    if (error) {
      return fallback(error, widget);
    }

    return children;
  }
}

function fallback(error: Error, widget: Props['widget']) {
  return (
    <div style={{ border: '1px solid red', padding: '4px' }}>
      Component{' '}
      <code style={{ fontWeight: 'bold' }}>
        {widget.type}[{widget.uid}]
      </code>{' '}
      failed with:
      <p style={{ color: 'red', marginTop: '4px' }}>
        <code>{error.message}</code>
      </p>
    </div>
  );
}
