# @golemui/gui-components

[Golem UI](https://golemui.com): the declarative form engine.

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

## Documentation

- Website: https://golemui.com
- Repository: https://github.com/golemui/golemui
- Source: https://github.com/golemui/golemui/tree/main/libs/gui/components
- Issues: https://github.com/golemui/golemui/issues

## License

MIT
