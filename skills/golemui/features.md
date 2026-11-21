# GolemUI — features index

One entry per feature, with its JSON docs page. Features with rules of their own have their
own file in this skill. Overview: https://golemui.com/json/features/overview.md

- **States**: named reactive conditions that show, hide or change widgets. In
  [definition.md](definition.md).
- **Validators**: rules and messages on an input. In [validators.md](validators.md).
- **Events**: names under `on`, handled in `formEvent`. In [events.md](events.md).
- **Runtime methods**: `setData`, `setMeta`, `setHealth`. In
  [hosts/config.md](hosts/config.md).
- **String interpolation**: `{{ … }}` in widget text, reading `$form.<path>`, `$meta`,
  `$errors`. https://golemui.com/json/features/string-interpolation.md
- **Host functions**: plain functions the expressions call as `$fn.name(…)`, passed in
  `functions` on the config. https://golemui.com/json/features/host-functions.md
- **i18n**: translating labels, placeholders and validation messages, through
  `localization` on the config. https://golemui.com/json/features/i18n.md
- **Host services**: the markdown parser and the upload service, in `dependencies`. In
  [host-services.md](host-services.md).
- **Item renderers**, **widget loaders** (the loaders of custom widgets), **middlewares**: in
  [extending.md](extending.md).
- **Generating a form from a JSON Schema or OpenAPI**: in [generate.md](generate.md).

## Worked example

The seven-part "Rent a Car" tutorial builds one form end to end (layout, states, validation
messages, a custom item renderer, async search with debounce, submit):
`https://golemui.com/json/getting-started/rent-a-car-{introduction|form|states|messages|renderer|search|submitting}.md`
