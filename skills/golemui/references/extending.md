# GolemUI — extending

Four extension points. All are registered on the host side and referenced from the form
definition; the definition itself stays plain data. Fetch the linked page before writing any
extension — the registration contracts are precise and not guessable.

## Custom widgets

Build a widget GolemUI doesn't ship (a rating stars input, a color picker, …) and use it in a
definition via `gui.<namespace>.custom(...)` (TS) or a custom `type` (JSON — the validator
flags unknown types as advisory `warnings`, not errors).

- Start here: https://golemui.com/dx/extending/widgets/overview.md
- Per kind: input https://golemui.com/dx/extending/widgets/input-widget.md · display
  https://golemui.com/dx/extending/widgets/display-widget.md · action
  https://golemui.com/dx/extending/widgets/action-widget.md · layout
  https://golemui.com/dx/extending/widgets/layout-widget.md
- Widget events (how a custom widget talks to the form):
  https://golemui.com/dx/extending/widgets/events.md
- Sizing (how a custom widget participates in layouts):
  https://golemui.com/dx/extending/widgets/sizing.md
- Using custom widgets from a definition:
  https://golemui.com/dx/form-definition/custom-widgets.md

## Custom item renderers

Render options/rows of list-like widgets (dropdown, list) with your own markup — registered on
the host, referenced by name (e.g. `props.itemRenderer: 'carItemRenderer'` in JSON).
https://golemui.com/dx/extending/item-renderers.md

## Custom validators

Beyond the declarative rules: GolemUI validators follow `@standard-schema/spec`
(`@golemui/gui-validators`), so Zod/Valibot-style schemas plug in.
https://golemui.com/dx/extending/validators.md

## Custom middlewares

Hook into the form pipeline (transform data, intercept events) with your own middleware.
https://golemui.com/dx/extending/middlewares.md

Note: `@golemui/gui-shared` deliberately exposes only the public builder surface; adapter
contracts live in `@golemui/gui-shared/internals` and are documented as unstable. Prefer the
public entry points shown in the docs pages above.
