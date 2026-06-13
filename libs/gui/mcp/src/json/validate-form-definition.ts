import { getFormValidator } from './schemas/ajv';
import { formatAjvErrors, type FormattedError } from './errors';
import { lintReactiveExpressions, type ExpressionFinding } from '../shared/lint/reactive-expressions';
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

export function validateFormDefinition(input: ValidateInput): ValidateResult {
  const validate = getFormValidator();
  const ajvOk = validate(input.formDefinition) as boolean;
  const { errors, warnings } = formatAjvErrors(validate.errors, input.formDefinition);
  const expressionWarnings = lintReactiveExpressions(input.formDefinition);
  const interpolationWarnings = lintStringInterpolations(input.formDefinition);

  // Safety net: if ajv said the form is invalid but our collapser produced zero errors AND no
  // custom-widget warnings, something in the form definition is being rejected by the schema
  // that our targeted re-validation didn't surface (typically a widget type accepted in
  // isolation but not allowed at its position by the formWidget oneOf, or an obscure shape we
  // haven't accounted for). Surface a generic fallback so the caller has something to act on.
  if (!ajvOk && errors.length === 0 && warnings.length === 0) {
    errors.push({
      path: '/',
      keyword: 'oneOf',
      message:
        'Form failed schema validation but no specific error could be localized. The form may contain a widget at a position the form schema does not allow, or a structural shape that our targeted validator missed. Verify each widget against its `get_widget_spec` entry.',
    });
  }

  // `valid` follows hard errors only — custom-widget warnings don't fail validation.
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    expressionWarnings,
    interpolationWarnings,
  };
}

export const VALIDATE_FORM_DEFINITION_TOOL = {
  name: 'validate_form_definition',
  description:
    'Validate a GolemUI form definition against the bundled JSON Schemas. Use this AFTER ' +
    'generating or modifying a form definition to guarantee it is correct before the user ' +
    'pastes it into their codebase. Returns `{ valid, errors, warnings, expressionWarnings, interpolationWarnings }`. ' +
    'Hard mistakes (typos in widget `type`, missing required props, invalid validator shapes) ' +
    'show up in `errors` and flip `valid` to false. Likely-custom widgets (a `type` value that ' +
    "isn't a built-in and isn't close to one) show up in `warnings` instead — they don't " +
    'affect `valid`. Reactive expressions (`include.when`, `disabled.when`, etc.) are linted ' +
    'separately into `expressionWarnings`. String interpolation templates (`{{$form.x}}`, ' +
    '`{{$meta.y}}`, expressions like `{{$form.count + 1}}`, etc.) in widget props, and bare ' +
    'expressions inside i18n `params` objects, are linted into `interpolationWarnings`.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      formDefinition: {
        type: 'object' as const,
        additionalProperties: true,
        description:
          'The full GolemUI form definition object, shaped as `{ form: [...widgets], states?: {...} }`. ' +
          'Pass the JSON object, not a stringified version.',
      },
    },
    required: ['formDefinition'],
  },
} as const;
