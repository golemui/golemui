// Browser surface of the form-definition validator: `@golemui/gui-mcp/json/lazy`.
//
// Same results as `validateFormDefinition` from `@golemui/gui-mcp/json`, but each generated
// validator is its own module, loaded the first time a form needs it. A form with five widget
// types loads the validators of those five. Nothing here imports Node built-ins, the TypeScript
// compiler or the MCP SDK.

import {
  collectValidatorNeeds,
  loadValidators,
  preloadValidators,
} from './json/schemas/lazy-validators';
import { runValidation, type ValidateInput, type ValidateResult } from './json/validate-core';

export type { ValidateInput, ValidateResult } from './json/validate-core';
export type { FormattedError } from './json/errors';
export type { ExpressionFinding } from './shared/lint/reactive-expressions';
export type { InterpolationFinding } from './json/string-interpolation';

/**
 * Validates a GolemUI form definition, loading first the validators of the widget types,
 * validator types and custom widget kinds it contains.
 * @returns The same result as the synchronous `validateFormDefinition`.
 */
export async function validateFormDefinitionAsync(input: ValidateInput): Promise<ValidateResult> {
  const validators = await loadValidators(collectValidatorNeeds(input.formDefinition));
  return runValidation(input, validators);
}

/**
 * Starts loading the validators a form will most likely need, without validating: the root of
 * the form, every validator type and, when given, the validators of some widget types. Call it
 * when a form starts being written, so validating it later does not wait for the network.
 * @param widgetTypes - Widget `type` values to load as well. Unknown types are ignored.
 */
export function preload(widgetTypes?: readonly string[]): Promise<void> {
  return preloadValidators(widgetTypes);
}
