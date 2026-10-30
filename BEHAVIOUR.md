# Form behaviour rules

This file lists the rules for edge cases of the forms engine (`@golemui/core`), the framework
packages, the GolemUI widget set and its validators. Each rule says what must happen and why. A
scenario tells where the case happens in an app, and an example shows the input and the expected
result.

- React, Vue, Angular and Lit follow the same rule, unless the rule says otherwise.
- The examples use the `gui.*` builder when it can express the case, and the JSON form definition
  otherwise.
- **Status: follows** means the code does this, and a test checks it.
- **Status: not yet** means the code does something else today. The status line says what.
- A PR that fixes a "not yet" rule adds its test and sets the status to "follows". A PR that
  changes one of these behaviours changes this file in the same PR.

## Data

The form data is what the user gets in `formSubmit`, in form events and from `setData` and
`defaultValue`. The form copies it often. A copy must never change a value.

### 1. Form data keeps values that are not plain objects

The form copies the data before it sends it in an event or in submit. The copy must keep the type
of each value.

- Scenario: an app edits a saved booking. Its API client turns the date strings of the response
  into `Date` objects, and the app gives the record to the form. No widget shows `createdAt`, so
  the form only passes it through. The user changes the name and submits. The app sends
  `data.createdAt` back to the server.
- Example:

  ```ts
  const config = {
    formDef: [
      gui.inputs.textInput('name', { label: 'Name' }),
      gui.actions.button({ label: 'Save', actionType: 'submit' }),
    ],
    data: { name: 'Ann', createdAt: new Date('2026-01-01') },
  };
  ```

  -> in `formSubmit`, `event.data.createdAt` is a `Date`.

- Status: not yet. The copy keeps only the own keys of an object, so a `Date`, a `Map` or a
  `File` becomes `{}`, and a class instance loses its prototype. The app receives
  `{ name: 'Ann', createdAt: {} }`. Form events and `defaultValue` use the same copy.

### 2. Removing a repeater row keeps the values of the other rows

When the user removes a row, only that row changes. The other rows keep their exact values.

- Scenario: a custom date widget in a repeater row writes a `Date` and calls `value.getTime()`
  to render it. In Vue, the user removes another row. The custom widget in each remaining row
  now gets a string, and `getTime` throws.
- Example: rows `[{ a: 1 }, { b: undefined, n: NaN, d: new Date() }]`, the user removes row 0 ->
  the remaining row still has the key `b` with `undefined`, `n` is `NaN` and `d` is a `Date`.
- Status: follows in React, Angular and Lit. Not yet in Vue. Vue copies the rows with
  `JSON.stringify`, so the row loses `b`, `n` becomes `null` and `d` becomes a string.

### 3. A `null` parent acts like a missing parent

APIs often send `null` for an empty object. The form must treat `{ order: null }` like `{}`.

- Scenario: an API returns a customer draft with `order: null`, because the customer has no
  order yet. The app gives the draft to a form that has a repeater for the order lines.
- Example:

  ```ts
  const config = {
    formDef: [
      gui.inputs.repeater('order.lines', {
        label: 'Order lines',
        template: [gui.inputs.textInput('order.lines.items.product', { label: 'Product' })],
      }),
    ],
    data: { customer: 'Ann', order: null },
  };
  ```

  -> the form renders the repeater with no rows, and the form health is `ok`.

- Status: not yet. Reading `order.lines` throws, the form health has error code 11, and the form
  does not render.

### 4. Data paths read own keys only

A data path is a name chosen by the form author. It must not find the built-in properties of
JavaScript objects.

- Scenario: a form builder app lets its users choose the data key of each question. A user names
  a question `toString`. The same happens with `valueOf`, `hasOwnProperty` and the other names of
  `Object.prototype`.
- Example:

  ```ts
  gui.inputs.textInput('toString', { label: 'Answer', defaultValue: 'x' });
  ```

  -> the value is `'x'`.

- Status: not yet. The form finds `Object.prototype.toString`, so it thinks the path already has
  a value. The default is never written, and the input value is a function.

### 5. `__proto__` and `constructor` are plain data keys

Data from JSON can have a key named `__proto__`. The form must treat it as data and never change
the prototype of an object.

- Scenario: an app lets the user import a saved draft from a JSON file. The file contains
  `{ "__proto__": { "isAdmin": true } }`. After the form copies the data, app code that reads
  `data.isAdmin` gets `true`, a value that is not a key of the data.
