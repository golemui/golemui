import { onScopeDispose, ref, type Ref } from 'vue';
import type { Observable } from 'rxjs';

/**
 * Bridges an RxJS Observable to a Vue `Ref`. Subscribes immediately and
 * unsubscribes when the current effect scope is disposed (e.g. component
 * unmount, watchEffect cleanup, or nested scope teardown).
 */
export function useObservable<T>(observable$: Observable<T>, initialValue: T): Ref<T> {
  const value = ref(initialValue) as Ref<T>;
  const sub = observable$.subscribe((next) => {
    value.value = next;
  });
  onScopeDispose(() => sub.unsubscribe());
  return value;
}
