import { createContext, useContext } from 'react';

import * as Core from '@formforge/core';

export const ReactFormContext = createContext<{
  formContext: Core.FormContext<React.ComponentType<Core.WithField>>;
} | null>(null);

export function useReactFormContext() {
  const context = useContext(ReactFormContext);
  if (!context) {
    throw new Error('useFormStore must be used within a ReactFormProvider');
  }
  return context;
}
