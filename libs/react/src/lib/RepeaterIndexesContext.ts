import { createContext, useContext } from 'react';

export const RepeaterIndexesContext = createContext<number[]>([]);

export function useRepeaterIndexes() {
  return useContext(RepeaterIndexesContext);
}
