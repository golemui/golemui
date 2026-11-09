/**
 * Builds the corpus of the differential test (`validate-differential.spec.ts`): every golden input
 * of `validateFormDefinition`, plus mutations of them that reach each family of errors the
 * full-form schema can report. Widget mutations are applied at every position a widget can take
 * (root, `children`, a repeater template and its state variants), and the form is pruned to the
 * chain of ancestors of the mutated widget, which keeps the corpus small enough to validate twice.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const JSON_DIRECTORY = fileURLToPath(new URL('../../src/json', import.meta.url));
const GOLDENS_DIRECTORY = join(JSON_DIRECTORY, 'goldens');
const MOCKS_DIRECTORY = fileURLToPath(
  new URL('../../../../../apps/apps-shared/src/lib/mocks', import.meta.url),
);

type Json = unknown;
type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Every form definition the goldens validate, keyed by a readable name. */
export function readGoldenForms(): Record<string, Json> {
  const forms: Record<string, Json> = {};
  const validateDirectory = join(GOLDENS_DIRECTORY, 'validate');
  for (const fileName of readdirSync(validateDirectory).sort()) {
    const cases = JSON.parse(readFileSync(join(validateDirectory, fileName), 'utf8')) as Record<
      string,
      { input?: Json }
    >;
    for (const [name, entry] of Object.entries(cases)) {
      if (isObject(entry) && 'input' in entry) {
        forms[`golden:${fileName}:${name}`] = entry.input;
      }
    }
  }
  for (const subdirectory of ['json-schema', 'openapi']) {
    const directory = join(GOLDENS_DIRECTORY, subdirectory);
    for (const fileName of readdirSync(directory).sort()) {
      if (!fileName.endsWith('.output.json')) continue;
      const output = JSON.parse(readFileSync(join(directory, fileName), 'utf8')) as {
        formDefinition?: Json;
      };
      if (output.formDefinition !== undefined) {
        forms[`golden:${subdirectory}/${fileName}`] = output.formDefinition;
      }
    }
  }
  for (const fileName of readdirSync(MOCKS_DIRECTORY).sort()) {
    if (fileName.endsWith('.form.json')) {
      forms[`mock:${fileName}`] = JSON.parse(readFileSync(join(MOCKS_DIRECTORY, fileName), 'utf8'));
    }
  }
  return forms;
}

/**
 * A place a widget sits in a form: the keys that lead to it from the root, and a signature of
 * the position and the widget's shape. Mutating two locations with the same signature exercises
 * the same code, so the corpus mutates only the first location of each signature.
 */
type WidgetLocation = { keys: (string | number)[]; signature: string };

function shapeOf(widget: Json): string {
  if (!isObject(widget)) return Array.isArray(widget) ? 'array' : typeof widget;
  const props = widget['props'];
  const parts = [String(widget['kind']), String(widget['type'])];
  for (const key of Object.keys(widget).sort()) {
    if (key === 'children' || key === '$ref' || key.startsWith('validator')) parts.push(key);
  }
  if (isObject(props)) {
    parts.push(
      ...Object.keys(props)
        .filter((key) => key.startsWith('template'))
        .sort(),
    );
  }
  return parts.join(',');
}

/** Lists every widget position of a form, depth first. */
function widgetLocations(form: Json): WidgetLocation[] {
  const locations: WidgetLocation[] = [];
  const visit = (widget: Json, keys: (string | number)[], slot: string): void => {
    locations.push({ keys, signature: `${slot}:${shapeOf(widget)}` });
    if (!isObject(widget)) return;
    const owner = String(widget['type']);
    if (Array.isArray(widget['children'])) {
      widget['children'].forEach((child, index) =>
        visit(child, [...keys, 'children', index], `${owner}>children`),
      );
    }
    const props = widget['props'];
    if (isObject(props)) {
      for (const key of Object.keys(props)) {
        if (key === 'template' || key.startsWith('template.')) {
          visit(props[key], [...keys, 'props', key], `${owner}>template`);
        }
      }
    }
  };
  if (isObject(form) && Array.isArray(form['form'])) {
    form['form'].forEach((widget, index) => visit(widget, ['form', index], 'root'));
  }
  return locations;
}

