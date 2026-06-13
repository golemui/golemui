/**
 * The MCP tool wiring shared by both authoring paths.
 *
 * Each path (`json/`, `dx/`) and the shared surface export a `ToolEntry[]` that pairs an
 * MCP tool descriptor with its handler. The server concatenates those arrays for both the
 * `tools/list` response and name-based dispatch, so adding a tool is a one-line change in
 * the owning module — there is no central switch to keep in sync.
 */

/**
 * The shape of the exported `*_TOOL` descriptor objects. Kept intentionally loose
 * (`inputSchema: unknown`, readonly fields) so the `as const` descriptors assign without
 * readonly friction; the MCP client is what validates `arguments` against the real
 * `inputSchema` before a call ever reaches us.
 */
export type ToolDescriptor = {
  readonly name: string;
  readonly description?: string;
  readonly inputSchema: unknown;
};

/** One registered MCP tool: its descriptor (advertised to the client) and its handler. */
export interface ToolEntry {
  tool: ToolDescriptor;
  run: (args: Record<string, unknown> | undefined) => unknown | Promise<unknown>;
}

/**
 * Pair a tool descriptor with its handler. `args` arrives already shape-validated by the
 * MCP client against `tool.inputSchema`, so this is the single trusted boundary where raw
 * arguments are cast to the handler's input type — instead of an `as any` repeated at
 * every dispatch arm.
 *
 * @example
 * const jsonTools = [defineTool(VALIDATE_FORM_DEFINITION_TOOL, validateFormDefinition)];
 */
export function defineTool<Input, Output>(
  tool: ToolDescriptor,
  handler: (input: Input) => Output,
): ToolEntry {
  return { tool, run: (args) => handler(args as Input) };
}

/** Wrap a successful tool result in the MCP text-content envelope. */
export function ok(payload: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
  };
}

/** Wrap an error message in the MCP error envelope. */
export function err(message: string) {
  return {
    isError: true,
    content: [{ type: 'text' as const, text: message }],
  };
}
