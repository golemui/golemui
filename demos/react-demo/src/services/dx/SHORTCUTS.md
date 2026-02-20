# DX Shortcuts — Architecture & Developer Guide

The DX (Developer Experience) layer provides shortcuts on top of the JSON-based form framework. It has two complementary layers:

- **GUI shortcuts** (`_gui*`) define the **structure** of the form (what widgets exist, in what order).
- **GSL selectors** (`_gsl*`) define **styling and behavior** (decorators, sensible-default suppression) applied to widgets by type, tag, or ID.

Both layers flow through a pipeline: **SelectorResolver → WidgetMerger → WidgetMapper** to produce core `FormWidget` definitions.

## Folder Structure

```
services/dx/
├── core/                              ← Shared DX infrastructure (framework)
│   ├── dx.domain.ts                   ← Enums, base interfaces, union types
│   ├── selectorResolver.service.ts    ← Resolves GSL selectors for a given item
│   ├── widgetMerger.service.ts        ← Merges decorators + applies sensible defaults
│   └── widgetMapper.service.ts        ← Maps decorator → core FormWidget
│
├── shortcuts/                         ← Pluggable shortcut folders
│   ├── inputs/                        ← Input shortcut (text, number, boolean)
│   │   ├── inputs.domain.ts           ← InputDecorator, GslInputsConfig, InputSensibleDefaultsConfig, GuiFieldsShortcut
│   │   ├── guiInputs.impl.ts          ← _guiInputs()
│   │   ├── gslInputs.impl.ts          ← _gslInputs()
│   │   ├── inputSensibleDefaults.service.ts ← processAutomaticLabels, processAutomaticPlaceholders
│   │   ├── inputDefsByKey.service.ts   ← Field expansion (string shortcuts → InputDecorator)
│   │   └── inputTypeDefaults.service.ts ← explodeShortcut('string' → TextDataInputDecorator)
│   │
│   ├── actions/                       ← Action shortcut (buttons)
│   │   ├── actions.domain.ts          ← ActionDecorator, GslActionsConfig, GuiActionsShortcut
│   │   ├── guiActions.impl.ts         ← _guiButtons(), _guiButton(), _guiSubmitButton()
│   │   ├── gslActions.impl.ts         ← _gslActions()
│   │   └── gslActionById.impl.ts      ← _gslActionById()
│   │
│   ├── layouts/                       ← Layout shortcut (stacks)
│   │   ├── layouts.domain.ts          ← LayoutDecorator, GslLayoutByIdConfig, GuiLayoutShortcut
│   │   ├── guiStack.impl.ts           ← _guiStack(), _guiHorizontalStack(), _guiVerticalStack()
│   │   └── gslLayoutById.impl.ts      ← _gslLayoutById()
│   │
│   ├── display/                       ← Display shortcut (custom renderers)
│   │   ├── display.domain.ts          ← GuiDisplayShortcut
│   │   └── guiDisplay.impl.ts         ← _guiDisplay()
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
| **Decorator type** | `InputDecorator` (Text, Number, Boolean) | `ActionDecorator` | `LayoutDecorator` | -- |
| **GUI shortcut fn** | `_guiInputs(defs)` | `_guiButtons`, `_guiButton`, `_guiSubmitButton` | `_guiStack`, `_guiHorizontalStack`, `_guiVerticalStack` | `_guiDisplay(renderFn)` |
| **GUI shortcut type** | `GuiFieldsShortcut` (ITEMS/INPUTS) | `GuiActionsShortcut` (ITEMS/ACTIONS) | `GuiLayoutShortcut` (LAYOUT) | `GuiDisplayShortcut` (DISPLAY) |
| **GSL widget selector fn** | `_gslInputs(config)` | `_gslActions(config)` | -- | -- |
| **GSL by-id selector fn** | -- | `_gslActionById(id, config)` | `_gslLayoutById(id, config)` | -- |
| **GSL config type** | `GslInputsConfig` (decorator + 2 suppress flags) | `GslActionsConfig` (decorator only) | `GslLayoutByIdConfig` (decorator only) | -- |
| **Sensible defaults config** | `InputSensibleDefaultsConfig` | `ActionSensibleDefaultsConfig` (empty) | `LayoutSensibleDefaultsConfig` (empty) | -- |
| **Sensible defaults processor** | `InputSensibleDefaultsService` | -- | -- | -- |
| **Mapper fn** | `mapToInputWidget` (text→textinput, number→number, boolean→toggle) | `mapToActionWidget` (always button) | `mapToLayoutWidget` (defaults to flex) | -- (inline in dx.service) |
| **Type defaults / helpers** | `inputDefsByKey.service`, `inputTypeDefaults.service` | -- | -- | -- |
| **Resolver rollup** | `rollUpInputSensibleDefaults` | -- (empty `{}`) | -- (empty `{}`) | -- |
| **Merger wiring** | `if (itemType === 'INPUTS')` → `applyInputSensibleDefaults` | -- | -- | -- |
| **DxService special handling** | `parseFieldKey` (path from key) | `extractOnClickFromMergeResult`, `wireOnClick`, `countSubmitButtons` | `walkAndMap` handles LAYOUT inline | `walkAndMap` handles DISPLAY inline |

### Key Observations

1. **Inputs** is the most complete implementation — use it as the primary reference.
2. **Actions** has a by-id selector and action-specific post-processing (`onClick` wiring) but no sensible defaults processor.
3. **Layouts** only has a by-id selector and is handled inline in `walkAndMap`.
4. **Display** has no GSL support and is fully inline in `dx.service.ts`.
5. **Not all pieces are required** — the minimum is: decorator type + GUI shortcut fn + mapper fn + `ValidGuiShortcut` union entry.

## How to Add a New Shortcut

This guide uses `calendar` as a concrete example, cross-referencing `inputs` as the reference.

### Step 1: Create the shortcut folder

Create `services/dx/calendar/` with:

| File | Purpose | Reference |
|------|---------|-----------|
| `calendar.domain.ts` | Decorator, GSL config, GUI shortcut, sensible defaults config | `inputs/inputs.domain.ts` |
| `guiCalendar.impl.ts` | `_guiCalendar()` | `inputs/guiInputs.impl.ts` |
| `gslCalendar.impl.ts` | `_gslCalendar()` | `inputs/gslInputs.impl.ts` |
| `calendarSensibleDefaults.service.ts` | Auto-label processor | `inputs/inputSensibleDefaults.service.ts` |
| `calendarMapper.service.ts` | `CalendarDecorator` → `InputWidget` | `core/widgetMapper.service.ts` |

### Step 2: Define domain types

In `calendar.domain.ts`:

```typescript
// 1. Decorator
export interface CalendarDecorator extends WidgetItemDecorator {
  type: 'calendar';
  path?: string;
  label?: string | null;
  minDate?: string;
  maxDate?: string;
}

