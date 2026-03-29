/**
 * Builds a gui-form definition and flattened data for the properties panel,
 * based on the selected widget's kind and type.
 */

import { MATERIAL_ICONS } from './material-icons';

const CHANGE_ON = { change: 'propChanged' };

const VALIDATOR_TYPE_BY_WIDGET: Record<string, string> = {
  textinput: 'string',
  password: 'string',
  textarea: 'string',
  markdown: 'string',
  dateInput: 'string',
  datePicker: 'string',
  calendar: 'string',
  select: 'string',
  radiogroup: 'string',
  dropdown: 'string',
  list: 'string',
  number: 'number',
  currency: 'number',
  checkbox: 'boolean',
  toggle: 'boolean',
  rangeCalendar: 'array',
  rangeDateInput: 'array',
  rangeDatePicker: 'array',
  repeater: 'array',
};

interface ValidatorFieldConfig {
  validatorKey: string;
  label: string;
  inputType: 'number' | 'text' | 'select';
  options?: { label: string; value: string }[];
  hasEnableCheckbox: boolean;
}

const VALIDATOR_FIELDS: Record<string, ValidatorFieldConfig[]> = {
  string: [
    { validatorKey: 'minLength', label: 'Min Length', inputType: 'number', hasEnableCheckbox: true },
    { validatorKey: 'maxLength', label: 'Max Length', inputType: 'number', hasEnableCheckbox: true },
    { validatorKey: 'pattern', label: 'Pattern', inputType: 'text', hasEnableCheckbox: true },
    {
      validatorKey: 'format',
      label: 'Format',
      inputType: 'select',
      hasEnableCheckbox: false,
      options: [
        { label: '(none)', value: '' },
        { label: 'Email', value: 'email' },
        { label: 'URL', value: 'url' },
        { label: 'UUID', value: 'uuid' },
        { label: 'Date', value: 'date' },
        { label: 'Time', value: 'time' },
        { label: 'Date-Time', value: 'date-time' },
        { label: 'Duration', value: 'duration' },
        { label: 'Hostname', value: 'hostname' },
        { label: 'IPv4', value: 'ipv4' },
        { label: 'IPv6', value: 'ipv6' },
      ],
    },
  ],
  number: [
    { validatorKey: 'minimum', label: 'Validate Min', inputType: 'number', hasEnableCheckbox: true },
    { validatorKey: 'maximum', label: 'Validate Max', inputType: 'number', hasEnableCheckbox: true },
  ],
  boolean: [],
  array: [
    { validatorKey: 'minItems', label: 'Min Items', inputType: 'number', hasEnableCheckbox: true },
    { validatorKey: 'maxItems', label: 'Max Items', inputType: 'number', hasEnableCheckbox: true },
  ],
};

// ---------------------------------------------------------------------------
// Field builders
// ---------------------------------------------------------------------------

function textField(uid: string, path: string, label: string, readonly = false) {
  return {
    uid,
    kind: 'input',
    type: 'textinput',
    path,
    label,
    ...(readonly ? { readonly: true } : { on: CHANGE_ON }),
  };
}

function numberField(uid: string, path: string, label: string) {
  return { uid, kind: 'input', type: 'number', path, label, on: CHANGE_ON };
}

function checkboxField(uid: string, path: string, label: string) {
  return { uid, kind: 'input', type: 'checkbox', path, label, on: CHANGE_ON };
}

function selectField(
  uid: string,
  path: string,
  label: string,
  options: { label: string; value: string }[],
) {
  return { uid, kind: 'input', type: 'select', path, label, props: { options }, on: CHANGE_ON };
}

function iconField(uid: string, path: string, label = 'Icon') {
  return {
    uid,
    kind: 'input',
    type: 'dropdown',
    path,
    label,
    on: CHANGE_ON,
    props: {
      placeholder: 'Search icon...',
      items: MATERIAL_ICONS,
      labelField: 'label',
      valueField: 'value',
      height: 200,
      itemHeight: 36,
    },
  };
}

