# GolemUI — React

Rendering a form in React, and server rendering it in Next.js. The config, the events and the
runtime methods are in [config.md](config.md).

Setup:

```ts
declare const definition: Record<string, unknown>;
```

## Install

```bash
npm i @golemui/core @golemui/react @golemui/gui-react @golemui/gui-components @golemui/gui-shared
```

## Render

```tsx
import '@golemui/gui-components/index.css';
import '@golemui/gui-shared/forms.css';
import type { FormEvent, FormSubmitEvent } from '@golemui/core';
import { GuiForm } from '@golemui/gui-react';
import type { GuiFormInitConfig } from '@golemui/gui-shared';

const config: GuiFormInitConfig = { formDef: definition };

export function SignupForm() {
  return (
    <GuiForm
      config={config}
      formSubmit={(e: FormSubmitEvent) => console.log(e.data)}
      formEvent={(e: FormEvent) => console.log(e.name)}
    />
  );
}
```

The runtime methods are on a `ref` on `<GuiForm>`, typed `FormComponentHandle` from
`@golemui/react`.

To use a `gui-*` element on its own in JSX, import its component from
`@golemui/gui-components/react`: `<GuiSelect options={list} onGuiChange={…} />`. The elements
send `gui-*` events (`gui-input`, `gui-change`, `gui-blur`), not `change`.

Guide: https://golemui.com/json/integration/react.md

## Next.js

Widgets load through dynamic imports, which a server render cannot wait for, so they are
preloaded before the first render on the server and on the client. In the App Router that is a
client component that suspends on a promise at module scope (`src/app/golemui-provider.tsx`),
wrapped around `{children}` in the root layout:

```tsx
'use client';
import { preloadFormWidgets } from '@golemui/core';
import { widgetLoaders } from '@golemui/gui-react';
import { use, type ReactNode } from 'react';

const preloadPromise = preloadFormWidgets({ widgetLoaders }); // one per environment

export function GolemuiProvider({ children }: { children: ReactNode }) {
  use(preloadPromise); // server: waits before emitting HTML; client: waits before hydrating
  return <>{children}</>;
}
```

The root layout imports the two stylesheets. The server renders the React layer (`<form>`,
layouts, `gui-*` tags with their attributes and values); the `gui-*` elements render their
insides once the browser upgrades them. The rules every server render shares are in
[ssr.md](ssr.md).

Starter: `templates/nextjs` in the GolemUI repository.

## Rules

### rule: react-config-at-module-scope

When: rendering `<GuiForm>` in a React component.

Do: create the `config` object once, at module scope or with `useMemo`, not in the render.

Wrong:

- Doing: `<GuiForm config={{ formDef: definition }} />` inside a component that renders again.

  Because: a new `config` identity creates a new form instance, which starts again from `config.data`; what the user typed is gone.

Applies: react, nextjs

Source: libs/react/src/lib/FormComponent.tsx#FormComponent

### rule: nextjs-form-in-a-client-component

When: rendering `<GuiForm>` in the Next.js App Router.

Do: render it from a client component, a file that starts with `'use client'`.

Wrong:

- Doing: rendering `<GuiForm>` from a server component.

  Because: the handlers (`formSubmit`, `formEvent`) are functions, which a server component cannot pass to a client component.

Applies: nextjs, react, ssr

### rule: nextjs-preload-widgets

When: server rendering GolemUI in Next.js.

Do: wrap the root layout's `{children}` in a client provider that calls `use()` on `preloadFormWidgets({ widgetLoaders })`, as "Next.js" shows.

Wrong:

- Doing: rendering the form with no preload.

  Because: the server render cannot wait for the dynamic imports of the widgets; its HTML holds no widget, not even a label.

Applies: nextjs, react, ssr

Source: libs/core/src/lib/context/widget-registry.ts#preloadFormWidgets