- Example: data `JSON.parse('{ "__proto__": { "a": 1 } }')` -> the copied data has an own key
  `__proto__`, and `copy.a` is `undefined`.
- Scenario: a translated label has params, and its message uses a name that is not one of them,
  for example after a typo in the translation file. The app translator replaces each
  `{name}` with `params[name]`.
- Example:

  ```ts
  gui.inputs.textInput('approval', {
    label: { key: 'approval', params: { date: '$form.date' } },
  });
  // The message of the key 'approval': 'Approved on {date} by {constructor}'
  ```

  -> the `constructor` param is missing. It is not the `Object` function, so the label never
  shows `function Object() { [native code] }`.

- Status: not yet for copied data and for i18n params.

### 6. Removing hidden data never removes the value of a visible input

When the form removes the data of hidden inputs (before submit), it must keep every path that a
visible input still uses.

- Scenario: a form offers two inputs for the same value, and shows one of them. A dropdown at
  `country` is shown for EU customers, a text input at `country` for all others. The hidden one
  must not remove the value of the visible one.
- Example:

  ```ts
  gui.inputs.dropdown('country', {
    label: 'Country',
    items: euCountries,
    validator: { type: 'string' },
    include: { when: '$form.region === "eu"' },
  }),
  gui.inputs.textInput('country', {
    label: 'Country',
    exclude: { when: '$form.region === "eu"' },
  }),
  ```

  -> data `{ region: 'us', country: 'Canada' }`, the user submits -> the submit data still has
  `country: 'Canada'`.

- Scenario: an address search input at `address` writes the whole address object. A checkbox
  "Enter the address by hand" hides it and shows inputs at `address.street` and `address.city`.
  The hidden search input must not remove the city.
- Status: not yet. The form removes the path of each hidden input, so `country` is removed from
  the submit data. A hidden input at `address` removes `address.city` too.

### 7. A hidden row of a repeater of plain values keeps its position

In a repeater of plain values (strings, numbers), the data of each row is its position in the
array. A hidden row must not move the rows after it.

- Scenario: a list of phone numbers, where the server matches each submitted number to its row by
  position. The input of a row is hidden by an `include.when` that reads `$item`.
- Example: rows `['a', 'b', 'c']`, row 1 hidden, hidden data removed -> the data keeps three
  positions, position 1 is empty and `'c'` is still at position 2.
- Status: follows.

## Form definition errors

An app gets errors in the form definition from `formHealth`. It can show a message or a fallback
from there. An exception instead stops the whole app or the framework render.

### 8. An invalid form definition gives a form health error, never an exception

- Scenario: an app loads JSON forms from its backend, and a form author or a tool saves a broken
  form. The app listens to `formHealth` to show a "This form cannot be shown" message.
- Example: `formDef: null`, `undefined` or the JSON string `'null'`, for example when the backend
  returns no form -> code 22 with the label `root`, the same as for `formDef: 42`.
- Example: an authoring tool saves a repeater before the author adds its template ->
  `{ "kind": "input", "type": "repeater", "path": "contacts" }` gives code 22.
- Example: a row function reads `$item` without `?.`. The form calls the function once without a
  row when it builds the form:

  ```ts
  gui.inputs.repeater('users', {
    template: [
      gui.inputs.dropdown('users.items.city', ({ $item }) => ({
        label: 'City',
        items: citiesOf($item.country),
        validator: { type: 'string' },
      })),
    ],
  });
  ```

  -> code 22.

- Example: a JSON form uses the custom rule `{ "type": "custom", "iban": true }`, and the app
  forgot to register `iban` in `customValidators`. Or a registered rule returns a schema with an
  async check, for example a server call. -> a form health error when the form validates.
- Status: not yet. These cases throw an exception out of the form. In the validator cases, the
  first blur or submit throws.

### 9. Duplicate uids give error code 21, also inside a repeater template

Each widget needs a unique uid, because the form stores state by uid.

- Scenario: a form author copies an input in a JSON repeater template and changes only its path
  and label. The copy keeps the uid.
