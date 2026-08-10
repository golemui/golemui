import { FORM_SCHEMA_URL } from './form-schema-url';

export type GetConceptInput = {
  concept: string;
};

export type ConceptPattern = {
  name: string;
  description: string;
  example: unknown;
};

export type GetConceptResult = {
  concept: string;
  summary: string;
  patterns: ConceptPattern[];
  rules: string[];
};

// ---------------------------------------------------------------------------
// States concept
// ---------------------------------------------------------------------------

const STATES_CONCEPT: GetConceptResult = {
  concept: 'states',
  summary:
    'States are named boolean conditions declared at the form root. ' +
    'Each state name maps to a reactive expression string (using `$form`, `$meta`, `$formIsInvalid`, or `$fn`) ' +
    'that the runtime evaluates continuously as the user interacts with the form. ' +
    'Once declared, state names can gate widget visibility (include / exclude) and ' +
    'swap individual widget properties per-state — a capability unique to named states ' +
    'that has no inline `when` equivalent.',

  patterns: [
    {
      name: 'Declare states at the form root',
      description:
        'Add a `"states"` object to the top-level form definition. ' +
        'Each key is a state name; each value is a reactive expression string. ' +
        'Expressions are evaluated at runtime — they have access to `$form` (all current form values), ' +
        '`$meta` (host-supplied metadata), `$formIsInvalid`, and `$fn` (host-provided pure functions). ' +
        'State names can contain letters, numbers, hyphens, and underscores. ' +
        'Colons enable hierarchical composition — see the "Composed sub-states (colon notation)" pattern below.',
      example: {
        $schema: FORM_SCHEMA_URL,
        states: {
          termsAccepted: '$form.terms === true',
          hasDiscount: '$form.hasDiscountCode === true',
          limitReached: '$form.users?.length === 5',
        },
        form: ['/* ... widgets ... */'],
      },
    },
    {
      name: 'Composed sub-states (colon notation)',
      description:
        'Colons in a state name denote hierarchy: `"register"`, `"register:adult"`, `"register:minor:tall"`. ' +
        'At runtime the form engine rewrites every child expression by ANDing the full ancestor chain in front of it. ' +
        'This means you write only the *incremental* condition in a child — the parent conditions are inherited automatically. ' +
        'A child state is active only when ALL of its ancestors are also active.',
      example: {
        // What you write in the form definition:
        statesAsAuthored: {
          register: '$form.agreeTerms === true',
          'register:adult': '$form.user?.age >= 18',
          'register:minor': '$form.user?.age < 18',
          'register:minor:tall': '$form.user?.height > 180',
        },
        // What the runtime actually evaluates (expandStateExpressions output):
        statesAtRuntime: {
          register: '($form.agreeTerms === true)',
          'register:adult': '($form.agreeTerms === true) && ($form.user?.age >= 18)',
          'register:minor': '($form.agreeTerms === true) && ($form.user?.age < 18)',
          'register:minor:tall':
            '($form.agreeTerms === true) && ($form.user?.age < 18) && ($form.user?.height > 180)',
        },
      },
    },
    {
      name: 'Conditional rendering with include / exclude (named-state form)',
      description:
        'Use `"include": { "in": ["stateName"] }` on any widget to render it only when the named state is active. ' +
        'Use `"exclude": { "from": ["stateName"] }` to render it only when the state is NOT active. ' +
        'Both `in` and `from` are arrays — a widget can be gated on multiple states simultaneously.',
      example: {
        $schema: FORM_SCHEMA_URL,
        states: {
          hasDiscount: '$form.hasDiscountCode === true',
        },
        form: [
          {
            kind: 'input',
            type: 'checkbox',
            path: 'hasDiscountCode',
            label: 'I have a discount code',
          },
          {
            kind: 'input',
            type: 'textinput',
            path: 'discountCode',
            label: 'Discount code',
            include: { in: ['hasDiscount'] },
          },
          {
            kind: 'display',
            type: 'alert',
            props: { text: 'No discount applied.' },
            exclude: { from: ['hasDiscount'] },
          },
        ],
      },
    },
    {
      name: 'Inline conditional rendering with `when`',
      description:
        'For a one-off condition that applies to a single widget only, use the inline `when` form: ' +
        '`"include": { "when": "expression" }` or `"exclude": { "when": "expression" }`. ' +
        'The expression is evaluated exactly like a state expression — it has access to `$form`, ' +
        '`$meta`, `$formIsInvalid`, and `$fn`, uses the same safe operator subset, and must use ' +
        'optional chaining for nested fields. ' +
        'No entry in the root `states` map is required. ' +
        'Use this form when the condition is not shared with any other widget; use the named-state ' +
        'form (`in`/`from`) when the same condition gates two or more widgets.',
      example: {
        $schema: FORM_SCHEMA_URL,
        form: [
          {
            kind: 'input',
            type: 'checkbox',
            path: 'agreeTerms',
            label: 'I agree to the terms',
          },
          {
            kind: 'action',
            type: 'button',
            actionType: 'submit',
            label: 'Continue',
            // Show only after terms are accepted — one-off condition, no state needed.
            include: { when: '$form.agreeTerms === true' },
          },
          {
            kind: 'input',
            type: 'textinput',
            path: 'companyName',
            label: 'Company name',
            // Hide when the user selects "individual" account type — one-off condition.
            exclude: { when: "$form.accountType === 'individual'" },
          },
        ],
      },
    },
    {
      name: 'State-suffixed props',
      description:
        'Override individual widget properties when a named state is active by appending ' +
        '`".<stateName>"` to the property key. The unsuffixed key holds the default value; ' +
        'each suffixed key supplies the override for that state. ' +
        'This works on root-level widget properties (`label`, `disabled`, `readonly`, `validator`, `size`) ' +
        'AND on any key inside the `props` object (`hint`, `placeholder`, `items`, `addLabel`, etc.). ' +
        'There is NO inline `when` equivalent for this — state-suffixed props REQUIRE a named state. ' +
        'Multiple suffixes can coexist on the same property; when more than one state is active, ' +
        'the last matching suffix in document order wins.',
      example: {
        $schema: FORM_SCHEMA_URL,
        states: {
          termsAccepted: '$form.terms === true',
          busy: '$meta.submitting === true',
        },
        form: [
          {
            kind: 'input',
            type: 'checkbox',
            path: 'terms',
            label: 'I accept the terms',
          },
          {
            kind: 'action',
            type: 'button',
            label: 'Submit',
            'label.termsAccepted': 'Submit ✓',
            'label.busy': 'Submitting…',
            disabled: true,
            'disabled.termsAccepted': false,
            'disabled.busy': true,
          },
          {
            kind: 'display',
            type: 'alert',
            props: {
              level: 'warning',
              text: 'Please accept the terms to continue.',
              'text.termsAccepted': 'Ready to submit!',
            },
            exclude: { from: ['busy'] },
          },
          {
            kind: 'input',
            type: 'repeater',
            path: 'users',
            label: 'Users',
            addLabel: 'Add user',
            'addLabel.limitReached': "Limit reached — can't add more",
            props: {
              removeLabel: 'Remove',
              template: {
                kind: 'layout',
                type: 'flex',
                props: { direction: 'column' },
                children: [
                  { kind: 'input', type: 'textinput', path: 'users.items.name', label: 'Name' },
                ],
              },
            },
          },
        ],
      },
    },
  ],

  rules: [
    'Every state name used in `include.in`, `exclude.from`, or as a property suffix MUST be declared in the root `"states"` map.',
    'Child state expressions must contain only the *additional* (incremental) condition — ancestor conditions are ANDed in automatically by the runtime. Duplicating a parent condition in a child expression is wrong and redundant.',
    'A sub-state is only ever active when all of its ancestor states are also active. When using `include.in: ["register:adult"]` you do NOT need to also add `"register"` to the array.',
    'State-suffixed root props — only these support suffixes at the widget root level: `label`, `disabled`, `readonly`, `validator`, `size`. All other overridable properties live inside `props`.',
    'State-suffixed props inside `props` — any key inside the `props` object can be suffixed: `"hint.<state>"`, `"placeholder.<state>"`, `"items.<state>"`, `"addLabel.<state>"`, etc.',
    'Suffix names must not contain dots (the dot is the separator between property and state name): `"label.myState"` ✅, `"label.register:adult"` ✅ — `"label.my.state"` ❌.',
    'Reactive expressions must reference `$form`, `$meta`, `$formIsInvalid`, or `$fn`. A bare identifier like `termsAccepted` without a root reference is invalid.',
    'Use `===` / `!==` for equality, `&&` / `||` for logic. Avoid `=` (assignment), `==`/`!=` (loose equality), or bitwise `&`/`|`.',
    'When multiple states are active at the same time and a property has more than one matching suffix, the longest state name wins (most specific takes priority). Example: if both `register` and `register:adult` are active, `"label.register:adult"` overrides `"label.register"`.',
    '`include.in` and `exclude.from` each accept an Array of state names. A widget included `in: ["a", "b"]` renders when state `a` OR state `b` is active.',
    'Use optional chaining (`?.`) when accessing nested fields that may not yet exist in the form data: `$form.user?.age >= 18` not `$form.user.age >= 18`.',
  ],
};

