import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { DX_INSTRUCTIONS } from './dx/instructions';
import { dxTools } from './dx/tools';
import { JSON_INSTRUCTIONS } from './json/instructions';
import { jsonTools } from './json/tools';
import { err, ok, type ToolEntry } from './shared/tool';
import { sharedTools } from './shared/tools';

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

/**
 * Every MCP tool the server exposes, assembled from the two authoring paths plus the
 * shared reference tools. The order is the catalog order clients see in `tools/list`
 * (JSON surface, then the shared `get_concept`, then the `gui.*` DX surface). Dispatch is
 * by name via {@link TOOL_BY_NAME}, so each path owns its own registrations.
 */
const TOOL_ENTRIES: ToolEntry[] = [...jsonTools, ...sharedTools, ...dxTools];
const TOOL_BY_NAME = new Map<string, ToolEntry>(TOOL_ENTRIES.map((e) => [e.tool.name, e]));

/**
 * High-level guidance handed to the client on connect (the MCP `initialize`
 * `instructions` field). Tools carry their own per-call descriptions; this explains what
 * the server is for and the order to use the tools in. It is composed from a general
 * preamble, the JSON path's guidance, the `gui.*` DX path's guidance (each owned by its
 * module), and a closing rule — framed JSON-first on purpose so existing behavior isn't
 * diluted by the added programmatic path.
 */
const PREAMBLE =
  'This server builds and validates GolemUI form definitions — declarative, JSON-serializable ' +
  'forms shaped as `{ form: [...widgets], states?: {...} }`. Its job is to help you produce a form ' +
  'definition that is guaranteed correct before the user pastes it into their codebase.\n\n' +
  'Recommended workflow:\n';

const CLOSER =
  'Do not hand a form definition to the user until `json_validate_form_definition` reports `valid: true`.';

const SERVER_INSTRUCTIONS = PREAMBLE + JSON_INSTRUCTIONS + DX_INSTRUCTIONS + CLOSER;

const server = new Server(
  { name: PKG_NAME, version: PKG_VERSION },
  { capabilities: { tools: {} }, instructions: SERVER_INSTRUCTIONS },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOL_ENTRIES.map((e) => e.tool),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const entry = TOOL_BY_NAME.get(name);
  if (!entry) return err(`Unknown tool: ${name}`);
  try {
    return ok(await entry.run(args));
  } catch (e) {
    return err((e as Error).message);
  }
});

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
