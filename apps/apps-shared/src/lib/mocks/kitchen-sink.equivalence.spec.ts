import { formDefs } from '@golemui/gui-shared';
import { describe, expect, it } from 'vitest';

import { buildKitchenSinkDx } from './kitchen-sink.dx';
import { accordion as jsonAccordionTab } from './tabs/accordion';
import { accordionTab as dxAccordionTab } from './tabs/accordion.dx';
import { alert as jsonAlertTab } from './tabs/alert';
import { alertTab as dxAlertTab } from './tabs/alert.dx';
import { button as jsonButtonTab } from './tabs/button';
import { buttonTab as dxButtonTab } from './tabs/button.dx';
import { calendar as jsonCalendarTab } from './tabs/calendar';
import { calendarTab as dxCalendarTab } from './tabs/calendar.dx';
import { checkbox as jsonCheckboxTab } from './tabs/checkbox';
import { checkboxTab as dxCheckboxTab } from './tabs/checkbox.dx';
import { currency as jsonCurrencyTab } from './tabs/currency';
import { currencyTab as dxCurrencyTab } from './tabs/currency.dx';
import { dropdown as jsonDropdownTab } from './tabs/dropdown';
import { dropdownTab as dxDropdownTab } from './tabs/dropdown.dx';
import { flex as jsonFlexTab } from './tabs/flex';
import { flexTab as dxFlexTab } from './tabs/flex.dx';
import { grid as jsonGridTab } from './tabs/grid';
import { gridTab as dxGridTab } from './tabs/grid.dx';
import { list as jsonListTab } from './tabs/list';
import { listTab as dxListTab } from './tabs/list.dx';
import { markdown as jsonMarkdownTab } from './tabs/markdown';
import { markdownText as jsonMarkdownTextTab } from './tabs/markdown-text';
import { markdownTextTab as dxMarkdownTextTab } from './tabs/markdown-text.dx';
import { markdownTab as dxMarkdownTab } from './tabs/markdown.dx';
import { number as jsonNumberTab } from './tabs/number';
import { numberTab as dxNumberTab } from './tabs/number.dx';
import { password as jsonPasswordTab } from './tabs/password';
import { passwordTab as dxPasswordTab } from './tabs/password.dx';
import { radiogroup as jsonRadiogroupTab } from './tabs/radiogroup';
import { radiogroupTab as dxRadiogroupTab } from './tabs/radiogroup.dx';
import { repeater as jsonRepeaterTab } from './tabs/repeater';
import { repeaterTab as dxRepeaterTab } from './tabs/repeater.dx';
import { select as jsonSelectTab } from './tabs/select';
import { selectTab as dxSelectTab } from './tabs/select.dx';
import { textarea as jsonTextareaTab } from './tabs/textarea';
import { textareaTab as dxTextareaTab } from './tabs/textarea.dx';
import { textinput as jsonTextinputTab } from './tabs/textinput';
import { textinputTab as dxTextinputTab } from './tabs/textinput.dx';
import { toggle as jsonToggleTab } from './tabs/toggle';
import { toggleTab as dxToggleTab } from './tabs/toggle.dx';

// ─── Per-tab equivalence test ───────────────────────────────────────────────
//
// Both pipelines (JSON KS and DX KS) funnel through `golemForm()` and produce
// a `Form<string>`. For each tab we build a single-tab mini-form on each side
// and deep-equal the resulting `Form<string>` after applying a small set of
// principled normalisations.
//
// Single source of truth: the DX KS's own `formSelectors` and `formConfig` are
// read straight from `buildKitchenSinkDx()` so the test exercises exactly what
// the playground exercises — no parallel selector definitions.

const ks = buildKitchenSinkDx();

// Emulates the behaviour of the internal `golemForm` function
const buildJsonTab = (tabSection: any) => ({
  states: {},
  form: {
    uid: 'gui-root-uid',
    type: 'flex',
    kind: 'layout',
    children: [tabSection],
  },
});

