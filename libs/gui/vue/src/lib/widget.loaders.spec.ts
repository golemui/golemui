import { preloadFormWidgets } from '@golemui/core';
import { describe, expect, it } from 'vitest';
import { widgetLoaders } from './widget.loaders';

describe('preloading the gui widget set outside a browser', () => {
  it('resolves every widget module in a plain node environment', async () => {
    await expect(preloadFormWidgets({ widgetLoaders })).resolves.toBeUndefined();
  });

  it('defines a loader function for every widget type', () => {
    const missing = Object.entries(widgetLoaders)
      .filter(([, loader]) => typeof loader !== 'function')
      .map(([type]) => type);

    expect(missing).toEqual([]);
  });
});
