import { collectFormErrors, type FormattedError } from './errors';
import type { ValidatorLookup } from './schemas/validator-lookup';
import {
  lintReactiveExpressions,
  type ExpressionFinding,
} from '../shared/lint/reactive-expressions';
import { lintBooleanValidators } from '../shared/lint/boolean-validator';
import { lintStringInterpolations, type InterpolationFinding } from './string-interpolation';

export type ValidateInput = {
  formDefinition: unknown;
};

export type ValidateResult = {
  valid: boolean;
  errors: FormattedError[];
  warnings: FormattedError[];
  expressionWarnings: ExpressionFinding[];
  interpolationWarnings: InterpolationFinding[];
};

/**
 * The validation shared by the synchronous and the lazy entries: the schema errors of the walk,
 * then the lints the schema cannot express. Only where the validators come from differs.
 */
export function runValidation(input: ValidateInput, validators: ValidatorLookup): ValidateResult {
  const { errors, warnings } = collectFormErrors(input.formDefinition, validators);
  const expressionFindings = lintReactiveExpressions(input.formDefinition);
  const interpolationFindings = lintStringInterpolations(input.formDefinition);

  // Semantic lint the schema cannot express: a boolean validator with only half of the
  // `required: true` + `const: true` pair validates something the author almost never
  // means (the mandatory-checkbox trap).
  const booleanValidatorWarnings = lintBooleanValidators(input.formDefinition).map<FormattedError>(
    (f) => ({
      path: f.path,
      message: f.message,
      suggestion: f.suggestion,
      keyword: 'booleanValidator',
    }),
  );

  // The form rejects these expressions at runtime with an errored formHealth, so they are hard
  // errors here, after the schema errors.
  for (const finding of expressionFindings.filter((f) => f.failsAtRuntime === true)) {
    errors.push({
      path: finding.path,
      message: finding.message,
      suggestion: finding.suggestion,
      keyword: 'reactiveExpression',
      params: { expression: finding.expression },
    });
  }
  for (const finding of interpolationFindings.filter((f) => f.failsAtRuntime === true)) {
    errors.push({
      path: finding.path,
      message: finding.message,
      suggestion: finding.suggestion,
      keyword: 'stringInterpolation',
      params: { expression: finding.slot },
    });
  }

  // `valid` follows hard errors only — custom-widget warnings don't fail validation.
  return {
    valid: errors.length === 0,
    errors,
    warnings: [...warnings, ...booleanValidatorWarnings],
    expressionWarnings: expressionFindings.filter((f) => f.failsAtRuntime !== true),
    interpolationWarnings: interpolationFindings.filter((f) => f.failsAtRuntime !== true),
  };
}
