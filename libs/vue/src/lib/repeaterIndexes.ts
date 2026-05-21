import { inject, type InjectionKey } from 'vue';

export const repeaterIndexesInjectionKey: InjectionKey<number[]> = Symbol(
  '@golemui/vue:repeaterIndexes',
);

export function useRepeaterIndexes(): number[] {
  return inject(repeaterIndexesInjectionKey, []);
}
