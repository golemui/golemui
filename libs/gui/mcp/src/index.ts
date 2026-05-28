import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  GENERATE_FROM_JSON_SCHEMA_TOOL,
  generateFromJsonSchema,
} from './tools/generate-from-json-schema';
import {
  GENERATE_FROM_OPENAPI_TOOL,
  generateFromOpenapi,
} from './tools/generate-from-openapi';
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
      const pkg = JSON.parse(readFileSync(candidate, 'utf-8')) as { name?: string; version?: string };
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
];

const server = new Server(
  { name: PKG_NAME, version: PKG_VERSION },
  { capabilities: { tools: {} } },
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
