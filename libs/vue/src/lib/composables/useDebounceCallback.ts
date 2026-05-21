import { onScopeDispose } from 'vue';

export function useDebounceCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  onScopeDispose(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(...args), delay);
  };
}
