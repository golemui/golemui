/**
 * Public types of the `@golemui/schemas/json-schema` entry: a converter from a JSON Schema (the
 * shape of the form data) to a GolemUI form definition.
 *
 * The converter runs in browsers and Workers too, so these types describe plain JSON and never
 * reference `@golemui/core`. The widget-set-specific part lives in a {@link Preset}.
 */

/** A JSON value, as found in a JSON Schema or in a form definition. */
export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * A JSON Schema object. Keywords are read when needed, so draft-07, 2019-09, 2020-12 and
 * OpenAPI 3.x schema objects all fit.
 */
export type JsonSchema = { [keyword: string]: unknown };

/** The JSON Schema types a node can resolve to. */
export type JsonType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null';

/** A text that is either literal or an i18n key, the JSON form of core's `Localizable`. */
export type Localizable =
  | string
  | { key: string; default?: string; params?: Record<string, unknown> };

/**
 * A widget of the produced form definition, as plain JSON. Keys that are not listed here are
 * allowed, for example `validator`, `defaultValue` or state-suffixed keys like `validator.us`.
 */
export type FormWidgetJson = {
  kind: 'input' | 'layout' | 'display' | 'action';
  type: string;
  uid?: string;
  path?: string;
  label?: Localizable;
  props?: Record<string, unknown>;
  children?: FormWidgetJson[];
  include?: { when: string } | { in: string[] };
  [key: string]: unknown;
};

/** A form definition as plain JSON, ready to pass as `formDef` or to write to a file. */
export type FormDefinitionJson = {
  $schema?: string;
  /** State name to reactive expression, e.g. `{ if01: '$form.country === "US"' }`. */
  states?: Record<string, string>;
  form: FormWidgetJson[];
};

/**
 * One node of the input schema, as rules and builders see it.
 *
 * @example
 * // The `quantity` property of the items of a `lines` array:
 * // { path: 'lines.items.quantity', name: 'quantity', type: 'integer', repeaterDepth: 1, ... }
 */
export interface SchemaNode {
  /** The node schema after `$ref` resolution, `allOf` merge and nullable unwrap. */
  readonly schema: JsonSchema;
  /** The node type, when the schema has exactly one type besides `null`. */
  readonly type?: JsonType;
  /** True when the schema also allows `null`. */
  readonly nullable: boolean;
  /**
   * The form data path, `''` for the root. Array items use the `items` token that repeater
   * templates expect, e.g. `lines.items.quantity`.
   */
  readonly path: string;
  /** The property name. Undefined for the root and for array items. */
  readonly name?: string;
  /** The name of the `$defs`, `definitions` or `components/schemas` entry the node came from. */
  readonly defName?: string;
  /** JSON pointer to the node in the input schema, e.g. `/properties/lines/items`. */
  readonly pointer: string;
  /** True when the parent object always requires this property. */
  readonly required: boolean;
  /** How many array items the node is inside, e.g. 1 for `lines.items.quantity`. */
  readonly repeaterDepth: number;
  /** The value of the vendor keyword (`x-golemui` by default) on this node, when present. */
  readonly hint?: WidgetPatch;
  /** The parent node. Undefined for the root. */
  readonly parent?: SchemaNode;
}

/**
 * Widget fields that a customization layer sets. A layer that names a `widget` chooses the
 * builder. The other fields are merged onto the built widget, `props` key by key.
 */
export type WidgetPatch = {
  /** The widget `type` to build, e.g. `textarea`. The preset must know it. */
  widget?: string;
  label?: Localizable;
  props?: Record<string, unknown>;
  validator?: Record<string, unknown>;
  defaultValue?: JsonValue;
  readonly?: boolean;
  /** Width in the 12-column grid of the parent layout. */
  size?: number;
  uid?: string;
  /** Leaves the node, and everything below it, out of the form. */
  skip?: boolean;
  /** Property order of an object node. `'*'` stands for every property not listed. */
  order?: string[];
};

/**
 * What a builder returns: one widget, several widgets, `null` to render nothing, or `undefined`
 * to decline, so the next matching rule builds the node.
 */
export type BuildResult = FormWidgetJson | FormWidgetJson[] | null | undefined;

/** A predicate rule. The first rule whose `when` returns true builds the node. */
export interface Rule {
  /** Shown in diagnostics. */
  name?: string;
  when(node: SchemaNode): boolean;
  build(node: SchemaNode, context: BuildContext): BuildResult;
}

/**
 * An operator in a {@link DeclarativeRule} match: the value is one of a list, the keyword is
 * present or absent, or the value matches a regular expression.
 */
export type MatchOperator = { $in: JsonValue[] } | { $exists: boolean } | { $regex: string };

/**
 * A rule that is plain JSON, so it can live in a config file or come from an MCP tool call.
 *
 * `match` keys are schema keywords, compared by deep equality or with a {@link MatchOperator}.
 * These keys match node fields instead: `$type`, `$path` (a glob, `*` is one segment and `**`
 * any number), `$name`, `$defName`, `$required` and `$inRepeater`.
 *
 * @example
 * const emailRule: DeclarativeRule = {
 *   match: { $type: 'string', format: 'email' },
 *   widget: 'textinput',
 *   props: { icon: 'mail' },
 * };
 */
