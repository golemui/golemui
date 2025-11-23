import * as Core from '@golemui/core';
import { ReactFormContext } from './ReactFormContext';

export function ReactFormContextProvider({
  children,
  formContext,
}: {
  children: React.ReactNode;
  formContext: Core.FormContext<React.ComponentType<Core.WithField>>;
}) {
  console.log(`<ReactFormContext.Provider> created with value ${JSON.stringify(formContext)}`);
  return <ReactFormContext.Provider value={{ formContext }}>{children}</ReactFormContext.Provider>;
}
