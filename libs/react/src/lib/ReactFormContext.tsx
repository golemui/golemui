import { createContext, useContext } from 'react';

import type { FormContext, WithWidget } from '@golemui/core';
import type { WidgetErrorFallback } from './WidgetErrorBoundary';

/** The value every widget and renderer below a form reads. */
export interface ReactFormContextValue {
  formContext: FormContext<React.ComponentType<WithWidget>>;
  /** Replacement UI for a widget that threw. Undefined keeps the DOM default of `WidgetErrorBoundary`. */
  widgetErrorFallback?: WidgetErrorFallback;
}

export const ReactFormContext = createContext<ReactFormContextValue | null>(null);

export function useReactFormContext() {
  const context = useContext(ReactFormContext);
  if (!context) {
    throw new Error('useReactFormContext must be used within a ReactFormContextProvider');
  }
  return context;
}
