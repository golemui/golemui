# Migrating to GolemUI 2.0

In 2.0, `@golemui/gui-components` is a standalone project. Its web components work in plain HTML or
any framework, without the form engine. To get there, we changed the stylesheets, the layouts, the
markup of tabs, accordions and alerts, and the events of the `gui-*` elements.

Your form definitions, including stored JSON, still render. Props that changed still work and are
marked deprecated, so you can update them when you next edit a form. Read the sections for the way
you use GolemUI:

| If you…                                                        | Read                                                     |
| -------------------------------------------------------------- | -------------------------------------------------------- |
| render forms                                                   | [Every Forms app](#every-forms-app), [Layouts](#layouts) |
| style forms with your own CSS, or select their markup in tests | [CSS and markup](#css-and-markup)                        |
| write custom widgets that render `gui-*` elements              | [Custom widgets](#custom-widgets)                        |
| build your own widget set on `@golemui/core`                   | [Custom widget sets](#custom-widget-sets)                |
| import from `@golemui/*/internals` or pin packages             | [Packages](#packages)                                    |

## Checklist

- [ ] Import `@golemui/gui-shared/forms.css` after `@golemui/gui-components/index.css`.
- [ ] Add `direction: 'row'` to every `grid` that has no `direction` and should stay a row.
- [ ] Replace `flex` layouts with `grid` (they still render, as a grid).
- [ ] Replace pixel gaps with gap steps, and check every grid that sets `justify` or `align`.
- [ ] Check your global CSS resets, which now override GolemUI's styles.
- [ ] Update CSS and test selectors that target tabs, accordions, alerts, grids or error lists.
- [ ] In custom widgets, listen for the `gui-*` events.
- [ ] In your own widget set, rename the `flex` loader to `grid`, or add a `grid` loader.

## Every Forms app

### Import the forms stylesheet

`@golemui/gui-components/index.css` no longer includes the styles of the form container, the
repeater or the invalid state of a submit button. They moved to `@golemui/gui-shared/forms.css`.

**Before:**

```ts
import '@golemui/gui-components/index.css';
```

**After:**

```ts
import '@golemui/gui-components/index.css';
import '@golemui/gui-shared/forms.css';
```

In Angular, add it to `styles` in `angular.json`:

**Before:**

```json
"styles": ["node_modules/@golemui/gui-components/lib/styles/index.css"]
```

**After:**

```json
"styles": [
  "node_modules/@golemui/gui-components/lib/styles/index.css",
  "node_modules/@golemui/gui-shared/forms.css"
]
```

Without `forms.css`, the form still works, but repeater rows lose their cards and the form loses its
reset.

### Your CSS overrides GolemUI's

GolemUI now puts all its rules in cascade layers:

```css
@layer golemui.tokens, golemui.base, golemui.components, golemui.forms, golemui.theme;
```

CSS outside a layer beats layered CSS whatever its specificity, so your overrides no longer need
selectors as specific as GolemUI's.

**Before:**

```css
.gui-form .gui-button button {
  border-radius: 0;
}
```

**After:**

```css
gui-button button {
  border-radius: 0;
}
```

The same goes for global resets. A plain `button { … }` or `a { … }` rule in your app used to lose to
the component styles, and now overrides them. To keep the 1.x result, put your resets in a layer and
declare the layer order at the top of your CSS, before the GolemUI stylesheets load:

```css
@layer reset, golemui;

@layer reset {
  button {
    all: unset;
  }
}
```

Token overrides work as before: set the `--gui-*` variables on `:root` or any ancestor.

## Layouts

2.0 replaces Flex and Grid with a single Grid layout. In a row, it lines up the labels, controls and
errors of neighbouring fields, so an error never moves the controls next to it.

### A grid without `direction` is now a stack

In 1.x, a `grid` with no `direction` laid out its children in a row. In 2.0, it stacks them, like
`direction: 'column'`. Add `direction: 'row'` to keep the row.

**Before:**

```json
{ "kind": "layout", "type": "grid", "children": [] }
```

```ts
gui.layouts.grid([firstName, lastName]);
```

**After:**

```json
{ "kind": "layout", "type": "grid", "props": { "direction": "row" }, "children": [] }
```

```ts
gui.layouts.horizontalGrid([firstName, lastName]);
```

### The grid props

| Prop        | Values                                                                   | What it does                                                                                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `direction` | `'column'` (default), `'row'`                                            | `column` stacks the children. `row` puts them on one line and splits the width by `size`.                                                                                                                      |
| `columns`   | `1` to `12`, `'auto'`                                                    | **New.** Makes a grid that wraps. A number sets that many equal columns, with `size` as the span. `'auto'` fits as many `--gui-layout-column-min` (12rem) columns as there is room for. Overrides `direction`. |
| `gap`       | `'none'`, `'xs'`, `'sm'`, `'md'` (default), `'lg'`, `'xl'`               | The space between children, from the `--gui-layout-gap-*` tokens. Replaces pixel values.                                                                                                                       |
| `justify`   | `'stretch'` (default), `'start'`, `'center'`, `'end'`, `'space-between'` | **New meaning.** In a row, `stretch` splits the width by `size`. Other values keep each child at its natural width and position the children; for example, `end` puts buttons on the right.                    |

Every grid stacks its children when the form is narrower than 480px.

### Deprecated grid props

GolemUI maps these props to the new ones, so they still work. Replace them when you next edit a
form.

#### `columnGap` and `rowGap`

Use `gap` with a step. GolemUI maps pixels to the nearest step: up to 2px is `none`, 6px `xs`, 12px
`sm`, 20px `md`, 28px `lg`, and anything larger `xl`.

**Before:**

```json
{ "direction": "row", "columnGap": 16, "rowGap": 8 }
```

**After:**

```json
{ "direction": "row", "gap": "md" }
```

#### `align`

Use `justify`. `space-around` and `space-evenly` map to `space-between`.

**Before:**

```json
{ "direction": "row", "align": "end" }
```

**After:**

```json
{ "direction": "row", "justify": "end" }
```

#### The old `justify`

Grid's old `justify` aligned the children across the row. The field anatomy does that now, so remove
it. `justify: 'stretch'` behaves as before, but `start`, `center` and `end` now position the children
along the row and keep them at their natural width.

**Before:**

```json
{ "direction": "row", "justify": "center" }
```

**After:**

```json
{ "direction": "row" }
```

#### `autoFit`

Remove it. A row with `autoFit: true`, the old default, stays a row. A row with `autoFit: false` was
a 12-column grid, which is now `columns: 12`.

**Before:**

```json
{ "direction": "row", "autoFit": false }
```

**After:**

```json
{ "columns": 12 }
```

A 1.x auto-fit row wrapped its children onto more lines when it ran out of room. A 2.0 row stays on
one line until it stacks below 480px. For a grid that wraps, use `columns: 'auto'`.

### Flex is deprecated

The `flex` layout and the `gui.layouts.flex`, `horizontalFlex` and `verticalFlex` builders are
deprecated. They still work, and render as a grid.

**Before:**

```json
{ "kind": "layout", "type": "flex", "props": { "direction": "row", "gap": 8, "align": "end" } }
```

```ts
gui.layouts.horizontalFlex([cancel, save], { gap: 8, align: 'end' });
gui.layouts.verticalFlex([name, email]);
```

**After:**

```json
{ "kind": "layout", "type": "grid", "props": { "direction": "row", "gap": "sm", "justify": "end" } }
```

```ts
gui.layouts.horizontalGrid([cancel, save], { gap: 'sm', justify: 'end' });
gui.layouts.grid([name, email]);
```

| 1.x                                           | 2.0                                         |
| --------------------------------------------- | ------------------------------------------- |
| `type: 'flex'`, `direction: 'column'` or none | `type: 'grid'`                              |
| `type: 'flex'`, `direction: 'row'`            | `type: 'grid'`, `direction: 'row'`          |
| `row-reverse`, `column-reverse`               | not supported: reorder the children instead |
| `gap` (pixels)                                | `gap`, a step                               |
| `align`                                       | `justify`                                   |
| `justify`                                     | no replacement                              |
| `gui.layouts.horizontalFlex(…)`               | `gui.layouts.horizontalGrid(…)`             |
| `gui.layouts.flex(…)`, `verticalFlex(…)`      | `gui.layouts.grid(…)`, `verticalGrid(…)`    |

`row-reverse` and `column-reverse` now render in source order. With them, screen readers and keyboard
focus followed a different order from the one on screen.

### Other layout changes

- The form's root layout is now a `grid` stack instead of a `flex` column. Code that finds the root
  by its type must look for `'grid'`.
- Checkboxes, toggles and buttons in a row now sit at the vertical centre of the row's controls. The
  `margin-top` that used to line up checkboxes and toggles with inputs is gone.
- Widgets no longer set an inline `flex` style from their `size`; the grid cell applies `size`.

## CSS and markup

Component styles are no longer nested under `.gui-form`, and tabs, accordions and alerts now render
`gui-*` elements. Update the CSS and test selectors that target the old markup.

### Selectors

Overrides that copied the old `.gui-form …` selectors keep working, because they are more specific
than the new ones. Update these:

**Before:**

```css
.gui-validator ul li {
  font-weight: 600;
}

@container gui-form (max-width: 480px) {
  /* … */
}
```

**After:**

```css
.gui-validator .gui-validator__error {
  font-weight: 600;
}

@container gui-container (max-width: 480px) {
  /* … */
}
```

- Errors render as `div.gui-validator__error` instead of `li` inside `ul`.
- Narrow layouts query a container named `gui-container`. The form is also still named `gui-form`, so
  your own `@container gui-form` queries keep working.
- Right-to-left styles use `:dir(rtl)`, so a `dir="rtl"` on any ancestor applies them.
- A read-only select is no longer `disabled`. It stays focusable and has `aria-readonly`.
- Only submit buttons show the invalid state. Its class, `gui-button--invalid`, is now styled in
  `forms.css`.

### Layout classes

**Before:**

```css
.gui-grid__widget--row {
  column-gap: 2rem;
}
```

**After:**

```css
.gui-grid--row {
  --gui-layout-gap-md: 2rem;
}
```

Each gap step is a token, from `--gui-layout-gap-none` to `--gui-layout-gap-xl`. Set them on `:root`
to change every grid. `--gui-layout-column-min` sets the minimum column width for `columns: 'auto'`.

| 1.x                                                     | 2.0                                                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `.gui-flex`, `.gui-flex__widget` and modifiers          | removed                                                                              |
| `.gui-grid` (the widget host)                           | the host has only `.gui-field`                                                       |
| `.gui-grid__widget`                                     | `.gui-grid`                                                                          |
| `.gui-grid__widget--row`, `--row--auto-fit`, `--column` | `.gui-grid--row`, `.gui-grid--columns-N`, `.gui-grid--auto`; a stack has no modifier |
| `.gui-grid__widget--align-*`, `--justify-*`             | `.gui-grid--justify-*`                                                               |
| inline `column-gap`, `row-gap`                          | `.gui-grid--gap-*`                                                                   |
| inline `grid-column: span N` on a cell                  | `.gui-grid__cell--span-N`                                                            |

The [`@golemui/gui-components` README](libs/gui/components/README.md#layout) documents the classes.

### Tabs

Tabs and panels keep their ids and `data-cy` attributes.

**Before:**

```css
.gui-tabs button[role='tab'].active {
  color: var(--brand);
}
```

```ts
cy.get('button[role="tab"]').eq(1).click();
```

**After:**

```css
gui-tab[aria-selected='true'] {
  color: var(--brand);
}
```

```ts
cy.get('[role="tab"]').eq(1).click();
```

| 1.x                                                | 2.0                                                |
| -------------------------------------------------- | -------------------------------------------------- |
| `nav.gui-widget`                                   | `gui-tabs`                                         |
| `ul[role=tablist]`, `li[role=presentation]`        | `gui-tab-list`                                     |
| `button[role=tab]`, `.active`                      | `gui-tab`, `[aria-selected='true']`                |
| `section[role=tabpanel]`                           | `gui-tab-panel`                                    |
| `.gui-tabs--start-shadow`, `.gui-tabs--end-shadow` | `[overflow-start]`, `[overflow-end]` on `gui-tabs` |
| `li.gui-sentinel`                                  | removed                                            |

In every framework, the arrow keys, Home and End now select a tab and emit the tabs' change event.

### Accordion

Each section is now a native `<details>`. Sections keep their ids and `aria-labelledby`. The header
no longer has `aria-expanded` or `aria-controls`, because `<summary>` already tells assistive
technology whether the section is open.

**Before:**

```css
.gui-accordion__section > button.active {
  font-weight: 700;
}
```

```ts
cy.get('#billing').should('not.have.attr', 'hidden');
```

**After:**

```css
gui-accordion-item > details[open] > summary {
  font-weight: 700;
}
```

```ts
cy.get('#billing').closest('details').should('have.attr', 'open');
```

| 1.x                                           | 2.0                                                    |
| --------------------------------------------- | ------------------------------------------------------ |
| `div.gui-widget`                              | `gui-accordion`                                        |
| `.gui-accordion__section`                     | `gui-accordion-item > details`                         |
| `.gui-accordion__section > button`, `.active` | `summary`, `details[open] > summary`                   |
| `section[role=region][hidden]`                | `section[role=region]`, hidden by its closed `details` |

### Alert

The alert's id and its `alert` role are now on the same element.

**Before:**

```css
.gui-alert-notification--warning {
  border-width: 2px;
}
```

```ts
cy.get('[id="notice"] [role="alert"]').should('contain', 'Saved');
```

**After:**

```css
gui-alert[variant='warning'] {
  border-width: 2px;
}
```

```ts
cy.get('[id="notice"][role="alert"]').should('contain', 'Saved');
```

## Custom widgets

This section applies to custom widgets that render `gui-*` elements, and to any code that uses the
elements directly.

### Events

In 1.x, some element events had native names such as `input` and `change`, which collided with the
browser's own events. Every event now starts with `gui-`, bubbles and is composed. Event details are
unchanged.

**Before:**

```ts
html`<gui-textinput
  @input=${this.onInput}
  @blur=${this.onBlur}
  @inputError=${this.onError}
></gui-textinput>`;
```

```html
<!-- Angular -->
<gui-select (change)="onChange($event)" (blur)="onBlur()"></gui-select>
<!-- Vue -->
<gui-select @change="onChange" @blur="onBlur"></gui-select>
```

**After:**

```ts
html`<gui-textinput
  @gui-input=${this.onInput}
  @gui-blur=${this.onBlur}
  @gui-input-error=${this.onError}
></gui-textinput>`;
```

```html
<!-- Angular -->
<gui-select (gui-change)="onChange($event)" (gui-blur)="onBlur()"></gui-select>
<!-- Vue -->
<gui-select @gui-change="onChange" @gui-blur="onBlur"></gui-select>
```

In React, use the components from `@golemui/gui-components/react`. Each one has an `onGui*` prop per
event:

```tsx
import { GuiSelect } from '@golemui/gui-components/react';

<GuiSelect options={options} onGuiChange={onChange} onGuiBlur={onBlur} />;
```

All renamed events:

| 1.x                                                               | 2.0                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `input`, `change`                                                 | `gui-input` while editing, `gui-change` on commit                                          |
| `blur`                                                            | `gui-blur`                                                                                 |
| `focus`                                                           | `gui-focus`                                                                                |
| `inputError`                                                      | `gui-input-error`; an empty `message` clears the error                                     |
| `partsChange`, `editStateChange`                                  | `gui-parts-change`, `gui-edit-state-change`                                                |
| `dropdowntoggle`, `listtoggle`                                    | `gui-dropdown-toggle`, `gui-list-toggle`                                                   |
| `pillClick` (range inputs)                                        | `gui-range-click`                                                                          |
| `pillclick`, `pillfocus`, `pillremove`, `pillexit`, `pillkeydown` | `gui-pill-click`, `gui-pill-focus`, `gui-pill-remove`, `gui-pill-exit`, `gui-pill-keydown` |
| `pilledit`, `pilleditconfirm`, `pilleditcancel`, `pillsblur`      | `gui-pill-edit`, `gui-pill-edit-confirm`, `gui-pill-edit-cancel`, `gui-pills-blur`         |
| a `change` per toggled item (multi-list)                          | `gui-item-toggle`                                                                          |

- Every value element fires `gui-input` and then `gui-change`. In 1.x, text fields fired only
  `input` and the other fields only `change`. Text fields fire `gui-change` on blur or Enter.
- Composite elements, such as the date picker, fire only their own events. You no longer receive
  events from the calendar or date field inside them.
- Listeners for the old names fail silently. They never fire, or they receive a native event with no
  `detail`.

### Attributes are kebab-case

A multi-word attribute is now the kebab-case form of its property. Property bindings, such as
`.autoGrow` in Lit or `[autoGrow]` in Angular, are unchanged.

**Before:**

```html
<gui-textarea autogrow countermode="current"></gui-textarea>
<gui-checkbox checkboxposition="right"></gui-checkbox>
```

**After:**

```html
<gui-textarea auto-grow counter-mode="current"></gui-textarea>
<gui-checkbox checkbox-position="right"></gui-checkbox>
```

`readonly` and `maxlength` keep their native spelling. Boolean attributes, such as `value` on a
checkbox, now read `"false"` as false.

### `gui-button`

The `actionType` prop is now `type`, which also accepts `'reset'`. The `invalid` prop is gone. To
show the invalid state, add the `gui-button--invalid` class to an ancestor, such as your widget's
host. Form definitions still use `actionType`.

**Before:**

```ts
html`<gui-button .actionType=${'submit'} ?invalid=${invalid} label="Save"></gui-button>`;
```

**After:**

```ts
this.classList.toggle('gui-button--invalid', invalid);

html`<gui-button type="submit" label="Save"></gui-button>`;
```

New props: `loading`, `size`, `href` (renders a link), `target`, `rel`, `name`, `value` and `form`.

### Errors and `touched`

In 1.x, an element showed its `errors` only when `touched` was true. In 2.0, `touched` is unset by
default, and errors show as soon as you set them. Pass `touched` from the engine, or set it to
`false` to hide the errors.

### Layout

The grid cell now applies `size`, so remove any code that sets an inline `flex` style.

**Before:**

```ts
override updated(changed: PropertyValues) {
  super.updated(changed);
  const size = this.adapter.templateData.size;
  if (size) this.style.flex = String(size);
  else this.style.removeProperty('flex');
}
```

**After:** delete the method, or the `flex` lines in it.

To line up with the fields next to it, give your widget's root the `gui-field` class, and its parts
the `gui-label`, `gui-widget` and `gui-validator` classes. See
[the field anatomy](libs/gui/components/README.md#layout).

## Custom widget sets

This section applies if you build your own widget set on `@golemui/core`, with your own
`widgetLoaders`, instead of the gui widgets.

`grid` replaces `flex` as a reserved widget type. Core wraps every form whose `form` is an array in a
`grid` layout with no props, so every widget set must now provide a `grid` loader, next to
`repeater`. Without one, the form can't load its root: the console shows
`Widget "grid" could not be loaded`, and nothing renders, on the server either.

**Before:**

```ts
const widgetLoaders = {
  flex: () => import('./layouts/stack').then((m) => m.Stack),
  repeater: () => import('./layouts/repeater').then((m) => m.Repeater),
  // …your widgets
};
```

**After:**

```ts
const widgetLoaders = {
  grid: () => import('./layouts/stack').then((m) => m.Stack),
  repeater: () => import('./layouts/repeater').then((m) => m.Repeater),
  // …your widgets
};
```

- Your `grid` widget must stack its children when it gets no props.
- Keep the `flex` loader too if your stored forms use `flex` layouts.
- If your widget set has a DX adapter, its `rootEntry` must build a `grid` root too.
- A widget set scaffolded with `npx @golemui/schemas init` now starts with a `grid` component schema
  instead of `flex`. In an existing one, add `grid` to the manifest in `schemas.config.mjs`, with
  its schema, and rerun `npx @golemui/schemas generate`.

## Packages

- `@golemui/gui-components` no longer depends on the Forms packages. Its only peer dependency is
  `lit`, with `react` and `vue` as optional peers for their bindings. `@golemui/gui-shared` now
  depends on it.
- The new `@golemui/lit-utils` package holds `safeDefine` and `cspStyleMap`. You don't need to
  install it: `@golemui/lit` and `@golemui/lit/internals` still export both.
- `DateRange`, `TimeRange`, `DateTimeRange`, `Option`, `ListItem`, `FileItem`, `UploadService` and
  the other value types are now defined in `@golemui/gui-components`. `@golemui/gui-shared` still
  exports them, so your imports keep working.
- `@golemui/gui-components/internals` no longer exports `createIntersectionObserver` or
  `NO_AVAILABLE_TIMES_MESSAGE`.
- `@golemui/gui-react` no longer depends on `@lit/react`.
- We still release all packages together, and each one depends on the exact version of the others.
  Upgrade them all to 2.0 at once.

## New in 2.0

You don't need these to upgrade, but they're available:

- **Standalone components.** Install `@golemui/gui-components` and `lit`, and use the `gui-*`
  elements in plain HTML or any framework, with typed React components
  (`@golemui/gui-components/react`) and Vue typings (`@golemui/gui-components/vue`).
- **Native form participation.** An element with a `name` takes part in a native `<form>`. The form
  submits its value, `required` and bounds block an invalid submit, and `form.reset()` restores it.
  GolemUI forms don't set `name`, so this doesn't apply inside them.
- **Translated built-in strings.** You can translate validation messages, accessible names and
  announcements with `configureMessages()` from `@golemui/gui-components`. This is separate from
  your form's `localization`.
- **Accessible names.** Fields take their accessible name from their visible label. Generic fallbacks
  such as "Tags input" are gone, so a field without a label has no accessible name, and development
  builds log a warning.
- **Tabs, accordion and alert elements**, the `golemui.*` cascade layers, the `tokens.css` and
  `components.css` entry points, and a `custom-elements.json` manifest.

The [`@golemui/gui-components` README](libs/gui/components/README.md) covers each of them.