function getAt(root: Json, keys: (string | number)[]): Json {
  let node: Json = root;
  for (const key of keys) {
    node = (node as Record<string | number, Json>)[key];
  }
  return node;
}

/**
 * Keeps only the ancestors of the widget at `keys`: every array on the way holds just the one
 * entry that leads to the widget, and the widget's own content is kept whole.
 */
function prune(form: Json, keys: (string | number)[]): { form: Json; keys: (string | number)[] } {
  const pruned = clone(form) as JsonObject;
  const prunedKeys: (string | number)[] = [];
  let node: Json = pruned;
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index]!;
    if (typeof key === 'number' && Array.isArray(node)) {
      const kept = node[key];
      node.length = 0;
      node.push(kept);
      prunedKeys.push(0);
      node = kept;
    } else {
      prunedKeys.push(key);
      node = (node as JsonObject)[key as string];
    }
  }
  return { form: pruned, keys: prunedKeys };
}

function setAt(root: Json, keys: (string | number)[], value: Json): void {
  const parent = getAt(root, keys.slice(0, -1)) as Record<string | number, Json>;
  parent[keys[keys.length - 1]!] = value;
}

type WidgetMutation = {
  name: string;
  /** Returns the widget to put at the location, or undefined to skip this mutation there. */
  apply: (widget: Json) => Json | undefined;
};

const TEXT_INPUT = { kind: 'input', type: 'textinput', path: 'mutated' };
const FLEX = { kind: 'layout', type: 'flex', children: [{ ...TEXT_INPUT }] };

/**
 * Applies `edit` to a copy of the widget. Skips the location when the widget is not an object or
 * `appliesTo` returns false for it.
 */
function editWidget(
  edit: (widget: JsonObject) => void,
  appliesTo: (widget: JsonObject) => boolean = () => true,
): (widget: Json) => Json {
  return (widget) => {
    if (!isObject(widget) || !appliesTo(widget)) return undefined;
    const copy = clone(widget);
    edit(copy);
    return copy;
  };
}

function hasTemplate(widget: JsonObject): boolean {
  return isObject(widget['props']) && 'template' in widget['props'];
}

