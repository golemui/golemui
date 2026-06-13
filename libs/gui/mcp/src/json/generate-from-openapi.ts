import { jsonSchemaToGui, type JsonSchemaLike } from './mapping/json-schema-to-gui';
import { validateFormDefinition } from './validate-form-definition';

type OpenAPIDoc = {
  openapi?: string;
  components?: { schemas?: Record<string, JsonSchemaLike> };
  paths?: Record<string, Record<string, OpenAPIOperation>>;
};

type OpenAPIOperation = {
  operationId?: string;
  summary?: string;
  requestBody?: {
    content?: Record<string, { schema?: JsonSchemaLike }>;
  };
  parameters?: Array<{
    name: string;
    in: string;
    required?: boolean;
    schema?: JsonSchemaLike;
    description?: string;
  }>;
};

export type GenerateFromOpenapiInput = {
  document?: OpenAPIDoc;
  documentUrl?: string;
  operation: string;
  submitAction?: boolean;
  submitLabel?: string;
};

export type GenerateFromOpenapiResult = {
  resolvedOperation: { method: string; path: string; operationId?: string };
  formDefinition: { $schema: string; form: unknown[] };
  unmapped: { path: string; reason: string }[];
  validation: ReturnType<typeof validateFormDefinition>;
};

const METHODS = ['get', 'post', 'put', 'patch', 'delete'];

export async function generateFromOpenapi(
  input: GenerateFromOpenapiInput,
): Promise<GenerateFromOpenapiResult> {
  if (!input.document && !input.documentUrl) {
    throw new Error('Provide either `document` (parsed OpenAPI object) or `documentUrl`.');
  }
  const doc: OpenAPIDoc = input.document ?? (await fetchDoc(input.documentUrl!));

  const resolved = findOperation(doc, input.operation);
  if (!resolved) {
    throw new Error(
      `Operation \`${input.operation}\` not found. Use the form "METHOD /path" (e.g. "POST /users") or an exact operationId.`,
    );
  }

  const { method, path, operation } = resolved;

  // Prefer a JSON request body. Fall back to query/path parameters if none.
  let bodySchema = operation.requestBody?.content?.['application/json']?.schema;
  if (bodySchema) bodySchema = derefSchema(bodySchema, doc);

  let assembled: JsonSchemaLike;
  if (bodySchema && (bodySchema.type === 'object' || bodySchema.properties)) {
    assembled = bodySchema;
  } else if (operation.parameters?.length) {
    assembled = paramsToSchema(operation.parameters, doc);
  } else {
    throw new Error(
      `Operation \`${method.toUpperCase()} ${path}\` has no JSON request body and no parameters — nothing to render as a form.`,
    );
  }

  const { formDefinition, unmapped } = jsonSchemaToGui(assembled, {
    submitAction: input.submitAction ?? true,
    submitLabel: input.submitLabel ?? defaultSubmitLabel(method, operation),
  });

  const validation = validateFormDefinition({ formDefinition });

  return {
    resolvedOperation: { method: method.toUpperCase(), path, operationId: operation.operationId },
    formDefinition,
    unmapped,
    validation,
  };
}

async function fetchDoc(url: string): Promise<OpenAPIDoc> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch OpenAPI document from ${url}: ${res.status} ${res.statusText}`,
    );
  }
  const text = await res.text();
  try {
    return JSON.parse(text) as OpenAPIDoc;
  } catch {
    throw new Error(
      `Document at ${url} is not JSON. v1 only supports JSON OpenAPI docs — convert YAML before passing.`,
    );
  }
}

function findOperation(
  doc: OpenAPIDoc,
  ref: string,
): { method: string; path: string; operation: OpenAPIOperation } | null {
  const trimmed = ref.trim();
  // "METHOD /path" form.
  const methodPathMatch = trimmed.match(/^([A-Za-z]+)\s+(\/\S*)$/);
  if (methodPathMatch) {
    const method = methodPathMatch[1]!.toLowerCase();
    const path = methodPathMatch[2]!;
    if (!METHODS.includes(method)) {
      throw new Error(`Unsupported HTTP method \`${method.toUpperCase()}\`.`);
    }
    const op = doc.paths?.[path]?.[method];
    if (op) return { method, path, operation: op };
    return null;
  }
  // operationId form.
  for (const [path, methods] of Object.entries(doc.paths ?? {})) {
    for (const [method, op] of Object.entries(methods)) {
      if (METHODS.includes(method) && op.operationId === trimmed) {
        return { method, path, operation: op };
      }
    }
  }
  return null;
}

