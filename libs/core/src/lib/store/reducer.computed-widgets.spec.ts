import { type StandardSchemaV1 } from '@standard-schema/spec';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { errorCodes } from '../errors';
import { type ValidatorFn } from '../form-validator';
import { identityTranslator, type MutableI18nTranslator } from '../i18n';
import { calculatedRecordOfInstances } from '../instances/instance-records';
import { forEachInstance, type WidgetInstance } from '../instances/widget-instance';
import { type ExpressionFunctions } from '../shared';
import { type Action } from './actions';
import { createInitialState, type State } from './model';
import { reducer } from './reducer';

/**
 * The computed widgets of the widget instances, checked through the reducer: each derive
 * computes them on the instances, a language change computes them again, and the record
 * `calculatedWidgets` is written from the instances.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/store/reducer.computed-widgets.spec.ts
 */

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

/** The tests validate no input, so the validator accepts every value. */
const validators: ValidatorFn<unknown> = (): StandardSchemaV1 => ({
  '~standard': {
    version: 1,
    vendor: 'reducer-spec',
    validate: (value: unknown) => ({ value }),
  },
});

type LineItem = { quantity?: number; unitPrice?: number };

const lineTotal = (item: LineItem | undefined): number =>
  (item?.quantity ?? 0) * (item?.unitPrice ?? 0);

/** The functions that the expressions of the example forms call as `$fn.<name>(...)`. */
const functions: ExpressionFunctions = {
  lineTotal,
  grandTotal: (items: LineItem[] | undefined) =>
    (items ?? []).reduce((total, item) => total + lineTotal(item), 0),
  hasItems: (items: unknown[] | undefined) => (items?.length ?? 0) > 0,
  formatMoney: (amount: number, currency: string | undefined) =>
    `${currency ?? 'USD'} ${amount.toFixed(2)}`,
};

/** A translator that gives the key with the language in front, and counts its calls. */
const createTranslator = () => {
  const translator: MutableI18nTranslator = identityTranslator('en-US');
  const calls: string[] = [];
  translator.translate = (key: string): string => {
    calls.push(key);
    if (key === 'fails in es' && translator.lang === 'es') {
      throw new Error('no Spanish text');
    }
    return `${translator.lang}:${key}`;
  };
  return { translator, calls };
};

const createReduce = (translator: MutableI18nTranslator = identityTranslator('en-US')) =>
  reducer({ validators, validateOn: 'eager', localization: translator, functions });

const reduce = createReduce();

const initialize = (formDef: unknown): Action => ({
  type: 'INITIALIZE',
  payload: { formName: 'test-form', formDef: formDef as Record<string, unknown> },
});

const setData = (data: Record<string, unknown>): Action => ({
  type: 'SET_DATA',
  payload: { data },
});

const setMeta = (meta: Record<string, unknown>): Action => ({
  type: 'SET_META',
  payload: { meta },
});

const setLanguage = (lang: string): Action => ({ type: 'SET_LANGUAGE', payload: { lang } });

const drive = (
  actions: Action[],
  from: State = createInitialState('en-US'),
  reduceWith: (state: State, action: Action) => State = reduce,
): State => actions.reduce(reduceWith, from);

const instancesOf = (state: State): WidgetInstance[] => {
  const instances: WidgetInstance[] = [];
  forEachInstance(state.instances.root, (instance) => instances.push(instance));
  return instances;
};

const instanceOf = (state: State, uid: string): WidgetInstance => {
  const instance = instancesOf(state).find((candidate) => candidate.uid === uid);
  if (instance === undefined) {
    throw new Error(`The state has no instance with the uid ${uid}`);
  }
  return instance;
};

type Values = Record<string, any>;

const currentOf = (state: State, uid: string): Values =>
  state.calculatedWidgets[uid].current as unknown as Values;

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
  rowWidgets: unknown[],
  more: Record<string, unknown> = {},
) => ({
  uid,
  kind: 'input',
  type: 'repeater',
  path,
  props: { template: layout(`${uid}Row`, rowWidgets) },
  ...more,
});

/**
 * Checks that the record of the computed widgets is exactly the record of the instances, and
 * that a hidden instance has no computed widget.
 */
