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

export type DxNamespace = 'inputs' | 'actions' | 'displays' | 'layouts';

export interface DxSpec {
  /** Factory name, e.g. `textInput`. */
  factory: string;
  namespace: DxNamespace;
  /** Human-readable calling convention. */
  call: string;
  /** A compiling `gui.*` snippet (verified by the suite). */
  example: string;
  /** Authoring notes and gotchas. */
  notes: string[];
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
    'A `gui.displays.display(() => <h2>…</h2>)` returns React JSX.',
  angular:
    "RENDER (Angular) — `import { gui } from '@golemui/gui-shared'; import { FormComponent } from " +
    "'@golemui/gui-angular';`, add `FormComponent` to the standalone component's `imports`, then in the " +
    'template `<gui-form [config]="{ formDef: form }" (formSubmit)="onSubmit($event)"></gui-form>` — `$event` is ' +
    'a `FormSubmitEvent` (type from `@golemui/core`), `$event.data` is the form data.',
  vue:
    "RENDER (Vue) — `import { gui } from '@golemui/gui-shared'; import { GuiForm } from '@golemui/gui-vue';`, " +
    'then `<GuiForm :config="{ formDef: form }" @form-submit="onSubmit" />` — the handler receives a ' +
    '`FormSubmitEvent` (`.data` is the form data). The event is `form-submit` (kebab-case), not `formSubmit`.',
  lit:
    "RENDER (Lit) — `import { gui } from '@golemui/gui-shared'; import '@golemui/gui-lit';` (registers the " +
    '`<gui-form>` custom element), then `<gui-form .config=${{ formDef: form }} @form-submit=${(e: CustomEvent) ' +
    '=> { /* e.detail is the FormSubmitEvent; e.detail.data */ }}></gui-form>`.',
  vanilla:
    "RENDER (vanilla JS) — `import { gui } from '@golemui/gui-shared'; import '@golemui/gui-lit';` (registers " +
    "`<gui-form>`), then `const el = document.querySelector('gui-form'); el.config = { formDef: form }; " +
    "el.addEventListener('form-submit', (e) => { /* e.detail.data */ });`",
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
    "To DISABLE submit until the form is valid, add `disabled: { when: '$formIsInvalid' }` to that button " +
    '(`$formIsInvalid` is a built-in validity flag) — see the conditional-and-state-props pattern. ' +
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
    "(2) `repeater` (array) validators auto-supply `type: 'array'` — supply only the rules, e.g. " +
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
      "gui.actions.button({ label: 'Submit', actionType: 'submit', disabled: { when: '$formIsInvalid' } })",
    notes: [
      'ENABLE/DISABLE & READONLY: `disabled` and `readonly` are typed `boolean | { when: <expr> }`. To gate the ' +
        "submit button on validity: `gui.actions.button({ label, actionType: 'submit', disabled: { when: '$formIsInvalid' } })`. " +
        '`$formIsInvalid` is a built-in validity flag — do not declare it as a state.',
      "SHOW/HIDE: `include` / `exclude` are typed `{ in: ['stateName'] }` / `{ from: ['stateName'] }` (state lists) " +
        'or `{ when: <expr> }`. Every state name in `in`/`from` MUST be declared in `formConfig.states`; an ' +
        'undeclared name leaves the widget hidden forever (the engine logs an error to the console).',
      'These are ALL typed config keys — pass them inside the factory’s config argument. NEVER reach a prop by ' +
        "casting the factory result and assigning a key (`(btn as any)['disabled.formValid'] = false`) or by " +
        'spreading (`{ ...gui.actions.button(...), disabled }`): keys added that way are SILENTLY ignored and the ' +
        'behavior never fires. If a prop is not on the typed config, you are guessing — it is not a real field.',
    ],
  },
];