function paramsToSchema(
  parameters: NonNullable<OpenAPIOperation['parameters']>,
  doc: OpenAPIDoc,
): JsonSchemaLike {
  const properties: Record<string, JsonSchemaLike> = {};
  const required: string[] = [];
  for (const p of parameters) {
    const s = p.schema ? derefSchema(p.schema, doc) : { type: 'string' as const };
    properties[p.name] = { ...s, description: p.description ?? s.description };
    if (p.required) required.push(p.name);
  }
  return { type: 'object', properties, required };
}

function defaultSubmitLabel(method: string, op: OpenAPIOperation): string {
  if (op.summary) return op.summary;
  const verbs: Record<string, string> = {
    post: 'Create',
    put: 'Update',
    patch: 'Update',
    delete: 'Delete',
    get: 'Submit',
  };
  return verbs[method.toLowerCase()] ?? 'Submit';
}

/**
 * Resolves `$ref` pointers within `#/components/schemas/...`. Bounded recursion (16 levels) to
 * avoid infinite loops on self-referential schemas. We do NOT follow external refs in v1.
 */
function derefSchema(schema: JsonSchemaLike, doc: OpenAPIDoc, depth = 0): JsonSchemaLike {
  if (depth > 16) return schema;
  if (typeof schema.$ref === 'string') {
    const target = resolveLocalRef(schema.$ref, doc);
    if (target) return derefSchema(target, doc, depth + 1);
    return schema;
  }
  const result: JsonSchemaLike = { ...schema };
  if (result.properties) {
    result.properties = Object.fromEntries(
      Object.entries(result.properties).map(([k, v]) => [k, derefSchema(v, doc, depth + 1)]),
    );
  }
  if (result.items) result.items = derefSchema(result.items, doc, depth + 1);
  if (result.oneOf) result.oneOf = result.oneOf.map((s) => derefSchema(s, doc, depth + 1));
  if (result.anyOf) result.anyOf = result.anyOf.map((s) => derefSchema(s, doc, depth + 1));
  return result;
}

function resolveLocalRef(ref: string, doc: OpenAPIDoc): JsonSchemaLike | null {
  if (!ref.startsWith('#/')) return null;
  const parts = ref.slice(2).split('/');
  let cur: unknown = doc;
  for (const p of parts) {
    if (cur && typeof cur === 'object') {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return null;
    }
  }
  return (cur as JsonSchemaLike) ?? null;
}

export const JSON_GENERATE_FROM_OPENAPI_TOOL = {
  name: 'json_generate_from_openapi',
  description:
    'Generate a GolemUI form for a specific OpenAPI 3.x operation (e.g. "POST /users"). ' +
    "Resolves the operation's JSON request body, dereferences `$ref`s, then maps it to a " +
    'form definition that is validated against the GolemUI JSON Schemas before being returned, ' +
    'so it is guaranteed syntactically correct. Falls back to operation parameters when no ' +
    'request body is present. Anything the mapper cannot handle is reported in `unmapped` rather ' +
    'than silently dropped — use that list to surface remaining work to the user. Pass either a ' +
    'parsed `document` or a `documentUrl` to fetch.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      documentUrl: {
        type: 'string' as const,
        description: 'URL of a JSON OpenAPI document. Either this or `document` is required.',
      },
      document: {
        type: 'object' as const,
        additionalProperties: true,
        description:
          'Parsed OpenAPI document (JSON object). Either this or `documentUrl` is required.',
      },
      operation: {
        type: 'string' as const,
        description:
          'The operation to generate a form for. Either "METHOD /path" (e.g. "POST /users") ' +
          'or an exact operationId.',
      },
      submitAction: {
        type: 'boolean' as const,
        description: 'Append a submit button. Defaults to true.',
      },
      submitLabel: {
        type: 'string' as const,
        description:
          'Label for the submit button. Defaults to the operation summary or a verb derived ' +
          'from the HTTP method.',
      },
    },
    required: ['operation'],
  },
} as const;
