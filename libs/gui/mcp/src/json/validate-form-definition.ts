import { SYNC_VALIDATORS } from './schemas/sync-validators';
import { runValidation, type ValidateInput, type ValidateResult } from './validate-core';

export type { ValidateInput, ValidateResult } from './validate-core';

/**
 * Validates a GolemUI form definition with every generated validator loaded up front. For
 * browsers, `validateFormDefinitionAsync` from `@golemui/gui-mcp/json/lazy` loads only the
 * validators the form needs and returns the same result.
 */
export function validateFormDefinition(input: ValidateInput): ValidateResult {
  return runValidation(input, SYNC_VALIDATORS);
}

export const JSON_VALIDATE_FORM_DEFINITION_TOOL = {
  name: 'json_validate_form_definition',
  description:
    'Validate a GolemUI form definition against the bundled JSON Schemas. Use this AFTER ' +
    'generating or modifying a form definition to guarantee it is correct before the user ' +
    'pastes it into their codebase. Returns `{ valid, errors, warnings, expressionWarnings, interpolationWarnings }`. ' +
    'Hard mistakes (typos in widget `type`, missing required props, invalid validator shapes) ' +
    'show up in `errors` and flip `valid` to false. A chunk reference (`{"$ref": "./x.form-chunk.json"}`) ' +
    'is a legal widget entry and is accepted anywhere a widget can appear, except as a repeater `template`, which ' +
    'must be a built-in layout (`accordion`, `flex`, `grid`, `tabs`); a widget where it is not allowed is an error ' +
    'with keyword `position`. Likely-custom widgets (a `type` value that ' +
    "isn't a built-in and isn't close to one) and semantic validator traps (a boolean validator " +
    'with only half of the `required: true` + `const: true` pair — it will not force a mandatory ' +
    "checkbox to be checked) show up in `warnings` instead — they don't " +
    'affect `valid`, but surface them and apply their `suggestion`. A custom widget still has to ' +
    'carry the fields its `kind` requires (`input` needs `path`, `layout` needs `children`), so a ' +
    'malformed one produces errors alongside its warning. Reactive expressions (`include.when`, `disabled.when`, etc.) are linted ' +
    'separately into `expressionWarnings`. String interpolation templates (`{{$form.x}}`, ' +
    '`{{$meta.y}}`, expressions like `{{$form.count + 1}}`, etc.) in widget props, and bare ' +
    'expressions inside i18n `params` objects, are linted into `interpolationWarnings`. ' +
    'An expression the form always rejects at runtime (one that writes into the data, calls a ' +
    'function other than `$fn.<name>`, `$log` and the allowed methods, or does not parse) is an ' +
    'error in `errors` instead, with keyword `reactiveExpression` or `stringInterpolation`, and flips `valid` to false.',
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