const WIDGET_MUTATIONS: WidgetMutation[] = [
  // Unknown and wrong types.
  { name: 'unknown-type', apply: editWidget((w) => void (w['type'] = 'zzUnknownWidget')) },
  {
    name: 'typo-type',
    apply: editWidget(
      (w) => {
        w['type'] = (w['type'] as string).slice(0, -1);
      },
      (w) => typeof w['type'] === 'string' && w['type'].length >= 4,
    ),
  },
  { name: 'no-type', apply: editWidget((w) => void delete w['type']) },
  { name: 'type-not-a-string', apply: editWidget((w) => void (w['type'] = 5)) },
  { name: 'schemaless-type', apply: () => ({ kind: 'display', type: 'renderer' }) },
  // Kind and required props.
  { name: 'no-kind', apply: editWidget((w) => void delete w['kind']) },
  { name: 'wrong-kind', apply: editWidget((w) => void (w['kind'] = 'bogus')) },
  {
    name: 'no-path',
    apply: editWidget(
      (w) => {
        delete w['path'];
      },
      (w) => 'path' in w,
    ),
  },
  {
    name: 'no-props',
    apply: editWidget(
      (w) => {
        delete w['props'];
      },
      (w) => 'props' in w,
    ),
  },
  // Wrong prop types and unknown props.
  { name: 'unknown-prop', apply: editWidget((w) => void (w['notAProperty'] = true)) },
  { name: 'label-is-a-number', apply: editWidget((w) => void (w['label'] = 42)) },
  { name: 'props-not-an-object', apply: editWidget((w) => void (w['props'] = 'x')) },
  {
    name: 'unknown-props-key',
    apply: editWidget(
      (w) => {
        (w['props'] as JsonObject)['notAProp'] = 1;
      },
      (w) => isObject(w['props']),
    ),
  },
  // Children.
  {
    name: 'empty-children',
    apply: editWidget(
      (w) => {
        w['children'] = [];
      },
      (w) => Array.isArray(w['children']),
    ),
  },
  {
    name: 'children-not-an-array',
    apply: editWidget(
      (w) => {
        w['children'] = {};
      },
      (w) => 'children' in w,
    ),
  },
  {
    name: 'chunk-ref-child',
    apply: editWidget(
      (w) => {
        w['children'] = [{ $ref: './part.form-chunk.json' }];
      },
      (w) => Array.isArray(w['children']),
    ),
  },
  // Widgets in each position.
  { name: 'is-a-chunk-ref', apply: () => ({ $ref: './part.form-chunk.json' }) },
  { name: 'is-a-bad-chunk-ref', apply: () => ({ $ref: 5 }) },
  { name: 'is-a-chunk-ref-with-extras', apply: () => ({ $ref: './x.json', type: 'flex' }) },
  { name: 'is-not-an-object', apply: () => 'x' },
  { name: 'is-null', apply: () => null },
  { name: 'is-an-array', apply: () => [] },
  { name: 'is-an-input', apply: () => clone(TEXT_INPUT) },
  { name: 'is-a-typo-input', apply: () => ({ ...TEXT_INPUT, type: 'textinpu' }) },
  { name: 'is-a-flex', apply: () => clone(FLEX) },
  { name: 'is-a-typo-flex', apply: () => ({ ...clone(FLEX), type: 'flx' }) },
  { name: 'is-a-button', apply: () => ({ kind: 'action', type: 'button', label: 'Go' }) },
  { name: 'is-a-custom-input', apply: () => ({ kind: 'input', type: 'myInput', path: 'q' }) },
  { name: 'is-a-custom-display', apply: () => ({ kind: 'display', type: 'myDisplay' }) },
  {
    name: 'is-a-custom-layout',
    apply: () => ({ kind: 'layout', type: 'myLayout', children: [clone(TEXT_INPUT)] }),
  },
  {
    name: 'is-an-empty-custom-layout',
    apply: () => ({ kind: 'layout', type: 'myLayout', children: [] }),
  },
  {
    name: 'is-a-repeater-with-input-template',
    apply: () => ({
      kind: 'input',
      type: 'repeater',
      path: 'rows',
      props: { template: clone(TEXT_INPUT) },
    }),
  },
  // Validators.
  {
    name: 'validator-bad-keyword-value',
    apply: editWidget((w) => void (w['validator'] = { type: 'string', minLength: 'x' })),
  },
  {
    name: 'validator-type-typo',
    apply: editWidget((w) => void (w['validator'] = { type: 'strng' })),
  },
  { name: 'validator-no-type', apply: editWidget((w) => void (w['validator'] = {})) },
  {
    name: 'validator-unknown-keyword',
    apply: editWidget((w) => void (w['validator'] = { type: 'number', bogus: 1 })),
  },
  { name: 'validator-is-an-array', apply: editWidget((w) => void (w['validator'] = [])) },
  {
    name: 'state-validator-bad',
    apply: editWidget((w) => void (w['validator.mobile'] = { type: 'string', nope: 1 })),
  },
  // Expressions.
  {
    name: 'broken-disabled-expression',
    apply: editWidget((w) => void (w['disabled'] = { when: '$form.x = 1' })),
  },
  { name: 'unparsable-include', apply: editWidget((w) => void (w['include'] = { when: '(' })) },
  {
    name: 'broken-interpolation',
    apply: editWidget((w) => void (w['label'] = 'Hi {{$form.x = 2}}')),
  },
  // Repeater templates and their state variants.
  {
    name: 'state-template-copy',
    apply: editWidget((w) => {
      const props = w['props'] as JsonObject;
      props['template.mobile'] = clone(props['template']);
    }, hasTemplate),
  },
  {
    name: 'state-template-is-an-input',
    apply: editWidget((w) => {
      (w['props'] as JsonObject)['template.mobile'] = clone(TEXT_INPUT);
    }, hasTemplate),
  },
  {
    name: 'state-template-is-invalid',
    apply: editWidget((w) => {
      (w['props'] as JsonObject)['template.mobile'] = { ...clone(FLEX), notAProperty: true };
    }, hasTemplate),
  },
  {
    name: 'state-template-is-a-string',
    apply: editWidget((w) => {
      (w['props'] as JsonObject)['template.mobile'] = 'x';
    }, hasTemplate),
  },
];

