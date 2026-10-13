import type { NonFunctionWidget } from '@golemui/core';
import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Renders the replacement UI for a widget that threw while rendering.
 *
 * Every host renders its own element types, so a host without a DOM (Ink, for example)
 * has to supply one. Pass it through the `widgetErrorFallback` prop of `FormComponent`
 * or through the options of `createFormComponent`.
 *
 * @example
 * const inkWidgetErrorFallback: WidgetErrorFallback = (error, widget) => (
 *   <Text color="red">
 *     {widget.type}[{widget.uid}] failed with: {error.message}
 *   </Text>
 * );
 */
export type WidgetErrorFallback = (error: Error, widget: NonFunctionWidget<string>) => ReactNode;

interface Props {
  children: ReactNode;
  widget: NonFunctionWidget<string, any>;
  /** Replacement UI for a widget that threw. Defaults to {@link DefaultWidgetErrorFallback}, which renders DOM elements. */
  fallback?: WidgetErrorFallback;
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
    const { children, widget, fallback } = this.props;

    if (error) {
      const renderFallback = fallback ?? DefaultWidgetErrorFallback;
      return renderFallback(error, widget);
    }

    return children;
  }
}

/** Default replacement UI for a widget that threw. Renders DOM elements, so a host without a DOM must pass its own. */
export const DefaultWidgetErrorFallback: WidgetErrorFallback = (error, widget) => {
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
};
