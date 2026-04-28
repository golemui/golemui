import { gui, DxDefinitions, DxFormConfig, GslSelectorsInput, Dependencies } from '@golemui/gui-shared';

import { textinputTab } from './tabs/textinput.dx';
import { passwordTab } from './tabs/password.dx';
import { currencyTab } from './tabs/currency.dx';
import { numberTab } from './tabs/number.dx';
import { markdownTextTab } from './tabs/markdown-text.dx';
import { alertTab } from './tabs/alert.dx';
import { checkboxTab } from './tabs/checkbox.dx';
import { toggleTab } from './tabs/toggle.dx';
import { markdownTab } from './tabs/markdown.dx';
import { selectTab } from './tabs/select.dx';
import { radiogroupTab } from './tabs/radiogroup.dx';
import { textareaTab } from './tabs/textarea.dx';
import { listTab } from './tabs/list.dx';
import { flexTab } from './tabs/flex.dx';
import { accordionTab } from './tabs/accordion.dx';
import { gridTab } from './tabs/grid.dx';
import { calendarTab } from './tabs/calendar.dx';
import { dropdownTab } from './tabs/dropdown.dx';
import { repeaterTab } from './tabs/repeater.dx';

/**
 * DX kitchen-sink — built on the v2.0 `gui.*` surface.
 * Framework-agnostic: the returned `{ formDef, data, formSelectors, formConfig }`
 * is forwarded into the unified `<gui-form>` component (React `FormComponent`,
 * Angular `<gui-form>`, Lit `<gui-form>`), which detects the DX shape and runs
 * `processDxFacade` internally. Widget loaders are framework-specific and must
 * be supplied by the host playground via `widgetLoaders`.
 *
 * Per-tab content lives in sibling `tabs/<name>.dx.ts` files, mirroring the
 * JSON KS layout (`tabs/<name>.ts`) for easy side-by-side comparison.
 */

export interface KitchenSinkDxOptions {
  widgetLoaders?: Record<string, () => Promise<unknown>>;
  dependencies?: Dependencies;
}

export interface KitchenSinkDx {
  data: Record<string, unknown>;
  formDef: DxDefinitions;
  formSelectors: GslSelectorsInput;
  formConfig: DxFormConfig;
}

const data: Record<string, unknown> = {};

export const buildKitchenSinkDx = (options: KitchenSinkDxOptions = {}): KitchenSinkDx => ({
  data,
  formDef: [
    gui.displays.custom('heading', { text: 'KITCHEN SINK', level: 1 }),
    gui.layouts.tabs(
      [
        { label: 'Textinput Component', uid: 'tabTextinput', children: [textinputTab] },
        { label: 'Password Component', uid: 'tabPassword', children: [passwordTab] },
        { label: 'Currency Component', uid: 'tabCurrency', children: [currencyTab] },
        { label: 'Number Component', uid: 'tabNumber', children: [numberTab] },
        { label: 'Markdown Text Component', uid: 'tabMarkdownText', children: [markdownTextTab] },
        { label: 'Alert Component', uid: 'tabAlert', children: [alertTab] },
        { label: 'Checkbox Component', uid: 'tabCheckbox', children: [checkboxTab] },
        { label: 'Toggle Component', uid: 'tabToggle', children: [toggleTab] },
        { label: 'Markdown Component', uid: 'tabMarkdown', children: [markdownTab] },
        { label: 'Select Component', uid: 'tabSelect', children: [selectTab] },
        { label: 'Radiogroup Component', uid: 'tabRadiogroup', children: [radiogroupTab] },
        { label: 'Textarea Component', uid: 'tabTextarea', children: [textareaTab] },
        { label: 'List Component', uid: 'tabList', children: [listTab] },
        { label: 'Flex Layout', uid: 'tabFlex', children: [flexTab] },
        { label: 'Accordion Layout', uid: 'tabAccordion', children: [accordionTab] },
        { label: 'Grid Layout', uid: 'tabGrid', children: [gridTab] },
        { label: 'Date Components', uid: 'tabDate', children: [calendarTab] },
        { label: 'Dropdown Component', uid: 'tabDropdown', children: [dropdownTab] },
        { label: 'Repeater Component', uid: 'tabRepeater', children: [repeaterTab] },
      ],
      { defaultOpen: 'tabTextinput' },
    ),
    gui.actions.button({ label: 'Create', icon: 'save', iconPosition: 'right', onClick: 'submit' }),
  ],
  formSelectors: [
    // Suppress DX-layer auto-labels and auto-placeholders on every input —
    // JSON KS sets these explicitly per-tab (or omits them); the litmus test
    // expects no auto-injected affordances.
    gui.selectors.inputs({
      suppressAutomaticLabels: true,
      suppressAutomaticPlaceholders: true,
    }),
  ],
  formConfig: {
    // JSON KS does not auto-add a submit button; suppress the DX default so the
    // two pipelines emit equivalent action lists.
    suppressAutomaticSubmit: true,
    widgetLoaders: options.widgetLoaders ?? {},
    dependencies: options.dependencies,
  },
});
