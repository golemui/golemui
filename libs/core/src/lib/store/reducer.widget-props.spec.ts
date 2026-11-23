import { type StandardSchemaV1 } from '@standard-schema/spec';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type ValidatorFn } from '../form-validator';
import {
  type ActionWidget,
  type DisplayWidget,
  type InputWidget,
  type LayoutWidget,
} from '../form-widget';
import { type I18nParams, type I18nTranslator, type TranslationKey } from '../i18n';
import { type ExpressionFunctions } from '../shared';
import { type Action } from './actions';
import { createInitialState, type State } from './model';
import { reducer } from './reducer';

/**
 * The computed widgets of a form, checked through the reducer: each test sends `INITIALIZE` and
 * `SET_DATA`, sometimes more actions, and reads `calculatedWidgets` and the form health of the
 * state that results.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/store/reducer.widget-props.spec.ts
 */

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

type RecordedCall = { key: TranslationKey; params?: I18nParams; defaultValue?: string };

const makeTranslator = (
  translate: (key: TranslationKey, params?: I18nParams, d?: string) => string = (k, _p, d) =>
    d ?? k,
): I18nTranslator & { calls: RecordedCall[] } => {
  const calls: RecordedCall[] = [];
  const translator = {
    get lang() {
      return 'en-US';
    },
    translate(key: TranslationKey, params?: I18nParams, defaultValue?: string): string {
      calls.push({ key, params, defaultValue });
      return translate(key, params, defaultValue);
    },
    subscribe(): () => void {
      return () => undefined;
    },
    calls,
  };
  return translator;
};

/** Only `required` is supported: an empty value gives the message `required`. */
const validators: ValidatorFn<{ required?: boolean }> = (validator): StandardSchemaV1 => ({
  '~standard': {
    version: 1,
    vendor: 'reducer-spec',
    validate: (value: unknown) => {
      const isEmpty = value === undefined || value === null || value === '';
      if (validator?.required && isEmpty) {
        return { issues: [{ message: 'required' }] };
      }
      return { value };
    },
  },
});

const makeReducer = (
  translator: I18nTranslator = makeTranslator(),
  functions: ExpressionFunctions = {},
) =>
  reducer({
    validators: validators as ValidatorFn<any>,
    validateOn: 'eager',
    localization: translator,
    functions,
  });

const setData = (data: Record<string, any>): Action => ({
  type: 'SET_DATA',
  payload: { data },
});

const setMeta = (meta: Record<string, any>): Action => ({
  type: 'SET_META',
  payload: { meta },
});

const overrideProp = (uid: string, prop: string, value: unknown): Action => ({
  type: 'OVERRIDE_WIDGET_PROP',
  payload: { uid, prop, value },
});

const validateAllAction: Action = { type: 'VALIDATE_ALL' };

type Scenario = {
  /** The widgets of the form. */
  form: Record<string, unknown>[];
  states?: Record<string, string>;
  data?: Record<string, any>;
};

/**
 * Sends `INITIALIZE` and `SET_DATA` to a new reducer.
 *
 * @returns The state after the first derive, and the reducer for a test that sends more actions.
 */
const start = (
  { form, states, data = {} }: Scenario,
  translator?: I18nTranslator,
  functions?: ExpressionFunctions,
) => {
  const reduce = makeReducer(translator, functions);
  const actions: Action[] = [
    {
      type: 'INITIALIZE',
      payload: { formName: 'test-form', formDef: states ? { states, form } : { form } },
    },
    setData(data),
  ];
  return { state: actions.reduce(reduce, createInitialState('en-US')), reduce };
};

/** Sends `INITIALIZE` and `SET_DATA` to a new reducer and returns the state after the derive. */
const run = (
  scenario: Scenario,
  translator?: I18nTranslator,
  functions?: ExpressionFunctions,
): State => start(scenario, translator, functions).state;

/** A repeater whose row layout has the uid `<uid>-template`. */
const repeater = (uid: string, path: string, children: unknown[]) => ({
  kind: 'input',
  uid,
  type: 'repeater',
  path,
  props: {
    template: {
      kind: 'layout',
      uid: `${uid}-template`,
      type: 'flex',
      children,
    },
  },
});