// 2. Sensible Defaults Config
export interface CalendarSensibleDefaultsConfig {
  suppressAutomaticLabels?: boolean;
}

// 3. GSL Config
export interface GslCalendarConfig {
  decorator?: Partial<CalendarDecorator> | GslCalendarDecoratorCallback;
  suppressAutomaticLabels?: boolean;
}

// 4. GUI Shortcut
export interface GuiCalendarShortcut extends GuiItemsShortcut {
  itemsType: GuiItemsShortcutType.CALENDAR;
  items: ReadyToMapCalendarDef[];
}
```

### Step 3: Implement `_guiCalendar` and `_gslCalendar`

- `_guiCalendar(defs)` → returns `GuiCalendarShortcut` with `itemsType: CALENDAR`
- `_gslCalendar(config)` → returns `GslWidgetSelector` with `selectorType: CALENDAR`

### Step 4: Implement sensible defaults processor

Follow `InputSensibleDefaultsService` pattern: check if value exists → check if suppressed → fill default.

### Step 5: Implement the mapper

`mapToCalendarWidget(def)` → core `InputWidget` with `type: 'calendar'`, mapping decorator props to `CalendarProps`.

### Step 6: Register in core

| File | What to add | Reference |
|------|-------------|-----------|
| `core/dx.domain.ts` | `'CALENDAR'` to `GslItemType` | `'INPUTS'` |
| `core/dx.domain.ts` | `CALENDAR` to `GslWidgetSelectorType` | `INPUTS = 'INPUTS'` |
| `core/dx.domain.ts` | `GuiCalendarShortcut` to `ValidGuiShortcut` | `GuiFieldsShortcut` |
| `core/dx.domain.ts` | `GuiItemsShortcutType.CALENDAR` | `INPUTS = 'INPUTS'` |
| `core/dx.domain.ts` | `aggregatedCalendarSensibleDefaults` to `ResolvedSelectors` | `aggregatedInputSensibleDefaults` |
| `core/selectorResolver.service.ts` | case `'CALENDAR'` in `itemTypeToWidgetSelectorType` + rollup | `case 'INPUTS'` |
| `core/widgetMerger.service.ts` | `if (itemType === 'CALENDAR')` → apply sensible defaults | `if (itemType === 'INPUTS')` |
| `core/widgetMapper.service.ts` | case `'CALENDAR'` in `mapStaticDef` | `case 'INPUTS'` |
| `dx.service.ts` | case in `processItem` if needed | `if (itemType === INPUTS)` |

### Checklist

- [ ] Create `calendar/` folder with domain, gui, gsl, sensible defaults, mapper files
- [ ] Add enum values to `GslWidgetSelectorType`, `GuiItemsShortcutType`, `GslItemType`
- [ ] Add GUI shortcut to `ValidGuiShortcut` union
- [ ] Add sensible defaults config to `ResolvedSelectors`
- [ ] Wire `selectorResolver` (type mapping + rollup)
- [ ] Wire `widgetMerger` (sensible defaults application)
- [ ] Wire `widgetMapper` (decorator-to-widget mapping)
- [ ] Wire `dx.service.ts` if needed
- [ ] Add demo(s) to validate
