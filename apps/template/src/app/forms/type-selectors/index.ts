import { gui } from '@golemui/gui-shared';

const COUNTRIES = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'jp', label: 'Japan' },
];

const CURRENCIES = [
  { value: 'usd', label: 'USD — US Dollar' },
  { value: 'eur', label: 'EUR — Euro' },
  { value: 'gbp', label: 'GBP — British Pound' },
  { value: 'jpy', label: 'JPY — Japanese Yen' },
  { value: 'aud', label: 'AUD — Australian Dollar' },
  { value: 'cad', label: 'CAD — Canadian Dollar' },
];

// Demo 1: every dropdown shares the same hint + popup height via one rule.
export const typeSelectorDropdownsDemo = {
  data: {},
  form: [
    gui.inputs.textInput('name', { label: 'Full name' }),
    gui.inputs.dropdown('country', {
      label: 'Country',
      items: COUNTRIES,
      labelField: 'label',
      valueField: 'value',
    }),
    gui.inputs.dropdown('currency', {
      label: 'Preferred currency',
      items: CURRENCIES,
      labelField: 'label',
      valueField: 'value',
    }),
    gui.inputs.dateInput('dob', { label: 'Date of birth' }),
  ],
  selectors: [
    gui.selectors.dropdowns({
      override: { hint: 'Type to search', height: 120 },
    }),
  ],
  resources: {},
};

// Demo 2: broad rule decorates every input; byUid overrides one of them.
export const typeSelectorByUidDemo = {
  data: {},
  form: [
    gui.inputs.textInput('username', { label: 'Username' }),
    gui.inputs.textInput('displayName', {
      label: 'Display name',
      uid: 'display-name',
    }),
    gui.inputs.textInput('email', { label: 'Email' }),
    gui.inputs.dateInput('dob', { label: 'Date of birth' }),
    gui.inputs.dropdown('country', {
      label: 'Country',
      items: COUNTRIES,
      labelField: 'label',
      valueField: 'value',
      height: 120,
    }),
  ],
  selectors: [
    // Broad rule — applies to every input kind.
    gui.selectors.inputs({
      override: { hint: '✱ Required' },
    }),
    // ByUid overrides the broad rule for one specific widget.
    gui.selectors.inputByUid('display-name', {
      override: { hint: 'Optional — shown publicly' },
    }),
  ],
  resources: {},
};
