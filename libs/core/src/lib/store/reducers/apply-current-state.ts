import { State } from '../model';

export const applyCurrentState = (state: State): State => {
  return { ...state };
};
