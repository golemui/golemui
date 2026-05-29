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
        '`$meta` (host-supplied metadata), and `$formIsInvalid` (built-in boolean — `true` when any field currently fails validation). ' +
        'State names can contain letters, numbers, hyphens, and underscores. ' +
        'Colons enable hierarchical composition — see the "Composed sub-states (colon notation)" pattern below.',
      example: {
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
      name: 'Conditional rendering with include / exclude',
      description:
        'Use `"include": { "in": ["stateName"] }` on any widget to render it only when the named state is active. ' +
        'Use `"exclude": { "from": ["stateName"] }` to render it only when the state is NOT active. ' +
        'Both `in` and `from` are arrays — a widget can be gated on multiple states simultaneously. ' +
        'Prefer the named-state form (`in`/`from`) over the inline `when` expression when the same ' +
        'condition applies to several widgets; use `when` for one-off conditions with no reuse.',
      example: {
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
    'Reactive expressions must reference `$form`, `$meta`, or `$formIsInvalid`. A bare identifier like `termsAccepted` without a root reference is invalid. `$formIsInvalid` is a built-in boolean (no property chain — use it as-is: `disabled: { when: "$formIsInvalid" }` or inside a state expression: `states: { formInvalid: "$formIsInvalid" }`).',
    'Use `===` / `!==` for equality, `&&` / `||` for logic. Avoid `=` (assignment), `==`/`!=` (loose equality), or bitwise `&`/`|`.',
    'When multiple states are active at the same time and a property has more than one matching suffix, the longest state name wins (most specific takes priority). Example: if both `register` and `register:adult` are active, `"label.register:adult"` overrides `"label.register"`.',
    'The `include.when` / `exclude.when` inline form is an alternative to named states for one-off conditions, but it cannot replace state-suffixed props — those require a named state.',
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
    'Slots must reference at least one of `$form`, `$meta`, `$errors`, or `$formIsInvalid`. A bare identifier without a scope prefix is invalid inside `{{}}`: use `{{$form.name}}` not `{{name}}`.',
    '`$formIsInvalid` is a built-in boolean — use it as-is: `{{$formIsInvalid}}`. Do not chain properties onto it.',
    'If an expression evaluates to `null` or `undefined`, the slot renders as an empty string in display text.',
    'Use optional chaining (`?.`) when accessing nested fields that may not yet exist: `{{$form.address?.city}}` not `{{$form.address.city}}`.',
    'Do not use assignment `=` inside a slot — slots are read-only. Use `===` for equality checks.',
    'Slots cannot be nested: `{{$form.a {{$form.b}}}}` is invalid.',
    'Every `{{` must have a matching `}}`. Unbalanced delimiters cause a lint warning.',
    'i18n `params` values are bare expressions — do NOT wrap them in `{{}}`. Write `"$form.name"` not `"{{$form.name}}"`.',
    'Static string params (not starting with `$`) are passed through as-is — use them for constant values like `"Hola"` or `"px"`.',
    'Supported operators in expressions: arithmetic (`+`, `-`, `*`, `/`, `%`), comparison (`===`, `!==`, `<`, `>`, `<=`, `>=`), logical (`&&`, `||`, `!`), ternary (`? :`), optional chaining (`?.`), nullish coalescing (`??`).',
    'Expressions are evaluated using a safe subset of JavaScript — no `eval`, no function calls, no side effects.',
  ],
};

// ---------------------------------------------------------------------------
// Concept registry
// ---------------------------------------------------------------------------

const CONCEPTS: Record<string, GetConceptResult> = {
  states: STATES_CONCEPT,
  'string-interpolation': STRING_INTERPOLATION_CONCEPT,
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
    '(1) change a widget\'s props based on form state (state-suffixed props like `"label.stateName": "…"`), or ' +
    '(2) reuse the same condition across multiple widgets (`include: { in: […] }` / `exclude: { from: […] }`). ' +
    'For a one-off show/hide on a single widget, use `include: { when: "…" }` or `exclude: { when: "…" }` directly — no states needed, no need to call this tool. ' +
    'Currently supported concepts: `states`, `string-interpolation`.',
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
