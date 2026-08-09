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
  components/*.schema.json   per-widget schemas (handwritten)
  core/*.schema.json         vendored copy of the @golemui/schemas core files (generated)
```

The generated files derive from the widget manifest
(`src/lib/widget-manifest.ts`). Do not edit them, run `npm run generate:schemas`
after changing the manifest or the `@golemui/schemas` core sources. CI fails
when generated files are stale.

The shared `common.schema.json` and `validators.schema.json` moved to the
`@golemui/schemas` package and are vendored here under `schemas/core/`.
Raw-asset imports of `@golemui/gui-schemas/schemas/common.schema.json` or
`.../schemas/validators.schema.json` must switch to the `schemas/core/` paths.
The package entry-point export names (`commonSchema`, `validatorsSchema`, and
every component schema export) are unchanged, but their `$id` values and
`$ref` layout are not, which changes how they register into Ajv (next section).

## Validating with Ajv

Component schemas now reference the core files with relative refs like
`../core/common.schema.json`. Resolved against a component `$id`
(`https://golemui.com/schemas/gui/components/...`) those refs resolve to the
`gui/core/` retrieval URIs, while the vendored core files carry the canonical
core `$id` (`https://golemui.com/schemas/core/...`). Registering the exported
schemas alone therefore fails with a `MissingRefError`. Register the
`guiCoreRegistrations()` clones as well:

```ts
import Ajv2020 from 'ajv/dist/2020';
import {
  commonSchema,
  guiCoreRegistrations,
  textinputSchema,
  validatorsSchema,
} from '@golemui/gui-schemas';

const ajv = new Ajv2020();
for (const { key, schema } of guiCoreRegistrations()) {
  ajv.addSchema(schema, key);
}
ajv.addSchema(commonSchema);
ajv.addSchema(validatorsSchema);
const validate = ajv.compile(textinputSchema);
```

Do not load the core files of both `@golemui/schemas` and
`@golemui/gui-schemas` into the same Ajv instance. The vendored copies are
byte-identical to the sources, including the `$id`, so Ajv rejects the second
registration as a duplicate id.

## Documentation

- Website: https://golemui.com
- Repository: https://github.com/golemui/golemui
- Source: https://github.com/golemui/golemui/tree/main/libs/gui/schemas
- Issues: https://github.com/golemui/golemui/issues

## License

MIT
