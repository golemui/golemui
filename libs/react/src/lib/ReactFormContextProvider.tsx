import type { FormContext, WithWidget } from '@golemui/core'
import { ReactFormContext } from './ReactFormContext';

export function ReactFormContextProvider({
  children,
  formContext,
}: {
  children: React.ReactNode;
  formContext: FormContext<React.ComponentType<WithWidget>>;
}) {
  return <ReactFormContext.Provider value={{ formContext }}>{children}</ReactFormContext.Provider>;
}
