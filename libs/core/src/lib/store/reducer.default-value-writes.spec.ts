import { type StandardSchemaV1 } from '@standard-schema/spec';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type ValidatorFn } from '../form-validator';
import { identityTranslator } from '../i18n';
import { type Action } from './actions';
import { createInitialState, type State } from './model';
import { reducer } from './reducer';

/**
 * Which default value a derive writes into the data, checked through the reducer: two inputs on
 * one path, a parent path and a child path, containers that cannot hold the path, an empty place
 * of an array, and repeater defaults that create more rows.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/store/reducer.default-value-writes.spec.ts
 */

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

/** No test of this file needs a validation error, so the validator accepts every value. */
const validators: ValidatorFn<unknown> = (): StandardSchemaV1 => ({
  '~standard': {
    version: 1,
    vendor: 'reducer-spec',
    validate: (value: unknown) => ({ value }),
  },
});

const reduce = reducer({
  validators,
  validateOn: 'eager',
  localization: identityTranslator('en-US'),
  functions: {},
});

/** Dispatches the actions from a new initial state and returns the last state. */
const drive = (actions: Action[]): State => actions.reduce(reduce, createInitialState('en-US'));

const init = (...widgets: Record<string, unknown>[]): Action => ({
  type: 'INITIALIZE',
  payload: { formName: 'test-form', formDef: { form: widgets } },
});

const setData = (data: Record<string, any>): Action => ({
  type: 'SET_DATA',
  payload: { data },
});

const input = (uid: string, path: string, extra: Record<string, unknown> = {}) => ({
  kind: 'input',
  uid,
  type: 'text',
  path,
  props: {},
  ...extra,
});

/** A repeater whose template is the layout `rowUid` with the given children. */
const repeater = (
  uid: string,
  path: string,
  rowUid: string,
  children: unknown[],
  extra: Record<string, unknown> = {},
) => ({
  kind: 'input',
  uid,
  type: 'repeater',
  path,
  props: { template: { kind: 'layout', uid: rowUid, type: 'flex', children } },
  ...extra,
});

/** An array of the given length that has a value only at the given indexes. */
const arrayWithEmptyPlaces = (length: number, values: Record<number, unknown>): unknown[] => {
  const array: unknown[] = new Array(length);
  for (const [index, value] of Object.entries(values)) {
    array[Number(index)] = value;
  }
  return array;
};

/**
 * `depth` repeaters, each one inside the row of the one before. Each repeater has the path
 * `level` in its row and the default value `[{}]`. The row of the last repeater holds the input
 * `leaf` with the path `value` and the default value `'leaf'`.
 */
const repeaterChain = (depth: number): Record<string, unknown> => {
  const repeaterPaths: string[] = [];
  let path = 'level';
  for (let level = 0; level < depth; level++) {
    repeaterPaths.push(path);
    path = `${path}.items.level`;
  }

  let widget: Record<string, unknown> = input('leaf', `${repeaterPaths[depth - 1]}.items.value`, {
    defaultValue: 'leaf',
  });
  for (let level = depth - 1; level >= 0; level--) {
    widget = repeater(`level${level}`, repeaterPaths[level], `row${level}`, [widget], {
      defaultValue: [{}],
    });
  }
  return widget;
};

/** The data of a {@link repeaterChain} with one row at each level and `lastRow` as the last row. */
const repeaterChainData = (
  depth: number,
  lastRow: Record<string, unknown>,
): Record<string, unknown> => {
  let data = lastRow;
  for (let level = 0; level < depth; level++) {
    data = { level: [data] };
  }
  return data;
};

// `#0` is the root layout that holds the widgets of the form.
const ROOT_UID = '#0';

describe('reducer: the copy of a default value', () => {
  it('copies the plain objects and arrays of a default value and keeps a Date as the same object', () => {
    const createdAt = new Date('2026-01-02T03:04:05.000Z');
    const defaultValue = { createdAt, tags: ['new'], owner: { name: 'Ada' } };

    const state = drive([init(input('record', 'record', { defaultValue })), setData({})]);

    const written = state.data['record'];
    expect(written).toEqual({ createdAt, tags: ['new'], owner: { name: 'Ada' } });
    expect(written.tags).not.toBe(defaultValue.tags);
    expect(written.owner).not.toBe(defaultValue.owner);
    expect(written.createdAt).toBe(createdAt);
  });
});

