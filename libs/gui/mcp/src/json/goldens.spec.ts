import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  generateFromJsonSchema,
  JSON_GENERATE_FROM_SCHEMA_TOOL,
  type GenerateFromJsonSchemaInput,
} from './generate-from-json-schema';
import {
  generateFromOpenapi,
  JSON_GENERATE_FROM_OPENAPI_TOOL,
  type GenerateFromOpenapiInput,
} from './generate-from-openapi';

// Each `<case>.input.json` holds tool arguments, and `<case>.output.json` holds the full
// recorded result. To record intended changes, run the gui-mcp vite:test target with `-u`.
const GOLDENS_DIRECTORY = fileURLToPath(new URL('./goldens', import.meta.url));
const INPUT_SUFFIX = '.input.json';

type GoldenCase<Input> = { name: string; input: Input; outputPath: string };

function readCases<Input>(subdirectory: string): GoldenCase<Input>[] {
  const directory = join(GOLDENS_DIRECTORY, subdirectory);
  return readdirSync(directory)
    .filter((fileName) => fileName.endsWith(INPUT_SUFFIX))
    .sort()
    .map((fileName) => {
      const name = fileName.slice(0, -INPUT_SUFFIX.length);
      return {
        name,
        input: JSON.parse(readFileSync(join(directory, fileName), 'utf8')) as Input,
        outputPath: join(directory, `${name}.output.json`),
      };
    });
}

// Same serialization as `ok()` in shared/tool.ts, so a golden equals the MCP response text.
function serialize(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

describe('json tool goldens', () => {
  describe('json_generate_from_schema', () => {
    it.each(readCases<GenerateFromJsonSchemaInput>('json-schema'))(
      'matches the recorded output for $name',
      async ({ input, outputPath }) => {
        const result = generateFromJsonSchema(input);
        await expect(serialize(result)).toMatchFileSnapshot(outputPath);
      },
    );
  });

  describe('json_generate_from_openapi', () => {
    it.each(readCases<GenerateFromOpenapiInput>('openapi'))(
      'matches the recorded output for $name',
      async ({ input, outputPath }) => {
        const result = await generateFromOpenapi(input);
        await expect(serialize(result)).toMatchFileSnapshot(outputPath);
      },
    );
  });

  describe('tool descriptors', () => {
    it.each([JSON_GENERATE_FROM_SCHEMA_TOOL, JSON_GENERATE_FROM_OPENAPI_TOOL])(
      'matches the recorded descriptor for $name',
      async (descriptor) => {
        const outputPath = join(GOLDENS_DIRECTORY, 'tools', `${descriptor.name}.json`);
        await expect(serialize(descriptor)).toMatchFileSnapshot(outputPath);
      },
    );
  });
});
