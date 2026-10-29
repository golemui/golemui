import { effectScope } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebounceCallback } from './useDebounceCallback';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useDebounceCallback', () => {
  it('calls the callback once with the last arguments after the delay', () => {
    const callback = vi.fn();
    const scope = effectScope();
    const debounced = scope.run(() => useDebounceCallback(callback, 300));

    debounced?.('a');
    vi.advanceTimersByTime(200);
    debounced?.('ab');
    vi.advanceTimersByTime(299);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('ab');
    scope.stop();
  });

  it('does not call the callback when its scope is disposed before the delay ends', () => {
    const callback = vi.fn();
    const scope = effectScope();
    const debounced = scope.run(() => useDebounceCallback(callback, 300));

    debounced?.('a');
    vi.advanceTimersByTime(100);
    scope.stop();
    vi.advanceTimersByTime(300);

    expect(callback).not.toHaveBeenCalled();
  });
});
