# @golemui/schemas

Base JSON schema resources shared by every GolemUI widget set implementation, plus the pure
builder functions that generate an implementation's aggregate schema files from its widget
manifest.

## Contents

```text
schemas/
  core/common.schema.json        shared structural $defs (baseWidget, localizable, chunkRef, ...)
  core/validators.schema.json    the standard validator set
  form.schema.json               legacy alias for the published site tree (see below)
```

The published tree at `https://golemui.com/schemas/` layers these core resources with one
directory per implementation:

```text
schemas/
  core/                          from this package
  form.schema.json               legacy alias, from this package
  gui/                           from @golemui/gui-schemas (generated aggregates + vendored core/)
```

## The legacy alias

`schemas/form.schema.json` is a three-line schema whose only content is
`"$ref": "./gui/form.schema.json"`. It keeps the original schema URL
`https://golemui.com/schemas/form.schema.json` working forever. The ref target only exists
in the published site tree, where the `gui/` directory sits next to this file. Inside this
npm package the ref resolves to nothing, which is expected: the gui tree is published
separately in `@golemui/gui-schemas`.

## Generating an implementation tree

An implementation declares a widget manifest (`WidgetManifestEntry[]`) and an
`ImplementationSchemaConfig`, then runs the builders exported here to produce its
`widgets.schema.json` (widget union plus `knownWidgetTypes` enum), its `form.schema.json`
envelope, its `layout-widget.schema.json`, its vendored copy of `schemas/core/`, and its
package index source. The gui implementation does this in
`libs/gui/schemas/tools/generate-schemas.ts`, run with `npm run generate:schemas`.

Editing workflow for the core files: change them here, then run `npm run generate:schemas`
so every vendored copy is regenerated. A drift test keeps vendored copies byte-identical to
the sources, and CI fails when generated files are stale.