/** A required input with no value. After `VALIDATE_ALL` it is a visible input with an error. */
const requiredInput = (path: string) => ({
  kind: 'input',
  uid: path,
  type: 'textinput',
  path,
  validator: { required: true },
});

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('reducer: widget props', () => {
  // ---------------------------------------------------------------------------
  // Per-kind core fields
  // ---------------------------------------------------------------------------

  describe('per-kind core fields', () => {
    it('DisplayWidget: copies uid, type, kind, size, include, exclude', () => {
      const source = {
        kind: 'display',
        uid: 'd1',
        type: 'heading',
        size: 2,
        include: { in: ['foo'] },
        exclude: { from: ['bar'] },
      } satisfies DisplayWidget<string>;

      const next = run({ states: { foo: 'true', bar: 'false' }, form: [source] });
      const current = next.calculatedWidgets['d1'].current as DisplayWidget<string>;

      expect(current.kind).toBe('display');
      expect(current.uid).toBe('d1');
      expect(current.type).toBe('heading');
      expect(current.size).toBe(2);
      expect(current.include).toEqual({ in: ['foo'] });
      expect(current.exclude).toEqual({ from: ['bar'] });
    });

    it('ActionWidget: copies core + label + disabled', () => {
      const source = {
        kind: 'action',
        uid: 'a1',
        type: 'button',
        size: 1,
        label: 'Submit',
        disabled: false,
      } satisfies ActionWidget<string>;

      const next = run({ form: [source] });
      const current = next.calculatedWidgets['a1'].current as ActionWidget<string>;

      expect(current.kind).toBe('action');
      expect(current.uid).toBe('a1');
      expect(current.type).toBe('button');
      expect(current.size).toBe(1);
      expect(current.label).toBe('Submit');
      expect(current.disabled).toBe(false);
    });

    it('InputWidget: copies core + label + disabled + readonly + validator + path + defaultValue', () => {
      const validator = { required: true };
      const source = {
        kind: 'input',
        uid: 'i1',
        type: 'textinput',
        path: 'user.name',
        size: 1,
        label: 'Name',
        disabled: false,
        readonly: false,
        defaultValue: 'initial',
        validator,
      } satisfies InputWidget<any, string>;

      const next = run({ form: [source] });
      const current = next.calculatedWidgets['i1'].current as InputWidget<any, string>;

      expect(current.kind).toBe('input');
      expect(current.uid).toBe('i1');
      expect(current.type).toBe('textinput');
      expect(current.path).toBe('user.name');
      expect(current.size).toBe(1);
      expect(current.label).toBe('Name');
      expect(current.disabled).toBe(false);
      expect(current.readonly).toBe(false);
      expect(current.defaultValue).toBe('initial');
      expect(current.validator).toBe(validator);
    });

    it('InputWidget: preserves defaultValue string without applying string interpolation', () => {
      const source = {
        kind: 'input',
        uid: 'i2',
        type: 'textinput',
        path: 'name',
        defaultValue: '{{$form.other}}',
      } satisfies InputWidget<any, string>;

      const next = run({ form: [source] });
      const current = next.calculatedWidgets['i2'].current as InputWidget<any, string>;

      expect(current.defaultValue).toBe('{{$form.other}}');
    });

    it('LayoutWidget: copies core + children (excluding `on`)', () => {
      const child = { kind: 'display', uid: 'c', type: 'heading' } satisfies DisplayWidget<string>;
      const source = {
        kind: 'layout',
        uid: 'l1',
        type: 'flex',
        size: 1,
        children: [child],
      } satisfies LayoutWidget<string>;

      const next = run({ form: [source] });
      const current = next.calculatedWidgets['l1'].current as LayoutWidget<string>;

      expect(current.kind).toBe('layout');
      expect(current.uid).toBe('l1');
      expect(current.type).toBe('flex');
      expect(current.size).toBe(1);
      expect(current.children).toEqual([child]);
    });
  });

  // ---------------------------------------------------------------------------
  // Suffix resolution
  // ---------------------------------------------------------------------------

  describe('state suffix resolution', () => {
    const baseSource = () =>
      ({
        kind: 'action',
        uid: 'a',
        type: 'button',
        label: 'BASE',
        'label.register': 'REGISTER',
        'label.register:adult': 'REGISTER_ADULT',
      }) satisfies ActionWidget<string>;

    it('no matching state -> uses base', () => {
      const next = run({
        states: { register: 'false', 'register:adult': 'false' },
        form: [baseSource()],
      });

      expect(next.currentStates).toEqual([]);
      expect((next.calculatedWidgets['a'].current as ActionWidget<string>).label).toBe('BASE');
    });

    it('one matching state -> uses that state suffix', () => {
      const next = run({
        states: { register: 'true', 'register:adult': 'false' },
        form: [baseSource()],
      });

      expect(next.currentStates).toEqual(['register']);
      expect((next.calculatedWidgets['a'].current as ActionWidget<string>).label).toBe('REGISTER');
    });

    it('non-matching state -> falls back to base', () => {
      const next = run({
        states: { unknown: 'true', register: 'false', 'register:adult': 'false' },
        form: [baseSource()],
      });

      expect(next.currentStates).toEqual(['unknown']);
      expect((next.calculatedWidgets['a'].current as ActionWidget<string>).label).toBe('BASE');
    });

    it('longest matching state wins (sort by length DESC)', () => {
      const next = run({
        states: { register: 'true', 'register:adult': 'true' },
        form: [baseSource()],
      });

      expect(next.currentStates).toEqual(['register', 'register:adult']);
      expect((next.calculatedWidgets['a'].current as ActionWidget<string>).label).toBe(
        'REGISTER_ADULT',
      );
    });

    it('longest wins regardless of input order', () => {
      const next = run({
        states: { 'register:adult': 'true', register: 'true' },
        form: [baseSource()],
      });

      expect(next.currentStates).toEqual(['register:adult', 'register']);
      expect((next.calculatedWidgets['a'].current as ActionWidget<string>).label).toBe(
        'REGISTER_ADULT',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // hasWhen for disabled / readonly
  // ---------------------------------------------------------------------------

  describe('hasWhen', () => {
    it('disabled: { when } uses pre-computed widgetFlags[uid].disabled', () => {
      const isTrue = vi.fn((value: unknown) => value === true);
      const source = {
        kind: 'input',
        uid: 'i',
        type: 'textinput',
        path: 'x',
        disabled: { when: '$fn.isTrue($form.x)' },
      } satisfies InputWidget<any, string>;

      const next = run({ form: [source], data: { x: true } }, makeTranslator(), { isTrue });

      expect(next.widgetFlags['i']).toEqual({ disabled: true });
      expect((next.calculatedWidgets['i'].current as InputWidget<any, string>).disabled).toBe(true);
      // The one call is the evaluation that gives the flag. The computed widget reads the flag.
      expect(isTrue).toHaveBeenCalledTimes(1);
    });

    it('readonly: { when } uses pre-computed widgetFlags[uid].readonly', () => {
      const isTrue = vi.fn((value: unknown) => value === true);
      const source = {
        kind: 'input',
        uid: 'i',
        type: 'textinput',
        path: 'x',
        readonly: { when: '$fn.isTrue($form.x)' },
      } satisfies InputWidget<any, string>;

      const next = run({ form: [source], data: { x: true } }, makeTranslator(), { isTrue });

      expect(next.widgetFlags['i']).toEqual({ readonly: true });
      expect((next.calculatedWidgets['i'].current as InputWidget<any, string>).readonly).toBe(true);
      // The one call is the evaluation that gives the flag. The computed widget reads the flag.
      expect(isTrue).toHaveBeenCalledTimes(1);
    });

    it('{ when } on a non-disabled/readonly prop passes through unchanged (parity quirk)', () => {
      const whenObj = { when: '$form.x' };
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { foo: whenObj },
      } satisfies DisplayWidget<string>;

      const next = run({ form: [source] });

      expect((next.calculatedWidgets['d'].current as DisplayWidget<string>).props?.['foo']).toBe(
        whenObj,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // TranslationConfig
  // ---------------------------------------------------------------------------

  describe('nested translation configs', () => {
    const accordion = (sections: unknown, extra: Record<string, unknown> = {}) => ({
      kind: 'layout',
      uid: 'acc',
      type: 'accordion',
      props: { sections, ...extra },
      children: [],
    });
    const propsOf = (next: State, uid = 'acc') =>
      (next.calculatedWidgets[uid].current as LayoutWidget<string>).props as Record<string, any>;

    it('translates a config nested in an array of objects and keeps the other fields', () => {
      const translator = makeTranslator((key) => `T:${key}`);

      const next = run(
        {
          form: [
            accordion([
              { uid: 'billing', label: { key: 'sections.billing' } },
              { uid: 'notes', label: 'Notes' },
            ]),
          ],
        },
        translator,
      );

      expect(propsOf(next)['sections']).toEqual([
        { uid: 'billing', label: 'T:sections.billing' },
        { uid: 'notes', label: 'Notes' },
      ]);
    });

    it('translates at any depth, with the default and params resolved like a top-level config', () => {
      const translator = makeTranslator((key, params, d) =>
        key === 'greet' ? `Hi ${params?.['name']}` : (d ?? key),
      );

      const props = propsOf(
        run(
          {
            form: [
              accordion([], {
                menu: {
                  groups: [
                    { items: [{ label: { key: 'greet', params: { name: '$form.name' } } }] },
                  ],
                },
                empty: { key: 'missing', default: 'Nothing here' },
              }),
            ],
            data: { name: 'Ana' },
          },
          translator,
        ),
      );

      expect(props['menu'].groups[0].items[0].label).toBe('Hi Ana');
      expect(props['empty']).toBe('Nothing here');
    });

    it('resolves the params of a nested config against the repeater row', () => {
      const translator = makeTranslator((_key, params) => `Row ${params?.['n']}`);

      const next = run(
        {
          form: [
            repeater('rows', 'rows', [
              accordion([{ uid: 's', label: { key: 'row', params: { n: '$index + 1' } } }]),
            ]),
          ],
          data: { rows: [{}, {}] },
        },
        translator,
      );

      expect(propsOf(next, 'acc[1]')['sections'][0].label).toBe('Row 2');
    });

    it('leaves an object that has a key and other fields alone: it is data, not a config', () => {
      const translator = makeTranslator((key) => `T:${key}`);
      const options = [
        { key: 'es', label: 'Spanish' },
        { key: 'fr', value: 2 },
      ];

      const props = propsOf(run({ form: [accordion([], { options })] }, translator));

      expect(props['options']).toBe(options);
      expect(translator.calls).toHaveLength(0);
    });

    it('does not interpolate nested strings', () => {
      const next = run({ form: [accordion([{ uid: 's', label: '{{ $index }}' }])] });

      expect(propsOf(next)['sections'][0].label).toBe('{{ $index }}');
    });

    it('keeps the source reference when nothing nested is a config', () => {
      const sections = [{ uid: 's', label: 'Plain' }];

      const next = run({ form: [accordion(sections)] });

      expect(propsOf(next)['sections']).toBe(sections);
    });

    it('keeps the previous widget when a later pass translates to the same text', () => {
      const translator = makeTranslator();
      const { state: first, reduce } = start(
        { form: [accordion([{ uid: 's', label: { key: 'k' } }])] },
        translator,
      );
      expect(translator.calls).toHaveLength(1);

      const second = reduce(first, setData({}));

      // The second derive translates again, and the text is the same.
      expect(second.formHealth).toEqual({ status: 'ok' });
      expect(translator.calls).toHaveLength(2);
      expect(second.calculatedWidgets['acc']).toBe(first.calculatedWidgets['acc']);
    });

    it('translates again when the translation changes', () => {
      let lang = 'en';
      const translator = makeTranslator((key) => `${lang}:${key}`);
      const { state: first, reduce } = start(
        { form: [accordion([{ uid: 's', label: { key: 'k' } }])] },
        translator,
      );

      lang = 'es';
      const second = reduce(first, { type: 'SET_LANGUAGE', payload: { lang: 'es' } });
      // A translator can also give new texts while the language tag stays the same.
      lang = 'fr';
      const third = reduce(second, { type: 'SET_LANGUAGE', payload: { lang: second.lang } });

      expect(propsOf(first)['sections'][0].label).toBe('en:k');
      expect(propsOf(second)['sections'][0].label).toBe('es:k');
      expect(propsOf(third)['sections'][0].label).toBe('fr:k');
    });

    it('leaves the repeater template alone: its widgets resolve per row with the row scope', () => {
      const translator = makeTranslator((key) => `T:${key}`);
      const template = {
        uid: 'row',
        kind: 'layout',
        type: 'flex',
        props: {},
        children: [
          {
            uid: 'name',
            kind: 'input',
            type: 'textinput',
            path: 'rows.items.name',
            label: { key: 'row.name', params: { who: '$item.name' } },
          },
        ],
      };

      const next = run(
        {
          form: [
            {
              uid: 'rep',
              kind: 'input',
              type: 'repeater',
              path: 'rows',
              props: { template },
            },
          ],
        },
        translator,
      );

      expect(next.formHealth).toEqual({ status: 'ok' });
      // The decoder makes the template object of the source. The props keep that object.
      expect(propsOf(next, 'rep')['template']).toBe(
        (next.resolvedSources['rep'].props as Record<string, unknown>)['template'],
      );
      expect(propsOf(next, 'rep')['template']).toEqual(template);
      expect(translator.calls).toHaveLength(0);
    });

    it('walks a config-free value once: a config added to it by mutation later is not seen', () => {
      const translator = makeTranslator((key) => `T:${key}`);
      const sections: Record<string, unknown>[] = [{ uid: 'a', label: 'Plain' }];
      const { state: first, reduce } = start({ form: [accordion(sections)] }, translator);

      // The engine assumes the form definition is immutable after INITIALIZE.
      sections.push({ uid: 'b', label: { key: 'k' } });
      const second = reduce(first, setData({}));

      expect(second.formHealth).toEqual({ status: 'ok' });
      expect(translator.calls).toHaveLength(0);
      expect(propsOf(second)['sections']).toBe(sections);
    });

    it('leaves an object alone when its default is not a string or its params is not an object', () => {
      const translator = makeTranslator((key) => `T:${key}`);
      const data = [
        { key: 'a', default: 1 },
        { key: 'b', params: 'x' },
        { key: 'c', params: ['x'] },
      ];

      const props = propsOf(run({ form: [accordion([], { data })] }, translator));

      expect(props['data']).toBe(data);
      expect(translator.calls).toHaveLength(0);
    });
  });

  describe('translation config', () => {
    it('label: TranslationConfig calls translator with key, resolved params, default', () => {
      const translator = makeTranslator((_k, params) => `RESOLVED:${params?.['name']}`);
      const source = {
        kind: 'action',
        uid: 'a',
        type: 'button',
        label: {
          key: 'greet',
          default: 'Hello',
          params: { name: '$form.user.name' },
        },
      } satisfies ActionWidget<string>;

      const next = run({ form: [source], data: { user: { name: 'Alice' } } }, translator);

      expect(translator.calls).toHaveLength(1);
      expect(translator.calls[0].key).toBe('greet');
      expect(translator.calls[0].params).toEqual({ name: 'Alice' });
      expect(translator.calls[0].defaultValue).toBe('Hello');
      expect((next.calculatedWidgets['a'].current as ActionWidget<string>).label).toBe(
        'RESOLVED:Alice',
      );
    });

    it('i18n params: a literal param keeps its type', () => {
      const translator = makeTranslator();
      const source = {
        kind: 'action',
        uid: 'a',
        type: 'button',
        label: {
          key: 'k',
          params: { a: 'literal', n: 42, b: true as any },
        },
      } satisfies ActionWidget<string>;

      run({ form: [source] }, translator);

      expect(translator.calls[0].params).toEqual({ a: 'literal', n: 42, b: true });
    });

    it('i18n params: a value that starts with an unknown root is a literal string', () => {
      const translator = makeTranslator();
      const source = {
        kind: 'action',
        uid: 'a',
        type: 'button',
        label: { key: 'k', params: { id: '$route.id', known: '$form.id' } },
      } satisfies ActionWidget<string>;

      run({ form: [source], data: { id: 7 } }, translator);

      expect(translator.calls[0].params).toEqual({ id: '$route.id', known: 7 });
    });

    it('i18n params: a param named __proto__ is an own property and does not change the prototype', () => {
      const translator = makeTranslator();
      const params = JSON.parse('{"__proto__": "polluted", "a": "literal"}');
      const source = {
        kind: 'action',
        uid: 'a',
        type: 'button',
        label: { key: 'k', params },
      } satisfies ActionWidget<string>;

      run({ form: [source] }, translator);

      const received = translator.calls[0].params as Record<string, unknown>;
      expect(Object.getPrototypeOf(received)).toBeNull();
      expect(Object.getOwnPropertyDescriptor(received, '__proto__')?.value).toBe('polluted');
      expect(received['a']).toBe('literal');
    });

    it('i18n params: a message name that is not a param finds no inherited value', () => {
      const translator = makeTranslator(
        (_key, params) => `Approved on ${params?.['date']} by ${params?.['constructor']}`,
      );
      const source = {
        kind: 'action',
        uid: 'a',
        type: 'button',
        label: { key: 'approval', params: { date: '$form.date' } },
      } satisfies ActionWidget<string>;

      run({ form: [source], data: { date: '2026-01-01' } }, translator);

      expect(translator.calls[0].params?.['constructor']).toBeUndefined();
      expect(translator.calls[0].params?.['date']).toBe('2026-01-01');
    });

    it('i18n params: string concat expression resolves', () => {
      const translator = makeTranslator();
      const source = {
        kind: 'action',
        uid: 'a',
        type: 'button',
        label: { key: 'k', params: { name: "$form.first + ' ' + $form.last" } },
      } satisfies ActionWidget<string>;

      run({ form: [source], data: { first: 'John', last: 'Doe' } }, translator);

      expect(translator.calls[0].params).toEqual({ name: 'John Doe' });
    });

    it('i18n params: arithmetic expression resolves', () => {
      const translator = makeTranslator();
      const source = {
        kind: 'action',
        uid: 'a',
        type: 'button',
        label: { key: 'k', params: { n: '$form.count + 1' } },
      } satisfies ActionWidget<string>;

      run({ form: [source], data: { count: 4 } }, translator);

      expect(translator.calls[0].params).toEqual({ n: 5 });
    });

    it('i18n params: an expression that gives undefined or null passes that value', () => {
      const translator = makeTranslator();
      const source = {
        kind: 'action',
        uid: 'a',
        type: 'button',
        label: { key: 'k', params: { missing: '$form.missing', empty: '$form.middleName' } },
      } satisfies ActionWidget<string>;

      run({ form: [source], data: { middleName: null } }, translator);

      const received = translator.calls[0].params as Record<string, unknown>;
      expect(Object.keys(received)).toEqual(['missing', 'empty']);
      expect(received['missing']).toBeUndefined();
      expect(received['empty']).toBeNull();
    });

    it('i18n params: bad expression sets formHealth to errored', () => {
      const source = {
        kind: 'action',
        uid: 'a',
        type: 'button',
        label: { key: 'k', params: { x: '$form..broken' } },
      } satisfies ActionWidget<string>;

      const next = run({ form: [source] });

      expect(next.formHealth.status).toBe('errored');
      if (next.formHealth.status === 'errored') {
        expect(next.formHealth.code).toBe(40);
      }
    });

    it('sets formHealth to errored with code 12 when the translator throws a plain error', () => {
      const translator = makeTranslator(() => {
        throw new Error('boom');
      });
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: { key: 'title' } },
      } satisfies DisplayWidget<string>;

      const next = run({ form: [source] }, translator);

      expect(next.formHealth).toEqual({ status: 'errored', code: 12, message: '[12] boom' });
    });
  });

  // ---------------------------------------------------------------------------
  // Scoped-path templates
  // ---------------------------------------------------------------------------

  describe('scoped-path templates', () => {
    it('resolves $form.path inside a string prop', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: 'Hello {{$form.user}}' },
      } satisfies DisplayWidget<string>;

      const next = run({ form: [source], data: { user: 'Bob' } });

      expect((next.calculatedWidgets['d'].current as DisplayWidget<string>).props?.['text']).toBe(
        'Hello Bob',
      );
    });

    it('resolves $meta.path', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: 'Status: {{$meta.status}}' },
      } satisfies DisplayWidget<string>;
      const { state, reduce } = start({ form: [source] });

      const next = reduce(state, setMeta({ status: 'active' }));

      expect((next.calculatedWidgets['d'].current as DisplayWidget<string>).props?.['text']).toBe(
        'Status: active',
      );
    });

    it('resolves $formIsInvalid to "true"/"false"', () => {
      const source1 = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: 'Invalid? {{$formIsInvalid}}' },
      } satisfies DisplayWidget<string>;
      const { state, reduce } = start({ form: [source1, requiredInput('some.path')] });

      const next = reduce(state, validateAllAction);

      expect(next.validations).toEqual({ 'some.path': ['required'] });
      expect((next.calculatedWidgets['d'].current as DisplayWidget<string>).props?.['text']).toBe(
        'Invalid? true',
      );
    });

    it('resolves $errors.path', () => {
      // Without an error `$errors.user` does not exist, and a read of `$errors.user.age` throws.
      // So the widget is included only while the form has an error.
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        include: { when: '$formIsInvalid' },
        props: { text: 'Err: {{$errors.user.age}}' },
      } satisfies DisplayWidget<string>;
      const { state, reduce } = start({ form: [source, requiredInput('user.age')] });
      expect(state.formHealth).toEqual({ status: 'ok' });

      const next = reduce(state, validateAllAction);

      const text = (next.calculatedWidgets['d'].current as DisplayWidget<string>).props?.['text'];
      // The value of `$errors.user.age` is the list of messages, and the template writes it as text.
      expect(text).toBe('Err: required');
    });
  });

  // ---------------------------------------------------------------------------
  // widgetPropOverrides
  // ---------------------------------------------------------------------------

  describe('widgetPropOverrides', () => {
    it('overrides a literal props value', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: 'original' },
      } satisfies DisplayWidget<string>;
      const { state, reduce } = start({ form: [source] });

      const next = reduce(state, overrideProp('d', 'text', 'overridden'));

      expect(next.widgetPropOverrides).toEqual({ d: { text: 'overridden' } });
      expect((next.calculatedWidgets['d'].current as DisplayWidget<string>).props?.['text']).toBe(
        'overridden',
      );
    });

    it('overrides a template-result props value', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: 'Hi {{$form.name}}' },
      } satisfies DisplayWidget<string>;
      const { state, reduce } = start({ form: [source], data: { name: 'Ada' } });

      const next = reduce(state, overrideProp('d', 'text', 'overridden'));

      expect((next.calculatedWidgets['d'].current as DisplayWidget<string>).props?.['text']).toBe(
        'overridden',
      );
    });

    it('overrides a TranslationConfig-result props value', () => {
      const translator = makeTranslator(() => 'translated');
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: { key: 'foo' } },
      } satisfies DisplayWidget<string>;
      const { state, reduce } = start({ form: [source] }, translator);

      const next = reduce(state, overrideProp('d', 'text', 'overridden'));

      expect((next.calculatedWidgets['d'].current as DisplayWidget<string>).props?.['text']).toBe(
        'overridden',
      );
    });

    it('introduces a key not present on source.props', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: 'x' },
      } satisfies DisplayWidget<string>;
      const { state, reduce } = start({ form: [source] });

      const next = reduce(state, overrideProp('d', 'newKey', 'new value'));

      expect((next.calculatedWidgets['d'].current as DisplayWidget<string>).props?.['newKey']).toBe(
        'new value',
      );
    });

    it('does NOT override core fields', () => {
      const source = {
        kind: 'action',
        uid: 'a',
        type: 'button',
        label: 'original',
      } satisfies ActionWidget<string>;
      const { state, reduce } = start({ form: [source] });

      // Even though `label` is a core field, the override only applies to `props.*`.
      const next = reduce(state, overrideProp('a', 'label', 'overridden'));

      const cur = next.calculatedWidgets['a'].current as ActionWidget<string>;
      expect(next.formHealth).toEqual({ status: 'ok' });
      expect(next.widgetPropOverrides).toEqual({ a: { label: 'overridden' } });
      expect(cur.label).toBe('original');
      expect(cur.props).toEqual({ label: 'overridden' });
    });

    it('removes a prop that only a removed override had set', () => {
      const source: DisplayWidget<string> = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: 'hello' },
      };
      const { state, reduce } = start({
        form: [repeater('rows', 'rows', [source])],
        data: { rows: [{}, {}] },
      });
      const overridden = reduce(state, overrideProp('d[0]', 'newKey', 'new value'));
      expect(overridden.calculatedWidgets['d[0]'].current.props).toHaveProperty('newKey');

      // The removal of the first row removes its override. The second row gets the uid `d[0]`.
      const next = reduce(overridden, {
        type: 'SET_WIDGET_DATA',
        payload: { path: 'rows', data: [{}], rowChange: { type: 'removed', index: 0 } },
      });

      expect(next.widgetPropOverrides).toEqual({});
      expect(next.calculatedWidgets['d[0]'].current.props).not.toHaveProperty('newKey');
      expect(next.calculatedWidgets['d[0]'].current.props).toEqual({ text: 'hello' });
    });

    it('keeps the widget reference when the override stays', () => {
      const source: DisplayWidget<string> = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: 'hello' },
      };
      const { state, reduce } = start({ form: [source] });
      const overridden = reduce(state, overrideProp('d', 'newKey', 'new value'));

      const next = reduce(overridden, setData({}));

      expect(next.formHealth).toEqual({ status: 'ok' });
      expect(next.calculatedWidgets).not.toBe(overridden.calculatedWidgets);
      expect(next.calculatedWidgets['d']).toBe(overridden.calculatedWidgets['d']);
    });
  });

  // ---------------------------------------------------------------------------
  // on handlers
  // ---------------------------------------------------------------------------

  describe('on handlers', () => {
    it('Action widget: string on.click is copied', () => {
      const source = {
        kind: 'action',
        uid: 'a',
        type: 'button',
        on: { click: 'submit' },
      } satisfies ActionWidget<string>;

      const next = run({ form: [source] });

      const cur = next.calculatedWidgets['a'].current as ActionWidget<string>;
      expect(cur.on?.click).toBe('submit');
    });

    it('Input widget: string on.change is copied', () => {
      const source = {
        kind: 'input',
        uid: 'i',
        type: 'textinput',
        path: 'x',
        on: { change: 'valueChanged' },
      } satisfies InputWidget<any, string>;

      const next = run({ form: [source] });

      const current = next.calculatedWidgets['i'].current as InputWidget<any, string>;
      expect(current.on?.change).toBe('valueChanged');
    });

    it('uses the on value of an active state', () => {
      const source = {
        kind: 'input',
        uid: 'i',
        type: 'textinput',
        path: 'x',
        on: { change: 'valueChanged', 'change.editing': 'valueChangedWhileEditing' },
      } satisfies InputWidget<any, 'editing'>;

      const next = run({ states: { editing: 'true' }, form: [source] });

      const current = next.calculatedWidgets['i'].current as InputWidget<any, string>;
      expect(next.currentStates).toEqual(['editing']);
      expect(current.on?.change).toBe('valueChangedWhileEditing');
    });

    it('does not read an on value as a template', () => {
      const source = {
        kind: 'action',
        uid: 'a',
        type: 'button',
        on: { click: 'save{{$form.mode}}' },
      } satisfies ActionWidget<string>;

      const next = run({ form: [source], data: { mode: 'Draft' } });

      const current = next.calculatedWidgets['a'].current as ActionWidget<string>;
      expect(current.on?.click).toBe('save{{$form.mode}}');
    });

    it('LayoutWidget on.* is NOT computed (parity quirk)', () => {
      const source = {
        kind: 'layout',
        uid: 'l',
        type: 'flex',
        children: [],
        on: { click: 'x' },
      } satisfies LayoutWidget<string>;

      const next = run({ form: [source] });

      expect((next.resolvedSources['l'] as LayoutWidget<string>).on).toEqual({ click: 'x' });
      expect('on' in next.calculatedWidgets['l'].current).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Hidden widget
  // ---------------------------------------------------------------------------

  describe('hidden widgets', () => {
    it('hidden widget is unchanged', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        include: { when: 'false' },
      } satisfies DisplayWidget<string>;

      const next = run({ form: [source] });

      expect(next.widgetFlags['d']).toEqual({ hidden: true });
      expect('d' in next.calculatedWidgets).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Layout children
  // ---------------------------------------------------------------------------

  describe('layout children filtering', () => {
    it('hidden child is dropped from current.children', () => {
      const child1 = {
        kind: 'display',
        uid: 'c1',
        type: 'heading',
      } satisfies DisplayWidget<string>;
      const child2 = {
        kind: 'display',
        uid: 'c2',
        type: 'heading',
        include: { when: 'false' },
      } satisfies DisplayWidget<string>;
      const source = {
        kind: 'layout',
        uid: 'l',
        type: 'flex',
        children: [child1, child2],
      } satisfies LayoutWidget<string>;

      const next = run({ form: [source] });
      const children = (next.calculatedWidgets['l'].current as LayoutWidget<string>).children;

      expect(children).toHaveLength(1);
      expect(children[0].uid).toBe('c1');
    });

    it('repeater children: looks up widgetFlags under child uid + [index]', () => {
      // Two children: one hidden under repeater-index suffix, one not.
      const c1 = {
        kind: 'display',
        uid: 'cell1',
        type: 'heading',
        include: { when: 'false' },
      } satisfies DisplayWidget<string>;
      const c2 = { kind: 'display', uid: 'cell2', type: 'heading' } satisfies DisplayWidget<string>;
      const rows = {
        kind: 'input',
        uid: 'rows',
        type: 'repeater',
        path: 'rows',
        props: { template: { kind: 'layout', uid: 'row', type: 'flex', children: [c1, c2] } },
      };

      const next = run({ form: [rows], data: { rows: [{}] } });
      const children = (next.calculatedWidgets['row[0]'].current as LayoutWidget<string>).children;

      expect(next.widgetFlags['cell1[0]']).toEqual({ hidden: true });
      expect(children).toHaveLength(1);
      expect(children[0].uid).toBe('cell2');
    });

    it('repeater children: nested indexes append [i][j]', () => {
      const c1 = {
        kind: 'display',
        uid: 'leaf1',
        type: 'heading',
        exclude: { when: '$item.hideLeaf === true' },
      } satisfies DisplayWidget<string>;
      const c2 = { kind: 'display', uid: 'leaf2', type: 'heading' } satisfies DisplayWidget<string>;
      // The row layout of the inner repeater has the uid `grid`, so its rows are `grid[i][j]`.
      const inner = {
        kind: 'input',
        uid: 'inner',
        type: 'repeater',
        path: 'grid.items.rows',
        props: { template: { kind: 'layout', uid: 'grid', type: 'flex', children: [c1, c2] } },
      };
      const outer = repeater('outer', 'grid', [inner]);

      const next = run({
        form: [outer],
        data: { grid: [{ rows: [] }, { rows: [] }, { rows: [{}, {}, {}, { hideLeaf: true }] }] },
      });
      const children = (next.calculatedWidgets['grid[2][3]'].current as LayoutWidget<string>)
        .children;

      expect(next.widgetFlags['leaf1[2][3]']).toEqual({ hidden: true });
      expect(children).toHaveLength(1);
      expect(children[0].uid).toBe('leaf2');
      // A row whose first child is visible keeps both children.
      expect(
        (next.calculatedWidgets['grid[2][2]'].current as LayoutWidget<string>).children,
      ).toHaveLength(2);
    });

    it('a different child at the same position -> new DerivedWidget ref', () => {
      const a = {
        kind: 'display',
        uid: 'a',
        type: 'heading',
        include: { when: "$form.show === 'a'" },
      } satisfies DisplayWidget<string>;
      const b = {
        kind: 'display',
        uid: 'b',
        type: 'heading',
        include: { when: "$form.show === 'b'" },
      } satisfies DisplayWidget<string>;
      const source = {
        kind: 'layout',
        uid: 'l',
        type: 'flex',
        children: [a, b],
      } satisfies LayoutWidget<string>;
      const { state: first, reduce } = start({ form: [source], data: { show: 'a' } });
      const prevDerived = first.calculatedWidgets['l'];
      expect((prevDerived.current as LayoutWidget<string>).children.map((c) => c.uid)).toEqual([
        'a',
      ]);

      // The list keeps its length, and the widget at its first position changes.
      const second = reduce(first, setData({ show: 'b' }));

      expect(second.calculatedWidgets['l']).not.toBe(prevDerived);
      expect(
        (second.calculatedWidgets['l'].current as LayoutWidget<string>).children.map((c) => c.uid),
      ).toEqual(['b']);
    });

    it('core-field change on a layout with structurally stable children -> new DerivedWidget ref', () => {
      // The state changes `size`. The children are structurally stable (both empty), and the
      // children comparison must not hide the change of the core field.
      const source = {
        kind: 'layout',
        uid: 'l',
        type: 'flex',
        size: 1,
        'size.wide': 2,
        children: [],
      } satisfies LayoutWidget<string>;
      const { state: first, reduce } = start({
        states: { wide: '$form.wide === true' },
        form: [source],
      });
      const prevDerived = first.calculatedWidgets['l'];
      expect(prevDerived.current.size).toBe(1);

      const next = reduce(first, setData({ wide: true }));

      expect(next.calculatedWidgets['l']).not.toBe(prevDerived);
      expect(next.calculatedWidgets['l'].current.size).toBe(2);
    });

    it('structural length change trips change detection', () => {
      const a = { kind: 'display', uid: 'a', type: 'heading' } satisfies DisplayWidget<string>;
      const b = {
        kind: 'display',
        uid: 'b',
        type: 'heading',
        exclude: { when: '$form.hideB === true' },
      } satisfies DisplayWidget<string>;
      const source1 = {
        kind: 'layout',
        uid: 'l',
        type: 'flex',
        children: [a, b],
      } satisfies LayoutWidget<string>;
      const { state: first, reduce } = start({ form: [source1] });
      const prevDerived = first.calculatedWidgets['l'];
      expect((prevDerived.current as LayoutWidget<string>).children).toHaveLength(2);

      const second = reduce(first, setData({ hideB: true }));

      expect(second.calculatedWidgets['l']).not.toBe(prevDerived);
      expect((second.calculatedWidgets['l'].current as LayoutWidget<string>).children).toHaveLength(
        1,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Global ref preservation
  // ---------------------------------------------------------------------------

  describe('ref preservation', () => {
    it('widget with identical resolved values across calls -> same DerivedWidget ref', () => {
      const source = {
        kind: 'action',
        uid: 'a',
        type: 'button',
        label: 'Go',
        disabled: false,
      } satisfies ActionWidget<string>;
      const { state: first, reduce } = start({ form: [source] });

      const second = reduce(first, setData({}));

      expect(second.calculatedWidgets).not.toBe(first.calculatedWidgets);
      expect(second.calculatedWidgets['a']).toBe(first.calculatedWidgets['a']);
    });

    it('layout with stable structure -> same DerivedWidget ref across calls', () => {
      const child = { kind: 'display', uid: 'c', type: 'heading' } satisfies DisplayWidget<string>;
      const source = {
        kind: 'layout',
        uid: 'l',
        type: 'flex',
        children: [child],
      } satisfies LayoutWidget<string>;
      const { state: first, reduce } = start({ form: [source] });

      const second = reduce(first, setData({}));

      expect(second.calculatedWidgets).not.toBe(first.calculatedWidgets);
      expect(second.calculatedWidgets['l']).toBe(first.calculatedWidgets['l']);
    });
  });

  // ---------------------------------------------------------------------------
  // Expression templates (subscript evaluation)
  // ---------------------------------------------------------------------------

  describe('expression templates (subscript evaluation)', () => {
    it('evaluates string concatenation', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: "{{$form.firstName + ' ' + $form.lastName}}" },
      } satisfies DisplayWidget<string>;

      const next = run({ form: [source], data: { firstName: 'John', lastName: 'Doe' } });
      expect(next.calculatedWidgets['d']?.current?.props?.['text']).toBe('John Doe');
    });

    it('evaluates arithmetic', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: 'Next: {{$form.count + 1}}' },
      } satisfies DisplayWidget<string>;

      const next = run({ form: [source], data: { count: 4 } });
      expect(next.calculatedWidgets['d']?.current?.props?.['text']).toBe('Next: 5');
    });

    it('evaluates ternary expressions', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: "{{$meta.isVip ? 'VIP' : 'Guest'}}" },
      } satisfies DisplayWidget<string>;
      const { state, reduce } = start({ form: [source] });

      const next = reduce(state, setMeta({ isVip: true }));
      expect(next.calculatedWidgets['d']?.current?.props?.['text']).toBe('VIP');
    });

    it('returns empty string when expression evaluates to undefined', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: 'Hello {{$form.missing}}' },
      } satisfies DisplayWidget<string>;

      const next = run({ form: [source], data: {} });
      expect(next.calculatedWidgets['d']?.current?.props?.['text']).toBe('Hello ');
    });

    it('returns empty string when expression evaluates to null', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: '{{$form.x}}' },
      } satisfies DisplayWidget<string>;

      const next = run({ form: [source], data: { x: null } });
      expect(next.calculatedWidgets['d']?.current?.props?.['text']).toBe('');
    });

    it('preserves false and 0 as "false" and "0"', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: '{{$form.flag}} {{$form.count}}' },
      } satisfies DisplayWidget<string>;

      const next = run({ form: [source], data: { flag: false, count: 0 } });
      expect(next.calculatedWidgets['d']?.current?.props?.['text']).toBe('false 0');
    });

    it('sets formHealth to errored on a parse error', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: 'x: {{$form..broken}}' },
      } satisfies DisplayWidget<string>;

      const next = run({ form: [source] });
      expect(next.formHealth.status).toBe('errored');
      if (next.formHealth.status === 'errored') {
        expect(next.formHealth.code).toBe(40);
      }
    });
  });

  describe('template results', () => {
    const textOf = (template: string, data: Record<string, unknown> = {}) => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: template },
      } satisfies DisplayWidget<string>;

      const next = run({ form: [source], data });
      return { text: next.calculatedWidgets['d']?.current?.props?.['text'], next };
    };

    it.each([
      ['a number', { n: 5 }, '5'],
      ['true', { n: true }, 'true'],
      ['an array', { n: ['a', 'b'] }, 'a,b'],
      ['an object', { n: { a: 1 } }, '[object Object]'],
    ])('gives a string for a template that is one expression with %s', (_name, data, expected) => {
      const { text } = textOf('{{ $form.n }}', data);

      // `toBe` compares the type too, so the number 5 would not match '5'.
      expect(text).toBe(expected);
    });

    it('gives an empty string for a template with an empty expression', () => {
      const { text, next } = textOf('a{{ }}b');

      expect(text).toBe('ab');
      expect(next.formHealth).toEqual({ status: 'ok' });
    });

    it('keeps the text of braces without an expression between them', () => {
      expect(textOf('a{{}}b').text).toBe('a{{}}b');
    });

    it('keeps the raw text of a template whose expression contains a closing brace', () => {
      const template = '{{ $fn.f({a: 1}).a }}';
      const { text, next } = textOf(template);

      expect(text).toBe(template);
      expect(next.formHealth).toEqual({ status: 'ok' });
    });

    it('keeps the raw text of a template that is not closed', () => {
      const template = '{{ $form.n';
      const { text, next } = textOf(template, { n: 5 });

      expect(text).toBe(template);
      expect(next.formHealth).toEqual({ status: 'ok' });
    });

    it('gives a string for a template in a label', () => {
      const source = {
        kind: 'action',
        uid: 'a',
        type: 'button',
        label: '{{ $form.n }}',
      } satisfies ActionWidget<string>;

      const next = run({ form: [source], data: { n: 5 } });

      expect((next.calculatedWidgets['a'].current as ActionWidget<string>).label).toBe('5');
    });

    it('passes literal i18n params and expression results with their type', () => {
      const translator = makeTranslator();
      const source = {
        kind: 'action',
        uid: 'a',
        type: 'button',
        label: {
          key: 'k',
          params: {
            number: 5,
            flag: true,
            zero: '$form.zero',
            missing: '$form.missing',
          } as unknown as I18nParams,
        },
      } satisfies ActionWidget<string>;

      run({ form: [source], data: { zero: 0 } }, translator);

      // The params object has no prototype, so the spread makes a plain object to compare.
      expect({ ...translator.calls[0].params }).toStrictEqual({
        number: 5,
        flag: true,
        zero: 0,
        missing: undefined,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // $fn host functions
  // ---------------------------------------------------------------------------

  describe('$fn host functions', () => {
    const functions: ExpressionFunctions = {
      upper: (value: string) => String(value).toUpperCase(),
      total: (items: Array<{ price?: number }> = []) =>
        items.reduce((sum, item) => sum + (item.price ?? 0), 0),
      lineTotal: (item: { quantity?: number; unitPrice?: number }) =>
        (item.quantity ?? 0) * (item.unitPrice ?? 0),
    };

    it('calls a host function inside a {{ }} slot', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: 'Hello {{$fn.upper($form.name)}}' },
      } satisfies DisplayWidget<string>;

      const next = run({ form: [source], data: { name: 'jane' } }, makeTranslator(), functions);
      expect(next.calculatedWidgets['d']?.current?.props?.['text']).toBe('Hello JANE');
    });

    it('i18n params: $fn expression resolves', () => {
      const translator = makeTranslator();
      const source = {
        kind: 'action',
        uid: 'a',
        type: 'button',
        label: { key: 'k', params: { total: '$fn.total($form.items)' } },
      } satisfies ActionWidget<string>;

      run(
        { form: [source], data: { items: [{ price: 10 }, { price: 20 }] } },
        translator,
        functions,
      );

      expect(translator.calls[0].params).toEqual({ total: 30 });
    });

    it('combines $fn with $item inside a repeater template', () => {
      const source = {
        kind: 'display',
        uid: 'row-total',
        type: 'heading',
        props: { text: 'Total: {{$fn.lineTotal($item)}}' },
      } satisfies DisplayWidget<string>;

      const next = run(
        {
          form: [repeater('lineItems', 'lineItems', [source])],
          data: { lineItems: [{ quantity: 3, unitPrice: 5 }] },
        },
        makeTranslator(),
        functions,
      );
      expect(next.calculatedWidgets['row-total[0]']?.current?.props?.['text']).toBe('Total: 15');
    });

    it('sets formHealth to errored when calling a function the host did not provide', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: '{{$fn.missing($form.name)}}' },
      } satisfies DisplayWidget<string>;

      const next = run({ form: [source] }, makeTranslator(), functions);
      expect(next.formHealth.status).toBe('errored');
      if (next.formHealth.status === 'errored') {
        expect(next.formHealth.code).toBe(40);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // $log
  // ---------------------------------------------------------------------------

  describe('$log', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('logs the value inside a {{ }} slot and shows it in the text', () => {
      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: 'Total: {{ $log($form.total) }}' },
      } satisfies DisplayWidget<string>;

      const next = run({ form: [source], data: { total: 30 } });

      expect(next.formHealth).toEqual({ status: 'ok' });
      expect(next.calculatedWidgets['d']?.current?.props?.['text']).toBe('Total: 30');
      expect(consoleLog).toHaveBeenCalledWith(30);
    });

    it('i18n params: logs the value inside an expression param and passes its result', () => {
      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
      const translator = makeTranslator();
      const source = {
        kind: 'action',
        uid: 'a',
        type: 'button',
        label: { key: 'k', params: { name: "$form.first + ' ' + $log($form.last)" } },
      } satisfies ActionWidget<string>;

      const next = run({ form: [source], data: { first: 'Jane', last: 'Doe' } }, translator);

      expect(next.formHealth).toEqual({ status: 'ok' });
      expect(translator.calls[0].params).toEqual({ name: 'Jane Doe' });
      expect(consoleLog).toHaveBeenCalledWith('Doe');
    });

    it('i18n params: logs the value of a param that is one $log call and passes it', () => {
      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
      const translator = makeTranslator();
      const source = {
        kind: 'action',
        uid: 'a',
        type: 'button',
        label: { key: 'k', params: { last: '$log($form.last)' } },
      } satisfies ActionWidget<string>;

      const next = run({ form: [source], data: { last: 'Doe' } }, translator);

      expect(next.formHealth).toEqual({ status: 'ok' });
      expect(translator.calls[0].params).toEqual({ last: 'Doe' });
      expect(consoleLog).toHaveBeenCalledWith('Doe');
    });
  });

  // ---------------------------------------------------------------------------
  // Validation variables integration
  // ---------------------------------------------------------------------------

  describe('calculateValidationVariables integration', () => {
    it('uses $formIsInvalid = false when no validations fail', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: '{{$formIsInvalid}}' },
      } satisfies DisplayWidget<string>;

      const next = run({ form: [source] });

      expect(next.validations).toEqual({});
      expect((next.calculatedWidgets['d'].current as DisplayWidget<string>).props?.['text']).toBe(
        'false',
      );
    });

    it('uses $formIsInvalid = true when at least one validation has errors', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: '{{$formIsInvalid}}' },
      } satisfies DisplayWidget<string>;
      const { state, reduce } = start({ form: [source, requiredInput('u.n')] });

      const next = reduce(state, validateAllAction);

      expect(next.validations).toEqual({ 'u.n': ['required'] });
      expect((next.calculatedWidgets['d'].current as DisplayWidget<string>).props?.['text']).toBe(
        'true',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // $item / $index repeater item scope
  // ---------------------------------------------------------------------------

  describe('$item / $index repeater item scope', () => {
    const lineItemsData = () => ({
      lineItems: [
        { quantity: 2, unitPrice: 10 },
        { quantity: 3, unitPrice: 5 },
      ],
    });

    it('interpolates {{$item.x}} and {{$index}} for a widget inside a repeater item', () => {
      const source = {
        kind: 'display',
        uid: 'row-total',
        type: 'heading',
        props: { text: 'Row {{$index + 1}}: {{($item.quantity ?? 0) * ($item.unitPrice ?? 0)}}' },
      } satisfies DisplayWidget<string>;

      const next = run({
        form: [repeater('lineItems', 'lineItems', [source])],
        data: lineItemsData(),
      });

      expect(
        (next.calculatedWidgets['row-total[0]'].current as DisplayWidget<string>).props?.['text'],
      ).toBe('Row 1: 20');
    });

    it('binds each widget to its own item', () => {
      const source = {
        kind: 'display',
        uid: 'row-total',
        type: 'heading',
        props: { text: '{{($item.quantity ?? 0) * ($item.unitPrice ?? 0)}}' },
      } satisfies DisplayWidget<string>;

      const next = run({
        form: [repeater('lineItems', 'lineItems', [source])],
        data: lineItemsData(),
      });

      expect(
        (next.calculatedWidgets['row-total[0]'].current as DisplayWidget<string>).props?.['text'],
      ).toBe('20');
      expect(
        (next.calculatedWidgets['row-total[1]'].current as DisplayWidget<string>).props?.['text'],
      ).toBe('15');
    });

    it('pins the invoice per-row and aggregation expressions', () => {
      const rowSource = {
        kind: 'display',
        uid: 'row-total',
        type: 'markdownText',
        props: {
          md: '**Total Price:** {{ (($item.quantity ?? 0) * ($item.unitPrice ?? 0)).toFixed(2) }}',
        },
      } satisfies DisplayWidget<string>;
      const subtotalSource = {
        kind: 'display',
        uid: 'subtotal',
        type: 'markdownText',
        props: {
          md: '**Subtotal:** {{($form.lineItems?.reduce((acc, item) => acc + ((item.quantity ?? 0) * (item.unitPrice ?? 0)), 0) ?? 0).toFixed(2)}}',
        },
      } satisfies DisplayWidget<string>;

      const next = run({
        form: [repeater('lineItems', 'lineItems', [rowSource]), subtotalSource],
        data: lineItemsData(),
      });

      expect(
        (next.calculatedWidgets['row-total[0]'].current as DisplayWidget<string>).props?.['md'],
      ).toBe('**Total Price:** 20.00');
      expect(
        (next.calculatedWidgets['subtotal'].current as DisplayWidget<string>).props?.['md'],
      ).toBe('**Subtotal:** 35.00');
    });

    it('resolves $item and $index in i18n params', () => {
      const source = {
        kind: 'display',
        uid: 'row-total',
        type: 'heading',
        props: {
          text: { key: 'row.total', params: { qty: '$item.quantity', row: '$index + 1' } },
        },
      } satisfies DisplayWidget<string>;
      const translator = makeTranslator();

      run(
        { form: [repeater('lineItems', 'lineItems', [source])], data: lineItemsData() },
        translator,
      );

      expect(translator.calls[0]?.params).toEqual({ qty: 2, row: 1 });
      expect(translator.calls[1]?.params).toEqual({ qty: 3, row: 2 });
    });

    it('leaves $item undefined for widgets outside any repeater', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: '{{$item?.quantity === undefined ? "no item" : "item"}}' },
      } satisfies DisplayWidget<string>;

      const next = run({ form: [source] });

      expect((next.calculatedWidgets['d'].current as DisplayWidget<string>).props?.['text']).toBe(
        'no item',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Which widgets have an entry
  // ---------------------------------------------------------------------------

  describe('the entries of the computed widgets', () => {
    const inputChild = (uid: string, path: string, extra: Record<string, unknown> = {}) => ({
      kind: 'input',
      uid,
      type: 'text',
      path,
      props: {},
      ...extra,
    });
    const users = () => repeater('users', 'users', [inputChild('name', 'users.items.name')]);

    it('gives every visible widget an entry whose source is the widget of the form', () => {
      const next = run({
        form: [
          inputChild('firstName', 'firstName'),
          inputChild('bio', 'bio', { include: { when: 'false' } }),
        ],
      });

      // `#0` is the root layout that holds the widgets of the form. The hidden input has no entry.
      expect(Object.keys(next.resolvedSources)).toEqual(['#0', 'firstName', 'bio']);
      expect(Object.keys(next.calculatedWidgets)).toEqual(['#0', 'firstName']);
      expect(next.calculatedWidgets['firstName'].source).toBe(next.resolvedSources['firstName']);
    });

    it('keeps an existing entry by reference', () => {
      const { state: first, reduce } = start({
        form: [inputChild('firstName', 'firstName'), users()],
        data: { users: [{}] },
      });

      // The second row adds widgets. The widgets that were there keep their entries.
      const second = reduce(first, setData({ users: [{}, {}] }));

      expect(second.calculatedWidgets['firstName']).toBe(first.calculatedWidgets['firstName']);
      expect(second.calculatedWidgets['name[0]']).toBe(first.calculatedWidgets['name[0]']);
      expect(second.calculatedWidgets['name[1]'].current).toMatchObject({
        uid: 'name[1]',
        path: 'users.1.name',
      });
    });

    it('drops an entry whose widget is gone', () => {
      const { state: first, reduce } = start({ form: [users()], data: { users: [{}, {}] } });
      expect(first.calculatedWidgets).toHaveProperty('name[1]');

      const second = reduce(first, setData({ users: [{}] }));

      expect(Object.keys(second.calculatedWidgets)).toEqual([
        '#0',
        'users',
        'users-template[0]',
        'name[0]',
      ]);
    });

    it('replaces an entry that was dropped and re-added, without reusing the old one', () => {
      const { state: first, reduce } = start({ form: [users()], data: { users: [{}, {}] } });
      const removed = reduce(first, setData({ users: [{}] }));
      expect(removed.calculatedWidgets).not.toHaveProperty('name[1]');

      const added = reduce(removed, setData({ users: [{}, {}] }));

      expect(added.calculatedWidgets['name[1]']).not.toBe(first.calculatedWidgets['name[1]']);
      expect(added.calculatedWidgets['name[1]']).toEqual(first.calculatedWidgets['name[1]']);
    });

    it('replaces the entries when one row goes and another row comes in the same derive', () => {
      const guests = repeater('guests', 'guests', [inputChild('guest', 'guests.items.name')]);
      const { state: first, reduce } = start({
        form: [users(), guests],
        data: { users: [{}, {}], guests: [{}] },
      });
      expect(Object.keys(first.calculatedWidgets)).toEqual([
        '#0',
        'users',
        'users-template[0]',
        'name[0]',
        'users-template[1]',
        'name[1]',
        'guests',
        'guests-template[0]',
        'guest[0]',
      ]);

      // The number of widgets stays the same: `users` loses its second row, `guests` gets one.
      const second = reduce(first, setData({ users: [{}], guests: [{}, {}] }));

      expect(Object.keys(second.calculatedWidgets)).toEqual([
        '#0',
        'users',
        'users-template[0]',
        'name[0]',
        'guests',
        'guests-template[0]',
        'guest[0]',
        'guests-template[1]',
        'guest[1]',
      ]);
      expect(second.calculatedWidgets['guest[1]'].current).toMatchObject({
        uid: 'guest[1]',
        path: 'guests.1.name',
      });
    });
  });
});