- Example:

  ```json
  {
    "kind": "input",
    "type": "repeater",
    "path": "contacts",
    "props": {
      "template": {
        "kind": "layout",
        "type": "grid",
        "children": [
          {
            "uid": "phone",
            "kind": "input",
            "type": "textinput",
            "path": "contacts.items.home",
            "label": "Home"
          },
          {
            "uid": "phone",
            "kind": "input",
            "type": "textinput",
            "path": "contacts.items.mobile",
            "label": "Mobile"
          }
        ]
      }
    }
  }
  ```

  -> code 21.

- Status: follows at the top level. Not yet in a repeater template. There the health stays `ok`,
  and the first input silently loses its state to the second one.

### 10. A definition error is the first form health value

An app that waits for the first `formHealth` value must not see `ok` for a broken form.

- Scenario: an app shows a loading indicator until the first `formHealth` value. Then it shows
  the form, or an error page for a broken form.
- Example: a form with a duplicate uid:

  ```ts
  form.addEventListener('formHealth', (event) => {
    if (event.detail.status === 'ok') {
      showForm();
    } else {
      showErrorPage(event.detail.message);
    }
  });
  ```

  -> `formHealth` sends the error only, so the app calls only `showErrorPage`.

- Status: follows in React, Vue and Angular. Not yet in Lit. It sends `{ status: 'ok' }` first and
  then the error, so the app shows the broken form first.

## Validation

The user sees errors on the inputs. The app reads `isFormValid` and `$formIsInvalid`, for example
to disable the submit button. Both must always agree with what the user sees.

### 11. A hidden input never makes the form invalid

- Scenario: a checkout form asks for a VAT number only from companies. The user checks "I buy as
  a company", leaves the VAT number empty, and the error shows. Then the user unchecks the box.
- Example:

  ```ts
  gui.inputs.checkbox('isCompany', { label: 'I buy as a company' }),
  gui.inputs.textInput('vatNumber', {
    label: 'VAT number',
    validator: { required: true },
    include: { when: '$form.isCompany === true' },
  }),
  gui.actions.button({
    label: 'Pay',
    actionType: 'submit',
    disabled: { when: '$formIsInvalid' },
  }),
  ```

  -> when the VAT number is hidden, `$formIsInvalid` is false and `$errors.vatNumber` is not set,
  at once. The Pay button is enabled.

- Scenario: the server rejects the VAT number, and the app injects the issue. Then the user
  unchecks the box, so the input is hidden. -> `isFormValid` is true after the next validation.
- Status: not yet. The old error stays until the next validation, so the Pay button stays
  disabled. An injected issue on a hidden input blocks submit, and the user cannot see why.

### 12. Injected issues update `isFormValid` at once

Apps inject issues, for example server errors, with `INJECT_VALIDATION_ISSUES`.

- Scenario: the server rejects a sign-up because the email is already registered. The app shows
  the error on the email input.
- Example:

  ```tsx
  <GuiForm
    config={{ formDef }}
    formSubmit={async (event) => {
      const result = await signUp(event.data);
      if (result.emailTaken) {
        event.callback({
          type: 'INJECT_VALIDATION_ISSUES',
          payload: { path: 'email', issues: ['This email is already registered'] },
        });
      }
    }}
  />
  ```

  -> the input shows the issue and `isFormValid` is false, so the submit button gets its invalid
  style. Clear the issues with `issues: null` -> `isFormValid` is true again.

- Status: not yet. The input shows the issue, but `isFormValid` changes only with the next
  validation, for example the next blur.

### 13. A language change translates the shown validation messages at once

- Scenario: the page has a language menu. The user sees an error, then selects Spanish.
- Example:

  ```ts
  // `translator` is the MutableI18nTranslator in the `localization` of the form config.
  translator.setLang('es');
  ```

  -> the error "This field is required" is in Spanish without another user action.

- Status: not yet. The labels change, but the error stays in English until the input validates
  again.

### 14. A prop limits the input, a validator marks the form invalid

The same name can be a prop and a validator rule. The prop stops the user. The validator lets the
user type and reports an error.

- Scenario: a short post must stop at 280 characters while the user types, so the author sets
  the prop. A cover letter can take a pasted text that is too long, and the user shortens it in
  the field, so the author sets the validator rule.
- Example:

  ```ts
  gui.inputs.textarea('post', { label: 'Post', maxLength: 280 }),
  gui.inputs.textarea('letter', { label: 'Cover letter', validator: { maxLength: 2000 } }),
  ```

  -> the user cannot type a 281st character in the post. The user can paste 2100 characters in
  the letter, and the input shows an error.

