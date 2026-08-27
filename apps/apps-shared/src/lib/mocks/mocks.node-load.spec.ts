import { describe, expect, it } from 'vitest';
// eslint-disable-next-line import/no-namespace -- the spec checks every exported mock
import * as mocks from './index';
import { type Example } from './types';

// This spec runs in the node environment, so any mock that touched a browser
// global while building its form definition would throw during this import.

const isExample = (value: unknown): value is Example =>
  typeof value === 'object' && value !== null && 'form' in value && 'resources' in value;

const examples = Object.entries(mocks).filter((entry): entry is [string, Example] =>
  isExample(entry[1]),
);

const collectKeys = (node: unknown, found: Set<string>) => {
  if (Array.isArray(node)) {
    node.forEach((item) => collectKeys(item, found));
    return;
  }
  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      found.add(key);
      collectKeys(value, found);
    }
  }
};

describe('mock form definitions load in plain node', () => {
  it('collects the example mocks', () => {
    expect(examples.length).toBeGreaterThanOrEqual(18);
  });

  it.each(examples)('%s exposes a plain form definition object', (_name, example) => {
    expect(typeof example.form).toBe('object');
    expect(example.form).not.toBeNull();
    expect(example.form).toHaveProperty('form');
  });

  it('kitchenSink resolves every tab chunk and no $ref remains', () => {
    const form = mocks.kitchenSink.form as unknown as Record<string, unknown>;
    const rootWidgets = form['form'] as Array<Record<string, unknown>>;
    const tabs = rootWidgets.find((widget) => widget['type'] === 'tabs');

    expect(tabs).toBeDefined();
    expect((tabs?.['children'] as unknown[]).length).toBe(36);

    const keys = new Set<string>();
    collectKeys(rootWidgets, keys);
    expect(keys.has('$ref')).toBe(false);
    // The resolver removes the editor-only $schema key from each chunk.
    expect(keys.has('$schema')).toBe(false);
  });
});