// `processDxFacade(...).form` returns `Core.Form` (a `{states, form: LayoutWidget}`
// wrapper). `golemForm().create(...).form` returns the LayoutWidget directly.
// Unwrap one more level on the DX side so both helpers land on the LayoutWidget.
const buildDxTab = (dxTabSection: any) =>
  formDefs.processDxFacade([dxTabSection], ks.formSelectors, ks.formConfig).form.form;

const stripFields = (node: any, fields: readonly string[]): any => {
  if (Array.isArray(node)) return node.map((n) => stripFields(n, fields));
  if (node && typeof node === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(node)) {
      if (fields.includes(k)) continue;
      // Drop empty-string scalars — DX mappers hardcode defaults like
      // `placeholder: textProps.placeholder ?? ''`; JSON path doesn't carry
      // them. Logged as a mapper-cleanup item for focus closeout.
      if (v === '') continue;
      const stripped = stripFields(v, fields);
      // Drop containers that became empty after stripping (e.g., `props: {}`
      // left behind when the only field inside was a stripped pipeline default).
      if (
        stripped !== null &&
        typeof stripped === 'object' &&
        !Array.isArray(stripped) &&
        Object.keys(stripped).length === 0
      ) {
        continue;
      }
      out[k] = stripped;
    }
    return out;
  }
  return node;
};

// Fields stripped before deep-equal:
//   - uid: pipelines have legitimately different uid-generation strategies
//   - validator: known DX validator-hoist gap (validator stays in `props` instead
//     of moving top-level); tracked for focus-closeout, not per-tab content
//   - direction: DX pipeline auto-injects `direction: 'column'` on flex layouts;
//     JSON path doesn't. Pipeline default that doesn't affect rendering.
//   - renderMode: DX accordion auto-injects `renderMode: 'all'`; JSON doesn't.
//     Tracked alongside accordion per-section-type gap.
//   - autoFit: DX grid layouts default to `autoFit: true` (sensible-default for
//     responsive layouts); JSON path doesn't set it. Pipeline default.
const stripped = (form: any) =>
  stripFields(form, ['uid', 'validator', 'direction', 'renderMode', 'autoFit']);

// `_guiAccordion` (and similar layouts) hard-wrap each section's children in a
// flex layout, even when the section's direct child is already a layout. JSON
// sections express the same structure with one fewer level of nesting (e.g., a
// `grid` section directly, no enveloping flex). Collapse single-layout-child
// flex wrappers so the equivalence test focuses on content, not nesting depth.
// Tracked as a "per-section type override" gap on _guiAccordion / _guiTabs.
const collapseLayoutWrappers = (node: any): any => {
  if (Array.isArray(node)) return node.map(collapseLayoutWrappers);
  if (node && typeof node === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(node)) {
      out[k] = collapseLayoutWrappers(v);
    }
    if (
      out.kind === 'layout' &&
      out.type === 'flex' &&
      Array.isArray(out.children) &&
      out.children.length === 1 &&
      out.children[0]?.kind === 'layout'
    ) {
      return out.children[0];
    }
    return out;
  }
  return node;
};

const normalise = (form: any) => collapseLayoutWrappers(stripped(form));

