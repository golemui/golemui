import { inject, provide, type InjectionKey } from 'vue';
import type { VueFormContext } from './VueFormContext';

export const formContextInjectionKey: InjectionKey<VueFormContext> = Symbol(
  '@golemui/vue:formContext',
);

export function provideFormContext(formContext: VueFormContext) {
  provide(formContextInjectionKey, formContext);
}

export function useVueFormContext(): VueFormContext {
  const formContext = inject(formContextInjectionKey, null);
  if (!formContext) {
    throw new Error(
      'useVueFormContext must be called from a component rendered inside <FormComponent>',
    );
  }
  return formContext;
}
