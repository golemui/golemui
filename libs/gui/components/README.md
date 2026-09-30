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

## Documentation

- Website: https://golemui.com
- Repository: https://github.com/golemui/golemui
- Source: https://github.com/golemui/golemui/tree/main/libs/gui/components
- Issues: https://github.com/golemui/golemui/issues

## License

MIT
