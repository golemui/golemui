# GolemUI — the form component

What every host shares: the packages, the stylesheets, the `config` the form component takes,
its events and its runtime methods. The wiring of each framework is in its own file:
[react.md](react.md), [angular.md](angular.md), [vue.md](vue.md), [lit.md](lit.md),
[vanilla.md](vanilla.md).

Setup:

```ts
import type { GuiFormInitConfig } from '@golemui/gui-shared';
declare const definition: Record<string, unknown>;
```

## Packages and stylesheets

Five packages, at one version: `@golemui/core`, `@golemui/gui-components`,
`@golemui/gui-shared`, and the two of the framework (`@golemui/react` and
`@golemui/gui-react`, for example). Each host file has its `npm i` line.

The app entry imports the two stylesheets once, in this order:

```ts
import '@golemui/gui-components/index.css';
import '@golemui/gui-shared/forms.css';
```

## The config

The definition goes whole into `formDef`: the document with its `form` and its `states`, as
imported from a `.json` file or fetched from a server. Everything else the form needs is a key
of the same `config` object, next to `formDef`:

```ts
const config: GuiFormInitConfig = {
  formName: 'signup',
  formDef: definition,
  validateOn: 'submit',
  data: { email: 'ada@example.com' },
};
```

| Key                   | What it holds                                                                                             |
| --------------------- | --------------------------------------------------------------------------------------------------------- |
| `formDef`             | the JSON definition (see `formdef-is-the-document`)                                                       |
| `formName`            | a stable name; the DOM ids of the form derive from it. Server rendering needs it ([ssr.md](ssr.md))       |
| `data`, `meta`        | the initial form data, and data the expressions read as `$meta`                                           |
| `validateOn`          | `eager` (the default: change, blur and submit), `change`, `blur`, `submit`, or an array of the last three |
| `functions`           | the `$fn` functions of reactive expressions                                                               |
| `dependencies`        | host services: the markdown parser, the upload service ([host-services.md](../host-services.md))          |
| `itemRenderers`       | item renderers by name ([extending.md](../extending.md))                                                  |
| `customWidgetLoaders` | loaders of custom widgets, by `type` ([extending.md](../extending.md))                                    |
| `customValidators`    | the schemas behind `"type": "custom"` validators ([extending.md](../extending.md))                        |
| `localization`        | an `I18nTranslator`                                                                                       |
| `middlewares`         | middlewares ([extending.md](../extending.md))                                                             |
| `expressionPolicy`    | what the form does with an expression the expression check rejects; `'warn'` by default                   |

`formConfig` and `formSelectors` belong to the `gui.*` builder of 2.x. A JSON definition
ignores them (see `config-keys-at-the-top`).

Full reference: https://golemui.com/json/integration/configuration.md

## Events

| Framework | Component                                                  | Submit event                          |
| --------- | ---------------------------------------------------------- | ------------------------------------- |
| React     | `<GuiForm>` from `@golemui/gui-react`                      | `formSubmit={...}`                    |
| Angular   | `<gui-form>` (`FormComponent` from `@golemui/gui-angular`) | `(formSubmit)="..."`                  |
| Vue       | `<GuiForm>` from `@golemui/gui-vue`                        | `@form-submit="..."`                  |
| Lit       | `<gui-form>` (import `@golemui/gui-lit`)                   | `@formSubmit=${...}`                  |
| Vanilla   | `<gui-form>` (import `@golemui/gui-lit`)                   | `addEventListener('formSubmit', ...)` |

- `formSubmit` sends a `FormSubmitEvent` (`@golemui/core`): `.data` is the form data (in Lit
  and vanilla JS, `event.detail.data`). A submit validates every field first and sends the
  event only when the form is valid.
- `formEvent` sends the events the definition names under `on` ([events.md](../events.md)).
  Vue names it `@form-event`.
- `formHealth` sends `{ status: 'ok' }`, or `{ status: 'errored', code, message }` for an error
  of the form itself, such as an error in the definition. It does not report whether the data
  is valid. Its first value is sent when the form starts.

## Runtime methods

The form component has three methods; the handle that reaches them is in each host file. A call
made before the form has started is kept and applied when it starts.

