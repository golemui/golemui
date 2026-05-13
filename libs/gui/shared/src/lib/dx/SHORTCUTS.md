# DX Shortcuts — Architecture & Developer Guide

## Onboarding: Where to Start

If you're new to the shortcut system, **don't start by reading `inputs/`**. It's the most complex shortcut and will mislead you about what's typical. Instead, follow this progression:

### 1. Start here → `alert/`

The simplest complete shortcut. Bare entry shape, no sensible defaults, no hooks. Three files, minimal code. This is the template you'll copy for most new types.

### 2. Standard keyed type → `date-picker/` or `currency/`

Adds a data path (keyed entry shape) and sensible defaults (autoLabel, autoPlaceholder). This is the most common pattern — most widget shortcuts look like this. The props pass through from the core widget type via `extractWidgetProps`.

### 3. Compound type → `tabs/` or `accordion/`

Adds recursive children. The `buildCustomWidget` hook walks children through the pipeline and assembles them into the parent widget. `getChildren` extracts children for the walker. If your widget contains other widgets, study this pattern.

### 4. Action type → `actions/`

Adds the `afterMerge` hook for onClick wiring. This is the only type that needs post-merge processing. Moderate complexity, but the hook pattern is straightforward.

### 5. Complex outliers (understand, don't copy)

**`inputs/`** — The batch factory (`_guiInputs`) handles three sub-types (text, number, boolean) behind one API. It has its own key expansion service, type defaults service, and three decorator sub-types. This complexity exists to make the developer API ergonomic for the most common case (declaring many fields at once). You won't need any of this for a normal shortcut.

**`display/`** — Always produces a `FunctionWidget` (dynamic). The `buildCustomWidget` hook wraps the developer's render function. Unique because every display widget re-evaluates on form state changes.

**`repeater/`** — The only type that bypasses `defineShortcutType` and registers a custom `ItemTypeHandler` directly. It's both keyed (has a data path) and compound (has children) — a hybrid that doesn't fit any standard entry shape. Also implements auto-prefixing of child paths. You'll probably never need this pattern.

### Quick reference: complexity by folder

| Folder               | Complexity | Entry Shape | Hooks Used                                        | Why                                         |
| -------------------- | ---------- | ----------- | ------------------------------------------------- | ------------------------------------------- |
| `alert/`             | Minimal    | bare        | none                                              | Bare display, no defaults                   |
| `date-picker/`       | Standard   | keyed       | sensibleDefaults                                  | Typical keyed input with pass-through props |
| `currency/`          | Standard   | keyed       | sensibleDefaults                                  | Same pattern, different props               |
| `dropdown/`          | Standard   | keyed       | sensibleDefaults                                  | Same pattern                                |
| `markdown/`          | Standard   | keyed       | sensibleDefaults                                  | Same pattern                                |
| `checkbox/`          | Standard   | keyed       | sensibleDefaults                                  | Same pattern                                |
| `password/`          | Standard   | keyed       | sensibleDefaults                                  | Same pattern                                |
| `textarea/`          | Standard   | keyed       | sensibleDefaults                                  | Same pattern                                |
| `select/`            | Standard   | keyed       | sensibleDefaults                                  | Same pattern                                |
| `radiogroup/`        | Standard   | keyed       | sensibleDefaults                                  | Same pattern                                |
| `list/`              | Standard   | keyed       | sensibleDefaults                                  | Same pattern                                |
| `calendar/`          | Standard   | keyed       | sensibleDefaults                                  | Same pattern                                |
| `range-calendar/`    | Standard   | keyed       | sensibleDefaults                                  | Same pattern                                |
| `date-input/`        | Standard   | keyed       | sensibleDefaults                                  | Same pattern                                |
| `range-date-input/`  | Standard   | keyed       | sensibleDefaults                                  | Same pattern                                |
| `range-date-picker/` | Standard   | keyed       | sensibleDefaults                                  | Same pattern                                |
| `tabs/`              | Compound   | compound    | buildCustomWidget, getChildren                    | Recursive children                          |
| `accordion/`         | Compound   | compound    | buildCustomWidget, getChildren                    | Recursive children                          |
| `actions/`           | Moderate   | bare        | afterMerge                                        | onClick wiring                              |
| `display/`           | Moderate   | bare        | buildCustomWidget                                 | Always dynamic (FunctionWidget)             |
| `layouts/`           | Compound   | compound    | buildCustomWidget, getChildren                    | Recursive children                          |
| `inputs/`            | Complex    | keyed       | sensibleDefaults                                  | Batch factory, 3 sub-types, key expansion   |
| `repeater/`          | Custom     | hybrid      | buildCustomWidget, getChildren, custom parseEntry | Bypasses defineShortcutType, auto-prefixing |

