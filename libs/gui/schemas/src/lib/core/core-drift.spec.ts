import { describe, expect, it } from 'vitest';
import {
  commonSchema as sourceCommonSchema,
  validatorsSchema as sourceValidatorsSchema,
} from '@golemui/schemas';
import vendoredCommonSchema from './common.schema.json';
import vendoredValidatorsSchema from './validators.schema.json';

// The vendored copies in this directory are generated verbatim from the
// @golemui/schemas sources by `npm run generate:schemas`. This spec fails when
// a source edit was not followed by regeneration.
describe('vendored core schemas stay identical to the @golemui/schemas sources', () => {
  it('common.schema.json matches the source', () => {
    expect(vendoredCommonSchema).toEqual(sourceCommonSchema);
  });

  it('validators.schema.json matches the source', () => {
    expect(vendoredValidatorsSchema).toEqual(sourceValidatorsSchema);
  });
});
