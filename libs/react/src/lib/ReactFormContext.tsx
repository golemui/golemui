import { createContext, useContext } from 'react';

import type { FormContext, WithWidget } from '@golemui/core';

export const ReactFormContext = createContext<{
  formContext: FormContext<React.ComponentType<WithWidget>>;
} | null>(null);

export function useReactFormContext() {
  const context = useContext(ReactFormContext);
  if (!context) {
    throw new Error('useReactFormContext must be used within a ReactFormContextProvider');
  }
  return context;
}