---

The DX (Developer Experience) layer provides shortcuts on top of the JSON-based form framework. It has two complementary layers:

- **GUI shortcuts** (`_gui*`) define the **structure** of the form (what widgets exist, in what order).
- **GSL selectors** (`_gsl*`) define **styling and behavior** (decorators, sensible-default suppression) applied to widgets by type, tag, or ID.

Both layers flow through a unified pipeline: **SelectorResolver → WidgetMerger → WidgetMapper** to produce core `FormWidget` definitions.

## Entry Shape Convention

### Keyed entries (`entryShape: 'keyed'`)

The path is the entry's key. The factory does NOT put `path` in the decorator — the walker spreads `parsed.path` into the baseDef at runtime (itemWalker.service.ts line 82).

Used when the factory takes `(path, ...)` and produces a `{ key, def }` entry.

Example — `_guiTextInput`:

```ts
_guiTextInput('email', { placeholder: '...' });
// → items: [{ key: 'email', def: { type: 'text', placeholder: '...' } }]
// Note: NO `path` in the def object
```

Keyed types: **inputs**, **textarea**

### Bare entries (`entryShape: 'bare'`)

The path lives inside the decorator. No key wrapping — the entry IS the decorator.

Example — `_guiCalendar`:

```ts
_guiCalendar('birthDate', { minDate: '...' });
// → items: [{ type: 'calendar', path: 'birthDate', minDate: '...' }]
// Note: `path` IS in the decorator
```

Bare types: **calendar**

### Compound entries

Container types with children. No path.

Example — `_guiFlex`:

```ts
_guiFlex([...children], { direction: 'row' });
// → items: [{ def: { widgetName: 'flex', direction: 'row' }, children: [...] }]
```

Compound types: **layouts**

### Rule of thumb

- Single-widget types with `(path, ...)` signature → **keyed** (most common)
- Calendar → **bare** (legacy — the decorator IS the item)
- Container types with children → **compound**

## GSL Override Three-Level Pattern

The `override` property in a GSL config supports three modes with increasing power:

### Level 1: Static object

Same override for all matched widgets.

```ts
_gslInputs({ override: { placeholder: 'fixed value' } });
```

### Level 2: Callback on current state

Computes the override from the current widget's merged state. Receives the widget as it exists after sensible defaults and prior selectors.

```ts
_gslInputs({ override: (cur) => ({ placeholder: `Enter ${cur.path}` }) });
```

### Level 3: Callback returning runtime function

Promotes the widget to a FunctionWidget. It re-renders when form state changes. The outer callback receives `cur` (merge-time), the inner receives `params` (runtime).

```ts
_gslInputs({
  override: (cur) => (params) => ({
    placeholder: params.$form?.name ? `${cur.path} for ${params.$form.name}` : `Enter ${cur.path}`,
  }),
});
```

Level 3 is the most powerful: one selector can make every matched widget reactive.

## One Core Shape

All GUI shortcuts produce a single core shape (defined in `core/dx.domain.ts`):

**`GuiItemsShortcut`** — `{ type: 'ITEMS', itemType, items, tags }`. Sub-interfaces narrow `itemType` and `items` for each widget kind:

