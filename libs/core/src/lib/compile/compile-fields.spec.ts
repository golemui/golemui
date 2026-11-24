import { describe, expect, it } from 'vitest';
import { formDefDecoder } from '../form';
import { ExpressionRejectedError } from '../utils/justin';
import { compileForm } from './compile-form';
import {
  type CompiledCandidate,
  type CompiledField,
  type CompiledForm,
  type CompiledValue,
  type CompiledWidget,
} from './compiled-form';

/**
 * The compiled fields of a widget: the fields of its kind, its props and its events, each with
 * the values that the definition gives it for each state.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/compile/compile-fields.spec.ts
 */

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

type Definition = { states?: Record<string, string>; form: unknown[] };

/** Decodes a definition as `INITIALIZE` does, with the root layout around the widgets. */
const decode = ({ states, form }: Definition) =>
  formDefDecoder.parse({
    states,
    form: { uid: '', kind: 'layout', type: 'grid', children: form },
  });

const compile = (definition: Definition): CompiledForm => compileForm(decode(definition), 'warn');

const allWidgets = (widget: CompiledWidget | undefined): CompiledWidget[] => {
  if (widget === undefined) {
    return [];
  }
  return [
    widget,
    ...widget.children.flatMap(allWidgets),
    ...allWidgets(widget.repeater?.rowLayout),
  ];
};

const widgetOf = (compiled: CompiledForm, uid: string): CompiledWidget => {
  const widget = allWidgets(compiled.root).find((candidate) => candidate.source.uid === uid);
  if (widget === undefined) {
    throw new Error(`The compiled form has no widget with the uid ${uid}`);
  }
  return widget;
};

const fieldOf = <Field extends CompiledField>(fields: Field[], key: string): Field => {
  const field = fields.find((candidate) => candidate.key === key);
  if (field === undefined) {
    throw new Error(`No compiled field has the key ${key}`);
  }
  return field;
};

/** The value of a field for the key without a state suffix. */
const baseValueOf = (fields: CompiledField[], key: string): CompiledValue => {
  const candidates = fieldOf(fields, key).candidates;
  return candidates[candidates.length - 1].value;
};

const statesOf = (field: CompiledField): (string | undefined)[] =>
  field.candidates.map((candidate: CompiledCandidate) => candidate.state);

const keysOf = (fields: CompiledField[]): string[] => fields.map((field) => field.key);

const heading = (props: unknown, more: Record<string, unknown> = {}) => ({
  uid: 'title',
  kind: 'display',
  type: 'heading',
  props,
  ...more,
});

const textInput = (more: Record<string, unknown> = {}) => ({
  uid: 'name',
  kind: 'input',
  type: 'textinput',
  path: 'name',
  ...more,
});

