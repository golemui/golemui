import { createContext, useContext } from 'react';

import * as Core from '@golemui/core';

export const ReactFormContext = createContext<{
  formContext: Core.FormContext<React.ComponentType<Core.WithWidget>>;
} | null>(null);

export function useReactFormContext() {
  const context = useContext(ReactFormContext);
  if (!context) {
    throw new Error('useReactFormContext must be used within a ReactFormContextProvider');
  }
  return context;
}