// ---------------------------------------------------------------------------
// String interpolation concept
// ---------------------------------------------------------------------------

const STRING_INTERPOLATION_CONCEPT: GetConceptResult = {
  concept: 'string-interpolation',
  summary:
    'GolemUI supports live data binding in text props via `{{expression}}` template slots. ' +
    'Any string-valued property (e.g. `props.text`, `props.hint`, `label`) can embed one or more ' +
    '`{{...}}` slots. Each slot is a JavaScript-like expression evaluated against the live form ' +
    'state using a safe subset of JavaScript (no side effects; method calls on scope values and ' +
    'host-provided `$fn` functions are the only calls allowed). ' +
    'i18n translation `params` objects accept a matching bare-expression format — the same ' +
    'expressions but without the `{{}}` delimiters.',

  patterns: [
    {
      name: 'Template slots in display text',
      description:
        'Embed `{{expression}}` in any string prop to inject live values. ' +
        'Available scopes: `$form` (all current field values), `$meta` (host-supplied metadata), ' +
        '`$errors` (current validation error messages keyed by field uid), ' +
        '`$formIsInvalid` (boolean — `true` when any field currently fails validation), ' +
        'and `$fn` (host-provided pure functions, called as `$fn.name(...)`). ' +
        'Use optional chaining (`?.`) when accessing nested fields that may not yet exist. ' +
        'Multiple slots can appear in a single string.',
      example: {
        $schema: FORM_SCHEMA_URL,
        form: [
          {
            uid: 'userName',
            kind: 'input',
            type: 'textinput',
            path: 'userName',
            validator: { type: 'string', required: true },
          },
          {
            uid: 'submitBtn',
            kind: 'action',
            type: 'button',
            label: 'Submit',
            actionType: 'submit',
          },
          {
            uid: 'greeting',
            kind: 'display',
            type: 'alert',
            props: { text: 'Hello {{$form.userName}}' },
          },
          {
            uid: 'status',
            kind: 'display',
            type: 'alert',
            props: {
              text: 'Error: {{$errors.userName}} | Form invalid: {{$formIsInvalid}}',
            },
          },
          {
            uid: 'meta-info',
            kind: 'display',
            type: 'alert',
            props: { text: 'Connected as {{$meta.role}} on {{$meta.server}}' },
          },
        ],
      },
    },
    {
      name: 'Expressions in slots',
      description:
        'Slots support full JavaScript-like expressions: arithmetic, string concatenation, ' +
        'ternary conditionals, and optional chaining. The expression is evaluated against the ' +
        'same scope object (`$form`, `$meta`, `$errors`, `$formIsInvalid`, `$fn`). ' +
        'If the expression evaluates to `null` or `undefined`, the slot renders as an empty string.',
      example: {
        $schema: FORM_SCHEMA_URL,
        data: { firstName: 'Jane', lastName: 'Doe', count: 4, role: 'admin' },
        form: [
          {
            uid: 'full-name',
            kind: 'display',
            type: 'alert',
            props: { text: "Full name: {{$form.firstName + ' ' + $form.lastName}}" },
          },
          {
            uid: 'next-count',
            kind: 'display',
            type: 'alert',
            props: { text: 'Next item: {{$form.count + 1}}' },
          },
          {
            uid: 'role-label',
            kind: 'display',
            type: 'alert',
            props: { text: "Role: {{$form.role === 'admin' ? 'Administrator' : 'User'}}" },
          },
          {
            uid: 'nested',
            kind: 'display',
            type: 'alert',
            props: { text: 'City: {{$form.address?.city}}' },
          },
        ],
      },
    },
    {
      name: 'i18n param expressions',
      description:
        'When using i18n translations, `params` values support the same expression language ' +
        'as `{{}}` slots, but as **bare expressions** without the `{{}}` delimiters. ' +
        'Params that start with a `$` scope prefix are evaluated; others are passed as static strings. ' +
        'The expression has access to `$form`, `$meta`, `$errors`, `$formIsInvalid`, and `$fn`.',
      example: {
        $schema: FORM_SCHEMA_URL,
        data: { firstName: 'Jane', lastName: 'Doe', count: 4 },
        meta: { connectionStatus: 'online' },
        form: [
          {
            uid: 'greeting',
            kind: 'display',
            type: 'alert',
            props: {
              text: {
                key: 'user.greeting',
                params: {
                  hello: 'Hola',
                  fullName: "$form.firstName + ' ' + $form.lastName",
                  n: '$form.count + 1',
                  status: '$meta.connectionStatus',
                },
              },
            },
          },
        ],
      },
    },
  ],

  rules: [
    'Slots must reference at least one of `$form`, `$meta`, `$errors`, `$formIsInvalid`, or `$fn`. A bare identifier without a scope prefix is invalid inside `{{}}`: use `{{$form.name}}` not `{{name}}`. `$formIsInvalid` is a bare boolean — do not chain properties onto it.',
    'Inside a repeater `props.template`, slots can additionally reference `$item` (the current repeater item object) and `$index` (its zero-based position): `{{($item.quantity ?? 0) * ($item.unitPrice ?? 0)}}`. Outside a template, `$item`/`$index` are undefined and invalid.',
    'If an expression evaluates to `null` or `undefined`, the slot renders as an empty string in display text.',
    'Use optional chaining (`?.`) when accessing nested fields that may not yet exist: `{{$form.address?.city}}` not `{{$form.address.city}}`.',
    'Do not use assignment `=` inside a slot — slots are read-only. Use `===` for equality checks.',
    'Slots cannot be nested: `{{$form.a {{$form.b}}}}` is invalid.',
    'Every `{{` must have a matching `}}`. Unbalanced delimiters cause a lint warning.',
    'i18n `params` values are bare expressions — do NOT wrap them in `{{}}`. Write `"$form.name"` not `"{{$form.name}}"`.',
    'Static string params (not starting with `$`) are passed through as-is — use them for constant values like `"Hola"` or `"px"`.',
    'The expression language is the same as reactive expressions — see `get_concept({ concept: "reactive-scope" })` for the operator reference and safe-expression constraints.',
  ],
};

