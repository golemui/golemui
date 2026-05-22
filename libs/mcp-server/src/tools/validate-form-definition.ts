import { getFormValidator } from '../schemas/ajv';
import { formatAjvErrors, type FormattedError } from '../utils/errors';
import { lintReactiveExpressions, type ExpressionFinding } from '../lint/reactive-expressions';

export type ValidateInput = {
  formDefinition: unknown;
};

export type ValidateResult = {
  valid: boolean;
  errors: FormattedError[];
  expressionWarnings: ExpressionFinding[];
};

export function validateFormDefinition(input: ValidateInput): ValidateResult {
  const validate = getFormValidator();
  const valid = validate(input.formDefinition) as boolean;
  const errors = formatAjvErrors(validate.errors, input.formDefinition);
  const expressionWarnings = lintReactiveExpressions(input.formDefinition);

  // Safety net: if ajv said the form is invalid but our collapser produced zero errors, the
  // form definition has something the schema rejects that our targeted re-validation didn't
  // surface (typically a widget type accepted in isolation but not allowed at its position by
  // the formWidget oneOf, or an obscure shape we haven't accounted for). Returning `valid:false`
  // with no errors gives the caller nothing to act on, so emit a generic fallback pointing at
  // the form root.
  if (!valid && errors.length === 0) {
    errors.push({
      path: '/',
      keyword: 'oneOf',
      message:
        'Form failed schema validation but no specific error could be localized. The form may contain a widget at a position the form schema does not allow, or a structural shape that our targeted validator missed. Verify each widget against its `get_widget_spec` entry.',
    });
  }

  return {
    valid: valid && errors.length === 0,
    errors,
    expressionWarnings,
  };
}

export const VALIDATE_FORM_DEFINITION_TOOL = {
  name: 'validate_form_definition',
  description:
    'Validate a GolemUI form definition against the bundled JSON Schemas. Use this AFTER ' +
    'generating or modifying a form definition to guarantee it is correct before the user ' +
    'pastes it into their codebase. Returns either { valid: true } or a structured list of ' +
    'errors with JSON Pointer paths and concrete fix suggestions. Also lints reactive ' +
    'expressions (`include.when`, `disabled.when`, etc.) for common mistakes.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      formDefinition: {
        description:
          'The full GolemUI form definition object, shaped as `{ form: [...widgets], states?: {...} }`. ' +
          'Pass the JSON object, not a stringified version.',
      },
    },
    required: ['formDefinition'],
  },
} as const;
