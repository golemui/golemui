# GolemUI — validators

The `validator` of an input: its type, its rules, its messages, and when it runs. Custom
validators are in [extending.md](extending.md).

## A validator

```json
{
  "kind": "input",
  "type": "textinput",
  "path": "email",
  "label": "Email",
  "validator": {
    "type": "string",
    "required": true,
    "format": "email",
    "messages": {
      "required": "Enter your email",
      "invalid": "Enter your email",
      "format": "Enter a valid email"
    }
  }
}
```

A validator has a `type`, the rules of that type, and an optional `messages` map from a rule
name to its text:

| `type`                   | Rules                                                                                                   | Message keys                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `string`                 | `required`, `minLength`, `maxLength`, `exactLength`, `pattern`, `format`, `const`, `enum`               | `invalid`, `required` and one per rule    |
| `number`, `integer`      | `required`, `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`, `multipleOf`, `const`, `enum` | `invalid` and one per rule but `required` |
| `boolean`                | `required`, `const`                                                                                     | `invalid`, `const`                        |
| `array`                  | `required`, `minItems`, `maxItems`, `uniqueItems`                                                       | `invalid`, `required` and one per rule    |
| `file`, `files`, `range` | see the page of the widget that takes them (`fileUpload`, `multiFileUpload`, the `range*` widgets)      |                                           |
| `custom`                 | a validator of your own ([extending.md](extending.md))                                                  |                                           |

A message is a string, or an i18n key `{ "key": "…", "default": "…" }`. Without `messages`
the user sees the defaults, which are written for developers ("Invalid input: expected
string, received undefined"). With the MCP, `get_concept({ "concept": "validation" })` returns
the full guide. Docs: https://golemui.com/json/features/validators.md

## How validation behaves

Three behaviours that the rules below come from:

- **A boolean and `required`.** `false` is a valid boolean, so `"required": true` does not
  force a checkbox to be checked. `"const": true` rejects `false`, but alone it lets the
  pristine `undefined` pass, because a validator that is not required is optional.
- **A missing value and its message.** An `undefined` or `null` value (a pristine or cleared
  field) fails the base type check and shows the `invalid` message, not the `required` one.
  An empty string shows the `required` one.
- **When validation runs.** Only on the triggers of `validateOn` (change, blur and submit by
  default; see [hosts/config.md](hosts/config.md)), never when the form starts. So
  `$formIsInvalid` is `false` until the first validation, and between two triggers it keeps
  the value of the last one: with `blur`, typing a fix into a field changes nothing until the
  field loses focus. A submit validates every field first and sends `formSubmit` only when the
  form is valid.

## Rules

### rule: json-validator-carries-type

When: writing a `validator` in JSON.

Do: give it an explicit `"type"` from the table of "A validator".

Even when: the widget is a plain text input.

Wrong:

- Doing: a validator with no `type`, `"validator": { "required": true }`.

  Because: the validator reports ``Value null at `/form/0/validator/type` is not one of the allowed values``.

Applies: json-api, validators

Source: libs/gui/schemas/src/lib/validators.schema.json, libs/gui/mcp/src/json/errors.ts#formatError

### rule: mandatory-checkbox-required-and-const

When: a checkbox must be checked for the form to be valid, such as accepting terms.

Do: use both: `"validator": { "type": "boolean", "required": true, "const": true }`.

Right:

```json
{
  "kind": "input",
  "type": "checkbox",
  "path": "acceptTerms",
  "label": "I accept the terms",
  "validator": {
    "type": "boolean",
    "required": true,
    "const": true,
    "messages": {
      "invalid": "Accept the terms to continue",
      "const": "Accept the terms to continue"
    }
  }
}
```

Wrong:

- Doing: only `required`, `"validator": { "type": "boolean", "required": true }`.

  Because: `false` passes the validator, so an unchecked box is valid.

- Doing: only `const`, `"validator": { "type": "boolean", "const": true }`.

  Because: the pristine `undefined` passes, so a box never touched is valid.

Applies: json-api, validators, checkbox

Source: libs/gui/validators/src/lib/validators.ts#BooleanValidator, libs/gui/validators/src/lib/validators.ts#fromBooleanValidator

### rule: required-needs-an-invalid-message

When: a validator of a production form has `"required": true`.

Do: set `"messages"` with an `invalid` text. For string and array validators set `required` too, with the same text; for a mandatory checkbox pair `invalid` with `const` the same way.

Even when: a `required` message is already set.

Wrong:

- Doing: `"messages": { "required": "Enter your email" }` and no `invalid`.

  Because: a field never touched shows "Invalid input: expected string, received undefined", not "Enter your email".

Applies: json-api, validators, messages

Source: libs/gui/validators/src/lib/validators.ts#fromStringValidator, libs/gui/validators/src/lib/validators.ts#fromNumberValidator, libs/gui/validators/src/lib/validators.ts#fromBooleanValidator, libs/gui/validators/src/lib/validators.ts#fromArrayValidator, libs/gui/validators/src/lib/validators.ts#resolveMessage

### rule: custom-messages-on-production-forms

When: writing validators for a production form.

Do: add a `"messages"` map, rule name → text.

Wrong:

- Doing: leaving the default messages.

  Because: the user sees messages such as "Invalid input: expected string, received undefined".

Applies: json-api, validators, messages

Source: libs/gui/validators/src/lib/validators.ts#resolveMessage

### decision: disable-submit-only-when-eager

When: the submit button should look unavailable while the form is invalid.

Decide: whether the button gets a `disabled` expression, by the form's `validateOn`.

- **`eager`, the default** — a compound expression that also checks the data: `"disabled": { "when": "$formIsInvalid || $form.email === undefined" }`.
- **Any other `validateOn`** — no `disabled` on the submit button. A submit validates every field, shows the errors, and sends `formSubmit` only when the form is valid.

Wrong:

- Doing: the flag alone, `"disabled": { "when": "$formIsInvalid" }`, with `eager`.

  Because: the button renders enabled while the required fields are still empty; `$formIsInvalid` is `false` until the first validation.

- Doing: the compound expression with `validateOn: 'submit'`.

  Because: after a submit that fails, the button stays disabled even once every field is filled; the only trigger that validates again is a submit, and `formSubmit` never fires.

- Doing: the compound expression with `validateOn: 'blur'`.

  Because: once a field has shown an error, the button stays disabled while the user fixes it, and the Tab that leaves the field skips the button.

Applies: json-api, button, validation, validateOn

Source: libs/core/src/lib/utils/form.ts#calculateValidationVariables, libs/core/src/lib/context/form.context.ts#FormContext
