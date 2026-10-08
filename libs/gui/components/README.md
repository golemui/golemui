# @golemui/gui-components

[GolemUI Components](https://golemui.com/components/) are web components built with Lit: text
fields, pickers, lists, buttons, tabs, accordions and alerts. They work in plain HTML and in any
framework, with or without GolemUI Forms.

- **Accessible:** labels, hints and errors linked to every control, full keyboard support, and
  translatable built-in strings.
- **Native forms:** with a `name`, every element submits, validates and resets with its `<form>`.
- **Easy to style:** light DOM, `--gui-*` design tokens, dark mode, and every rule in a cascade
  layer so your own CSS wins.
- **Every framework:** React components with typed props, Vue typings, a Nuxt module, and server
  rendering in React, Next.js, Vue, Nuxt, Angular, Analog, Astro and Lit.

## Install

```bash
npm install @golemui/gui-components lit
```

```ts
import '@golemui/gui-components/index.css';
import '@golemui/gui-components/textinput';
```

```html
<gui-textinput label="Email" name="email" required></gui-textinput>
```

## Documentation

- [Installation and framework setup](https://golemui.com/components/docs/getting-started/installation/)
- [Components](https://golemui.com/components/docs/inputs/textinput/)
- [Styling](https://golemui.com/components/docs/styling/stylesheets/): stylesheets, design tokens,
  themes and dark mode, icons and layout
- Guides: [native forms](https://golemui.com/components/docs/guides/native-forms/),
  [accessibility](https://golemui.com/components/docs/guides/accessibility/),
  [i18n](https://golemui.com/components/docs/guides/i18n/) and
  [server rendering](https://golemui.com/components/docs/guides/server-rendering/)
- For LLMs and agents: [llms.txt](https://golemui.com/components/llms.txt)

## Links

- Website: https://golemui.com
- Repository: https://github.com/golemui/golemui
- Source: https://github.com/golemui/golemui/tree/main/libs/gui/components
- Issues: https://github.com/golemui/golemui/issues

## License

MIT
