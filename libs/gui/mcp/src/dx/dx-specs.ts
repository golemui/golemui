/**
 * DX grounding registry — the real `gui.*` builder surface, one entry per factory.
 *
 * GolemUI is not in any model's training data, so a cold model fabricates the
 * `gui.*` API wholesale. This registry is what `dx_get_spec` serves so the model
 * writes the real thing. Every `example` here is **compile-verified against the
 * real `@golemui` types** by `dx-specs.spec.ts` — if an example is wrong, the test
 * suite fails. (Hand-written references are unreliable even with repo access; the
 * compile gate is the cure.)
 */

import { formEventNames } from '@golemui/core';

export type DxNamespace = 'inputs' | 'actions' | 'displays' | 'layouts';

/** Widgets-reference URL group per namespace: `widgets-reference/<group>/<docSlug>.md`. */
export const DOC_GROUP: Record<DxNamespace, string> = {
  inputs: 'input-fields',
  actions: 'interactive-fields',
  displays: 'display-fields',
  layouts: 'layout-fields',
};

export interface DxSpec {
  /** Factory name, e.g. `textInput`. */
  factory: string;
  namespace: DxNamespace;
  docSlug: string;
  /** Human-readable calling convention. */
  call: string;
  /** A compiling `gui.*` snippet (verified by the suite). */
  example: string;
  /** Authoring notes and gotchas. */
  notes: string[];
}

/** The absolute widgets-reference page URL for a factory (dx or json flavor). */
export function dxDocUrl(spec: DxSpec, dsl: 'dx' | 'json' = 'dx'): string {
  return `https://golemui.com/${dsl}/widgets-reference/${DOC_GROUP[spec.namespace]}/${spec.docSlug}.md`;
}

/**
 * A cross-cutting authoring pattern that is NOT a single factory — e.g. conditional
 * visibility, which is a common field available on every `gui.*` item. Same compile
 * guarantee as `DxSpec`: every `example` is verified by `dx-specs.spec.ts`.
 */
export interface DxPattern {
  /** Short identifier, e.g. `conditionalVisibility`. */
  name: string;
  /** One-line title. */
  title: string;
  /** A compiling `gui.*` snippet (verified by the suite). */
  example: string;
  notes: string[];
}

// ─── Framework ───
// The form definition (the gui.* array) is IDENTICAL for every framework. The only framework-specific
// part is the host wiring — which package the form component comes from, how it's rendered, and how a
// submit is received. The MCP is told its target framework (env `GOLEMUI_FRAMEWORK`, default react) so
// the grounding shows the CORRECT imports + render snippet and the model never guesses the wrong one.
export type DxFramework = 'react' | 'angular' | 'vue' | 'lit' | 'vanilla';

const DX_FRAMEWORKS: readonly DxFramework[] = ['react', 'angular', 'vue', 'lit', 'vanilla'];

export function resolveDxFramework(): DxFramework {
  const raw =
    typeof process !== 'undefined' ? process.env?.['GOLEMUI_FRAMEWORK']?.toLowerCase() : undefined;
  return (DX_FRAMEWORKS as readonly string[]).includes(raw ?? '') ? (raw as DxFramework) : 'react';
}

const FRAMEWORK_SETUP: Record<DxFramework, string> = {
  react:
    "RENDER (React) — `import { gui } from '@golemui/gui-shared'; import { GuiForm } from " +
    "'@golemui/gui-react'; import type { FormSubmitEvent } from '@golemui/core';`, then render " +
    '`<GuiForm config={{ formDef: form }} formSubmit={(e: FormSubmitEvent) => { /* e.data is the form data */ }} />`. ' +
    'A `gui.displays.display(() => <h2>…</h2>)` returns React JSX. ' +
    'For SSR (Next.js App Router) await `preloadFormWidgets({ widgetLoaders })` from `@golemui/core` before the ' +
    "first render on both server and client (a `'use client'` provider that `use()`s a module-scope promise); " +
    '`widgetLoaders` comes from `@golemui/gui-react`. Set `formName`.',
  angular:
    "RENDER (Angular) — `import { gui } from '@golemui/gui-shared'; import { FormComponent } from " +
    "'@golemui/gui-angular';`, add `FormComponent` to the standalone component's `imports`, then in the " +
    'template `<gui-form [config]="{ formDef: form }" (formSubmit)="onSubmit($event)"></gui-form>` — `$event` is ' +
    'a `FormSubmitEvent` (type from `@golemui/core`), `$event.data` is the form data.',
  vue:
    "RENDER (Vue) — `import { gui } from '@golemui/gui-shared'; import { GuiForm } from '@golemui/gui-vue';`, " +
    'then `<GuiForm :config="{ formDef: form }" @form-submit="onSubmit" />` — the handler receives a ' +
    '`FormSubmitEvent` (`.data` is the form data). The event is `form-submit` (kebab-case), not `formSubmit`. ' +
    'For SSR (Nuxt) await `preloadFormWidgets({ widgetLoaders })` from `@golemui/core` before the first render ' +
    'on both server and client (a Nuxt plugin); `widgetLoaders` comes from `@golemui/gui-vue`.',
  lit:
    "RENDER (Lit) — `import { gui } from '@golemui/gui-shared'; import '@golemui/gui-lit';` (registers the " +
    '`<gui-form>` custom element), then `<gui-form .config=${{ formDef: form }} @' +
    formEventNames.submit +
    '=${(e: CustomEvent) ' +
    '=> { /* e.detail is the FormSubmitEvent; e.detail.data */ }}></gui-form>`. The event name is ' +
    '`' +
    formEventNames.submit +
    '` (camelCase) — Lit dispatches a raw CustomEvent, so there is no kebab-case alias. ' +
    'For SSR (Astro, plain Node) the server renders the whole form with `renderGuiHtml` from `@golemui/lit/ssr` ' +
    '(needs `@lit-labs/ssr`) after `preloadFormWidgets({ widgetLoaders })`; the client preloads again and calls ' +
    '`resumeServerRenderedForm` from `@golemui/lit`. `formName` is mandatory; custom widgets register with ' +
    '`safeDefine` from `@golemui/lit`, not `@customElement`.',
  vanilla:
    "RENDER (vanilla JS) — `import { gui } from '@golemui/gui-shared'; import '@golemui/gui-lit';` (registers " +
    "`<gui-form>`), then `const el = document.querySelector('gui-form'); el.config = { formDef: form }; " +
    "el.addEventListener('" +
    formEventNames.submit +
    "', (e) => { /* e.detail.data */ });`. In TypeScript, type the element — " +
    "`import type { FormElement } from '@golemui/gui-lit'; const el = document.querySelector<FormElement>('gui-form');` — " +
    'the published types do not register `gui-form` in `HTMLElementTagNameMap`, so an untyped ' +
    '`querySelector` yields `Element` and `el.config` fails to compile.',
};

