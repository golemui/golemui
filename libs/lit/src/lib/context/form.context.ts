import * as Core from '@golemui/core';
import { createContext } from '@lit/context';

export const formContext = createContext<LitFormContext<any>>('guiFormContext');

export class LitFormContext<T extends Core.WithWidget> extends Core.FormContext<T> {
  // Just a subclass to make Core.FormContext Injectable
}
