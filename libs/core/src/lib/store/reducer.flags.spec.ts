import { type StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';
import { type ValidatorFn } from '../form-validator';
import { identityTranslator } from '../i18n';
import { type ExpressionFunctions } from '../shared';
import { type Action } from './actions';
import { createInitialState, type State } from './model';
import { reducer } from './reducer';

/**
 * The flags of widgets inside repeater rows and of conditions that call `$fn`, checked through
 * the reducer: each test sends `INITIALIZE` and `SET_DATA`, and reads `widgetFlags` of the state
 * that results.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/store/reducer.flags.spec.ts
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

const displayChild = (uid: string, extra: Record<string, unknown> = {}) => ({
  kind: 'display',
  uid,
  type: 'markdownText',
  props: {},
  ...extra,
});

const repeater = (
  uid: string,
  path: string,
  children: unknown[],
  extra: Record<string, unknown> = {},
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
      children,
    },
  },
  ...extra,
});

/** Initializes a form with the given widgets, sets the data, and returns the state that results. */
const runFlagsPipeline = (
  widgets: Record<string, unknown>[],
  data: Record<string, any>,
  functions: ExpressionFunctions = {},
  states?: Record<string, string>,
): State => {
  const reduce = reducer({
    validators,
    validateOn: 'eager',
    localization: identityTranslator('en-US'),
    functions,
  });
  const formDef = states ? { states, form: widgets } : { form: widgets };
  const actions: Action[] = [
    { type: 'INITIALIZE', payload: { formName: 'test-form', formDef } },
    { type: 'SET_DATA', payload: { data } },
  ];
  return actions.reduce(reduce, createInitialState('en-US'));
};

/** The `hidden` flag of the widget `uid` in each of the first `rowCount` rows. */
const hiddenInRows = (state: State, uid: string, rowCount: number): (boolean | undefined)[] =>
  Array.from(
    { length: rowCount },
    (_, rowIndex) => state.widgetFlags[`${uid}[${rowIndex}]`]?.hidden,
  );

describe('reducer: $item / $index in item when conditions', () => {
  it('evaluates include.when with $item per item', () => {
    const next = runFlagsPipeline(
      [
        repeater('lineItems', 'lineItems', [
          displayChild('row-note', { include: { when: '$item.active === true' } }),
        ]),
      ],
      { lineItems: [{ active: true }, { active: false }] },
    );

    expect(next.widgetFlags['row-note[0]'].hidden).toBe(false);
    expect(next.widgetFlags['row-note[1]'].hidden).toBe(true);
  });

  it('evaluates include.when with $index per item', () => {
    const next = runFlagsPipeline(
      [
        repeater('lineItems', 'lineItems', [
          displayChild('row-note', { include: { when: '$index === 0' } }),
        ]),
      ],
      { lineItems: [{}, {}] },
    );

    expect(next.widgetFlags['row-note[0]'].hidden).toBe(false);
    expect(next.widgetFlags['row-note[1]'].hidden).toBe(true);
  });

  it('evaluates exclude.when and disabled.when with $item', () => {
    const next = runFlagsPipeline(
      [
        repeater('lineItems', 'lineItems', [
          displayChild('row-note', { exclude: { when: '$item.done === true' } }),
          {
            kind: 'input',
            uid: 'row-qty',
            type: 'number',
            path: 'lineItems.items.quantity',
            disabled: { when: '$item.locked === true' },
          },
        ]),
      ],
      {
        lineItems: [
          { done: true, locked: false },
          { done: false, locked: true },
        ],
      },
    );

    expect(next.widgetFlags['row-note[0]'].hidden).toBe(true);
    expect(next.widgetFlags['row-note[1]'].hidden).toBe(false);
    expect(next.widgetFlags['row-qty[0]'].disabled).toBe(false);
    expect(next.widgetFlags['row-qty[1]'].disabled).toBe(true);
  });

  it('keeps the legacy items path token working alongside $item', () => {
    const next = runFlagsPipeline(
      [
        repeater('lineItems', 'lineItems', [
          displayChild('row-note', {
            include: { when: '$form.lineItems.items.active === true' },
          }),
        ]),
      ],
      { lineItems: [{ active: true }, { active: false }] },
    );

    expect(next.widgetFlags['row-note[0]'].hidden).toBe(false);
    expect(next.widgetFlags['row-note[1]'].hidden).toBe(true);
  });

  it('evaluates the include.when of a nested repeater container per outer item', () => {
    const next = runFlagsPipeline(
      [
        repeater('teams', 'teams', [
          repeater('devs', 'teams.items.devs', [displayChild('dev-name')], {
            include: { when: '$item.showDevs === true' },
          }),
        ]),
      ],
      {
        teams: [
          { showDevs: true, devs: [{}] },
          { showDevs: false, devs: [{}] },
        ],
      },
    );

    expect(next.widgetFlags['devs[0]']).toEqual({ hidden: false });
    expect(next.widgetFlags['devs[1]']).toEqual({ hidden: true });
  });

  it('creates no flag entry for repeater item widgets without reactive flags', () => {
    const next = runFlagsPipeline(
      [repeater('lineItems', 'lineItems', [displayChild('row-note')])],
      { lineItems: [{}, {}] },
    );

    expect(next.formHealth).toEqual({ status: 'ok' });
    expect(next.widgetFlags['row-note[0]']).toBeUndefined();
    expect(next.widgetFlags['row-note[1]']).toBeUndefined();
  });
});

describe('reducer: $fn in when conditions', () => {
  const functions: ExpressionFunctions = {
    hasItems: (items: unknown[] | undefined) => (items?.length ?? 0) > 0,
    isEven: (value: number) => value % 2 === 0,
  };

  it('evaluates include.when with a $fn call outside a repeater', () => {
    const widgets = [displayChild('summary', { include: { when: '$fn.hasItems($form.items)' } })];

    expect(runFlagsPipeline(widgets, { items: [] }, functions).widgetFlags['summary'].hidden).toBe(
      true,
    );

    expect(runFlagsPipeline(widgets, { items: [1] }, functions).widgetFlags['summary'].hidden).toBe(
      false,
    );
  });

  it('evaluates include.when combining $fn with $item inside a repeater template', () => {
    const next = runFlagsPipeline(
      [
        repeater('lineItems', 'lineItems', [
          displayChild('row-note', { include: { when: '$fn.isEven($item.quantity)' } }),
        ]),
      ],
      { lineItems: [{ quantity: 2 }, { quantity: 3 }] },
      functions,
    );

    expect(next.widgetFlags['row-note[0]'].hidden).toBe(false);
    expect(next.widgetFlags['row-note[1]'].hidden).toBe(true);
  });
});

describe('reducer: references to the row in when conditions', () => {
  /** A repeater `users` whose rows have one display widget `note` with the given condition. */
  const usersWithNote = (when: string) => [
    repeater('users', 'users', [displayChild('note', { include: { when } })]),
  ];

  it('evaluates a condition without a row reference against the form data', () => {
    const next = runFlagsPipeline(usersWithNote('$form.active'), {
      active: true,
      users: [{}, {}, {}],
    });

    expect(hiddenInRows(next, 'note', 3)).toEqual([false, false, false]);
  });

  it('reads the row of the widget for a reference to the row', () => {
    const next = runFlagsPipeline(usersWithNote('$form.users.items.active'), {
      users: [{ active: false }, { active: false }, { active: true }],
    });

    expect(hiddenInRows(next, 'note', 3)).toEqual([true, true, false]);
  });

  it('names the row of the widget in a reference that is written without $form, inside a text', () => {
    // The host function gets the text of the reference and returns the row number that it names.
    const functions: ExpressionFunctions = {
      rowNumberOf: (reference: string) => {
        const match = /^users(?:\.(\d+)|\[(\d+)\])\.name$/.exec(reference);
        return match ? Number(match[1] ?? match[2]) : -1;
      },
    };

    const next = runFlagsPipeline(
      usersWithNote("$fn.rowNumberOf('users.items.name') === $index"),
      { users: [{}, {}, {}] },
      functions,
    );

    expect(next.formHealth).toEqual({ status: 'ok' });
    expect(hiddenInRows(next, 'note', 3)).toEqual([false, false, false]);
  });

  it('reads the row of the widget for every reference to the row', () => {
    const next = runFlagsPipeline(usersWithNote('$form.users.items.a && !$form.users.items.b'), {
      users: [
        { a: true, b: false },
        { a: true, b: true },
        { a: false, b: false },
      ],
    });

    expect(next.formHealth).toEqual({ status: 'ok' });
    expect(hiddenInRows(next, 'note', 3)).toEqual([false, true, true]);
  });

  it('reads the inner and the outer row for the references of a nested repeater', () => {
    const next = runFlagsPipeline(
      [
        repeater('teams', 'teams', [
          repeater('devs', 'teams.items.devs', [
            displayChild('dev-note', {
              include: { when: '$form.teams.items.devs.items.active && $form.teams.items.open' },
            }),
          ]),
        ]),
      ],
      {
        teams: [
          { open: true, devs: [{ active: true }, { active: false }] },
          { open: false, devs: [{ active: true }] },
        ],
      },
    );

    expect(next.formHealth).toEqual({ status: 'ok' });
    expect(next.widgetFlags['dev-note[0][0]']).toEqual({ hidden: false });
    expect(next.widgetFlags['dev-note[0][1]']).toEqual({ hidden: true });
    expect(next.widgetFlags['dev-note[1][0]']).toEqual({ hidden: true });
  });

  it('keeps an items segment after the reference to the row as a property name', () => {
    // `addresses` is an object with a property `items`. The form has no repeater at that path.
    const next = runFlagsPipeline(usersWithNote('$form.users.items.addresses.items.active'), {
      users: [
        { addresses: { items: { active: true } } },
        { addresses: { items: { active: false } } },
      ],
    });

    expect(next.formHealth).toEqual({ status: 'ok' });
    expect(hiddenInRows(next, 'note', 2)).toEqual([false, true]);
  });

  describe('items with optional chaining', () => {
    it('reads the row for a reference that is written with ?. separators', () => {
      // If the reference were not found, `teams.items` would read a property of the array, and
      // every row would be hidden.
      const next = runFlagsPipeline(
        [
          repeater('teams', 'repeaters.teams', [
            displayChild('note', {
              include: { when: '$form?.repeaters?.teams.items?.teamName?.length > 0' },
            }),
          ]),
        ],
        { repeaters: { teams: [{ teamName: 'Core' }, {}, null] } },
      );

      expect(next.formHealth).toEqual({ status: 'ok' });
      expect(hiddenInRows(next, 'note', 3)).toEqual([false, true, true]);
    });

    it('reads the inner row for a nested reference that is written with ?. separators', () => {
      // If the reference were not found, the first inner row would be hidden too.
      const next = runFlagsPipeline(
        [
          repeater('teams', 'teams', [
            repeater('devs', 'teams.items.devs', [
              displayChild('dev-note', {
                include: { when: '$form.teams.items?.devs?.items?.active === true' },
              }),
            ]),
          ]),
        ],
        { teams: [{ devs: [{ active: true }, null, {}] }] },
      );

      expect(next.formHealth).toEqual({ status: 'ok' });
      expect(next.widgetFlags['dev-note[0][0]']).toEqual({ hidden: false });
      expect(next.widgetFlags['dev-note[0][1]']).toEqual({ hidden: true });
      expect(next.widgetFlags['dev-note[0][2]']).toEqual({ hidden: true });
    });

    it('keeps the ?. separators of a reference that is written without $form', () => {
      // `users` is not a name of the condition scope. With `.` in place of `?.` the condition throws.
      const next = runFlagsPipeline(usersWithNote('users?.items?.active === true'), {
        users: [{ active: true }, {}],
      });

      expect(next.formHealth).toEqual({ status: 'ok' });
      expect(hiddenInRows(next, 'note', 2)).toEqual([true, true]);
    });

    it('keeps the ?. separators of a nested reference that is written without $form', () => {
      // `teams` is not a name of the condition scope. With `.` in place of `?.` the condition throws.
      const next = runFlagsPipeline(
        [
          repeater('teams', 'teams', [
            repeater('devs', 'teams.items.devs', [
              displayChild('dev-note', {
                include: { when: 'teams?.items?.devs?.items?.active === true' },
              }),
            ]),
          ]),
        ],
        { teams: [{ devs: [{ active: true }, {}] }] },
      );

      expect(next.formHealth).toEqual({ status: 'ok' });
      expect(next.widgetFlags['dev-note[0][0]']).toEqual({ hidden: true });
      expect(next.widgetFlags['dev-note[0][1]']).toEqual({ hidden: true });
    });
  });

  describe('items segments that are not a row token', () => {
    it('keeps a property named items before the row token', () => {
      const next = runFlagsPipeline(
        [
          repeater('lines', 'invoice.items', [
            displayChild('note', {
              include: { when: "$form.invoice.items.items.name === 'keep'" },
            }),
          ]),
        ],
        { invoice: { items: [{ name: 'keep' }, { name: 'drop' }] } },
      );

      expect(next.formHealth).toEqual({ status: 'ok' });
      expect(hiddenInRows(next, 'note', 2)).toEqual([false, true]);
    });

    it('keeps an items property of $item', () => {
      const next = runFlagsPipeline(
        [
          repeater('items', 'items', [
            displayChild('note', { include: { when: '$item.items.length > 0' } }),
          ]),
        ],
        { items: [{ items: ['a'] }, { items: [] }] },
      );

      expect(next.formHealth).toEqual({ status: 'ok' });
      expect(hiddenInRows(next, 'note', 2)).toEqual([false, true]);
    });

    it('keeps an unrelated property named items', () => {
      const next = runFlagsPipeline(usersWithNote('$form.cart.items.length > 0'), {
        cart: { items: ['a'] },
        users: [{}, {}],
      });

      expect(next.formHealth).toEqual({ status: 'ok' });
      expect(hiddenInRows(next, 'note', 2)).toEqual([false, false]);
    });

    it('keeps a segment that only starts with items', () => {
      // The array has no property `itemsTotal`. Each row has one, and a wrong read of the row
      // would find it.
      const next = runFlagsPipeline(usersWithNote('$form.users.itemsTotal === undefined'), {
        users: [
          { Total: 1, itemsTotal: 1 },
          { Total: 1, itemsTotal: 1 },
        ],
      });

      expect(next.formHealth).toEqual({ status: 'ok' });
      expect(hiddenInRows(next, 'note', 2)).toEqual([false, false]);
    });

    it('keeps a path that only ends with the row path', () => {
      const next = runFlagsPipeline(usersWithNote('$form.club.users.items.active'), {
        club: { users: { items: { active: true } } },
        users: [{}, {}],
      });

      expect(next.formHealth).toEqual({ status: 'ok' });
      expect(hiddenInRows(next, 'note', 2)).toEqual([false, false]);
    });
  });

  it('reads the row of the widget in the when condition of every flag field', () => {
    const next = runFlagsPipeline(
      [
        repeater('users', 'users', [
          displayChild('row-note', { include: { when: '$form.users.items.active' } }),
          {
            kind: 'input',
            uid: 'row-qty',
            type: 'number',
            path: 'users.items.quantity',
            exclude: { when: '$form.users.items.done' },
            disabled: { when: '$form.users.items.locked' },
            readonly: { when: '$form.users.items.frozen' },
          },
        ]),
      ],
      {
        users: [
          { active: true, done: false, locked: true, frozen: false },
          { active: false, done: true, locked: false, frozen: true },
        ],
      },
    );

    expect(next.formHealth).toEqual({ status: 'ok' });
    expect(next.widgetFlags['row-note[0]']).toEqual({ hidden: false });
    expect(next.widgetFlags['row-note[1]']).toEqual({ hidden: true });
    expect(next.widgetFlags['row-qty[0]']).toEqual({
      hidden: false,
      disabled: true,
      readonly: false,
    });
    expect(next.widgetFlags['row-qty[1]']).toEqual({
      hidden: true,
      disabled: false,
      readonly: true,
    });
    // The widget of the row keeps the conditions as the form definition writes them.
    expect(next.resolvedSources['row-qty[1]']).toMatchObject({
      exclude: { when: '$form.users.items.done' },
      disabled: { when: '$form.users.items.locked' },
      readonly: { when: '$form.users.items.frozen' },
    });
  });

  it('leaves state-based and boolean flag fields untouched', () => {
    const next = runFlagsPipeline(
      [
        repeater('users', 'users', [
          // One state-based field for each widget, so that this field alone decides the flag.
          {
            kind: 'input',
            uid: 'row-qty',
            type: 'number',
            path: 'users.items.quantity',
            include: { in: ['editing'] },
            disabled: true,
          },
          displayChild('row-note', { include: { in: ['summary'] } }),
          displayChild('row-hint', { exclude: { from: ['editing'] } }),
          {
            kind: 'input',
            uid: 'row-total',
            type: 'number',
            path: 'users.items.total',
            exclude: { from: ['summary'] },
          },
        ]),
      ],
      { users: [{}] },
      {},
      { editing: 'true', summary: 'false' },
    );

    expect(next.formHealth).toEqual({ status: 'ok' });
    expect(next.widgetFlags['row-qty[0]']).toEqual({ hidden: false });
    expect(next.widgetFlags['row-note[0]']).toEqual({ hidden: true });
    expect(next.widgetFlags['row-hint[0]']).toEqual({ hidden: true });
    expect(next.widgetFlags['row-total[0]']).toEqual({ hidden: false });
    expect(next.calculatedWidgets['row-qty[0]'].current).toMatchObject({
      include: { in: ['editing'] },
      disabled: true,
    });
    expect(next.calculatedWidgets['row-total[0]'].current).toMatchObject({
      exclude: { from: ['summary'] },
    });
  });
});
