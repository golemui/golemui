import { type StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';
import { type ValidatorFn } from '../form-validator';
import { type FormWidget, type InputWidget } from '../form-widget';
import { identityTranslator } from '../i18n';
import { type Action } from './actions';
import { createInitialState, type State } from './model';
import { reducer } from './reducer';

/**
 * The widgets that exist for the current data, checked through the reducer: each test sends
 * `INITIALIZE` and `SET_DATA`, and reads `resolvedSources`, `repeaterItemScopes` and
 * `repeaterRows` of the state that results.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/store/reducer.repeater-rows.spec.ts
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

const displayChild = (uid: string | undefined, extra: Record<string, unknown> = {}) => ({
  kind: 'display',
  uid,
  type: 'markdownText',
  props: {},
  ...extra,
});

const inputChild = (uid: string, path: string, extra: Record<string, unknown> = {}) => ({
  kind: 'input',
  uid,
  type: 'number',
  path,
  props: {},
  ...extra,
});

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

const pathOf = (widget: FormWidget<string> | undefined) =>
  (widget as InputWidget<any, string> | undefined)?.path;

// `#0` is the root layout that holds the widgets of the form.
const ROOT_UID = '#0';

describe('reducer: widgets outside a repeater', () => {
  it('copies every flatForm widget by reference', () => {
    const state = drive([
      init(inputChild('firstName', 'firstName'), displayChild('note')),
      setData({}),
    ]);

    expect(state.formHealth).toEqual({ status: 'ok' });
    expect(state.resolvedSources['firstName']).toBe(state.flatForm['firstName']);
    expect(state.resolvedSources['note']).toBe(state.flatForm['note']);
    expect(Object.keys(state.resolvedSources)).toEqual([ROOT_UID, 'firstName', 'note']);
    expect(state.repeaterItemScopes).toEqual({});
  });
});

describe('reducer: repeater rows', () => {
  it('produces one subtree per row, the row layout node included', () => {
    const state = drive([
      init(repeater('lineItems', 'lineItems', [displayChild('row-note')])),
      setData({ lineItems: [{ active: true }, { active: false }] }),
    ]);

    expect(Object.keys(state.resolvedSources).sort()).toEqual([
      ROOT_UID,
      'lineItems',
      'lineItems-template[0]',
      'lineItems-template[1]',
      'row-note[0]',
      'row-note[1]',
    ]);
    expect(state.resolvedSources['lineItems']).toBe(state.flatForm['lineItems']);
    expect(state.repeaterItemScopes['row-note[0]']).toEqual({ itemPath: 'lineItems.0', index: 0 });
    expect(state.repeaterItemScopes['row-note[1]']).toEqual({ itemPath: 'lineItems.1', index: 1 });
    expect(state.repeaterItemScopes['lineItems-template[0]']).toEqual({
      itemPath: 'lineItems.0',
      index: 0,
    });
    // The repeater itself is not owned by any row.
    expect(state.repeaterItemScopes['lineItems']).toBeUndefined();
  });

  it('writes the row index into uid and input path', () => {
    const state = drive([
      init(repeater('lineItems', 'lineItems', [inputChild('row-qty', 'lineItems.items.quantity')])),
      setData({ lineItems: [{}, {}] }),
    ]);

    expect(state.resolvedSources['row-qty[0]']).toMatchObject({
      uid: 'row-qty[0]',
      path: 'lineItems.0.quantity',
    });
    expect(state.resolvedSources['row-qty[1]']).toMatchObject({
      uid: 'row-qty[1]',
      path: 'lineItems.1.quantity',
    });
  });

  it('does not rewrite legacy items tokens in when expressions', () => {
    const state = drive([
      init(
        repeater('lineItems', 'lineItems', [
          displayChild('row-note', { include: { when: '$form.lineItems.items.active === true' } }),
        ]),
      ),
      setData({ lineItems: [{}] }),
    ]);

    // The widget of the row keeps the condition as the form definition writes it.
    expect(state.resolvedSources['row-note[0]']).toMatchObject({
      include: { when: '$form.lineItems.items.active === true' },
    });
  });

  it.each([
    ['missing', {}],
    ['empty', { lineItems: [] }],
    ['not an array', { lineItems: { active: true } }],
  ])('produces no rows when the repeater data is %s', (_, data) => {
    const state = drive([
      init(repeater('lineItems', 'lineItems', [displayChild('row-note')])),
      setData(data),
    ]);

    expect(state.formHealth).toEqual({ status: 'ok' });
    expect(Object.keys(state.resolvedSources)).toEqual([ROOT_UID, 'lineItems']);
    expect(state.repeaterItemScopes).toEqual({});
  });

  it('rebuilds both maps from the data on every derive', () => {
    const initialized = drive([
      init(repeater('lineItems', 'lineItems', [displayChild('row-note')])),
    ]);

    const twoRows = reduce(initialized, setData({ lineItems: [{}, {}] }));
    const oneRow = reduce(twoRows, setData({ lineItems: [{}] }));
    const threeRows = reduce(oneRow, setData({ lineItems: [{}, {}, {}] }));

    expect(twoRows.resolvedSources).toHaveProperty('row-note[1]');
    expect(oneRow.resolvedSources).not.toHaveProperty('row-note[1]');
    expect(oneRow.repeaterItemScopes).not.toHaveProperty('row-note[1]');
    expect(threeRows.resolvedSources).toHaveProperty('row-note[2]');
    expect(threeRows.repeaterItemScopes['row-note[2]']).toEqual({
      itemPath: 'lineItems.2',
      index: 2,
    });
  });

  it('keeps a property named items in a repeater path', () => {
    const state = drive([
      init(
        repeater('lines', 'invoice.items', [inputChild('line-name', 'invoice.items.items.name')]),
      ),
      setData({ invoice: { items: [{}, {}] } }),
    ]);

    expect(pathOf(state.resolvedSources['line-name[1]'])).toBe('invoice.items.1.name');
    expect(state.repeaterItemScopes['line-name[1]']).toEqual({
      itemPath: 'invoice.items.1',
      index: 1,
    });
  });

  it('keeps a row field whose name starts with items', () => {
    const state = drive([
      init(repeater('lines', 'lines', [inputChild('line-total', 'lines.items.itemsTotal')])),
      setData({ lines: [{}] }),
    ]);

    expect(pathOf(state.resolvedSources['line-total[0]'])).toBe('lines.0.itemsTotal');
  });

  it('writes the row index into a top-level repeater named items', () => {
    const state = drive([
      init(repeater('items', 'items', [inputChild('item-name', 'items.items.name')])),
      setData({ items: [{}, {}] }),
    ]);

    expect(pathOf(state.resolvedSources['item-name[1]'])).toBe('items.1.name');
  });

  it('writes the row index into a template input bound to the whole row', () => {
    const state = drive([
      init(repeater('tags', 'tags', [inputChild('tag', 'tags.items')])),
      setData({ tags: ['a', 'b'] }),
    ]);

    expect(pathOf(state.resolvedSources['tag[1]'])).toBe('tags.1');
  });

  it('gives the form health code 11 for a template input whose path is outside its row', () => {
    const state = drive([
      init(repeater('lines', 'lines', [inputChild('stray', 'other.name')])),
      setData({ lines: [{}] }),
    ]);

    expect(state.formHealth).toEqual({
      status: 'errored',
      code: 11,
      message: '[11] Path "other.name" is not inside the repeater row "lines.items".',
    });
  });

  it('indexes position uids the same way as authored uids', () => {
    // The template and its second child have no uid, so each one gets a uid from its position.
    const lineItems = {
      kind: 'input',
      uid: 'lineItems',
      type: 'repeater',
      path: 'lineItems',
      props: {
        template: {
          kind: 'layout',
          type: 'flex',
          children: [displayChild('row-note'), displayChild(undefined)],
        },
      },
    };

    const state = drive([
      init(displayChild('first'), displayChild('second'), lineItems),
      setData({ lineItems: [{}] }),
    ]);

    expect(Object.keys(state.resolvedSources).sort()).toEqual([
      ROOT_UID,
      '#0.2.t.1[0]',
      '#0.2.t[0]',
      'first',
      'lineItems',
      'row-note[0]',
      'second',
    ]);
    expect(state.repeaterItemScopes['#0.2.t.1[0]']).toEqual({ itemPath: 'lineItems.0', index: 0 });
  });
});

describe('reducer: nested repeater rows', () => {
  const teams = () =>
    repeater('teams', 'teams', [
      repeater('devs', 'teams.items.devs', [inputChild('dev-name', 'teams.items.devs.items.name')]),
    ]);
  const data = () => ({
    teams: [{ devs: [] }, { devs: [{}] }, { devs: [{ name: 'Alice' }, { name: 'Bob' }] }],
  });

  it('adds the nested container with a concrete path and the outer item scope', () => {
    const { resolvedSources, repeaterItemScopes } = drive([init(teams()), setData(data())]);

    expect(resolvedSources['devs[2]']).toMatchObject({ uid: 'devs[2]', type: 'repeater' });
    expect(pathOf(resolvedSources['devs[2]'])).toBe('teams.2.devs');
    expect(repeaterItemScopes['devs[2]']).toEqual({ itemPath: 'teams.2', index: 2 });
  });

  it('recurses into the nested rows with both indexes and the innermost item scope', () => {
    const { resolvedSources, repeaterItemScopes } = drive([init(teams()), setData(data())]);

    expect(pathOf(resolvedSources['dev-name[2][0]'])).toBe('teams.2.devs.0.name');
    expect(pathOf(resolvedSources['dev-name[2][1]'])).toBe('teams.2.devs.1.name');
    expect(resolvedSources).toHaveProperty('devs-template[2][1]');
    expect(repeaterItemScopes['dev-name[2][1]']).toEqual({ itemPath: 'teams.2.devs.1', index: 1 });
    expect(repeaterItemScopes['devs-template[2][0]']).toEqual({
      itemPath: 'teams.2.devs.0',
      index: 0,
    });
    // An outer row without inner rows only gets its own subtree.
    expect(resolvedSources).toHaveProperty('devs[0]');
    expect(resolvedSources).not.toHaveProperty('dev-name[0][0]');
    expect(pathOf(resolvedSources['dev-name[1][0]'])).toBe('teams.1.devs.0.name');
  });

  it('records the rows that own every row widget, outermost first', () => {
    const { repeaterRows } = drive([init(teams()), setData(data())]);

    expect(repeaterRows['dev-name[2][1]']).toEqual([
      { declaredItemPath: 'teams.items', itemPath: 'teams.2', index: 2 },
      { declaredItemPath: 'teams.items.devs.items', itemPath: 'teams.2.devs.1', index: 1 },
    ]);
    expect(repeaterRows['devs[2]']).toEqual([
      { declaredItemPath: 'teams.items', itemPath: 'teams.2', index: 2 },
    ]);
    // The top-level repeater is not owned by any row.
    expect(repeaterRows['teams']).toBeUndefined();
  });

  it('keeps a property named items at both nesting levels', () => {
    // Each order has an `items` array, so the inner repeater is declared at `orders.items.items`.
    const orders = repeater('orders', 'orders', [
      repeater('order-lines', 'orders.items.items', [
        inputChild('sku', 'orders.items.items.items.sku'),
      ]),
    ]);

    const { resolvedSources, repeaterItemScopes } = drive([
      init(orders),
      setData({ orders: [{ items: [] }, { items: [{}, {}] }] }),
    ]);

    expect(pathOf(resolvedSources['order-lines[1]'])).toBe('orders.1.items');
    expect(pathOf(resolvedSources['sku[1][1]'])).toBe('orders.1.items.1.sku');
    expect(repeaterItemScopes['sku[1][1]']).toEqual({ itemPath: 'orders.1.items.1', index: 1 });
  });
});