// Inputs are `gui.inputs.<factory>(path, props?)` — path (the data key) is first.
const INPUTS: DxSpec[] = [
  {
    factory: 'textInput',
    namespace: 'inputs',
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
    call: 'gui.inputs.booleanInput(path, { label, defaultValue? })',
    example:
      "gui.inputs.booleanInput('newsletter', { label: 'Subscribe to newsletter', defaultValue: false })",
    notes: ['The on/off toggle for a single boolean. Use `checkbox` for a checkbox presentation.'],
  },
  {
    factory: 'checkbox',
    namespace: 'inputs',
    call: 'gui.inputs.checkbox(path, { label, defaultValue? })',
    example: "gui.inputs.checkbox('terms', { label: 'I accept the terms', defaultValue: false })",
    notes: ['A single boolean rendered as a checkbox.'],
  },
  {
    factory: 'textarea',
    namespace: 'inputs',
    call: 'gui.inputs.textarea(path, { label, placeholder?, validator? })',
    example: "gui.inputs.textarea('bio', { label: 'Bio', validator: { maxLength: 500 } })",
    notes: ['Multi-line text; same loose string validator as `textInput`.'],
  },
  {
    factory: 'password',
    namespace: 'inputs',
    call: 'gui.inputs.password(path, { label, validator? })',
    example:
      "gui.inputs.password('password', { label: 'Password', validator: { required: true, minLength: 8 } })",
    notes: ['Masked text input; loose string validator.'],
  },
  {
    factory: 'dropdown',
    namespace: 'inputs',
    call: 'gui.inputs.dropdown(path, { label, items, validator? })',
    example:
      "gui.inputs.dropdown('country', { label: 'Country', items: [{ value: 'us', label: 'United States' }, { value: 'ca', label: 'Canada' }], validator: { type: 'string', required: true } })",
    notes: [
      'Choice list uses **`items`** (`{ value, label }[]`).',
      "WART: choice widgets (`dropdown`, `radiogroup`, `select`) need a **typed** validator — `{ type: 'string', required: true }` — unlike text inputs which accept the loose `{ required: true }`. Add the `type`, or omit the validator.",
    ],
  },
  {
    factory: 'radiogroup',
    namespace: 'inputs',
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
    ],
  },
  {
    factory: 'currency',
    namespace: 'inputs',
    call: 'gui.inputs.currency(path, { label, validator? })',
    example:
      "gui.inputs.currency('price', { label: 'Price', validator: { required: true, minimum: 0 } })",
    notes: ['Numeric money input; number-style validator.'],
  },
  {
    factory: 'select',
    namespace: 'inputs',
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
    call: 'gui.inputs.dateInput(path, { label, minDate?, maxDate?, validator? })',
    example:
      "gui.inputs.dateInput('startDate', { label: 'Start date', validator: { required: true } })",
    notes: [
      'Typed date entry, NO calendar UI — use only when keyboard-first entry is wanted. For most dates use ' +
        '`datePicker` (popover calendar) instead. Accepts the loose `{ required: true }`.',
      '`minDate` / `maxDate` (ISO `YYYY-MM-DD` strings) constrain the accepted range — see `datePicker`.',
    ],
  },
  {
    factory: 'timeInput',
    namespace: 'inputs',
    call: 'gui.inputs.timeInput(path, { label, hourFormat?, minuteStep?, validator? })',
    example: "gui.inputs.timeInput('meetingTime', { label: 'Meeting time', minuteStep: 15 })",
    notes: [
      'Typed time entry (hh:mm segments). Emits an ISO time string (`HH:mm:ss`) — pair with the ' +
        "`{ format: 'time' }` validator. `hourFormat` forces '12'/'24' (default: locale); " +
        '`minuteStep` sets the arrow-key minute increment.',
    ],
  },
  {
    factory: 'timePicker',
    namespace: 'inputs',
    call: 'gui.inputs.timePicker(path, { label, minTime?, maxTime?, minuteStep?, disabledRanges?, allowCustomTime?, validator? })',
    example:
      "gui.inputs.timePicker('meetingTime', { label: 'Meeting time', minTime: '09:00', maxTime: '18:00', minuteStep: 30 })",
    notes: [
      'Time field with a popover list of slots built from `minTime`..`maxTime` stepping `minuteStep` ' +
        '(default 30). `disabledRanges` (`{ start, end }[]`, inclusive) greys slots out. Typing is off ' +
        "unless `allowCustomTime: true`. Emits `HH:mm:ss` — pair with the `{ format: 'time' }` validator.",
    ],
  },
  {
    factory: 'dateTimeInput',
    namespace: 'inputs',
    call: 'gui.inputs.dateTimeInput(path, { label, hourFormat?, minuteStep?, validator? })',
    example: "gui.inputs.dateTimeInput('meetingAt', { label: 'Meeting at' })",
    notes: [
      'Typed date+time entry in one locale-ordered row. Emits a local ISO date-time ' +
        "(`YYYY-MM-DDTHH:mm:ss`) — pair with the `{ format: 'date-time' }` validator. " +
        '`hourFormat`/`minuteStep` as in `timeInput`.',
    ],
  },
  {
    factory: 'calendar',
    namespace: 'inputs',
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
    call: 'gui.inputs.dateTimeCalendar(path, { label, minDate?, maxDate?, minTime?, maxTime?, minuteStep?, disabledTimeRanges?, allowCustomTime? })',
    example:
      "gui.inputs.dateTimeCalendar('appointmentAt', { label: 'Appointment', minTime: '09:00', maxTime: '18:00' })",
    notes: [
      'An INLINE calendar with an embedded time picker: a segmented time input between the header and the days ' +
        'grid opens a time grid in place of the days (like the year selector).',
      'Emits a local ISO date-time (`YYYY-MM-DDTHH:mm:ss`) only when BOTH day and time are selected — pair with a ' +
        "`{ type: 'string', format: 'date-time' }` validator. Picking a different day clears the time and resets " +
        'the value to null.',
      '`disabledTimeRanges` entries take `start`/`end` ISO times plus optional `date` (ISO date) and/or `weekdays` ' +
        '(getDay() numbering: 0=Sunday … 6=Saturday) to scope the range to specific days.',
    ],
  },
  {
    factory: 'dateTimePicker',
    namespace: 'inputs',
    call: 'gui.inputs.dateTimePicker(path, { label, minDate?, maxDate?, minTime?, maxTime?, minuteStep?, disabledTimeRanges?, allowCustomTime? })',
    example:
      "gui.inputs.dateTimePicker('appointmentAt', { label: 'Appointment', minTime: '09:00', maxTime: '18:00' })",
    notes: [
      'A compact date-time FIELD that opens a `dateTimeCalendar` POPOVER on focus — the space-saving counterpart ' +
        'to the inline `dateTimeCalendar`, like `datePicker` is to `calendar`.',
      'Emits a local ISO date-time (`YYYY-MM-DDTHH:mm:ss`); the popover closes only when BOTH day and time are ' +
        "selected. Pair with a `{ type: 'string', format: 'date-time' }` validator.",
      'Takes the same time props as `dateTimeCalendar` (`minTime`/`maxTime`/`minuteStep`/`disabledTimeRanges` with ' +
        'per-date/weekday scoping/`allowCustomTime`) plus `icon` and `invalidDateMessage` for the typed input.',
    ],
  },
  {
    factory: 'markdown',
    namespace: 'inputs',
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
    call: 'gui.inputs.tags(path, { label })',
    example: "gui.inputs.tags('skills', { label: 'Skills' })",
    notes: ['Free-form multi-value tag input; the value is a string array.'],
  },
  {
    factory: 'repeater',
    namespace: 'inputs',
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
    call: 'gui.inputs.list(path, { label, items, height?, itemHeight? })',
    example:
      "gui.inputs.list('selection', { label: 'Pick an option', items: ['Option 1', 'Option 2', 'Option 3'], height: 200, itemHeight: 40 })",
    notes: [
      'A scrolling selection list. `items` is a string array (or `{ value, label }[]`).',
      '`height` / `itemHeight` size the scroll viewport (pixels).',
    ],
  },
  {
    factory: 'rangeCalendar',
    namespace: 'inputs',
    call: 'gui.inputs.rangeCalendar(path, { label? })',
    example: "gui.inputs.rangeCalendar('stayDates', { label: 'Stay dates' })",
    notes: [
      'Inline calendar for a start–end date **range** (the value is a date range). For a single date use `calendar`.',
    ],
  },
  {
    factory: 'rangeDateInput',
    namespace: 'inputs',
    call: 'gui.inputs.rangeDateInput(path, { label? })',
    example: "gui.inputs.rangeDateInput('stayDates', { label: 'Stay dates' })",
    notes: ['Typed start–end date **range** entry (the range sibling of `dateInput`).'],
  },
  {
    factory: 'rangeTimeInput',
    namespace: 'inputs',
    call: 'gui.inputs.rangeTimeInput(path, { label?, minTime?, maxTime? })',
    example:
      "gui.inputs.rangeTimeInput('shift', { label: 'Shift', minTime: '06:00:00', maxTime: '22:00:00' })",
    notes: [
      'Typed start–end time **range** entry (the range sibling of `timeInput`); value is `TimeRange[]`. End time must be after start time.',
    ],
  },
  {
    factory: 'rangeDateTimeInput',
    namespace: 'inputs',
    call: 'gui.inputs.rangeDateTimeInput(path, { label?, minDateTime?, maxDateTime? })',
    example:
      "gui.inputs.rangeDateTimeInput('window', { label: 'Window', minDateTime: '2026-03-01T06:00:00', maxDateTime: '2026-03-31T22:00:00' })",
    notes: [
      'Typed start–end date-time **range** entry (the range sibling of `dateTimeInput`); value is `DateTimeRange[]`. A backward selection reorders (swaps) instead of erroring.',
      'Each endpoint is an instant, so it is bounded by instants: use **`minDateTime`** / **`maxDateTime`** (ISO `YYYY-MM-DDTHH:mm:ss`), not `minDate`/`maxDate`. There is no `minTime`/`maxTime` here — a per-day time window is a different constraint from an instant bound.',
    ],
  },
  {
    factory: 'rangeDateTimeCalendar',
    namespace: 'inputs',
    call: 'gui.inputs.rangeDateTimeCalendar(path, { label?, minDateTime?, maxDateTime?, disabledRanges?, startTimeLabel?, endTimeLabel? })',
    example:
      "gui.inputs.rangeDateTimeCalendar('stay', { label: 'Stay', startTimeLabel: 'Check-in', endTimeLabel: 'Check-out' })",
    notes: [
      'INLINE range calendar with TWO embedded time pickers (start/end); value is `DateTimeRange[]`, rendered as pills. Pick a date range, then a start time (enables the end time), then an end time to commit a pill. A day holding more than one range shows a count badge.',
      'Everything is in instant-space: bounds are **`minDateTime`** / **`maxDateTime`** and **`disabledRanges`** are `DateTimeRange[]` instant spans (block a whole day with `00:00:00`–`23:59:59`). There is no `minDate`/`maxDate`/`minTime`/`maxTime`/`disabledTimeRanges` — a time-of-day constraint cannot bound a multi-day span.',
    ],
  },
  {
    factory: 'rangeDateTimePicker',
    namespace: 'inputs',
    call: 'gui.inputs.rangeDateTimePicker(path, { label?, minDateTime?, maxDateTime?, disabledRanges?, startTimeLabel?, endTimeLabel? })',
    example:
      "gui.inputs.rangeDateTimePicker('stay', { label: 'Stay', startTimeLabel: 'Check-in', endTimeLabel: 'Check-out' })",
    notes: [
      'POPOVER date-time range picker: the typed `rangeDateTimeInput` as the trigger (pills live there) with the `rangeDateTimeCalendar` in a dropdown. Value is `DateTimeRange[]`. Committing a pill keeps the popover open so several ranges can be added; it closes on outside-click, blur or Escape.',
      'Everything is in instant-space: bounds are **`minDateTime`** / **`maxDateTime`** and **`disabledRanges`** are `DateTimeRange[]` instant spans (block a whole day with `00:00:00`–`23:59:59`). There is no `minDate`/`maxDate`/`minTime`/`maxTime`/`disabledTimeRanges`.',
    ],
  },
  {
    factory: 'rangeDatePicker',
    namespace: 'inputs',
    call: 'gui.inputs.rangeDatePicker(path, { label? })',
    example: "gui.inputs.rangeDatePicker('stayDates', { label: 'Stay dates' })",
    notes: ['Popover calendar for a start–end date **range** (the range sibling of `datePicker`).'],
  },
  {
    factory: 'rangeTimePicker',
    namespace: 'inputs',
    call: 'gui.inputs.rangeTimePicker(path, { label?, minTime?, maxTime? })',
    example:
      "gui.inputs.rangeTimePicker('shift', { label: 'Shift', minTime: '06:00:00', maxTime: '22:00:00' })",
    notes: [
      'Two-list popover for a start–end time **range** (the range sibling of `timePicker`); value is `TimeRange[]`. The out list floors one slot after the chosen in so end is strictly after start.',
    ],
  },
];