function commonNote(fw: DxFramework = 'react'): string {
  return (
    'GolemUI builds FORMS — data collection and validation. It is NOT a general-purpose UI toolkit: it never ' +
    'renders documents, page content, or markdown for display. ' +
    'A form is just an array of these items: `export const form = [ /* items */ ];`. ' +
    FRAMEWORK_SETUP[fw] +
    ' ' +
    'Import the component stylesheet ONCE — `@golemui/gui-components/index.css` — or the form renders unstyled. ' +
    "To RECEIVE A SUBMIT: add a `gui.actions.button({ label, actionType: 'submit' })` to the form and listen for " +
    'the submit on the host component (the RENDER line above shows how for your framework) — the handler gets a ' +
    '`FormSubmitEvent` whose `.data` is the collected form data. ' +
    'To DISABLE submit until the form is valid, add ' +
    "`disabled: { when: '$formIsInvalid || $form.<requiredField> === undefined' }` to that button. " +
    '`$formIsInvalid` is a built-in validity flag, but validation NEVER runs at mount, so on the ' +
    'pristine form it is `false` and `$formIsInvalid` ALONE leaves the button ENABLED while required ' +
    'fields are still empty — the extra data check covers that gap. See the ' +
    'conditional-and-state-props pattern. ' +
    'The SAME `formDef` renders in every framework (React/Angular/Vue/Lit/vanilla) — only the host wrapper changes. ' +
    'FORM-LEVEL CONFIG — `formDef` is ALWAYS the bare array. Anything form-wide (named `states`, `validateOn`) ' +
    'goes in a sibling `formConfig` on the config (`config={{ formDef: form, formConfig: { states, validateOn } }}`), ' +
    'NEVER inside `formDef`. Do NOT wrap the array as `{ states, form: [...] }` and pass THAT as `formDef` — ' +
    '`formDef` is typed `Record<string, any>` so it COMPILES, but the `gui.*` items are never resolved and the form ' +
    'renders BLANK with no error. See the form-level-states pattern. ' +
    'Common fields like `include`/`exclude` (conditional visibility) go INSIDE a factory’s config argument — ' +
    'never spread them onto the result (`{ ...gui.inputs.x(...), include }` compiles but silently does nothing). ' +
    'See the conditional-visibility pattern. ' +
    'STATIC CONTENT — a section heading or any non-input text/block is the HOST’s job, not GolemUI’s: use ' +
    '`gui.displays.display(() => <h2>…</h2>)` returning your framework’s own node (React JSX, Vue/Angular/Lit ' +
    'node) — it needs no dependency and always renders. ' +
    'MARKDOWN has exactly ONE use: `gui.inputs.markdown`, an INPUT where the user EDITS markdown (its value is ' +
    'their markdown string). There is NO markdown-for-display widget — never use markdown to render a heading or ' +
    'content; use `display` for that. ' +
    'VALIDATOR `type` — one rule, three cases (so you never have to guess): (1) choice widgets ' +
    "(`dropdown`, `radiogroup`, `select`) REQUIRE an explicit `type`: `validator: { type: 'string', required: true }`. " +
    '(2) `repeater` (array), `tags` (array), `fileUpload` (file) and `multiFileUpload` (files) validators auto-supply their `type` — supply only the rules, e.g. ' +
    '`validator: { required: true, minItems: 1 }`, never `type`. (3) everything else (text, number, date) takes the ' +
    'loose validator with NO `type`: `validator: { required: true }`. ' +
    'EVENT HANDLERS — `onChange`/`onLoad`/`onFilter`/`onBlur` (inputs/layouts) and `onClick` (actions) are ' +
    'FUNCTIONS, never bare strings: return a string to dispatch a host event by that name ' +
    "(`onChange: () => 'languageChanged'`), or take the event to push live changes " +
    "(`onChange: (event) => event.update({ path: 'city', options: [...] })`)."
  );
}

