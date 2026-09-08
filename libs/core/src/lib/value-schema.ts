import { type InputWidget } from './form-widget';
import { type Localizable } from './i18n';

/**
 * A JSON Schema (draft 2020-12 subset) fragment.
 *
 * Opaque to the core: it never reads one, it only routes them from the widget set that
 * declares them to the plugins that describe the form to the outside (see `plugins` in
 * `FormInitConfig`).
 */
export type JsonSchemaFragment = Record<string, unknown>;

/**
 * How a widget set describes the value one of its input widgets holds.
 */
export type WidgetValueSchema = {
  /** JSON Schema of the value. */
  schema: JsonSchemaFragment;
  /**
   * Human text about the value beyond the widget's label (a hint, a placeholder). Left
   * untranslated: the consumer resolves it with the form's translator.
   */
  description?: Localizable;
  /**
   * False when a host service produces the value (an upload widget's envelope, for example)
   * and it therefore cannot be written programmatically. Defaults to true.
   */
  writable?: boolean;
  /** True for values that must never be echoed back to a caller (a password). Defaults to false. */
  sensitive?: boolean;
  /**
   * The closed set of values the widget accepts, when it has one (a select, a radiogroup, a
   * dropdown, a list, and their multi-value variants), already normalized to label/value pairs.
   */
  choices?: { label: string; value: unknown }[];
};

/**
 * JSON Schema keywords derived from a widget's validator, plus whether the validator marks the
 * value as required. `required` travels separately because JSON Schema expresses it on the
 * parent object, not on the property.
 */
export type ValidatorSchema = { schema: JsonSchemaFragment; required?: boolean };

/**
 * The contract a widget set fulfils to describe its values. The core never calls it: widget set
 * packages supply an implementation through their form component factory, the core stores it
 * on the form context, and plugins read it from their {@link FormPluginContext}.
 *
 * Both methods return `undefined` for a shape the widget set does not know (a custom widget
 * type, a foreign validator object), so a consumer can fall back to its own inference.
 */
export interface ValueSchemaResolver {
  /** Describes the value an input widget holds. */
  valueSchema(widget: InputWidget<any, string>): WidgetValueSchema | undefined;
  /** Translates a widget's validator object into JSON Schema keywords. */
  validatorSchema?(validator: unknown): ValidatorSchema | undefined;
}
