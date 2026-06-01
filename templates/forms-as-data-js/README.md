# GolemUI · Forms as Data (JavaScript)

A starter for [GolemUI](https://golemui.com) showing the **forms-as-data** pattern with plain JavaScript (no framework) and [Vite](https://vitejs.dev). GolemUI ships as web components, so the `<gui-form>` element works anywhere.

The backend returns `{ data, schema }` — the data plus the shape that describes it. GolemUI maps that schema straight to a form. Add a field to the schema and the form grows; change a `type` and the widget changes. You write no form code. The email field validates, and Save only fires once the form is valid — handing back a typed payload.

## Quick start

```bash
npx degit golemui/golemui/templates/forms-as-data-js my-app
cd my-app
npm install
npm start
```

Open <http://localhost:5173>.

## Try it online

[Open in StackBlitz](https://stackblitz.com/github/golemui/golemui/tree/main/templates/forms-as-data-js)

## What's in here

- [src/main.js](src/main.js) — the `{ data, schema }` response, the `toForm(schema)` mapper (one `gui.inputs.*` per field type), and the typed `formSubmit` listener.
- [index.html](index.html) — the `<gui-form>` element + Vite entry point.

## Learn more

- [GolemUI docs](https://golemui.com/dx/getting-started/installation/)
- [Form definition API](https://golemui.com/dx/form-definition-api/)
- [Widgets reference](https://golemui.com/dx/widgets-reference/)
