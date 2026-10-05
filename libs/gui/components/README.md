# @golemui/gui-components

The [Golem UI](https://golemui.com) web components: form controls, buttons, tabs, accordions and
alerts built with Lit. They work in any framework or in plain HTML, with or without the Golem UI
form engine.

## Install

```bash
npm install @golemui/gui-components
```

## Usage

Import the package once to register every element, or one element's entry point
(`@golemui/gui-components/textinput`) to register only that one. Then use the `gui-*` tags
anywhere HTML goes:

```html
<gui-textinput name="email" label="Email" required></gui-textinput>
```

Multi-word attributes are kebab-case (`min-date`, `show-errors`). Every element fires
`gui-input` while the user edits its value and `gui-change` when the value is committed, with the
value in `event.detail.value`.

Each element exports its events map next to its class (`GuiTextinputEvents`). `GuiEventMap`
gives the type of each event:

```ts
import type { GuiEventMap, GuiTextinputEvents } from '@golemui/gui-components';

type ChangeEvent = GuiEventMap<typeof GuiTextinputEvents>['gui-change'];
```

### React

`@golemui/gui-components/react` has a component for every element, with typed props and an
`on*` prop for each event:

```tsx
import { GuiTextinput } from '@golemui/gui-components/react';

<GuiTextinput label="Email" onGuiChange={(event) => save(event.detail.value)} />;
```

The components are client components (`"use client"`) and hold server-rendered elements until
React hydrates them. They need `react` 18 or later.

### Vue

Tell Vue the `gui-*` tags are custom elements, for example in `vite.config.ts`:

```ts
vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith('gui-') } } });
```

In Nuxt, the `@golemui/gui-components/nuxt` module does it, and renders the elements on the
server too: add it to `modules` in `nuxt.config.ts`.

For typed props and `@gui-*` handlers in templates, add the typings once, for example in
`env.d.ts`:

```ts
import type {} from '@golemui/gui-components/vue';
```

### Angular

Add `CUSTOM_ELEMENTS_SCHEMA` to the component that uses the tags, then bind properties and
events as usual:

```ts
@Component({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <gui-textinput label="Email" [value]="email" (gui-change)="onChange($event)"></gui-textinput>
  `,
})
```

## Styles

Import the stylesheet once:

```ts
import '@golemui/gui-components/index.css';
```

`index.css` is `tokens.css`, the `--gui-*` design tokens, plus `components.css`, the element
styles; import the two on their own if you load the tokens elsewhere. The optional Clay theme is
`@golemui/gui-components/themes/clay.css`, applied with `data-theme="clay"`, `"clay-dark"` or
`"clay-auto"` on an ancestor.

Every rule sits in a `golemui.*` cascade layer, so your own unlayered CSS wins whatever its
specificity. To restyle, set the tokens on `:root` or write plain selectors such as
`gui-tab[aria-selected='true']`.

The carets of the pickers, selects, dropdowns, number spinner, calendar and accordion are drawn by
the stylesheet, with no image, so a strict Content Security Policy allows them. Change every caret
at once with two tokens: `--gui-caret-shape`, a `clip-path` shape, or your own icon in
`--gui-caret-image` with the shape set to `none`:

```css
:root {
  --gui-caret-image: url('/icons/chevron-down.svg');
  --gui-caret-shape: none;
}
```

The icon points down, and it takes the color of the text around it. An icon in a `data:` URL
needs `img-src data:` in your Content Security Policy.

Some elements change layout when there is little room, for example a grid row stacks its cells.
They measure the nearest ancestor with the `gui-container` class, so put it on the element that
sets their width. A GolemUI form is already one.

## Translating the built-in strings

Validation messages, accessible names and announcements default to English. Plug in your app's
i18n library once, and call it again when the language changes:

```ts
import { configureMessages } from '@golemui/gui-components';

