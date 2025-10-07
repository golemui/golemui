import { createContext, useContext } from 'react';

export const RepeaterIndexContext = createContext<number | null>(null);

export function useRepeaterIndex() {
  const index = useContext(RepeaterIndexContext);
  if (index === null) {
    return -1;
  }
  return index;
}