- Scenario: the tags of a contact come from the server and can hold a duplicate, for example
  `['vip', 'vip']`. The tags input stops the user from adding a duplicate, but it does not check
  the loaded value.
- Example: `gui.inputs.tags('labels', { label: 'Labels', validator: { uniqueItems: true } })`
  with the value `['vip', 'vip']` -> the value is invalid.
- Status: not yet. The textarea ignores `props.maxLength` and uses `validator.maxLength` to stop
  typing. `uniqueItems` is accepted by the validator type, but it is never checked.

### 15. A cleared optional field is valid

An optional field the user typed into and then cleared is empty, like a field the user never
touched.

- Scenario: an optional nickname field has a minimum length. The user types a letter, changes
  their mind and deletes it.
- Example:

  ```ts
  gui.inputs.textInput('nickname', { label: 'Nickname', validator: { minLength: 3 } });
  ```

  -> the user types `a`, deletes it and leaves the field -> no error.

- Status: not yet. The cleared field holds `''`, and an optional validator accepts only
  `undefined` as empty. `''` fails `minLength` and `exactLength`, so the field shows an error.

## Visibility

### 16. `include` and `exclude` on one widget

`include.when` shows a widget when its expression is true. `exclude.when` hides a widget when its
expression is true. With both, the widget is visible only when `include` is true and `exclude` is
false.

- Scenario: the VAT number is shown only to companies, and never to customers in the US.
- Example:

  ```ts
  gui.inputs.textInput('vatNumber', {
    label: 'VAT number',
    include: { when: '$form.customerType === "company"' },
    exclude: { when: '$form.country === "US"' },
  });
  ```

  -> a private customer in Spain: `include` is false and `exclude` is false, so the input is
  hidden.

- Status: not yet. The form uses only the `exclude` result, so the input is visible.

## Repeater

### 17. The state of a row belongs to the row

A row has state besides its data: touched (it decides if the error shows), its errors, and prop
overrides that the app sets by path (for example `readonly` on `people.1.name`). This state
belongs to the item in the row, not to the position. When the user adds, removes or moves a row
with the repeater controls, the state moves with its row.

- Scenario: a team list where the server approves members. The app makes the name of an approved
  member read-only:

  ```ts
  event.callback({
    type: 'OVERRIDE_WIDGET_PROP',
    payload: { path: 'people.1.name', prop: 'readonly', value: true },
  });
  ```

- Example: rows `[Alice, Bob]`, `name` is required. The app makes Bob's name read-only. The user
  clears Bob's name, and the error shows. Then the user removes Alice -> Bob is now row 0. His
  name is still read-only and still shows the error. A new row added later is not read-only.
- `setData` with a new array is different. The form cannot know which new row was which old row,
  so the state stays at the positions.
- Status: not yet. All row state stays at its position. After the removal Bob shows no error and
  is not read-only, and the next new row at position 1 is read-only. The repeater controls send
  the whole new array to the form, so the fix needs a way to tell the form which row was added,
  removed or moved.

### 18. A disabled or readonly repeater disables Add and Remove

- Scenario: an order cannot change after its approval. The author disables the order lines when
  the status is "approved".
- Example: `{ "kind": "input", "type": "repeater", "path": "lines", "disabled": true, ... }` ->
  the inputs and the Add and Remove buttons are disabled.
- Status: not yet. The user can still add and remove rows.

### 19. A repeater blur event fires when the focus leaves the whole repeater

`on: { blur }` on a repeater is for "the user is done with this list". Moving between its inputs
is not leaving it.

- Scenario: the app saves the team list to the server when the user leaves the list.
- Example: a JSON repeater at `team` with Name and Role inputs in its template, and
  `"on": { "blur": "saveTeam" }` -> the focus moves from Name to Role (same repeater), then to an
  input outside -> one `saveTeam` event.

- Status: not yet. Every move between two inputs of the repeater sends a blur event, so this
  example sends two, and the app saves two times.

### 20. Keyboard focus is not lost when the host changes the rows

- Scenario: several users edit the same list. The app polls the server and calls `setData` with
  the new rows while a keyboard user types in the list.
- Example: rows `[Alice, Bob, Carol]`, the focus is in Carol's input, the app calls
  `setData({ rows: [Bob, Carol] })` -> the focus stays in an input of the repeater.
- Status: not yet. The input of row 2 is removed, and the focus goes to `document.body`. A
  keyboard user must start again from the top of the page.