describe('reducer: two inputs on one path', () => {
  it('writes the default of the first input in the order of the form', () => {
    const state = drive([
      init(
        input('first', 'choice', { defaultValue: 'first' }),
        input('second', 'choice', { defaultValue: 'second' }),
      ),
      setData({}),
    ]);

    expect(state.formHealth).toEqual({ status: 'ok' });
    expect(state.data).toEqual({ choice: 'first' });
  });

  it('writes the default of a hidden first input', () => {
    const afterFirstData = drive([
      init(
        input('first', 'choice', {
          defaultValue: 'hidden',
          include: { when: '$form.showFirst === true' },
        }),
        input('second', 'choice', { defaultValue: 'visible' }),
      ),
      setData({}),
    ]);

    expect(afterFirstData.formHealth).toEqual({ status: 'ok' });
    expect(afterFirstData.widgetFlags['first']).toEqual({ hidden: true });
    expect(afterFirstData.data).toEqual({ choice: 'hidden' });

    // The input is hidden when this derive starts.
    const afterSecondData = reduce(afterFirstData, setData({ other: 1 }));

    expect(afterSecondData.formHealth).toEqual({ status: 'ok' });
    expect(afterSecondData.widgetFlags['first']).toEqual({ hidden: true });
    expect(afterSecondData.data).toEqual({ other: 1, choice: 'hidden' });
  });

  const rowInputRepeater = () =>
    repeater('users', 'users', 'userRow', [
      input('name', 'users.items.name', { defaultValue: 'row' }),
    ]);
  const staticInput = () => input('firstUserName', 'users.0.name', { defaultValue: 'static' });

  it.each<[string, string, string, () => Record<string, unknown>[]]>([
    ['row input', 'the repeater', 'row', () => [rowInputRepeater(), staticInput()]],
    ['static input', 'the static input', 'static', () => [staticInput(), rowInputRepeater()]],
  ])(
    'writes the default of the %s for a path of both when %s comes first',
    (_writer, _first, expected, form) => {
      const state = drive([init(...form()), setData({ users: [{}] })]);

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(state.data).toEqual({ users: [{ name: expected }] });
    },
  );
});

describe('reducer: an input on a parent path and an input on a child path', () => {
  const parent = input('user', 'user', { defaultValue: { name: 'Parent', age: 1 } });
  const child = input('userName', 'user.name', { defaultValue: 'Child' });

  it.each<[string, Record<string, unknown>[], Record<string, unknown>]>([
    ['parent', [parent, child], { name: 'Parent', age: 1 }],
    ['child', [child, parent], { name: 'Child' }],
  ])('writes the default of the %s input when it comes first', (_first, form, user) => {
    const state = drive([init(...form), setData({})]);

    expect(state.formHealth).toEqual({ status: 'ok' });
    expect(state.data).toEqual({ user });
  });
});

describe('reducer: a parent value that cannot hold the path', () => {
  it.each<[string, Record<string, unknown>, string, Record<string, unknown>]>([
    ['null', { user: null }, 'user.name', { user: { name: 'x' } }],
    ['a number', { user: 5 }, 'user.name', { user: { name: 'x' } }],
    ['a string', { user: 'Ada' }, 'user.name', { user: { name: 'x' } }],
    ['null before an index', { tags: null }, 'tags.0', { tags: ['x'] }],
    ['a string before an index', { tags: 'ab' }, 'tags.0', { tags: ['x'] }],
  ])('replaces a parent that is %s with a new container', (_parent, data, path, expected) => {
    const state = drive([init(input('field', path, { defaultValue: 'x' })), setData(data)]);

    expect(state.formHealth).toEqual({ status: 'ok' });
    expect(state.data).toEqual(expected);
  });
});

describe('reducer: defaults and the empty places of a repeater array', () => {
  it('builds a row in the same derive when the default of a static input fills its empty place', () => {
    const state = drive([
      init(
        repeater('users', 'users', 'userRow', [input('name', 'users.items.name')]),
        input('firstUserName', 'users.0.name', { defaultValue: 'static' }),
      ),
      setData({ users: arrayWithEmptyPlaces(2, { 1: { name: 'Ada' } }) }),
    ]);

    expect(state.formHealth).toEqual({ status: 'ok' });
    expect(state.data['users']).toEqual([{ name: 'static' }, { name: 'Ada' }]);
    expect(Object.keys(state.resolvedSources)).toEqual([
      ROOT_UID,
      'users',
      'userRow[0]',
      'name[0]',
      'userRow[1]',
      'name[1]',
      'firstUserName',
    ]);
  });
});

describe('reducer: the number of default passes in one derive', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes the default of an input inside 49 nested repeater defaults in one derive', () => {
    const warn = vi.spyOn(console, 'warn');
    const error = vi.spyOn(console, 'error');

    const state = drive([init(repeaterChain(49)), setData({})]);

    expect(state.formHealth).toEqual({ status: 'ok' });
    expect(state.data).toEqual(repeaterChainData(49, { value: 'leaf' }));
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });
});