- `GuiInputsShortcut` (`itemType: 'INPUTS'`, `items: InputEntry[]`)
- `GuiActionsShortcut` (`itemType: 'ACTIONS'`, `items: ActionEntry[]`)
- `GuiLayoutItemsShortcut` (`itemType: 'LAYOUTS'`, `items: LayoutEntry[]`)
- `GuiDisplayItemsShortcut` (`itemType: 'DISPLAYS'`, `items: DisplayEntry[]`)

All four flow through the same `processItem` → resolver → merger → mapper pipeline in `dx.service.ts`. Layouts additionally recurse into their children after the pipeline. Displays produce function widgets that receive runtime params.

Item type constants are defined once in `core/dx.domain.ts` as type aliases (`GUI_ITEM_TYPE_INPUTS`, `GUI_ITEM_TYPE_ACTIONS`, `GUI_ITEM_TYPE_LAYOUTS`, `GUI_ITEM_TYPE_DISPLAYS`) with a runtime object `GuiItemTypes` for use in comparisons and object literals.

## Entry Shape Taxonomy

Each shortcut family uses one of three entry shapes. The shape reflects the widget's semantics — it's a deliberate design choice, not an inconsistency.

### 1. Keyed Entries — `{ key, def }`

Path is derived from the key. Multiple entries per `_gui*` call. Used when the form data path comes from the entry key.

**Used by:** Inputs (`InputEntry`). Future: select, radiogroup.

```ts
// _guiInputs({ firstName: 'string', lastName: 'string' })
// Each key → an InputEntry { key: 'firstName', def: { type: 'text' } }
```

### 2. Bare Entries — decorator or callback directly

No wrapping object. Path (if any) lives inside the decorator. One entry per `_gui*` call.

**Used by:** Actions (`ActionEntry`), Calendar (`CalendarEntry`), Displays (`DisplayEntry`).

```ts
// _guiButton({ label: 'Send', onClick: 'submit' })
// Entry is the ActionDecorator directly
```

### 3. Compound Entries — `{ def, children }`

Container with nested shortcuts. Children are structural — they're walked recursively by the pipeline.

**Used by:** Layouts (`LayoutEntry`). Future: tabs, accordion.

```ts
// _guiFlex([_guiInputs({...}), _guiButton({...})], { direction: 'row' })
// Entry is { def: { direction: 'row' }, children: [...] }
```

### Why three shapes?

Each handler declares `TEntry` in its generics to match its shape. `parseEntry(entry: TEntry)` is the type-safe boundary — it extracts `baseDef` (the decorator or callback) and optionally `path` and `children` from whatever entry shape the family uses.

There is no shared base type for entries. The shapes are intentionally different because the semantics are different. A keyed entry carries a data path in its key. A bare entry is the decorator itself. A compound entry carries children.

## Standardized Single-Widget Factory Pattern

For single-widget input-like shortcuts, use a consistent API shape:

```ts
_guiXxx(path);
_guiXxx(path, props);
_guiXxx(path, props, tags);
```

Where:

- `path` is always the first argument (`string`)
- `props` is `Partial<Omit<XDecorator, 'type'>>`
- `tags` is optional `string[]`
- `type` is injected internally by the factory, never set by the form author

Current examples:

- `_guiCalendar(path, props?, tags?)`
- `_guiTextarea(path, props?, tags?)`

## Type-Specific Input Factories

In addition to `_guiInputs`, use singular factories when defining one field and you want perfect type-specific IntelliSense:

- `_guiTextInput(path, props?, tags?)`
- `_guiNumberInput(path, props?, tags?)`
- `_guiBooleanInput(path, props?, tags?)`

These avoid union ambiguity and remove the need for manual `{ type: ... }` in user code.

Each factory also supports dynamic callback form:

- `_guiTextInput(path, callback, tags?)`
- `_guiNumberInput(path, callback, tags?)`
- `_guiBooleanInput(path, callback, tags?)`

Where `callback(params)` returns partial props for that specific input type.

## `_guiInputs` Scope (Batch Shorthands Only)

`_guiInputs` is intentionally limited to simple batch declarations:

