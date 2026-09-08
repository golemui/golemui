# @golemui/webmcp

[Golem UI](https://golemui.com): the declarative form engine.

Exposes a GolemUI form to the AI agent driving the browser through
[WebMCP](https://github.com/webmachinelearning/webmcp) (`document.modelContext`). Each form
becomes a `fill` and a `submit` tool (plus an optional `read` tool) driven by the real widgets and
gated by the form's own validation.

## Install

```bash
npm install @golemui/webmcp
```

## Use

```ts
import { webmcp } from '@golemui/webmcp';

const config = {
  formDef,
  plugins: [
    webmcp({
      name: 'signup',
      description: 'Create a new account with an email address and a password.',
    }),
  ],
};
```

The plugin is a no-op wherever `document.modelContext` is missing (server renders, browsers
without WebMCP), so it is safe to leave in place.

## Documentation

- Website: https://golemui.com
- Repository: https://github.com/golemui/golemui
- Source: https://github.com/golemui/golemui/tree/main/libs/webmcp
- Issues: https://github.com/golemui/golemui/issues

## License

MIT