- `setData(data)` and `setMeta(meta)` replace the form data and the meta.
- `setHealth(health)` sets the health from outside, for an error the form cannot see (the
  server is unreachable): `{ status: 'errored', code, message }` freezes the form, shows the
  `formHealthBoundary` and sends `formHealth`; `{ status: 'ok' }` clears it.

## Rules

### rule: formdef-is-the-document

When: passing a JSON definition to the form component.

Do: pass the whole document, `{ "form": [...] }` with its `states`, as `formDef`.

Right:

```ts
const config: GuiFormInitConfig = { formDef: definition };
```

Wrong:

- Doing: passing `definition.form`, the bare array of JSON widgets, as `formDef`.

  Because: the form fails to start: `[22] form: Expected object literal, got "undefined"`.

Applies: json-api, react, angular, vue, lit, vanilla

Source: libs/dx/src/lib/resolveFormInput.ts#createResolveFormInput, libs/dx/src/lib/resolveFormInput.ts#FormInput, libs/core/src/lib/errors.ts#errorCodes

### rule: config-keys-at-the-top

When: a JSON form needs `validateOn`, `functions`, `dependencies`, `itemRenderers`, `customWidgetLoaders` or any other key of "The config".

Do: put the key at the top level of `config`, next to `formDef`.

Even when: a docs page or an older example puts it in `formConfig`.

Wrong:

- Doing: `formConfig: { dependencies: { markdown }, functions }` next to a JSON `formDef`.

  Because: the form ignores `formConfig` for a JSON definition: a `markdownText` renders empty, with no error, and an expression that calls `$fn` stops the form: `[40] Failed to evaluate '{{$fn.total()}}': obj[path] is not a function`.

Applies: json-api, react, angular, vue, lit, vanilla, dependencies, host-functions

Source: libs/dx/src/lib/widgetSetForm.ts#buildWidgetSetForm, libs/dx/src/lib/resolveFormInput.ts#createResolveFormInput, libs/core/src/lib/errors.ts#errorCodes

### rule: packages-at-one-version

When: installing or upgrading GolemUI.

Do: install the five packages of the host at the same version.

Wrong:

- Doing: upgrading `@golemui/gui-react` alone.

  Because: the packages are released together, and nothing catches a mismatch: they declare each other as peers with the range `*`.

Applies: install, react, angular, vue, lit, vanilla

### rule: import-both-stylesheets

When: rendering a form in an application.

Do: import `@golemui/gui-components/index.css` and then `@golemui/gui-shared/forms.css`, once, in that order.

Wrong:

- Doing: importing neither, or only one of them.

  Because: the form renders unstyled; nothing injects the styles.

Applies: styling, react, angular, vue, lit, vanilla

### rule: submit-event-name-per-framework

When: wiring the submit handler of the form component.

Do: use the event name of the framework from "Events": Vue is the only kebab-case one, `@form-submit`; the others are `formSubmit`.

Wrong:

- Doing: `onSubmit={...}` on `<GuiForm>` in React.

  Because: the prop is `formSubmit`; TypeScript reports that `onSubmit` does not exist on the props of `GuiForm`.

Applies: react, angular, vue, lit, vanilla, events

Source: libs/gui/react/src/lib/components/Form.tsx#ReactFormComponentProps, libs/gui/angular/src/lib/components/form/form.component.ts#FormComponent, libs/gui/vue/src/lib/components/Form.types.ts#GuiFormEmits, libs/core/src/lib/shared.ts#formEventNames

### rule: own-health-codes-from-1000

When: calling `setHealth` with an error of the application.

Do: use a `code` of 1000 or more.

Right:

```ts
declare const form: {
  setHealth(health: { status: 'errored'; code: number; message: string }): void;
};
form.setHealth({ status: 'errored', code: 10_001, message: 'The server cannot be reached' });
```

Wrong:

- Doing: an application error with a small code, `code: 1`.

  Because: codes below 1000 are reserved for the core's own errors, such as an error in the definition.

Applies: runtime-methods, health

Source: libs/core/src/lib/store/model.ts#FormHealth, libs/core/src/lib/errors.ts#errorCodes
