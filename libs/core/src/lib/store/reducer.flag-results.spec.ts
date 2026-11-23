import { type StandardSchemaV1 } from '@standard-schema/spec';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type ValidatorFn } from '../form-validator';
import { type ActionWidget, type InputWidget } from '../form-widget';
import { identityTranslator } from '../i18n';
import { type ExpressionFunctions } from '../shared';
import { type Action } from './actions';
import { createInitialState, type State } from './model';
import { reducer } from './reducer';

/**
 * The results of the conditions `include`, `exclude`, `disabled` and `readonly`, checked through
 * the reducer: each test sends `INITIALIZE` and `SET_DATA`, sometimes `VALIDATE_ALL`, and reads
 * `widgetFlags`, `calculatedWidgets` and the form health of the state that results.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/store/reducer.flag-results.spec.ts
 */

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

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

const setData = (data: Record<string, any>): Action => ({
  type: 'SET_DATA',
  payload: { data },
});

const validateAllAction: Action = { type: 'VALIDATE_ALL' };

/**
 * Sends `INITIALIZE` with the form definition to a new reducer, then the given actions.
 *
 * @returns The state after the last action.
 */
const drive = (
  formDef: Record<string, unknown>,
  actions: Action[],
  functions: ExpressionFunctions = {},
): State => {
  const reduce = reducer({
    validators: validators as ValidatorFn<any>,
    validateOn: 'eager',
    localization: identityTranslator('en-US'),
    functions,
  });
  const initialize: Action = {
    type: 'INITIALIZE',
    payload: { formName: 'test-form', formDef },
  };
  return [initialize, ...actions].reduce(reduce, createInitialState('en-US'));
};

/** Sends `INITIALIZE` and `SET_DATA` to a new reducer and returns the state after the derive. */
const run = (
  formDef: Record<string, unknown>,
  data: Record<string, any> = {},
  functions: ExpressionFunctions = {},
): State => drive(formDef, [setData(data)], functions);

const heading = (uid: string, extra: Record<string, unknown> = {}) => ({
  kind: 'display',
  uid,
  type: 'heading',
  ...extra,
});

const textInput = (uid: string, path: string, extra: Record<string, unknown> = {}) => ({
  kind: 'input',
  uid,
  type: 'textinput',
  path,
  ...extra,
});

const button = (uid: string, extra: Record<string, unknown> = {}) => ({
  kind: 'action',
  uid,
  type: 'button',
  ...extra,
});

const layout = (uid: string, children: unknown[], extra: Record<string, unknown> = {}) => ({
  kind: 'layout',
  uid,
  type: 'flex',
  children,
  ...extra,
});

/** A repeater whose row layout has the uid `<uid>Row`. */
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
  props: { template: layout(`${uid}Row`, children) },
  ...extra,
});

/** Host functions for conditions that throw. The message names the condition. */
const failingFunctions: ExpressionFunctions = {
  fail: (name: string) => {
    throw new Error(`${name} failed`);
  },
};

