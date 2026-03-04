# DX Shortcuts — Architecture & Developer Guide

The DX (Developer Experience) layer provides shortcuts on top of the JSON-based form framework. It has two complementary layers:

- **GUI shortcuts** (`_gui*`) define the **structure** of the form (what widgets exist, in what order).
- **GSL selectors** (`_gsl*`) define **styling and behavior** (decorators, sensible-default suppression) applied to widgets by type, tag, or ID.

Both layers flow through a unified pipeline: **SelectorResolver → WidgetMerger → WidgetMapper** to produce core `FormWidget` definitions.

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
// _guiStack([_guiInputs({...}), _guiButton({...})], { direction: 'horizontal' })
// Entry is { def: { direction: 'horizontal' }, children: [...] }
```

### Why three shapes?

Each handler declares `TEntry` in its generics to match its shape. `parseEntry(entry: TEntry)` is the type-safe boundary — it extracts `baseDef` (the decorator or callback) and optionally `path` and `children` from whatever entry shape the family uses.

There is no shared base type for entries. The shapes are intentionally different because the semantics are different. A keyed entry carries a data path in its key. A bare entry is the decorator itself. A compound entry carries children.

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
│   │   ├── gslInputs.impl.ts          ← _gslInputs()
│   │   ├── inputSensibleDefaults.service.ts ← processAutomaticLabels, processAutomaticPlaceholders
│   │   ├── inputDefsByKey.service.ts   ← Field expansion (string shortcuts → InputDecorator)
│   │   └── inputTypeDefaults.service.ts ← explodeShortcut('string' → TextDataInputDecorator)
│   │
│   ├── actions/                       ← Action shortcut (buttons)
│   │   ├── actions.domain.ts          ← ActionDecorator, ActionEntry, GuiActionsShortcut, GslActionsConfig
│   │   ├── guiActions.impl.ts         ← _guiButtons(), _guiButton(), _guiSubmitButton()
│   │   ├── gslActions.impl.ts         ← _gslActions()
│   │   └── gslActionById.impl.ts      ← _gslActionById()
│   │
│   ├── layouts/                       ← Layout shortcut (stacks)
│   │   ├── layouts.domain.ts          ← LayoutDecorator, LayoutEntry, GuiLayoutItemsShortcut, GslLayoutsConfig
│   │   ├── guiStack.impl.ts           ← _guiStack(), _guiHorizontalStack(), _guiVerticalStack()
│   │   ├── gslLayouts.impl.ts         ← _gslLayouts()
│   │   └── gslLayoutById.impl.ts      ← _gslLayoutById()
│   │
│   ├── display/                       ← Display shortcut (custom renderers)
│   │   ├── display.domain.ts          ← DisplayDecorator, DisplayEntry, GuiDisplayItemsShortcut, GslDisplaysConfig
│   │   ├── guiDisplay.impl.ts         ← _guiDisplay()
│   │   └── gslDisplays.impl.ts        ← _gslDisplays()
│   │
│   └── scopes/                        ← Scope selectors (root, tag)
│       ├── scopes.domain.ts           ← GslScopeSelector, GslRootDefaults
│       ├── gslRoot.impl.ts            ← _gslRoot()
│       └── gslTag.impl.ts             ← _gslTag()
│
├── dx.service.ts                      ← Orchestration: walks GUI tree, calls pipeline
├── formDef.domain.ts                  ← Base WidgetItemDecorator + DxDefinitions + re-exports
└── SHORTCUTS.md                       ← This file
```

## Existing Shortcuts — Reference Implementation Map

A `--` means the shortcut does not implement that piece.