// ---------------------------------------------------------------------------
// Reactive scope concept
// ---------------------------------------------------------------------------

const REACTIVE_SCOPE_CONCEPT: GetConceptResult = {
  concept: 'reactive-scope',
  summary:
    'GolemUI reactive expressions (used in `states`, `include.when`, `exclude.when`, and `{{}}` template slots) ' +
    'share a common read-only scope object. The scope exposes five global variables: ' +
    '`$form` (live form data), `$meta` (host-supplied metadata), `$errors` (validation error messages), ' +
    '`$formIsInvalid` (built-in boolean), and `$fn` (host-provided pure functions). ' +
    'Inside a repeater `props.template` two more variables are available: ' +
    '`$item` (the current repeater item object) and `$index` (its zero-based position). ' +
    'All variables are read-only — expressions can only read from them, never write to them.',

  patterns: [
    {
      name: '$form — live form data',
      description:
        '`$form` is a plain object whose keys are the field paths currently registered in the form. ' +
        'Each key equals the `path` property of an input widget. ' +
        'A simple field `path: "firstName"` is accessed as `$form.firstName`. ' +
        'A nested field `path: "address.city"` is accessed as `$form.address?.city` — ' +
        'the dot segments in the path become dot-property accesses, and optional chaining (`?.`) ' +
        'is required at each intermediate segment because the parent object may not yet exist ' +
        'while the user is filling in the form. ' +
        '`$form` itself is always a defined object; only leaf values may be `undefined` before the user fills them in.',
      example: {
        states: {
          // path: "firstName" -> $form.firstName
          hasName: '$form.firstName !== undefined && $form.firstName !== ""',
          // path: "address.city" -> $form.address?.city (optional chaining at "address" segment)
          hasCity: '$form.address?.city !== undefined && $form.address?.city !== ""',
          // path: "user.profile.age" -> $form.user?.profile?.age
          isAdult: '$form.user?.profile?.age >= 18',
        },
      },
    },
    {
      name: '$meta — host-supplied metadata',
      description:
        '`$meta` is a free-form key/value object supplied by the host application at mount time. ' +
        "It is useful for passing server-side flags, the current user's role, locale, or any " +
        'context that is not part of the form data itself. ' +
        'The host sets the `meta` prop on the GolemUI form component; the MCP tool has no knowledge ' +
        'of which keys the host will supply. ' +
        'Access values with `$meta.keyName`. Use optional chaining if a key may not always be present.',
      example: {
        states: {
          isAdmin: "$meta.role === 'admin'",
          isOnline: '$meta.connectionStatus === "online"',
        },
        form: [
          {
            kind: 'input',
            type: 'textinput',
            path: 'apiKey',
            label: 'API key',
            // Show only for admin users — the role comes from $meta, not from $form.
            include: { when: "$meta.role === 'admin'" },
          },
        ],
      },
    },
    {
      name: '$errors — validation error messages',
      description:
        '`$errors` is a plain object keyed by widget `uid`. ' +
        '`$errors.myField` is the current validation error message string for the widget with ' +
        '`uid: "myField"`, or `undefined` if that field is currently valid. ' +
        "Use it to display a field's error message inside another widget (e.g. an `alert`). " +
        'Note: a widget must have an explicit `uid` value set for its errors to appear in `$errors`; ' +
        'auto-generated uids are not predictable.',
      example: {
        $schema: FORM_SCHEMA_URL,
        form: [
          {
            uid: 'emailField',
            kind: 'input',
            type: 'textinput',
            path: 'email',
            label: 'Email',
            validator: { type: 'string', required: true, format: 'email' },
          },
          {
            kind: 'display',
            type: 'alert',
            props: {
              level: 'error',
              // Render the live validation error message for the emailField widget.
              text: '{{$errors.emailField}}',
            },
            // Only show this alert when the field actually has an error.
            include: { when: '$errors.emailField !== undefined' },
          },
        ],
      },
    },
    {
      name: '$formIsInvalid — whole-form validity flag',
      description:
        '`$formIsInvalid` is a built-in boolean that the runtime maintains automatically. ' +
        'It is `true` when ANY field currently has a RECORDED validation failure; `false` otherwise. ' +
        'CAVEAT: validation never runs at mount, so on a pristine form the flag is `false` even when ' +
        'required fields are empty — it flips only after the first validated interaction. ' +
        'To disable a submit button from the start, combine it with a data check ' +
        '(see `get_concept({ concept: "validation" })` for the full explanation). ' +
        'It is NOT a property of `$form` — use it as a bare identifier. ' +
        'Do NOT chain properties onto it: `$formIsInvalid.something` is invalid.',
      example: {
        $schema: FORM_SCHEMA_URL,
        form: [
          {
            kind: 'input',
            type: 'textinput',
            path: 'email',
            label: 'Email',
            validator: { type: 'string', required: true, format: 'email' },
          },
          {
            kind: 'action',
            type: 'button',
            actionType: 'submit',
            label: 'Submit',
            // '$formIsInvalid' alone starts ENABLED on the pristine form (no validation has run
            // yet) — the extra data check covers the not-yet-validated empty state.
            disabled: { when: '$formIsInvalid || $form.email === undefined' },
          },
          {
            kind: 'display',
            type: 'alert',
            props: { level: 'warning', text: 'Please fix the errors above before submitting.' },
            include: { when: '$formIsInvalid' },
          },
        ],
      },
    },
    {
      name: '$fn — host-provided pure functions',
      description:
        '`$fn` is a namespace of pure functions that the host application passes to the form component ' +
        'via the `functions` entry of the init config (a sibling of `dependencies`). ' +
        'Call them as `$fn.functionName(arg1, arg2)`; arguments can be any scope value, including ' +
        '`$form` paths and `$item`/`$index` inside a repeater template, and the returned value is ' +
        'substituted like any other expression result. ' +
        'Use `$fn` to keep complex derivations (totals, currency conversion, formatting) out of the ' +
        'expression string and inside typed, testable host code. ' +
        'The MCP tool has no knowledge of which function names the host supplies. ' +
        'Calling a name the host did not provide throws at evaluation time: template slots surface a ' +
        'form-health error, `when` conditions in flags propagate the error, and `states` treat the ' +
        'expression as `false`. ' +
        'Host functions MUST be pure: derive the result only from the arguments, no side effects.',
      example: {
        $schema: FORM_SCHEMA_URL,
        form: [
          {
            kind: 'display',
            type: 'markdownText',
            props: {
              // grandTotal comes from the host: config.functions = { grandTotal: (items) => ... }
              md: '**Grand Total:** {{$fn.grandTotal($form.lineItems)}}',
            },
            include: { when: '$fn.grandTotal($form.lineItems) > 0' },
          },
        ],
      },
    },
    {
      name: '$item / $index — current repeater item (template scope only)',
      description:
        '`$item` is the data object of the repeater item a widget belongs to, and `$index` is that ' +
        "item's zero-based position in the array. They are available ONLY to widgets inside a " +
        'repeater `props.template` — in `include`/`exclude`/`disabled`/`readonly` `when` conditions, ' +
        '`{{}}` template slots, and i18n params. Outside a template they are `undefined` and the ' +
        'linter flags them. For nested repeaters, `$item`/`$index` refer to the INNERMOST enclosing ' +
        'item; to address an outer level, use the `items` path token through `$form` instead ' +
        '(e.g. `$form.teams.items.name` resolves against each item of the `teams` repeater). ' +
        '`$item` leaf values may be `undefined` while the user fills in the row, so guard them; ' +
        '`$index` is always a defined number.',
      example: {
        $schema: FORM_SCHEMA_URL,
        form: [
          {
            kind: 'input',
            type: 'repeater',
            path: 'lineItems',
            label: 'Line Items',
            props: {
              template: {
                kind: 'layout',
                type: 'flex',
                props: { direction: 'column' },
                children: [
                  {
                    kind: 'input',
                    type: 'number',
                    path: 'lineItems.items.quantity',
                    label: 'Quantity {{$index + 1}}',
                  },
                  {
                    kind: 'display',
                    type: 'markdownText',
                    props: {
                      md: '**Total:** {{(($item.quantity ?? 0) * ($item.unitPrice ?? 0)).toFixed(2)}}',
                    },
                    include: { when: '$item.quantity !== undefined' },
                  },
                ],
              },
            },
          },
        ],
      },
    },
  ],

  rules: [
    'All scope variables are read-only. Expressions may only read values, never assign them.',
    '`$item` and `$index` exist only for widgets inside a repeater `props.template`. In `states` and in widgets outside a template they are undefined and invalid.',
    'For nested repeaters `$item`/`$index` bind to the innermost enclosing item. Use the `items` path token through `$form` to address outer levels.',
    '`$item` leaf values (`$item.someField`) may be `undefined` until the user fills them in — guard with `??` or explicit comparisons. `$index` is always a defined number.',
    '`$form` is always a defined object. Its leaf values (`$form.someField`) may be `undefined` until the user fills them in.',
    'Use optional chaining (`?.`) at every intermediate segment of a nested path. `$form.address?.city` is safe; `$form.address.city` throws if `address` is undefined.',
    'A widget\'s `path` value maps directly to a `$form` key path using the same dot segments. `path: "shipping.address.zip"` -> `$form.shipping?.address?.zip`.',
    '`$formIsInvalid` is a built-in bare boolean — use it directly: `disabled: { when: "$formIsInvalid" }` or `states: { formValid: "!$formIsInvalid" }`. Never chain: `$formIsInvalid.value` is invalid.',
    '`$errors` keys are widget `uid` values, not field path values. A widget must have an explicit `uid` for its errors to be addressable.',
    '`$meta` keys are arbitrary — they depend entirely on what the host application passes to the form component. Use optional chaining if a key may be absent.',
    'Supported operators across all expressions: arithmetic (`+`, `-`, `*`, `/`, `%`), comparison (`===`, `!==`, `<`, `>`, `<=`, `>=`), logical (`&&`, `||`, `!`), ternary (`? :`), optional chaining (`?.`), nullish coalescing (`??`).',
    'Use `===` / `!==` for equality. Avoid `==` / `!=` (loose equality causes unexpected coercions with `undefined`).',
    'Expressions may call methods on scope values (e.g. `.includes()`, `.toFixed()`) and host functions via `$fn.name(...)`. Everything must stay a pure read: no `eval`, no assignments, no side effects.',
    '`$fn` names are defined by the host through the `functions` init config. Calling a name the host did not provide errors the expression at evaluation time — coordinate names with the host.',
  ],
};

