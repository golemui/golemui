/**
 * Per-widget validators that check a single widget against its own component schema, with
 * recursive content (`children`, `props.template`) loosened to permissive primitives.
 *
 * Why: the form schema's `oneOf` over every widget type means a single typo produces ~30 errors
 * - one per non-matching branch + a summary. By picking the *intended* branch from the widget's
 * actual `kind`/`type` data and validating ONLY against that branch's schema, we get clean,
 * actionable errors with no oneOf noise. Children/templates are validated separately by
 * recursing into them, again one widget at a time.
 *
 * The validators are generated at build time (see `validator-schemas.ts`) because Workers do not
 * allow the code generation that ajv does when it compiles a schema.
 */

import type { ValidateFunction } from 'ajv';
import {
  chunkRefValidator,
  CUSTOM_WIDGET_VALIDATORS,
  SHALLOW_WIDGET_VALIDATORS,
  VALIDATOR_BRANCH_VALIDATORS,
} from './generated/validators.js';

// An own-property check keeps keys such as `constructor` from resolving to a built-in of the table.
function lookupValidator(
  validators: Readonly<Record<string, ValidateFunction>>,
  key: string,
): ValidateFunction | null {
  return Object.prototype.hasOwnProperty.call(validators, key) ? (validators[key] ?? null) : null;
}

/** The validator `type` values that have a branch validator, in the order messages list them. */
export function getValidatorBranches(): readonly string[] {
  return Object.keys(VALIDATOR_BRANCH_VALIDATORS);
}

/**
 * Returns a validator that checks a GolemUI `validator` field against the branch corresponding
 * to its `type` value (e.g. `type: 'string'` selects the stringValidator branch). Returns null
 * if the validator's type isn't a known branch.
 */
export function getValidatorBranchValidator(validatorType: string): ValidateFunction | null {
  return lookupValidator(VALIDATOR_BRANCH_VALIDATORS, validatorType);
}

/**
 * Returns a validator for a chunk reference (`{ "$ref": "./x.form-chunk.json" }`), which the
 * `formWidget` oneOf accepts anywhere a widget can appear.
 */
export function getChunkRefValidator(): ValidateFunction {
  return chunkRefValidator;
}

/** The custom widget `kind` values that have a validator. */
export function getCustomWidgetKinds(): readonly string[] {
  return Object.keys(CUSTOM_WIDGET_VALIDATORS);
}

/**
 * Returns a validator that checks a custom widget against the `custom.schema.json` branch
 * matching its `kind`, with nested content loosened the same way {@link getShallowWidgetValidator}
 * loosens it. Returns null if the kind is not one of the four allowed values.
 */
export function getCustomWidgetValidator(kind: string): ValidateFunction | null {
  return lookupValidator(CUSTOM_WIDGET_VALIDATORS, kind);
}

/**
 * Returns a validator for the given widget type that checks the widget's own properties without
 * recursing into nested widgets. Returns null if the widget type is unknown.
 */
export function getShallowWidgetValidator(widgetType: string): ValidateFunction | null {
  return lookupValidator(SHALLOW_WIDGET_VALIDATORS, widgetType);
}
