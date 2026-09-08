import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveModelContext, ToolRegistry } from './model-context';
import { createFakeModelContext } from './spec-support/harness';
import type { ModelContextTool } from './types';

const tool = (name: string): ModelContextTool => ({
  name,
  description: `${name} tool`,
  inputSchema: { type: 'object' },
  execute: async () => ({ status: 'read' }),
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('resolveModelContext', () => {
  it('is undefined where there is no document (server runtimes)', () => {
    expect(typeof document).toBe('undefined');
    expect(resolveModelContext()).toBeUndefined();
  });

  it('is undefined in a browser without WebMCP', () => {
    vi.stubGlobal('document', {});
    vi.stubGlobal('navigator', { language: 'en-US' });
    expect(resolveModelContext()).toBeUndefined();
  });

  it('prefers document.modelContext', () => {
    const onDocument = createFakeModelContext();
    const onNavigator = createFakeModelContext();
    vi.stubGlobal('document', { modelContext: onDocument });
    vi.stubGlobal('navigator', { modelContext: onNavigator });
    expect(resolveModelContext()).toBe(onDocument);
  });

  it('falls back to the deprecated navigator.modelContext', () => {
    const onNavigator = createFakeModelContext();
    vi.stubGlobal('document', {});
    vi.stubGlobal('navigator', { modelContext: onNavigator });
    expect(resolveModelContext()).toBe(onNavigator);
  });
});

describe('ToolRegistry', () => {
  it('registers a set with one shared abort signal and unregisters it by aborting', async () => {
    const fake = createFakeModelContext();
    const registry = new ToolRegistry(fake, ['https://agent.example']);

    registry.replace([tool('a-fill'), tool('a-submit')]);
    await registry.settled();

    expect([...fake.tools.keys()]).toEqual(['a-fill', 'a-submit']);
    const [first, second] = fake.history;
    expect(first.options?.signal).toBe(second.options?.signal);
    expect(first.options?.signal?.aborted).toBe(false);
    expect(first.options?.exposedTo).toEqual(['https://agent.example']);

    registry.release();
    await registry.settled();
    expect(first.options?.signal?.aborted).toBe(true);
    expect(fake.tools.size).toBe(0);
  });

  it('replaces a set with a fresh signal, so the new registrations are never pre-aborted', async () => {
    const fake = createFakeModelContext();
    const registry = new ToolRegistry(fake, undefined);

    registry.replace([tool('a-fill')]);
    await registry.settled();
    registry.replace([tool('a-fill'), tool('a-read')]);
    await registry.settled();

    expect([...fake.tools.keys()].sort()).toEqual(['a-fill', 'a-read']);
    expect(fake.history).toHaveLength(3);
    expect(fake.history[0].options?.signal?.aborted).toBe(true);
    expect(fake.history[1].options?.signal?.aborted).toBe(false);
    expect(fake.history[1].options?.signal).not.toBe(fake.history[0].options?.signal);
    expect(fake.history[2].options?.signal).toBe(fake.history[1].options?.signal);
  });

  it('skips a set that was replaced before its registration ran', async () => {
    const fake = createFakeModelContext();
    const registry = new ToolRegistry(fake, undefined);

    registry.replace([tool('a-fill')]);
    registry.replace([tool('a-read')]);
    await registry.settled();

    expect([...fake.tools.keys()]).toEqual(['a-read']);
    expect(fake.history).toHaveLength(1);
  });

  it('calls unregisterTool on previews that ignore the signal', async () => {
    const fake = createFakeModelContext({ legacy: true });
    const unregister = vi.spyOn(fake, 'unregisterTool');
    const registry = new ToolRegistry(fake, undefined);

    registry.replace([tool('a-fill')]);
    await registry.settled();
    expect(fake.tools.size).toBe(1);

    registry.release();
    await registry.settled();
    expect(unregister).toHaveBeenCalledWith('a-fill');
    expect(fake.tools.size).toBe(0);
  });

  it('reports a rejected registration and still registers the others', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fake = createFakeModelContext({ rejectNames: ['a-fill'] });
    const registry = new ToolRegistry(fake, undefined);

    registry.replace([tool('a-fill'), tool('a-submit')]);
    await registry.settled();

    expect([...fake.tools.keys()]).toEqual(['a-submit']);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('a-fill');
  });

  it('is safe to release when nothing is registered', () => {
    const registry = new ToolRegistry(createFakeModelContext(), undefined);
    expect(() => registry.release()).not.toThrow();
  });
});
