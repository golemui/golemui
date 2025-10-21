import * as Core from '@formforge/core';
import { ReactFormContext } from './ReactFormContext';

export function ReactFormContextProvider({
  children,
  formContext,
}: {
  children: React.ReactNode;
  formContext: Core.FormContext<React.ComponentType<Core.WithField>>;
}) {
  return <ReactFormContext.Provider value={{ formContext }}>{children}</ReactFormContext.Provider>;
}