- `'string' | 'number' | 'boolean'`
- tag tuples like `['string', 'required']`

It does **not** accept object literals or callbacks. For any per-field customization (props, validators, runtime callback), use the type-specific factories above.

## Demo Requirement for New Shortcut Types

Every new shortcut type must ship with at least one demo under `src/app/demos/` and be registered in:

- `src/app/demos/index.ts`
- `src/app/app.tsx` (`formRegistry.registerAll([...])`)

If a shortcut has no visible demo, it is not considered complete.

## Folder Structure

```
services/dx/
├── core/                              ← Shared DX infrastructure
│   ├── dx.domain.ts                   ← Core shape (GuiItemsShortcut), type aliases (GUI_ITEM_TYPE_*),
│   │                                    runtime constants (GuiItemTypes), GSL selector types,
│   │                                    MergeResult, ValidGuiShortcut union
│   ├── selectorResolver.service.ts    ← Resolves GSL selectors for a given item
│   ├── widgetMerger.service.ts        ← Merges decorators + applies sensible defaults
│   └── widgetMapper.service.ts        ← Maps decorator → core FormWidget
│
├── shortcuts/                         ← Pluggable shortcut folders
│   ├── inputs/                        ← Input shortcut (text, number, boolean)
│   │   ├── inputs.domain.ts           ← InputDecorator, InputEntry, GuiInputsShortcut, GslInputsConfig
│   │   ├── guiInputs.impl.ts          ← _guiInputs()
│   │   ├── guiTextInput.impl.ts       ← _guiTextInput()
│   │   ├── guiNumberInput.impl.ts     ← _guiNumberInput()
│   │   ├── guiBooleanInput.impl.ts    ← _guiBooleanInput()
│   │   ├── register.ts                ← _gslInputs(), _gslInputByUid()
│   │   ├── gslInputSubtypes.ts        ← _gslTextInputs(), _gslNumberInputs(), _gslBooleanInputs()
│   │   ├── inputSensibleDefaults.service.ts ← processAutomaticLabels, processAutomaticPlaceholders
│   │   ├── inputDefsByKey.service.ts   ← Field expansion (string shortcuts → InputDecorator)
│   │   └── inputTypeDefaults.service.ts ← explodeShortcut('string' → TextDataInputDecorator)
│   │
│   ├── actions/                       ← Action shortcut (buttons)
│   │   ├── actions.domain.ts          ← ActionDecorator, ActionEntry, GuiActionsShortcut, GslActionsConfig
│   │   ├── guiActions.impl.ts         ← _guiButton(), _guiSubmitButton()
│   │   └── register.ts                ← _gslActions(), _gslActionByUid()
│   │
│   ├── layouts/                       ← Layout shortcut (flex / grid families)
│   │   ├── layouts.domain.ts          ← LayoutDecorator, LayoutEntry, GuiLayoutItemsShortcut, GslLayoutsConfig
│   │   ├── guiFlex.impl.ts            ← _guiFlex(), _guiHorizontalFlex(), _guiVerticalFlex(), _guiGrid(), _guiHorizontalGrid(), _guiVerticalGrid()
│   │   └── register.ts                ← _gslLayouts(), _gslLayoutByUid()
│   │
│   ├── display/                       ← Display shortcut (custom renderers)
│   │   ├── display.domain.ts          ← DisplayDecorator, DisplayEntry, GuiDisplayItemsShortcut, GslDisplaysConfig
│   │   ├── guiDisplay.impl.ts         ← _guiDisplay()
│   │   └── register.ts                ← _gslDisplays(), _gslDisplayByUid()
│   │
│   └── scopes/                        ← Scope chain + legacy primitives
│       ├── scopeChain.ts              ← ScopeChain class — `gui.selectors` root
│       ├── gslTag.impl.ts             ← _gslTag()  (internal, focus-closeout removal)
│       └── gslStates.impl.ts          ← _gslStates() (internal, focus-closeout removal)
│
├── dx.service.ts                      ← Orchestration: walks GUI tree, calls pipeline
├── formDef.domain.ts                  ← Base WidgetItemDecorator + DxDefinitions + re-exports
└── SHORTCUTS.md                       ← This file
```

