import { createContext } from '@lit/context';

export const repeaterIndexTokenContext =
  createContext<RepeaterIndexTokenContext>('guiRepeaterIndexContext');

export class RepeaterIndexTokenContext {
  index = -1;
}
