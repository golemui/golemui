/**
 * One-time conversion script: JSON form templates → Programmatic DSL (Dx) equivalents.
 *
 * Usage: node docs/scripts/json-to-dx.mjs
 *
 * Reads all JSON files in docs/public/template/components/, getting-started/, validators/
 * and writes corresponding .ts files under docs/public/template/components-dx/ (etc.)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templateDir = path.resolve(__dirname, '../public/template');

/**
 * Convert a JSON form definition object to a golemForm().create({...}) TypeScript string.
 */
function jsonToDx(jsonObj) {
  const formItems = jsonObj.form;
  const formItemsStr = formItems.map((item) => widgetToTs(item, 2)).join(',\n');

  return `import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
${formItemsStr},
  ],
});
`;
}

/**
 * Convert a single widget object to a TypeScript object literal string.
 */
function widgetToTs(obj, indent) {
  const pad = ' '.repeat(indent * 2);
  const innerPad = ' '.repeat((indent + 1) * 2);
  const lines = [];

  for (const [key, value] of Object.entries(obj)) {
    // Skip empty uid fields (they're auto-generated in Dx)
    if (key === 'uid' && value === '') continue;

    const formattedValue = valueToTs(key, value, indent + 1);
    // Keys with dots need quoting
    const formattedKey = key.includes('.') ? `'${key}'` : key;
    lines.push(`${innerPad}${formattedKey}: ${formattedValue}`);
  }

  return `${pad}{\n${lines.join(',\n')},\n${pad}}`;
}

/**
 * Convert a value to its TypeScript representation.
 */
function valueToTs(key, value, indent) {
  const pad = ' '.repeat(indent * 2);
  const innerPad = ' '.repeat((indent + 1) * 2);

  if (value === null) return 'null';
  if (typeof value === 'string') return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (Array.isArray(value)) {
    // Check if it's an array of simple objects (like options) or widgets
    if (value.length === 0) return '[]';

    // Check if items look like widgets (have 'kind' property)
    const isWidgetArray = value.some((item) => typeof item === 'object' && item !== null && 'kind' in item);
    // Check if items are simple primitives
    const isSimple = value.every((item) => typeof item !== 'object' || item === null);

    if (isSimple) {
      return `[${value.map((v) => valueToTs(key, v, indent)).join(', ')}]`;
    }

    if (isWidgetArray) {
      const items = value.map((item) => widgetToTs(item, indent + 1)).join(',\n');
      return `[\n${items},\n${pad}]`;
    }

    // Array of objects (like options)
    const innerObjPad = ' '.repeat((indent + 1) * 2);
    const items = value.map((item) => {
      if (typeof item === 'object' && item !== null) {
        return `${innerObjPad}${objectToTs(item, indent + 1)}`;
      }
      return `${innerObjPad}${valueToTs(key, item, indent)}`;
    }).join(',\n');
    return `[\n${items},\n${pad}]`;
  }

  if (typeof value === 'object') {
    // Check if it looks like a nested widget
    if ('kind' in value) {
      return widgetToTs(value, indent).trimStart();
    }
    return objectToTs(value, indent);
  }

  return String(value);
}

/**
 * Convert a plain object to TypeScript object literal.
 */
function objectToTs(obj, indent) {
  const pad = ' '.repeat(indent * 2);
  const innerPad = ' '.repeat((indent + 1) * 2);
  const lines = [];

  for (const [key, value] of Object.entries(obj)) {
    const formattedValue = valueToTs(key, value, indent + 1);
    const formattedKey = key.includes('.') || key.includes('-') ? `'${key}'` : key;
    lines.push(`${innerPad}${formattedKey}: ${formattedValue}`);
  }

  return `{\n${lines.join(',\n')},\n${pad}}`;
}

/**
 * Process all JSON files in a source directory, writing .ts equivalents to a parallel -dx directory.
 */
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
        if (!jsonContent.form) continue; // Skip non-form JSON files

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

console.log('Converting JSON templates to Programmatic DSL (Dx)...\n');

// Process components/
processDirectory(
  path.join(templateDir, 'components'),
  path.join(templateDir, 'components-dx'),
);

// Process getting-started/
processDirectory(
  path.join(templateDir, 'getting-started'),
  path.join(templateDir, 'getting-started-dx'),
);

// Process validators/
processDirectory(
  path.join(templateDir, 'validators'),
  path.join(templateDir, 'validators-dx'),
);

console.log('\nDone!');