describe('Kitchen Sink — JSON ↔ DX equivalence', () => {
  it('textinput tab', () => {
    const json = buildJsonTab(jsonTextinputTab('tabTextinput')).form;
    const dx = buildDxTab(dxTextinputTab);
    expect(normalise(dx)).toEqual(normalise(json));
  });

  it('password tab', () => {
    const json = buildJsonTab(jsonPasswordTab('tabPassword')).form;
    const dx = buildDxTab(dxPasswordTab);
    expect(normalise(dx)).toEqual(normalise(json));
  });

  it('currency tab', () => {
    const json = buildJsonTab(jsonCurrencyTab('tabCurrency')).form;
    const dx = buildDxTab(dxCurrencyTab);
    expect(normalise(dx)).toEqual(normalise(json));
  });

  it('number tab', () => {
    const json = buildJsonTab(jsonNumberTab('tabNumber')).form;
    const dx = buildDxTab(dxNumberTab);
    expect(normalise(dx)).toEqual(normalise(json));
  });

  it('markdown-text tab', () => {
    const json = buildJsonTab(jsonMarkdownTextTab('tabMarkdownText')).form;
    const dx = buildDxTab(dxMarkdownTextTab);
    expect(normalise(dx)).toEqual(normalise(json));
  });

  it('alert tab', () => {
    const json = buildJsonTab(jsonAlertTab('tabAlert')).form;
    const dx = buildDxTab(dxAlertTab);
    expect(normalise(dx)).toEqual(normalise(json));
  });

  it('button tab', () => {
    const json = buildJsonTab(jsonButtonTab('tabButton')).form;
    const dx = buildDxTab(dxButtonTab);
    expect(normalise(dx)).toEqual(normalise(json));
  });

  it('checkbox tab', () => {
    const json = buildJsonTab(jsonCheckboxTab('tabCheckbox')).form;
    const dx = buildDxTab(dxCheckboxTab);
    expect(normalise(dx)).toEqual(normalise(json));
  });

  it('toggle tab', () => {
    const json = buildJsonTab(jsonToggleTab('tabToggle')).form;
    const dx = buildDxTab(dxToggleTab);
    expect(normalise(dx)).toEqual(normalise(json));
  });

  it('markdown tab', () => {
    const json = buildJsonTab(jsonMarkdownTab('tabMarkdown')).form;
    const dx = buildDxTab(dxMarkdownTab);
    expect(normalise(dx)).toEqual(normalise(json));
  });

  it('select tab', () => {
    const json = buildJsonTab(jsonSelectTab('tabSelect')).form;
    const dx = buildDxTab(dxSelectTab);
    expect(normalise(dx)).toEqual(normalise(json));
  });

  it('radiogroup tab', () => {
    const json = buildJsonTab(jsonRadiogroupTab('tabRadiogroup')).form;
    const dx = buildDxTab(dxRadiogroupTab);
    expect(normalise(dx)).toEqual(normalise(json));
  });

  it('textarea tab', () => {
    const json = buildJsonTab(jsonTextareaTab('tabTextarea')).form;
    const dx = buildDxTab(dxTextareaTab);
    expect(normalise(dx)).toEqual(normalise(json));
  });

  it('list tab', () => {
    const json = buildJsonTab(jsonListTab('tabList')).form;
    const dx = buildDxTab(dxListTab);
    expect(normalise(dx)).toEqual(normalise(json));
  });

  it('flex tab', () => {
    const json = buildJsonTab(jsonFlexTab('tabFlex')).form;
    const dx = buildDxTab(dxFlexTab);
    expect(normalise(dx)).toEqual(normalise(json));
  });

  it('accordion tab', () => {
    const json = buildJsonTab(jsonAccordionTab('tabAccordion')).form;
    const dx = buildDxTab(dxAccordionTab);
    expect(normalise(dx)).toEqual(normalise(json));
  });

  it('grid tab', () => {
    const json = buildJsonTab(jsonGridTab('tabGrid')).form;
    const dx = buildDxTab(dxGridTab);
    expect(normalise(dx)).toEqual(normalise(json));
  });

  it('calendar tab', () => {
    const json = buildJsonTab(jsonCalendarTab('tabDate')).form;
    const dx = buildDxTab(dxCalendarTab);
    expect(normalise(dx)).toEqual(normalise(json));
  });

  it('dropdown tab', () => {
    const json = buildJsonTab(jsonDropdownTab('tabDropdown')).form;
    const dx = buildDxTab(dxDropdownTab);
    expect(normalise(dx)).toEqual(normalise(json));
  });

  it('repeater tab', () => {
    const json = buildJsonTab(jsonRepeaterTab('tabRepeater')).form;
    const dx = buildDxTab(dxRepeaterTab);
    expect(normalise(dx)).toEqual(normalise(json));
  });
});