## Tabs and accordion

### 21. `defaultOpen` is read once, when the layout mounts

`defaultOpen` chooses the first selected tab, or the open sections of an accordion. After that,
only the user changes the selection.

- Scenario: a customer form opens on the "Company" tab for companies. A state sets
  `defaultOpen`. The user opens the "Address" tab, then changes the customer type above the tabs.
- Example: the state `isCompany` is `"$form.customerType === 'company'"`, and the props of the
  tabs are:

  ```json
  {
    "tabs": [
      { "uid": "person", "label": "Person" },
      { "uid": "company", "label": "Company" },
      { "uid": "address", "label": "Address" }
    ],
    "defaultOpen": "person",
    "defaultOpen.isCompany": "company"
  }
  ```

  -> the user is on "Address" and changes the type to company -> "Address" stays selected.

- Status: follows in Angular and Lit. Not yet in React and Vue. React and Vue switch the tab when
  the state changes, and the Vue accordion can open a section again after the user closed it.

### 22. The selected tab always shows its panel

- Scenario: the app keeps the open tab in the URL (`?tab=billing`) and passes it as
  `defaultOpen`. An old link names a tab that was renamed.
- Example: tabs with `"renderMode": "activeOnly"` and `"defaultOpen": "billing"`, and no tab
  `billing` -> the first tab is selected and its panel is shown.
- Scenario: the child of the "Billing" tab is shown only for paid plans, and the user has a free
  plan.
- Example: the child of the `defaultOpen` tab is hidden at mount -> the tab that is selected shows
  its panel.
- Status: not yet. The `gui-tabs` element selects the first tab, but the form shows no panel. The
  area under the tabs is empty.

### 23. A tab whose child becomes hidden stays selected

- Scenario: the user is on the "Company" tab, then changes the customer type above the tabs to
  person. An `include.when` hides the child of the "Company" tab.
- Example: the user is on tab C, then the child of C is hidden by `include.when` -> tab C stays
  selected and the area under the tabs is empty, until the user selects another tab.
- Why: selecting another tab without a user action would surprise the user.
- Status: follows.

### 24. A moved Lit form keeps its selected tab and open sections

Moving a `gui-form` to another parent element keeps its data. It must keep its layout state too.

- Scenario: a page has a button that opens the form in a larger dialog. The app moves the same
  `gui-form` element into the dialog.
- Example:

  ```ts
  dialog.append(formElement);
  dialog.showModal();
  ```

  -> the user had selected tab B before the move -> tab B is still selected.

- Status: not yet. The tabs and the accordions go back to their `defaultOpen`.

## Form component

### 25. A new config replaces the form completely

When the app passes a new config object, the form starts again from the new config.

- Scenario: a page shows a list of customers and a form for the selected one. When the user
  selects another customer, the app passes a new config:

  ```tsx
  <GuiForm config={{ formDef, formName: `customer-${customer.id}`, data: customer }} />
  ```

- It uses the new `formName`. Status: follows in Angular and Lit. Not yet in React and Vue, which
  keep the first name.
- It follows the translator of the new config. For example, the app loads a translator for each
  language and passes the new one in the config. Status: follows in React, Angular and Lit. Not
  yet in Vue, which still listens to the old translator.
- No field is touched. For example, the user types in a field and presses a keyboard shortcut
  that opens the next customer, so the focus is still in the field. Status: follows in React and
  Vue. Not yet in Angular and Lit. When the focused input is removed, its blur reaches the new
  form and marks the field there as touched. So a required empty field shows its error before
  the user does anything.
- It initializes once, and `formHealth` sends one value. For example, a middleware that logs
  each form start logs one start. Status: follows in React, Vue and Lit. Not yet in Angular,
  which initializes two times.

### 26. `setData` before the form has started keeps the values

The form element exists before it has started (Lit: before its first update, Angular: before its
config is applied). A `setData` or `setMeta` call in that time must not be lost.

- Scenario: a page creates the form, fills in a draft that it saved in `localStorage`, and then
  adds the form to the page.
- Example:

  ```ts
  const form = document.createElement('gui-core-form');
  form.config = { formDef };
  form.setData({ name: 'Ann' });
  document.body.append(form);
  ```

  -> the form starts with `name: 'Ann'`.

- Status: not yet. Lit and Angular throw "dispatch is not a function". The gui form components do
  not throw, but they ignore the call, so the form starts empty.

