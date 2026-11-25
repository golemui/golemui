import { type StandardSchemaV1 } from '@standard-schema/spec';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { errorCodes } from '../errors';
import { type ValidatorFn } from '../form-validator';
import { identityTranslator } from '../i18n';
import { recordsOfInstances } from '../instances/instance-records';
import { forEachInstance, type WidgetInstance } from '../instances/widget-instance';
import { type ExpressionFunctions } from '../shared';
import { type Action } from './actions';
import { createInitialState, type State } from './model';
import { reducer } from './reducer';

/**
 * The widget instances of the state, checked through the reducer: `INITIALIZE` builds them, each
 * derive builds them again for its data, and the records that list the widgets by uid are
 * written from them.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/store/reducer.widget-instances.spec.ts
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

const reduce = reducer({
  validators,
  validateOn: 'eager',
  localization: identityTranslator('en-US'),
  functions,
});

const initialize = (formDef: unknown): Action => ({
  type: 'INITIALIZE',
  payload: { formName: 'test-form', formDef: formDef as Record<string, unknown> },
});

const setData = (data: Record<string, unknown>): Action => ({
  type: 'SET_DATA',
  payload: { data },
});

const setWidgetData = (path: string, data: unknown): Action => ({
  type: 'SET_WIDGET_DATA',
  payload: { path, data },
});

const drive = (actions: Action[], from: State = createInitialState('en-US')): State =>
  actions.reduce(reduce, from);

const instancesOf = (state: State): WidgetInstance[] => {
  const instances: WidgetInstance[] = [];
  forEachInstance(state.instances.root, (instance) => instances.push(instance));
  return instances;
};

const uidsOf = (state: State): string[] => instancesOf(state).map((instance) => instance.uid);

const textInput = (uid: string, path: string, more: Record<string, unknown> = {}) => ({
  uid,
  kind: 'input',
  type: 'textinput',
  path,
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
  props: { template: { uid: `${uid}Row`, kind: 'layout', type: 'flex', children: rowWidgets } },
  ...more,
});

const usersForm = {
  form: [
    textInput('title', 'title'),
    repeater('users', 'users', [textInput('name', 'users.items.name')]),
  ],
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

/** Checks that the three records of a state are exactly the records of its instances. */
const expectRecordsOfInstances = (state: State): void => {
  const records = recordsOfInstances(state.instances, state.compiled.root);
  for (const name of ['resolvedSources', 'repeaterItemScopes', 'repeaterRows'] as const) {
    expect(state[name]).toEqual(records[name]);
    expect(Object.keys(state[name])).toEqual(Object.keys(records[name]));
  }
  for (const instance of instancesOf(state)) {
    expect(state.resolvedSources[instance.uid]).toBe(instance.source);
  }
};

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('reducer: the widget instances', () => {
  it('has no instance before a form definition', () => {
    expect(createInitialState('en-US').instances).toEqual({ root: undefined });
  });

  it('has the instances of the widgets outside a repeater after INITIALIZE', () => {
    const state = drive([initialize(usersForm)]);

    expect(uidsOf(state)).toEqual(['#0', 'title', 'users']);
    expect(state.instances.root?.source).toBe(state.formDef.form);
    expectRecordsOfInstances(state);
  });

  it('has the instances of the rows after the first data', () => {
    const state = drive([initialize(usersForm), setData({ users: [{}, {}] })]);

    expect(uidsOf(state)).toEqual([
      '#0',
      'title',
      'users',
      'usersRow[0]',
      'name[0]',
      'usersRow[1]',
      'name[1]',
    ]);
    expectRecordsOfInstances(state);
  });

  it.each([
    ['a definition that does not decode', { form: [{ kind: 'input', type: 'textinput' }] }],
    [
      'a definition with a repeated uid',
      { form: [textInput('name', 'first'), textInput('name', 'second')] },
    ],
  ])('has no instance for %s', (_name, formDef) => {
    const state = drive([initialize(formDef), setData({})]);

    expect(state.formHealth.status).toBe('errored');
    expect(state.instances.root).toBeUndefined();
    expect(state.resolvedSources).toEqual({});
  });

  it('starts with new instances when a form gets a new definition', () => {
    const first = drive([initialize(usersForm), setData({ users: [{}] })]);

    const second = drive([initialize({ form: [textInput('email', 'email')] })], first);

    expect(uidsOf(second)).toEqual(['#0', 'email']);
    expect(Object.keys(second.resolvedSources)).toEqual(['#0', 'email']);
    expect(second.repeaterRows).toEqual({});
  });

  describe('an action that changes no row', () => {
    it('keeps the instances and the three records', () => {
      const before = drive([initialize(usersForm), setData({ users: [{ name: 'Ada' }] })]);

      const after = drive(
        [setWidgetData('users.0.name', 'Grace'), setWidgetData('title', 'Team')],
        before,
      );

      expect(after.data).toEqual({ title: 'Team', users: [{ name: 'Grace' }] });
      expect(after.instances).toBe(before.instances);
      expect(after.resolvedSources).toBe(before.resolvedSources);
      expect(after.repeaterItemScopes).toBe(before.repeaterItemScopes);
      expect(after.repeaterRows).toBe(before.repeaterRows);
    });

    it('keeps them when new data has the same rows', () => {
      const before = drive([initialize(usersForm), setData({ users: [{ name: 'Ada' }] })]);

      const after = drive([setData({ title: 'Team', users: [{ name: 'Edsger' }] })], before);

      expect(after.instances).toBe(before.instances);
      expect(after.resolvedSources).toBe(before.resolvedSources);
    });
  });

  describe('an action that changes the rows', () => {
    it('builds the instances of the new row and writes the three records again', () => {
      const before = drive([initialize(usersForm), setData({ users: [{}] })]);

      const after = drive([setWidgetData('users', [{}, {}])], before);

      expect(uidsOf(after)).toEqual([
        '#0',
        'title',
        'users',
        'usersRow[0]',
        'name[0]',
        'usersRow[1]',
        'name[1]',
      ]);
      expect(after.instances).not.toBe(before.instances);
      expect(after.resolvedSources).not.toBe(before.resolvedSources);
      expect(after.repeaterItemScopes).not.toBe(before.repeaterItemScopes);
      expect(after.repeaterRows).not.toBe(before.repeaterRows);
      expectRecordsOfInstances(after);
    });

    it('keeps the source object of a widget whose row stays', () => {
      const before = drive([initialize(usersForm), setData({ users: [{ name: 'Ada' }] })]);

      const after = drive([setWidgetData('users', [{ name: 'Ada' }, {}])], before);

      expect(after.resolvedSources['name[0]']).toBe(before.resolvedSources['name[0]']);
      expect(after.resolvedSources['usersRow[0]']).toBe(before.resolvedSources['usersRow[0]']);
      expect(after.resolvedSources['title']).toBe(before.flatForm['title']);
    });

    it('removes the instances of a row that is gone', () => {
      const before = drive([initialize(usersForm), setData({ users: [{}, {}] })]);

      const after = drive([setWidgetData('users', [{}])], before);

      expect(uidsOf(after)).toEqual(['#0', 'title', 'users', 'usersRow[0]', 'name[0]']);
      expect(after.resolvedSources).not.toHaveProperty(['name[1]']);
      expect(after.repeaterRows).not.toHaveProperty(['name[1]']);
      expectRecordsOfInstances(after);
    });
  });

  describe('a derive that fails', () => {
    const formWithWrongRowPath = {
      form: [repeater('users', 'users', [textInput('name', 'people.items.name')])],
    };

    it('keeps the previous instances and records', () => {
      const before = drive([initialize(formWithWrongRowPath), setData({ users: [] })]);
      expect(before.formHealth).toEqual({ status: 'ok' });

      const after = drive([setData({ users: [{}] })], before);

      expect(after.formHealth).toMatchObject({
        status: 'errored',
        code: errorCodes.calculateWidgetFlagsError,
        message: '[11] Path "people.items.name" is not inside the repeater row "users.items".',
      });
      expect(after.instances).toBe(before.instances);
      expect(after.resolvedSources).toBe(before.resolvedSources);
      expect(uidsOf(after)).toEqual(['#0', 'users']);
    });

    it('builds the instances again when the row with the error is gone', () => {
      const withValidRepeater = {
        form: [
          ...formWithWrongRowPath.form,
          repeater('teams', 'teams', [textInput('teamName', 'teams.items.name')]),
        ],
      };
      const errored = drive([
        initialize(withValidRepeater),
        setData({ users: [], teams: [] }),
        setData({ users: [{}], teams: [{}] }),
      ]);
      expect(errored.formHealth).toMatchObject({ status: 'errored' });
      expect(uidsOf(errored)).toEqual(['#0', 'users', 'teams']);

      const recovered = drive([setData({ users: [], teams: [{}] })], errored);

      expect(recovered.formHealth).toEqual({ status: 'ok' });
      expect(uidsOf(recovered)).toEqual(['#0', 'users', 'teams', 'teamsRow[0]', 'teamName[0]']);
      expectRecordsOfInstances(recovered);
    });
  });

  describe('the default values', () => {
    it('builds the rows that the default value of a repeater creates', () => {
      const state = drive([
        initialize({
          form: [
            repeater(
              'users',
              'users',
              [textInput('name', 'users.items.name', { defaultValue: 'New' })],
              {
                defaultValue: [{}, {}],
              },
            ),
          ],
        }),
        setData({}),
      ]);

      expect(state.data).toEqual({ users: [{ name: 'New' }, { name: 'New' }] });
      expect(uidsOf(state)).toEqual([
        '#0',
        'users',
        'usersRow[0]',
        'name[0]',
        'usersRow[1]',
        'name[1]',
      ]);
      expectRecordsOfInstances(state);
    });

    it('keeps the instances and the records when new data has no list and the default value writes it again', () => {
      const formDef = {
        form: [
          repeater('users', 'users', [textInput('name', 'users.items.name')], {
            defaultValue: [{ name: 'Ada' }, { name: 'Grace' }],
          }),
        ],
      };
      const loaded = drive([initialize(formDef), setData({})]);

      const next = reduce(loaded, setData({ title: 'Team' }));

      expect(next.data).toEqual({
        title: 'Team',
        users: [{ name: 'Ada' }, { name: 'Grace' }],
      });
      const rowsBefore = instancesOf(loaded).filter((instance) => instance.rowIndexes.length > 0);
      const rowsAfter = instancesOf(next).filter((instance) => instance.rowIndexes.length > 0);
      expect(rowsBefore.map((instance) => instance.uid)).toEqual([
        'usersRow[0]',
        'name[0]',
        'usersRow[1]',
        'name[1]',
      ]);
      expect(rowsAfter).toHaveLength(rowsBefore.length);
      rowsAfter.forEach((instance, position) => {
        expect(instance).toBe(rowsBefore[position]);
      });
      expect(next.resolvedSources['name[1]']).toBe(loaded.resolvedSources['name[1]']);
      expect(next.instances).toBe(loaded.instances);
      expect(next.resolvedSources).toBe(loaded.resolvedSources);
      expect(next.repeaterRows).toBe(loaded.repeaterRows);
    });

    it('keeps the row instances of a repeater inside a row when the default value of that repeater is written again', () => {
      const formDef = {
        form: [
          repeater('teams', 'teams', [
            repeater(
              'devs',
              'teams.items.devs',
              [textInput('devName', 'teams.items.devs.items.name')],
              {
                defaultValue: [{ name: 'Ada' }],
              },
            ),
          ]),
        ],
      };
      const loaded = drive([initialize(formDef), setData({ teams: [{}] })]);

      const next = reduce(loaded, setWidgetData('teams', [{ name: 'Core' }]));

      expect(next.data).toEqual({ teams: [{ name: 'Core', devs: [{ name: 'Ada' }] }] });
      const devNameBefore = instancesOf(loaded).find(
        (instance) => instance.uid === 'devName[0][0]',
      );
      const devNameAfter = instancesOf(next).find((instance) => instance.uid === 'devName[0][0]');
      expect(devNameBefore).toBeDefined();
      expect(devNameAfter).toBe(devNameBefore);
    });

    it('writes the default value of the first of two inputs with one path', () => {
      const state = drive([
        initialize({
          form: [
            textInput('first', 'city', { defaultValue: 'Girona' }),
            textInput('second', 'city', { defaultValue: 'Vic' }),
          ],
        }),
        setData({}),
      ]);

      expect(state.data).toEqual({ city: 'Girona' });
    });

    it('goes through the inputs in the order of the document, also when a uid is a whole number', () => {
      const state = drive([
        initialize({
          form: [
            textInput('first', 'city', { defaultValue: 'Girona' }),
            textInput('5', 'city', { defaultValue: 'Vic' }),
          ],
        }),
        setData({}),
      ]);

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(state.data).toEqual({ city: 'Girona' });
    });
  });

  describe('the example forms', () => {
    it('has example forms', () => {
      expect(exampleForms.length).toBeGreaterThan(0);
    });

    it.each(exampleForms)(
      'writes the three records of the form %s from its instances',
      (_name, { formDef, data }) => {
        const initialized = drive([initialize(formDef)]);
        expectRecordsOfInstances(initialized);

        const withoutData = drive([setData({})], initialized);
        expect(withoutData.formHealth).toEqual({ status: 'ok' });
        expectRecordsOfInstances(withoutData);

        const withData = drive([setData(data)], withoutData);
        expect(withData.formHealth).toEqual({ status: 'ok' });
        expectRecordsOfInstances(withData);

        // The same data again has the same rows, so nothing is built again.
        const again = drive([setData(withData.data)], withData);
        expect(again.instances).toBe(withData.instances);
        expect(again.resolvedSources).toBe(withData.resolvedSources);
      },
    );
  });
});