// Cross-cutting patterns that aren't a single factory. Each example is compile-verified.
const PATTERNS: DxPattern[] = [
  {
    name: 'conditionalVisibility',
    title: 'Show or hide a field conditionally (hide-when)',
    example:
      "gui.inputs.textInput('promoCode', { label: 'Promo code', include: { when: '$form.hasPromoCode === true' } })",
    notes: [
      '`include` and `exclude` are common config fields on EVERY `gui.*` item — pass them inside the ' +
        "factory's config argument (the same object as `label`): " +
        "`gui.inputs.textInput('promoCode', { label, include: { when: '$form.hasPromoCode === true' } })`. " +
        '`include` shows the field only while the expression is true; `exclude` hides it while true.',
      'NEVER attach them by spreading the factory result: ' +
        "`{ ...gui.inputs.textInput('promoCode', { label }), include: { when } }` COMPILES (TypeScript " +
        'does not flag it) but is a silent no-op — the field renders unconditionally. The `include`/`exclude` ' +
        'must be a key of the config object, not a sibling of the spread.',
      'The `when` value is a `ReactiveExpression` (a plain string) that reads form state via `$form.<path>` and ' +
        "uses strict equality, e.g. `'$form.hasPromoCode === true'`. When the SAME condition gates two or more " +
        "fields, define a named state and use `include: { in: ['stateName'] }` / `exclude: { from: [...] }` " +
        'instead of an inline `when`. Named states are declared in `formConfig.states` — see the form-level-states pattern.',
    ],
  },
  {
    name: 'formLevelStates',
    title: 'Declare named form-level states (and gate fields by them)',
    example:
      "gui.inputs.textInput('spouseName', { label: 'Spouse name', include: { in: ['familyCoverage'] } })",
    notes: [
      'Named states are form-level: declare them in `formConfig.states`, a sibling of `formDef` on the ' +
        '`<GuiForm>` config — NOT a wrapper around the array. `formConfig.states` maps each state name to a ' +
        "`ReactiveExpression` string, e.g. `{ familyCoverage: '$form.coverageType === \\'family\\'' }`. Then any " +
        "item references it by name: `include: { in: ['familyCoverage'] }` (show while true) / " +
        "`exclude: { from: ['familyCoverage'] }` (hide while true).",
      'Full shape: ' +
        "`<GuiForm config={{ formDef: form, formConfig: { states: { familyCoverage: '...' }, validateOn: 'blur' } }} />`. " +
        'The `formDef` stays the bare `gui.*` array.',
      'NEVER pass `{ states, form: [...] }` as `formDef`. It type-checks (`formDef` is `Record<string, any>`) ' +
        'but that object is not recognized as a `gui.*` bundle, so the items are never resolved — the form renders ' +
        'BLANK with no console error. The `{ states, form }` shape only exists for hand-written core/JSON widgets, ' +
        'not the `gui.*` facade.',
    ],
  },
  {
    name: 'conditionalAndStateProps',
    title: 'Conditional & state-driven props (enable/disable, show/hide, readonly)',
    example:
      "gui.actions.button({ label: 'Submit', actionType: 'submit', disabled: { when: '$formIsInvalid || $form.email === undefined' } })",
    notes: [
      'ENABLE/DISABLE & READONLY: `disabled` and `readonly` are typed `boolean | { when: <expr> }`. ' +
        '`$formIsInvalid` is a built-in validity flag — do not declare it as a state.',
      "PRISTINE-FORM TRAP: validation never runs at mount, so `$formIsInvalid` starts `false` and `disabled: { when: '$formIsInvalid' }` " +
        'leaves the submit button ENABLED while required fields are still empty (it disables only after the first ' +
        'validated interaction). Gate the button with a compound expression that also checks the data — the example ' +
        'above adds `|| $form.email === undefined` for a form whose required field is `email`. The runtime still blocks the actual submit while ' +
        'invalid, so this is a UX concern, not a data-integrity one.',
      "SHOW/HIDE: `include` / `exclude` are typed `{ in: ['stateName'] }` / `{ from: ['stateName'] }` (state lists) " +
        'or `{ when: <expr> }`. Every state name in `in`/`from` MUST be declared in `formConfig.states`; an ' +
        'undeclared name leaves the widget hidden forever (the engine logs an error to the console).',
      'These are ALL typed config keys — pass them inside the factory’s config argument. NEVER reach a prop by ' +
        "casting the factory result and assigning a key (`(btn as any)['disabled.formValid'] = false`) or by " +
        'spreading (`{ ...gui.actions.button(...), disabled }`): keys added that way are SILENTLY ignored and the ' +
        'behavior never fires. If a prop is not on the typed config, you are guessing — it is not a real field.',
    ],
  },
  {
    name: 'validationMessages',
    title: 'Validation rules & custom error messages (required, const, messages)',
    example:
      "gui.inputs.textInput('email', { label: 'Email', validator: { required: true, format: 'email', messages: { invalid: 'Email is required', required: 'Email is required', format: 'Enter a valid email address' } } })",
    notes: [
      'Every validator accepts a `messages` map from rule name to custom error text (string or i18n ' +
        '`{ key, params?, default? }`). Keys per type — string: `invalid`, `required`, `minLength`, `maxLength`, ' +
        '`pattern`, `format`, `enum`, `const`; number: `invalid`, `minimum`, `maximum`, `exclusiveMinimum`, ' +
        '`exclusiveMaximum`, `multipleOf`, `enum`, `const`; boolean: `invalid`, `const`; array: `invalid`, ' +
        '`required`, `minItems`, `maxItems`. The special key `invalid` customizes the base type check. ' +
        'Set custom messages for every rule you use — the library defaults (e.g. "Invalid input: expected string, ' +
        'received undefined") are developer-facing, not user-facing.',
      'ALWAYS pair `messages.required` with `messages.invalid` (same text): an `undefined`/`null` value — the ' +
        'pristine or cleared field, the most common empty state — fails the base TYPE check and shows the `invalid` ' +
        'message; the `required` rule only fires on present-but-empty values (`""`, `[]`). That is also why ' +
        'number/boolean validators have NO `required` message key — for them `messages.invalid` is the only way to ' +
        'word the missing-value error. `null` is never valid, even on non-required fields.',
      'MANDATORY CHECKBOX: boolean `required: true` does NOT force it checked (`false` is a valid boolean) and ' +
        '`const: true` alone lets the pristine `undefined` pass. Use both plus paired messages — see the ' +
        '`gui.inputs.checkbox` entry for the full recipe.',
      'WHEN VALIDATION RUNS: only on user interaction, per `formConfig.validateOn` — `"eager"` (default: first ' +
        'change or blur anywhere validates the whole form), `"change"`, `"blur"`, `"submit"`, or an array. NOTHING ' +
        'validates at mount, which is why `$formIsInvalid` starts `false` — see the conditional-and-state-props ' +
        'pattern for gating the submit button correctly. Submit clicks always re-validate everything and the ' +
        'runtime blocks the submit event while invalid.',
    ],
  },
];

