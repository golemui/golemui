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
The package entry-point exports (`commonSchema`, `validatorsSchema`, and every
component schema export) are unchanged.

## Documentation

- Website: https://golemui.com
- Repository: https://github.com/golemui/golemui
- Source: https://github.com/golemui/golemui/tree/main/libs/gui/schemas
- Issues: https://github.com/golemui/golemui/issues

## License

MIT
