import * as Core from '@golemui/core';
import { createContext } from '@lit/context';

export const formContext = createContext<LitFormContext<any>>('ffFormContext');

export class LitFormContext<T extends Core.WithField> extends Core.FormContext<T> {
  // Just a subclass to make Core.FormContext Injectable
}
