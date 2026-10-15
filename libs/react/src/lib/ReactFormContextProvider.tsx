import type { FormContext, WithWidget } from '@golemui/core';
import { useMemo } from 'react';
import { ReactFormContext } from './ReactFormContext';
import type { WidgetErrorFallback } from './WidgetErrorBoundary';

export function ReactFormContextProvider({
  children,
  formContext,
  widgetErrorFallback,
}: {
  children: React.ReactNode;
  formContext: FormContext<React.ComponentType<WithWidget>>;
  widgetErrorFallback?: WidgetErrorFallback;
}) {
  const value = useMemo(
    () => ({ formContext, widgetErrorFallback }),
    [formContext, widgetErrorFallback],
  );

  return <ReactFormContext.Provider value={value}>{children}</ReactFormContext.Provider>;
}
