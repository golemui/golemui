import {
  type Dependencies,
  type DxDefinitions,
  type DxFormConfig,
  type GslSelectorsInput,
  gui,
} from '@golemui/gui-shared';
import type { CustomValidatorSchemas } from '@golemui/gui-validators';

import { allowedNames } from '../custom-validators/allowed-names';
import { accordionTab } from './tabs/accordion.dx';
import { alertTab } from './tabs/alert.dx';
import { buttonTab } from './tabs/button.dx';
import { calendarTab } from './tabs/calendar.dx';
import { checkboxTab } from './tabs/checkbox.dx';
import { currencyTab } from './tabs/currency.dx';
import { dropdownTab } from './tabs/dropdown.dx';
import { flexTab } from './tabs/flex.dx';
import { gridTab } from './tabs/grid.dx';
import { listTab } from './tabs/list.dx';
import { markdownTextTab } from './tabs/markdown-text.dx';
import { markdownTab } from './tabs/markdown.dx';
import { numberTab } from './tabs/number.dx';
import { passwordTab } from './tabs/password.dx';
import { radiogroupTab } from './tabs/radiogroup.dx';
import { buildRendererTab } from './tabs/renderer.dx';
import { repeaterTab } from './tabs/repeater.dx';
import { selectTab } from './tabs/select.dx';
import { textareaTab } from './tabs/textarea.dx';
import { textinputTab } from './tabs/textinput.dx';
import { toggleTab } from './tabs/toggle.dx';

/**
 * DX kitchen-sink — built on the v2.0 `gui.*` surface.
 * Framework-agnostic: the returned `{ formDef, data, formSelectors, formConfig }`
 * is forwarded into the unified `<gui-form>` component (React `GuiForm`,
 * Angular `<gui-form>`, Lit `<gui-form>`), which detects the DX shape and runs
 * `processDxFacade` internally. Widget loaders, item renderers and dependencies
 * are framework-specific and must be supplied by the host playground.
 *
 * Per-tab content lives in sibling `tabs/<name>.dx.ts` files, mirroring the
 * JSON KS layout (`tabs/<name>.ts`) for easy side-by-side comparison.
 */

export interface KitchenSinkDxOptions {
  widgetLoaders?: Record<string, () => Promise<unknown>>;
  itemRenderers?: Record<string, unknown>;
  dependencies?: Dependencies;
  /**
   * Optional render function for the Renderer widget tab. The form engine calls
   * it on every form-data change with the form API as `params`. The return value
   * is framework-specific — Lit `TemplateResult`, React `ReactNode`, Vue `VNode`,
   * Angular `{ component, api }`. When omitted, the Renderer tab is skipped.
   */
  rendererExample?: (api: any) => unknown;
}

export interface KitchenSinkDx {
  data: Record<string, unknown>;
  formDef: DxDefinitions;
  formSelectors: GslSelectorsInput;
  formConfig: DxFormConfig;
  customValidators: CustomValidatorSchemas;
}

const states = {
  limitReached: '$form.repeaters.users?.length === 5',
  hasSubregionSelect: `!!$form.selects.subregion`,
  hasSubregionRadiogroup: `!!$form.radiogroups.subregion`,
};

const data: Record<string, unknown> = {
  listName: 'Development Team',
  currency: 1000000,
  dropdowns: {
    defaultListRenderer: 0,
    disabledList: 0,
    customItemRenderer: 'two',
  },
  lists: {
    defaultListRenderer: 0,
    disabledList: 0,
    customItemRenderer: 'one',
  },
  selects: {
    greeting: 'bye',
    wrongGreeting: 'aaaaaa',
    greetingIndex: 2,
  },
  radiogroups: {
    greeting: 'bye',
    wrongGreeting: 'aaaaaa',
    greetingIndex: 2,
  },
  repeaters: {
    users: [
      { firstName: 'Alice', lastName: 'Johnson' },
      { firstName: '', lastName: 'Smith' },
      { firstName: 'Charlie' },
      { firstName: 'Diana', lastName: 'Rodriguez' },
    ],
  },
};

export const buildKitchenSinkDx = (options: KitchenSinkDxOptions = {}): KitchenSinkDx => ({
  data,
  formDef: [
    gui.displays.custom('heading', { text: 'KITCHEN SINK', level: 1 }),
    gui.layouts.tabs(
      [
        { label: 'Alert Component', uid: 'tabAlert', children: [alertTab] },
        { label: 'Button Component', uid: 'tabButton', children: [buttonTab] },
        { label: 'Markdown Text Component', uid: 'tabMarkdownText', children: [markdownTextTab] },
        { label: 'Accordion Layout', uid: 'tabAccordion', children: [accordionTab] },
        { label: 'Flex Layout', uid: 'tabFlex', children: [flexTab] },
        { label: 'Grid Layout', uid: 'tabGrid', children: [gridTab] },
        { label: 'Textinput Component', uid: 'tabTextinput', children: [textinputTab] },
        { label: 'Password Component', uid: 'tabPassword', children: [passwordTab] },
        { label: 'Number Component', uid: 'tabNumber', children: [numberTab] },
        { label: 'Currency Component', uid: 'tabCurrency', children: [currencyTab] },
        { label: 'Date Components', uid: 'tabDate', children: [calendarTab] },
        { label: 'Markdown Component', uid: 'tabMarkdown', children: [markdownTab] },
        { label: 'Textarea Component', uid: 'tabTextarea', children: [textareaTab] },
        { label: 'Checkbox Component', uid: 'tabCheckbox', children: [checkboxTab] },
        { label: 'Toggle Component', uid: 'tabToggle', children: [toggleTab] },
        { label: 'Radiogroup Component', uid: 'tabRadiogroup', children: [radiogroupTab] },
        { label: 'Select Component', uid: 'tabSelect', children: [selectTab] },
        { label: 'Dropdown Component', uid: 'tabDropdown', children: [dropdownTab] },
        { label: 'List Component', uid: 'tabList', children: [listTab] },
        { label: 'Repeater Component', uid: 'tabRepeater', children: [repeaterTab] },
        ...(options.rendererExample !== undefined
          ? [
              {
                label: 'Renderer Component',
                uid: 'tabRenderer',
                children: [buildRendererTab(options.rendererExample)],
              },
            ]
          : []),
      ],
      { defaultOpen: 'tabAlert', onChange: 'onTabEvent' },
    ),
    gui.actions.button({
      uid: 'submit-button',
      actionType: 'submit',
      label: 'Submit',
      icon: 'save',
      iconPosition: 'right',
    }),
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
    states,
    widgetLoaders: options.widgetLoaders ?? {},
    itemRenderers: options.itemRenderers,
    dependencies: options.dependencies,
  },
  customValidators: { allowedNames },
});