configureMessages((key, defaultText, params) =>
  i18next.t(`ui.${key}`, { defaultValue: defaultText, ...params }),
);
```

`DEFAULT_MESSAGES` lists every key with its English default. Runtime values are `{token}`s in
single braces (`{min}`, `{name}`, `{count}`), passed to your function as `params`. An element's own
prop for a string, such as `toggleAriaLabel`, still takes precedence.

A string with a `{count}` has an English default per plural form (`1 item`, `3 items`). Your
function receives the one for the count, and your i18n library does the plurals of its language
from `params.count`.

## Accessible names

- **Fields** are named by their `label`. There is no made-up fallback name: without a label a field
  has no accessible name, accessibility checkers flag it, and in development builds the date, time,
  range, tags and file fields log a warning. The hint is read as the field's description.
- **Buttons and parts with no visible text**, such as the popup toggles, the month buttons, the date
  and time parts, and the file and markdown buttons, always have a name. Each has a prop to change
  it (see the element's API), and an empty value keeps the default.
- **Popups** are named by their field's label, or by a default name without one.
- **Parts that only add context**, such as the start and end of a range and the toolbars, have a
  default name that an empty value removes.

## Tabs, accordions and alerts

You render the parts and their content; the elements add the behaviour: ids, ARIA, keyboard and
which panel shows. They never create or remove your content.

```html
<gui-tabs active="address">
  <gui-tab-list aria-label="Profile">
    <gui-tab panel="personal">Personal</gui-tab>
    <gui-tab panel="address">Address</gui-tab>
  </gui-tab-list>
  <gui-tab-panel name="personal">…</gui-tab-panel>
  <gui-tab-panel name="address">…</gui-tab-panel>
</gui-tabs>

<gui-accordion>
  <gui-accordion-item>
    <details open>
      <summary>Personal</summary>
      <div>…</div>
    </details>
  </gui-accordion-item>
</gui-accordion>

<gui-alert variant="warning">Some fields need your attention.</gui-alert>
```

- `gui-tabs` fires `gui-tab-change` with the tab's `panel` in `detail.value`. Cancel it to keep
  the current tab, or set `active` yourself to control the tabs.
- `gui-accordion` keeps one item open unless it has `multiple`. Each item fires `gui-toggle` with
  `detail.open`.
- `gui-alert` has the `alert` role. Give it `role="status"` for a message that can wait.

## Layout

`.gui-grid` lays out its `.gui-grid__cell` children, with no JavaScript:

```html
<div class="gui-grid gui-grid--row">
  <div class="gui-grid__cell gui-grid__cell--span-2">
    <gui-textinput label="Street"></gui-textinput>
  </div>
  <div class="gui-grid__cell"><gui-textinput label="Postcode"></gui-textinput></div>
</div>
```

| Class                                                          | Layout                                                                        |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `gui-grid`                                                     | A stack, one cell below the other.                                            |
| `gui-grid--row`                                                | One line, the cells sharing its width by span.                                |
| `gui-grid--columns-1` … `gui-grid--columns-12`                 | That many equal columns, which the cells fill in order and span.              |
| `gui-grid--auto`                                               | As many columns as fit, each at least `--gui-layout-column-min` (12rem) wide. |
| `gui-grid__cell--span-2` … `gui-grid__cell--span-12`           | A cell twice, or up to twelve times, as wide, in a row or numbered columns.   |
| `gui-grid--gap-none`, `-xs`, `-sm`, `-lg`, `-xl`               | The space between cells. It is `md` by default.                               |
| `gui-grid--justify-start`, `-center`, `-end`, `-space-between` | In a row: the cells keep their own width and the row places them.             |

The gaps are the `--gui-layout-gap-none` … `--gui-layout-gap-xl` CSS variables, so a theme can
change each step. Every grid stacks its cells inside a `.gui-container` narrower than 480px.

In a row or in columns, each cell spans three row tracks shared with the other cells of its row,
and a field puts its parts in them:

1. its `.gui-label`, with the hint;
2. its `.gui-widget`, the control, centred in the track (a checkbox, a toggle and a `gui-button`
   sit here too);
3. its `.gui-validator`, the errors (a checkbox and a toggle put their hint here as well).

The parts of sibling fields line up whatever the length of a label, and an error never moves the
controls next to it. A custom field lines up the same way when its root has the `gui-field` class
and its parts use these three classes; anything else in a cell spans the three tracks.

## Server rendering

The elements load in Node without a DOM, so server-rendered pages can import them. The server-only
`@golemui/gui-components/ssr` entry point also renders their content on the server, so the page
arrives complete, in React, Next.js, Vue, Nuxt, Angular, Analog, Lit and plain Node. It needs
`@lit-labs/ssr` 4.1 or later. The setup for each framework and the limits are in the
[server rendering guide](https://golemui.com/components/docs/guides/server-rendering/).

## Documentation

- Website: https://golemui.com
- Repository: https://github.com/golemui/golemui
- Source: https://github.com/golemui/golemui/tree/main/libs/gui/components
- Issues: https://github.com/golemui/golemui/issues

## License

MIT