// ---------------------------------------------------------------------------
// Validation concept
// ---------------------------------------------------------------------------

const VALIDATION_CONCEPT: GetConceptResult = {
  concept: 'validation',
  summary:
    'Input widgets validate through their declarative `validator` object. Three behaviors are ' +
    'non-obvious and cause real bugs when missed: ' +
    '(1) validation NEVER runs at mount — a pristine form has zero recorded errors, so ' +
    '`$formIsInvalid` starts `false` in every `validateOn` mode; ' +
    '(2) on boolean fields `required: true` does NOT force a checkbox to be checked — `false` is a ' +
    'valid boolean; a mandatory checkbox needs `const: true` AND `required: true` together; ' +
    '(3) when a required field is `undefined` or `null` the failure comes from the base type check, ' +
    'not the `required` rule, so the user sees the `invalid` message (a raw "Invalid input: expected ' +
    'string, received undefined" unless you customize it). Always set custom `messages`.',

  patterns: [
    {
      name: 'Custom error messages per rule (`messages`)',
      description:
        'Every validator accepts a `messages` object mapping rule names to custom error text. ' +
        'The allowed keys depend on the validator type — string: `invalid`, `required`, `minLength`, ' +
        '`maxLength`, `pattern`, `format`, `enum`, `const`; number/integer: `invalid`, `minimum`, ' +
        '`maximum`, `exclusiveMinimum`, `exclusiveMaximum`, `multipleOf`, `enum`, `const`; ' +
        'boolean: `invalid`, `const`; array: `invalid`, `required`, `minItems`, `maxItems`. ' +
        'The special key `invalid` customizes the base type check (wrong type, or `undefined`/`null` ' +
        'on a required field). Note that only string and array validators have a `required` message ' +
        'key — they are the only types with a present-but-empty state (`""` / `[]`); for ' +
        'number/integer/boolean a missing value can only ever show the `invalid` message. ' +
        'Values are plain strings or i18n descriptors `{ key, params?, default? }`. ' +
        'Without `messages`, failures surface library-default text (e.g. "Invalid input: expected ' +
        'string, received undefined") that is not written for end users — production forms should ' +
        'set custom messages for every rule they use, and ALWAYS set `invalid` whenever ' +
        '`required: true` is set (see the next patterns for why).',
      example: {
        $schema: FORM_SCHEMA_URL,
        form: [
          {
            kind: 'input',
            type: 'textinput',
            path: 'email',
            label: 'Email',
            validator: {
              type: 'string',
              required: true,
              format: 'email',
              messages: {
                // `invalid` fires when the value is undefined/null (pristine or cleared) —
                // for the user that IS the required case, so give it the same text.
                invalid: 'Email is required',
                required: 'Email is required',
                format: 'Enter a valid email address',
              },
            },
          },
        ],
      },
    },
    {
      name: 'Mandatory checkbox — `const: true` AND `required: true`, never `required` alone',
      description:
        'On a boolean validator `required: true` is a silent trap: it only rejects a MISSING value ' +
        '(`undefined`/`null`); an unchecked checkbox holding `false` is a perfectly valid boolean and ' +
        'PASSES. To force the box to be checked you need `const: true` — but `const: true` alone is ' +
        'also not enough: a validator without `required: true` is optional, so a pristine checkbox ' +
        'whose value is still `undefined` skips validation entirely and passes too. ' +
        'The full recipe is BOTH rules together, plus messages for BOTH failure modes: ' +
        'a pristine/never-touched checkbox fails the base type check (`invalid` message) while a ' +
        'checked-then-unchecked checkbox fails the `const` rule (`const` message) — set both keys ' +
        'to the same user-facing text.',
      example: {
        $schema: FORM_SCHEMA_URL,
        form: [
          {
            kind: 'input',
            type: 'checkbox',
            path: 'termsAccepted',
            label: 'I accept the terms',
            validator: {
              type: 'boolean',
              required: true, // rejects undefined/null (never touched)
              const: true, // rejects false (unchecked)
              messages: {
                invalid: 'You must accept the terms',
                const: 'You must accept the terms',
              },
            },
          },
        ],
      },
    },
    {
      name: 'The `invalid` message — what empty required fields actually show',
      description:
        'When a required field holds `undefined` or `null` (pristine, or the widget cleared it), the ' +
        'failure is raised by the BASE TYPE check ("expected string, received undefined"), NOT by ' +
        'the `required` rule — the `required` rule only fires on present-but-empty values such as ' +
        '`""` for strings or `[]` for arrays. Consequence: `messages.required` alone does not cover ' +
        'the most common empty state, and the user sees the raw library default instead. ' +
        'Whenever you set `required: true` on a string or array validator, set BOTH ' +
        "`messages.required` AND `messages.invalid`, normally to the same text — from the user's " +
        'perspective both mean "this field is required". On number/integer/boolean validators there ' +
        'is no `required` message key at all — `messages.invalid` is the ONLY way to word the ' +
        'missing-value error, so setting it is not optional there. ' +
        'Note `null` is never valid: even on a non-required field, `null` fails the type check and ' +
        'shows the `invalid` message (only `undefined` is treated as "not filled in yet").',
      example: {
        $schema: FORM_SCHEMA_URL,
        form: [
          {
            kind: 'input',
            type: 'number',
            path: 'age',
            label: 'Age',
            validator: {
              type: 'integer',
              required: true,
              minimum: 18,
              messages: {
                // Number validators have no `required` message key — `invalid` covers the
                // undefined/null case (pristine or cleared input), which IS the required case.
                invalid: 'Age is required',
                minimum: 'You must be at least 18',
              },
            },
          },
        ],
      },
    },
    {
      name: 'When validation runs — `validateOn` and the pristine-form gap',
      description:
        'Validation runs only in response to user interaction, filtered by the form-level ' +
        '`validateOn` config: `"eager"` (the default — the first change OR blur on any field ' +
        'validates the WHOLE form), `"change"`, `"blur"`, `"submit"`, or an array of those. ' +
        'NOTHING validates at mount in ANY mode, so on a pristine form the error map is empty and ' +
        '`$formIsInvalid` is `false` — a submit button with `disabled: { when: "$formIsInvalid" }` ' +
        'starts out ENABLED even when required fields are empty. ' +
        'Clicking a submit button always validates the whole form and the runtime refuses to emit ' +
        'the submit event while invalid — data integrity is safe — but the disabled-until-valid UX ' +
        'needs a compound expression that also checks the data directly, because `$formIsInvalid` ' +
        'only reflects validations that have already run.',
      example: {
        $schema: FORM_SCHEMA_URL,
        form: [
          {
            kind: 'input',
            type: 'textinput',
            path: 'email',
            label: 'Email',
            validator: {
              type: 'string',
              required: true,
              format: 'email',
              messages: { invalid: 'Email is required', required: 'Email is required' },
            },
          },
          {
            kind: 'action',
            type: 'button',
            actionType: 'submit',
            label: 'Submit',
            // '$formIsInvalid' alone leaves this ENABLED on the pristine form (no validation has
            // run yet). The compound expression also disables it while the field is still empty.
            disabled: { when: '$formIsInvalid || $form.email === undefined' },
          },
        ],
      },
    },
  ],

  rules: [
    'Validation NEVER runs at mount. A pristine form has an empty error map and `$formIsInvalid === false` in every `validateOn` mode, including the default `"eager"`.',
    '`disabled: { when: "$formIsInvalid" }` on a submit button leaves it ENABLED on the pristine form. For disabled-until-valid UX, use a compound expression that also checks the data: `"$formIsInvalid || $form.email === undefined"`.',
    'The runtime always re-validates everything on submit click and blocks the submit event while invalid — the pristine gap is a UX issue, not a data-integrity issue.',
    '`validateOn` values: `"eager"` (default; first change or blur anywhere validates the whole form), `"change"`, `"blur"`, `"submit"`, or an array of `"change"`/`"blur"`/`"submit"`.',
    'Boolean `required: true` does NOT force a checkbox to be checked — `false` is a valid boolean. Only `const: true` rejects `false`.',
    '`const: true` alone does NOT cover the pristine case — without `required: true` the validator is optional and `undefined` passes. A mandatory checkbox needs BOTH.',
    'A required field holding `undefined`/`null` fails the base TYPE check, not the `required` rule — the user sees the `invalid` message. The `required` rule only fires on present-but-empty values (`""`, `[]`).',
    'Only string and array validators accept a `required` message key. Number/integer and boolean validators do NOT — `messages.invalid` is the only way to word their missing-value error.',
    'ALWAYS pair `messages.required` with `messages.invalid` (same text) on string/array validators. For a mandatory checkbox, pair `messages.const` with `messages.invalid`.',
    '`null` is never a valid value, even for non-required fields — it fails the type check and shows the `invalid` message. Only `undefined` means "not filled in yet".',
    'Message values are strings or i18n descriptors `{ key, params?, default? }` — the same `Localizable` shape as labels.',
    'Production forms should define custom `messages` for every rule they use — the library defaults (e.g. "Invalid input: expected string, received undefined") are developer-facing, not user-facing.',
  ],
};

