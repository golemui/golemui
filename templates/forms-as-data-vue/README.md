# GolemUI · Forms as Data (Vue)

A starter for [GolemUI](https://golemui.com) showing the **forms-as-data** pattern with [Vue](https://vuejs.org) 3 and [Vite](https://vitejs.dev).

The backend returns `{ data, schema }` — the data plus the shape that describes it. GolemUI maps that schema straight to a form. Add a field to the schema and the form grows; change a `type` and the widget changes. You write no form code. The email field validates, and Save only fires once the form is valid — handing back a typed payload.

## Quick start

```bash
npx degit golemui/golemui/templates/forms-as-data-vue my-app
cd my-app
npm install
npm start
```

Open <http://localhost:5173>.

## Try it online

[Open in StackBlitz](https://stackblitz.com/github/golemui/golemui/tree/main/templates/forms-as-data-vue)

## What's in here

- [src/App.vue](src/App.vue) — the `{ data, schema }` response, the `toForm(schema)` mapper (one `gui.inputs.*` per field type), the `GuiForm`, and the typed `formSubmit` readout.
- [src/main.ts](src/main.ts) — Vue entry point.
- [index.html](index.html) — Vite entry point.

## Learn more

- [GolemUI docs](https://golemui.com/dx/getting-started/installation/)
- [Form definition API](https://golemui.com/dx/form-definition-api/)
- [Widgets reference](https://golemui.com/dx/widgets-reference/)