function repeaterField(
  uid: string,
  path: string,
  label: string,
  fields: { uid: string; path: string; label: string }[],
) {
  return {
    uid,
    kind: 'input',
    type: 'repeater',
    path,
    label,
    on: CHANGE_ON,
    props: {
      addLabel: 'Add',
      removeLabel: 'Remove',
      template: {
        uid: `${uid}-tpl`,
        kind: 'layout',
        type: 'flex',
        props: { direction: 'row', gap: 8 },
        children: fields.map((f) => ({
          uid: f.uid,
          kind: 'input',
          type: 'textinput',
          path: `${path}.items.${f.path}`,
          label: f.label,
          on: CHANGE_ON,
        })),
      },
    },
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function validatorFieldDefs(config: ValidatorFieldConfig): Record<string, unknown>[] {
  const cap = capitalize(config.validatorKey);
  const enabledPath = `validator${cap}Enabled`;
  const valuePath = `validator${cap}`;
  const fields: Record<string, unknown>[] = [];

  if (config.hasEnableCheckbox) {
    fields.push(checkboxField(`prop-${enabledPath}`, enabledPath, config.label));
    const valueField =
      config.inputType === 'number'
        ? numberField(`prop-${valuePath}`, valuePath, `${config.label} Value`)
        : textField(`prop-${valuePath}`, valuePath, `${config.label} Value`);
    fields.push({ ...valueField, include: { when: `$form.${enabledPath} === true` } });
  } else if (config.inputType === 'select' && config.options) {
    fields.push(selectField(`prop-${valuePath}`, valuePath, config.label, config.options));
  }

  return fields;
}

function optionsRepeater(uid: string, path: string, label = 'Options') {
  return repeaterField(uid, path, label, [
    { uid: `${uid}-label`, path: 'label', label: 'Label' },
    { uid: `${uid}-value`, path: 'value', label: 'Value' },
  ]);
}

function labelUidRepeater(uid: string, path: string, label: string) {
  return repeaterField(uid, path, label, [
    { uid: `${uid}-label`, path: 'label', label: 'Label' },
    { uid: `${uid}-uid`, path: 'uid', label: 'UID' },
  ]);
}

// ---------------------------------------------------------------------------
// Widget-type-specific prop fields
// ---------------------------------------------------------------------------

const PROP_FIELDS: Record<string, Record<string, unknown>[]> = {
  // ---- Input widgets ----
  textinput: [
    textField('prop-placeholder', 'placeholder', 'Placeholder'),
    textField('prop-hint', 'hint', 'Hint'),
    iconField('prop-icon', 'icon'),
    textField('prop-defaultValue', 'defaultValue', 'Default Value'),
  ],
  password: [
    textField('prop-placeholder', 'placeholder', 'Placeholder'),
    textField('prop-hint', 'hint', 'Hint'),
    iconField('prop-icon', 'icon'),
    iconField('prop-showPasswordIcon', 'showPasswordIcon', 'Show Password Icon'),
    iconField('prop-hidePasswordIcon', 'hidePasswordIcon', 'Hide Password Icon'),
    textField('prop-defaultValue', 'defaultValue', 'Default Value'),
  ],
  number: [
    textField('prop-placeholder', 'placeholder', 'Placeholder'),
    textField('prop-hint', 'hint', 'Hint'),
    numberField('prop-step', 'step', 'Step'),
    numberField('prop-minimum', 'minimum', 'Minimum'),
    numberField('prop-maximum', 'maximum', 'Maximum'),
    checkboxField('prop-autoGrow', 'autoGrow', 'Auto Grow'),
  ],
  currency: [
    textField('prop-placeholder', 'placeholder', 'Placeholder'),
    textField('prop-hint', 'hint', 'Hint'),
    textField('prop-currency', 'currency', 'Currency Code'),
    iconField('prop-icon', 'icon'),
    numberField('prop-step', 'step', 'Step'),
    numberField('prop-maximumFractionDigits', 'maximumFractionDigits', 'Max Fraction Digits'),
    numberField('prop-minimumFractionDigits', 'minimumFractionDigits', 'Min Fraction Digits'),
  ],
  textarea: [
    textField('prop-placeholder', 'placeholder', 'Placeholder'),
    textField('prop-hint', 'hint', 'Hint'),
    numberField('prop-maxLength', 'maxLength', 'Max Length'),
    numberField('prop-minimumHeight', 'minimumHeight', 'Min Height (px)'),
    selectField('prop-counterMode', 'counterMode', 'Counter Mode', [
      { label: 'Remaining', value: 'remaining' },
      { label: 'Current', value: 'current' },
    ]),
    textField('prop-defaultValue', 'defaultValue', 'Default Value'),
  ],
  checkbox: [
    textField('prop-hint', 'hint', 'Hint'),
    selectField('prop-checkboxPosition', 'checkboxPosition', 'Checkbox Position', [
      { label: 'Left', value: 'left' },
      { label: 'Right', value: 'right' },
    ]),
  ],
  toggle: [
    textField('prop-hint', 'hint', 'Hint'),
    selectField('prop-togglePosition', 'togglePosition', 'Toggle Position', [
      { label: 'Left', value: 'left' },
      { label: 'Right', value: 'right' },
    ]),
  ],
  select: [
    textField('prop-placeholder', 'placeholder', 'Placeholder'),
    textField('prop-hint', 'hint', 'Hint'),
    iconField('prop-icon', 'icon'),
    textField('prop-labelField', 'labelField', 'Label Field'),
    textField('prop-valueField', 'valueField', 'Value Field'),
    optionsRepeater('prop-options', 'options'),
  ],
  radiogroup: [
    textField('prop-hint', 'hint', 'Hint'),
    textField('prop-labelField', 'labelField', 'Label Field'),
    textField('prop-valueField', 'valueField', 'Value Field'),
    optionsRepeater('prop-options', 'options'),
  ],
  dropdown: [
    textField('prop-placeholder', 'placeholder', 'Placeholder'),
    textField('prop-hint', 'hint', 'Hint'),
    textField('prop-labelField', 'labelField', 'Label Field'),
    textField('prop-valueField', 'valueField', 'Value Field'),
    numberField('prop-height', 'height', 'Height (px)'),
    numberField('prop-itemHeight', 'itemHeight', 'Item Height (px)'),
    optionsRepeater('prop-items', 'items', 'Items'),
  ],
  list: [
    textField('prop-hint', 'hint', 'Hint'),
    textField('prop-labelField', 'labelField', 'Label Field'),
    textField('prop-valueField', 'valueField', 'Value Field'),
    numberField('prop-height', 'height', 'Height (px)'),
    numberField('prop-itemHeight', 'itemHeight', 'Item Height (px)'),
    optionsRepeater('prop-items', 'items', 'Items'),
  ],
  dateInput: [textField('prop-hint', 'hint', 'Hint'), iconField('prop-icon', 'icon')],
  datePicker: [
    textField('prop-hint', 'hint', 'Hint'),
    textField('prop-placeholder', 'placeholder', 'Placeholder'),
    iconField('prop-icon', 'icon'),
    iconField('prop-prevMonthIcon', 'prevMonthIcon', 'Prev Month Icon'),
    iconField('prop-nextMonthIcon', 'nextMonthIcon', 'Next Month Icon'),
    textField('prop-prevMonthAriaLabel', 'prevMonthAriaLabel', 'Prev Month Aria Label'),
    textField('prop-nextMonthAriaLabel', 'nextMonthAriaLabel', 'Next Month Aria Label'),
  ],
  calendar: [
    textField('prop-hint', 'hint', 'Hint'),
    iconField('prop-prevMonthIcon', 'prevMonthIcon', 'Prev Month Icon'),
    iconField('prop-nextMonthIcon', 'nextMonthIcon', 'Next Month Icon'),
    textField('prop-prevMonthAriaLabel', 'prevMonthAriaLabel', 'Prev Month Aria Label'),
    textField('prop-nextMonthAriaLabel', 'nextMonthAriaLabel', 'Next Month Aria Label'),
    numberField('prop-numberOfMonths', 'numberOfMonths', 'Number of Months'),
    textField('prop-minDate', 'minDate', 'Min Date'),
    textField('prop-maxDate', 'maxDate', 'Max Date'),
    textField('prop-disabledRanges', 'disabledRanges', 'Disabled Ranges'),
  ],
  rangeCalendar: [
    textField('prop-hint', 'hint', 'Hint'),
    iconField('prop-prevMonthIcon', 'prevMonthIcon', 'Prev Month Icon'),
    iconField('prop-nextMonthIcon', 'nextMonthIcon', 'Next Month Icon'),
    textField('prop-prevMonthAriaLabel', 'prevMonthAriaLabel', 'Prev Month Aria Label'),
    textField('prop-nextMonthAriaLabel', 'nextMonthAriaLabel', 'Next Month Aria Label'),
    textField('prop-removePillAriaLabel', 'removePillAriaLabel', 'Remove Pill Aria Label'),
    numberField('prop-numberOfMonths', 'numberOfMonths', 'Number of Months'),
    textField('prop-minDate', 'minDate', 'Min Date'),
    textField('prop-maxDate', 'maxDate', 'Max Date'),
    textField('prop-disabledRanges', 'disabledRanges', 'Disabled Ranges'),
  ],
  rangeDateInput: [
    textField('prop-hint', 'hint', 'Hint'),
    iconField('prop-icon', 'icon'),
    textField('prop-separator', 'separator', 'Separator'),
    textField('prop-removePillAriaLabel', 'removePillAriaLabel', 'Remove Pill Aria Label'),
    textField('prop-startDateAriaLabel', 'startDateAriaLabel', 'Start Date Aria Label'),
    textField('prop-endDateAriaLabel', 'endDateAriaLabel', 'End Date Aria Label'),
  ],
  rangeDatePicker: [
    textField('prop-hint', 'hint', 'Hint'),
    iconField('prop-icon', 'icon'),
    textField('prop-separator', 'separator', 'Separator'),
    textField('prop-removePillAriaLabel', 'removePillAriaLabel', 'Remove Pill Aria Label'),
    textField('prop-startDateAriaLabel', 'startDateAriaLabel', 'Start Date Aria Label'),
    textField('prop-endDateAriaLabel', 'endDateAriaLabel', 'End Date Aria Label'),
    iconField('prop-prevMonthIcon', 'prevMonthIcon', 'Prev Month Icon'),
    iconField('prop-nextMonthIcon', 'nextMonthIcon', 'Next Month Icon'),
    textField('prop-prevMonthAriaLabel', 'prevMonthAriaLabel', 'Prev Month Aria Label'),
    textField('prop-nextMonthAriaLabel', 'nextMonthAriaLabel', 'Next Month Aria Label'),
    textField('prop-minDate', 'minDate', 'Min Date'),
    textField('prop-maxDate', 'maxDate', 'Max Date'),
    textField('prop-disabledRanges', 'disabledRanges', 'Disabled Ranges'),
    numberField('prop-numberOfMonths', 'numberOfMonths', 'Number of Months'),
  ],
  markdown: [
    textField('prop-placeholder', 'placeholder', 'Placeholder'),
    textField('prop-hint', 'hint', 'Hint'),
    numberField('prop-maxLength', 'maxLength', 'Max Length'),
    numberField('prop-minimumHeight', 'minimumHeight', 'Min Height (px)'),
    textField('prop-writeTabLabel', 'writeTabLabel', 'Write Tab Label'),
    textField('prop-previewTabLabel', 'previewTabLabel', 'Preview Tab Label'),
    textField('prop-defaultValue', 'defaultValue', 'Default Value'),
  ],
  repeater: [
    textField('prop-title', 'title', 'Title'),
    textField('prop-addLabel', 'addLabel', 'Add Label'),
    iconField('prop-addButtonIcon', 'addButtonIcon', 'Add Button Icon'),
    textField('prop-removeLabel', 'removeLabel', 'Remove Label'),
    iconField('prop-removeButtonIcon', 'removeButtonIcon', 'Remove Button Icon'),
    numberField('prop-limit', 'limit', 'Limit'),
  ],

  // ---- Action widgets ----
  button: [
    selectField('prop-variant', 'variant', 'Variant', [
      { label: 'Filled', value: 'filled' },
      { label: 'Outlined', value: 'outlined' },
    ]),
    iconField('prop-icon', 'icon'),
    selectField('prop-iconPosition', 'iconPosition', 'Icon Position', [
      { label: 'Left', value: 'left' },
      { label: 'Right', value: 'right' },
    ]),
  ],

  // ---- Display widgets ----
  alert: [
    textField('prop-text', 'text', 'Text'),
    selectField('prop-level', 'level', 'Level', [
      { label: 'Default', value: 'default' },
      { label: 'Info', value: 'info' },
      { label: 'Success', value: 'success' },
      { label: 'Warning', value: 'warning' },
      { label: 'Error', value: 'error' },
    ]),
  ],

  // ---- Layout widgets ----
  flex: [
    selectField('prop-direction', 'direction', 'Direction', [
      { label: 'Column', value: 'column' },
      { label: 'Row', value: 'row' },
      { label: 'Column Reverse', value: 'column-reverse' },
      { label: 'Row Reverse', value: 'row-reverse' },
    ]),
    selectField('prop-align', 'align', 'Align', [
      { label: 'Start', value: 'start' },
      { label: 'Center', value: 'center' },
      { label: 'End', value: 'end' },
      { label: 'Space Between', value: 'space-between' },
      { label: 'Space Around', value: 'space-around' },
      { label: 'Space Evenly', value: 'space-evenly' },
    ]),
    selectField('prop-justify', 'justify', 'Justify', [
      { label: 'Start', value: 'start' },
      { label: 'Center', value: 'center' },
      { label: 'End', value: 'end' },
      { label: 'Stretch', value: 'stretch' },
    ]),
    numberField('prop-gap', 'gap', 'Gap'),
  ],
  grid: [
    selectField('prop-direction', 'direction', 'Direction', [
      { label: 'Column', value: 'column' },
      { label: 'Row', value: 'row' },
    ]),
    numberField('prop-columnGap', 'columnGap', 'Column Gap'),
    numberField('prop-rowGap', 'rowGap', 'Row Gap'),
  ],
  accordion: [
    checkboxField('prop-singleOpen', 'singleOpen', 'Single Open'),
    selectField('prop-renderMode', 'renderMode', 'Render Mode', [
      { label: 'All', value: 'all' },
      { label: 'Active Only', value: 'activeOnly' },
    ]),
    labelUidRepeater('prop-sections', 'sections', 'Sections'),
  ],
  tabs: [
    textField('prop-defaultOpen', 'defaultOpen', 'Default Open (UID)'),
    selectField('prop-renderMode', 'renderMode', 'Render Mode', [
      { label: 'All', value: 'all' },
      { label: 'Active Only', value: 'activeOnly' },
    ]),
    labelUidRepeater('prop-tabs', 'tabs', 'Tabs'),
  ],
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Creates a default widget definition for a given kind and type.
 */
export function createDefaultWidget(kind: string, type: string): Record<string, unknown> {
  const uid = `${type}-${Date.now().toString(36)}`;
  const widget: Record<string, unknown> = { uid, kind, type };

  if (kind === 'input' && type === 'repeater') {
    widget['label'] = capitalize(type);
    widget['path'] = uid;
    widget['props'] = {
      template: { uid: uid + '-tpl', kind: 'layout', type: 'flex', children: [] },
      addLabel: 'Add',
      removeLabel: 'Remove',
    };
    widget['defaultValue'] = [{}];
  } else if (kind === 'input') {
    widget['label'] = capitalize(type);
    widget['path'] = uid;
  } else if (kind === 'action') {
    widget['label'] = capitalize(type);
  } else if (kind === 'display' && type === 'alert') {
    widget['props'] = { text: 'Alert message', level: 'info' };
  } else if (kind === 'layout' && type === 'tabs') {
    const tabUid = `flex-${Date.now().toString(36)}`;
    widget['props'] = { tabs: [{ label: 'Tab 1', uid: tabUid }] };
    widget['children'] = [{ uid: tabUid, kind: 'layout', type: 'flex', children: [] }];
  }

  if (kind === 'layout' && type !== 'tabs') {
    widget['children'] = [];
  }

  return widget;
}

export interface PropertyGroup {
  key: string;
  label: string;
  defaultOpen: boolean;
  fields: unknown[];
}

/**
 * Builds grouped property definitions for the properties panel accordion.
 * Returns groups: Identity, Common Properties, Component Properties, Validations.
 * Groups with no fields are still returned (filtered in the component).
 */
export function buildWidgetPropertyGroups(widget: Record<string, unknown>): PropertyGroup[] {
  const identityFields: unknown[] = [
    textField('prop-uid', 'uid', 'ID', true),
    textField('prop-type', 'type', 'Type', true),
    textField('prop-kind', 'kind', 'Kind', true),
  ];

  const commonFields: unknown[] = [numberField('prop-size', 'size', 'Size (grid span)')];

  if (widget['kind'] === 'input') {
    commonFields.push(
      textField('prop-path', 'path', 'Path'),
      textField('prop-label', 'label', 'Label'),
      checkboxField('prop-disabled', 'disabled', 'Disabled'),
      checkboxField('prop-readonly', 'readonly', 'Read Only'),
    );
  } else if (widget['kind'] === 'action') {
    commonFields.push(
      textField('prop-label', 'label', 'Label'),
      checkboxField('prop-disabled', 'disabled', 'Disabled'),
    );
  }

  const typeKey = widget['type'] as string;
  const componentFields: unknown[] = [...(PROP_FIELDS[typeKey] ?? [])];

  const validationFields: unknown[] = [];
  if (widget['kind'] === 'input') {
    const validatorType = VALIDATOR_TYPE_BY_WIDGET[typeKey];
    if (validatorType) {
      validationFields.push(checkboxField('prop-validatorRequired', 'validatorRequired', 'Required'));
      for (const config of VALIDATOR_FIELDS[validatorType] ?? []) {
        validationFields.push(...validatorFieldDefs(config));
      }
    }
  }

  const visibilityFields: unknown[] = [
    checkboxField('prop-includeEnabled', 'includeEnabled', 'Include'),
    { ...textField('prop-includeWhen', 'includeWhen', 'When'), include: { when: '$form.includeEnabled === true' } },
    checkboxField('prop-excludeEnabled', 'excludeEnabled', 'Exclude'),
    { ...textField('prop-excludeWhen', 'excludeWhen', 'When'), include: { when: '$form.excludeEnabled === true' } },
  ];

  return [
    { key: 'identity', label: 'Identity', defaultOpen: false, fields: identityFields },
    { key: 'common', label: 'Common Properties', defaultOpen: true, fields: commonFields },
    { key: 'component', label: 'Component Properties', defaultOpen: true, fields: componentFields },
    { key: 'validations', label: 'Validations', defaultOpen: true, fields: validationFields },
    { key: 'visibility', label: 'Visibility', defaultOpen: true, fields: visibilityFields },
  ];
}

/**
 * Flattens a widget object into a data map matching the form paths.
 * Props are hoisted to the top level so path: 'hint' maps to widget.props.hint.
 */
export function flattenWidgetData(widget: Record<string, unknown>): Record<string, unknown> {
  const { props, children, include, exclude, ...rest } = widget as Record<string, unknown> & {
    props?: Record<string, unknown>;
    children?: unknown[];
    include?: { when?: string };
    exclude?: { when?: string };
  };
  const data: Record<string, unknown> = { ...rest };

  // Flatten include/exclude → flat keys
  data['includeEnabled'] = !!include?.when;
  if (include?.when) data['includeWhen'] = include.when;
  data['excludeEnabled'] = !!exclude?.when;
  if (exclude?.when) data['excludeWhen'] = exclude.when;

  // Flatten validator → flat keys
  if (data['validator'] && typeof data['validator'] === 'object') {
    const v = data['validator'] as Record<string, unknown>;
    data['validatorRequired'] = v['required'] === true;

    const validatorType = v['type'] as string;
    for (const config of VALIDATOR_FIELDS[validatorType] ?? []) {
      const cap = capitalize(config.validatorKey);
      const rawValue = v[config.validatorKey];
      if (config.hasEnableCheckbox) {
        const hasValue = rawValue !== undefined && rawValue !== null;
        data[`validator${cap}Enabled`] = hasValue;
        if (hasValue) data[`validator${cap}`] = rawValue;
      } else {
        data[`validator${cap}`] = rawValue ?? '';
      }
    }
  }
  delete data['validator'];

  // Hoist props to top level
  if (props && typeof props === 'object') {
    for (const [key, value] of Object.entries(props)) {
      data[key] = value;
    }
  }

  // children UIDs for layout widgets (informational, serialized)
  if (Array.isArray(children)) {
    data['children'] = children
      .map((c) => (typeof c === 'string' ? c : (c as Record<string, unknown>)?.['uid']))
      .join(', ');
  }

  return data;
}

// Prop keys per widget type (used to route flat data back into widget.props)
const PROP_KEYS_BY_TYPE: Record<string, string[]> = Object.fromEntries(
  Object.entries(PROP_FIELDS).map(([type, fields]) => [
    type,
    fields.map((f) => f['path'] as string),
  ]),
);

// Base fields editable in the panel (uid/type/kind are readonly, not editable)
const EDITABLE_BASE_KEYS = ['size', 'path', 'label', 'disabled', 'readonly', 'defaultValue'];

/**
 * Applies flat properties-panel data back onto the original widget object.
 * Preserves fields not shown in the panel (on, include, exclude, children, etc.).
 */
export function updateWidgetFromFlatData(
  original: Record<string, unknown>,
  flatData: Record<string, unknown>,
): Record<string, unknown> {
  const typeKey = original['type'] as string;
  const propKeys = new Set(PROP_KEYS_BY_TYPE[typeKey] ?? []);
  const updated: Record<string, unknown> = { ...original };

  for (const key of EDITABLE_BASE_KEYS) {
    if (key in flatData) {
      const val = flatData[key];
      if (val === undefined || val === null || val === '') {
        delete updated[key];
      } else {
        updated[key] = val;
      }
    }
  }

  // Reconstruct validator from flat keys
  const validatorType = VALIDATOR_TYPE_BY_WIDGET[typeKey];
  if (validatorType) {
    const validator: Record<string, unknown> = { type: validatorType };

    if (flatData['validatorRequired']) {
      validator['required'] = true;
    }

    for (const config of VALIDATOR_FIELDS[validatorType] ?? []) {
      const cap = capitalize(config.validatorKey);
      if (config.hasEnableCheckbox) {
        if (flatData[`validator${cap}Enabled`] === true) {
          const value = flatData[`validator${cap}`];
          if (value !== undefined && value !== null && value !== '') {
            validator[config.validatorKey] = value;
          }
        }
      } else {
        const value = flatData[`validator${cap}`];
        if (value !== undefined && value !== null && value !== '') {
          validator[config.validatorKey] = value;
        }
      }
    }

    if (Object.keys(validator).length > 1) {
      updated['validator'] = validator;
    } else {
      delete updated['validator'];
    }
  }

  // Reconstruct include/exclude from flat keys
  if (flatData['includeEnabled'] === true && flatData['includeWhen']) {
    updated['include'] = { when: flatData['includeWhen'] };
  } else {
    delete updated['include'];
  }
  if (flatData['excludeEnabled'] === true && flatData['excludeWhen']) {
    updated['exclude'] = { when: flatData['excludeWhen'] };
  } else {
    delete updated['exclude'];
  }

  if (propKeys.size > 0) {
    const newProps: Record<string, unknown> = {
      ...((original['props'] as Record<string, unknown>) ?? {}),
    };
    for (const propKey of propKeys) {
      if (propKey in flatData) {
        const val = flatData[propKey];
        if (val === undefined || val === null || val === '') {
          delete newProps[propKey];
        } else {
          newProps[propKey] = val;
        }
      }
    }
    if (Object.keys(newProps).length > 0) {
      updated['props'] = newProps;
    } else {
      delete updated['props'];
    }
  }

  // Tabs: sync children to match props.tabs order and membership
  if (typeKey === 'tabs') {
    const newTabs = (((updated['props'] as Record<string, unknown>)?.['tabs'] ?? []) as {
      label: string;
      uid: string;
    }[]);
    const existingChildren = (original['children'] as Record<string, unknown>[]) ?? [];
    const childByUid = new Map(existingChildren.map((c) => [c['uid'] as string, c]));
    updated['children'] = newTabs.map(
      (tab) => childByUid.get(tab.uid) ?? { uid: tab.uid, kind: 'layout', type: 'flex', children: [] },
    );
  }

  return updated;
}

/**
 * Recursively strips `include` and `exclude` from all widgets so that
 * every field is visible in design mode.
 */
export function stripVisibilityRules(root: unknown): unknown {
  if (Array.isArray(root)) {
    return root.map((item) => stripVisibilityRules(item));
  }
  if (root && typeof root === 'object') {
    const { include: _include, exclude: _exclude, ...rest } = root as Record<string, unknown>;
    const node: Record<string, unknown> = { ...rest };
    if (node['children']) {
      node['children'] = stripVisibilityRules(node['children']);
    }
    if (node['form']) {
      node['form'] = stripVisibilityRules(node['form']);
    }
    // Recurse into repeater templates so nested repeaters are also processed.
    if (node['props'] && typeof node['props'] === 'object') {
      const props = { ...(node['props'] as Record<string, unknown>) };
      if (props['template']) {
        props['template'] = stripVisibilityRules(props['template']);
      }
      node['props'] = props;
    }
    // In design mode, repeaters need at least one empty item so users
    // can interact with the inner elements.
    if (node['type'] === 'repeater' && !node['defaultValue']) {
      node['defaultValue'] = [{}];
    }
    return node;
  }
  return root;
}

/**
 * Recursively replaces a widget with a given uid with the replacement object.
 */
export function replaceWidgetByUid(
  root: unknown,
  uid: string,
  replacement: Record<string, unknown>,
): unknown {
  if (Array.isArray(root)) {
    return root.map((item) => replaceWidgetByUid(item, uid, replacement));
  }
  if (root && typeof root === 'object') {
    const node = root as Record<string, unknown>;
    if (node['uid'] === uid) return replacement;
    const updated: Record<string, unknown> = { ...node };
    let changed = false;
    if (node['children']) {
      updated['children'] = replaceWidgetByUid(node['children'], uid, replacement);
      changed = true;
    }
    if (node['form']) {
      updated['form'] = replaceWidgetByUid(node['form'], uid, replacement);
      changed = true;
    }
    if (node['props'] && typeof node['props'] === 'object') {
      const props = node['props'] as Record<string, unknown>;
      if (props['template']) {
        updated['props'] = { ...props, template: replaceWidgetByUid(props['template'], uid, replacement) };
        changed = true;
      }
    }
    if (changed) return updated;
  }
  return root;
}

/**
 * Recursively removes a widget with the given uid from the tree.
 */
export function removeWidgetByUid(root: unknown, uid: string): unknown {
  if (Array.isArray(root)) {
    return root
      .filter((item) => !(item && typeof item === 'object' && (item as Record<string, unknown>)['uid'] === uid))
      .map((item) => removeWidgetByUid(item, uid));
  }
  if (root && typeof root === 'object') {
    const node = root as Record<string, unknown>;
    const updated: Record<string, unknown> = { ...node };
    if (node['children']) {
      updated['children'] = removeWidgetByUid(node['children'], uid);
    }
    if (node['form']) {
      updated['form'] = removeWidgetByUid(node['form'], uid);
    }
    if (node['props'] && typeof node['props'] === 'object') {
      const props = node['props'] as Record<string, unknown>;
      if (props['template']) {
        updated['props'] = { ...props, template: removeWidgetByUid(props['template'], uid) };
      }
    }
    return updated;
  }
  return root;
}

/**
 * Inserts a widget into a container at a given index.
 * If containerUid is null, inserts into the root `form` array.
 * For accordion containers, also adds a section entry in props.sections.
 */
export function insertWidgetAt(
  root: unknown,
  containerUid: string | null,
  widget: Record<string, unknown>,
  index: number,
): unknown {
  if (containerUid === null) {
    // Insert into root form array
    if (root && typeof root === 'object' && !Array.isArray(root)) {
      const obj = root as Record<string, unknown>;
      if (Array.isArray(obj['form'])) {
        const form = [...(obj['form'] as unknown[])];
        form.splice(index, 0, widget);
        return { ...obj, form };
      }
    }
    return root;
  }

  if (Array.isArray(root)) {
    return root.map((item) => insertWidgetAt(item, containerUid, widget, index));
  }
  if (root && typeof root === 'object') {
    const node = root as Record<string, unknown>;
    const updated: Record<string, unknown> = { ...node };
    let found = false;

    if (node['uid'] === containerUid) {
      const children = [...((node['children'] as unknown[]) ?? [])];
      children.splice(index, 0, widget);
      updated['children'] = children;

      // Accordion: also add section metadata
      if (node['type'] === 'accordion' && node['props']) {
        const props = { ...(node['props'] as Record<string, unknown>) };
        const sections = [...((props['sections'] as unknown[]) ?? [])];
        sections.splice(index, 0, {
          label: (widget['label'] as string) || (widget['type'] as string) || 'Section',
          uid: widget['uid'] as string,
        });
        props['sections'] = sections;
        updated['props'] = props;
      }
      // Tabs: also add tab metadata
      if (node['type'] === 'tabs' && node['props']) {
        const props = { ...(node['props'] as Record<string, unknown>) };
        const tabs = [...((props['tabs'] as unknown[]) ?? [])];
        tabs.splice(index, 0, {
          label: (widget['label'] as string) || (widget['type'] as string) || 'Tab',
          uid: widget['uid'] as string,
        });
        props['tabs'] = tabs;
        updated['props'] = props;
      }
      return updated;
    }

    if (node['children']) {
      updated['children'] = insertWidgetAt(node['children'], containerUid, widget, index);
      found = true;
    }
    if (node['form']) {
      updated['form'] = insertWidgetAt(node['form'], containerUid, widget, index);
      found = true;
    }
    if (node['props'] && typeof node['props'] === 'object') {
      const props = node['props'] as Record<string, unknown>;
      if (props['template']) {
        updated['props'] = {
          ...props,
          template: insertWidgetAt(props['template'], containerUid, widget, index),
        };
        found = true;
      }
    }
    if (found) return updated;
  }
  return root;
}

/**
 * Recursively searches for a widget by uid in a parsed formDef object.
 */
export function findWidgetByUid(root: unknown, uid: string): Record<string, unknown> | null {
  if (!root || typeof root !== 'object') return null;

  if (Array.isArray(root)) {
    for (const item of root) {
      const result = findWidgetByUid(item, uid);
      if (result) return result;
    }
    return null;
  }

  const node = root as Record<string, unknown>;

  if (node['uid'] === uid) return node;

  if (node['children']) {
    const result = findWidgetByUid(node['children'], uid);
    if (result) return result;
  }

  if (node['form']) {
    const result = findWidgetByUid(node['form'], uid);
    if (result) return result;
  }

  if (node['props'] && typeof node['props'] === 'object') {
    const props = node['props'] as Record<string, unknown>;
    if (props['template']) {
      const result = findWidgetByUid(props['template'], uid);
      if (result) return result;
    }
  }

  return null;
}