// ---------------------------------------------------------------------------
// Icons concept
// ---------------------------------------------------------------------------

const ICONS_CONCEPT: GetConceptResult = {
  concept: 'icons',
  summary:
    'GolemUI uses Google Material Icons for all icon props. ' +
    'An icon value is a Material Icons ligature name — a lowercase string with underscores, ' +
    'such as `"search"`, `"home"`, `"arrow_forward"`, or `"check_circle"`. ' +
    'The icon font must be loaded by the host page; without it, the icon value renders as raw text. ' +
    'Several widgets accept a `props.icon` property; `button` additionally has `props.iconPosition`. ' +
    'All icon props support state suffixes for reactive icon swapping.',

  patterns: [
    {
      name: 'Widget icon props',
      description:
        'The following widgets accept `props.icon` (a Material Icons ligature name string): ' +
        '`button`, `textinput`, `password`, `select`, `currency`, `tags`, `dateInput`, `datePicker`, `rangeCalendar`, `rangedateinput`, `rangedatepicker`. ' +
        'The `button` widget additionally accepts `props.iconPosition` to control where the icon appears relative to the label. ' +
        'All other icon-capable widgets render the icon at a default position determined by the component.',
      example: {
        $schema: FORM_SCHEMA_URL,
        form: [
          {
            kind: 'action',
            type: 'button',
            actionType: 'submit',
            label: 'Send',
            props: {
              // "send" is the Google Material Icons ligature name for the send icon.
              icon: 'send',
              iconPosition: 'right',
            },
          },
          {
            kind: 'input',
            type: 'textinput',
            path: 'email',
            label: 'Email',
            props: {
              icon: 'email',
              placeholder: 'you@example.com',
            },
          },
          {
            kind: 'input',
            type: 'select',
            path: 'country',
            label: 'Country',
            props: {
              icon: 'public',
              options: [
                { label: 'United States', value: 'us' },
                { label: 'Canada', value: 'ca' },
              ],
            },
          },
        ],
      },
    },
    {
      name: 'Reactive icon swapping with state suffixes',
      description:
        'Like other widget props, `icon` supports state suffixes: `"icon.<stateName>": "checkName"` ' +
        'swaps the icon when the named state is active. ' +
        'This is useful for toggling between a default and a confirmation icon, or for indicating ' +
        'a loading state on a button.',
      example: {
        $schema: FORM_SCHEMA_URL,
        states: {
          submitted: '$meta.submitting === true',
        },
        form: [
          {
            kind: 'action',
            type: 'button',
            actionType: 'submit',
            label: 'Submit',
            'label.submitted': 'Submitting...',
            props: {
              icon: 'send',
              // Swap to a spinner/hourglass icon while the form is being submitted.
              'icon.submitted': 'hourglass_empty',
            },
          },
        ],
      },
    },
  ],

  rules: [
    'Icon values are Google Material Icons ligature names — lowercase strings, words separated by underscores: `"search"`, `"arrow_forward"`, `"check_circle"`. Wrong casing or spaces will not render correctly.',
    'The Material Icons font MUST be loaded in the host page\'s `<head>`. Without it, `props.icon` renders as the raw string (e.g. the word "search") rather than an icon glyph.',
    'Widgets that support `props.icon`: `button`, `textinput`, `password`, `select`, `currency`, `tags`, `dateInput`, `datePicker`, `rangeCalendar`, `rangedateinput`, `rangedatepicker`.',
    '`button` is the only widget with `props.iconPosition`. Allowed values: `"left"` (default) and `"right"`.',
    'All icon props support state suffixes: `"icon.<stateName>": "check"` swaps the icon when that state is active. Call `get_concept({ concept: "states" })` for the full state-suffix pattern.',
    'Do not set `props.icon` on widgets that do not support it — the schema will reject it and `json_validate_form_definition` will report an error.',
  ],
};

