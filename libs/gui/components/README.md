# @golemui/gui-components

[Golem UI](https://golemui.com): the declarative form engine.

## Install

```bash
npm install @golemui/gui-components
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
