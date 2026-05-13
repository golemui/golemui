/**
 * Conversion script: JSON form templates → Programmatic DX (DSL) equivalents.
 *
 * Usage: node docs/scripts/json-to-dx.mjs
 *
 * Reads JSON files in docs/public/template/{widgets,getting-started,validators}/
 * and writes corresponding .ts files using the new `gui.*` DX shortcuts under
 * docs/public/template/{widgets-dx,getting-started-dx,validators-dx}/.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templateDir = path.resolve(__dirname, '../public/template');

// JSON `type` → DX shortcut method name. Anything not listed falls through to
// `gui.<group>.custom(type, ...)`.
const INPUT_TYPES = {
  textinput: 'textInput',
  number: 'numberInput',
  toggle: 'booleanInput',
  password: 'password',
  currency: 'currency',
  checkbox: 'checkbox',
  select: 'select',
  dropdown: 'dropdown',
  radiogroup: 'radiogroup',
  textarea: 'textarea',
  markdown: 'markdown',
  list: 'list',
  calendar: 'calendar',
  dateInput: 'dateInput',
  datePicker: 'datePicker',
  rangeCalendar: 'rangeCalendar',
  rangeDateInput: 'rangeDateInput',
  rangeDatePicker: 'rangeDatePicker',
  repeater: 'repeater',
};

const ACTION_TYPES = {
  button: 'button',
  submitbutton: 'submitButton',
};

const DISPLAY_TYPES = {
  alert: 'alert',
};

const LAYOUT_TYPES = {
  flex: 'flex',
  horizontalFlex: 'horizontalFlex',
  verticalFlex: 'verticalFlex',
  grid: 'grid',
  horizontalGrid: 'horizontalGrid',
  verticalGrid: 'verticalGrid',
  tabs: 'tabs',
  accordion: 'accordion',
};

const ERGONOMIC_FIELDS = [
  'label',
  'disabled',
  'readonly',
  'validator',
  'include',
  'exclude',
  'defaultValue',
  'size',
];

const pad = (n) => '  '.repeat(n);

// Format a string as a TS literal. Uses single quotes for single-line strings;
// switches to a template literal (backticks) when the string contains newlines
// so the source stays readable for content like markdown bodies.
const fmtString = (s) => {
  if (typeof s !== 'string') return String(s);
  if (s.includes('\n') || s.includes('\r')) {
    const escaped = s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
    return '`' + escaped + '`';
  }
  return "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
};

const fmtKey = (k) => (/[.\-]/.test(k) ? fmtString(k) : k);
const isPrimitive = (v) =>
  v === null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';

// ─── JSON literal → TS literal ───

function jsonToTs(value, indent) {
  if (value === null) return 'null';
  if (typeof value === 'string') return fmtString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    if (value.every(isPrimitive)) {
      return `[${value.map((v) => jsonToTs(v, indent)).join(', ')}]`;
    }
    const inner = pad(indent + 1);
    const outer = pad(indent);
    const items = value.map((v) => `${inner}${jsonToTs(v, indent + 1)}`).join(',\n');
    return `[\n${items},\n${outer}]`;
  }

  if (typeof value === 'object') {
    return jsonObjectToTs(value, indent);
  }

  return String(value);
}

function jsonObjectToTs(obj, indent) {
  const entries = Object.entries(obj);
  if (entries.length === 0) return '{}';
  const inner = pad(indent + 1);
  const outer = pad(indent);
  const lines = entries.map(([k, v]) => `${inner}${fmtKey(k)}: ${jsonToTs(v, indent + 1)}`);
  return `{\n${lines.join(',\n')},\n${outer}}`;
}

// Render a props object for a DX call. `jsonProps` are stringified through
// `jsonToTs`; `rawFields` are pre-rendered TS expressions (e.g. nested
// `gui.*()` calls). Returns null when both are empty so the caller can omit
// the trailing argument entirely.
function propsObjectToTs(jsonProps, rawFields, indent) {
  const jsonEntries = Object.entries(jsonProps);
  const rawEntries = Object.entries(rawFields);
  if (jsonEntries.length === 0 && rawEntries.length === 0) return null;
  const inner = pad(indent + 1);
  const outer = pad(indent);
  const lines = [];
  for (const [k, v] of jsonEntries) {
    lines.push(`${inner}${fmtKey(k)}: ${jsonToTs(v, indent + 1)}`);
  }
  for (const [k, raw] of rawEntries) {
    lines.push(`${inner}${fmtKey(k)}: ${raw}`);
  }
  return `{\n${lines.join(',\n')},\n${outer}}`;
}

// ─── Widget conversion ───

function buildBaseProps(widget) {
  const merged = {};
  if (widget.props && typeof widget.props === 'object') {
    Object.assign(merged, widget.props);
  }
  for (const f of ERGONOMIC_FIELDS) {
    if (widget[f] !== undefined) merged[f] = widget[f];
  }
  if (typeof widget.uid === 'string' && widget.uid.length > 0) {
    merged.uid = widget.uid;
  }
  if (widget.on && typeof widget.on === 'object') {
    for (const [evt, val] of Object.entries(widget.on)) {
      const camel = 'on' + evt.charAt(0).toUpperCase() + evt.slice(1);
      merged[camel] = val;
    }
  }
  return merged;
}

function widgetToTs(widget, indent) {
  switch (widget.kind) {
    case 'input':
      return inputToTs(widget, indent);
    case 'action':
      return actionToTs(widget, indent);
    case 'display':
      return displayToTs(widget, indent);
    case 'layout':
      return layoutToTs(widget, indent);
    default:
      throw new Error(`Unknown widget kind: ${widget.kind}`);
  }
}

function childrenArrayRaw(children, indent) {
  if (!children || children.length === 0) return '[]';
  const inner = pad(indent + 1);
  const outer = pad(indent);
  const items = children.map((c) => `${inner}${widgetToTs(c, indent + 1)}`).join(',\n');
  return `[\n${items},\n${outer}]`;
}

function inputToTs(widget, indent) {
  const { type, path: widgetPath } = widget;
  const merged = buildBaseProps(widget);
  const rawFields = {};

  if (type === 'repeater' && merged.template !== undefined && !Array.isArray(merged.template)) {
    const tpl = merged.template;
    delete merged.template;
    if (typeof tpl === 'object' && tpl !== null) {
      const tplCall = widgetToTs(tpl, indent + 2);
      const inner1 = pad(indent + 1);
      const inner2 = pad(indent + 2);
      rawFields.template = `[\n${inner2}${tplCall},\n${inner1}]`;
    }
  }

  const fn = INPUT_TYPES[type];
  const args = [];
  if (fn) {
    args.push(fmtString(widgetPath ?? ''));
  } else {
    args.push(fmtString(type), fmtString(widgetPath ?? ''));
  }
  const propsStr = propsObjectToTs(merged, rawFields, indent);
  if (propsStr !== null) args.push(propsStr);
  return `${fn ? `gui.inputs.${fn}` : 'gui.inputs.custom'}(${args.join(', ')})`;
}

function actionToTs(widget, indent) {
  const { type } = widget;
  const merged = buildBaseProps(widget);
  const fn = ACTION_TYPES[type];
  const args = [];
  if (!fn) args.push(fmtString(type));
  const propsStr = propsObjectToTs(merged, {}, indent);
  if (propsStr !== null) args.push(propsStr);
  return `${fn ? `gui.actions.${fn}` : 'gui.actions.custom'}(${args.join(', ')})`;
}

function displayToTs(widget, indent) {
  const { type } = widget;
  const merged = buildBaseProps(widget);
  const fn = DISPLAY_TYPES[type];
  const args = [];
  if (!fn) args.push(fmtString(type));
  const propsStr = propsObjectToTs(merged, {}, indent);
  if (propsStr !== null) args.push(propsStr);
  return `${fn ? `gui.displays.${fn}` : 'gui.displays.custom'}(${args.join(', ')})`;
}

function layoutToTs(widget, indent) {
  const { type, children = [] } = widget;
  const merged = buildBaseProps(widget);

  if (type === 'tabs' || type === 'accordion') {
    const sectionsKey = type === 'tabs' ? 'tabs' : 'sections';
    const sections = merged[sectionsKey] ?? [];
    delete merged[sectionsKey];

    const childrenByUid = new Map();
    for (const child of children) {
      const uid = child.uid;
      if (!childrenByUid.has(uid)) childrenByUid.set(uid, []);
      childrenByUid.get(uid).push(child);
    }

    const sectionsRaw = sectionsArrayRaw(sections, childrenByUid, indent);
    const args = [sectionsRaw];
    const propsStr = propsObjectToTs(merged, {}, indent);
    if (propsStr !== null) args.push(propsStr);
    return `gui.layouts.${LAYOUT_TYPES[type]}(${args.join(', ')})`;
  }

  const fn = LAYOUT_TYPES[type];
  const childrenRaw = childrenArrayRaw(children, indent);
  const args = [];
  if (fn) {
    args.push(childrenRaw);
  } else {
    args.push(fmtString(type), childrenRaw);
  }
  const propsStr = propsObjectToTs(merged, {}, indent);
  if (propsStr !== null) args.push(propsStr);
  return `${fn ? `gui.layouts.${fn}` : 'gui.layouts.custom'}(${args.join(', ')})`;
}

function sectionsArrayRaw(sections, childrenByUid, indent) {
  if (sections.length === 0) return '[]';
  const inner = pad(indent + 1);
  const outer = pad(indent);
  const inner2 = pad(indent + 2);
  const items = sections
    .map((sec) => {
      const secChildren = (childrenByUid.get(sec.uid) ?? []).map((c) => {
        // Drop the uid from the child since it duplicates the section uid.
        const { uid: _u, ...rest } = c;
        return rest;
      });
      const childrenRaw = childrenArrayRaw(secChildren, indent + 2);
      const lines = [];
      lines.push(`${inner2}label: ${fmtString(sec.label)}`);
      if (sec.uid) lines.push(`${inner2}uid: ${fmtString(sec.uid)}`);
      lines.push(`${inner2}children: ${childrenRaw}`);
      return `${inner}{\n${lines.join(',\n')},\n${inner}}`;
    })
    .join(',\n');
  return `[\n${items},\n${outer}]`;
}

// ─── File I/O ───

function jsonToDx(jsonObj) {
  const items = jsonObj.form.map((w) => widgetToTs(w, 1));
  const itemsStr = items.map((s) => `  ${s}`).join(',\n');
  return `import { gui } from '@golemui/gui-shared';

export default [
${itemsStr},
];
`;
}

function processDirectory(srcDir, dxDir) {
  if (!fs.existsSync(srcDir)) return;

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const dxPath = path.join(dxDir, entry.name);

    if (entry.isDirectory()) {
      processDirectory(srcPath, dxPath);
    } else if (entry.name.endsWith('.json')) {
      try {
        const jsonContent = JSON.parse(fs.readFileSync(srcPath, 'utf-8'));
        if (!jsonContent.form) continue;

        const tsContent = jsonToDx(jsonContent);
        const tsPath = dxPath.replace(/\.json$/, '.ts');

        fs.mkdirSync(path.dirname(tsPath), { recursive: true });
        fs.writeFileSync(tsPath, tsContent);
        console.log(`  ✓ ${path.relative(templateDir, tsPath)}`);
      } catch (err) {
        console.error(`  ✗ ${srcPath}: ${err.message}`);
      }
    }
  }
}

console.log('Converting JSON templates to Programmatic DSL (DX)...\n');

processDirectory(path.join(templateDir, 'widgets'), path.join(templateDir, 'widgets-dx'));
processDirectory(
  path.join(templateDir, 'getting-started'),
  path.join(templateDir, 'getting-started-dx'),
);
processDirectory(path.join(templateDir, 'validators'), path.join(templateDir, 'validators-dx'));

console.log('\nDone!');
