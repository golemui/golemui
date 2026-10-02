import { type DeclarativeRule, type WidgetPatch } from '@golemui/schemas/json-schema';
import {
  CUSTOMIZATION_INPUT_PROPERTIES,
  jsonSchemaToGui,
  type JsonSchemaLike,
  type MapResult,
} from './mapping/json-schema-to-gui';
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
  rules?: DeclarativeRule[];
  overrides?: Record<string, WidgetPatch>;
};

export type GenerateFromOpenapiResult = MapResult & {
  resolvedOperation: { method: string; path: string; operationId?: string };
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
  const convert = (schema: JsonSchemaLike) =>
    jsonSchemaToGui(schema, {
      submitAction: input.submitAction ?? true,
      submitLabel: input.submitLabel ?? defaultSubmitLabel(method, operation),
      rules: input.rules,
      overrides: input.overrides,
      // `$ref`s in the operation point into the document, e.g. `#/components/schemas/User`.
      refRoot: doc as JsonSchemaLike,
    });

  // Prefer a JSON request body. Fall back to query/path parameters when there is none, or when
  // it is not an object, which the converter reports once `$ref` and `allOf` are resolved.
  const bodySchema = operation.requestBody?.content?.['application/json']?.schema;
  let converted = bodySchema ? convert(bodySchema) : undefined;
  const bodyIsObject =
    converted !== undefined &&
    !converted.diagnostics.some((diagnostic) => diagnostic.code === 'root-not-object');
  if (!bodyIsObject) {
    if (!operation.parameters?.length) {
      throw new Error(
        `Operation \`${method.toUpperCase()} ${path}\` has no JSON request body and no parameters — nothing to render as a form.`,
      );
    }
    converted = convert(paramsToSchema(operation.parameters));
  }

  const { formDefinition, unmapped, diagnostics } = converted as MapResult;
  const validation = validateFormDefinition({ formDefinition });

  return {
    resolvedOperation: { method: method.toUpperCase(), path, operationId: operation.operationId },
    formDefinition,
    unmapped,
    diagnostics,
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

/**
 * The parameters as the properties of one object. A parameter schema keeps its `$ref`, which the
 * converter resolves, and the parameter description is written next to it.
 */
function paramsToSchema(parameters: NonNullable<OpenAPIOperation['parameters']>): JsonSchemaLike {
  const properties: Record<string, JsonSchemaLike> = {};
  const required: string[] = [];
  for (const parameter of parameters) {
    const schema = parameter.schema ?? { type: 'string' };
    properties[parameter.name] =
      parameter.description === undefined
        ? schema
        : { ...schema, description: parameter.description };
    if (parameter.required) {
      required.push(parameter.name);
    }
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

export const JSON_GENERATE_FROM_OPENAPI_TOOL = {
  name: 'json_generate_from_openapi',
  description:
    'Generate a GolemUI form for a specific OpenAPI 3.x operation (e.g. "POST /users"). ' +
    "Converts the operation's JSON request body, with its `$ref`s into the document, to a " +
    'form definition that is validated against the GolemUI JSON Schemas before being returned, ' +
    'so it is guaranteed syntactically correct. Falls back to operation parameters when no ' +
    'object request body is present. Returns `diagnostics` and `unmapped` like ' +
    '`json_generate_from_schema`: surface them to the user. Pass either a parsed `document` or a ' +
    '`documentUrl` to fetch, and `rules` or `overrides` to choose other widgets.',
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
      ...CUSTOMIZATION_INPUT_PROPERTIES,
    },
    required: ['operation'],
  },
} as const;