export interface DeclarativeRule extends WidgetPatch {
  /** Shown in diagnostics. */
  name?: string;
  match: { [key: string]: JsonValue | MatchOperator };
}

/** What builders get besides the node. */
export interface BuildContext {
  /** Builds the node with the next matching rule, so a rule can change one detail of the default. */
  next(node?: SchemaNode): BuildResult;
  /** Builds any node with every layer, e.g. a child node. */
  build(node: SchemaNode): BuildResult;
  /**
   * The child nodes in render order: the properties of an object node, or the positions of a
   * tuple node (`prefixItems`), with paths like `point.0`.
   */
  children(node: SchemaNode): SchemaNode[];
  /** Builds {@link BuildContext.children}, compiled conditionals included. */
  buildChildren(node: SchemaNode): FormWidgetJson[];
  /** The item node of an array node, with the path `<array path>.items`. */
  item(node: SchemaNode): SchemaNode | undefined;
  /** The widget label: the schema `title`, otherwise the property name in readable form. */
  label(node: SchemaNode): Localizable | undefined;
  /** The widget-set validator for the node, from {@link Preset.validator}. */
  validator(node: SchemaNode): Record<string, unknown> | undefined;
  /** The options of an `enum` node, or of a `oneOf`/`anyOf` node made of `const` values. */
  enumOptions(node: SchemaNode): EnumOption[] | undefined;
  /** Reports something the converter could not express exactly. */
  diagnostic(diagnostic: DiagnosticInput): void;
}

/** One option of an enumeration. */
export type EnumOption = { label: Localizable; value: string | number | boolean | null };

/** Options of {@link Preset.group}. */
export type GroupOptions = {
  /** Set for conditional branches. Without it, the form assigns a position uid. */
  uid?: string;
  /** Visibility condition, for conditional branches. */
  include?: { when: string };
  /** The object title, when the preset renders one. */
  title?: Localizable;
};

/** Builds one widget type for a node. */
export type WidgetBuilder = (node: SchemaNode, context: BuildContext) => FormWidgetJson;

/**
 * The widget-set-specific part of the converter. A widget set ships one, e.g. the gui preset in
 * `@golemui/gui-schemas/json-schema`.
 */
export interface Preset {
  /** Shown in diagnostics. */
  name: string;
  /** The default rules, checked after the user rules. */
  rules: Rule[];
  /** Builders by widget type, used when a layer names a `widget`. */
  widgets: Record<string, WidgetBuilder>;
  /** The widget-set validator for a node, `undefined` when there is nothing to validate. */
  validator(node: SchemaNode): Record<string, unknown> | undefined;
  /** Wraps widgets in a layout, for object groups and conditional branches. */
  group(children: FormWidgetJson[], options: GroupOptions): FormWidgetJson;
  /** Builds the top-level widget list, e.g. adds a submit button. */
  root(children: FormWidgetJson[]): FormWidgetJson[];
  /** Written to `$schema` of the form definition. */
  schemaUrl?: string;
}

/** Options of the converter. */
export interface ConvertOptions {
  preset: Preset;
  /** User rules, predicate and declarative in one list, checked in order before the preset rules. */
  rules?: (Rule | DeclarativeRule)[];
  /**
   * Patches by form data path (`''` for the root, `lines.items.quantity` inside arrays) or by
   * definition name (`$defs/Address`). A path override wins over a definition name override.
   */
  overrides?: Record<string, WidgetPatch>;
  /** The document `$ref` pointers resolve against, e.g. an OpenAPI document. Defaults to the schema. */
  refRoot?: JsonSchema;
  /** The vendor keyword read from the schema, or `false` to ignore hints. Defaults to `x-golemui`. */
  vendorKeyword?: string | false;
  /** How many times a `$ref` may repeat on one branch before recursion stops. Defaults to 2. */
  maxRefDepth?: number;
  /** Stops the conversion after this many nodes. Defaults to 2000. */
  maxNodes?: number;
  /** Last change to the produced form definition. */
  transform?(definition: FormDefinitionJson): FormDefinitionJson;
}

/** What the converter returns. It never throws because of the schema shape. */
export interface ConvertResult {
  formDefinition: FormDefinitionJson;
  diagnostics: Diagnostic[];
}

/**
 * How a diagnostic affects the form: `error` means the node is not rendered, `warning` means it
 * is rendered in an approximate way, `info` is a note.
 */
export type DiagnosticSeverity = 'error' | 'warning' | 'info';

/** Something the converter could not express exactly. */
export interface Diagnostic {
  severity: DiagnosticSeverity;
  /** A stable identifier, e.g. `recursive-ref`. */
  code: string;
  message: string;
  /** The form data path of the node. */
  path: string;
  /** JSON pointer to the node in the input schema. */
  pointer: string;
}

/** A diagnostic as a builder reports it. `path` and `pointer` default to the current node. */
export type DiagnosticInput = Omit<Diagnostic, 'path' | 'pointer'> &
  Partial<Pick<Diagnostic, 'path' | 'pointer'>>;