/** The compiled props of a heading with these props. */
const propFieldsOf = (props: unknown, states?: Record<string, string>) =>
  widgetOf(compile({ states, form: [heading(props)] }), 'title').propFields;

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('the compiled fields of a widget', () => {
  describe('the fields of each kind', () => {
    it.each([
      ['display', { uid: 'w', kind: 'display', type: 'heading' }, ['size', 'include', 'exclude']],
      [
        'action',
        { uid: 'w', kind: 'action', type: 'button' },
        ['size', 'include', 'exclude', 'label', 'disabled', 'actionType'],
      ],
      [
        'input',
        { uid: 'w', kind: 'input', type: 'textinput', path: 'w' },
        [
          'size',
          'include',
          'exclude',
          'label',
          'disabled',
          'readonly',
          'validator',
          'path',
          'defaultValue',
        ],
      ],
      [
        'layout',
        { uid: 'w', kind: 'layout', type: 'grid', children: [] },
        ['size', 'include', 'exclude'],
      ],
    ])('has every field of a %s widget, also the ones that are not set', (_kind, widget, keys) => {
      const compiled = widgetOf(compile({ form: [widget] }), 'w');

      expect(keysOf(compiled.coreFields)).toEqual(keys);
      expect(baseValueOf(compiled.coreFields, 'size')).toEqual({
        kind: 'constant',
        value: undefined,
      });
    });

    it('takes the path of an input from the row of the input, not from the definition', () => {
      const compiled = widgetOf(compile({ form: [textInput()] }), 'name');

      expect(fieldOf(compiled.coreFields, 'path').candidates).toEqual([
        { state: undefined, value: { kind: 'path' } },
      ]);
    });

    it('keeps a default value with braces as it is', () => {
      const compiled = widgetOf(
        compile({ form: [textInput({ defaultValue: '{{ $form.other }}' })] }),
        'name',
      );

      expect(baseValueOf(compiled.coreFields, 'defaultValue')).toEqual({
        kind: 'constant',
        value: '{{ $form.other }}',
      });
    });

    it('keeps a validator object as the object of the definition', () => {
      const validator = { required: true, key: 5 };
      const compiled = widgetOf(compile({ form: [textInput({ validator })] }), 'name');

      const value = baseValueOf(compiled.coreFields, 'validator');
      expect(value.kind).toBe('constant');
      expect(value.kind === 'constant' && value.value).toBe(validator);
    });

    it('reads a validator with a text key as a translation config', () => {
      const compiled = widgetOf(
        compile({ form: [textInput({ validator: { key: 'rules.name' } })] }),
        'name',
      );

      expect(baseValueOf(compiled.coreFields, 'validator').kind).toBe('translation');
    });

    it('reads the flag of the condition for a disabled or readonly rule with when', () => {
      const compiled = widgetOf(
        compile({
          form: [
            textInput({ disabled: { when: '$form.locked' }, readonly: { when: '$form.sent' } }),
          ],
        }),
        'name',
      );

      expect(baseValueOf(compiled.coreFields, 'disabled')).toEqual({
        kind: 'flag',
        flag: 'disabled',
      });
      expect(baseValueOf(compiled.coreFields, 'readonly')).toEqual({
        kind: 'flag',
        flag: 'readonly',
      });
    });

    it('keeps a boolean disabled or readonly as a value', () => {
      const compiled = widgetOf(
        compile({ form: [textInput({ disabled: true, readonly: false })] }),
        'name',
      );

      expect(baseValueOf(compiled.coreFields, 'disabled')).toEqual({
        kind: 'constant',
        value: true,
      });
      expect(baseValueOf(compiled.coreFields, 'readonly')).toEqual({
        kind: 'constant',
        value: false,
      });
    });
  });

  describe('texts and translations', () => {
    it('keeps a text without braces as it is', () => {
      const compiled = widgetOf(compile({ form: [textInput({ label: 'Name' })] }), 'name');

      expect(baseValueOf(compiled.coreFields, 'label')).toEqual({
        kind: 'constant',
        value: 'Name',
      });
    });

    it('splits a text into its texts and its expressions, each expression without spaces around it', () => {
      const compiled = widgetOf(
        compile({ form: [textInput({ label: 'Hi {{ $form.first }}, {{$form.last}}!' })] }),
        'name',
      );

      const value = baseValueOf(compiled.coreFields, 'label');
      const parts = value.kind === 'interpolation' ? value.parts : [];
      expect(
        parts.map((part) => (typeof part === 'string' ? part : { source: part.source })),
      ).toEqual(['Hi ', { source: '$form.first' }, ', ', { source: '$form.last' }, '!']);
      const [, first] = parts;
      expect(typeof first !== 'string' && first.evaluate({ $form: { first: 'Ada' } })).toBe('Ada');
    });

    it.each(['{{}}', 'a {{ b', '{{ $fn.f({ a: 1 }).a }}'])(
      'keeps the text %s as it is, because it has no complete expression',
      (text) => {
        expect(baseValueOf(propFieldsOf({ text }), 'text')).toEqual({
          kind: 'constant',
          value: text,
        });
      },
    );

    it('keeps the error of a rejected expression in a text', () => {
      const value = baseValueOf(propFieldsOf({ text: 'Tags: {{ $form.tags.pop() }}' }), 'text');

      const expression = value.kind === 'interpolation' ? value.parts[1] : undefined;
      expect(typeof expression === 'object' && expression.failure).toBeInstanceOf(
        ExpressionRejectedError,
      );
    });

    it('compiles a translation config with its params', () => {
      const label = {
        key: 'greeting',
        default: 'Hello',
        params: { name: '$form.name', count: 3, style: '$5.00', other: '$formatted' },
      };
      const compiled = widgetOf(compile({ form: [textInput({ label })] }), 'name');

      const value = baseValueOf(compiled.coreFields, 'label');
      expect(value.kind).toBe('translation');
      const translation = value.kind === 'translation' ? value : undefined;
      expect(translation?.config).toEqual(label);
      expect(
        translation?.params?.map((param) =>
          'expression' in param ? { name: param.name, source: param.expression.source } : param,
        ),
      ).toEqual([
        { name: 'name', source: '$form.name' },
        { name: 'count', value: 3 },
        { name: 'style', value: '$5.00' },
        // A text that starts with a scope name is an expression.
        { name: 'other', source: '$formatted' },
      ]);
    });

    it('compiles no params for a translation config without params', () => {
      const compiled = widgetOf(
        compile({ form: [textInput({ label: { key: 'greeting' } })] }),
        'name',
      );

      const value = baseValueOf(compiled.coreFields, 'label');
      expect(value.kind === 'translation' && value.params).toBeUndefined();
    });
  });

  describe('state suffixes', () => {
    const states = { on: 'true', longer: 'true', b: 'true', a: 'true' };

    it('lists the value of each declared state, the longest state name first, and then the value without a suffix', () => {
      const compiled = widgetOf(
        compile({
          states,
          form: [
            textInput({
              label: 'base',
              'label.a': 'A',
              'label.on': 'ON',
              'label.b': 'B',
              'label.longer': 'LONGER',
            }),
          ],
        }),
        'name',
      );

      // `b` is declared before `a`, so it comes first among the names of one length.
      expect(statesOf(fieldOf(compiled.coreFields, 'label'))).toEqual([
        'longer',
        'on',
        'b',
        'a',
        undefined,
      ]);
      expect(fieldOf(compiled.coreFields, 'label').candidates[0].value).toEqual({
        kind: 'constant',
        value: 'LONGER',
      });
    });

    it('has no value for a suffix with a state that is not declared', () => {
      const fields = propFieldsOf({ text: 'base', 'text.unknown': 'never' }, states);

      expect(statesOf(fieldOf(fields, 'text'))).toEqual([undefined]);
    });

    it('has a value for a suffixed null, and none for a suffixed undefined', () => {
      const fields = propFieldsOf({ text: 'base', 'text.a': null, 'text.b': undefined }, states);

      expect(fieldOf(fields, 'text').candidates).toEqual([
        { state: 'a', value: { kind: 'constant', value: null } },
        { state: undefined, value: { kind: 'constant', value: 'base' } },
      ]);
    });

    it('has the value undefined without a suffix for a prop that only suffixed keys set', () => {
      const fields = propFieldsOf({ 'text.a': 'A' }, states);

      expect(fieldOf(fields, 'text').candidates).toEqual([
        { state: 'a', value: { kind: 'constant', value: 'A' } },
        { state: undefined, value: { kind: 'constant', value: undefined } },
      ]);
    });

    it('gives a key that starts with a dot an empty name', () => {
      const fields = propFieldsOf({ '.a': 'A' }, states);

      expect(fields.map((field) => [field.key, field.candidates])).toEqual([
        [
          '',
          [
            { state: 'a', value: { kind: 'constant', value: 'A' } },
            { state: undefined, value: { kind: 'constant', value: undefined } },
          ],
        ],
      ]);
    });

    it('reads the flag of the condition without a suffix for a suffixed when rule', () => {
      const compiled = widgetOf(
        compile({
          states,
          form: [textInput({ disabled: false, 'disabled.a': { when: '$form.x' } })],
        }),
        'name',
      );

      expect(fieldOf(compiled.coreFields, 'disabled').candidates).toEqual([
        { state: 'a', value: { kind: 'flag', flag: 'disabled' } },
        { state: undefined, value: { kind: 'constant', value: false } },
      ]);
      // Only the rule without a suffix is a condition.
      expect(compiled.conditions).toEqual({});
    });
  });

  describe('the props', () => {
    it('has one field for each prop name, in the order of the definition', () => {
      const fields = propFieldsOf(
        { text: 'a', 'text.on': 'b', level: 2, 'level.on': 3, 'hint.on': 'c' },
        { on: 'true' },
      );

      expect(keysOf(fields)).toEqual(['text', 'level', 'hint']);
    });

    it('has no prop field for a widget without props', () => {
      expect(propFieldsOf(undefined)).toEqual([]);
    });

    it('keeps an array or an object without a translation config as the object of the definition', () => {
      const options = [{ key: 'a', label: 'A' }, { value: 2 }];
      const fields = propFieldsOf({ options });

      const value = baseValueOf(fields, 'options');
      expect(value.kind).toBe('constant');
      expect(value.kind === 'constant' && value.value).toBe(options);
    });

    it('finds the translation configs inside the arrays and the objects of a prop', () => {
      const sections = [
        { id: 'one', title: { key: 'sections.one' } },
        { id: 'two', title: 'Two' },
        { id: 'three', items: [{ key: 'sections.three.item', params: { n: '$form.n' } }] },
      ];
      const fields = propFieldsOf({ sections });

      const value = baseValueOf(fields, 'sections');
      expect(value).toMatchObject({
        kind: 'nested',
        entries: [
          {
            key: 0,
            value: { kind: 'nested', entries: [{ key: 'title', value: { kind: 'translation' } }] },
          },
          {
            key: 2,
            value: {
              kind: 'nested',
              entries: [
                {
                  key: 'items',
                  value: { kind: 'nested', entries: [{ key: 0, value: { kind: 'translation' } }] },
                },
              ],
            },
          },
        ],
      });
      expect(value.kind === 'nested' && value.source).toBe(sections);
      expect(
        value.kind === 'nested' &&
          value.entries[0].value.kind === 'nested' &&
          value.entries[0].value.source,
      ).toBe(sections[0]);
    });

    it.each([
      ['a key that is no text', { key: 5 }],
      ['another key next to key, params and default', { key: 'a', label: 'A' }],
      ['a default that is no text', { key: 'a', default: 5 }],
      ['params that are no object', { key: 'a', params: ['x'] }],
    ])('does not read an object inside a prop with %s as a translation config', (_case, item) => {
      const items = [item];

      expect(baseValueOf(propFieldsOf({ items }), 'items')).toEqual({
        kind: 'constant',
        value: items,
      });
    });

    it('reads an object with a text key as a translation config at the first level of a prop', () => {
      const fields = propFieldsOf({ option: { key: 'es', label: 'Spanish' } });

      expect(baseValueOf(fields, 'option').kind).toBe('translation');
    });

    it('does not search the params of a translation config for more translation configs', () => {
      const fields = propFieldsOf({
        text: { key: 'greeting', params: { name: { key: 'names.ada' } } },
      });

      const value = baseValueOf(fields, 'text');
      expect(value.kind).toBe('translation');
      expect(value.kind === 'translation' && value.params).toEqual([
        { name: 'name', value: { key: 'names.ada' } },
      ]);
    });

    it('does not compile a text with braces inside an array of a prop', () => {
      const items = ['{{ $form.a }}'];

      expect(baseValueOf(propFieldsOf({ items }), 'items')).toEqual({
        kind: 'constant',
        value: items,
      });
    });

    it('keeps the error of an empty place of an array, after the entries before the place', () => {
      // eslint-disable-next-line no-sparse-arrays
      const fields = propFieldsOf({ items: [{ key: 'a' }, , { key: 'c' }] });

      const value = baseValueOf(fields, 'items');
      const entries = value.kind === 'nested' ? value.entries : [];
      expect(entries.map((entry) => [entry.key, entry.value.kind])).toEqual([
        [0, 'translation'],
        [1, 'failure'],
      ]);
      const [, emptyPlace] = entries;
      expect(emptyPlace.value.kind === 'failure' && emptyPlace.value.error).toBeInstanceOf(
        TypeError,
      );
    });

    it('keeps the error of a prop whose read throws, for the key without a suffix and for a suffixed key', () => {
      const props = {
        get text(): string {
          throw new Error('no text');
        },
        get 'text.a'(): string {
          throw new Error('no text for a');
        },
        hint: 'still compiled',
      };
      const widget = { uid: 'title', kind: 'display', type: 'heading', props };
      const decoded = decode({ states: { a: 'true' }, form: [] });
      // The decoder reads every prop one time, so the widget gets these props after the decode.
      decoded.form.children.push(widget as never);

      const fields = widgetOf(compileForm(decoded, 'warn'), 'title').propFields;

      expect(fieldOf(fields, 'text').candidates).toEqual([
        { state: 'a', value: { kind: 'failure', error: new Error('no text for a') } },
        { state: undefined, value: { kind: 'failure', error: new Error('no text') } },
      ]);
      expect(baseValueOf(fields, 'hint')).toEqual({ kind: 'constant', value: 'still compiled' });
    });

    it('reads only the keys that the props have, so props that refuse another key compile', () => {
      const props = new Proxy(
        { text: 'Hello' },
        {
          get(target: Record<string, unknown>, key: string): unknown {
            if (!(key in target)) {
              throw new Error(`unknown prop ${key}`);
            }
            return target[key];
          },
        },
      );
      const widget = { uid: 'title', kind: 'display', type: 'heading', props };
      const decoded = decode({ states: { a: 'true', b: 'true' }, form: [] });
      decoded.form.children.push(widget as never);

      const fields = widgetOf(compileForm(decoded, 'warn'), 'title').propFields;

      expect(fieldOf(fields, 'text').candidates).toEqual([
        { state: undefined, value: { kind: 'constant', value: 'Hello' } },
      ]);
    });

    it('compiles one time an array that two props use', () => {
      const options = [{ label: { key: 'options.first' } }];
      const compiled = compile({
        form: [
          { uid: 'first', kind: 'display', type: 'heading', props: { options } },
          { uid: 'second', kind: 'display', type: 'heading', props: { options } },
        ],
      });

      const first = baseValueOf(widgetOf(compiled, 'first').propFields, 'options');
      const second = baseValueOf(widgetOf(compiled, 'second').propFields, 'options');

      expect(first.kind).toBe('nested');
      expect(second).toBe(first);
    });

    it.each([
      ['with a translation config', { key: 'leaf' }, 'nested'],
      ['without a translation config', { value: 'leaf' }, 'constant'],
    ])(
      'compiles in a short time a value whose objects are used many times, %s',
      (_case, leaf, kind) => {
        // 40 levels. Each level uses the level below it two times, so a search that visits
        // each use of an object would visit the leaf 2 to the power of 40 times.
        let node: Record<string, unknown> = { leaf };
        for (let level = 0; level < 40; level++) {
          node = { yes: node, no: node };
        }

        const value = baseValueOf(propFieldsOf({ tree: node }), 'tree');

        expect(value.kind).toBe(kind);
      },
    );

    it.each(['__proto__', 'constructor', 'prototype'])(
      'keeps an error for a prop with the name %s',
      (name) => {
        const props = JSON.parse(`{ "${name}": "x", "text": "ok" }`) as unknown;

        const fields = propFieldsOf(props);

        expect(fieldOf(fields, name).nameError).toEqual(
          new Error(
            `Path "props.${name}" has the segment "${name}". A path cannot contain the segments __proto__, constructor or prototype.`,
          ),
        );
        expect(fieldOf(fields, 'text').nameError).toBeUndefined();
      },
    );

    it('has one field for each entry of props that are an array', () => {
      const fields = propFieldsOf(['a', 'b']);

      expect(keysOf(fields)).toEqual(['0', '1']);
      expect(baseValueOf(fields, '1')).toEqual({ kind: 'constant', value: 'b' });
    });

    it('does not search the row template of a repeater, and searches a prop template of another type', () => {
      const template = {
        uid: 'row',
        kind: 'layout',
        type: 'grid',
        children: [
          {
            uid: 'name',
            kind: 'input',
            type: 'textinput',
            path: 'users.items.name',
            label: { key: 'name' },
          },
        ],
      };
      const compiled = compile({
        form: [
          {
            uid: 'users',
            kind: 'input',
            type: 'repeater',
            path: 'users',
            props: { template, title: [{ key: 'users.title' }] },
          },
          heading({ template: [{ key: 'heading.template' }] }),
        ],
      });

      const users = widgetOf(compiled, 'users');
      const rowTemplate = fieldOf(users.propFields, 'template');
      expect(users.propFields.map((field) => [field.key, field.translatesNestedConfigs])).toEqual([
        ['template', false],
        ['title', true],
      ]);
      expect(rowTemplate.candidates[0].value.kind).toBe('constant');
      expect(baseValueOf(users.propFields, 'title').kind).toBe('nested');
      expect(baseValueOf(widgetOf(compiled, 'title').propFields, 'template').kind).toBe('nested');
    });
  });

  describe('the events', () => {
    it('has the five events of an action in the order of the decoder, with the suffixed names', () => {
      const compiled = widgetOf(
        compile({
          states: { edit: 'true' },
          form: [
            {
              uid: 'save',
              kind: 'action',
              type: 'button',
              on: { click: 'save{{ $form.mode }}', 'click.edit': 'update' },
            },
          ],
        }),
        'save',
      );

      expect(keysOf(compiled.onFields)).toEqual(['load', 'click', 'change', 'filter', 'blur']);
      // An event name is never a text with expressions.
      expect(fieldOf(compiled.onFields, 'click').candidates).toEqual([
        { state: 'edit', value: { kind: 'constant', value: 'update' } },
        { state: undefined, value: { kind: 'constant', value: 'save{{ $form.mode }}' } },
      ]);
      expect(baseValueOf(compiled.onFields, 'load')).toEqual({
        kind: 'constant',
        value: undefined,
      });
    });

    it('has no event field for an action without on', () => {
      const compiled = widgetOf(
        compile({ form: [{ uid: 'save', kind: 'action', type: 'button' }] }),
        'save',
      );

      expect(compiled.onFields).toEqual([]);
    });

    it.each(['display', 'layout'])('has no event field for a %s widget', (kind) => {
      const compiled = widgetOf(
        compile({ form: [{ uid: 'w', kind, type: 'x', children: [], on: { click: 'go' } }] }),
        'w',
      );

      expect(compiled.onFields).toEqual([]);
    });
  });
});