## Existing Shortcuts — Reference Implementation Map

A `--` means the shortcut does not implement that piece.

| Piece                           | Inputs                                                                                | Actions                                                              | Layouts                                                                                                    | Display                                        |
| ------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **Folder**                      | `inputs/`                                                                             | `actions/`                                                           | `layouts/`                                                                                                 | `display/`                                     |
| **Core shape**                  | `GuiItemsShortcut`                                                                    | `GuiItemsShortcut`                                                   | `GuiItemsShortcut`                                                                                         | `GuiItemsShortcut`                             |
| **Sub-interface**               | `GuiInputsShortcut`                                                                   | `GuiActionsShortcut`                                                 | `GuiLayoutItemsShortcut`                                                                                   | `GuiDisplayItemsShortcut`                      |
| **Entry type**                  | `InputEntry` (keyed: `{key, def}`)                                                    | `ActionEntry` (bare: decorator or callback)                          | `LayoutEntry` (`{def, children}`)                                                                          | `DisplayEntry` (bare: `DisplayDecorator`)      |
| **Decorator type**              | `InputDecorator` (Text, Number, Boolean)                                              | `ActionDecorator`                                                    | `LayoutDecorator`                                                                                          | `DisplayDecorator`                             |
| **GUI shortcut fn**             | `_guiInputs(shorthands/tags)`, `_guiTextInput`, `_guiNumberInput`, `_guiBooleanInput` | `_guiButton`, `_guiSubmitButton`                                     | `_guiFlex`, `_guiHorizontalFlex`, `_guiVerticalFlex`, `_guiGrid`, `_guiHorizontalGrid`, `_guiVerticalGrid` | `_guiDisplay(renderFn)`                        |
| **GSL widget selector fn**      | `_gslInputs(config)`                                                                  | `_gslActions(config)`                                                | `_gslLayouts(config)`                                                                                      | `_gslDisplays(config)`                         |
| **GSL by-uid selector fn**      | `_gslInputByUid(uid, config)`                                                         | `_gslActionByUid(uid, config)`                                       | `_gslLayoutByUid(uid, config)`                                                                             | `_gslDisplayByUid(uid, config)`                |
| **GSL config type**             | `GslInputsConfig` (decorator + 2 suppress flags)                                      | `GslActionsConfig` (decorator only)                                  | `GslLayoutsConfig` (decorator only)                                                                        | `GslDisplaysConfig` (decorator only)           |
| **Sensible defaults config**    | `InputSensibleDefaultsConfig`                                                         | `ActionSensibleDefaultsConfig` (empty)                               | `LayoutSensibleDefaultsConfig` (empty)                                                                     | `DisplaySensibleDefaultsConfig` (empty)        |
| **Sensible defaults processor** | `InputSensibleDefaultsService`                                                        | --                                                                   | --                                                                                                         | --                                             |
| **Mapper fn**                   | `mapToInputWidget` (text→textinput, number→number, boolean→toggle)                    | `mapToActionWidget` (always button)                                  | `mapToLayoutWidget` (defaults to flex)                                                                     | `mapToDisplayWidget` (renderer)                |
| **Type defaults / helpers**     | `inputDefsByKey.service`, `inputTypeDefaults.service`                                 | --                                                                   | --                                                                                                         | --                                             |
| **Resolver rollup**             | `rollUpInputSensibleDefaults`                                                         | -- (empty `{}`)                                                      | -- (empty `{}`)                                                                                            | -- (empty `{}`)                                |
| **Merger wiring**               | `if (itemType === 'INPUTS')` → `applyInputSensibleDefaults`                           | --                                                                   | --                                                                                                         | --                                             |
| **DxService special handling**  | `parseFieldKey` (path from key)                                                       | `extractOnClickFromMergeResult`, `wireOnClick`, `countSubmitButtons` | `processLayoutItem` (recurse children)                                                                     | `processDisplayItem` (wrap as function widget) |

