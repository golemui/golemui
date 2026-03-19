/**
 * Builds a gui-form definition and flattened data for the properties panel,
 * based on the selected widget's kind and type.
 */

import { MATERIAL_ICONS } from './material-icons';

const CHANGE_ON = { change: 'propChanged' };

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

function iconField(uid: string, path: string) {
  return {
    uid,
    kind: 'input',
    type: 'dropdown',
    path,
    label: 'Icon',
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
// Common fields shared by all widgets
// ---------------------------------------------------------------------------

const COMMON_FIELDS = [
  textField('prop-uid', 'uid', 'ID', true),
  textField('prop-type', 'type', 'Type', true),
  textField('prop-kind', 'kind', 'Kind', true),
  numberField('prop-size', 'size', 'Size (grid span)'),
];

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
    textField('prop-defaultValue', 'defaultValue', 'Default Value'),
  ],
  number: [
    textField('prop-placeholder', 'placeholder', 'Placeholder'),
    textField('prop-hint', 'hint', 'Hint'),
    numberField('prop-step', 'step', 'Step'),
    numberField('prop-minimum', 'minimum', 'Minimum'),
    numberField('prop-maximum', 'maximum', 'Maximum'),
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
  ],
  calendar: [
    textField('prop-hint', 'hint', 'Hint'),
    numberField('prop-numberOfMonths', 'numberOfMonths', 'Number of Months'),
    textField('prop-minDate', 'minDate', 'Min Date'),
    textField('prop-maxDate', 'maxDate', 'Max Date'),
  ],
  rangeCalendar: [
    textField('prop-hint', 'hint', 'Hint'),
    numberField('prop-numberOfMonths', 'numberOfMonths', 'Number of Months'),
    textField('prop-minDate', 'minDate', 'Min Date'),
    textField('prop-maxDate', 'maxDate', 'Max Date'),
  ],
  rangeDateInput: [
    textField('prop-hint', 'hint', 'Hint'),
    iconField('prop-icon', 'icon'),
    textField('prop-separator', 'separator', 'Separator'),
  ],
  rangeDatePicker: [
    textField('prop-hint', 'hint', 'Hint'),
    iconField('prop-icon', 'icon'),
    textField('prop-separator', 'separator', 'Separator'),
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
    textField('prop-addLabel', 'addLabel', 'Add Label'),
    textField('prop-removeLabel', 'removeLabel', 'Remove Label'),
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
    ]),
    numberField('prop-gap', 'gap', 'Gap'),
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
 * Builds a gui-form formDef JSON string for a given widget object.
 * The generated form contains fields for the widget's properties.
 */
export function buildWidgetPropertiesFormDef(widget: Record<string, unknown>): string {
  const fields: unknown[] = [...COMMON_FIELDS];

  if (widget['kind'] === 'input') {
    fields.push(
      textField('prop-path', 'path', 'Path'),
      textField('prop-label', 'label', 'Label'),
      checkboxField('prop-disabled', 'disabled', 'Disabled'),
      checkboxField('prop-readonly', 'readonly', 'Read Only'),
    );
  } else if (widget['kind'] === 'action') {
    fields.push(
      textField('prop-label', 'label', 'Label'),
      checkboxField('prop-disabled', 'disabled', 'Disabled'),
    );
  }

  const typeKey = widget['type'] as string;
  const propFields = PROP_FIELDS[typeKey] ?? [];
  fields.push(...propFields);

  return JSON.stringify({ form: fields });
}

/**
 * Flattens a widget object into a data map matching the form paths.
 * Props are hoisted to the top level so path: 'hint' maps to widget.props.hint.
 */
export function flattenWidgetData(widget: Record<string, unknown>): Record<string, unknown> {
  const { props, children, ...rest } = widget as Record<string, unknown> & {
    props?: Record<string, unknown>;
    children?: unknown[];
  };
  const data: Record<string, unknown> = { ...rest };

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
    if (node['children']) {
      return { ...node, children: replaceWidgetByUid(node['children'], uid, replacement) };
    }
    if (node['form']) {
      return { ...node, form: replaceWidgetByUid(node['form'], uid, replacement) };
    }
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
    return findWidgetByUid(node['form'], uid);
  }

  return null;
}
