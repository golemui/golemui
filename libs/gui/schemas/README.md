# @golemui/gui-schemas

[Golem UI](https://golemui.com): the declarative form engine.

## Install

```bash
npm install @golemui/gui-schemas
```

## Layout

```text
schemas/
  form.schema.json           form envelope (generated)
  widgets.schema.json        widget union + knownWidgetTypes enum (generated)
  layout-widget.schema.json  layout widget union (generated)
  validators.schema.json     the gui validator set (handwritten)
  ranges.schema.json         shared date and time range defs (handwritten)
  components/*.schema.json   per-widget schemas (handwritten)
  core/*.schema.json         vendored copy of the @golemui/schemas core file (generated)
```

The generated files derive from the widget manifest
(`src/lib/widget-manifest.ts`). Do not edit them, run `npm run generate:schemas`
after changing the manifest or the `@golemui/schemas` core sources. CI fails
when generated files are stale.

The shared `common.schema.json` moved to the `@golemui/schemas` package and is
vendored here under `schemas/core/`. Raw-asset imports of
`@golemui/gui-schemas/schemas/common.schema.json` must switch to
`schemas/core/common.schema.json`. `validators.schema.json` stays at the
`schemas/` root and is owned by this package: validation vocabulary is
implementation-specific, so it is not part of the core layer, and its `$id` is
now `https://golemui.com/schemas/gui/validators.schema.json`. The package
entry-point export names (`commonSchema`, `validatorsSchema`, and every
component schema export) are unchanged, but the `$id` values and `$ref` layout
are not, which changes how they register into Ajv (next section).

## Validating with Ajv

Component schemas reference the vendored core file with relative refs like
`../core/common.schema.json`. Resolved against a component `$id`
(`https://golemui.com/schemas/gui/components/...`) those refs resolve to the
`gui/core/` retrieval URIs, while the vendored core file carries the canonical
core `$id` (`https://golemui.com/schemas/core/...`). Registering the exported
schemas alone therefore fails with a `MissingRefError`. Register the
`guiCoreRegistrations()` clones as well. The gui-owned `validators.schema.json`
and `ranges.schema.json` need no clones: their `$id`s are exactly what the
component refs (`../validators.schema.json`, `../ranges.schema.json`) resolve
to, so plain `addSchema` is enough.

```ts
import Ajv2020 from 'ajv/dist/2020';
import {
  commonSchema,
  guiCoreRegistrations,
  rangesSchema,
  textinputSchema,
  validatorsSchema,
} from '@golemui/gui-schemas';

const ajv = new Ajv2020();
for (const { key, schema } of guiCoreRegistrations()) {
  ajv.addSchema(schema, key);
}
ajv.addSchema(commonSchema);
ajv.addSchema(validatorsSchema);
ajv.addSchema(rangesSchema);
const validate = ajv.compile(textinputSchema);
```

Do not load the core `common.schema.json` of both `@golemui/schemas` and
`@golemui/gui-schemas` into the same Ajv instance. The vendored copy is
byte-identical to the source, including the `$id`, so Ajv rejects the second
registration as a duplicate id.

## Documentation

- Website: https://golemui.com
- Repository: https://github.com/golemui/golemui
- Source: https://github.com/golemui/golemui/tree/main/libs/gui/schemas
- Issues: https://github.com/golemui/golemui/issues

## License

MIT
