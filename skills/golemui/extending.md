# GolemUI — extending

Four extension points: custom widgets, item renderers, custom validators and middlewares. Each
is registered on the form component's config ([hosts/config.md](hosts/config.md)) and named
from the definition, which stays plain data. Each one's contract is on its docs page (see
`fetch-before-extending`).

## Custom widgets

A widget GolemUI does not ship (a color picker, a signature pad) is a custom `type` in the
definition, and a loader for that type in `customWidgetLoaders` on the config:

```json no-check
{ "kind": "input", "type": "colorPicker", "path": "color", "label": "Color" }
```

The validator passes a custom type with a warning, ``Widget type `colorPicker` at `/form/0` is
not a built-in GolemUI widget - assumed custom. Its props were not validated.``, and leaves its
props unchecked.

- Start here: https://golemui.com/json/extending/widgets/overview.md
- Per kind: input https://golemui.com/json/extending/widgets/input-widget.md · display
  https://golemui.com/json/extending/widgets/display-widget.md · action
  https://golemui.com/json/extending/widgets/action-widget.md · layout
  https://golemui.com/json/extending/widgets/layout-widget.md
- How a custom widget talks to the form: https://golemui.com/json/extending/widgets/events.md
- How it takes part in layouts: https://golemui.com/json/extending/widgets/sizing.md
- Using custom widgets from a definition:
  https://golemui.com/json/form-definition/custom-widgets.md

A custom widget of a server-rendered Lit form registers with `safeDefine`
([hosts/lit.md](hosts/lit.md)).

## Item renderers

An item renderer draws the options or rows of a choice widget (`dropdown`, `list`,
`multiDropdown`, …) with your own markup. The definition names it in the widget's props,
`"props": { "itemRenderer": "currencyItemRenderer" }`, and the config maps the name to the
component in `itemRenderers`. https://golemui.com/json/extending/item-renderers.md

## Custom validators

A validator of `"type": "custom"` delegates to application code. Every key other than `type`
and `required` names a rule registered in `customValidators` on the config; its value is passed
to that rule, which returns a [Standard Schema](https://standardschema.dev) (a Zod or Valibot
schema works):

```json
{
  "kind": "input",
  "type": "textinput",
  "path": "vat",
  "label": "VAT number",
  "validator": { "type": "custom", "required": true, "vatNumber": { "country": "ES" } }
}
```

and `customValidators: { vatNumber: ({ country }) => schemaFor(country) }` on the config.
https://golemui.com/json/extending/validators.md

## Middlewares

A middleware sits in the form's pipeline (transform data, intercept actions), passed in
`middlewares` on the config. https://golemui.com/json/extending/middlewares.md

## Public entry points

`@golemui/gui-shared` exposes the public surface only. The contracts between GolemUI's own
packages are in a separate `internals` entry point of each package, documented as unstable.

## Rules

### rule: fetch-before-extending

When: writing a custom widget, an item renderer, a custom validator or a middleware.

Do: fetch its docs page from "Custom widgets", "Item renderers", "Custom validators" or "Middlewares" first, and write the registration from it.

Wrong:

- Doing: writing the registration from memory of another forms library.

  Because: the contracts are GolemUI's own; a wrong name fails at runtime, such as `Unknown custom validator rule "vat". Registered rules: "vatNumber".`

Applies: custom-widgets, item-renderers, validators, middlewares

Source: libs/gui/validators/src/lib/validators.ts#fromCustomValidator

### rule: no-internals-imports

When: importing from a GolemUI package.

Do: import from the public entry points the docs show.

Wrong:

- Doing: `import { repeaterIndexSuffix } from '@golemui/gui-shared/internals'` in an application.

  Because: `internals` is the unstable contract between GolemUI's own packages, and may change in any release.

Applies: imports, extending

Check: forbid `/@golemui\/[a-z-]+\/internals/` in ts, tsx

Source: libs/gui/shared/src/internals.ts
