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
        'State names can contain letters, numbers, hyphens, underscores, and colons ' +
        '(colons are used as a convention for composing sub-states, e.g. `"register:adult"`).',
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
            'include': { in: ['hasDiscount'] },
          },
          {
            kind: 'display',
            type: 'alert',
            props: { text: 'No discount applied.' },
            'exclude': { from: ['hasDiscount'] },
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
          busy: '$form._submitting === true',
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
    'State-suffixed root props — only these support suffixes at the widget root level: `label`, `disabled`, `readonly`, `validator`, `size`. All other overridable properties live inside `props`.',
    'State-suffixed props inside `props` — any key inside the `props` object can be suffixed: `"hint.<state>"`, `"placeholder.<state>"`, `"items.<state>"`, `"addLabel.<state>"`, etc.',
    'Suffix names must be a single segment (no dots in the state name itself): `"label.myState"` ✅ — `"label.my.state"` ❌.',
    'Reactive expressions must reference `$form`, `$meta`, or `$formIsInvalid`. A bare identifier like `termsAccepted` without a root reference is invalid. `$formIsInvalid` is a built-in boolean (no property chain — use it as-is: `disabled: { when: "$formIsInvalid" }` or inside a state expression: `states: { formInvalid: "$formIsInvalid" }`).',
    'Use `===` / `!==` for equality, `&&` / `||` for logic. Avoid `=` (assignment), `==`/`!=` (loose equality), or bitwise `&`/`|`.',
    'When multiple states are active at the same time, the last matching suffix in document order wins for that property.',
    'The `include.when` / `exclude.when` inline form is an alternative to named states for one-off conditions, but it cannot replace state-suffixed props — those require a named state.',
    '`include.in` and `exclude.in` each accept an ARRAY of state names. A widget included `in: ["a", "b"]` renders when state `a` OR state `b` is active.',
  ],
};

// ---------------------------------------------------------------------------
// Concept registry
// ---------------------------------------------------------------------------

const CONCEPTS: Record<string, GetConceptResult> = {
  states: STATES_CONCEPT,
};

export function getConcept(input: GetConceptInput): GetConceptResult {
  const result = CONCEPTS[input.concept];
  if (!result) {
    const known = Object.keys(CONCEPTS).sort().map((c) => `\`${c}\``).join(', ');
    throw new Error(
      `Unknown concept \`${input.concept}\`. Known concepts: ${known}.`,
    );
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
    'Currently supported concepts: `states`.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      concept: {
        type: 'string' as const,
        description: 'The concept to explain. Currently supported: `"states"`.',
        enum: Object.keys(CONCEPTS),
      },
    },
    required: ['concept'],
  },
} as const;