// Inputs are `gui.inputs.<factory>(path, props?)` — path (the data key) is first.
const INPUTS: DxSpec[] = [
  {
    factory: 'textInput',
    namespace: 'inputs',
    docSlug: 'textinput',
    call: 'gui.inputs.textInput(path, { label, placeholder?, defaultValue?, validator? })',
    example:
      "gui.inputs.textInput('fullName', { label: 'Full name', validator: { required: true, minLength: 2 } })",
    notes: [
      'Text fields accept a loose validator: `{ required, minLength, maxLength, pattern, format }` (no `type` needed).',
      "Email is a text input with `validator: { required: true, format: 'email' }` — use `format`, not a regex. " +
        'The full `format` enum: `email`, `url`, `uuid`, `hostname`, `ipv4`, `ipv6`, `date`, `time`, `date-time`, `duration`.',
    ],
  },
  {
    factory: 'numberInput',
    namespace: 'inputs',
    docSlug: 'number',
    call: 'gui.inputs.numberInput(path, { label, defaultValue?, validator? })',
    example:
      "gui.inputs.numberInput('age', { label: 'Age', validator: { required: true, minimum: 0, maximum: 120 } })",
    notes: [
      'Number validator: `{ required, minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf }`.',
    ],
  },
  {
    factory: 'booleanInput',
    namespace: 'inputs',
    docSlug: 'toggle',
    call: 'gui.inputs.booleanInput(path, { label, defaultValue? })',
    example:
      "gui.inputs.booleanInput('newsletter', { label: 'Subscribe to newsletter', defaultValue: false })",
    notes: ['The on/off toggle for a single boolean. Use `checkbox` for a checkbox presentation.'],
  },
  {
    factory: 'checkbox',
    namespace: 'inputs',
    docSlug: 'checkbox',
    call: 'gui.inputs.checkbox(path, { label, defaultValue?, validator? })',
    example:
      "gui.inputs.checkbox('terms', { label: 'I accept the terms', validator: { required: true, const: true, messages: { invalid: 'You must accept the terms', const: 'You must accept the terms' } } })",
    notes: [
      'A single boolean rendered as a checkbox.',
      'MANDATORY CHECKBOX (terms acceptance): `required: true` alone is a silent trap — an unchecked box holding ' +
        '`false` is a valid boolean and PASSES; only `const: true` rejects `false`. And `const: true` alone lets the ' +
        'pristine `undefined` pass (non-required validators are optional). Use BOTH, as in the example.',
      'Set BOTH `messages.invalid` and `messages.const` to the same text: a never-touched box fails the type check ' +
        '(`invalid` message), a checked-then-unchecked box fails the `const` rule (`const` message). See the ' +
        'validation-messages pattern.',
    ],
  },
  {
    factory: 'textarea',
    namespace: 'inputs',
    docSlug: 'textarea',
    call: 'gui.inputs.textarea(path, { label, placeholder?, validator? })',
    example: "gui.inputs.textarea('bio', { label: 'Bio', validator: { maxLength: 500 } })",
    notes: ['Multi-line text; same loose string validator as `textInput`.'],
  },
  {
    factory: 'password',
    namespace: 'inputs',
    docSlug: 'password',
    call: 'gui.inputs.password(path, { label, validator? })',
    example:
      "gui.inputs.password('password', { label: 'Password', validator: { required: true, minLength: 8 } })",
    notes: ['Masked text input; loose string validator.'],
  },
  {
    factory: 'dropdown',
    namespace: 'inputs',
    docSlug: 'dropdown',
    call: 'gui.inputs.dropdown(path, { label, items, validator? })',
    example:
      "gui.inputs.dropdown('country', { label: 'Country', items: [{ value: 'us', label: 'United States' }, { value: 'ca', label: 'Canada' }], validator: { type: 'string', required: true } })",
    notes: [
      'Choice list uses **`items`** (`{ value, label }[]`).',
      "WART: choice widgets (`dropdown`, `radiogroup`, `select`) need a **typed** validator — `{ type: 'string', required: true }` — unlike text inputs which accept the loose `{ required: true }`. Add the `type`, or omit the validator.",
    ],
  },
  {
    factory: 'multiDropdown',
    namespace: 'inputs',
    docSlug: 'multi-dropdown',
    call: 'gui.inputs.multiDropdown(path, { label, items, validator? })',
    example:
      "gui.inputs.multiDropdown('countries', { label: 'Countries', items: [{ value: 'us', label: 'United States' }, { value: 'ca', label: 'Canada' }], validator: { type: 'array', required: true } })",
    notes: [
      'Multi-select dropdown: the value is an **array** of the selected item values; selections render as removable pills to the left of the filter input and the panel stays open while toggling.',
      "The validator must be array-typed — `{ type: 'array', required: true, minItems?, maxItems? }`. Selection is never silently blocked; cap it with `maxItems` so the user is told why.",
    ],
  },
  {
    factory: 'radiogroup',
    namespace: 'inputs',
    docSlug: 'radiogroup',
    call: 'gui.inputs.radiogroup(path, { label, options, defaultValue?, validator? })',
    example:
      "gui.inputs.radiogroup('accountType', { label: 'Account type', defaultValue: 'personal', options: [{ value: 'personal', label: 'Personal' }, { value: 'business', label: 'Business' }] })",
    notes: [
      'Radio group uses **`options`** (`{ value, label }[]`) — note the asymmetry: `dropdown` uses `items`, `radiogroup` uses `options`.',
      "If required, use a typed validator `{ type: 'string', required: true }` (same wart as `dropdown`).",
    ],
  },
  {
    factory: 'datePicker',
    namespace: 'inputs',
    docSlug: 'date-picker',
    call: 'gui.inputs.datePicker(path, { label, minDate?, maxDate?, validator? })',
    example:
      "gui.inputs.datePicker('startDate', { label: 'Coverage start', minDate: '2025-01-01', validator: { required: true } })",
    notes: [
      'THE DEFAULT single-date field: a text field with a popover calendar (click to open). Prefer this for ' +
        'most dates. (`calendar` = always-visible inline calendar; `dateInput` = typed entry, no calendar UI.) ' +
        'Accepts the loose `{ required: true }` validator.',
      'Bound the selectable range with **`minDate`** / **`maxDate`** — ISO `YYYY-MM-DD` strings. For ' +
        '"today or later" set `minDate` to today’s date; for "not in the future" set `maxDate` to today. ' +
        'Same `minDate`/`maxDate` on `calendar`, `dateInput`, and the range date widgets.',
      'A partially typed date abandoned on focus leave flips the value to null — flagging the field even when ' +
        'optional — and surfaces an "incomplete" error; **`incompleteMessage`** overrides its wording. The same ' +
        'prop exists on every typed date/time widget (the inputs, the pickers, the range inputs/pickers, and the ' +
        'inline `dateTimeCalendar`/`rangeDateTimeCalendar`), and an emptied widget clears the error on the next ' +
        'focus leave.',
    ],
  },
  {
    factory: 'currency',
    namespace: 'inputs',
    docSlug: 'currency',
    call: 'gui.inputs.currency(path, { label, validator? })',
    example:
      "gui.inputs.currency('price', { label: 'Price', validator: { required: true, minimum: 0 } })",
    notes: ['Numeric money input; number-style validator.'],
  },
  {
    factory: 'select',
    namespace: 'inputs',
    docSlug: 'select',
    call: 'gui.inputs.select(path, { label, options, validator? })',
    example:
      "gui.inputs.select('plan', { label: 'Plan', options: [{ value: 'free', label: 'Free' }, { value: 'pro', label: 'Pro' }], validator: { type: 'string', required: true } })",
    notes: [
      'Choice widget that uses **`options`** (like `radiogroup`) — NOT `items` (which `dropdown` uses).',
      "Same validator wart as the other choice widgets: if required, use a typed validator `{ type: 'string', required: true }`.",
    ],
  },
  {
    factory: 'dateInput',
    namespace: 'inputs',
    docSlug: 'dateinput',
    call: 'gui.inputs.dateInput(path, { label, minDate?, maxDate?, validator? })',
    example:
      "gui.inputs.dateInput('startDate', { label: 'Start date', incompleteMessage: 'Incomplete date!', validator: { required: true } })",
    notes: [
      'Typed date entry, NO calendar UI — use only when keyboard-first entry is wanted. For most dates use ' +
        '`datePicker` (popover calendar) instead. Accepts the loose `{ required: true }`.',
      '`minDate` / `maxDate` (ISO `YYYY-MM-DD` strings) constrain the accepted range — see `datePicker`.',
      '`incompleteMessage` overrides the "incomplete" error surfaced when focus leaves a partial entry — see `datePicker`.',
    ],
  },
  {
    factory: 'timeInput',
    namespace: 'inputs',
    docSlug: 'timeinput',
    call: 'gui.inputs.timeInput(path, { label, hourFormat?, minuteStep?, validator? })',
    example: "gui.inputs.timeInput('meetingTime', { label: 'Meeting time', minuteStep: 15 })",
    notes: [
      'Typed time entry (hh:mm segments). Emits an ISO time string (`HH:mm:ss`) — pair with the ' +
        "`{ format: 'time' }` validator. `hourFormat` forces '12'/'24' (default: locale); " +
        '`minuteStep` sets the arrow-key minute increment.',
      '`incompleteMessage` overrides the "incomplete" error surfaced when focus leaves a partial entry — see `datePicker`.',
    ],
  },
  {
    factory: 'timePicker',
    namespace: 'inputs',
    docSlug: 'timepicker',
    call: 'gui.inputs.timePicker(path, { label, minTime?, maxTime?, minuteStep?, disabledRanges?, allowCustomTime?, validator? })',
    example:
      "gui.inputs.timePicker('meetingTime', { label: 'Meeting time', minTime: '09:00', maxTime: '18:00', minuteStep: 30 })",
    notes: [
      'Time field with a popover list of slots built from `minTime`..`maxTime` stepping `minuteStep` ' +
        '(default 30). `disabledRanges` (`{ start, end }[]`, inclusive) greys slots out. Typing is off ' +
        "unless `allowCustomTime: true`. Emits `HH:mm:ss` — pair with the `{ format: 'time' }` validator.",
      '`incompleteMessage` overrides the "incomplete" error surfaced when focus leaves a partial typed entry — see `datePicker`.',
    ],
  },
  {
    factory: 'dateTimeInput',
    namespace: 'inputs',
    docSlug: 'datetimeinput',
    call: 'gui.inputs.dateTimeInput(path, { label, hourFormat?, minuteStep?, validator? })',
    example: "gui.inputs.dateTimeInput('meetingAt', { label: 'Meeting at' })",
    notes: [
      'Typed date+time entry in one locale-ordered row. Emits a local ISO date-time ' +
        "(`YYYY-MM-DDTHH:mm:ss`) — pair with the `{ format: 'date-time' }` validator. " +
        '`hourFormat`/`minuteStep` as in `timeInput`.',
      '`incompleteMessage` overrides the "incomplete" error surfaced when focus leaves a partial entry — see `datePicker`.',
    ],
  },
  {
    factory: 'calendar',
    namespace: 'inputs',
    docSlug: 'calendar',
    call: 'gui.inputs.calendar(path, { label, minDate?, maxDate? })',
    example: "gui.inputs.calendar('day', { label: 'Pick a day', minDate: '2025-01-01' })",
    notes: [
      'An always-visible INLINE calendar (no popover) — use when the calendar should be shown on the page. ' +
        'For a compact single-date field use `datePicker` instead.',
      '`minDate` / `maxDate` (ISO `YYYY-MM-DD` strings) constrain the selectable range — see `datePicker`.',
    ],
  },
  {
    factory: 'dateTimeCalendar',
    namespace: 'inputs',
    docSlug: 'datetimecalendar',
    call: 'gui.inputs.dateTimeCalendar(path, { label, minDate?, maxDate?, minTime?, maxTime?, minuteStep?, disabledTimeRanges?, allowCustomTime? })',
    example:
      "gui.inputs.dateTimeCalendar('appointmentAt', { label: 'Appointment', minTime: '09:00', maxTime: '18:00' })",
    notes: [
      'An INLINE calendar with an embedded time picker: a segmented time input between the header and the days ' +
        'grid opens a time grid in place of the days (like the year selector).',
      'Emits a local ISO date-time (`YYYY-MM-DDTHH:mm:ss`) only when BOTH day and time are selected — pair with a ' +
        "`{ type: 'string', format: 'date-time' }` validator. The time picker is usable before a day is picked, " +
        'and picking a different day KEEPS the chosen time (re-emitting the full value), so the two halves can be ' +
        'chosen in either order.',
      'Half-finished entries never emit: the value goes to null — flagging the field even when it is optional — ' +
        'only once focus leaves the widget with one half missing, which surfaces an "incomplete" message ' +
        '(`incompleteMessage` overrides its wording).',
      '`disabledTimeRanges` entries take `start`/`end` ISO times plus optional `date` (ISO date) and/or `weekdays` ' +
        '(getDay() numbering: 0=Sunday … 6=Saturday) to scope the range to specific days.',
    ],
  },
  {
    factory: 'dateTimePicker',
    namespace: 'inputs',
    docSlug: 'datetimepicker',
    call: 'gui.inputs.dateTimePicker(path, { label, minDate?, maxDate?, minTime?, maxTime?, minuteStep?, disabledTimeRanges?, allowCustomTime? })',
    example:
      "gui.inputs.dateTimePicker('appointmentAt', { label: 'Appointment', minTime: '09:00', maxTime: '18:00' })",
    notes: [
      'A compact date-time FIELD that opens a `dateTimeCalendar` POPOVER on focus — the space-saving counterpart ' +
        'to the inline `dateTimeCalendar`, like `datePicker` is to `calendar`.',
      'Emits a local ISO date-time (`YYYY-MM-DDTHH:mm:ss`); the popover closes only when BOTH day and time are ' +
        "selected. Pair with a `{ type: 'string', format: 'date-time' }` validator.",
      'Takes the same time props as `dateTimeCalendar` (`minTime`/`maxTime`/`minuteStep`/`disabledTimeRanges` with ' +
        'per-date/weekday scoping/`allowCustomTime`) plus `icon`, `invalidDateMessage` and `incompleteMessage` ' +
        'for the typed input.',
    ],
  },
  {
    factory: 'markdown',
    namespace: 'inputs',
    docSlug: 'markdown',
    call: 'gui.inputs.markdown(path, { label })',
    example: "gui.inputs.markdown('notes', { label: 'Notes (markdown)' })",
    notes: [
      'A markdown *editor input* — the user types markdown and the value IS that markdown string. This is the ' +
        'ONLY use of markdown in GolemUI: there is no markdown-for-display. For a heading or static block, use ' +
        '`gui.displays.display(() => <node>)` (your host renders it), never a markdown widget.',
    ],
  },
  {
    factory: 'tags',
    namespace: 'inputs',
    docSlug: 'tags',
    call: 'gui.inputs.tags(path, { label })',
    example: "gui.inputs.tags('skills', { label: 'Skills' })",
    notes: ['Free-form multi-value tag input; the value is a string array.'],
  },
  {
    factory: 'repeater',
    namespace: 'inputs',
    docSlug: 'repeater',
    call: 'gui.inputs.repeater(path, { label?, addLabel?, removeLabel?, limit?, template })',
    example:
      "gui.inputs.repeater('attendees', { label: 'Attendees', addLabel: 'Add attendee', template: [ gui.inputs.textInput('attendees.items.name', { label: 'Name' }) ] })",
    notes: [
      'The variable-length array field: the user adds/removes rows at runtime, each rendering the `template`. ' +
        'This is the idiomatic way to collect an UNKNOWN number of items — do NOT hand-roll N pre-generated copies ' +
        'gated by `include.when` (a common but wrong workaround).',
      "Child field paths inside the template are **`<path>.items.<field>`** — a repeater on `'attendees'` holds " +
        "`gui.inputs.textInput('attendees.items.name', …)`. At RUNTIME each `items` token is replaced by the " +
        "row's array index (`attendees.items.name` → `attendees[0].name`, `attendees[1].name`, …); nesting a " +
        'repeater inside a template adds another `.items.` segment (`teams.items.members.items.name`).',
      '`limit` caps the number of rows; `addLabel`/`removeLabel` set the button text.',
    ],
  },
  {
    factory: 'list',
    namespace: 'inputs',
    docSlug: 'list',
    call: 'gui.inputs.list(path, { label, items, height?, itemHeight? })',
    example:
      "gui.inputs.list('selection', { label: 'Pick an option', items: ['Option 1', 'Option 2', 'Option 3'], height: 200, itemHeight: 40 })",
    notes: [
      'A scrolling selection list. `items` is a string array (or `{ value, label }[]`).',
      '`height` / `itemHeight` size the scroll viewport (pixels).',
    ],
  },
  {
    factory: 'multiList',
    namespace: 'inputs',
    docSlug: 'multi-list',
    call: 'gui.inputs.multiList(path, { label, items, height?, itemHeight?, validator? })',
    example:
      "gui.inputs.multiList('toppings', { label: 'Toppings', items: ['Cheese', 'Bacon', 'Mushrooms'], height: 200 })",
    notes: [
      'Multi-select scrolling list: the value is an **array** of the selected item values; Enter/Space and clicks toggle rows on and off.',
      "Selection is never silently blocked; cap it with an array validator — `{ type: 'array', maxItems }` — so the user is told why.",
    ],
  },
  {
    factory: 'fileUpload',
    namespace: 'inputs',
    docSlug: 'file-upload',
    call: 'gui.inputs.fileUpload(path, { label?, accept?, maxSize?, buttonLabel?, validator? })',
    example:
      "gui.inputs.fileUpload('cv', { label: 'CV', accept: ['application/pdf', '.docx'], maxSize: 5 * 1024 * 1024, validator: { required: true } })",
    notes: [
      'Single-file upload rendered as a one-line input: the box is the drop target and holds the upload button; while the file uploads the box itself becomes the progress bar, and once done it shows the file name with a remove button.',
      'REQUIRES a host transport: pass `dependencies: { uploadService: { upload(file, { id, path, onProgress, signal }) => Promise<unknown>, remove?(item) => Promise<void> } }` in the init config (next to `markdown`). Keep the object reference stable (module level) — a new `config` identity re-initializes the form. Without it the widget renders disabled with an inline error.',
      'The value is a plain envelope, never the `File`: `{ id, name, size, type, status: "uploading" | "uploaded" | "error", error?, data? }` where `data` is exactly what `upload` resolved with. Preload a value from the server with `status: "uploaded"`. Removing awaits `uploadService.remove(item)` (when provided) before clearing.',
      "The validator auto-supplies `type: 'file'`. `blockPendingUploads` (default true) fails while the file is still uploading or failed, so a half-finished upload can never be submitted; message keys: `invalid`, `required`, `pendingUploads`.",
      '`accept` (`[".pdf", "image/*", "application/pdf"]`) and `maxSize` (bytes) are checked BEFORE uploading; a refused or failed file stays in the box with the reason, a retry and a remove button — it is never dropped silently. Messages: `acceptMessage`, `maxSizeMessage`; accessible names: `removeAriaLabel`, `cancelAriaLabel`, `retryLabel` (`{name}` token).',
    ],
  },
  {
    factory: 'multiFileUpload',
    namespace: 'inputs',
    docSlug: 'multi-file-upload',
    call: 'gui.inputs.multiFileUpload(path, { label?, accept?, maxSize?, buttonLabel?, validator? })',
    example:
      "gui.inputs.multiFileUpload('attachments', { label: 'Attachments', accept: ['image/*'], validator: { required: true, maxItems: 3 } })",
    notes: [
      'The array variant of `fileUpload` (same box, button, progress bar and `uploadService`). Files upload ONE AT A TIME; every finished file becomes a pill inside the box and the value is an array of envelopes.',
      'A failed file pauses the queue until it is retried or removed. The count is never silently blocked: cap it with `maxItems` so the user is told why.',
      "The validator auto-supplies `type: 'files'`; rules: `required` (non-empty), `minItems`, `maxItems`, `blockPendingUploads` (default true); message keys: `invalid`, `required`, `minItems`, `maxItems`, `pendingUploads`.",
    ],
  },
  {
    factory: 'rangeCalendar',
    namespace: 'inputs',
    docSlug: 'range-calendar',
    call: 'gui.inputs.rangeCalendar(path, { label? })',
    example: "gui.inputs.rangeCalendar('stayDates', { label: 'Stay dates' })",
    notes: [
      'Inline calendar for a start–end date **range** (the value is a date range). For a single date use `calendar`.',
      "**`allowEdit: true`** enables in-place pill editing — see `rangeDateInput`. Here the calendar itself is the edit surface: selecting a pill dims the competing ranges in the day grid, editing parks the pill's span as the in-progress preview, and two-click re-picks reshape it without committing until the pill's check icon confirms (leaving the widget with a complete changed span also commits it).",
    ],
  },
  {
    factory: 'rangeDateInput',
    namespace: 'inputs',
    docSlug: 'range-date-input',
    call: 'gui.inputs.rangeDateInput(path, { label? })',
    example: "gui.inputs.rangeDateInput('stayDates', { label: 'Stay dates' })",
    notes: [
      'Typed start–end date **range** entry (the range sibling of `dateInput`).',
      '`incompleteMessage` overrides the "incomplete" error surfaced when focus leaves with only one endpoint filled — see `datePicker`.',
      "**`allowEdit: true`** (default false, shared by all 8 range widgets) enables in-place pill editing: clicking or arrowing onto a pill selects it, revealing a pencil icon; the pencil — or F2 / E on the focused pill — loads the range back into the widget, where the pill's label live-previews the change and its check / cross icons (or Enter / Escape) commit or cancel the replacement. A confirmed range that overlaps a neighbor merges into it, and an unchanged confirm is a cancel. Tooltip labels and screen-reader announcements are localizable via `editLabel`, `editAriaLabel`, `confirmEditLabel`, `cancelEditLabel`, `editStartedMessage`, `editCommittedMessage`, `editCancelledMessage`.",
    ],
  },
  {
    factory: 'rangeTimeInput',
    namespace: 'inputs',
    docSlug: 'range-time-input',
    call: 'gui.inputs.rangeTimeInput(path, { label?, minTime?, maxTime? })',
    example:
      "gui.inputs.rangeTimeInput('shift', { label: 'Shift', minTime: '06:00:00', maxTime: '22:00:00' })",
    notes: [
      'Typed start–end time **range** entry (the range sibling of `timeInput`); value is `TimeRange[]`. End time must be after start time.',
      '`incompleteMessage` overrides the "incomplete" error surfaced when focus leaves with only one endpoint filled — see `datePicker`.',
      '**`allowEdit: true`** enables in-place pill editing — see `rangeDateInput`.',
    ],
  },
  {
    factory: 'rangeDateTimeInput',
    namespace: 'inputs',
    docSlug: 'range-datetime-input',
    call: 'gui.inputs.rangeDateTimeInput(path, { label?, minDateTime?, maxDateTime? })',
    example:
      "gui.inputs.rangeDateTimeInput('window', { label: 'Window', minDateTime: '2026-03-01T06:00:00', maxDateTime: '2026-03-31T22:00:00' })",
    notes: [
      'Typed start–end date-time **range** entry (the range sibling of `dateTimeInput`); value is `DateTimeRange[]`. A backward selection reorders (swaps) instead of erroring.',
      'Each endpoint is an instant, so it is bounded by instants: use **`minDateTime`** / **`maxDateTime`** (ISO `YYYY-MM-DDTHH:mm:ss`), not `minDate`/`maxDate`. There is no `minTime`/`maxTime` here — a per-day time window is a different constraint from an instant bound.',
      '`incompleteMessage` overrides the "incomplete" error surfaced when focus leaves with only one endpoint filled — see `datePicker`.',
      '**`allowEdit: true`** enables in-place pill editing — see `rangeDateInput`.',
    ],
  },
  {
    factory: 'rangeDateTimeCalendar',
    namespace: 'inputs',
    docSlug: 'range-datetime-calendar',
    call: 'gui.inputs.rangeDateTimeCalendar(path, { label?, minDateTime?, maxDateTime?, disabledRanges?, startTimeLabel?, endTimeLabel? })',
    example:
      "gui.inputs.rangeDateTimeCalendar('stay', { label: 'Stay', startTimeLabel: 'Check-in', endTimeLabel: 'Check-out' })",
    notes: [
      'INLINE range calendar with TWO embedded time pickers (start/end); value is `DateTimeRange[]`, rendered as pills. A day span and the two times can be chosen in ANY order — both time pickers are usable from the start — and the pill is committed once all four pieces are present. Starting a new day span keeps the times already chosen. A day holding more than one range shows a count badge. Leaving the widget with a half-finished selection surfaces an "incomplete" error over the untouched pills (`incompleteMessage` overrides its wording); leaving it emptied clears the error.',
      'Everything is in instant-space: bounds are **`minDateTime`** / **`maxDateTime`** and **`disabledRanges`** are `DateTimeRange[]` instant spans (block a whole day with `00:00:00`–`23:59:59`). There is no `minDate`/`maxDate`/`minTime`/`maxTime`/`disabledTimeRanges` — a time-of-day constraint cannot bound a multi-day span.',
      "**`allowEdit: true`** enables in-place pill editing — see `rangeDateInput`. Here the calendar itself is the edit surface: selecting a pill dims the competing ranges in the day grid, editing loads all four pieces (span + times) as the working selection, and day or time re-picks reshape it without the add flow's auto-commit — the pill's check icon confirms (leaving the widget with a complete changed selection also commits it).",
    ],
  },
  {
    factory: 'rangeDateTimePicker',
    namespace: 'inputs',
    docSlug: 'range-datetime-picker',
    call: 'gui.inputs.rangeDateTimePicker(path, { label?, minDateTime?, maxDateTime?, disabledRanges?, startTimeLabel?, endTimeLabel? })',
    example:
      "gui.inputs.rangeDateTimePicker('stay', { label: 'Stay', startTimeLabel: 'Check-in', endTimeLabel: 'Check-out' })",
    notes: [
      'POPOVER date-time range picker: the typed `rangeDateTimeInput` as the trigger (pills live there) with the `rangeDateTimeCalendar` in a dropdown. Value is `DateTimeRange[]`. Committing a pill keeps the popover open so several ranges can be added; it closes on outside-click, blur or Escape. A half-finished selection is held by the picker, so it survives closing and reopening the popover. Leaving it that way surfaces an "incomplete" error (`incompleteMessage` overrides its wording).',
      'Everything is in instant-space: bounds are **`minDateTime`** / **`maxDateTime`** and **`disabledRanges`** are `DateTimeRange[]` instant spans (block a whole day with `00:00:00`–`23:59:59`). There is no `minDate`/`maxDate`/`minTime`/`maxTime`/`disabledTimeRanges`.',
      "**`allowEdit: true`** enables in-place pill editing — see `rangeDateInput`. Selecting a pill dims the competing ranges in the panel calendar; during an edit, panel picks reshape the range without committing — Enter in the segments or the pill's check icon confirms the replacement.",
    ],
  },
  {
    factory: 'rangeDatePicker',
    namespace: 'inputs',
    docSlug: 'range-date-picker',
    call: 'gui.inputs.rangeDatePicker(path, { label? })',
    example: "gui.inputs.rangeDatePicker('stayDates', { label: 'Stay dates' })",
    notes: [
      'Popover calendar for a start–end date **range** (the range sibling of `datePicker`). A span with only its ' +
        'first day picked is held by the picker, so it survives closing and reopening the popover. Leaving it ' +
        'that way surfaces an "incomplete" error (`incompleteMessage` overrides its wording).',
      "**`allowEdit: true`** enables in-place pill editing — see `rangeDateInput`. Selecting a pill dims the competing ranges in the panel calendar; during an edit, day picks reshape the range without committing — Enter in the segments or the pill's check icon confirms the replacement.",
    ],
  },
  {
    factory: 'rangeTimePicker',
    namespace: 'inputs',
    docSlug: 'range-time-picker',
    call: 'gui.inputs.rangeTimePicker(path, { label?, minTime?, maxTime? })',
    example:
      "gui.inputs.rangeTimePicker('shift', { label: 'Shift', minTime: '06:00:00', maxTime: '22:00:00' })",
    notes: [
      'Two-list popover for a start–end time **range** (the range sibling of `timePicker`); value is `TimeRange[]`. Either list can be used first — an end picked before a start simply waits — and the range commits once both are set. Once an in is chosen the out list floors one slot after it so end is strictly after start.',
      '`incompleteMessage` overrides the "incomplete" error surfaced when focus leaves with only one endpoint set — see `datePicker`.',
      "**`allowEdit: true`** enables in-place pill editing — see `rangeDateInput`. During an edit, list picks reshape the range without committing — Enter in the segments or the pill's check icon confirms the replacement.",
    ],
  },
];