const expectComputedWidgetsOfInstances = (state: State): void => {
  const calculatedWidgets = calculatedRecordOfInstances(state.instances);
  expect(Object.keys(state.calculatedWidgets)).toEqual(Object.keys(calculatedWidgets));
  for (const uid of Object.keys(calculatedWidgets)) {
    expect(state.calculatedWidgets[uid]).toBe(calculatedWidgets[uid]);
  }
  for (const instance of instancesOf(state)) {
    if (instance.flags?.hidden === true) {
      expect(instance.calculated).toBeUndefined();
    }
  }
};

const GOLDENS_DIRECTORY = join(__dirname, 'goldens');
const INPUT_SUFFIX = '.input.json';

type ExampleForm = { formDef: unknown; data: Record<string, unknown> };

/** The example forms that `reducer.goldens.spec.ts` records, each with its file name. */
const exampleForms = readdirSync(GOLDENS_DIRECTORY)
  .filter((fileName) => fileName.endsWith(INPUT_SUFFIX))
  .sort()
  .map((fileName): [string, ExampleForm] => [
    fileName.slice(0, -INPUT_SUFFIX.length),
    JSON.parse(readFileSync(join(GOLDENS_DIRECTORY, fileName), 'utf8')) as ExampleForm,
  ]);

const cardForm = {
  states: { editing: '$form.mode === "edit"' },
  form: [
    layout(
      'card',
      [
        textInput('note', 'note', { label: 'Note for {{ $form.name }}' }),
        heading('hint', { include: { when: '$form.showHint === true' } }),
      ],
      { include: { when: '$form.showCard !== false' }, props: { gap: 1, 'gap.editing': 2 } },
    ),
    heading('plain', { props: { text: 'Plain' } }),
  ],
};

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('reducer: the computed widgets of the widget instances', () => {
  it('has no computed widget after INITIALIZE', () => {
    const state = drive([initialize(cardForm)]);

    expect(instancesOf(state).length).toBeGreaterThan(0);
    expect(instancesOf(state).every((instance) => instance.calculated === undefined)).toBe(true);
    expect(state.calculatedWidgets).toEqual({});
  });

  it('writes the computed widgets of a derive to the instances and to the record', () => {
    const state = drive([initialize(cardForm), setData({ name: 'Ada' })]);

    expect(Object.keys(state.calculatedWidgets)).toEqual(['#0', 'card', 'note', 'plain']);
    expect(currentOf(state, 'note')['label']).toBe('Note for Ada');
    expect(state.calculatedWidgets['note']).toBe(instanceOf(state, 'note').calculated);
    expectComputedWidgetsOfInstances(state);
  });

  it('gives a hidden widget and the widgets below it no computed widget', () => {
    const state = drive([initialize(cardForm), setData({ showCard: false })]);

    expect(Object.keys(state.calculatedWidgets)).toEqual(['#0', 'plain']);
    expect(instanceOf(state, 'card').calculated).toBeUndefined();
    expect(instanceOf(state, 'note').calculated).toBeUndefined();
    expectComputedWidgetsOfInstances(state);
  });

  it('computes a widget that is shown again, as a new computed widget', () => {
    const shown = drive([initialize(cardForm), setData({ name: 'Ada' })]);
    const hidden = drive([setData({ name: 'Ada', showCard: false })], shown);

    const shownAgain = drive([setData({ name: 'Ada' })], hidden);

    expect(currentOf(shownAgain, 'note')).toEqual(currentOf(shown, 'note'));
    expect(shownAgain.calculatedWidgets['note']).not.toBe(shown.calculatedWidgets['note']);
    expect(shownAgain.calculatedWidgets['plain']).toBe(shown.calculatedWidgets['plain']);
    expectComputedWidgetsOfInstances(shownAgain);
  });

  describe('an action that changes no value of a widget', () => {
    it('keeps the instances and every computed widget, and writes a new record', () => {
      const state = drive([initialize(cardForm), setData({ name: 'Ada' })]);

      const next = drive([setMeta({ unused: true })], state);

      expect(next.instances).toBe(state.instances);
      expect(next.calculatedWidgets).not.toBe(state.calculatedWidgets);
      expect(next.calculatedWidgets).toEqual(state.calculatedWidgets);
      for (const uid of Object.keys(state.calculatedWidgets)) {
        expect(next.calculatedWidgets[uid]).toBe(state.calculatedWidgets[uid]);
      }
    });
  });

  describe('an action that changes a value of a widget', () => {
    it('gives a new computed widget to that widget only', () => {
      const state = drive([initialize(cardForm), setData({ name: 'Ada' })]);

      const next = drive([setData({ name: 'Grace' })], state);

      expect(currentOf(next, 'note')['label']).toBe('Note for Grace');
      expect(next.calculatedWidgets['note']).not.toBe(state.calculatedWidgets['note']);
      expect(next.calculatedWidgets['card']).toBe(state.calculatedWidgets['card']);
      expect(next.calculatedWidgets['plain']).toBe(state.calculatedWidgets['plain']);
      expect(instanceOf(next, 'plain')).toBe(instanceOf(state, 'plain'));
      expectComputedWidgetsOfInstances(next);
    });

    it('keeps the list of the children of a layout when a state changes another value of the layout', () => {
      const state = drive([initialize(cardForm), setData({})]);

      const editing = drive([setData({ mode: 'edit' })], state);

      expect(currentOf(editing, 'card')['props']).toEqual({ gap: 2 });
      expect(editing.calculatedWidgets['card']).not.toBe(state.calculatedWidgets['card']);
      expect(currentOf(editing, 'card')['children']).toBe(currentOf(state, 'card')['children']);
    });

    it('gives a layout a new list of children when a child is shown', () => {
      const state = drive([initialize(cardForm), setData({})]);

      const withHint = drive([setData({ showHint: true })], state);

      const uidsOfCard = (formState: State): string[] =>
        currentOf(formState, 'card')['children'].map((child: { uid: string }) => child.uid);
      expect(uidsOfCard(state)).toEqual(['note']);
      expect(uidsOfCard(withHint)).toEqual(['note', 'hint']);
    });
  });

  describe('the rows of a repeater', () => {
    const usersForm = {
      form: [
        repeater(
          'users',
          'users',
          [
            textInput('name', 'users.items.name', {
              label: 'Name {{ $index }} of {{ $item.team }}',
            }),
          ],
          { defaultValue: [{ team: 'Core' }, { team: 'Docs' }] },
        ),
      ],
    };

    it('keeps the computed widgets of the rows that did not change', () => {
      const state = drive([initialize(usersForm), setData({})]);

      const next = drive(
        [
          setData({
            users: [
              { team: 'Core', name: '' },
              { team: 'Design', name: '' },
            ],
          }),
        ],
        state,
      );

      expect(currentOf(next, 'name[1]')['label']).toBe('Name 1 of Design');
      expect(next.calculatedWidgets['name[0]']).toBe(state.calculatedWidgets['name[0]']);
      expect(next.calculatedWidgets['usersRow[0]']).toBe(state.calculatedWidgets['usersRow[0]']);
      expect(next.calculatedWidgets['name[1]']).not.toBe(state.calculatedWidgets['name[1]']);
      expectComputedWidgetsOfInstances(next);
    });

    it('keeps the computed widgets of the rows when new data has no list and the default value writes it again', () => {
      const state = drive([initialize(usersForm), setData({})]);

      const next = drive([setData({ other: 1 })], state);

      expect(next.data['users']).toEqual([
        { team: 'Core', name: undefined },
        { team: 'Docs', name: undefined },
      ]);
      for (const uid of ['users', 'usersRow[0]', 'name[0]', 'usersRow[1]', 'name[1]']) {
        expect(next.calculatedWidgets[uid]).toBe(state.calculatedWidgets[uid]);
      }
      expectComputedWidgetsOfInstances(next);
    });

    it('removes the computed widgets of a row that is gone', () => {
      const state = drive([initialize(usersForm), setData({})]);

      const next = drive([setData({ users: [{ team: 'Core' }] })], state);

      expect(Object.keys(next.calculatedWidgets)).toEqual([
        '#0',
        'users',
        'usersRow[0]',
        'name[0]',
      ]);
      expectComputedWidgetsOfInstances(next);
    });
  });

  describe('a derive that fails', () => {
    const failingForm = {
      form: [
        textInput('name', 'name', { label: 'Name' }),
        heading('total', { props: { text: 'Total: {{ $form.order.total }}' } }),
      ],
    };

    it('keeps the previous instances and computed widgets', () => {
      const state = drive([initialize(failingForm), setData({ order: { total: 5 } })]);

      const failed = drive([setData({ name: 'Ada' })], state);

      expect(failed.formHealth).toMatchObject({
        status: 'errored',
        code: errorCodes.resolveStringInterpolationError,
      });
      expect(failed.instances).toBe(state.instances);
      expect(failed.calculatedWidgets).toBe(state.calculatedWidgets);
      expect(currentOf(failed, 'total')['props'].text).toBe('Total: 5');
    });

    it('computes every widget again in the next derive that succeeds', () => {
      const state = drive([initialize(failingForm), setData({ order: { total: 5 } })]);
      const failed = drive([setData({ name: 'Ada' })], state);

      const repaired = drive([setData({ name: 'Ada', order: { total: 7 } })], failed);

      expect(repaired.formHealth).toEqual({ status: 'ok' });
      expect(currentOf(repaired, 'total')['props'].text).toBe('Total: 7');
      expect(repaired.calculatedWidgets['name']).toBe(state.calculatedWidgets['name']);
      expectComputedWidgetsOfInstances(repaired);
    });

    it('gives code 40 with the slot text when the result of a slot cannot become a text', () => {
      const failed = drive([
        initialize({ form: [heading('greeting', { props: { text: 'Hello {{ $form.obj }}' } })] }),
        setData({ obj: Object.create(null) }),
      ]);

      expect(failed.formHealth).toEqual({
        status: 'errored',
        message:
          "[40] Failed to evaluate '{{$form.obj}}': Cannot convert object to primitive value",
        code: errorCodes.resolveStringInterpolationError,
      });
    });

    it('shows no computed widget when the first derive of a form fails', () => {
      const failed = drive([initialize(failingForm), setData({})]);

      expect(failed.formHealth.status).toBe('errored');
      expect(failed.calculatedWidgets).toEqual({});
      expect(instancesOf(failed).every((instance) => instance.calculated === undefined)).toBe(true);
    });
  });

  describe('a language change', () => {
    const translatedForm = {
      form: [
        textInput('name', 'name', { label: { key: 'name' } }),
        layout('box', [heading('inside', { props: { text: { key: 'inside' } } })], {
          include: { when: '$form.show === true' },
        }),
        heading('plain', { props: { text: 'Plain' } }),
      ],
    };

    it('computes again the widgets that are computed, and only those', () => {
      const { translator, calls } = createTranslator();
      const reduceWith = createReduce(translator);
      const state = drive([initialize(translatedForm), setData({})], undefined, reduceWith);
      calls.length = 0;
      translator.setLang('es');

      const spanish = drive([setLanguage('es')], state, reduceWith);

      expect(currentOf(spanish, 'name')['label']).toBe('es:name');
      expect(calls).toEqual(['name']);
      expect(Object.keys(spanish.calculatedWidgets)).toEqual(['#0', 'name', 'plain']);
      expect(spanish.calculatedWidgets['plain']).toBe(state.calculatedWidgets['plain']);
      expect(instanceOf(spanish, 'box')).toBe(instanceOf(state, 'box'));
      expectComputedWidgetsOfInstances(spanish);
    });

    it('writes a new record, also when no text changes', () => {
      const state = drive([initialize(translatedForm), setData({})]);

      const again = drive([setLanguage('en-US')], state);

      expect(again.calculatedWidgets).not.toBe(state.calculatedWidgets);
      expect(again.calculatedWidgets).toEqual(state.calculatedWidgets);
      expect(again.instances).toBe(state.instances);
    });

    it('computes nothing before the first data', () => {
      const { translator, calls } = createTranslator();
      const reduceWith = createReduce(translator);
      const state = drive([initialize(translatedForm)], undefined, reduceWith);
      translator.setLang('es');

      const spanish = drive([setLanguage('es')], state, reduceWith);

      expect(calls).toEqual([]);
      expect(spanish.calculatedWidgets).toEqual({});
      expect(spanish.instances).toBe(state.instances);
      expect(spanish.lang).toBe('es');
    });

    it('keeps the previous instances and record when a translation fails', () => {
      const { translator } = createTranslator();
      const reduceWith = createReduce(translator);
      const formDef = {
        form: [
          textInput('name', 'name', { label: { key: 'name' } }),
          heading('title', { props: { text: { key: 'fails in es' } } }),
        ],
      };
      const state = drive([initialize(formDef), setData({})], undefined, reduceWith);
      translator.setLang('es');

      const failed = drive([setLanguage('es')], state, reduceWith);

      expect(failed.formHealth).toEqual({
        status: 'errored',
        message: '[12] no Spanish text',
        code: errorCodes.calculateWidgetPropsError,
      });
      expect(failed.lang).toBe('es');
      expect(failed.instances).toBe(state.instances);
      expect(failed.calculatedWidgets).toBe(state.calculatedWidgets);
      expect(currentOf(failed, 'name')['label']).toBe('en-US:name');
    });

    it('gives an errored health and no exception when the validation variables fail', () => {
      // The validation variables put the messages of `dims.length` into the message list of
      // `dims`, and a list cannot take a list as its length.
      const rejectAll: ValidatorFn<unknown> = (): StandardSchemaV1 => ({
        '~standard': {
          version: 1,
          vendor: 'reducer-spec',
          validate: () => ({ issues: [{ message: 'wrong' }] }),
        },
      });
      const reduceWith = reducer({
        validators: rejectAll,
        validateOn: 'eager',
        localization: identityTranslator('en-US'),
        functions,
      });
      const formDef = {
        form: [
          textInput('dims', 'dims', { validator: { required: true } }),
          textInput('length', 'dims.length', { validator: { required: true } }),
        ],
      };
      const validated = drive(
        [initialize(formDef), setData({}), { type: 'VALIDATE_ALL' }],
        undefined,
        reduceWith,
      );

      const changed = drive([setLanguage('es')], validated, reduceWith);

      expect(changed.formHealth).toEqual({
        status: 'errored',
        message: '[12] Invalid array length',
        code: errorCodes.calculateWidgetPropsError,
      });
      expect(changed.lang).toBe('es');
    });

    it('uses the item and the index of each row', () => {
      const { translator } = createTranslator();
      const reduceWith = createReduce(translator);
      const formDef = {
        form: [
          repeater('users', 'users', [
            heading('title', {
              props: { text: '{{ $index }}: {{ $item.name }}', hint: { key: 'hint' } },
            }),
          ]),
        ],
      };
      const state = drive(
        [initialize(formDef), setData({ users: [{ name: 'Ada' }, { name: 'Grace' }] })],
        undefined,
        reduceWith,
      );
      translator.setLang('es');

      const spanish = drive([setLanguage('es')], state, reduceWith);

      expect(currentOf(spanish, 'title[1]')['props']).toEqual({
        text: '1: Grace',
        hint: 'es:hint',
      });
    });
  });

  describe('the example forms', () => {
    it('has example forms', () => {
      expect(exampleForms.length).toBeGreaterThan(0);
    });

    it.each(exampleForms)(
      'writes the record of the computed widgets of the form %s from its instances',
      (_name, { formDef, data }) => {
        const withoutData = drive([initialize(formDef), setData({})]);
        expect(withoutData.formHealth).toEqual({ status: 'ok' });
        expectComputedWidgetsOfInstances(withoutData);

        const withData = drive([setData(data)], withoutData);
        expect(withData.formHealth).toEqual({ status: 'ok' });
        expectComputedWidgetsOfInstances(withData);

        // The same data again changes no value, so every instance stays.
        const again = drive([setData(withData.data)], withData);
        expect(again.instances).toBe(withData.instances);
        expectComputedWidgetsOfInstances(again);

        const otherLanguage = drive([setLanguage('es')], again);
        expect(otherLanguage.formHealth).toEqual({ status: 'ok' });
        expectComputedWidgetsOfInstances(otherLanguage);
      },
    );
  });
});
