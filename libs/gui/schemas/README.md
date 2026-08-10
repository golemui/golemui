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

Every file under `schemas/` is reachable as a raw asset, for example
`@golemui/gui-schemas/schemas/components/textinput.schema.json`. The package also
has a JavaScript entry point that exports the same files as objects.

The generated files derive from the widget manifest
(`src/lib/widget-manifest.ts`). Do not edit them, run `npm run generate:schemas`
after changing the manifest or the `@golemui/schemas` core sources. CI fails
when generated files are stale.

The shared `common.schema.json` moved to the `@golemui/schemas` package and is
vendored here under `schemas/core/`. Raw-asset imports of
`@golemui/gui-schemas/schemas/common.schema.json` must switch to
`schemas/core/common.schema.json`. The vendored copy is identical to the core
source apart from its `$id`, which is rebased onto this tree
(`https://golemui.com/schemas/gui/core/common.schema.json`) so it matches the
retrieval URI that sibling refs resolve to. `validators.schema.json` stays at
the `schemas/` root and is owned by this package: validation vocabulary is
implementation-specific, so it is not part of the core layer, and its `$id` is
now `https://golemui.com/schemas/gui/validators.schema.json`. The package
entry-point export names (`commonSchema`, `validatorsSchema`, and every
component schema export) are unchanged, but the `$id` values and `$ref` layout
are not.

These `$id` values are identifiers, not download URLs. The matching tree under
`https://golemui.com/schemas/` is not published yet, so nothing dereferences
them today.

## Validating with Ajv

Every shipped file declares the `$id` that its siblings reference, so registering
the files is all that is needed. A component ref like
`../core/common.schema.json` resolves to the vendored core copy's own `$id`.

```ts
import Ajv2020 from 'ajv/dist/2020';
import {
  commonSchema,
  rangesSchema,
  textinputSchema,
  validatorsSchema,
} from '@golemui/gui-schemas';

const ajv = new Ajv2020();
ajv.addSchema(commonSchema);
ajv.addSchema(validatorsSchema);
ajv.addSchema(rangesSchema);
const validate = ajv.compile(textinputSchema);
```

The raw `schemas/` files behave the same way: registering each one by its own
`$id` resolves the whole tree, with no JavaScript from this package involved.
The core `common.schema.json` of `@golemui/schemas` keeps its own `$id`, so both
packages can be loaded into one Ajv instance.

## Documentation

- Website: https://golemui.com
- Repository: https://github.com/golemui/golemui
- Source: https://github.com/golemui/golemui/tree/main/libs/gui/schemas
- Issues: https://github.com/golemui/golemui/issues

## License

MIT