### 27. The native `submit` event does not reach ancestor elements

The form handles its own `submit` event and reports it with `formSubmit`. A `submit` listener on
an ancestor, for example of an outer page form, must not run for it.

- Scenario: the page has a script that listens to `submit` on `document`, for example to send
  each page form with `fetch` or to track submits. The script must not handle the GolemUI form.
- Example:

  ```ts
  document.addEventListener('submit', (event) => {
    sendWithFetch(event.target);
  });
  ```

  -> the listener is not called when the GolemUI form submits.

- Status: follows in Vue. Not yet in React, Angular and Lit.

### 28. Nothing is sent after the form is removed

- Scenario: a dialog has a dropdown that searches cities on the server. The user types "Bar" and
  closes the dialog before `inputDebounce` ends.
- Example:

  ```ts
  gui.inputs.dropdown('city', {
    label: 'City',
    items: [],
    inputDebounce: 300,
    onFilter: () => 'searchCities',
    validator: { type: 'string' },
  });
  ```

  -> the dialog closes 100 ms after the last key press -> no `searchCities` event is sent.

- Status: follows in Vue. Not yet in React, which runs the filter and sends the event for a widget
  that no longer exists. The app then starts a server search for a closed form.

### 29. An unknown `itemRenderer` uses the default renderer

- Scenario: several apps use the same JSON form. One app does not register the item renderer
  that the form names, or the name has a typo.
- Example:

  ```ts
  gui.inputs.list('car', { label: 'Car', items: cars, itemRenderer: 'carItem' });
  ```

  with no `carItem` in the `itemRenderers` of the config -> the items render with the default
  renderer.

- Status: follows in React and Vue. Not yet in Lit, which throws a `TypeError`, and Angular, which
  renders empty items.

### 30. A layout hidden at mount has `children: []`

Custom layout widgets read `templateData.children`. Its type is an array, so it must always be
one.

- Scenario: an app has a custom "card" layout widget that renders `templateData.children.map(...)`.
  A card has an `include.when` that is false when the form starts.
- Example: a Lit layout that is hidden at mount -> `templateData.children` is `[]`, and a custom
  widget can call `children.map`.
- Status: follows in Angular. Not yet in Lit, where the key is missing until the layout is first
  visible. So the custom widget throws.

## Events and expressions

### 31. The event name of a function `on` handler is a string

An `on` handler can be a function that returns the event name.

- Scenario: a widget set built on `@golemui/core` (not on the `gui.*` builder) chooses the event
  name from the data. The host handles `formEvent` with a `switch (event.name)`.
- Example:

  ```ts
  on: {
    click: ({ $form }) => ($form.isDraft ? 'saveDraft' : 'publish');
  }
  ```

  -> the form event has `name: 'saveDraft'` or `name: 'publish'`.

- Status: not yet. `FormEvent.name` is the function itself, so a check like
  `event.name === 'publish'` fails.

### 32. A button `onClick` handler runs only on click

- Scenario: an app saves the form with a button that is not a submit button. The handler calls
  the server.
- Example:

  ```ts
  gui.actions.button({ label: 'Save', onClick: (data) => api.save(data) });
  ```

  -> nothing runs when the form is built. On click, the handler gets the form data, and the event
  as a second parameter.

- Status: not yet. Every handler is called once with `undefined` when the form is built, so this
  example calls `api.save(undefined)`. A handler like `(event) => event.data` throws there, and
  the form is not built. On click it gets only the data.

### 33. `$log` works in every expression

`$log(value)` logs a value and returns it, to debug an expression.

- Scenario: a form author wants to know why a label shows the wrong total.
- Example:

  ```ts
  gui.inputs.numberInput('tip', { label: 'Tip for a total of {{ $log($form.total) }}' });
  ```

  -> the form logs the value and shows it in the label, as `$log` does in `when`. The same works
  in an i18n param.

- Status: not yet. It gives error code 40.

## Rules for form authors

### 34. Menu item values are unique

Two items with the same `value` in one menu are not supported. The form does not check it, and
the items can render or select wrong.

- Scenario: an app builds the items of a row menu from a list of actions, and two actions use the
  value `edit`.
- Example: `items: [{ label: 'Edit', value: 'edit' }, { label: 'Rename', value: 'edit' }]` -> not
  supported. Use a unique value for each item.