// ---------------------------------------------------------------------------
// Concept registry
// ---------------------------------------------------------------------------

const CONCEPTS: Record<string, GetConceptResult> = {
  states: STATES_CONCEPT,
  'string-interpolation': STRING_INTERPOLATION_CONCEPT,
  'reactive-scope': REACTIVE_SCOPE_CONCEPT,
  validation: VALIDATION_CONCEPT,
  icons: ICONS_CONCEPT,
};

export function getConcept(input: GetConceptInput): GetConceptResult {
  const result = CONCEPTS[input.concept];
  if (!result) {
    const known = Object.keys(CONCEPTS)
      .sort()
      .map((c) => `\`${c}\``)
      .join(', ');
    throw new Error(`Unknown concept \`${input.concept}\`. Known concepts: ${known}.`);
  }
  return result;
}

export const GET_CONCEPT_TOOL = {
  name: 'get_concept',
  description:
    'Return a detailed guide for a cross-cutting GolemUI form concept — things that span multiple ' +
    'widgets and affect the whole form, rather than the API of a single widget. ' +
    'Call this when you need to: ' +
    '(1) conditionally show or hide widgets (`include`/`exclude`) — both the named-state form (`in`/`from`) and the inline `when` expression form are covered under the `states` concept; ' +
    '(2) change a widget\'s props based on form state (state-suffixed props like `"label.stateName": "…"`); ' +
    '(3) understand what `$form`, `$meta`, `$errors`, `$formIsInvalid`, and `$fn` are and how to reference form data in reactive expressions — use the `reactive-scope` concept; ' +
    '(4) write validators with custom error messages, make a checkbox mandatory, or gate a submit button on validity — use the `validation` concept (it covers three non-obvious traps: no validation at mount, boolean `required` vs `const`, and the `invalid` message); ' +
    '(5) add icons to widgets — use the `icons` concept. ' +
    'Currently supported concepts: `states`, `string-interpolation`, `reactive-scope`, `validation`, `icons`.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      concept: {
        type: 'string' as const,
        description:
          'The concept to explain. Currently supported: `"states"`, `"string-interpolation"`, ' +
          '`"reactive-scope"`, `"validation"`, `"icons"`.',
        enum: Object.keys(CONCEPTS),
      },
    },
    required: ['concept'],
  },
} as const;
