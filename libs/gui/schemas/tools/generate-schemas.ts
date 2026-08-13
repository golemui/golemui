/**
 * Generates the gui schema tree from the widget manifest. The shared generator in
 * `@golemui/schemas/generator` does the work and emits, all committed and
 * staleness-checked in CI:
 * - src/lib/widgets.schema.json         formWidget union + knownWidgetTypes enum
 * - src/lib/form.schema.json            form envelope
 * - src/lib/layout-widget.schema.json   layout widget union
 * - src/lib/core/*.schema.json          vendored @golemui/schemas core copies
 * - src/index.ts                        package entry point + COMPONENT_SCHEMAS_BY_TYPE
 * Outputs are prettier-formatted. Run with `npm run generate:schemas`.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateImplementationSchemas } from '@golemui/schemas/generator';
import { guiSchemaConfig } from '../src/lib/widget-manifest';

// The package root comes from this module's own path, not cwd, so any caller
// writes into this package.
const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

generateImplementationSchemas(guiSchemaConfig, packageRoot).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
