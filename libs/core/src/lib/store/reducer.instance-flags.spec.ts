import { type StandardSchemaV1 } from '@standard-schema/spec';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { errorCodes } from '../errors';
import { type ValidatorFn } from '../form-validator';
import { identityTranslator } from '../i18n';
import { flagsRecordOfInstances } from '../instances/instance-records';
import { forEachInstance, type WidgetInstance } from '../instances/widget-instance';
import { type ExpressionFunctions } from '../shared';
import { type Action } from './actions';
import { createInitialState, type State } from './model';
import { reducer } from './reducer';

/**
 * The flags of the widget instances, checked through the reducer: each derive computes them on
 * the instances, and the record `widgetFlags` is written from the instances.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/store/reducer.instance-flags.spec.ts
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

const drive = (actions: Action[], from: State = createInitialState('en-US')): State =>
  actions.reduce(reduce, from);

const instancesOf = (state: State): WidgetInstance[] => {
  const instances: WidgetInstance[] = [];
  forEachInstance(state.instances.root, (instance) => instances.push(instance));
  return instances;
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

/** Checks that the flags record of a state is exactly the record of its instances. */
const expectFlagsOfInstances = (state: State): void => {
  const widgetFlags = flagsRecordOfInstances(state.instances);
  expect(state.widgetFlags).toEqual(widgetFlags);
  expect(Object.keys(state.widgetFlags)).toEqual(Object.keys(widgetFlags));
  for (const instance of instancesOf(state)) {
    if (instance.flags !== undefined) {
      expect(state.widgetFlags[instance.uid]).toBe(instance.flags);
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
  form: [
    layout('card', [textInput('note', 'note', { disabled: { when: '$form.locked === true' } })], {
      include: { when: '$form.showCard !== false' },
    }),
    heading('hint', { include: { when: '$form.showHint === true' } }),
    heading('plain'),
  ],
};

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('reducer: the flags of the widget instances', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('has no flags after INITIALIZE', () => {
    const state = drive([initialize(cardForm)]);

    expect(instancesOf(state).map((instance) => instance.uid)).toEqual([
      '#0',
      'card',
      'note',
      'hint',
      'plain',
    ]);
    expect(instancesOf(state).every((instance) => instance.flags === undefined)).toBe(true);
    expect(state.widgetFlags).toEqual({});
  });

  it('writes the flags of a derive to the instances and to the record', () => {
    const state = drive([initialize(cardForm), setData({ locked: true })]);

    expect(state.widgetFlags).toEqual({
      card: { hidden: false },
      note: { disabled: true },
      hint: { hidden: true },
    });
    expectFlagsOfInstances(state);
  });

  describe('references', () => {
    it('keeps the instances and the record when an action changes no flag', () => {
      const before = drive([initialize(cardForm), setData({ locked: true })]);

      const after = drive([setData({ locked: true, other: 1 })], before);

      expect(after.instances).toBe(before.instances);
      expect(after.widgetFlags).toBe(before.widgetFlags);
    });

    it('keeps the flags object of a widget whose flags did not change', () => {
      const before = drive([initialize(cardForm), setData({ locked: true })]);

      const after = drive([setData({ locked: true, showHint: true })], before);

      expect(after.widgetFlags).not.toBe(before.widgetFlags);
      expect(after.widgetFlags['hint']).toEqual({ hidden: false });
      expect(after.widgetFlags['card']).toBe(before.widgetFlags['card']);
      expect(after.widgetFlags['note']).toBe(before.widgetFlags['note']);
    });

    it('keeps the previous flags when the derive fails', () => {
      const before = drive([
        initialize({
          form: [heading('title', { include: { when: '$form.user.name === "Ada"' } })],
        }),
        setData({ user: { name: 'Ada' } }),
      ]);

      const after = drive([setData({})], before);

      expect(after.formHealth).toMatchObject({
        status: 'errored',
        code: errorCodes.calculateWidgetFlagsError,
      });
      expect(after.instances).toBe(before.instances);
      expect(after.widgetFlags).toBe(before.widgetFlags);
      expect(after.widgetFlags['title']).toEqual({ hidden: false });
    });
  });

  describe('a row that is removed', () => {
    const usersForm = {
      form: [
        repeater('users', 'users', [textInput('name', 'users.items.name')], {
          include: { when: '$form.showUsers === true' },
        }),
      ],
    };

    it('removes the flags of its widgets, also when no flag of another widget changes', () => {
      const before = drive([initialize(usersForm), setData({ showUsers: false, users: [{}, {}] })]);
      expect(Object.keys(before.widgetFlags)).toEqual([
        'users',
        'usersRow[0]',
        'name[0]',
        'usersRow[1]',
        'name[1]',
      ]);

      const after = drive([setData({ showUsers: false, users: [{}] })], before);

      expect(Object.keys(after.widgetFlags)).toEqual(['users', 'usersRow[0]', 'name[0]']);
      expectFlagsOfInstances(after);
    });

    it('keeps only the flags of the repeater when it is shown again with two rows', () => {
      const hidden = drive([initialize(usersForm), setData({ showUsers: false, users: [{}, {}] })]);
      const oneRow = drive([setData({ showUsers: false, users: [{}] })], hidden);

      const shownWithTwoRows = drive([setData({ showUsers: true, users: [{}, {}] })], oneRow);

      expect(shownWithTwoRows.widgetFlags).toEqual({ users: { hidden: false } });
      expect(Object.keys(shownWithTwoRows.calculatedWidgets)).toEqual([
        '#0',
        'users',
        'usersRow[0]',
        'name[0]',
        'usersRow[1]',
        'name[1]',
      ]);
    });
  });

  describe('a widget below a hidden widget', () => {
    it('has the flag hidden alone, also when it has conditions of its own', () => {
      const state = drive([initialize(cardForm), setData({ showCard: false, locked: true })]);

      expect(state.widgetFlags['card']).toEqual({ hidden: true });
      expect(state.widgetFlags['note']).toEqual({ hidden: true });
      expect(Object.keys(state.widgetFlags['note'])).toEqual(['hidden']);
    });

    it('reports no error for a condition that would fail, until the widget above it is shown', () => {
      const form = {
        form: [
          layout('card', [heading('title', { include: { when: '$form.user.name === "Ada"' } })], {
            include: { when: '$form.showCard === true' },
          }),
        ],
      };

      const hidden = drive([initialize(form), setData({ showCard: false })]);
      expect(hidden.formHealth).toEqual({ status: 'ok' });
      expect(hidden.widgetFlags['title']).toEqual({ hidden: true });

      const shown = drive([setData({ showCard: true })], hidden);
      expect(shown.formHealth).toEqual({
        status: 'errored',
        code: errorCodes.calculateWidgetFlagsError,
        message: "[11] Cannot read properties of undefined (reading 'name')",
      });
    });

    it('reports no rejected condition below a hidden layout, until the layout is shown', () => {
      const form = {
        form: [
          layout('card', [heading('inner', { include: { when: '$form.tags.pop() === 1' } })], {
            include: { when: '$form.show === true' },
          }),
        ],
      };

      const hidden = drive([initialize(form), setData({ show: false, tags: [1] })]);
      expect(hidden.formHealth).toEqual({ status: 'ok' });
      expect(hidden.widgetFlags['inner']).toEqual({ hidden: true });

      const shown = drive([setData({ show: true, tags: [1] })], hidden);
      expect(shown.formHealth).toMatchObject({
        status: 'errored',
        code: errorCodes.expressionRejectedError,
      });
      expect((shown.formHealth as { message: string }).message).toContain(
        '[50] Rejected expression "$form.tags.pop() === 1"',
      );
    });

    it('hides the widgets of a hidden layout whose written uid ends with an index', () => {
      const state = drive([
        initialize({
          form: [
            layout('card[1]', [heading('title'), textInput('note', 'note')], {
              include: { when: '$form.showCard === true' },
            }),
          ],
        }),
        setData({ showCard: false }),
      ]);

      expect(state.widgetFlags).toEqual({
        'card[1]': { hidden: true },
        title: { hidden: true },
        note: { hidden: true },
      });
      expect(Object.keys(state.calculatedWidgets)).toEqual(['#0']);
    });
  });

  describe('two repeaters with one path', () => {
    it('hides only the rows of the repeater that is hidden', () => {
      const state = drive([
        initialize({
          form: [
            repeater('shown', 'users', [textInput('shownName', 'users.items.name')]),
            repeater('gone', 'users', [textInput('goneName', 'users.items.name')], {
              include: { when: 'false' },
            }),
          ],
        }),
        setData({ users: [{ name: 'Ada' }] }),
      ]);

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(state.widgetFlags).toEqual({
        gone: { hidden: true },
        'goneRow[0]': { hidden: true },
        'goneName[0]': { hidden: true },
      });
      expect(Object.keys(state.calculatedWidgets)).toEqual([
        '#0',
        'shown',
        'shownRow[0]',
        'shownName[0]',
      ]);
    });

    it('shows the rows of a repeater whose path starts with the path of a hidden repeater', () => {
      const state = drive([
        initialize({
          form: [
            repeater('gone', 'a', [textInput('goneName', 'a.items.name')], {
              include: { when: 'false' },
            }),
            repeater('shown', 'a.b', [textInput('shownName', 'a.b.items.name')]),
          ],
        }),
        setData({ a: { b: [{ name: 'Ada' }] } }),
      ]);

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(state.widgetFlags).toEqual({ gone: { hidden: true } });
      expect(Object.keys(state.calculatedWidgets)).toContain('shownName[0]');
    });
  });

  describe('a rejected condition of a row', () => {
    it('gives code 50 with the condition as it is written', () => {
      const state = drive([
        initialize({
          form: [
            repeater('users', 'users', [
              heading('badge', { include: { when: '$form.users.items.tags.pop() === 1' } }),
            ]),
          ],
        }),
        setData({ users: [{ tags: [1] }] }),
      ]);

      expect(state.formHealth).toMatchObject({
        status: 'errored',
        code: errorCodes.expressionRejectedError,
      });
      expect((state.formHealth as { message: string }).message).toContain(
        '[50] Rejected expression "$form.users.items.tags.pop() === 1"',
      );
      expect(state.data).toEqual({ users: [{ tags: [1] }] });
    });
  });

  describe('a state that is not declared', () => {
    it('prints the console error for a widget of a row layout too', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      const state = drive([
        initialize({
          states: { known: 'true' },
          form: [
            heading('outside', { include: { in: ['nope'] } }),
            repeater('users', 'users', [
              heading('inRow', { exclude: { from: ['nope', 'known'] } }),
            ]),
          ],
        }),
      ]);

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(error).toHaveBeenCalledTimes(1);
      expect(error.mock.calls[0][0]).toContain(
        '[GolemUI] include/exclude references undefined state "nope" (on outside, inRow);',
      );
      expect(error.mock.calls[0][0]).toContain('Declared states: known.');
    });
  });

  describe('the example forms', () => {
    it('has example forms', () => {
      expect(exampleForms.length).toBeGreaterThan(0);
    });

    it.each(exampleForms)(
      'writes the flags record of the form %s from its instances',
      (_name, { formDef, data }) => {
        const withoutData = drive([initialize(formDef), setData({})]);
        expect(withoutData.formHealth).toEqual({ status: 'ok' });
        expectFlagsOfInstances(withoutData);

        const withData = drive([setData(data)], withoutData);
        expect(withData.formHealth).toEqual({ status: 'ok' });
        expectFlagsOfInstances(withData);

        // The same data again changes no flag, so nothing is written again.
        const again = drive([setData(withData.data)], withData);
        expect(again.instances).toBe(withData.instances);
        expect(again.widgetFlags).toBe(withData.widgetFlags);
      },
    );
  });
});
