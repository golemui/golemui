import type {
  FormPluginContext,
  InputWidget,
  JsonSchemaFragment,
  ValidatorSchema,
  WidgetValueSchema,
} from '@golemui/core';
import type { WebmcpOptions } from './types';

/** Where a field's value description came from. `fallback` means it was inferred here. */
export type ValueSchemaSource = 'fields' | 'widgetSet' | 'fallback';

export type ResolvedValueSchema = { value: WidgetValueSchema; source: ValueSchemaSource };

/** The JSON Schema type names a validator `type` can be taken as directly. */
const JSON_TYPES = new Set(['string', 'number', 'integer', 'boolean', 'array', 'object']);

/**
 * Describes one input widget's value: the plugin's `fields` option first, then the widget
 * set's resolver, then an inference from the validator and the current value. The inference
 * keeps the package usable without a widget set description, at the cost of precision.
 */
export function resolveValueSchema(
  widget: InputWidget<any, string>,
  currentValue: unknown,
  context: FormPluginContext,
  options: WebmcpOptions,
): ResolvedValueSchema {
  const fromOptions = options.fields?.[widget.type];
  if (fromOptions !== undefined) {
    const value = typeof fromOptions === 'function' ? fromOptions(widget) : fromOptions;
    if (value !== undefined) {
      return { value, source: 'fields' };
    }
  }

  const fromWidgetSet = context.valueSchemas?.valueSchema(widget);
  if (fromWidgetSet !== undefined) {
    return { value: fromWidgetSet, source: 'widgetSet' };
  }

  return { value: { schema: inferSchema(widget, currentValue, context) }, source: 'fallback' };
}

/**
 * Translates a widget's validator into JSON Schema keywords: through the widget set when it
 * knows the shape, else by reading a JSON-Schema-named `type` off the object. Function and
 * missing validators yield nothing.
 */
export function resolveValidatorSchema(
  validator: unknown,
  context: FormPluginContext,
): ValidatorSchema | undefined {
  if (validator === null || typeof validator !== 'object') {
    return undefined;
  }
  const fromWidgetSet = context.valueSchemas?.validatorSchema?.(validator);
  if (fromWidgetSet !== undefined) {
    return fromWidgetSet;
  }
  const record = validator as Record<string, unknown>;
  const type = record['type'];
  return {
    schema: typeof type === 'string' && JSON_TYPES.has(type) ? { type } : {},
    required: record['required'] === true,
  };
}

function inferSchema(
  widget: InputWidget<any, string>,
  currentValue: unknown,
  context: FormPluginContext,
): JsonSchemaFragment {
  const fromValidator = resolveValidatorSchema(widget.validator, context)?.schema;
  if (fromValidator !== undefined && typeof fromValidator['type'] === 'string') {
    return { type: fromValidator['type'] };
  }
  const sample = currentValue !== undefined ? currentValue : widget.defaultValue;
  switch (typeof sample) {
    case 'string':
    case 'number':
    case 'boolean':
      return { type: typeof sample };
    case 'object':
      if (sample === null) {
        return {};
      }
      return Array.isArray(sample) ? { type: 'array' } : { type: 'object' };
    default:
      return {};
  }
}