| Piece | Inputs | Actions | Layouts | Display |
|-------|--------|---------|---------|---------|
| **Folder** | `inputs/` | `actions/` | `layouts/` | `display/` |
| **Core shape** | `GuiItemsShortcut` | `GuiItemsShortcut` | `GuiItemsShortcut` | `GuiItemsShortcut` |
| **Sub-interface** | `GuiInputsShortcut` | `GuiActionsShortcut` | `GuiLayoutItemsShortcut` | `GuiDisplayItemsShortcut` |
| **Entry type** | `InputEntry` (keyed: `{key, def}`) | `ActionEntry` (bare: decorator or callback) | `LayoutEntry` (`{def, children}`) | `DisplayEntry` (bare: `DisplayDecorator`) |
| **Decorator type** | `InputDecorator` (Text, Number, Boolean) | `ActionDecorator` | `LayoutDecorator` | `DisplayDecorator` |
| **GUI shortcut fn** | `_guiInputs(defs)` | `_guiButtons`, `_guiButton`, `_guiSubmitButton` | `_guiStack`, `_guiHorizontalStack`, `_guiVerticalStack` | `_guiDisplay(renderFn)` |
| **GSL widget selector fn** | `_gslInputs(config)` | `_gslActions(config)` | `_gslLayouts(config)` | `_gslDisplays(config)` |
| **GSL by-id selector fn** | -- | `_gslActionById(id, config)` | `_gslLayoutById(id, config)` | -- |
| **GSL config type** | `GslInputsConfig` (decorator + 2 suppress flags) | `GslActionsConfig` (decorator only) | `GslLayoutsConfig` (decorator only) | `GslDisplaysConfig` (decorator only) |
| **Sensible defaults config** | `InputSensibleDefaultsConfig` | `ActionSensibleDefaultsConfig` (empty) | `LayoutSensibleDefaultsConfig` (empty) | `DisplaySensibleDefaultsConfig` (empty) |
| **Sensible defaults processor** | `InputSensibleDefaultsService` | -- | -- | -- |
| **Mapper fn** | `mapToInputWidget` (text→textinput, number→number, boolean→toggle) | `mapToActionWidget` (always button) | `mapToLayoutWidget` (defaults to flex) | `mapToDisplayWidget` (renderer) |
| **Type defaults / helpers** | `inputDefsByKey.service`, `inputTypeDefaults.service` | -- | -- | -- |
| **Resolver rollup** | `rollUpInputSensibleDefaults` | -- (empty `{}`) | -- (empty `{}`) | -- (empty `{}`) |
| **Merger wiring** | `if (itemType === 'INPUTS')` → `applyInputSensibleDefaults` | -- | -- | -- |
| **DxService special handling** | `parseFieldKey` (path from key) | `extractOnClickFromMergeResult`, `wireOnClick`, `countSubmitButtons` | `processLayoutItem` (recurse children) | `processDisplayItem` (wrap as function widget) |

### Key Observations

1. **All four widget types** now flow through the same unified `processItem` pipeline.
2. **Inputs** is the most complete implementation — use it as the primary reference.
3. **Actions** has a by-id selector and action-specific post-processing (`onClick` wiring) but no sensible defaults processor.
4. **Layouts** flow through the pipeline and additionally recurse into their children. They support both tag/scope selectors (`_gslLayouts`) and by-id selectors (`_gslLayoutById`).
5. **Displays** flow through the pipeline and produce function widgets. They support tag/scope selectors (`_gslDisplays`). Plain functions passed in `formDef` are auto-wrapped via `_guiDisplay`.
6. **Not all pieces are required** — the minimum for a new item type is: Decorator + Entry type alias + `GuiXxxShortcut` sub-interface + mapper fn + `ValidGuiShortcut` union entry.

## How to Add a New Item Shortcut

This guide uses `calendar` as a concrete example, cross-referencing `inputs` as the reference.

### Step 1: Create the shortcut folder

Create `services/dx/shortcuts/calendar/` with:

| File | Purpose | Reference |
|------|---------|-----------|
| `calendar.domain.ts` | Decorator, entry type, sub-interface, GSL config, sensible defaults config | `inputs/inputs.domain.ts` |
| `guiCalendar.impl.ts` | `_guiCalendar()` | `inputs/guiInputs.impl.ts` |
| `gslCalendar.impl.ts` | `_gslCalendar()` | `inputs/gslInputs.impl.ts` |
| `calendarSensibleDefaults.service.ts` | Auto-label processor | `inputs/inputSensibleDefaults.service.ts` |

### Step 2: Define domain types