const ROOT_MUTATIONS: { name: string; apply: (form: JsonObject) => Json }[] = [
  { name: 'unknown-root-key', apply: (f) => ({ ...f, notARootKey: 1 }) },
  { name: 'states-is-a-number', apply: (f) => ({ ...f, states: 5 }) },
  { name: 'state-is-a-number', apply: (f) => ({ ...f, states: { a: 5 } }) },
  { name: 'state-is-broken', apply: (f) => ({ ...f, states: { a: '$form.x = 1' } }) },
  { name: 'form-is-an-object', apply: (f) => ({ ...f, form: {} }) },
  { name: 'form-is-missing', apply: ({ form: _form, ...rest }) => rest },
  { name: 'form-is-empty', apply: (f) => ({ ...f, form: [] }) },
  { name: 'autocomplete-is-a-number', apply: (f) => ({ ...f, autocomplete: 5 }) },
  { name: 'schema-is-a-number', apply: (f) => ({ ...f, $schema: 5 }) },
];

const NON_OBJECT_ROOTS: Record<string, Json> = {
  'root:null': null,
  'root:array': [],
  'root:string': 'x',
  'root:empty-object': {},
};

/**
 * Returns the corpus: the golden forms as they are, root mutations of each, and every widget
 * mutation at every widget location, deduplicated by content.
 */
export function buildMutationCorpus(): Record<string, Json> {
  const corpus: Record<string, Json> = { ...NON_OBJECT_ROOTS };
  const seen = new Set<string>(Object.values(NON_OBJECT_ROOTS).map((v) => JSON.stringify(v)));
  const add = (name: string, form: Json): void => {
    const key = JSON.stringify(form);
    if (seen.has(key)) return;
    seen.add(key);
    corpus[name] = form;
  };

  const mutatedSignatures = new Set<string>();
  for (const [name, form] of Object.entries(readGoldenForms())) {
    add(name, form);
    if (!isObject(form)) continue;
    // Root mutations only need one widget next to them.
    const small = Array.isArray(form['form']) ? { ...form, form: form['form'].slice(0, 1) } : form;
    for (const mutation of ROOT_MUTATIONS) {
      add(`${name}#${mutation.name}`, mutation.apply(clone(small)));
    }
    for (const location of widgetLocations(form)) {
      if (mutatedSignatures.has(location.signature)) continue;
      mutatedSignatures.add(location.signature);
      const { form: pruned, keys } = prune(form, location.keys);
      const at = keys.join('/');
      add(`${name}@${at}`, pruned);
      for (const mutation of WIDGET_MUTATIONS) {
        const replacement = mutation.apply(getAt(pruned, keys));
        if (replacement === undefined) continue;
        const mutated = clone(pruned);
        setAt(mutated, keys, replacement);
        add(`${name}@${at}#${mutation.name}`, mutated);
      }
    }
  }
  return corpus;
}
