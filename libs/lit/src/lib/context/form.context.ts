import { FormContext, type WithWidget } from '@golemui/core'
import { createContext } from '@lit/context';

export const formContext = createContext<LitFormContext<any>>('guiFormContext');

export class LitFormContext<T extends WithWidget> extends FormContext<T> {
  // Just a subclass to make Core.FormContext Injectable
}
