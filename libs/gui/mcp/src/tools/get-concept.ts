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
    'Each state name maps to a reactive expression string (using `$form`, `$meta`, or `$formIsInvalid`) ' +
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
        '`$meta` (host-supplied metadata), and `$formIsInvalid`. ' +
        'State names can contain letters, numbers, hyphens, and underscores. ' +
        'Colons enable hierarchical composition — see the "Composed sub-states (colon notation)" pattern below.',
      example: {
        $schema: 'https://golemui.com/schemas/form.schema.json',
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
        $schema: 'https://golemui.com/schemas/form.schema.json',
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
        '`$meta`, and `$formIsInvalid`, uses the same safe operator subset, and must use optional ' +
        'chaining for nested fields. ' +
        'No entry in the root `states` map is required. ' +
        'Use this form when the condition is not shared with any other widget; use the named-state ' +
        'form (`in`/`from`) when the same condition gates two or more widgets.',
      example: {
        $schema: 'https://golemui.com/schemas/form.schema.json',
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
        $schema: 'https://golemui.com/schemas/form.schema.json',
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
    'Reactive expressions must reference `$form`, `$meta`, or `$formIsInvalid`. A bare identifier like `termsAccepted` without a root reference is invalid.',
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
    'state using a safe subset of JavaScript (no side effects, no function calls). ' +
    'i18n translation `params` objects accept a matching bare-expression format — the same ' +
    'expressions but without the `{{}}` delimiters.',

  patterns: [
    {
      name: 'Template slots in display text',
      description:
        'Embed `{{expression}}` in any string prop to inject live values. ' +
        'Available scopes: `$form` (all current field values), `$meta` (host-supplied metadata), ' +
        '`$errors` (current validation error messages keyed by field uid), ' +
        '`$formIsInvalid` (boolean — `true` when any field currently fails validation). ' +
        'Use optional chaining (`?.`) when accessing nested fields that may not yet exist. ' +
        'Multiple slots can appear in a single string.',
      example: {
        $schema: 'https://golemui.com/schemas/form.schema.json',
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
        'same scope object (`$form`, `$meta`, `$errors`, `$formIsInvalid`). ' +
        'If the expression evaluates to `null` or `undefined`, the slot renders as an empty string.',
      example: {
        $schema: 'https://golemui.com/schemas/form.schema.json',
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
        'The expression has access to `$form`, `$meta`, `$errors`, and `$formIsInvalid`.',
      example: {
        $schema: 'https://golemui.com/schemas/form.schema.json',
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
    'Slots must reference at least one of `$form`, `$meta`, `$errors`, or `$formIsInvalid`. A bare identifier without a scope prefix is invalid inside `{{}}`: use `{{$form.name}}` not `{{name}}`. `$formIsInvalid` is a bare boolean — do not chain properties onto it.',
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
    'share a common read-only scope object. The scope exposes four variables: ' +
    '`$form` (live form data), `$meta` (host-supplied metadata), `$errors` (validation error messages), ' +
    'and `$formIsInvalid` (built-in boolean). ' +
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
        $schema: 'https://golemui.com/schemas/form.schema.json',
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
        'It is `true` when ANY field in the form currently fails its validator; `false` otherwise. ' +
        'Use it to disable the submit button, show a banner, or guard a navigation step. ' +
        'It is NOT a property of `$form` — use it as a bare identifier. ' +
        'Do NOT chain properties onto it: `$formIsInvalid.something` is invalid.',
      example: {
        $schema: 'https://golemui.com/schemas/form.schema.json',
        form: [
          {
            kind: 'action',
            type: 'button',
            actionType: 'submit',
            label: 'Submit',
            // Disable the submit button while any field is invalid.
            disabled: true,
            'disabled.formValid': false,
          },
          {
            kind: 'display',
            type: 'alert',
            props: { level: 'warning', text: 'Please fix the errors above before submitting.' },
            include: { when: '$formIsInvalid' },
          },
        ],
        states: {
          formValid: '!$formIsInvalid',
        },
      },
    },
  ],

  rules: [
    'All four scope variables are read-only. Expressions may only read values, never assign them.',
    '`$form` is always a defined object. Its leaf values (`$form.someField`) may be `undefined` until the user fills them in.',
    'Use optional chaining (`?.`) at every intermediate segment of a nested path. `$form.address?.city` is safe; `$form.address.city` throws if `address` is undefined.',
    'A widget\'s `path` value maps directly to a `$form` key path using the same dot segments. `path: "shipping.address.zip"` -> `$form.shipping?.address?.zip`.',
    '`$formIsInvalid` is a built-in bare boolean — use it directly: `disabled: { when: "$formIsInvalid" }` or `states: { formValid: "!$formIsInvalid" }`. Never chain: `$formIsInvalid.value` is invalid.',
    '`$errors` keys are widget `uid` values, not field path values. A widget must have an explicit `uid` for its errors to be addressable.',
    '`$meta` keys are arbitrary — they depend entirely on what the host application passes to the form component. Use optional chaining if a key may be absent.',
    'Supported operators across all expressions: arithmetic (`+`, `-`, `*`, `/`, `%`), comparison (`===`, `!==`, `<`, `>`, `<=`, `>=`), logical (`&&`, `||`, `!`), ternary (`? :`), optional chaining (`?.`), nullish coalescing (`??`).',
    'Use `===` / `!==` for equality. Avoid `==` / `!=` (loose equality causes unexpected coercions with `undefined`).',
    'No function calls, no `eval`, no side effects. The expression must be a pure read.',
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
        $schema: 'https://golemui.com/schemas/form.schema.json',
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
        $schema: 'https://golemui.com/schemas/form.schema.json',
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
    'Do not set `props.icon` on widgets that do not support it — the schema will reject it and `validate_form_definition` will report an error.',
  ],
};

// ---------------------------------------------------------------------------
// Concept registry
// ---------------------------------------------------------------------------

const CONCEPTS: Record<string, GetConceptResult> = {
  states: STATES_CONCEPT,
  'string-interpolation': STRING_INTERPOLATION_CONCEPT,
  'reactive-scope': REACTIVE_SCOPE_CONCEPT,
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
    '(3) understand what `$form`, `$meta`, `$errors`, and `$formIsInvalid` are and how to reference form data in reactive expressions — use the `reactive-scope` concept; ' +
    '(4) add icons to widgets — use the `icons` concept. ' +
    'Currently supported concepts: `states`, `string-interpolation`, `reactive-scope`, `icons`.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      concept: {
        type: 'string' as const,
        description:
          'The concept to explain. Currently supported: `"states"`, `"string-interpolation"`.',
        enum: Object.keys(CONCEPTS),
      },
    },
    required: ['concept'],
  },
} as const;
