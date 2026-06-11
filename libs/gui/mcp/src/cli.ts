import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import {
  GENERATE_FROM_JSON_SCHEMA_TOOL,
  generateFromJsonSchema,
} from './tools/generate-from-json-schema';
import { GENERATE_FROM_OPENAPI_TOOL, generateFromOpenapi } from './tools/generate-from-openapi';
import { CHECK_DX_CODE_TOOL, checkDxCode } from './tools/check-dx-code';
import { GET_DX_SPEC_TOOL, getDxSpec } from './tools/get-dx-spec';
import { LIST_DX_FACTORIES_TOOL, listDxFactoriesCatalog } from './tools/list-dx-factories';
import { resolveDxFramework } from './dx/dx-specs';
import { GET_CONCEPT_TOOL, getConcept } from './tools/get-concept';
import { GET_WIDGET_SPEC_TOOL, getWidgetSpec } from './tools/get-widget-spec';
import {
  VALIDATE_FORM_DEFINITION_TOOL,
  validateFormDefinition,
} from './tools/validate-form-definition';

/**
 * Resolve the server's name and version from package.json at runtime. Tried in order:
 *   1. `package.json` next to the bundle (the dist layout — what Nx release stamps versions onto).
 *   2. `../package.json` (running from source via tsx, e.g. tests).
 * Falls back to hard-coded defaults if neither exists, so the MCP handshake never fails.
 */
function readPackageMeta(): { name: string; version: string } {
  const here = dirname(fileURLToPath(import.meta.url));
  for (const candidate of [join(here, 'package.json'), join(here, '..', 'package.json')]) {
    try {
      const pkg = JSON.parse(readFileSync(candidate, 'utf-8')) as {
        name?: string;
        version?: string;
      };
      if (pkg.name && pkg.version) return { name: pkg.name, version: pkg.version };
    } catch {
      // try next
    }
  }
  return { name: '@golemui/gui-mcp', version: '0.0.0' };
}

const { name: PKG_NAME, version: PKG_VERSION } = readPackageMeta();

const TOOLS = [
  VALIDATE_FORM_DEFINITION_TOOL,
  GENERATE_FROM_JSON_SCHEMA_TOOL,
  GENERATE_FROM_OPENAPI_TOOL,
  GET_WIDGET_SPEC_TOOL,
  GET_CONCEPT_TOOL,
  LIST_DX_FACTORIES_TOOL,
  GET_DX_SPEC_TOOL,
  CHECK_DX_CODE_TOOL,
];

/**
 * High-level guidance handed to the client on connect (the MCP `initialize`
 * `instructions` field). Tools carry their own per-call descriptions; this
 * explains what the server is for and the order to use the tools in — above all
 * that every form definition must be validated before it reaches the user.
 */
const SERVER_INSTRUCTIONS =
  'This server builds and validates GolemUI form definitions — declarative, JSON-serializable ' +
  'forms shaped as `{ form: [...widgets], states?: {...} }`. Its job is to help you produce a form ' +
  'definition that is guaranteed correct before the user pastes it into their codebase.\n\n' +
  'Recommended workflow:\n' +
  '1. Starting from an existing schema? Use a generator — both return a pre-validated definition, ' +
  'so check the returned `unmapped` list and surface anything left over to the user. For a raw JSON ' +
  'Schema (e.g. an API request body), call `generate_from_json_schema`. For an OpenAPI 3.x spec, ' +
  'call `generate_from_openapi`: pass `operation` as "METHOD /path" (e.g. "POST /users") or an ' +
  'exact operationId, plus the spec as a parsed `document` or a `documentUrl` to fetch — it ' +
  "resolves the operation's request body, dereferences `$ref`s, and falls back to the " +
  "operation's parameters when there is no request body.\n" +
  '2. Building or editing by hand? Look up a single widget with `get_widget_spec` (its `kind`, ' +
  '`props`, and `validator` shape), and cross-cutting behavior that spans widgets — conditional ' +
  'rendering, per-state prop overrides — with `get_concept`.\n' +
  '3. ALWAYS finish by calling `validate_form_definition`. It checks the definition against the ' +
  'bundled JSON Schemas and returns `{ valid, errors, warnings, expressionWarnings }`. Treat ' +
  '`errors` as blocking: fix them and re-validate until `valid` is true. `warnings` (likely-custom ' +
  'widgets) and `expressionWarnings` (linted reactive expressions) are advisory — surface them, ' +
  'but they do not flip `valid`.\n\n' +
  'Writing GolemUI as DX code (the `gui.*` fluent builder in TypeScript) instead of a JSON ' +
  'definition? GolemUI is not in any model training data, so `gui.*` code is easy to fabricate — do ' +
  'NOT guess the API. FIRST call `list_dx_factories` once: it is the COMPLETE reference — every factory ' +
  'with its signature, a compile-verified example, and its gotchas, plus the cross-cutting patterns and ' +
  'common rules. Its imports + render snippet are tailored to your target framework (' +
  resolveDxFramework() +
  ') — use them verbatim; import `gui` ONLY from `@golemui/gui-shared`, never hand-write raw ' +
  '`{ kind, type, path }` widget JSON or cast to `any`. Keep it in context and write your whole form ' +
  'from it; it is self-sufficient for most ' +
  'forms. `get_dx_spec` is only a rare single-factory deep-dive — you usually will not need it, and you ' +
  'do NOT need `get_widget_spec` here (that is the JSON surface). Then ' +
  'ALWAYS finish by calling `check_dx_code` with the snippet — it type-checks against the real ' +
  '`@golemui` declarations and returns `{ ok, diagnostics }` (each with a fix `hint` for recognized ' +
  'mistakes). Treat `ok: false` as blocking: apply the fixes and re-check until `ok` is true. Use ' +
  '`check_dx_code` for `gui.*` *code* and `validate_form_definition` for a JSON *definition object* — ' +
  'they are not interchangeable.\n\n' +
  'Do not hand a form definition to the user until `validate_form_definition` reports `valid: true`.';

const server = new Server(
  { name: PKG_NAME, version: PKG_VERSION },
  { capabilities: { tools: {} }, instructions: SERVER_INSTRUCTIONS },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    switch (name) {
      case 'validate_form_definition':
        return ok(validateFormDefinition(args as any));
      case 'generate_from_json_schema':
        return ok(generateFromJsonSchema(args as any));
      case 'generate_from_openapi':
        return ok(await generateFromOpenapi(args as any));
      case 'get_widget_spec':
        return ok(getWidgetSpec(args as any));
      case 'get_concept':
        return ok(getConcept(args as any));
      case 'list_dx_factories':
        return ok(listDxFactoriesCatalog());
      case 'get_dx_spec':
        return ok(getDxSpec(args as any));
      case 'check_dx_code':
        return ok(await checkDxCode(args as any));
      default:
        return err(`Unknown tool: ${name}`);
    }
  } catch (e) {
    return err((e as Error).message);
  }
});

function ok(payload: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
  };
}

function err(message: string) {
  return {
    isError: true,
    content: [{ type: 'text' as const, text: message }],
  };
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // The MCP SDK writes a friendly startup line to stderr; stdout is reserved for the JSON-RPC stream.
  process.stderr.write(`${PKG_NAME} v${PKG_VERSION} ready on stdio\n`);
}

main().catch((e) => {
  process.stderr.write(`${PKG_NAME} failed to start: ${(e as Error).stack ?? e}\n`);
  process.exit(1);
});
