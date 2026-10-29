// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebounceCallback } from './useDebounceCallback';

let debounced: (value: string) => void = () => undefined;

function DebounceProbe({ callback, delay }: { callback: (value: string) => void; delay: number }) {
  debounced = useDebounceCallback(callback, delay);
  return null;
}

let root: Root;
let container: HTMLDivElement;

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

beforeEach(() => {
  vi.useFakeTimers();
  container = document.createElement('div');
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  vi.useRealTimers();
});

describe('useDebounceCallback', () => {
  it('calls the callback once with the last arguments after the delay', () => {
    const callback = vi.fn();
    act(() => root.render(<DebounceProbe callback={callback} delay={300} />));

    debounced('a');
    vi.advanceTimersByTime(200);
    debounced('ab');
    vi.advanceTimersByTime(299);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('ab');
  });

  it('calls the callback of the last render when the timer ends', () => {
    const firstCallback = vi.fn();
    const secondCallback = vi.fn();
    act(() => root.render(<DebounceProbe callback={firstCallback} delay={300} />));

    debounced('a');
    act(() => root.render(<DebounceProbe callback={secondCallback} delay={300} />));
    vi.advanceTimersByTime(300);

    expect(firstCallback).not.toHaveBeenCalled();
    expect(secondCallback).toHaveBeenCalledWith('a');
  });
});
