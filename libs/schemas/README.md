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
json-schema.js / json-schema.cjs the JSON Schema to form converter, `@golemui/schemas/json-schema`
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

## Converting a JSON Schema into a form

`@golemui/schemas/json-schema` exports `fromJsonSchema`, a pure function that turns a JSON
Schema of the form data into a form definition. It runs in Node, browsers and Workers, so it
works at runtime with a schema from an API, and at build time to write a form file.

```ts
import { fromJsonSchema } from '@golemui/schemas/json-schema';
import { guiPreset } from '@golemui/gui-schemas/json-schema';

const { formDefinition, diagnostics } = fromJsonSchema(schema, {
  preset: guiPreset(),
  rules: [{ match: { $type: 'string', format: 'email' }, props: { icon: 'mail' } }],
  overrides: { 'address.street': { widget: 'textarea' } },
});
```

The widget set provides a preset. Its rules choose a widget for each schema node, and its
builders create the widgets. Four layers change the result. For each node, the first layer
that names a widget builds it:

1. A path override, e.g. `overrides: { 'address.street': { widget: 'textarea' } }`. Inside
   arrays the path uses the `items` token: `lines.items.quantity`.
2. A definition override, e.g. `overrides: { '$defs/Address': { ... } }`, for every node that
   comes from that definition.
3. The `x-golemui` keyword in the schema. Rename it with `vendorKeyword`, or ignore it with
   `vendorKeyword: false`.
4. The rules, in order: first `rules`, then the preset rules. A rule is either a predicate,
   `{ when(node), build(node, context) }`, or plain JSON, `{ match, widget, ...fields }`.

The other fields of these layers (`label`, `props`, `validator`, `defaultValue`, `readonly`,
`size`, `uid`) are merged onto the built widget, the most specific layer last. `skip: true`
leaves a node out. `order` sets the property order of an object, and `'*'` stands for the
properties it does not list.

A JSON rule matches schema keywords by deep equality or with `$in`, `$exists` and `$regex`. It
matches node fields with `$type`, `$path` (a glob: `*` is one segment, `**` any number of
segments), `$name`, `$defName`, `$required` and `$inRepeater`. A JSON rule without `widget`
only patches what the next rule builds.

Refs are resolved inside the document: `$defs`, `definitions`, and OpenAPI
`components/schemas` through the `refRoot` option. A recursive ref stops after `maxRefDepth`
expansions, 2 by default. `allOf` parts are merged, nullable types are unwrapped, and draft-07,
draft-04 and OpenAPI 3.0 keywords are read in their 2020-12 form.

A `oneOf` or `anyOf` of objects becomes a selector plus the branch properties. The selector is
the discriminator: OpenAPI `discriminator.propertyName` when present, otherwise the first
property with a different `const` in every branch. Its options are labelled by the branch
titles. Each branch property is built once, with an `include.when` condition on the branches
that define it, for example `$form.payment?.method === "card"`. Inside an array the condition
reads the row through `$item`. The form removes the data of hidden widgets on submit, so only
the chosen branch is sent. A union with no discriminator renders every branch property,
optional and always visible, with a `no-discriminator` warning.

`if/then/else`, `dependentRequired`, `dependentSchemas` and draft-07 `dependencies` on an
object are compiled too:

- A property that only a branch defines is built once, with an `include.when` condition, right
  after the last property the condition reads.
- A declared property that a branch constrains gets a state validator: the branch condition
  becomes a form state (`if01`, `dep01`, ...) and the constraints a `validator.<state>` entry.
  One state validator applies per field at a time. So a field can become required under any
  number of conditions (one state joins them with `||`), or take its constraints from the
  branches of one `if`. Constraints from a second condition give an `overlay-limit` warning.
- Inside an array, a condition can show and hide widgets through `$item`, but states cannot
  read the row, so conditional constraints there give a `conditional-validator-in-repeater`
  warning.

An `if` compiles when it uses `properties`, `required`, `const`, `enum`, `not` with `const` or
`enum`, numeric bounds and nested `properties`. As in JSON Schema, a tested property that is
not in `if.required` passes when it is absent, which the `if-vacuous` note points out. Any
other `if` gives an `if-unsupported` warning, and its branch properties are always shown and
optional.

### From the command line

`convert` writes the form definition of a JSON Schema file, to standard output or to `--out`.
The preset comes from a module that exports `preset(options)`, such as the gui entry:

```bash
npx @golemui/schemas convert schemas/signup.schema.json \
  --preset @golemui/gui-schemas/json-schema --out src/forms/signup.form.json
```

A generated form is often edited by hand, so an existing `--out` file is only replaced with
`--force`. `--pointer /components/schemas/User` converts one subschema of a larger document,
such as an OpenAPI file, and resolves its `$ref`s against the whole document. Diagnostics go to
standard error. `--fail-on error` or `--fail-on warning` makes the command fail on them.

The settings can also live in `json-schema.config.mjs` (or `.json`) in the current directory,
or in the file `--config` names. Its paths are relative to the config file, and flags win over
it. A `.mjs` config can pass predicate rules and the preset itself:

```js
import { guiPreset } from '@golemui/gui-schemas/json-schema';

export default {
  input: 'schemas/signup.schema.json',
  output: 'src/forms/signup.form.json',
  preset: guiPreset({ submitLabel: 'Sign up' }),
  overrides: { 'address.street': { widget: 'textarea' } },
  rules: [{ match: { format: 'email' }, props: { icon: 'mail' } }],
};
```

A `.json` config names the preset module instead (`"preset": "@golemui/gui-schemas/json-schema"`)
and passes its options as `presetOptions`. The other fields are `pointer`, `vendorKeyword`,
`maxRefDepth`, `maxNodes` and, in a `.mjs` config, `transform`.

### Diagnostics

The conversion never throws because of the schema shape. What it cannot express exactly is
listed in `diagnostics`. Each entry has a `severity` (`error`: not rendered, `warning`:
rendered approximately, `info`: a note), a `code`, the form data `path` and the JSON
`pointer` into the input.