const inputOf = (state: State, uid: string): InputWidget<any, string> =>
  state.calculatedWidgets[uid].current as InputWidget<any, string>;

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('reducer: the results of the flag conditions', () => {
  describe('the order of evaluation', () => {
    it('evaluates the conditions in document order, with the rows of a repeater after it', () => {
      const calls: string[] = [];
      const functions: ExpressionFunctions = {
        record: (name: string) => {
          calls.push(name);
          return true;
        },
      };
      // The keys of `all` are in the reverse order of the evaluation. Its exclude condition is
      // false, so the widget is visible.
      const formDef = {
        form: [
          heading('first', { include: { when: "$fn.record('first')" } }),
          textInput('all', 'all', {
            readonly: { when: "$fn.record('all readonly')" },
            disabled: { when: "$fn.record('all disabled')" },
            exclude: { when: "!$fn.record('all exclude')" },
            include: { when: "$fn.record('all include')" },
          }),
          repeater(
            'users',
            'users',
            [
              heading('rowA', { include: { when: "$fn.record('rowA ' + $index)" } }),
              heading('rowB', { include: { when: "$fn.record('rowB ' + $index)" } }),
            ],
            { include: { when: "$fn.record('users')" } },
          ),
          heading('after', { include: { when: "$fn.record('after')" } }),
        ],
      };

      const state = run(formDef, { users: [{}, {}] }, functions);

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(state.widgetFlags['all']).toEqual({ hidden: false, disabled: true, readonly: true });
      expect(calls).toEqual([
        'first',
        'all include',
        'all exclude',
        'all disabled',
        'all readonly',
        'users',
        'rowA 0',
        'rowB 0',
        'rowA 1',
        'rowB 1',
        'after',
      ]);
    });

    it('reports the error of include when all four conditions of an input throw', () => {
      const formDef = {
        form: [
          textInput('name', 'name', {
            include: { when: "$fn.fail('include')" },
            exclude: { when: "$fn.fail('exclude')" },
            disabled: { when: "$fn.fail('disabled')" },
            readonly: { when: "$fn.fail('readonly')" },
          }),
        ],
      };

      const state = run(formDef, {}, failingFunctions);

      expect(state.formHealth).toEqual({
        status: 'errored',
        code: 11,
        message: '[11] include failed',
      });
    });

    it('reports the error of the first widget in document order when two conditions throw', () => {
      // The uids are in the reverse order of the alphabet.
      const formDef = {
        form: [
          heading('zeta', { include: { when: "$fn.fail('zeta')" } }),
          heading('alpha', { include: { when: "$fn.fail('alpha')" } }),
        ],
      };

      const state = run(formDef, {}, failingFunctions);

      expect(state.formHealth).toEqual({
        status: 'errored',
        code: 11,
        message: '[11] zeta failed',
      });
    });

    it('reports the error of a row widget before the error of a widget after the repeater', () => {
      const formDef = {
        form: [
          repeater('users', 'users', [
            heading('rowNote', { include: { when: "$fn.fail('row ' + $index)" } }),
          ]),
          heading('after', { include: { when: "$fn.fail('after')" } }),
        ],
      };

      const state = run(formDef, { users: [{}] }, failingFunctions);

      expect(state.formHealth).toEqual({
        status: 'errored',
        code: 11,
        message: '[11] row 0 failed',
      });
    });
  });

  describe('include together with exclude', () => {
    const states = { on: 'true', off: 'false' };
    const includeThat = (kind: 'in' | 'when', result: boolean) =>
      kind === 'in' ? { in: [result ? 'on' : 'off'] } : { when: String(result) };
    const excludeThat = (kind: 'from' | 'when', result: boolean) =>
      kind === 'from' ? { from: [result ? 'on' : 'off'] } : { when: String(result) };
    const pairs: ['in' | 'when', 'from' | 'when'][] = [
      ['in', 'from'],
      ['in', 'when'],
      ['when', 'from'],
      ['when', 'when'],
    ];

    it.each(pairs)(
      'shows a widget whose include.%s is false and whose exclude.%s is false',
      (includeKind, excludeKind) => {
        // The result of `exclude` alone is used. BEHAVIOUR.md, rule 16, describes another result
        // for this case and has the status `not yet`.
        const formDef = {
          states,
          form: [
            heading('title', {
              include: includeThat(includeKind, false),
              exclude: excludeThat(excludeKind, false),
            }),
          ],
        };

        const state = run(formDef);

        expect(state.formHealth).toEqual({ status: 'ok' });
        expect(state.widgetFlags['title']).toEqual({ hidden: false });
      },
    );

    it.each(pairs)(
      'hides a widget whose include.%s is true and whose exclude.%s is true',
      (includeKind, excludeKind) => {
        // With the include condition alone, the widget is shown.
        const formDef = {
          states,
          form: [
            heading('title', {
              include: includeThat(includeKind, true),
              exclude: excludeThat(excludeKind, true),
            }),
          ],
        };

        const state = run(formDef);

        expect(state.formHealth).toEqual({ status: 'ok' });
        expect(state.widgetFlags['title']).toEqual({ hidden: true });
      },
    );
  });

  describe('the state lists of include.in and exclude.from', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('shows a widget whose exclude.from names a state that the form does not declare', () => {
      // INITIALIZE prints an error for the state that is not declared.
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const formDef = {
        states: { known: 'true' },
        form: [heading('title', { exclude: { from: ['nope'] } })],
      };

      const state = run(formDef);

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(state.widgetFlags['title']).toEqual({ hidden: false });
    });

    it('hides a widget whose include.in list is empty', () => {
      const formDef = {
        states: { known: 'true' },
        form: [heading('title', { include: { in: [] } })],
      };

      const state = run(formDef);

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(state.widgetFlags['title']).toEqual({ hidden: true });
    });

    it('shows a widget whose exclude.from list is empty', () => {
      const formDef = {
        states: { known: 'true' },
        form: [heading('title', { exclude: { from: [] } })],
      };

      const state = run(formDef);

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(state.widgetFlags['title']).toEqual({ hidden: false });
    });

    it.each([
      ['a', { a: 'true', b: 'false' }],
      ['b', { a: 'false', b: 'true' }],
    ])(
      'shows a widget whose include.in lists two states when only state %s is active',
      (_active, states) => {
        const formDef = {
          states,
          form: [heading('title', { include: { in: ['a', 'b'] } })],
        };

        const state = run(formDef);

        expect(state.formHealth).toEqual({ status: 'ok' });
        expect(state.widgetFlags['title']).toEqual({ hidden: false });
      },
    );

    it.each([
      ['a', { a: 'true', b: 'false' }],
      ['b', { a: 'false', b: 'true' }],
    ])(
      'hides a widget whose exclude.from lists two states when only state %s is active',
      (_active, states) => {
        const formDef = {
          states,
          form: [heading('title', { exclude: { from: ['a', 'b'] } })],
        };

        const state = run(formDef);

        expect(state.formHealth).toEqual({ status: 'ok' });
        expect(state.widgetFlags['title']).toEqual({ hidden: true });
      },
    );
  });

  it.each([
    ["'yes'", 'a string'],
    ['1', 'a number'],
    ['({})', 'an object'],
    ['$form.missing', 'undefined'],
  ])(
    'reads the when condition %s, which gives %s, as false in each of the four conditions',
    (when) => {
      const formDef = {
        form: [
          heading('included', { include: { when } }),
          heading('excluded', { exclude: { when } }),
          textInput('name', 'name', { disabled: { when }, readonly: { when } }),
        ],
      };

      const state = run(formDef);

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(state.widgetFlags['included']).toEqual({ hidden: true });
      expect(state.widgetFlags['excluded']).toEqual({ hidden: false });
      expect(state.widgetFlags['name']).toEqual({ disabled: false, readonly: false });
    },
  );

  it('gives no flag entry for a boolean disabled or readonly, and copies the boolean into the widget', () => {
    const formDef = {
      form: [
        textInput('name', 'name', { disabled: true, readonly: true }),
        button('save', { disabled: true }),
      ],
    };

    const state = run(formDef);

    expect(state.formHealth).toEqual({ status: 'ok' });
    expect(state.widgetFlags).toEqual({});
    expect(inputOf(state, 'name').disabled).toBe(true);
    expect(inputOf(state, 'name').readonly).toBe(true);
    expect((state.calculatedWidgets['save'].current as ActionWidget<string>).disabled).toBe(true);
  });

  it.each([
    ['a condition that is true', 'true'],
    ['a condition that the check rejects', '$form.tags.pop()'],
  ])(
    'ignores readonly on an action and disabled on a display and a layout, with %s',
    (_description, when) => {
      const formDef = {
        form: [
          button('save', { readonly: { when } }),
          heading('title', { disabled: { when } }),
          layout('box', [], { disabled: { when } }),
        ],
      };

      const state = run(formDef, { tags: ['a'] });

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(state.widgetFlags).toEqual({});
      expect(state.resolvedSources['save']).not.toHaveProperty('readonly');
      expect(state.resolvedSources['title']).not.toHaveProperty('disabled');
      expect(state.resolvedSources['box']).not.toHaveProperty('disabled');
      expect(state.calculatedWidgets['save'].current).not.toHaveProperty('readonly');
      expect(state.calculatedWidgets['title'].current).not.toHaveProperty('disabled');
      expect(state.calculatedWidgets['box'].current).not.toHaveProperty('disabled');
      expect(state.data).toEqual({ tags: ['a'] });
    },
  );

  describe('widgets below a hidden widget', () => {
    it('hides every widget when the root layout of the form has an include that is false', () => {
      const formDef = {
        form: {
          uid: 'root',
          kind: 'layout',
          type: 'grid',
          include: { when: 'false' },
          children: [
            heading('title'),
            textInput('name', 'name'),
            layout('section', [heading('note')]),
            repeater('users', 'users', [heading('cell')]),
          ],
        },
      };

      const state = run(formDef, { users: [{}] });

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(state.widgetFlags).toEqual({
        root: { hidden: true },
        title: { hidden: true },
        name: { hidden: true },
        section: { hidden: true },
        note: { hidden: true },
        users: { hidden: true },
        'usersRow[0]': { hidden: true },
        'cell[0]': { hidden: true },
      });
      expect(state.calculatedWidgets).toEqual({});
    });

    it('hides a widget inside a visible layout that is inside a hidden layout', () => {
      const formDef = {
        form: [
          layout('outer', [layout('inner', [heading('leaf')], { include: { when: 'true' } })], {
            include: { when: 'false' },
          }),
        ],
      };

      const state = run(formDef);

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(state.widgetFlags['outer']).toEqual({ hidden: true });
      expect(state.widgetFlags['inner'].hidden).toBe(true);
      expect(state.widgetFlags['leaf']).toEqual({ hidden: true });
      expect(state.calculatedWidgets).not.toHaveProperty('leaf');
    });

    it('keeps the rows of a repeater visible when a hidden plain input has the path above it', () => {
      const formDef = {
        form: [
          textInput('a', 'a', { include: { when: 'false' } }),
          repeater('list', 'a.b', [heading('cell')]),
        ],
      };

      const state = run(formDef, { a: { b: [{}] } });

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(state.widgetFlags).toEqual({ a: { hidden: true } });
      expect(state.calculatedWidgets['listRow[0]'].current.uid).toBe('listRow[0]');
      expect(state.calculatedWidgets['cell[0]'].current.uid).toBe('cell[0]');
    });
  });

  describe('references to the row in the conditions of a row widget', () => {
    /** A repeater `users` whose rows have one display widget `note` with the given condition. */
    const usersWithNote = (when: string) => ({
      form: [repeater('users', 'users', [heading('note', { include: { when } })])],
    });

    it('reads the whole row for a reference to the row with nothing after it', () => {
      // Without the row, `$form.users.items` is a property of the array and is undefined.
      const state = run(usersWithNote('!!$form.users.items'), { users: [{}, null] });

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(state.widgetFlags['note[0]']).toEqual({ hidden: false });
      expect(state.widgetFlags['note[1]']).toEqual({ hidden: true });
    });

    it('replaces only the reference to its own row in a widget of an outer row', () => {
      // `devs?.items` then reads a property of the inner array, which is undefined. With the
      // reference to the inner row replaced too, the condition reads the name. With no reference
      // replaced, it throws.
      const formDef = {
        form: [
          repeater('teams', 'teams', [
            heading('teamNote', {
              include: { when: '$form.teams.items.devs?.items?.name === undefined' },
            }),
            repeater('devs', 'teams.items.devs', [heading('devName')]),
          ]),
        ],
      };

      const state = run(formDef, { teams: [{ devs: [{ name: 'A' }] }] });

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(state.widgetFlags['teamNote[0]']).toEqual({ hidden: false });
    });

    it('does not replace a reference to the row in a widget outside the repeater', () => {
      const formDef = {
        form: [
          repeater('users', 'users', [heading('cell')]),
          heading('summary', { include: { when: '$form.users.items.active === true' } }),
        ],
      };

      const state = run(formDef, { users: [{ active: true }] });

      expect(state.formHealth).toEqual({
        status: 'errored',
        code: 11,
        message: "[11] Cannot read properties of undefined (reading 'active')",
      });
    });
  });

  describe('$errors in the conditions of a row widget', () => {
    /** A repeater `users` whose rows have a required input `name` and the given widgets. */
    const usersWithRequiredName = (...rowWidgets: unknown[]) =>
      repeater('users', 'users', [
        textInput('name', 'users.items.name', { validator: { required: true } }),
        ...rowWidgets,
      ]);

    it('does not replace a reference to the row that follows $errors.', () => {
      // `$errors.users.0.name` holds the error of row 0. A replaced reference would read it.
      const formDef = {
        form: [
          usersWithRequiredName(
            heading('note', { include: { when: '$errors.users?.items?.name === undefined' } }),
          ),
        ],
      };

      const state = drive(formDef, [setData({ users: [{}] }), validateAllAction]);

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(state.validations['users.0.name']).toEqual(['required']);
      expect(state.widgetFlags['note[0]']).toEqual({ hidden: false });
    });

    it('reads the error of its own row with $errors.users?.[$index]?.name', () => {
      const formDef = {
        form: [
          usersWithRequiredName(
            heading('errorNote', {
              include: { when: '$errors.users?.[$index]?.name !== undefined' },
            }),
          ),
        ],
      };

      const state = drive(formDef, [setData({ users: [{ name: 'Ada' }, {}] }), validateAllAction]);

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(state.widgetFlags['errorNote[0]']).toEqual({ hidden: true });
      expect(state.widgetFlags['errorNote[1]']).toEqual({ hidden: false });
    });

    it('leaves an empty place in $errors for a row without an error before a row with an error', () => {
      const formDef = {
        form: [
          usersWithRequiredName(),
          // `?.`, because `$errors` has no `users` before the validation.
          heading('gap', {
            include: { when: '$errors.users?.length === 2 && !(0 in $errors.users)' },
          }),
        ],
      };

      const state = drive(formDef, [setData({ users: [{ name: 'a' }, {}] }), validateAllAction]);

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(state.widgetFlags['gap']).toEqual({ hidden: false });
    });
  });

  it('gives no row for an empty place in the data of a repeater, and the next row keeps its index', () => {
    const rows: Record<string, unknown>[] = [];
    rows[1] = { active: true };
    const formDef = {
      form: [repeater('r', 'r', [heading('cell', { include: { when: '$index === 1' } })])],
    };

    const state = run(formDef, { r: rows });

    expect(state.formHealth).toEqual({ status: 'ok' });
    expect(Object.keys(state.calculatedWidgets)).toEqual(['#0', 'r', 'rRow[1]', 'cell[1]']);
    expect(state.widgetFlags['cell[1]']).toEqual({ hidden: false });
  });

  describe('the decoder and the flag keys', () => {
    it.each([
      ['include.edit', { when: 'false' }],
      ['exclude.edit', { when: 'true' }],
    ])('drops the key %s, so it does not hide the widget', (key, condition) => {
      const formDef = {
        states: { edit: 'true' },
        form: [heading('title', { [key]: condition })],
      };

      const state = run(formDef);

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(Object.keys(state.resolvedSources['title'])).not.toContain(key);
      expect(state.widgetFlags).toEqual({});
      expect(state.calculatedWidgets['title'].current.uid).toBe('title');
    });

    it.each([
      [
        'include: null',
        textInput('name', 'name', { include: null }),
        '[22] form.children[0].include: no alternative matched (tried 2); form.children[0].include: null is not a valid object',
      ],
      [
        'disabled: null',
        textInput('name', 'name', { disabled: null }),
        '[22] form.children[0].disabled: no alternative matched (tried 2); form.children[0].disabled: null is not a valid boolean or null is not a valid object',
      ],
      [
        'include: { when: 5 }',
        textInput('name', 'name', { include: { when: 5 } }),
        '[22] form.children[0].include: no alternative matched (tried 2); form.children[0].include.in: undefined is not a valid array; form.children[0].include.when: 5 is not a valid string',
      ],
      [
        "include: { in: 'a' }",
        textInput('name', 'name', { include: { in: 'a' } }),
        '[22] form.children[0].include: no alternative matched (tried 2); form.children[0].include.in: "a" is not a valid array; form.children[0].include.when: undefined is not a valid string',
      ],
    ])('gives code 22 at INITIALIZE for a widget with %s', (_shape, widget, message) => {
      const state = drive({ form: [widget] }, []);

      expect(state.formHealth).toEqual({ status: 'errored', code: 22, message });
    });
  });
});
