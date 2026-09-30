// Entry point of the `@golemui/schemas/json-schema` subpath: converts a JSON Schema into a
// GolemUI form definition. It also runs in browsers and Workers, so nothing it imports may
// use `node:*`.
export type {
  BuildContext,
  BuildResult,
  ConvertOptions,
  ConvertResult,
  DeclarativeRule,
  Diagnostic,
  DiagnosticInput,
  DiagnosticSeverity,
  EnumOption,
  FormDefinitionJson,
  FormWidgetJson,
  GroupOptions,
  JsonSchema,
  JsonType,
  JsonValue,
  Localizable,
  MatchOperator,
  Preset,
  Rule,
  SchemaNode,
  WidgetBuilder,
  WidgetPatch,
} from './lib/json-schema/types.js';