const ACTIONS: DxSpec[] = [
  {
    factory: 'button',
    namespace: 'actions',
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
    call: 'gui.displays.alert({ text })',
    example: "gui.displays.alert({ text: 'Please review your details before submitting.' })",
    notes: [
      'Static, non-input callout. Uses **`text`** (not `content`). Displays do not take a `path`.',
    ],
  },
  {
    factory: 'display',
    namespace: 'displays',
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
    call: 'gui.layouts.verticalFlex(children, props?)',
    example:
      "gui.layouts.verticalFlex([ gui.inputs.textInput('a', { label: 'A' }), gui.inputs.textInput('b', { label: 'B' }) ])",
    notes: ['A `flex` with direction fixed to vertical.'],
  },
  {
    factory: 'horizontalFlex',
    namespace: 'layouts',
    call: 'gui.layouts.horizontalFlex(children, props?)',
    example:
      "gui.layouts.horizontalFlex([ gui.inputs.textInput('a', { label: 'A' }), gui.inputs.textInput('b', { label: 'B' }) ])",
    notes: ['A `flex` with direction fixed to horizontal.'],
  },
  {
    factory: 'grid',
    namespace: 'layouts',
    call: 'gui.layouts.grid(children, props?)',
    example:
      "gui.layouts.grid([ gui.inputs.textInput('a', { label: 'A' }), gui.inputs.textInput('b', { label: 'B' }) ])",
    notes: ['Grid layout; `horizontalGrid` / `verticalGrid` lock the direction.'],
  },
  {
    factory: 'verticalGrid',
    namespace: 'layouts',
    call: 'gui.layouts.verticalGrid(children, props?)',
    example:
      "gui.layouts.verticalGrid([ gui.inputs.textInput('a', { label: 'A' }), gui.inputs.textInput('b', { label: 'B' }) ])",
    notes: ['A `grid` with direction fixed to vertical.'],
  },
  {
    factory: 'horizontalGrid',
    namespace: 'layouts',
    call: 'gui.layouts.horizontalGrid(children, props?)',
    example:
      "gui.layouts.horizontalGrid([ gui.inputs.textInput('a', { label: 'A' }), gui.inputs.textInput('b', { label: 'B' }) ])",
    notes: ['A `grid` with direction fixed to horizontal.'],
  },
  {
    factory: 'tabs',
    namespace: 'layouts',
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

export function dxPatterns(): DxPattern[] {
  return PATTERNS;
}
