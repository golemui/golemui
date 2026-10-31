import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { enableDevMode } from './dev-mode';
import { resolveItemRenderer } from './resolve-item-renderer';

const defaultRenderer = 'default';
const itemRenderers = { carItem: 'car' };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('resolveItemRenderer — dev mode OFF (default)', () => {
  it('returns the default renderer when the input names none', () => {
    expect(resolveItemRenderer(itemRenderers, undefined, defaultRenderer)).toBe('default');
  });

  it('returns the renderer the form registers under the name', () => {
    expect(resolveItemRenderer(itemRenderers, 'carItem', defaultRenderer)).toBe('car');
  });

  it('returns the default renderer for a name the form does not register, without a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(resolveItemRenderer(itemRenderers, 'carItme', defaultRenderer)).toBe('default');
    expect(resolveItemRenderer(undefined, 'carItem', defaultRenderer)).toBe('default');
    expect(warn).not.toHaveBeenCalled();
  });
});

// Dev mode cannot be turned off again, so these tests run last in this file.
describe('resolveItemRenderer — dev mode ON', () => {
  beforeAll(() => enableDevMode());

  it('warns once per missing name, with the registered renderers', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const renderers = { carItem: 'car', airportItem: 'airport' };

    resolveItemRenderer(renderers, 'carItme', defaultRenderer);
    resolveItemRenderer(renderers, 'carItme', defaultRenderer);

    expect(warn).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith(
      '[GolemUI] No item renderer "carItme" is registered, so its items render with the default ' +
        'renderer. Registered item renderers: "carItem", "airportItem".',
    );
  });

  it('says so when the form registers no renderers', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(resolveItemRenderer({}, 'carItem', defaultRenderer)).toBe('default');
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Registered item renderers: (none).'),
    );
  });

  it('does not warn for a registered renderer', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    resolveItemRenderer(itemRenderers, 'carItem', defaultRenderer);
    expect(warn).not.toHaveBeenCalled();
  });
});