const ACTIONS: DxSpec[] = [
  {
    factory: 'button',
    namespace: 'actions',
    docSlug: 'button',
    call: "gui.actions.button({ label, actionType?: 'submit', onClick? })",
    example: "gui.actions.button({ label: 'Sign up', actionType: 'submit' })",
    notes: [
      "Submit button: `gui.actions.button({ label, actionType: 'submit' })`.",
      "There is NO `gui.actions.submitButton` — it was removed. Use `button` with `actionType: 'submit'`.",
      'For a non-submit action use an `onClick: (event) => { /* event.data is the form data */ }` handler.',
    ],
  },
];

const DISPLAYS: DxSpec[] = [
  {
    factory: 'alert',
    namespace: 'displays',
    docSlug: 'alert',
    call: 'gui.displays.alert({ text })',
    example: "gui.displays.alert({ text: 'Please review your details before submitting.' })",
    notes: [
      'Static, non-input callout. Uses **`text`** (not `content`). Displays do not take a `path`.',
    ],
  },
  {
    factory: 'display',
    namespace: 'displays',
    docSlug: 'renderer',
    call: 'gui.displays.display(render)',
    example: "gui.displays.display(() => 'Order summary')",
    notes: [
      '**The go-to for a static heading or any standalone/formatted block.** Return your framework’s own ' +
        'content from the render function — React: `gui.displays.display(() => <h2>Member enrollment</h2>)`; ' +
        'Vue/Angular/Lit: return that framework’s node. It renders immediately with **zero registration and ' +
        'no parser dependency** — this is how you put a heading or any static block in a form (GolemUI itself ' +
        'never renders content for display).',
      'Pass the render function **directly** (not wrapped in an object) — `(params) => any`. `params.$form` is ' +
        'the live form data, so content can be dynamic — but a field is **absent until filled**, so guard before ' +
        'indexing: `Array.isArray(params.$form.items) ? params.$form.items : []`, never `params.$form.items.length` raw.',
    ],
  },
];

