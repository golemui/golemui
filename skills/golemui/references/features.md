# GolemUI — features index

One entry per feature: what it is, when to reach for it, and the doc URL. Overview of everything
the form component accepts: https://golemui.com/json/features/overview.md

- **Validators** — declarative rules on a widget (`required`, `minLength`, `format: 'email'`,
  `minimum`, `minItems`, …) with per-rule custom `messages`. Every validator has an explicit
  `type`, for example `"validator": { "type": "string", "required": true }`.
  https://golemui.com/json/features/validators.md
- **States** - named reactive conditions (`"states": { "family": "$form.type === 'family'" }`)
  gating visibility (`"include": { "in": [...] }` / `"exclude": { "from": [...] }`) and
  per-state prop overrides. Declared in the top-level `states` of the form document.
  Index: https://golemui.com/json/features/states.md · include/exclude:
  https://golemui.com/json/features/states/include-exclude.md · per-state properties:
  https://golemui.com/json/features/states/properties.md · inline `when`:
  https://golemui.com/json/features/states/inline-when.md · composing:
  https://golemui.com/json/features/states/composing.md
- **Form events** - `formSubmit`, `formHealth` (validity), `formEvent` (widget -> host events).
  A widget names its events under `on` (`load`, `change`, `filter`, `blur`, `click`), for
  example `"on": { "click": "save" }`. The host handles each name in its `formEvent` handler.
  Every event carries `widget` (`{ uid, type, path? }`), the widget that sent it, so one handler
  can serve many widgets; `path` is set for inputs only. An event from a widget inside a repeater
  row also carries `row` (`{ index, indexes, path }`), so the host can tell the rows apart, and
  its `widget.uid` and `widget.path` are the ones of the row (`name[1]`, `users.1.name`).
  https://golemui.com/json/features/events.md
- **Runtime methods** — imperative API on the form component instance (read/patch values,
  trigger validation, react to runtime changes). `setData`, `setMeta` and `setHealth`;
  `setHealth({ status: 'errored', code, message })` freezes the form and shows the
  `formHealthBoundary` until `setHealth({ status: 'ok' })` (codes below 1000 belong to the core).
  Per-framework handles: `framework-setup.md`.
  https://golemui.com/json/features/runtime-methods.md
- **Widget loaders** — async population of a widget's options/data (e.g. load dropdown items
  from an API, with debounced filtering). https://golemui.com/json/features/widget-loaders.md
- **Item renderers** — custom rendering of options/rows inside list-like widgets (dropdown,
  list, …), registered on the host and referenced by name.
  https://golemui.com/json/features/item-renderers.md
- **Middlewares** — intercept/transform form data and behavior around the form lifecycle.
  https://golemui.com/json/features/middlewares.md
- **i18n** — translating labels, placeholders, and validation messages.
  https://golemui.com/json/features/i18n.md
- **String interpolation** — `{{ }}` templating inside widget text reading the reactive scope
  (`$form.<path>`, `$meta`, `$errors`). https://golemui.com/json/features/string-interpolation.md
- **Dependencies** — declaring data dependencies between fields (a field's options/value
  reacting to another field). https://golemui.com/json/features/dependencies.md
- **Host functions** - pure functions that the host passes in the `functions` entry of the
  config. Expressions call them through `$fn`, for example
  `"text": "Total: {{ $fn.grandTotal($form.lineItems) }}"`.
  https://golemui.com/json/features/host-functions.md
- **Host services** — services the library does not ship, injected by the host through the
  `dependencies` entry of the init config: `markdown` (`{ parse }` for the markdown widgets) and
  `uploadService` (`{ upload, remove? }` for `fileUpload`/`multiFileUpload`). Passed by reference,
  never stored in form data; keep the object identity stable. Not the field-to-field
  "Dependencies" feature above. MCP: `get_concept({ concept: "host-services" })`.
  The markdown widgets insert the `parse` result as HTML without sanitizing it. For markdown from
  users or stored data, `parse` must remove raw HTML and `javascript:` links (Snarkdown and Marked
  keep both, Micromark and markdown-it escape both by default). It returns `SanitizedHtml`, so
  TypeScript hosts cast the sanitized result.

## Worked example

The 7-part "Rent a Car" tutorial builds one real form end to end (layout, states, validation
messages, custom item renderer, async search + debounce, submit):
`https://golemui.com/json/getting-started/rent-a-car-{introduction|form|states|messages|renderer|search|submitting}.md`
