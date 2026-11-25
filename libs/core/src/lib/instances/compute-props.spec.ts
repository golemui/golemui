import { describe, expect, it, vi } from 'vitest';
import { compileForm } from '../compile/compile-form';
import { type CompiledWidget, type ExpressionScope } from '../compile/compiled-form';
import { formDefDecoder } from '../form';
import { type I18nTranslator } from '../i18n';
import { type ExpressionFunctions } from '../shared';
import { ExpressionRejectedError } from '../utils/justin';
import { buildWidgetInstances } from './build-instances';
import { computeWidgetFlags } from './compute-flags';
import { computeWidgets } from './compute-props';
import {
  emptyWidgetInstanceTree,
  forEachInstance,
  type WidgetInstance,
  type WidgetInstanceTree,
} from './widget-instance';

/**
 * The computed widgets of the widget instances: the values that a widget gets for the active
 * states, what a hidden widget and a repeater row do, how an override and an unusual prop name
 * are written, and which results of the computation before are kept.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/instances/compute-props.spec.ts
 */

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

type Definition = { states?: Record<string, string>; form: unknown[] };

const compile = ({ states, form }: Definition): CompiledWidget => {
  const formDef = formDefDecoder.parse({
    states,
    form: { uid: '', kind: 'layout', type: 'grid', children: form },
  });
  const root = compileForm(formDef, 'warn').root;
  if (root === undefined) {
    throw new Error('The form has no compiled root');
  }
  return root;
};

const translatorOf = (translate: I18nTranslator['translate']): I18nTranslator => ({
  lang: 'en-US',
  translate,
  subscribe: () => () => undefined,
});

/** Gives the key, and the params as text when the config has params. */
const keyTranslator = translatorOf((key, params) =>
  params === undefined ? key : `${key} ${JSON.stringify(params)}`,
);

type Options = {
  activeStates?: string[];
  functions?: ExpressionFunctions;
  translator?: I18nTranslator;
  overrides?: Record<string, Record<string, unknown>>;
  onlyComputedWidgets?: boolean;
  /** The tree of a computation before, with its flags and its computed widgets. */
  previous?: WidgetInstanceTree;
};

const scopeFor = (
  data: Record<string, unknown>,
  functions: ExpressionFunctions,
): ExpressionScope => ({
  $form: data,
  $meta: {},
  $errors: {},
  $formIsInvalid: false,
  $fn: functions,
});

/** Builds the instances for the data and computes their flags, as a derive does before the props. */
const instancesWithFlags = (
  compiledRoot: CompiledWidget,
  data: Record<string, unknown>,
  { activeStates = [], functions = {}, previous = emptyWidgetInstanceTree() }: Options = {},
): WidgetInstanceTree =>
  computeWidgetFlags(
    buildWidgetInstances(compiledRoot, data, previous),
    compiledRoot,
    data,
    scopeFor(data, functions),
    new Set(activeStates),
  );

const computeTree = (
  tree: WidgetInstanceTree,
  compiledRoot: CompiledWidget | undefined,
  data: Record<string, unknown>,
  {
    activeStates = [],
    functions = {},
    translator = keyTranslator,
    overrides = {},
    onlyComputedWidgets = false,
  }: Options = {},
): WidgetInstanceTree =>
  computeWidgets(tree, compiledRoot, scopeFor(data, functions), {
    data,
    activeStates: new Set(activeStates),
    translator,
    overrides,
    expressionPolicy: 'warn',
    onlyComputedWidgets,
  });

/** Builds the instances for the data, computes their flags and then their widgets. */
const computeFor = (
  compiledRoot: CompiledWidget,
  data: Record<string, unknown>,
  options: Options = {},
): WidgetInstanceTree =>
  computeTree(instancesWithFlags(compiledRoot, data, options), compiledRoot, data, options);

const instanceOf = (tree: WidgetInstanceTree, uid: string): WidgetInstance => {
  let found: WidgetInstance | undefined;
  forEachInstance(tree.root, (instance) => {
    if (instance.uid === uid) {
      found = instance;
    }
  });
  if (found === undefined) {
    throw new Error(`The tree has no instance with the uid ${uid}`);
  }
  return found;
};

type Values = Record<string, any>;

/** The computed widget of an instance, as a plain record. It throws when there is none. */
const currentOf = (tree: WidgetInstanceTree, uid: string): Values => {
  const calculated = instanceOf(tree, uid).calculated;
  if (calculated === undefined) {
    throw new Error(`The instance ${uid} has no computed widget`);
  }
  return calculated.current as unknown as Values;
};

const computedUidsOf = (tree: WidgetInstanceTree): string[] => {
  const uids: string[] = [];
  forEachInstance(tree.root, (instance) => {
    if (instance.calculated !== undefined) {
      uids.push(instance.uid);
    }
  });
  return uids;
};

const heading = (uid: string, more: Record<string, unknown> = {}) => ({
  uid,
  kind: 'display',
  type: 'heading',
  ...more,
});

const textInput = (uid: string, path: string, more: Record<string, unknown> = {}) => ({
  uid,
  kind: 'input',
  type: 'textinput',
  path,
  ...more,
});

const button = (uid: string, more: Record<string, unknown> = {}) => ({
  uid,
  kind: 'action',
  type: 'button',
  ...more,
});

const layout = (uid: string, children: unknown[], more: Record<string, unknown> = {}) => ({
  uid,
  kind: 'layout',
  type: 'flex',
  children,
  ...more,
});

const repeater = (
  uid: string,
  path: string,
  rowUid: string,
  rowWidgets: unknown[],
  more: Record<string, unknown> = {},
) => ({
  uid,
  kind: 'input',
  type: 'repeater',
  path,
  props: { template: layout(rowUid, rowWidgets) },
  ...more,
});

