import type { FormPluginContext } from '@golemui/core';
import { runFill, runRead } from './execute';
import { assertToolName } from './names';
import type { FormSchema } from './schema';
import { TOOL_DESCRIPTION_LIMIT, truncate } from './text';
import type { ModelContextTool, WebmcpOptions, WebmcpResult, WebmcpToolKind } from './types';

const DEFAULT_TOOLS: WebmcpToolKind[] = ['fill', 'submit'];

const EMPTY_INPUT = { type: 'object', properties: {} };

/**
 * The tool descriptors for one form: one per requested kind, closing over the schema built for
 * the current form state. A tool never rejects: every outcome, including an internal failure,
 * is returned as a {@link WebmcpResult}.
 */
export function buildTools(
  baseName: string,
  schema: FormSchema,
  context: FormPluginContext,
  options: WebmcpOptions,
): ModelContextTool[] {
  const title = options.title ?? options.name;
  const purpose = options.description.trim().replace(/\.$/, '');
  const kinds = options.tools ?? DEFAULT_TOOLS;

  return kinds.map((kind) => {
    const override = options.toolOverrides?.[kind] ?? {};
    const name = override.name ?? `${baseName}-${kind}`;
    assertToolName(name);
    const consequential = override.consequential ?? kind === 'submit';

    const texts: Record<WebmcpToolKind, { title: string; description: string }> = {
      read: {
        title: `Read ${title}`,
        description: `Read the current values and validation state of the "${title}" form (${purpose}). Changes nothing. Reports which fields are hidden by the form's conditions.`,
      },
      fill: {
        title: `Fill ${title}`,
        description: `Fill in the "${title}" form (${purpose}). Sets the given fields without submitting, so the user can review them. Fields left out keep their values. Returns the values and the validation errors by field path.`,
      },
      submit: {
        title: `Submit ${title}`,
        description: `Submit the "${title}" form (${purpose}). Sets the given fields, validates, and submits immediately when everything is valid. Returns the submitted values, or status "invalid" with the validation errors by field path.`,
      },
    };

    return {
      name,
      title: override.title ?? texts[kind].title,
      description: truncate(override.description ?? texts[kind].description, TOOL_DESCRIPTION_LIMIT),
      inputSchema: kind === 'read' ? EMPTY_INPUT : schema.inputSchema,
      annotations: {
        readOnlyHint: kind === 'read',
        consequentialHint: consequential,
        // Every result echoes user-entered values.
        untrustedContentHint: true,
      },
      execute: async (input, executeOptions): Promise<WebmcpResult> => {
        if (executeOptions?.signal?.aborted) {
          return { status: 'error', message: 'The call was cancelled.' };
        }
        try {
          return kind === 'read'
            ? runRead(context, schema)
            : runFill(context, schema, input, kind === 'submit');
        } catch (err) {
          return {
            status: 'error',
            message: `The form could not be updated: ${err instanceof Error ? err.message : String(err)}`,
          };
        }
      },
    };
  });
}