// Layouts wrap a `children` array of other gui.* items (children come FIRST).
const LAYOUTS: DxSpec[] = [
  {
    factory: 'flex',
    namespace: 'layouts',
    docSlug: 'flex',
    call: 'gui.layouts.flex(children, props?)',
    example:
      "gui.layouts.flex([ gui.inputs.textInput('firstName', { label: 'First name' }), gui.inputs.textInput('lastName', { label: 'Last name' }) ])",
    notes: [
      'Layouts take the **children array first**, then optional props — unlike inputs (path first).',
      'Direction-locked variants: `verticalFlex`, `horizontalFlex` (and `grid` / `verticalGrid` / `horizontalGrid`).',
    ],
  },
  {
    factory: 'verticalFlex',
    namespace: 'layouts',
    docSlug: 'flex',
    call: 'gui.layouts.verticalFlex(children, props?)',
    example:
      "gui.layouts.verticalFlex([ gui.inputs.textInput('a', { label: 'A' }), gui.inputs.textInput('b', { label: 'B' }) ])",
    notes: ['A `flex` with direction fixed to vertical.'],
  },
  {
    factory: 'horizontalFlex',
    namespace: 'layouts',
    docSlug: 'flex',
    call: 'gui.layouts.horizontalFlex(children, props?)',
    example:
      "gui.layouts.horizontalFlex([ gui.inputs.textInput('a', { label: 'A' }), gui.inputs.textInput('b', { label: 'B' }) ])",
    notes: ['A `flex` with direction fixed to horizontal.'],
  },
  {
    factory: 'grid',
    namespace: 'layouts',
    docSlug: 'grid',
    call: 'gui.layouts.grid(children, props?)',
    example:
      "gui.layouts.grid([ gui.inputs.textInput('a', { label: 'A' }), gui.inputs.textInput('b', { label: 'B' }) ])",
    notes: ['Grid layout; `horizontalGrid` / `verticalGrid` lock the direction.'],
  },
  {
    factory: 'verticalGrid',
    namespace: 'layouts',
    docSlug: 'grid',
    call: 'gui.layouts.verticalGrid(children, props?)',
    example:
      "gui.layouts.verticalGrid([ gui.inputs.textInput('a', { label: 'A' }), gui.inputs.textInput('b', { label: 'B' }) ])",
    notes: ['A `grid` with direction fixed to vertical.'],
  },
  {
    factory: 'horizontalGrid',
    namespace: 'layouts',
    docSlug: 'grid',
    call: 'gui.layouts.horizontalGrid(children, props?)',
    example:
      "gui.layouts.horizontalGrid([ gui.inputs.textInput('a', { label: 'A' }), gui.inputs.textInput('b', { label: 'B' }) ])",
    notes: ['A `grid` with direction fixed to horizontal.'],
  },
  {
    factory: 'tabs',
    namespace: 'layouts',
    docSlug: 'tabs',
    call: 'gui.layouts.tabs(sections)',
    example:
      "gui.layouts.tabs([ { label: 'Account', children: [ gui.inputs.textInput('email', { label: 'Email' }) ] }, { label: 'Profile', children: [ gui.inputs.textInput('name', { label: 'Name' }) ] } ])",
    notes: [
      'Takes `sections: { label, children, uid? }[]` — each section is a tab with its own children.',
    ],
  },
  {
    factory: 'accordion',
    namespace: 'layouts',
    docSlug: 'accordion',
    call: 'gui.layouts.accordion(sections)',
    example:
      "gui.layouts.accordion([ { label: 'Billing', children: [ gui.inputs.textInput('card', { label: 'Card' }) ] } ])",
    notes: [
      'Takes `sections: { label, children, uid? }[]` — same shape as `tabs`, rendered as collapsible panels.',
    ],
  },
];

