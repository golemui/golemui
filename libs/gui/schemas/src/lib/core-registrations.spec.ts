import { describe, expect, it } from 'vitest';
import { guiCoreRegistrations } from './core-registrations';
import { guiSchemaConfig } from './widget-manifest';
import vendoredCommonSchema from './core/common.schema.json';
import vendoredValidatorsSchema from './core/validators.schema.json';

describe('guiCoreRegistrations', () => {
  it('registers each vendored core schema under its gui-tree retrieval URI', () => {
    const keys = guiCoreRegistrations()
      .map((registration) => registration.key)
      .sort();
    expect(keys).toEqual([
      'https://golemui.com/schemas/gui/core/common.schema.json',
      'https://golemui.com/schemas/gui/core/validators.schema.json',
    ]);
  });

  // The base URL is hardcoded in core-registrations.ts, assert it matches the config.
  it('derives every retrieval URI from the schema config idBase', () => {
    for (const { key } of guiCoreRegistrations()) {
      expect(key.startsWith(`${guiSchemaConfig.idBase}core/`)).toBe(true);
    }
  });

  it('strips $id from the clones without mutating the vendored sources', () => {
    for (const { schema } of guiCoreRegistrations()) {
      expect('$id' in schema).toBe(false);
    }
    expect(vendoredCommonSchema.$id).toBe('https://golemui.com/schemas/core/common.schema.json');
    expect(vendoredValidatorsSchema.$id).toBe(
      'https://golemui.com/schemas/core/validators.schema.json',
    );
  });
});
