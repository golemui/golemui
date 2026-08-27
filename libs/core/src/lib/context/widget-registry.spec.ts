import { beforeEach, describe, expect, it, vi } from 'vitest';
import { preloadFormWidgets, WidgetRegistry } from './widget-registry';

type FakeComponent = { name: string };

const makeLoader = (component: FakeComponent) => vi.fn(() => Promise.resolve(component));

function clearWidgetRegistryCache() {
  WidgetRegistry['sharedCache'].clear();
  WidgetRegistry['resolvedCache'].clear();
}

describe('WidgetRegistry', () => {
  beforeEach(() => {
    clearWidgetRegistryCache();
  });

  it('calls the loader once and returns the component', async () => {
    const component = { name: 'TextWidget' };
    const loader = makeLoader(component);
    const registry = new WidgetRegistry<FakeComponent>();
    registry.setWidgetLoaders({ text: loader } as any);

    const result = await registry.loadWidget('text');

    expect(result).toBe(component);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('does not call the loader again on subsequent loads', async () => {
    const component = { name: 'TextWidget' };
    const loader = makeLoader(component);
    const registry = new WidgetRegistry<FakeComponent>();
    registry.setWidgetLoaders({ text: loader } as any);

    await registry.loadWidget('text');
    await registry.loadWidget('text');

    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent calls — loader called once, both resolve to the same value', async () => {
    const component = { name: 'TextWidget' };
    const loader = makeLoader(component);
    const registry = new WidgetRegistry<FakeComponent>();
    registry.setWidgetLoaders({ text: loader } as any);

    const [a, b] = await Promise.all([registry.loadWidget('text'), registry.loadWidget('text')]);

    expect(a).toBe(component);
    expect(b).toBe(component);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('shares the cache across instances that use the same loader function', async () => {
    const component = { name: 'TextWidget' };
    const loader = makeLoader(component);

    const r1 = new WidgetRegistry<FakeComponent>();
    r1.setWidgetLoaders({ text: loader } as any);
    const r2 = new WidgetRegistry<FakeComponent>();
    r2.setWidgetLoaders({ text: loader } as any);

    await r1.loadWidget('text');
    await r2.loadWidget('text');

    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('uses separate cache entries for different loader functions for the same widget type', async () => {
    const componentA = { name: 'DefaultText' };
    const componentB = { name: 'CustomText' };
    const loaderA = makeLoader(componentA);
    const loaderB = makeLoader(componentB);

    const r1 = new WidgetRegistry<FakeComponent>();
    r1.setWidgetLoaders({ text: loaderA } as any);
    const r2 = new WidgetRegistry<FakeComponent>();
    r2.setWidgetLoaders({ text: loaderB } as any);

    const resultA = await r1.loadWidget('text');
    const resultB = await r2.loadWidget('text');

    expect(resultA).toBe(componentA);
    expect(resultB).toBe(componentB);
    expect(loaderA).toHaveBeenCalledTimes(1);
    expect(loaderB).toHaveBeenCalledTimes(1);
  });

  it('evicts a rejected loader from the cache so the next call retries', async () => {
    const component = { name: 'TextWidget' };
    const loader = vi
      .fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce(component);

    const registry = new WidgetRegistry<FakeComponent>();
    registry.setWidgetLoaders({ text: loader } as any);

    await expect(registry.loadWidget('text')).rejects.toThrow('network error');
    const result = await registry.loadWidget('text');

    expect(result).toBe(component);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('clearCache allows a fresh load after being called', async () => {
    const component = { name: 'TextWidget' };
    const loader = makeLoader(component);
    const registry = new WidgetRegistry<FakeComponent>();
    registry.setWidgetLoaders({ text: loader } as any);

    await registry.loadWidget('text');
    clearWidgetRegistryCache();
    await registry.loadWidget('text');

    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('ready is false before setWidgetLoaders and true after', () => {
    const registry = new WidgetRegistry<FakeComponent>();
    expect(registry.ready).toBe(false);
    registry.setWidgetLoaders({ text: makeLoader({ name: 'T' }) } as any);
    expect(registry.ready).toBe(true);
  });

  describe('preloading', () => {
    it('getIfLoaded returns undefined before preloadWidgets, and the component after', async () => {
      const component = { name: 'TextWidget' };
      const registry = new WidgetRegistry<FakeComponent>();
      registry.setWidgetLoaders({ text: makeLoader(component) } as any);

      expect(registry.getIfLoaded('text')).toBeUndefined();
      await registry.preloadWidgets();
      expect(registry.getIfLoaded('text')).toBe(component);
    });

    it('getIfLoaded returns undefined for a widget type with no configured loader', () => {
      const registry = new WidgetRegistry<FakeComponent>();
      registry.setWidgetLoaders({ text: makeLoader({ name: 'T' }) } as any);

      expect(registry.getIfLoaded('unknown')).toBeUndefined();
    });

    it('preloadWidgets with a subset loads only the given types', async () => {
      const textLoader = makeLoader({ name: 'Text' });
      const numberLoader = makeLoader({ name: 'Number' });
      const registry = new WidgetRegistry<FakeComponent>();
      registry.setWidgetLoaders({ text: textLoader, number: numberLoader } as any);

      await registry.preloadWidgets(['text']);

      expect(registry.getIfLoaded('text')).toEqual({ name: 'Text' });
      expect(registry.getIfLoaded('number')).toBeUndefined();
      expect(numberLoader).not.toHaveBeenCalled();
    });

    it('a failed loader rejects preloadWidgets, stores nothing, and stays retryable', async () => {
      const component = { name: 'TextWidget' };
      const loader = vi
        .fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValueOnce(component);
      const registry = new WidgetRegistry<FakeComponent>();
      registry.setWidgetLoaders({ text: loader } as any);

      await expect(registry.preloadWidgets()).rejects.toThrow('network error');
      expect(registry.getIfLoaded('text')).toBeUndefined();

      await registry.preloadWidgets();
      expect(registry.getIfLoaded('text')).toBe(component);
    });

    it('preloading through one instance makes the component available to another instance with the same loader functions', async () => {
      const component = { name: 'TextWidget' };
      const loader = makeLoader(component);

      const first = new WidgetRegistry<FakeComponent>();
      first.setWidgetLoaders({ text: loader } as any);
      await first.preloadWidgets();

      const second = new WidgetRegistry<FakeComponent>();
      second.setWidgetLoaders({ text: loader } as any);

      expect(second.getIfLoaded('text')).toBe(component);
      expect(loader).toHaveBeenCalledTimes(1);
    });

    it('preloadFormWidgets loads every configured widget for registries created later', async () => {
      const textLoader = makeLoader({ name: 'Text' });
      const numberLoader = makeLoader({ name: 'Number' });
      const widgetLoaders = { text: textLoader, number: numberLoader } as any;

      await preloadFormWidgets({ widgetLoaders });

      const registry = new WidgetRegistry<FakeComponent>();
      registry.setWidgetLoaders(widgetLoaders);

      expect(registry.getIfLoaded('text')).toEqual({ name: 'Text' });
      expect(registry.getIfLoaded('number')).toEqual({ name: 'Number' });
    });
  });
});
