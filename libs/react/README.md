# @golemui/react

[GolemUI](https://golemui.com): dynamic forms from JSON for React, Angular, Vue, Lit and vanilla JS.

## Install

```bash
npm install @golemui/react
```

## Rendering without a DOM

By default, a form renders its widget tree inside a `div.gui-form` and a `form` element. A React
renderer without a DOM, for example a terminal or a native renderer, cannot render these elements.
Set `headless` to render the widget tree only:

```tsx
import { createFormComponent } from '@golemui/react';

export const NativeForm = createFormComponent(nativeWidgetSet, {
  headless: true,
  widgetErrorFallback: (error, widget) => (
    <Text>
      {widget.type} failed: {error.message}
    </Text>
  ),
  formHealthBoundary: ({ health, children }) => (
    <>
      {health.status === 'errored' && <Text>{health.message}</Text>}
      {children}
    </>
  ),
});
```

In headless mode:

- The default error UI is made of DOM elements, so it renders nothing. The errors are still logged
  to the console. Pass `widgetErrorFallback` and `formHealthBoundary` to show them.
- There is no `form` element to submit. A submit button calls `onSubmit` from `useActionWidget`
  after `onClick`. `onSubmit` does nothing when the action is not a submit action.
- `autocomplete` has no effect.

`react-dom` is not a peer dependency of this package. Install it only when you render to the DOM.

## Setting the form health

The form ref has `setHealth`, next to `setData` and `setMeta`. It reports an error the form cannot
see, for example a server that cannot be reached. An errored health freezes the form and shows the
`formHealthBoundary` until a call with `{ status: 'ok' }` clears it. The form sends `formHealth`
for both calls. Codes below 1000 belong to the core.

```tsx
import { useRef } from 'react';
import type { FormComponentHandle } from '@golemui/react';

const form = useRef<FormComponentHandle>(null);

<NativeForm ref={form} config={{ formDef }} />;

form.current?.setHealth({
  status: 'errored',
  code: 10_001,
  message: 'The server cannot be reached',
});
// Later, when the server is back:
form.current?.setHealth({ status: 'ok' });
```

## Documentation

- Website: https://golemui.com
- Repository: https://github.com/golemui/golemui
- Source: https://github.com/golemui/golemui/tree/main/libs/react
- Issues: https://github.com/golemui/golemui/issues

## License

MIT
