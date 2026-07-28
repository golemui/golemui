# GolemUI — features index

One entry per feature: what it is, when to reach for it, and the doc URL. URLs below use the
`dx` flavor — swap `/dx/` for `/json/` when authoring JSON definitions. Overview of everything
the form component accepts: https://golemui.com/dx/features/overview.md

- **Validators** — declarative rules on a widget (`required`, `minLength`, `format: 'email'`,
  `minimum`, `minItems`, …) with per-rule custom `messages`. Remember the three-case `type`
  rule (choice widgets need `type`; repeater forbids it; the rest omit it).
  https://golemui.com/dx/features/validators.md
- **States** — named reactive conditions (`states: { family: "$form.type === 'family'" }`)
  gating visibility (`include: { in: [...] }` / `exclude: { from: [...] }`) and per-state prop
  overrides. Declared in `formConfig.states` (TS) or top-level `states` (JSON).
  Index: https://golemui.com/dx/features/states/index.md · include/exclude:
  https://golemui.com/dx/features/states/include-exclude.md · per-state properties:
  https://golemui.com/dx/features/states/properties.md · inline `when`:
  https://golemui.com/dx/features/states/inline-when.md · composing:
  https://golemui.com/dx/features/states/composing.md
- **Form events** — `formSubmit`, `formHealth` (validity), `formEvent` (widget→host events);
  widget handlers `onChange`/`onLoad`/`onFilter`/`onBlur`/`onClick`. In TS these are functions
  (return a string to dispatch a named host event); in JSON they are handler names under `on`.
  https://golemui.com/dx/features/events.md
- **Runtime methods** — imperative API on the form component instance (read/patch values,
  trigger validation, react to runtime changes). https://golemui.com/dx/features/runtime-methods.md
- **Widget loaders** — async population of a widget's options/data (e.g. load dropdown items
  from an API, with debounced filtering). https://golemui.com/dx/features/widget-loaders.md
- **Item renderers** — custom rendering of options/rows inside list-like widgets (dropdown,
  list, …), registered on the host and referenced by name.
  https://golemui.com/dx/features/item-renderers.md
- **Middlewares** — intercept/transform form data and behavior around the form lifecycle.
  https://golemui.com/dx/features/middlewares.md
- **i18n** — translating labels, placeholders, and validation messages.
  https://golemui.com/dx/features/i18n.md
- **String interpolation** — `{{ }}` templating inside widget text reading the reactive scope
  (`$form.<path>`, `$meta`, `$errors`). https://golemui.com/dx/features/string-interpolation.md
- **Dependencies** — declaring data dependencies between fields (a field's options/value
  reacting to another field). https://golemui.com/dx/features/dependencies.md
- **Host functions** — functions registered on the host component and referenced by name from
  the definition (loaders, filters, event handlers in JSON).
  https://golemui.com/dx/features/host-functions.md

## Form Definition API (TS `gui.*` deep-dives)

These pages exist only in the `dx` flavor:

- Overview: https://golemui.com/dx/form-definition/overview.md · How resolution works:
  https://golemui.com/dx/form-definition/how-it-works.md
- **Tags** — attaching tags to widgets for group targeting:
  https://golemui.com/dx/form-definition/tags.md
- **Runtime functions**: https://golemui.com/dx/form-definition/runtime-functions.md
- **Events**: https://golemui.com/dx/form-definition/events.md
- **Selectors** (`gui.selectors`) — target widgets by type/uid/tag with chainable scopes to
  apply config in bulk; precedence is defaults → selectors → shortcut props → per-state
  overrides. Index: https://golemui.com/dx/form-definition/selectors/index.md · type selectors:
  https://golemui.com/dx/form-definition/selectors/type-selectors.md · scope operators:
  https://golemui.com/dx/form-definition/selectors/scope-operators.md · chaining:
  https://golemui.com/dx/form-definition/selectors/chaining.md · multi-value scopes:
  https://golemui.com/dx/form-definition/selectors/multi-value-scopes.md · precedence:
  https://golemui.com/dx/form-definition/selectors/precedence.md · sensible defaults
  (auto-label etc.): https://golemui.com/dx/form-definition/selectors/sensible-defaults.md
- **Reference tables** (every factory + its shortcuts): inputs
  https://golemui.com/dx/form-definition/reference/gui-inputs.md · actions
  https://golemui.com/dx/form-definition/reference/gui-actions.md · displays
  https://golemui.com/dx/form-definition/reference/gui-displays.md · layouts
  https://golemui.com/dx/form-definition/reference/gui-layouts.md · selectors
  https://golemui.com/dx/form-definition/reference/gui-selectors.md

## Worked example

The 7-part "Rent a Car" tutorial builds one real form end to end (layout, states, validation
messages, custom item renderer, async search + debounce, submit):
`https://golemui.com/dx/getting-started/rent-a-car-{introduction|form|states|messages|renderer|search|submitting}.md`
