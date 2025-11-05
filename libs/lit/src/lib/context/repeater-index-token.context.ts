import { createContext } from '@lit/context';

export const repeaterIndexTokenContext = createContext<RepeaterIndexTokenContext>('ffRepeaterIndexContext');

export class RepeaterIndexTokenContext {
  index = -1;
}