const ALL: DxSpec[] = [...INPUTS, ...ACTIONS, ...DISPLAYS, ...LAYOUTS];

export const DX_SPECS: Record<string, DxSpec> = Object.fromEntries(ALL.map((s) => [s.factory, s]));

export function listDxFactories(): string[] {
  return Object.keys(DX_SPECS).sort();
}

/**
 * One catalog row — enough to WRITE the factory without a follow-up lookup: name, namespace,
 * signature, a compile-verified example, and the authoring gotchas.
 */
export interface DxCatalogEntry {
  factory: string;
  namespace: DxNamespace;
  call: string;
  example: string;
  notes: string[];
}

export interface DxCatalog {
  /** Every factory, in `inputs → actions → displays → layouts` order — call + example + notes. */
  factories: DxCatalogEntry[];
  /** Cross-cutting patterns (e.g. conditional visibility) — full example + notes, resident once. */
  patterns: DxPattern[];
  /** The cross-cutting authoring note shared by all factories (incl. the validator `type` rule). */
  common: string;
}

/**
 * The whole `gui.*` surface as a SELF-SUFFICIENT reference in one payload: every factory's
 * signature, a compile-verified example, and its gotchas, plus the cross-cutting patterns and the
 * common note. Serves `dx_list_factories`. The agentic intent: the model fetches this ONCE, keeps
 * it resident, and writes most forms from it directly — `dx_get_spec` becomes the rare deep-dive,
 * not a per-factory round-trip. (Richer than a name-only index by design: in a resumed session
 * this is paid once and reused, so front-loading the examples removes mid-task lookups and turns.)
 */
export function dxCatalog(framework: DxFramework = 'react'): DxCatalog {
  return {
    factories: ALL.map(({ factory, namespace, call, example, notes }) => ({
      factory,
      namespace,
      call,
      example,
      notes,
    })),
    patterns: PATTERNS,
    common: commonNote(framework),
  };
}

export function dxCommonNote(framework: DxFramework = 'react'): string {
  return commonNote(framework);
}

/**
 * The per-framework host-wiring lines (imports + render + submit event), keyed by framework.
 * The MCP serves one (selected by `GOLEMUI_FRAMEWORK`); the skill generator prints all five,
 * since an installed skill serves whatever framework the host project uses.
 */
export function dxFrameworkSetup(): Record<DxFramework, string> {
  return FRAMEWORK_SETUP;
}

export function listDxFrameworks(): readonly DxFramework[] {
  return DX_FRAMEWORKS;
}

export function dxPatterns(): DxPattern[] {
  return PATTERNS;
}
