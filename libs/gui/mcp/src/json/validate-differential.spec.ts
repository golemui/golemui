import { describe, expect, it } from 'vitest';
import { buildMutationCorpus } from '../../tools/testing/mutation-corpus';
import { rootValidator } from './schemas/generated/sync.js';
import {
  formValidator,
  formValidatorFirstError,
} from './schemas/generated/testing/form-validator.js';
import { validateFormDefinition } from './validate-form-definition';

// `validateFormDefinition` no longer runs the whole-form validator: the root validator and the
// per-widget walk (with its position rules) are the only source of truth. This test keeps the
// whole-form validator, generated for tests only, and checks on the goldens and on thousands of
// mutations of them that the walk misses nothing it rejects.
const LINT_KEYWORDS = new Set(['reactiveExpression', 'stringInterpolation', 'duplicateUid']);

const corpus = Object.entries(buildMutationCorpus());

function withoutWidgets(formDefinition: unknown): unknown {
  if (typeof formDefinition !== 'object' || formDefinition === null) return formDefinition;
  const form = (formDefinition as { form?: unknown }).form;
  return Array.isArray(form) ? { ...formDefinition, form: [] } : formDefinition;
}

describe('validateFormDefinition against the whole-form validator', () => {
  it('builds a corpus that reaches every family of errors', () => {
    expect(corpus.length).toBeGreaterThan(3000);
  });

  it('reports a schema error for every form the whole-form validator rejects', () => {
    const missed: string[] = [];
    for (const [name, formDefinition] of corpus) {
      if (formValidatorFirstError(formDefinition)) continue;
      const { valid, errors } = validateFormDefinition({ formDefinition });
      const schemaErrors = errors.filter((error) => !LINT_KEYWORDS.has(error.keyword));
      if (valid || schemaErrors.length === 0) missed.push(name);
    }
    // A name here is a form the walk accepts and the schema rejects: a missing position rule,
    // or a constraint the shallow schemas loosened without the walk checking it.
    expect(missed).toEqual([]);
  });

  it('reports the same errors outside the widgets as the whole-form validator', () => {
    // The widgets of `form` cannot change the errors outside them, so the whole-form validator
    // runs without them (it is exponential in the depth of the layouts).
    for (const [name, formDefinition] of corpus) {
      formValidator(withoutWidgets(formDefinition));
      rootValidator(formDefinition);
      const strip = (errors: typeof rootValidator.errors) =>
        (errors ?? []).map(({ instancePath, keyword, params, message }) => ({
          instancePath,
          keyword,
          params,
          message,
        }));
      expect(strip(rootValidator.errors), name).toEqual(strip(formValidator.errors));
    }
  });
});
