import { describe, expect, it } from 'vitest';
import {
  BUDGETS,
  formatValidatorSizeReport,
  measureValidatorSizes,
  type ValidatorSizeReport,
} from '../../tools/validator-size';

// What the validator weighs in a browser, bundled from source with esbuild (minified). Print the
// numbers with `tools/report-validator-size.ts`.
describe('form-definition validator size', () => {
  let report: ValidatorSizeReport;

  beforeAll(async () => {
    report = await measureValidatorSizes();
    console.info(formatValidatorSizeReport(report));
  });

  it('loads at most 50 KB gzipped to validate a typical form with the lazy entry', () => {
    expect(report.lazy.referenceFormGzipBytes).toBeLessThanOrEqual(
      BUDGETS.lazyReferenceFormGzipBytes,
    );
  });

  // A validator over this size has most likely started to pull in the whole widget union, as the
  // repeater did through its `template.<state>` keys.
  it('keeps every validator module under 300 KB minified', () => {
    expect(report.lazy.largestValidator.minifiedBytes).toBeLessThanOrEqual(
      BUDGETS.largestValidatorMinifiedBytes,
    );
  });

  it('keeps the synchronous validator under 2.6 MB minified', () => {
    expect(report.sync.validator.minifiedBytes).toBeLessThanOrEqual(
      BUDGETS.syncValidatorMinifiedBytes,
    );
  });

  it('generates no code that compiles strings or calls require', () => {
    expect(report.codeGenerationViolations).toEqual([]);
  });
});
