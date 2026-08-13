import {
  commonSchema,
  customSchema,
  formSchema,
  layoutWidgetSchema,
  rangesSchema,
  validatorsSchema,
  widgetsSchema,
  COMPONENT_SCHEMAS_BY_TYPE,
} from '@golemui/gui-schemas';

export type WidgetSchema = {
  $id: string;
  title?: string;
  properties?: Record<string, unknown>;
  [key: string]: unknown;
};

export const COMMON_SCHEMA = commonSchema as WidgetSchema;
export const FORM_SCHEMA = formSchema as WidgetSchema;
export const WIDGETS_SCHEMA = widgetsSchema as WidgetSchema;
export const LAYOUT_WIDGET_SCHEMA = layoutWidgetSchema as WidgetSchema;
export const VALIDATORS_SCHEMA = validatorsSchema as WidgetSchema;
export const RANGES_SCHEMA = rangesSchema as WidgetSchema;

/**
 * Fallback schema for custom components (any `type` not in COMPONENT_SCHEMAS, it has
 * no single `type` const). The `formWidget` oneOf refs it, so it must be registered.
 */
export const CUSTOM_SCHEMA = customSchema as WidgetSchema;

/**
 * Component schemas keyed by the widget `type` const, re-exported from the
 * generated `COMPONENT_SCHEMAS_BY_TYPE` map in `@golemui/gui-schemas`.
 */
export const COMPONENT_SCHEMAS: Record<string, WidgetSchema> =
  COMPONENT_SCHEMAS_BY_TYPE as unknown as Record<string, WidgetSchema>;

export const ALL_SCHEMAS: WidgetSchema[] = [
  COMMON_SCHEMA,
  VALIDATORS_SCHEMA,
  RANGES_SCHEMA,
  WIDGETS_SCHEMA,
  LAYOUT_WIDGET_SCHEMA,
  ...Object.values(COMPONENT_SCHEMAS),
  CUSTOM_SCHEMA,
  FORM_SCHEMA,
];
