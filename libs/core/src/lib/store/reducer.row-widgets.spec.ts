import { type StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';
import { type ValidatorFn } from '../form-validator';
import { identityTranslator } from '../i18n';
import { type Action } from './actions';
import { createInitialState, type State } from './model';
import { reducer } from './reducer';

/**
 * The widgets of the repeater rows, checked through the reducer: each test sends `INITIALIZE` and
 * `SET_DATA`, and reads `resolvedSources`, `repeaterItemScopes`, `repeaterRows` and
 * `calculatedWidgets` of the state that results.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/store/reducer.row-widgets.spec.ts
 */

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

/** No test of this file validates an input, so the validator accepts every value. */
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

const display = (uid: string, extra: Record<string, unknown> = {}) => ({
  kind: 'display',
  uid,
  type: 'markdownText',
  props: {},
  ...extra,
});

const input = (uid: string, path: string, extra: Record<string, unknown> = {}) => ({
  kind: 'input',
  uid,
  type: 'text',
  path,
  props: {},
  ...extra,
});

const layout = (uid: string, children: unknown[]) => ({
  kind: 'layout',
  uid,
  type: 'flex',
  children,
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
  props: { template: layout(rowUid, children) },
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

/** The template layout of a repeater of `flatForm`, as the decoder gives it. */
const templateOf = (state: State, repeaterUid: string): Record<string, any> =>
  (state.flatForm[repeaterUid] as unknown as { props: { template: Record<string, any> } }).props
    .template;

// `#0` is the root layout that holds the widgets of the form.
const ROOT_UID = '#0';

/**
 * Static widgets around a repeater of teams. Each team row has a name, a nested repeater of
 * developers and a note.
 */
const teamsForm = () =>
  init(
    display('a'),
    layout('L', [display('b')]),
    repeater('teams', 'teams', 'teamRow', [
      input('tname', 'teams.items.name'),
      repeater('devs', 'teams.items.devs', 'devRow', [
        input('dname', 'teams.items.devs.items.name'),
      ]),
      display('tnote'),
    ]),
    display('z'),
  );

describe('reducer: the order of the row widgets', () => {
  it('puts the rows of a repeater directly after it, also the rows of a nested repeater', () => {
    const state = drive([teamsForm(), setData({ teams: [{ devs: [{}, {}] }, { devs: [{}] }] })]);

    const rowWidgets = [
      'teamRow[0]',
      'tname[0]',
      'devs[0]',
      'devRow[0][0]',
      'dname[0][0]',
      'devRow[0][1]',
      'dname[0][1]',
      'tnote[0]',
      'teamRow[1]',
      'tname[1]',
      'devs[1]',
      'devRow[1][0]',
      'dname[1][0]',
      'tnote[1]',
    ];
    const allWidgets = [ROOT_UID, 'a', 'L', 'b', 'teams', ...rowWidgets, 'z'];

    expect(state.formHealth).toEqual({ status: 'ok' });
    expect(Object.keys(state.resolvedSources)).toEqual(allWidgets);
    expect(Object.keys(state.calculatedWidgets)).toEqual(allWidgets);
    // The two row records have an entry for each row widget. No code reads the order of their keys.
    expect(Object.keys(state.repeaterItemScopes).sort()).toEqual([...rowWidgets].sort());
    expect(Object.keys(state.repeaterRows).sort()).toEqual([...rowWidgets].sort());
  });
});

describe('reducer: the content of the row widgets', () => {
  it('builds a row widget from its template widget with the row uid and the row path', () => {
    const state = drive([
      init(
        repeater('lines', 'lines', 'lineRow', [
          input('quantity', 'lines.items.quantity', { label: 'Quantity', defaultValue: 1 }),
          display('note', { include: { when: '$item.quantity > 1' } }),
        ]),
      ),
      setData({ lines: [{ quantity: 1 }, { quantity: 2 }] }),
    ]);

    expect(state.formHealth).toEqual({ status: 'ok' });
    const rowLayout = templateOf(state, 'lines');
    const [quantity, note] = rowLayout['children'];

    // `toStrictEqual` fails when a key with the value undefined is missing or added.
    expect(state.resolvedSources['lineRow[1]']).toStrictEqual({ ...rowLayout, uid: 'lineRow[1]' });
    expect(state.resolvedSources['quantity[1]']).toStrictEqual({
      ...quantity,
      uid: 'quantity[1]',
      path: 'lines.1.quantity',
    });
    // A widget that is not an input gets no path.
    expect(state.resolvedSources['note[1]']).toStrictEqual({ ...note, uid: 'note[1]' });
  });

  it('gives each row widget the scope of its innermost row and every row around it, outermost first', () => {
    const state = drive([teamsForm(), setData({ teams: [{ devs: [] }, { devs: [{}, {}] }] })]);

    const team0 = { declaredItemPath: 'teams.items', itemPath: 'teams.0', index: 0 };
    const team1 = { declaredItemPath: 'teams.items', itemPath: 'teams.1', index: 1 };
    const dev0 = {
      declaredItemPath: 'teams.items.devs.items',
      itemPath: 'teams.1.devs.0',
      index: 0,
    };
    const dev1 = {
      declaredItemPath: 'teams.items.devs.items',
      itemPath: 'teams.1.devs.1',
      index: 1,
    };

    expect(state.formHealth).toEqual({ status: 'ok' });
    // The static widgets, the repeater and the template are not in a row, so they have no entry.
    expect(state.repeaterItemScopes).toEqual({
      'teamRow[0]': { itemPath: 'teams.0', index: 0 },
      'tname[0]': { itemPath: 'teams.0', index: 0 },
      'devs[0]': { itemPath: 'teams.0', index: 0 },
      'tnote[0]': { itemPath: 'teams.0', index: 0 },
      'teamRow[1]': { itemPath: 'teams.1', index: 1 },
      'tname[1]': { itemPath: 'teams.1', index: 1 },
      'devs[1]': { itemPath: 'teams.1', index: 1 },
      'devRow[1][0]': { itemPath: 'teams.1.devs.0', index: 0 },
      'dname[1][0]': { itemPath: 'teams.1.devs.0', index: 0 },
      'devRow[1][1]': { itemPath: 'teams.1.devs.1', index: 1 },
      'dname[1][1]': { itemPath: 'teams.1.devs.1', index: 1 },
      'tnote[1]': { itemPath: 'teams.1', index: 1 },
    });
    expect(state.repeaterRows).toEqual({
      'teamRow[0]': [team0],
      'tname[0]': [team0],
      'devs[0]': [team0],
      'tnote[0]': [team0],
      'teamRow[1]': [team1],
      'tname[1]': [team1],
      'devs[1]': [team1],
      'devRow[1][0]': [team1, dev0],
      'dname[1][0]': [team1, dev0],
      'devRow[1][1]': [team1, dev1],
      'dname[1][1]': [team1, dev1],
      'tnote[1]': [team1],
    });
  });

  it('keeps each widget outside a row as the flatForm object across derives', () => {
    const initialized = drive([
      init(
        display('title'),
        layout('section', [input('name', 'name')]),
        repeater('users', 'users', 'userRow', [input('userName', 'users.items.name')]),
      ),
    ]);
    const first = reduce(initialized, setData({ users: [{}] }));
    const second = reduce(first, setData({ name: 'Ada', users: [{}, {}] }));

    expect(first.formHealth).toEqual({ status: 'ok' });
    expect(second.formHealth).toEqual({ status: 'ok' });
    for (const uid of [ROOT_UID, 'title', 'section', 'name', 'users']) {
      expect(first.resolvedSources[uid]).toBe(initialized.flatForm[uid]);
      expect(second.resolvedSources[uid]).toBe(initialized.flatForm[uid]);
    }
  });
});

describe('reducer: repeater data that gives no row', () => {
  it.each<[string, unknown]>([
    ['an object with a length and index keys', { 0: {}, length: 1 }],
    ['a string', 'ab'],
    ['a number', 2],
  ])('builds no row when the repeater data is %s', (_description, lines) => {
    const state = drive([
      init(
        repeater('lines', 'lines', 'lineRow', [
          input('quantity', 'lines.items.quantity', { defaultValue: 1 }),
        ]),
      ),
      setData({ lines }),
    ]);

    expect(state.formHealth).toEqual({ status: 'ok' });
    expect(Object.keys(state.resolvedSources)).toEqual([ROOT_UID, 'lines']);
    expect(state.repeaterItemScopes).toEqual({});
    expect(state.repeaterRows).toEqual({});
    // No row input wrote its default.
    expect(state.data['lines']).toBe(lines);
  });
});

describe('reducer: repeater data with empty places', () => {
  const usersForm = () =>
    init(
      repeater('users', 'users', 'userRow', [
        input('name', 'users.items.name', { defaultValue: 'anon' }),
      ]),
    );

  it('builds no row and writes no default for an empty place of the array', () => {
    const users = arrayWithEmptyPlaces(4, { 1: {}, 3: { name: 'Ada' } });

    const state = drive([usersForm(), setData({ users })]);

    expect(state.formHealth).toEqual({ status: 'ok' });
    expect(Object.keys(state.resolvedSources)).toEqual([
      ROOT_UID,
      'users',
      'userRow[1]',
      'name[1]',
      'userRow[3]',
      'name[3]',
    ]);
    const writtenUsers = state.data['users'];
    expect(writtenUsers).toHaveLength(4);
    // The empty places stay empty.
    expect(Object.keys(writtenUsers)).toEqual(['1', '3']);
    expect(writtenUsers[1]).toEqual({ name: 'anon' });
    expect(writtenUsers[3]).toEqual({ name: 'Ada' });
  });

  it('builds a row for an entry of the array that holds undefined', () => {
    const state = drive([usersForm(), setData({ users: [undefined, { name: 'Ada' }] })]);

    expect(state.formHealth).toEqual({ status: 'ok' });
    expect(Object.keys(state.resolvedSources)).toEqual([
      ROOT_UID,
      'users',
      'userRow[0]',
      'name[0]',
      'userRow[1]',
      'name[1]',
    ]);
    expect(state.data['users']).toEqual([{ name: 'anon' }, { name: 'Ada' }]);
  });
});

describe('reducer: path errors of the row widgets', () => {
  it('gives code 11 for a row input whose path only starts with the text of its row path', () => {
    const state = drive([
      init(repeater('lines', 'lines', 'lineRow', [input('total', 'lines.itemsTotal')])),
      setData({ lines: [{}] }),
    ]);

    expect(state.formHealth).toEqual({
      status: 'errored',
      code: 11,
      message: '[11] Path "lines.itemsTotal" is not inside the repeater row "lines.items".',
    });
  });

  type PathErrorCase = {
    form: () => Action;
    dataWithoutRow: Record<string, unknown>;
    widgetsWithoutRow: string[];
    dataWithRow: Record<string, unknown>;
    message: string;
  };

  it.each<[string, PathErrorCase]>([
    [
      'a nested repeater outside the outer row',
      {
        form: () =>
          init(
            repeater('teams', 'teams', 'teamRow', [
              repeater('devs', 'staff', 'devRow', [input('dname', 'staff.items.name')]),
            ]),
          ),
        dataWithoutRow: { teams: [] },
        widgetsWithoutRow: [ROOT_UID, 'teams'],
        dataWithRow: { teams: [{}] },
        message: '[11] Path "staff" is not inside the repeater row "teams.items".',
      },
    ],
    [
      'an input outside its inner row',
      {
        form: () =>
          init(
            repeater('teams', 'teams', 'teamRow', [
              repeater('devs', 'teams.items.devs', 'devRow', [input('dname', 'teams.items.name')]),
            ]),
          ),
        dataWithoutRow: { teams: [{ devs: [] }] },
        widgetsWithoutRow: [ROOT_UID, 'teams', 'teamRow[0]', 'devs[0]'],
        dataWithRow: { teams: [{ devs: [{}] }] },
        message:
          '[11] Path "teams.items.name" is not inside the repeater row "teams.items.devs.items".',
      },
    ],
  ])(
    'reports the path error of %s only when the row exists',
    (_widget, { form, dataWithoutRow, widgetsWithoutRow, dataWithRow, message }) => {
      const withoutRow = drive([form(), setData(dataWithoutRow)]);
      const withRow = drive([form(), setData(dataWithRow)]);

      expect(withoutRow.formHealth).toEqual({ status: 'ok' });
      expect(Object.keys(withoutRow.resolvedSources)).toEqual(widgetsWithoutRow);
      expect(withRow.formHealth).toEqual({ status: 'errored', code: 11, message });
    },
  );
});
