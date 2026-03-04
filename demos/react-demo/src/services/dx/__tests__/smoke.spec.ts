import { describe, expect, it } from 'vitest';
import { processDx, getStaticChild } from './helpers';
import { _guiInputs } from '../shortcuts/inputs/guiInputs.impl';

describe('DX Pipeline — Smoke Test', () => {
  it('processes a simple input through the full pipeline', () => {
    const result = processDx(_guiInputs({ name: 'string' }));

    expect(result.kind).toBe('layout');
    expect(result.children?.length).toBeGreaterThan(0);

    const input = getStaticChild(result, 0);
    expect(input.kind).toBe('input');
    expect((input as { path?: string }).path).toBe('name');
  });
});
