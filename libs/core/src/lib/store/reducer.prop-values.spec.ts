import { type StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';
import { type ValidatorFn } from '../form-validator';
import { type ActionWidget } from '../form-widget';
import { type I18nParams, type I18nTranslator, type TranslationKey } from '../i18n';
import { type Action } from './actions';
import { createInitialState, type State } from './model';
import { reducer } from './reducer';

/**
 * The values of `current.props` of a computed widget, and the errors of the props, checked
 * through the reducer: each test sends `INITIALIZE` and `SET_DATA`, sometimes more actions, and
 * reads `calculatedWidgets` and the form health of the state that results.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/store/reducer.prop-values.spec.ts
 */

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

type RecordedCall = { key: TranslationKey; params?: I18nParams; defaultValue?: string };

/**
 * A translator that records every call. The default translation is `T:<key>`.
 *
 * `translate` can return a value that is not a string, because a host translator can do that.
 */
const makeTranslator = (
  translate: (key: TranslationKey, params?: I18nParams, defaultValue?: string) => unknown = (key) =>
    `T:${key}`,
): I18nTranslator & { calls: RecordedCall[] } => {
  const calls: RecordedCall[] = [];
  return {
    get lang() {
      return 'en-US';
    },
    translate(key: TranslationKey, params?: I18nParams, defaultValue?: string): string {
      calls.push({ key, params, defaultValue });
      return translate(key, params, defaultValue) as string;
    },
    subscribe(): () => void {
      return () => undefined;
    },
    calls,
  };
};

/** No test of this file validates an input, so the validator accepts every value. */
const validators: ValidatorFn<unknown> = (): StandardSchemaV1 => ({
  '~standard': {
    version: 1,
    vendor: 'reducer-spec',
    validate: (value: unknown) => ({ value }),
  },
});

const setData = (data: Record<string, any>): Action => ({
  type: 'SET_DATA',
  payload: { data },
});

const overrideProp = (uid: string, prop: string, value: unknown): Action => ({
  type: 'OVERRIDE_WIDGET_PROP',
  payload: { uid, prop, value },
});

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
  translator: I18nTranslator = makeTranslator(),
) => {
  const reduce = reducer({
    validators,
    validateOn: 'eager',
    localization: translator,
    functions: {},
  });
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
const run = (scenario: Scenario, translator?: I18nTranslator): State =>
  start(scenario, translator).state;

const propsOf = (state: State, uid: string): Record<string, unknown> =>
  state.calculatedWidgets[uid].current.props as Record<string, unknown>;

const heading = (
  uid: string,
  props: Record<string, unknown>,
  extra: Record<string, unknown> = {},
) => ({
  uid,
  kind: 'display',
  type: 'heading',
  props,
  ...extra,
});

/** A repeater whose row layout has the uid `<uid>-template`. */
const repeater = (
  uid: string,
  path: string,
  children: unknown[],
  extraProps: Record<string, unknown> = {},
  templateProps: Record<string, unknown> = {},
) => ({
  kind: 'input',
  uid,
  type: 'repeater',
  path,
  props: {
    template: {
      kind: 'layout',
      uid: `${uid}-template`,
      type: 'flex',
      props: templateProps,
      children,
    },
    ...extraProps,
  },
});

/** The message of a `{{ }}` that reads a property of `undefined`. */
const readOfUndefinedMessage = (expression: string, property: string) =>
  `[40] Failed to evaluate '{{${expression}}}': Cannot read properties of undefined (reading '${property}')`;

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('reducer: the names of the props', () => {
  it('lists the props in the order of their first key, and a prop that only an override has last', () => {
    // `label.on` comes before `options` and `label`, so the place of `label` is that of its
    // suffixed key.
    const { state, reduce } = start({
      states: { on: '$form.on === true' },
      form: [heading('title', { 'label.on': 'On', options: ['a'], label: 'Off' })],
    });

    const next = reduce(state, overrideProp('title', 'extra', 'E'));

    expect(next.formHealth).toEqual({ status: 'ok' });
    expect(Object.keys(propsOf(next, 'title'))).toEqual(['label', 'options', 'extra']);
  });

  it.each([
    ['is not active', {}, { onlySuffix: undefined }],
    ['is active', { on: true }, { onlySuffix: 'On' }],
  ])(
    'gives a prop that only has a suffixed key one key without the suffix while its state %s',
    (_description, data, expectedProps) => {
      const next = run({
        states: { on: '$form.on === true' },
        form: [heading('title', { 'onlySuffix.on': 'On' })],
        data,
      });

      expect(next.formHealth).toEqual({ status: 'ok' });
      // `toStrictEqual` fails when the key with the value undefined is missing.
      expect(propsOf(next, 'title')).toStrictEqual(expectedProps);
    },
  );

  it.each(['constructor', 'prototype'])('reports code 12 for a prop named %s', (name) => {
    const next = run({ form: [heading('title', { [name]: 'x' })] });

    expect(next.formHealth).toEqual({
      status: 'errored',
      code: 12,
      message: `[12] Path "props.${name}" has the segment "${name}". A path cannot contain the segments __proto__, constructor or prototype.`,
    });
    expect(next.calculatedWidgets).toEqual({});
  });

  it.each(['constructor', 'prototype'])(
    'reports code 12 on every derive while an override named %s stays',
    (name) => {
      const expectedHealth = {
        status: 'errored',
        code: 12,
        message: `[12] Path "props.${name}" has the segment "${name}". A path cannot contain the segments __proto__, constructor or prototype.`,
      };
      const { state, reduce } = start({ form: [heading('title', { text: 'Title' })] });
      expect(state.formHealth).toEqual({ status: 'ok' });

      const overridden = reduce(state, overrideProp('title', name, 'x'));
      const next = reduce(overridden, setData({ other: 1 }));

      expect(overridden.formHealth).toEqual(expectedHealth);
      expect(next.formHealth).toEqual(expectedHealth);
      expect(next.widgetPropOverrides).toEqual({ title: { [name]: 'x' } });
    },
  );
});

describe('reducer: the values of the props', () => {
  it('translates a nested config in a prop named template of a widget that is not a repeater', () => {
    const next = run({ form: [heading('title', { template: [{ key: 'x' }] })] });

    expect(next.formHealth).toEqual({ status: 'ok' });
    expect(propsOf(next, 'title')['template']).toEqual(['T:x']);
  });

  it('translates a nested config in a prop of a repeater that is not the template', () => {
    const translator = makeTranslator();

    const next = run(
      {
        form: [repeater('users', 'users', [], { sections: [{ key: 'users.title' }] })],
      },
      translator,
    );

    expect(next.formHealth).toEqual({ status: 'ok' });
    expect(propsOf(next, 'users')['sections']).toEqual(['T:users.title']);
    expect(translator.calls.map((call) => call.key)).toEqual(['users.title']);
  });

  it.each<[string, Record<string, unknown>]>([
    ['with a key that is a number', { key: 5 }],
    ['with no key', {}],
    ['with only a default', { default: 'd' }],
    ['with only params', { params: {} }],
  ])('keeps a nested object %s: it is not a translation config', (_description, value) => {
    const translator = makeTranslator();
    const list = [value];
    const nested = { item: value };

    const next = run({ form: [heading('title', { list, nested })] }, translator);

    expect(next.formHealth).toEqual({ status: 'ok' });
    expect(propsOf(next, 'title')['list']).toBe(list);
    expect(propsOf(next, 'title')['nested']).toBe(nested);
    expect(translator.calls).toEqual([]);
  });

  it('keeps a prop that holds null inside an array and inside an object', () => {
    const list = [null, 'a'];
    const nested = { item: null };

    const next = run({ form: [heading('title', { list, nested })] });

    expect(next.formHealth).toEqual({ status: 'ok' });
    expect(propsOf(next, 'title')['list']).toBe(list);
    expect(propsOf(next, 'title')['nested']).toBe(nested);
  });

  it('uses a suffixed null of an active state', () => {
    const next = run({
      states: { aa: 'true' },
      form: [heading('title', { q: 'q', 'q.aa': null })],
    });

    expect(next.formHealth).toEqual({ status: 'ok' });
    expect(propsOf(next, 'title')['q']).toBeNull();
  });

  it('evaluates a template with a newline inside the braces', () => {
    const next = run({ form: [heading('title', { text: 'A{{\n$form.a\n}}B' })], data: { a: 1 } });

    expect(next.formHealth).toEqual({ status: 'ok' });
    expect(propsOf(next, 'title')['text']).toBe('A1B');
  });

  it('gives the row layout of a repeater the scope of its row', () => {
    const next = run({
      form: [repeater('users', 'users', [], {}, { title: 'Row {{ $index }}: {{ $item.name }}' })],
      data: { users: [{ name: 'Ada' }, { name: 'Bob' }] },
    });

    expect(next.formHealth).toEqual({ status: 'ok' });
    expect(propsOf(next, 'users-template[0]')['title']).toBe('Row 0: Ada');
    expect(propsOf(next, 'users-template[1]')['title']).toBe('Row 1: Bob');
  });

  it('gives a nested repeater the scope of the row of the outer repeater', () => {
    const next = run({
      form: [
        repeater('teams', 'teams', [
          repeater('devs', 'teams.items.devs', [], { title: '{{ $index }}: {{ $item.name }}' }),
        ]),
      ],
      data: {
        teams: [
          { name: 'Core', devs: [] },
          { name: 'Web', devs: [{}] },
        ],
      },
    });

    expect(next.formHealth).toEqual({ status: 'ok' });
    expect(propsOf(next, 'devs[0]')['title']).toBe('0: Core');
    expect(propsOf(next, 'devs[1]')['title']).toBe('1: Web');
  });

  describe('state changes', () => {
    it('gives new props when a state changes a prop, and keeps the reference of each equal prop value', () => {
      const options = [{ label: 'A', value: 'a' }];
      const { state: off, reduce } = start({
        states: { on: '$form.on === true' },
        form: [
          heading('title', { label: 'Off', 'label.on': 'On', options, tags: [{ key: 'tag' }] }),
        ],
      });

      const on = reduce(off, setData({ on: true }));

      const propsOff = propsOf(off, 'title');
      const propsOn = propsOf(on, 'title');
      expect(on.formHealth).toEqual({ status: 'ok' });
      expect(propsOn).toEqual({ label: 'On', options, tags: ['T:tag'] });
      expect(propsOn).not.toBe(propsOff);
      expect(propsOn['options']).toBe(options);
      // The translation makes a new array on each derive. The equal content keeps the first one.
      expect(propsOn['tags']).toBe(propsOff['tags']);
    });

    it('keeps a value of the definition by reference when the widget is hidden and shown again', () => {
      const options = [{ label: 'A', value: 'a' }];
      const { state: shown, reduce } = start({
        form: [heading('title', { options }, { include: { when: '$form.show' } })],
        data: { show: true },
      });

      const hidden = reduce(shown, setData({ show: false }));
      const shownAgain = reduce(hidden, setData({ show: true }));

      expect(hidden.calculatedWidgets).not.toHaveProperty('title');
      expect(shownAgain.formHealth).toEqual({ status: 'ok' });
      expect(propsOf(shownAgain, 'title')['options']).toBe(options);
    });
  });
});

describe('reducer: the overrides of the props', () => {
  it.each<[string, unknown]>([
    ['a translation config', { key: 'raw' }],
    ['a text with a template', 'x {{ $form.s }}'],
  ])('writes an override that is %s as it is', (_description, value) => {
    const translator = makeTranslator();
    const { state, reduce } = start(
      { form: [heading('title', { text: 'Title' })], data: { s: 'S' } },
      translator,
    );

    const next = reduce(state, overrideProp('title', 'text', value));

    expect(next.formHealth).toEqual({ status: 'ok' });
    expect(propsOf(next, 'title')['text']).toBe(value);
    expect(translator.calls).toEqual([]);
  });

  it('keeps the key of an override that is set to undefined when the definition has no such prop', () => {
    const { state, reduce } = start({ form: [heading('title', { text: 'Title' })] });
    const overridden = reduce(state, overrideProp('title', 'extra', 'E'));
    expect(propsOf(overridden, 'title')).toEqual({ text: 'Title', extra: 'E' });

    const next = reduce(overridden, overrideProp('title', 'extra', undefined));

    expect(next.formHealth).toEqual({ status: 'ok' });
    // `toStrictEqual` fails when the key with the value undefined is missing.
    expect(propsOf(next, 'title')).toStrictEqual({ text: 'Title', extra: undefined });
  });

  it('does not apply an override whose name has a dot', () => {
    const { state, reduce } = start({
      states: { s: 'true' },
      form: [heading('title', { text: 'a', 'text.s': 'b' })],
    });

    const next = reduce(state, overrideProp('title', 'text.s', 'over'));

    expect(next.formHealth).toEqual({ status: 'ok' });
    expect(next.widgetPropOverrides).toEqual({ title: { 'text.s': 'over' } });
    expect(propsOf(next, 'title')).toStrictEqual({ text: 'b' });
  });

  it('keeps the entry of a widget whose override is a Date', () => {
    const date = new Date('2026-01-01T00:00:00Z');
    const { state, reduce } = start({ form: [heading('title', { text: 'Title' })] });
    const overridden = reduce(state, overrideProp('title', 'date', date));

    const next = reduce(overridden, setData({ other: 1 }));

    expect(next.formHealth).toEqual({ status: 'ok' });
    expect(propsOf(next, 'title')['date']).toBe(date);
    expect(next.calculatedWidgets['title']).toBe(overridden.calculatedWidgets['title']);
  });
});

describe('reducer: translations in props', () => {
  it('writes a translation that is not a string as it is', () => {
    const translator = makeTranslator(() => 5);

    const next = run(
      { form: [{ uid: 'save', kind: 'action', type: 'button', label: { key: 'count' } }] },
      translator,
    );

    expect(next.formHealth).toEqual({ status: 'ok' });
    expect((next.calculatedWidgets['save'].current as ActionWidget<string>).label).toBe(5);
  });

  it('passes the default of a translation config to the translator as written', () => {
    const translator = makeTranslator((_key, _params, defaultValue) => defaultValue);

    const next = run(
      {
        form: [
          {
            uid: 'save',
            kind: 'action',
            type: 'button',
            label: { key: 'greeting', default: 'Hi {{ $form.n }}' },
          },
        ],
        data: { n: 5 },
      },
      translator,
    );

    expect(next.formHealth).toEqual({ status: 'ok' });
    expect(translator.calls).toEqual([
      { key: 'greeting', params: undefined, defaultValue: 'Hi {{ $form.n }}' },
    ]);
    expect((next.calculatedWidgets['save'].current as ActionWidget<string>).label).toBe(
      'Hi {{ $form.n }}',
    );
  });
});

describe('reducer: the errors of the props', () => {
  it('reports code 40 with the param for a translation param that throws', () => {
    const next = run({
      form: [heading('title', { text: { key: 'greeting', params: { p: '$form.a.b' } } })],
    });

    expect(next.formHealth).toEqual({
      status: 'errored',
      code: 40,
      message:
        "[40] Failed to evaluate i18n param '$form.a.b': Cannot read properties of undefined (reading 'b')",
    });
  });

  it('reports code 50 for a rejected expression in a label', () => {
    const next = run({
      form: [{ uid: 'save', kind: 'action', type: 'button', label: '{{ $form.x = 1 }}' }],
    });

    expect(next.formHealth).toEqual({
      status: 'errored',
      code: 50,
      message:
        '[50] Rejected expression "$form.x = 1": [EXPRESSION_REJECTED] The assignment "=" writes into the data. Expressions can only read.',
    });
    expect(next.data).toEqual({});
  });

  it('keeps the code of an error that the translator throws, and computes nothing on the next SET_DATA', () => {
    let translatorBroken = false;
    const translator = makeTranslator((key) => {
      if (translatorBroken) {
        throw Object.assign(new Error('no catalog'), { code: 77 });
      }
      return `T:${key}`;
    });
    const { state: good, reduce } = start(
      {
        form: [heading('title', { text: { key: 'title' }, count: '{{ $form.n }}' })],
        data: { n: 1 },
      },
      translator,
    );
    expect(good.formHealth).toEqual({ status: 'ok' });

    translatorBroken = true;
    const failed = reduce(good, setData({ n: 2 }));
    translatorBroken = false;
    const next = reduce(failed, setData({ n: 3 }));

    const expectedHealth = { status: 'errored', code: 77, message: '[77] no catalog' };
    expect(failed.formHealth).toEqual(expectedHealth);
    // The translator works again, but the derive does not run while the code 77 stays.
    expect(next.formHealth).toEqual(expectedHealth);
    expect(next.data).toEqual({ n: 3 });
    expect(next.calculatedWidgets).toBe(good.calculatedWidgets);
    expect(propsOf(next, 'title')['count']).toBe('1');
  });

  it('reports the error of the first failing widget in the order of the form', () => {
    const next = run({
      form: [heading('b', { text: '{{ $form.b.x }}' }), heading('a', { text: '{{ $form.a.x }}' })],
    });

    expect(next.formHealth).toEqual({
      status: 'errored',
      code: 40,
      message: readOfUndefinedMessage('$form.b.x', 'x'),
    });
  });

  it('reports the error of the label before the error of a prop of the same widget', () => {
    const next = run({
      form: [
        {
          uid: 'save',
          kind: 'action',
          type: 'button',
          props: { text: '{{ $form.p.x }}' },
          label: '{{ $form.l.x }}',
        },
      ],
    });

    expect(next.formHealth).toEqual({
      status: 'errored',
      code: 40,
      message: readOfUndefinedMessage('$form.l.x', 'x'),
    });
  });
});
