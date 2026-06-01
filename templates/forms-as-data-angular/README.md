# GolemUI · Forms as Data (Angular)

A starter for [GolemUI](https://golemui.com) showing the **forms-as-data** pattern with [Angular](https://angular.dev) 20.

The backend returns `{ data, schema }` — the data plus the shape that describes it. GolemUI maps that schema straight to a form. Add a field to the schema and the form grows; change a `type` and the widget changes. You write no form code. The email field validates, and Save only fires once the form is valid — handing back a typed payload.

## Quick start

```bash
npx degit golemui/golemui/templates/forms-as-data-angular my-app
cd my-app
npm install
npm start
```

Open <http://localhost:4200>.

## Try it online

[Open in StackBlitz](https://stackblitz.com/github/golemui/golemui/tree/main/templates/forms-as-data-angular)

## What's in here

- [src/app/app.ts](src/app/app.ts) — the `{ data, schema }` response, the `toForm(schema)` mapper (one `gui.inputs.*` per field type), and the typed `formSubmit` handler.
- [src/app/app.html](src/app/app.html) — the `<gui-form>` template + typed readout.
- [src/main.ts](src/main.ts) — Angular bootstrap.

## Learn more

- [GolemUI docs](https://golemui.com/dx/getting-started/installation/)
- [Form definition API](https://golemui.com/dx/form-definition-api/)
- [Widgets reference](https://golemui.com/dx/widgets-reference/)
