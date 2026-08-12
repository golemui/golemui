# @golemui/schemas

Base JSON schema resources shared by every GolemUI widget set implementation, plus the pure
builder functions that generate an implementation's aggregate schema files from its widget
manifest.

## Install

```bash
npm install @golemui/schemas
```

## Contents

```text
schemas/
  core/common.schema.json        shared structural $defs (baseWidget, localizable, chunkRef, ...)
index.js / index.cjs             the JavaScript entry point
generator.js / generator.cjs     the file-writing generator, `@golemui/schemas/generator`
cli.js                           the `golemui-schemas` command
index.d.ts, lib/*.d.ts           type declarations
```

Core publishes exactly one `$defs` resource: `common.schema.json`. Validation vocabulary is
implementation-owned, not core contract. Each implementation publishes its own validators
schema exposing a `#/$defs/validator` entry pointer (the gui set lives at
`schemas/gui/validators.schema.json` in the published tree).

## Entry point

The entry point exports the core schema as an object, the builder functions
(`buildWidgetsSchema`, `buildFormEnvelope`, `buildLayoutWidgetSchema`,
`buildSchemasPackageIndex`, `buildEditorBundle`), and their types
(`ImplementationSchemaConfig`, `WidgetManifestEntry`, `WidgetKind`, `SchemaObject`). The raw
file is also reachable as `@golemui/schemas/schemas/core/common.schema.json`.

```ts
import Ajv2020 from 'ajv/dist/2020';
import { buildWidgetsSchema, commonSchema } from '@golemui/schemas';

const ajv = new Ajv2020();
ajv.addSchema(commonSchema);

const widgets = buildWidgetsSchema({
  implementation: 'gui',
  idBase: 'https://golemui.com/schemas/gui/',
  generatorPath: 'libs/gui/schemas/tools/generate-schemas.ts',
  formTitle: 'Golem Form DSL',
  statesDescription: 'Named boolean conditions keyed by state name.',
  manifest: [{ type: 'textinput', schemaFile: 'textinput.schema.json', kind: 'input' }],
  libRootSchemaFiles: ['validators.schema.json'],
  includeSchemalessTypesInKnownWidgetTypes: true,
  includeCustomWidgetFallback: true,
});
```

## The published site tree

The site tree at `https://golemui.com/schemas/` is meant to layer this core resource with one
directory per implementation:

```text
schemas/
  core/                          from this package
  form.schema.json               legacy alias, from this repository (not from npm)
  gui/                           from @golemui/gui-schemas (generated aggregates, gui-owned
                                 validators and ranges defs, vendored core/)
```

That tree is not published yet. Only the original `/schemas/form.schema.json` monolith is
live today, and no job in this repository assembles or deploys the rest, so the `$id` values
in these packages are identifiers rather than URLs that resolve.

## The legacy alias

`site/form.schema.json` is a three-line schema whose only content is
`"$ref": "./gui/form.schema.json"`. It keeps the original schema URL
`https://golemui.com/schemas/form.schema.json` working once the site tree exists, where the
`gui/` directory sits next to it.

It is a website build input and is deliberately not shipped to npm: inside a package the ref
resolves to nothing, so every way of loading it throws `MissingRefError`. That is also why it
lives outside `src/`, and why the entry point does not export it.

Publishing it is one atomic step with the `gui/` tree. Serving the alias while
`/schemas/gui/form.schema.json` is still missing breaks the one schema URL that works today,
which the MCP writes into the `$schema` line of every form definition it generates. A
post-deploy check should fetch `/schemas/form.schema.json`, follow its `$ref`, and assert that
both respond with `application/json`.

## Generating an implementation tree

An implementation declares a widget manifest (`WidgetManifestEntry[]`) and an
`ImplementationSchemaConfig`, then calls `generateImplementationSchemas` from
`@golemui/schemas/generator` to produce its `widgets.schema.json` (widget union plus
`knownWidgetTypes` enum), its `form.schema.json` envelope, its `layout-widget.schema.json`,
its vendored copy of `schemas/core/`, and its package index source. Set
`emitEditorBundle: true` to also get `form.editor.schema.json` (see below). The gui
implementation's entry point is `libs/gui/schemas/tools/generate-schemas.ts`, run with
`npm run generate:schemas`.

Generated files are prettier-formatted when prettier and a prettier config are both
resolvable, and plainly indented otherwise. Prettier is an optional peer dependency.

## Scaffolding a new implementation

The `golemui-schemas` command scaffolds and regenerates a schema tree, so an implementation
needs no generator script of its own:

```bash
npx @golemui/schemas init --name kendo --id-base https://example.com/schemas/kendo/
npx @golemui/schemas generate
```

`init` writes `schemas.config.mjs` (the manifest and config), a starter validators schema, a
starter `flex` and example input component schema, an example form and a test skeleton, then
runs `generate`. Run it with no flags for prompts.

`schemas.config.mjs` and the component schemas are the implementer's to edit. Everything
else, including the vendored core, is rewritten by `generate` from the installed
`@golemui/schemas`, so updating core means bumping the dependency and rerunning it. A CI step
that runs `generate` and then `git diff --exit-code` catches a stale tree.

## Two entry points: Ajv and editors

Ajv registers the per-file tree by `$id`, and resolution works because every file is added up
front. An editor instead resolves each relative `$ref` against the file's absolute `$id`,
computes a URL and tries to download it, which fails offline, in untrusted workspaces and
wherever the `idBase` is not hosted. `form.editor.schema.json` is the same tree inlined into
one self-contained document with no `$id`s: point a form file's `$schema` at it.

Editing workflow for the core file: change it here, then run `npm run generate:schemas`
so every vendored copy is regenerated. A vendored copy is identical to its source apart from
an `$id` rebased onto the implementation's own tree, which is what lets that tree be loaded by
`$id` alone. A drift test enforces this, and CI fails when generated files are stale.
