# @golemui/dx

The generic form-authoring (DX) pipeline behind GolemUI widget sets.

This package contains the widget-set-independent machinery that turns a
developer-friendly form definition (shortcut entries plus selectors) into a
core `Form` ready for the GolemUI runtime:

- The item type registry (`createItemTypeRegistry`), where a widget set
  registers one handler per widget type.
- `defineShortcutType`, the one-call registration API for a widget type.
- The walk-and-map pipeline: selector resolution, widget merging, widget
  mapping, event wiring, and state expansion.
- `createDxService` and `createResolveFormInput`, the factories a widget set
  uses to build its own form-definition service.

Widget sets such as `@golemui/gui-shared` build on this package. Application
code normally does not depend on `@golemui/dx` directly; use the authoring API
of your widget set instead.