In `calendar.domain.ts`:

```typescript
import { GuiItemsShortcut } from '../../core/dx.domain';
// Import or define a GUI_ITEM_TYPE_CALENDAR type alias

// 1. Decorator
export interface CalendarDecorator extends WidgetItemDecorator {
  type: 'calendar';
  path?: string;
  label?: string | null;
  minDate?: string;
  maxDate?: string;
}

// 2. Entry type
export type CalendarDefOrCallback = CalendarDecorator | ((params: DxRuntimeParams) => Partial<CalendarDecorator>);
export type CalendarEntry = { key: string; def: CalendarDefOrCallback };

// 3. Sub-interface
export interface GuiCalendarShortcut extends GuiItemsShortcut {
  itemType: GUI_ITEM_TYPE_CALENDAR;
  items: CalendarEntry[];
}

// 4. Sensible Defaults Config
export interface CalendarSensibleDefaultsConfig {
  suppressAutomaticLabels?: boolean;
}

// 5. GSL Config
export interface GslCalendarConfig {
  decorator?: Partial<CalendarDecorator> | GslCalendarDecoratorCallback;
  suppressAutomaticLabels?: boolean;
}
```

### Step 3: Implement `_guiCalendar` and `_gslCalendar`

- `_guiCalendar(defs)` → returns `GuiCalendarShortcut` with `itemType: GuiItemTypes.CALENDAR`
- `_gslCalendar(config)` → returns `GslWidgetSelector` with `selectorType: GslWidgetSelectorType.CALENDAR`

### Step 4: Implement sensible defaults processor

Follow `InputSensibleDefaultsService` pattern: check if value exists → check if suppressed → fill default.

### Step 5: Register in core

| File | What to add | Reference |
|------|-------------|-----------|
| `core/dx.domain.ts` | `GUI_ITEM_TYPE_CALENDAR` type alias + add to `GuiItemType` union + add to `GuiItemTypes` object | `GUI_ITEM_TYPE_INPUTS` |
| `core/dx.domain.ts` | Add `CalendarEntry` to `GuiItemsShortcut.items` union | `InputEntry` |
| `core/dx.domain.ts` | Add `GuiCalendarShortcut` to `ValidGuiShortcut` union | `GuiInputsShortcut` |
| `core/dx.domain.ts` | `'CALENDAR'` to `GslItemType` | `'INPUTS'` |
| `core/dx.domain.ts` | `CALENDAR` to `GslWidgetSelectorType` | `INPUTS = 'INPUTS'` |
| `core/dx.domain.ts` | `aggregatedCalendarSensibleDefaults` to `ResolvedSelectors` | `aggregatedInputSensibleDefaults` |
| `core/selectorResolver.service.ts` | case `'CALENDAR'` in `itemTypeToWidgetSelectorType` + rollup | `case 'INPUTS'` |
| `core/widgetMerger.service.ts` | `if (itemType === 'CALENDAR')` → apply sensible defaults | `if (itemType === 'INPUTS')` |
| `core/widgetMapper.service.ts` | case `'CALENDAR'` in `mapStaticDef` | `case 'INPUTS'` |
| `dx.service.ts` | Handle `CalendarEntry` in `processItem` if keyed entry logic differs | `InputEntry` handling |

### Checklist

- [ ] Create `calendar/` folder with domain, gui, gsl, sensible defaults files
- [ ] Define `CalendarDecorator`, `CalendarEntry`, `GuiCalendarShortcut`
- [ ] Add `GUI_ITEM_TYPE_CALENDAR` to type aliases and `GuiItemTypes` object
- [ ] Add `GuiCalendarShortcut` to `ValidGuiShortcut` union
- [ ] Add `CalendarEntry` to `GuiItemsShortcut.items` union
- [ ] Add sensible defaults config to `ResolvedSelectors`
- [ ] Wire `selectorResolver` (type mapping + rollup)
- [ ] Wire `widgetMerger` (sensible defaults application)
- [ ] Wire `widgetMapper` (decorator-to-widget mapping)
- [ ] Wire `dx.service.ts` if needed
- [ ] Add demo(s) to validate