/** The error that a function throws, or `undefined`. */
const errorOf = (run: () => unknown): (Error & { code?: number }) | undefined => {
  try {
    run();
    return undefined;
  } catch (error) {
    return error as Error & { code?: number };
  }
};

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('computeWidgets', () => {
  describe('the computed widget of one instance', () => {
    it('gives every visible instance a computed widget, with the widget of the instance as its source', () => {
      const compiledRoot = compile({
        form: [heading('title'), layout('box', [textInput('name', 'name')])],
      });

      const tree = computeFor(compiledRoot, {});

      expect(computedUidsOf(tree)).toEqual(['#0', 'title', 'box', 'name']);
      expect(instanceOf(tree, 'name').calculated?.source).toBe(instanceOf(tree, 'name').source);
      expect(currentOf(tree, 'title')).toMatchObject({
        uid: 'title',
        kind: 'display',
        type: 'heading',
      });
    });

    it('writes the keys of an input in the order uid, type, kind, its fields, props and on', () => {
      const compiledRoot = compile({
        form: [textInput('name', 'name', { props: { hint: 'a' }, on: { change: 'changed' } })],
      });

      const tree = computeFor(compiledRoot, {});

      expect(Object.keys(currentOf(tree, 'name'))).toEqual([
        'uid',
        'type',
        'kind',
        'size',
        'include',
        'exclude',
        'label',
        'disabled',
        'readonly',
        'validator',
        'path',
        'defaultValue',
        'props',
        'on',
      ]);
    });

    it('has no props key and no on key for a widget that defines none', () => {
      const tree = computeFor(compile({ form: [button('save')] }), {});

      expect(Object.keys(currentOf(tree, 'save'))).toEqual([
        'uid',
        'type',
        'kind',
        'size',
        'include',
        'exclude',
        'label',
        'disabled',
        'actionType',
      ]);
    });

    it('evaluates the slots of a text, and gives an empty text for null and undefined', () => {
      const compiledRoot = compile({
        form: [
          textInput('name', 'name', {
            label: 'Hello {{ $form.name }}, {{ $form.missing }}{{ $form.nothing }}!',
          }),
        ],
      });

      const tree = computeFor(compiledRoot, { name: 'Ada', nothing: null });

      expect(currentOf(tree, 'name')['label']).toBe('Hello Ada, !');
    });

    it('translates a translation config, with each param that is an expression evaluated', () => {
      const translate = vi.fn(() => 'translated');
      const compiledRoot = compile({
        form: [
          textInput('name', 'name', {
            label: {
              key: 'greeting',
              default: 'Hello',
              params: { who: '$form.name', count: 3, text: 'plain' },
            },
          }),
        ],
      });

      const tree = computeFor(
        compiledRoot,
        { name: 'Ada' },
        { translator: translatorOf(translate) },
      );

      expect(currentOf(tree, 'name')['label']).toBe('translated');
      expect(translate).toHaveBeenCalledTimes(1);
      expect(translate).toHaveBeenCalledWith(
        'greeting',
        { who: 'Ada', count: 3, text: 'plain' },
        'Hello',
      );
    });

    it('gives the translator params that have no prototype', () => {
      const prototypes: unknown[] = [];
      const translator = translatorOf((key, params) => {
        prototypes.push(Object.getPrototypeOf(params));
        return key;
      });
      const compiledRoot = compile({
        form: [
          heading('title', {
            props: {
              text: { key: 'k', params: { who: '$form.name' } },
              hint: { key: 'h', params: {} },
            },
          }),
        ],
      });

      computeFor(compiledRoot, { name: 'Ada' }, { translator });

      expect(prototypes).toEqual([null, null]);
    });

    it('gives the translator no params for a config without params, and an empty object for empty params', () => {
      const translate = vi.fn(() => 'translated');
      const compiledRoot = compile({
        form: [heading('title', { props: { text: { key: 'k' }, hint: { key: 'h', params: {} } } })],
      });

      computeFor(compiledRoot, {}, { translator: translatorOf(translate) });

      expect(translate).toHaveBeenNthCalledWith(1, 'k', undefined, undefined);
      expect(translate).toHaveBeenNthCalledWith(2, 'h', {}, undefined);
    });

    it('takes the value of a key with the suffix of an active state', () => {
      const compiledRoot = compile({
        states: { editing: 'true' },
        form: [textInput('name', 'name', { label: 'Name', 'label.editing': 'New name' })],
      });

      expect(currentOf(computeFor(compiledRoot, {}), 'name')['label']).toBe('Name');
      expect(
        currentOf(computeFor(compiledRoot, {}, { activeStates: ['editing'] }), 'name')['label'],
      ).toBe('New name');
    });

    it('reads a disabled and a readonly condition from the flags of the instance', () => {
      const compiledRoot = compile({
        form: [
          textInput('name', 'name', {
            disabled: { when: '$form.locked === true' },
            readonly: { when: '$form.locked !== true' },
          }),
          textInput('plain', 'plain', { disabled: true }),
        ],
      });

      const tree = computeFor(compiledRoot, { locked: true });

      expect(currentOf(tree, 'name')).toMatchObject({ disabled: true, readonly: false });
      expect(currentOf(tree, 'plain')).toMatchObject({ disabled: true, readonly: undefined });
    });

    it('gives an input the path of its instance', () => {
      const compiledRoot = compile({
        form: [repeater('users', 'users', 'row', [textInput('name', 'users.items.name')])],
      });

      const tree = computeFor(compiledRoot, { users: [{}, {}] });

      expect(currentOf(tree, 'users')['path']).toBe('users');
      expect(currentOf(tree, 'name[1]')['path']).toBe('users.1.name');
    });

    it('keeps the object of the definition for a prop that holds no translation config', () => {
      const options = [{ label: 'One', value: 1 }];
      const compiledRoot = compile({ form: [heading('title', { props: { options } })] });

      const tree = computeFor(compiledRoot, {});

      expect(currentOf(tree, 'title')['props'].options).toBe(options);
    });

    it('translates the translation configs inside a prop, and copies only the lists and objects around them', () => {
      const second = { label: 'Two', value: 2 };
      const options = [{ label: { key: 'one' }, value: 1 }, second];
      const compiledRoot = compile({ form: [heading('title', { props: { options } })] });

      const tree = computeFor(compiledRoot, {});

      const computed = currentOf(tree, 'title')['props'].options;
      expect(computed).toEqual([{ label: 'one', value: 1 }, second]);
      expect(computed).not.toBe(options);
      expect(computed[1]).toBe(second);
      expect(options[0].label).toEqual({ key: 'one' });
    });

    it('translates the translation configs inside the result of a translator', () => {
      const plain = { label: 'Two' };
      const translator = translatorOf((key, params) => {
        if (key === 'options') {
          return [{ label: { key: 'one', params: { who: '$form.name' } } }, plain] as never;
        }
        return `${key} for ${String(params?.['who'])}`;
      });
      const compiledRoot = compile({
        form: [heading('title', { props: { options: { key: 'options' } } })],
      });

      const tree = computeFor(compiledRoot, { name: 'Ada' }, { translator });

      const computed = currentOf(tree, 'title')['props'].options;
      expect(computed).toEqual([{ label: 'one for Ada' }, plain]);
      expect(computed[1]).toBe(plain);
    });

    it('keeps the result of a translator that holds no translation config', () => {
      const list = [{ label: 'One' }];
      const translator = translatorOf(() => list as never);
      const compiledRoot = compile({
        form: [heading('title', { props: { options: { key: 'options' } } })],
      });

      const tree = computeFor(compiledRoot, {}, { translator });

      expect(currentOf(tree, 'title')['props'].options).toBe(list);
    });

    it('does not translate a translation config inside the result of a core field', () => {
      const translator = translatorOf(() => [{ key: 'inner' }] as never);
      const translate = vi.spyOn(translator, 'translate');
      const compiledRoot = compile({ form: [textInput('name', 'name', { label: { key: 'k' } })] });

      const tree = computeFor(compiledRoot, {}, { translator });

      expect(currentOf(tree, 'name')['label']).toEqual([{ key: 'inner' }]);
      expect(translate).toHaveBeenCalledTimes(1);
    });

    it('gives a repeater its row layout as it is', () => {
      const compiledRoot = compile({
        form: [
          repeater('users', 'users', 'row', [
            textInput('name', 'users.items.name', { label: { key: 'name' } }),
          ]),
        ],
      });

      const tree = computeFor(compiledRoot, {});

      const users = instanceOf(tree, 'users');
      expect(currentOf(tree, 'users')['props'].template).toBe(users.source.props?.['template']);
    });

    it('does not search the result of a translator for the row layout of a repeater', () => {
      const translator = translatorOf((key) =>
        key === 'layout' ? ([{ key: 'inner' }] as never) : `translated ${key}`,
      );
      const compiledRoot = compile({
        states: { editing: 'true' },
        form: [
          {
            uid: 'users',
            kind: 'input',
            type: 'repeater',
            path: 'users',
            props: {
              template: layout('row', []),
              'template.editing': { key: 'layout' },
              'title.editing': { key: 'layout' },
            },
          },
        ],
      });

      const tree = computeFor(compiledRoot, {}, { translator, activeStates: ['editing'] });

      expect(currentOf(tree, 'users')['props'].template).toEqual([{ key: 'inner' }]);
      expect(currentOf(tree, 'users')['props'].title).toEqual(['translated inner']);
    });

    it('writes the event names without an evaluation, with the value of an active state', () => {
      const compiledRoot = compile({
        states: { editing: 'true' },
        form: [
          button('save', { on: { click: 'save{{ $form.mode }}', 'click.editing': 'saveDraft' } }),
        ],
      });

      const withoutState = computeFor(compiledRoot, { mode: 'x' });
      const editing = computeFor(compiledRoot, { mode: 'x' }, { activeStates: ['editing'] });

      expect(currentOf(withoutState, 'save')['on']).toEqual({
        load: undefined,
        click: 'save{{ $form.mode }}',
        change: undefined,
        filter: undefined,
        blur: undefined,
      });
      expect(Object.keys(currentOf(withoutState, 'save')['on'])).toEqual([
        'load',
        'click',
        'change',
        'filter',
        'blur',
      ]);
      expect(currentOf(editing, 'save')['on'].click).toBe('saveDraft');
    });

    it('lists the visible children of a layout as the widgets of its definition', () => {
      const compiledRoot = compile({
        form: [
          layout('box', [
            heading('first'),
            heading('second', { include: { when: '$form.showSecond === true' } }),
            heading('third'),
          ]),
        ],
      });

      const tree = computeFor(compiledRoot, {});

      const box = instanceOf(tree, 'box');
      const definitionChildren = (box.source as unknown as { children: unknown[] }).children;
      const children = currentOf(tree, 'box')['children'];
      expect(children).toHaveLength(2);
      expect(children[0]).toBe(definitionChildren[0]);
      expect(children[1]).toBe(definitionChildren[2]);
    });

    it('lists the children of a row layout with the uids of the definition', () => {
      const compiledRoot = compile({
        form: [
          repeater('users', 'users', 'row', [
            textInput('name', 'users.items.name'),
            heading('note', { include: { when: '$index === 1' } }),
          ]),
        ],
      });

      const tree = computeFor(compiledRoot, { users: [{}, {}] });

      const uidsOfRow = (uid: string): string[] =>
        currentOf(tree, uid)['children'].map((child: { uid: string }) => child.uid);
      expect(uidsOfRow('row[0]')).toEqual(['name']);
      expect(uidsOfRow('row[1]')).toEqual(['name', 'note']);
    });
  });

  describe('a hidden widget', () => {
    const hiddenBox = () =>
      compile({
        form: [
          layout(
            'box',
            [
              heading('inside', { props: { text: '{{ $form.missing.value }}' } }),
              repeater('users', 'users', 'row', [
                textInput('name', 'users.items.name', { label: { key: 'name' } }),
              ]),
            ],
            { include: { when: '$form.show === true' } },
          ),
          heading('after'),
        ],
      });

    it('has no computed widget, and no widget below it has one', () => {
      const tree = computeFor(hiddenBox(), { users: [{}] });

      expect(computedUidsOf(tree)).toEqual(['#0', 'after']);
    });

    it('evaluates nothing below it', () => {
      const translate = vi.fn(() => 'translated');

      const tree = computeFor(
        hiddenBox(),
        { users: [{}, {}] },
        { translator: translatorOf(translate) },
      );

      expect(translate).not.toHaveBeenCalled();
      expect(instanceOf(tree, 'inside').calculated).toBeUndefined();
    });

    it('computes no widget below it, also when the flags of that widget do not say hidden', () => {
      const compiledRoot = compile({
        form: [
          layout('box', [heading('inside', { props: { text: '{{ $form.missing.value }}' } })]),
        ],
      });
      const visible = instancesWithFlags(compiledRoot, {});
      const root = visible.root as WidgetInstance;
      const box = root.children[0];
      const tree: WidgetInstanceTree = {
        root: { ...root, children: [{ ...box, flags: { hidden: true } }] },
      };

      const computed = computeTree(tree, compiledRoot, {});

      expect(instanceOf(computed, 'inside').flags).toBeUndefined();
      expect(computedUidsOf(computed)).toEqual(['#0']);
    });

    it('loses its computed widget when it becomes hidden', () => {
      const compiledRoot = hiddenBox();
      const shown = computeFor(compiledRoot, { show: true, missing: { value: 1 }, users: [{}] });

      const hidden = computeFor(compiledRoot, { users: [{}] }, { previous: shown });

      expect(computedUidsOf(shown)).toEqual([
        '#0',
        'box',
        'inside',
        'users',
        'row[0]',
        'name[0]',
        'after',
      ]);
      expect(computedUidsOf(hidden)).toEqual(['#0', 'after']);
      expect(instanceOf(hidden, 'after')).toBe(instanceOf(shown, 'after'));
    });

    it('gets a new computed widget when it is shown again, with the objects of the definition', () => {
      const options = [{ label: 'One' }];
      const compiledRoot = compile({
        form: [heading('title', { include: { when: '$form.show === true' }, props: { options } })],
      });
      const first = computeFor(compiledRoot, { show: true });
      const hidden = computeFor(compiledRoot, { show: false }, { previous: first });

      const shownAgain = computeFor(compiledRoot, { show: true }, { previous: hidden });

      expect(instanceOf(shownAgain, 'title').calculated).not.toBe(
        instanceOf(first, 'title').calculated,
      );
      expect(currentOf(shownAgain, 'title')).toEqual(currentOf(first, 'title'));
      expect(currentOf(shownAgain, 'title')['props'].options).toBe(options);
    });
  });

  describe('the rows of a repeater', () => {
    it('gives a row widget the item and the index of its row', () => {
      const compiledRoot = compile({
        form: [
          repeater('users', 'users', 'row', [
            textInput('name', 'users.items.name', { label: '{{ $index }}: {{ $item.name }}' }),
          ]),
        ],
      });

      const tree = computeFor(compiledRoot, { users: [{ name: 'Ada' }, { name: 'Grace' }] });

      expect(currentOf(tree, 'name[0]')['label']).toBe('0: Ada');
      expect(currentOf(tree, 'name[1]')['label']).toBe('1: Grace');
    });

    it('gives the row layout itself the item and the index of its row', () => {
      const compiledRoot = compile({
        form: [
          {
            uid: 'users',
            kind: 'input',
            type: 'repeater',
            path: 'users',
            props: {
              template: layout('row', [], { props: { title: '{{ $index }}: {{ $item.name }}' } }),
            },
          },
        ],
      });

      const tree = computeFor(compiledRoot, { users: [{ name: 'Ada' }] });

      expect(currentOf(tree, 'row[0]')['props'].title).toBe('0: Ada');
    });

    it('gives a widget in a row of a row the item and the index of the innermost row', () => {
      const compiledRoot = compile({
        form: [
          repeater('teams', 'teams', 'team', [
            heading('teamTitle', { props: { text: '{{ $index }}: {{ $item.name }}' } }),
            repeater('devs', 'teams.items.devs', 'dev', [
              heading('devTitle', { props: { text: '{{ $index }}: {{ $item.name }}' } }),
            ]),
            heading('teamEnd', { props: { text: '{{ $index }}: {{ $item.name }}' } }),
          ]),
        ],
      });
      const data = {
        teams: [
          { name: 'Core', devs: [{ name: 'Ada' }] },
          { name: 'Docs', devs: [{ name: 'Grace' }, { name: 'Edsger' }] },
        ],
      };

      const tree = computeFor(compiledRoot, data);

      expect(currentOf(tree, 'teamTitle[1]')['props'].text).toBe('1: Docs');
      expect(currentOf(tree, 'devTitle[1][1]')['props'].text).toBe('1: Edsger');
      expect(currentOf(tree, 'devTitle[0][0]')['props'].text).toBe('0: Ada');
      expect(currentOf(tree, 'teamEnd[1]')['props'].text).toBe('1: Docs');
    });

    it('gives the repeater and the widgets after it no item and no index', () => {
      const compiledRoot = compile({
        form: [
          repeater('users', 'users', 'row', [heading('inRow')], {
            label: '[{{ $index }}{{ $item }}]',
          }),
          heading('after', { props: { text: '[{{ $index }}{{ $item }}]' } }),
        ],
      });

      const tree = computeFor(compiledRoot, { users: [{ name: 'Ada' }] });

      expect(currentOf(tree, 'users')['label']).toBe('[]');
      expect(currentOf(tree, 'after')['props'].text).toBe('[]');
    });

    it('gives an item that is no object to the widgets of its row', () => {
      const compiledRoot = compile({
        form: [
          repeater('tags', 'tags', 'row', [heading('tag', { props: { text: '{{ $item }}' } })]),
        ],
      });

      const tree = computeFor(compiledRoot, { tags: ['red', 5] });

      expect(currentOf(tree, 'tag[0]')['props'].text).toBe('red');
      expect(currentOf(tree, 'tag[1]')['props'].text).toBe('5');
    });

    it('computes nothing in the rows of a hidden repeater', () => {
      const translate = vi.fn(() => 'translated');
      const compiledRoot = compile({
        form: [
          repeater(
            'users',
            'users',
            'row',
            [textInput('name', 'users.items.name', { label: { key: 'name' } })],
            { include: { when: 'false' } },
          ),
        ],
      });

      const tree = computeFor(
        compiledRoot,
        { users: [{}, {}] },
        { translator: translatorOf(translate) },
      );

      expect(computedUidsOf(tree)).toEqual(['#0']);
      expect(translate).not.toHaveBeenCalled();
    });
  });

  describe('an override of a prop', () => {
    const titleForm = (props: Record<string, unknown> = { text: 'Title' }) =>
      compile({ form: [heading('title', { props })] });

    it('replaces the value of the prop, and is not resolved itself', () => {
      const override = { key: 'raw' };
      const tree = computeFor(
        titleForm({ text: 'Title', hint: { key: 'hint' } }),
        {},
        {
          overrides: { title: { text: 'x {{ $form.name }}', hint: override } },
        },
      );

      expect(currentOf(tree, 'title')['props']).toEqual({
        text: 'x {{ $form.name }}',
        hint: { key: 'raw' },
      });
      expect(currentOf(tree, 'title')['props'].hint).toBe(override);
    });

    it('still resolves the value of the definition that it replaces', () => {
      const translate = vi.fn(() => 'translated');
      const compiledRoot = titleForm({ text: { key: 'title' }, hint: '{{ $form.missing.value }}' });

      const withText = computeFor(
        compiledRoot,
        { missing: { value: 1 } },
        { translator: translatorOf(translate), overrides: { title: { text: 'Other' } } },
      );
      const error = errorOf(() =>
        computeFor(compiledRoot, {}, { overrides: { title: { hint: 'Other' } } }),
      );

      expect(currentOf(withText, 'title')['props'].text).toBe('Other');
      expect(translate).toHaveBeenCalledTimes(1);
      expect(error?.code).toBe(40);
    });

    it('adds a prop that only the override has, after the props of the definition', () => {
      const tree = computeFor(
        titleForm({ text: 'Title', hint: 'Hint' }),
        {},
        {
          overrides: { title: { extra: 1, text: 'Other' } },
        },
      );

      expect(Object.keys(currentOf(tree, 'title')['props'])).toEqual(['text', 'hint', 'extra']);
      expect(currentOf(tree, 'title')['props']).toEqual({ text: 'Other', hint: 'Hint', extra: 1 });
    });

    it('goes to the widget with its uid only', () => {
      const compiledRoot = compile({
        form: [
          heading('title', { props: { text: 'Title' } }),
          heading('other', { props: { text: 'Other title' } }),
        ],
      });

      const tree = computeFor(compiledRoot, {}, { overrides: { title: { text: 'New' } } });

      expect(currentOf(tree, 'title')['props'].text).toBe('New');
      expect(currentOf(tree, 'other')['props'].text).toBe('Other title');
    });

    it('with the value undefined leaves the value of the definition, and keeps the key of a prop that only it has', () => {
      const tree = computeFor(
        titleForm(),
        {},
        {
          overrides: { title: { text: undefined, extra: undefined } },
        },
      );

      const props = currentOf(tree, 'title')['props'];
      expect(props).toEqual({ text: 'Title', extra: undefined });
      expect(Object.keys(props)).toEqual(['text', 'extra']);
    });

    it('whose name has a dot is not applied, and its name up to the dot is a prop', () => {
      const tree = computeFor(
        titleForm(),
        {},
        {
          overrides: { title: { 'text.editing': 'Other', 'more.x': 'More' } },
        },
      );

      const props = currentOf(tree, 'title')['props'];
      expect(props).toEqual({ text: 'Title', more: undefined });
      expect(Object.keys(props)).toEqual(['text', 'more']);
    });

    it('gives a widget without props the props of the override', () => {
      const compiledRoot = compile({ form: [heading('title')] });

      const tree = computeFor(compiledRoot, {}, { overrides: { title: { text: 'New' } } });

      expect(currentOf(tree, 'title')['props']).toEqual({ text: 'New' });
    });

    it.each(['__proto__', 'constructor', 'prototype'])('with the name %s is an error', (name) => {
      const overrides = { title: JSON.parse(`{ "${name}": "x" }`) as Record<string, unknown> };

      const error = errorOf(() => computeFor(titleForm(), {}, { overrides }));

      expect(error?.message).toBe(
        `Path "props.${name}" has the segment "${name}". A path cannot contain the segments __proto__, constructor or prototype.`,
      );
      expect(error?.code).toBeUndefined();
    });

    it('reads a name that only it has from the props of the definition, also a member that every object has', () => {
      const tree = computeFor(
        titleForm(),
        {},
        {
          overrides: { title: { toString: undefined, extra: undefined } },
        },
      );

      const props = currentOf(tree, 'title')['props'];
      expect(Object.keys(props)).toEqual(['text', 'toString', 'extra']);
      expect(props.toString).toBe(Object.prototype.toString);
      expect(props.extra).toBeUndefined();
    });

    it('reads no value from the definition for a widget that has no props', () => {
      const compiledRoot = compile({ form: [heading('title')] });

      const tree = computeFor(compiledRoot, {}, { overrides: { title: { toString: undefined } } });

      const props = currentOf(tree, 'title')['props'];
      expect(Object.keys(props)).toEqual(['toString']);
      expect(Object.prototype.hasOwnProperty.call(props, 'toString')).toBe(true);
      expect(props.toString).toBeUndefined();
    });
  });

  describe('a prop name that the path helpers read in a special way', () => {
    it.each(['__proto__', 'constructor', 'prototype'])(
      'gives an error for the name %s, after the props before it are resolved',
      (name) => {
        const propsOf = (first: string) =>
          JSON.parse(`{ "first": "${first}", "${name}": "x" }`) as Record<string, unknown>;
        const withValidFirst = compile({ form: [heading('title', { props: propsOf('ok') })] });
        const withFailingFirst = compile({
          form: [heading('title', { props: propsOf('{{ $form.missing.value }}') })],
        });

        const nameError = errorOf(() => computeFor(withValidFirst, {}));
        const firstError = errorOf(() => computeFor(withFailingFirst, {}));

        expect(nameError?.message).toBe(
          `Path "props.${name}" has the segment "${name}". A path cannot contain the segments __proto__, constructor or prototype.`,
        );
        expect(firstError?.code).toBe(40);
      },
    );

    it('makes the props an array when they are an array in the definition', () => {
      const compiledRoot = compile({
        form: [heading('title', { props: ['a', 'b {{ $form.name }}'] })],
      });

      const tree = computeFor(compiledRoot, { name: 'Ada' });

      const props = currentOf(tree, 'title')['props'];
      expect(Array.isArray(props)).toBe(true);
      expect(props).toEqual(['a', 'b Ada']);
    });

    it('makes the props an array when the first name is the index 9', () => {
      const tree = computeFor(
        compile({ form: [heading('title', { props: { 9: 'nine', text: 'Title' } })] }),
        {},
      );

      const props = currentOf(tree, 'title')['props'];
      expect(Array.isArray(props)).toBe(true);
      expect(props).toHaveLength(10);
      expect(props[9]).toBe('nine');
      expect(props.text).toBe('Title');
    });

    it('makes the props an array of letters when they are a text in the definition', () => {
      const tree = computeFor(compile({ form: [heading('title', { props: 'abc' })] }), {});

      expect(currentOf(tree, 'title')['props']).toEqual(['a', 'b', 'c']);
    });

    it.each([[5], [null]])('has no props for the props %o of the definition', (props) => {
      const tree = computeFor(compile({ form: [heading('title', { props })] }), {});

      expect('props' in currentOf(tree, 'title')).toBe(false);
    });

    it('keeps the computed widget of props that are an array while no value changes', () => {
      const compiledRoot = compile({ form: [heading('title', { props: ['a', 'b'] })] });
      const first = computeFor(compiledRoot, {});

      const second = computeFor(compiledRoot, { other: 1 }, { previous: first });

      expect(second).toBe(first);
    });

    it('makes the props an array when an override has an index as its name, with the other props as keys of it', () => {
      const compiledRoot = compile({ form: [heading('title', { props: { text: 'Title' } })] });

      const tree = computeFor(compiledRoot, {}, { overrides: { title: { 0: 'zero' } } });

      const props = currentOf(tree, 'title')['props'];
      expect(Array.isArray(props)).toBe(true);
      expect(props[0]).toBe('zero');
      expect(props.text).toBe('Title');
    });

    it('makes the props an object again when the override with the index is gone', () => {
      const compiledRoot = compile({ form: [heading('title', { props: { text: 'Title' } })] });
      const withIndex = computeFor(compiledRoot, {}, { overrides: { title: { 0: 'zero' } } });

      const without = computeFor(compiledRoot, {}, { previous: withIndex });

      expect(currentOf(without, 'title')['props']).toEqual({ text: 'Title' });
      expect(Array.isArray(currentOf(without, 'title')['props'])).toBe(false);
      expect(instanceOf(without, 'title').calculated).not.toBe(
        instanceOf(withIndex, 'title').calculated,
      );
    });

    it('gives a new computed widget on every computation while props that are an array have a name that is no index', () => {
      const compiledRoot = compile({ form: [heading('title', { props: ['a'] })] });
      const overrides = { title: { text: 'Title' } };
      const first = computeFor(compiledRoot, {}, { overrides });

      const second = computeFor(compiledRoot, {}, { overrides, previous: first });

      expect(currentOf(second, 'title')['props'].text).toBe('Title');
      expect(instanceOf(second, 'title').calculated).not.toBe(
        instanceOf(first, 'title').calculated,
      );
    });

    it('writes a prop with an empty name, and computes the widget again on every computation', () => {
      const compiledRoot = compile({
        form: [heading('title', { props: { '': 'empty', text: 'Title' } })],
      });
      const first = computeFor(compiledRoot, {});

      const second = computeFor(compiledRoot, {}, { previous: first });

      expect(currentOf(first, 'title')['props']).toEqual({ '': 'empty', text: 'Title' });
      expect(instanceOf(second, 'title').calculated).not.toBe(
        instanceOf(first, 'title').calculated,
      );
    });

    it('writes a prop whose name starts with a digit and is no index as a key of an object', () => {
      const tree = computeFor(
        compile({ form: [heading('title', { props: { '1st': 'first', text: 'Title' } })] }),
        {},
      );

      const props = currentOf(tree, 'title')['props'];
      expect(Array.isArray(props)).toBe(false);
      expect(props).toEqual({ '1st': 'first', text: 'Title' });
    });
  });

  describe('the results of the computation before', () => {
    const optionsForm = () =>
      compile({
        states: { editing: 'true' },
        form: [
          layout(
            'box',
            [
              heading('title', {
                props: {
                  text: 'Hello {{ $form.name }}',
                  options: [{ label: { key: 'one' } }, { label: 'Two' }],
                },
              }),
              heading('note', { include: { when: '$form.showNote !== false' } }),
            ],
            { props: { gap: 1, 'gap.editing': 2 } },
          ),
          heading('after', { props: { text: '{{ $form.other }}' } }),
        ],
      });

    it('returns the previous tree when no value changed', () => {
      const compiledRoot = optionsForm();
      const first = computeFor(compiledRoot, { name: 'Ada' });

      const second = computeFor(compiledRoot, { name: 'Ada', unused: 1 }, { previous: first });

      expect(second).toBe(first);
    });

    it('keeps a value that is equal to the previous value, also when it is built again', () => {
      const compiledRoot = optionsForm();
      const first = computeFor(compiledRoot, { name: 'Ada' });

      const second = computeFor(compiledRoot, { name: 'Grace' }, { previous: first });

      expect(currentOf(second, 'title')['props'].text).toBe('Hello Grace');
      expect(currentOf(second, 'title')['props'].options).toBe(
        currentOf(first, 'title')['props'].options,
      );
      expect(currentOf(second, 'title')['props']).not.toBe(currentOf(first, 'title')['props']);
    });

    it('gives a new instance to a changed widget and to the widgets above it, and keeps the others', () => {
      const compiledRoot = optionsForm();
      const first = computeFor(compiledRoot, { name: 'Ada' });

      const second = computeFor(compiledRoot, { name: 'Grace' }, { previous: first });

      expect(second).not.toBe(first);
      expect(instanceOf(second, 'title')).not.toBe(instanceOf(first, 'title'));
      expect(instanceOf(second, 'box')).not.toBe(instanceOf(first, 'box'));
      expect(instanceOf(second, 'box').calculated).toBe(instanceOf(first, 'box').calculated);
      expect(instanceOf(second, 'note')).toBe(instanceOf(first, 'note'));
      expect(instanceOf(second, 'after')).toBe(instanceOf(first, 'after'));
    });

    it('keeps the list of the children of a layout when another value of the layout changes', () => {
      const compiledRoot = optionsForm();
      const first = computeFor(compiledRoot, {});

      const second = computeFor(compiledRoot, {}, { previous: first, activeStates: ['editing'] });

      expect(currentOf(second, 'box')['props'].gap).toBe(2);
      expect(instanceOf(second, 'box').calculated).not.toBe(instanceOf(first, 'box').calculated);
      expect(currentOf(second, 'box')['children']).toBe(currentOf(first, 'box')['children']);
    });

    it('gives a layout a new list of children and a new computed widget when a child is hidden', () => {
      const compiledRoot = optionsForm();
      const first = computeFor(compiledRoot, {});

      const second = computeFor(compiledRoot, { showNote: false }, { previous: first });

      const uids = (tree: WidgetInstanceTree): string[] =>
        currentOf(tree, 'box')['children'].map((child: { uid: string }) => child.uid);
      expect(uids(first)).toEqual(['title', 'note']);
      expect(uids(second)).toEqual(['title']);
      expect(instanceOf(second, 'box').calculated).not.toBe(instanceOf(first, 'box').calculated);
    });

    it('gives a layout a new list of children when one visible child is replaced by another', () => {
      const compiledRoot = compile({
        form: [
          layout('box', [
            heading('first', { include: { when: '$form.show === 1' } }),
            heading('second', { include: { when: '$form.show === 2' } }),
          ]),
        ],
      });
      const first = computeFor(compiledRoot, { show: 1 });

      const second = computeFor(compiledRoot, { show: 2 }, { previous: first });

      expect(currentOf(first, 'box')['children'][0].uid).toBe('first');
      expect(currentOf(second, 'box')['children'][0].uid).toBe('second');
      expect(instanceOf(second, 'box').calculated).not.toBe(instanceOf(first, 'box').calculated);
    });

    it('counts a prop that only a previous override had set as a change', () => {
      const compiledRoot = compile({ form: [heading('title', { props: { text: 'Title' } })] });
      const withExtra = computeFor(compiledRoot, {}, { overrides: { title: { extra: 1 } } });

      const without = computeFor(compiledRoot, {}, { previous: withExtra });

      expect(currentOf(withExtra, 'title')['props']).toEqual({ text: 'Title', extra: 1 });
      expect(currentOf(without, 'title')['props']).toEqual({ text: 'Title' });
      expect(instanceOf(without, 'title').calculated).not.toBe(
        instanceOf(withExtra, 'title').calculated,
      );
    });

    it('counts it as a change when the only previous prop is gone', () => {
      const compiledRoot = compile({ form: [heading('title')] });
      const withExtra = computeFor(compiledRoot, {}, { overrides: { title: { extra: 1 } } });

      const without = computeFor(compiledRoot, {}, { previous: withExtra });

      expect('props' in currentOf(without, 'title')).toBe(false);
      expect(instanceOf(without, 'title').calculated).not.toBe(
        instanceOf(withExtra, 'title').calculated,
      );
    });

    it('keeps the computed widget while an override stays the same', () => {
      const compiledRoot = compile({ form: [heading('title', { props: { text: 'Title' } })] });
      const overrides = { title: { text: 'Other', extra: { deep: [1, 2] } } };
      const first = computeFor(compiledRoot, {}, { overrides });

      const second = computeFor(
        compiledRoot,
        {},
        { overrides: { title: { text: 'Other', extra: { deep: [1, 2] } } }, previous: first },
      );

      expect(second).toBe(first);
    });

    it('gives a new computed widget on every computation for a value that is NaN', () => {
      const compiledRoot = compile({ form: [heading('title', { props: { text: 'Title' } })] });
      const overrides = { title: { amount: Number.NaN } };
      const first = computeFor(compiledRoot, {}, { overrides });

      const second = computeFor(compiledRoot, {}, { overrides, previous: first });

      expect(instanceOf(second, 'title').calculated).not.toBe(
        instanceOf(first, 'title').calculated,
      );
    });

    it('keeps the computed widgets of the rows that did not change when another row changes', () => {
      const compiledRoot = compile({
        form: [
          repeater('users', 'users', 'row', [
            textInput('name', 'users.items.name', { label: 'Name of {{ $item.name }}' }),
          ]),
        ],
      });
      const first = computeFor(compiledRoot, { users: [{ name: 'Ada' }, { name: 'Grace' }] });

      const second = computeFor(
        compiledRoot,
        { users: [{ name: 'Ada' }, { name: 'Edsger' }] },
        { previous: first },
      );

      expect(currentOf(second, 'name[1]')['label']).toBe('Name of Edsger');
      expect(instanceOf(second, 'row[0]')).toBe(instanceOf(first, 'row[0]'));
      expect(instanceOf(second, 'name[0]')).toBe(instanceOf(first, 'name[0]'));
      expect(instanceOf(second, 'row[1]')).not.toBe(instanceOf(first, 'row[1]'));
      expect(instanceOf(second, 'row[1]').calculated).toBe(instanceOf(first, 'row[1]').calculated);
    });
  });

  describe('a computation of the computed widgets only', () => {
    const labelForm = () =>
      compile({
        form: [
          textInput('name', 'name', { label: { key: 'name' } }),
          layout('box', [heading('inside', { props: { text: { key: 'inside' } } })], {
            include: { when: '$form.show === true' },
          }),
        ],
      });

    it('computes the computed widgets again', () => {
      const compiledRoot = labelForm();
      const english = computeFor(compiledRoot, { show: true });
      const spanish = translatorOf((key) => `es:${key}`);

      const tree = computeTree(
        english,
        compiledRoot,
        { show: true },
        {
          translator: spanish,
          onlyComputedWidgets: true,
        },
      );

      expect(currentOf(tree, 'name')['label']).toBe('es:name');
      expect(currentOf(tree, 'inside')['props'].text).toBe('es:inside');
    });

    it('leaves a widget that is not computed, and every widget below it, as it is', () => {
      const compiledRoot = labelForm();
      const translate = vi.fn((key: string) => `es:${key}`);
      const withHiddenBox = computeFor(compiledRoot, { show: false });

      const tree = computeTree(
        withHiddenBox,
        compiledRoot,
        { show: true },
        {
          translator: translatorOf(translate),
          onlyComputedWidgets: true,
        },
      );

      expect(computedUidsOf(tree)).toEqual(['#0', 'name']);
      expect(instanceOf(tree, 'box')).toBe(instanceOf(withHiddenBox, 'box'));
      expect(translate).toHaveBeenCalledTimes(1);
    });

    it('computes nothing for instances that no computation has computed', () => {
      const compiledRoot = labelForm();
      const translate = vi.fn((key: string) => key);
      const notComputed = instancesWithFlags(compiledRoot, { show: true });

      const tree = computeTree(
        notComputed,
        compiledRoot,
        { show: true },
        {
          translator: translatorOf(translate),
          onlyComputedWidgets: true,
        },
      );

      expect(tree).toBe(notComputed);
      expect(translate).not.toHaveBeenCalled();
    });

    it('computes every visible widget when the computation is not limited', () => {
      const compiledRoot = labelForm();
      const notComputed = instancesWithFlags(compiledRoot, { show: true });

      const tree = computeTree(notComputed, compiledRoot, { show: true });

      expect(computedUidsOf(tree)).toEqual(['#0', 'name', 'box', 'inside']);
    });
  });

  describe('an error', () => {
    it('of a slot has the code 40 and names the text of the slot', () => {
      const compiledRoot = compile({
        form: [heading('title', { props: { text: 'a {{  $form.missing.value  }} b' } })],
      });

      const error = errorOf(() => computeFor(compiledRoot, {}));

      expect(error?.name).toBe('StringInterpolationError');
      expect(error?.code).toBe(40);
      expect(error?.message).toBe(
        "Failed to evaluate '{{$form.missing.value}}': Cannot read properties of undefined (reading 'value')",
      );
    });

    it('of a param of a translation has the code 40 and names the param', () => {
      const compiledRoot = compile({
        form: [
          heading('title', {
            props: { text: { key: 'k', params: { who: '$form.missing.value' } } },
          }),
        ],
      });

      const error = errorOf(() => computeFor(compiledRoot, {}));

      expect(error?.name).toBe('StringInterpolationError');
      expect(error?.code).toBe(40);
      expect(error?.message).toBe(
        "Failed to evaluate i18n param '$form.missing.value': Cannot read properties of undefined (reading 'value')",
      );
    });

    it.each([
      ['a slot', { text: '{{ $form.name = 1 }}' }],
      ['a param of a translation', { text: { key: 'k', params: { who: '$form.name = 1' } } }],
    ])('of a rejected expression in %s is the error of the rejection', (_place, props) => {
      const compiledRoot = compile({ form: [heading('title', { props })] });

      const error = errorOf(() => computeFor(compiledRoot, {}));

      expect(error).toBeInstanceOf(ExpressionRejectedError);
      expect(error?.code).toBe(50);
    });

    it('of the translator is thrown as it is', () => {
      const failure = new Error('the translator failed');
      const translator = translatorOf(() => {
        throw failure;
      });
      const compiledRoot = compile({
        form: [heading('title', { props: { text: { key: 'k' } } })],
      });

      expect(errorOf(() => computeFor(compiledRoot, {}, { translator }))).toBe(failure);
    });

    it('of a translation config inside a prop is thrown when the widget is computed', () => {
      const failure = new Error('the translator failed');
      const translator = translatorOf(() => {
        throw failure;
      });
      const compiledRoot = compile({
        form: [heading('title', { props: { options: [{ label: { key: 'one' } }] } })],
      });

      expect(errorOf(() => computeFor(compiledRoot, {}, { translator }))).toBe(failure);
    });

    it('of a list with an empty place inside a prop is thrown after the entries before that place', () => {
      const translate = vi.fn((key: string) => `translated ${key}`);
      const options: unknown[] = [{ key: 'one' }, { key: 'skipped' }, { key: 'three' }];
      delete options[1];
      const compiledRoot = compile({ form: [heading('title', { props: { options } })] });
      // The compile step keeps the error of the read of the empty place.
      const compiledOptions = compiledRoot.children[0].propFields[0].candidates[0].value;
      const failures =
        compiledOptions.kind === 'nested'
          ? compiledOptions.entries.flatMap((entry) =>
              entry.value.kind === 'failure' ? [entry.value.error] : [],
            )
          : [];

      const error = errorOf(() =>
        computeFor(compiledRoot, {}, { translator: translatorOf(translate) }),
      );

      expect(failures).toHaveLength(1);
      expect(error).toBe(failures[0]);
      expect(translate).toHaveBeenCalledTimes(1);
      expect(translate).toHaveBeenCalledWith('one', undefined, undefined);
    });

    it('comes from the first widget that fails, in the order of the document', () => {
      const compiledRoot = compile({
        form: [
          layout('box', [heading('inside', { props: { text: '{{ $form.first.value }}' } })], {
            props: { title: '{{ $form.box.value }}' },
          }),
          heading('after', { props: { text: '{{ $form.second.value }}' } }),
        ],
      });

      const boxError = errorOf(() => computeFor(compiledRoot, {}));
      const insideError = errorOf(() => computeFor(compiledRoot, { box: { value: 1 } }));
      const afterError = errorOf(() =>
        computeFor(compiledRoot, { box: { value: 1 }, first: { value: 1 } }),
      );

      expect(boxError?.message).toContain('$form.box.value');
      expect(insideError?.message).toContain('$form.first.value');
      expect(afterError?.message).toContain('$form.second.value');
    });

    it('comes from a field before a prop, and from a prop before the props after it', () => {
      const compiledRoot = compile({
        form: [
          textInput('name', 'name', {
            label: '{{ $form.label.value }}',
            props: { first: '{{ $form.first.value }}', second: '{{ $form.second.value }}' },
          }),
        ],
      });

      const labelError = errorOf(() => computeFor(compiledRoot, {}));
      const firstError = errorOf(() => computeFor(compiledRoot, { label: { value: 1 } }));

      expect(labelError?.message).toContain('$form.label.value');
      expect(firstError?.message).toContain('$form.first.value');
    });
  });

  describe('a form without instances', () => {
    it('returns the tree as it is when it has no root', () => {
      const compiledRoot = compile({ form: [heading('title')] });
      const tree = emptyWidgetInstanceTree();

      expect(computeTree(tree, compiledRoot, {})).toBe(tree);
    });

    it('returns the tree as it is when the form has no compiled root', () => {
      const tree = instancesWithFlags(compile({ form: [heading('title')] }), {});

      expect(computeTree(tree, undefined, {})).toBe(tree);
    });
  });
});