### Key Observations

1. **All four widget types** now flow through the same unified `processItem` pipeline.
2. **Inputs** is the most complete implementation — use it as the primary reference.
3. **Actions** has a by-uid selector and action-specific post-processing (`onClick` wiring) but no sensible defaults processor.
4. **Layouts** flow through the pipeline and additionally recurse into their children. They support both tag/scope selectors (`_gslLayouts`) and by-uid selectors (`_gslLayoutByUid`).
5. **Displays** flow through the pipeline and produce function widgets. They support tag/scope selectors (`_gslDisplays`). Plain functions passed in `formDef` are auto-wrapped via `_guiDisplay`.
6. **Not all pieces are required** — the minimum for a new item type is: Decorator + Entry type alias + `GuiXxxShortcut` sub-interface + mapper fn + `ValidGuiShortcut` union entry.

## How to Add a New Item Shortcut (Phase 5+)

Phase 5 introduced three shared helpers that remove almost all registration boilerplate:

- `DefOrCallback<D>`, `GslConfigBase<D>`, `GuiShortcutOf<Type, Entry>` in `core/dxUtilityTypes.ts`
- `createGslSelector<D, TConfig>(itemType)` in `core/dxUtilityTypes.ts`
- `defineShortcutType<TEntry, TDecorator, TConfig>(config)` in `core/defineShortcutType.ts`

### Minimal files now

#### Bare-entry type (calendar/action/display-like)

1. `{type}.domain.ts` — decorator + `GslConfig` + entry + gui shortcut type aliases
2. `gui{Type}.impl.ts` — hand-crafted ergonomic `_gui*` function
3. `register.ts` — one `defineShortcutType(...)` call + exported `_gsl*` selector

#### Keyed-entry type (inputs-like)

Same 3 files. In `defineShortcutType`, use `entryShape: 'keyed'`.

#### Complex type with hooks (layouts/actions/displays)

Same 3 files. Add only the hooks you need in `defineShortcutType`:

- `afterMerge` (actions)
- `buildCustomWidget` (layouts/displays)
- `getChildren` (layouts)

### Copy-paste template — simplest bare type (no sensible defaults)

`myType.domain.ts`

```ts
import type { DxCommonFields } from '../../core/dxBase.types';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '../../core/dxUtilityTypes';

export interface MyTypeDecorator extends DxCommonFields {
  type: 'myType';
}

export type GslMyTypeConfig = GslConfigBase<MyTypeDecorator>;
export type MyTypeEntry = DefOrCallback<MyTypeDecorator>;
export type GuiMyTypeShortcut = GuiShortcutOf<'MY_TYPE', MyTypeEntry>;
```

`guiMyType.impl.ts`

```ts
import type { GuiMyTypeShortcut, MyTypeEntry } from './myType.domain';

export const _guiMyType = (entry: MyTypeEntry, tags?: string[]): GuiMyTypeShortcut => ({
  type: 'ITEMS',
  itemType: 'MY_TYPE',
  items: [entry],
  tags: tags ?? [],
});
```

`register.ts`

```ts
import { defineShortcutType } from '../../core/defineShortcutType';
import { createGslSelector } from '../../core/dxUtilityTypes';
import type { GslMyTypeConfig, MyTypeDecorator, MyTypeEntry } from './myType.domain';

defineShortcutType<MyTypeEntry, MyTypeDecorator>({
  itemType: 'MY_TYPE',
  entryShape: 'bare',
  mapToWidget: (def) => ({
    uid: def.uid ?? '',
    kind: 'display',
    type: 'renderer',
    props: {},
  }),
});

export const _gslMyType = createGslSelector<MyTypeDecorator, GslMyTypeConfig>('MY_TYPE');
```

### Notes

- Keep `_gui*` factories hand-crafted for API ergonomics.
- `defineShortcutType` already handles registration (`registerItemType`) internally.
- Preserve existing behavior in `mapToWidget`/hooks when migrating old types — only ceremony should change.
