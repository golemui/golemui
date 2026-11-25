import { describe, expect, it } from 'vitest';
import { compileForm } from '../compile/compile-form';
import { type CompiledWidget, type ExpressionScope } from '../compile/compiled-form';
import { formDefDecoder } from '../form';
import { type ExpressionFunctions } from '../shared';
import { ExpressionRejectedError } from '../utils/justin';
import { buildWidgetInstances } from './build-instances';
import { computeWidgetFlags } from './compute-flags';
import {
  emptyWidgetInstanceTree,
  forEachInstance,
  type WidgetFlags,
  type WidgetInstance,
  type WidgetInstanceTree,
} from './widget-instance';

/**
 * The flags of the widget instances: what the conditions of a widget give, what a hidden widget
 * does to the widgets below it, what a widget of a repeater row reads, and which instances and
 * flags of the computation before are kept.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/instances/compute-flags.spec.ts
 */

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

type Definition = { states?: Record<string, string>; form: unknown[] };

const compile = ({ states, form }: Definition): CompiledWidget => {
  const formDef = formDefDecoder.parse({
    states,
    form: { uid: '', kind: 'layout', type: 'grid', children: form },
  });
  const root = compileForm(formDef, 'warn').root;
  if (root === undefined) {
    throw new Error('The form has no compiled root');
  }
  return root;
};

type Options = {
  activeStates?: string[];
  functions?: ExpressionFunctions;
  /** The tree of a computation before, with its flags. */
  previous?: WidgetInstanceTree;
};

const scopeFor = (
  data: Record<string, unknown>,
  functions: ExpressionFunctions,
): ExpressionScope => ({
  $form: data,
  $meta: {},
  $errors: {},
  $formIsInvalid: false,
  $fn: functions,
});

/** Builds the instances for the data and computes their flags. */
const flagsFor = (
  compiledRoot: CompiledWidget,
  data: Record<string, unknown>,
  { activeStates = [], functions = {}, previous = emptyWidgetInstanceTree() }: Options = {},
): WidgetInstanceTree =>
  computeWidgetFlags(
    buildWidgetInstances(compiledRoot, data, previous),
    compiledRoot,
    data,
    scopeFor(data, functions),
    new Set(activeStates),
  );

const instanceOf = (tree: WidgetInstanceTree, uid: string): WidgetInstance => {
  let found: WidgetInstance | undefined;
  forEachInstance(tree.root, (instance) => {
    if (instance.uid === uid) {
      found = instance;
    }
  });
  if (found === undefined) {
    throw new Error(`The tree has no instance with the uid ${uid}`);
  }
  return found;
};

const flagsOf = (tree: WidgetInstanceTree, uid: string): WidgetFlags | undefined =>
  instanceOf(tree, uid).flags;

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
  rowUid: string,
  rowWidgets: unknown[],
  more: Record<string, unknown> = {},
) => ({
  uid,
  kind: 'input',
  type: 'repeater',
  path,
  props: { template: layout(rowUid, rowWidgets) },
  ...more,
});

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('computeWidgetFlags', () => {
  describe('the flags of one widget', () => {
    it('gives no flags to a widget with no condition', () => {
      const tree = flagsFor(compile({ form: [heading('title'), textInput('name', 'name')] }), {});

      expect(flagsOf(tree, 'title')).toBeUndefined();
      expect(flagsOf(tree, 'name')).toBeUndefined();
      expect(flagsOf(tree, '#0')).toBeUndefined();
    });

    it.each([
      ['true', { hidden: false }],
      ['false', { hidden: true }],
      ["'yes'", { hidden: true }],
      ['1', { hidden: true }],
      ['$form.missing', { hidden: true }],
    ])('gives the include.when result %s the flags %o', (when, expected) => {
      const tree = flagsFor(compile({ form: [heading('title', { include: { when } })] }), {});

      expect(flagsOf(tree, 'title')).toEqual(expected);
    });

    it.each([
      ['true', { hidden: true }],
      ['false', { hidden: false }],
      ["'yes'", { hidden: false }],
      ['1', { hidden: false }],
      ['$form.missing', { hidden: false }],
    ])('gives the exclude.when result %s the flags %o', (when, expected) => {
      const tree = flagsFor(compile({ form: [heading('title', { exclude: { when } })] }), {});

      expect(flagsOf(tree, 'title')).toEqual(expected);
    });

    it('shows a widget with include.in while one of its states is active', () => {
      const compiledRoot = compile({
        states: { company: 'true', person: 'true' },
        form: [
          heading('one', { include: { in: ['company', 'person'] } }),
          heading('none', { include: { in: [] } }),
        ],
      });

      expect(flagsOf(flagsFor(compiledRoot, {}, { activeStates: ['person'] }), 'one')).toEqual({
        hidden: false,
      });
      expect(flagsOf(flagsFor(compiledRoot, {}, { activeStates: [] }), 'one')).toEqual({
        hidden: true,
      });
      expect(flagsOf(flagsFor(compiledRoot, {}, { activeStates: ['person'] }), 'none')).toEqual({
        hidden: true,
      });
    });

    it('hides a widget with exclude.from while one of its states is active', () => {
      const compiledRoot = compile({
        states: { company: 'true', person: 'true' },
        form: [
          heading('one', { exclude: { from: ['company', 'person'] } }),
          heading('none', { exclude: { from: [] } }),
        ],
      });

      expect(flagsOf(flagsFor(compiledRoot, {}, { activeStates: ['company'] }), 'one')).toEqual({
        hidden: true,
      });
      expect(flagsOf(flagsFor(compiledRoot, {}, { activeStates: [] }), 'one')).toEqual({
        hidden: false,
      });
      expect(flagsOf(flagsFor(compiledRoot, {}, { activeStates: ['company'] }), 'none')).toEqual({
        hidden: false,
      });
    });

    it.each([
      ['true', 'true', true],
      ['true', 'false', false],
      ['false', 'true', true],
      ['false', 'false', false],
    ])(
      'follows exclude alone for include.when %s with exclude.when %s',
      (includeWhen, excludeWhen, hidden) => {
        const tree = flagsFor(
          compile({
            form: [
              heading('title', { include: { when: includeWhen }, exclude: { when: excludeWhen } }),
            ],
          }),
          {},
        );

        expect(flagsOf(tree, 'title')).toEqual({ hidden });
      },
    );

    it('gives a flag for each condition of an input, in the order hidden, disabled, readonly', () => {
      const tree = flagsFor(
        compile({
          form: [
            textInput('name', 'name', {
              readonly: { when: '$form.locked === true' },
              disabled: { when: '$form.locked !== true' },
              include: { when: 'true' },
            }),
            textInput('note', 'note', { disabled: { when: "'yes'" } }),
          ],
        }),
        { locked: true },
      );

      expect(flagsOf(tree, 'name')).toEqual({ hidden: false, disabled: false, readonly: true });
      expect(Object.keys(flagsOf(tree, 'name') ?? {})).toEqual(['hidden', 'disabled', 'readonly']);
      // A result that is not exactly true is false, and a widget without include has no `hidden`.
      expect(flagsOf(tree, 'note')).toEqual({ disabled: false });
      expect(flagsOf(tree, 'note')).not.toHaveProperty('hidden');
    });

    it('gives no flag for a disabled or readonly value that is no condition', () => {
      const tree = flagsFor(
        compile({ form: [textInput('name', 'name', { disabled: true, readonly: false })] }),
        {},
      );

      expect(flagsOf(tree, 'name')).toBeUndefined();
    });

    it('reads the data, the functions of the host and the validation variables', () => {
      const compiledRoot = compile({
        form: [
          heading('adult', { include: { when: '$fn.isAdult($form.age)' } }),
          heading('valid', { include: { when: '$formIsInvalid === false' } }),
          heading('withoutErrors', { include: { when: '$errors.age === undefined' } }),
        ],
      });

      const tree = flagsFor(
        compiledRoot,
        { age: 30 },
        { functions: { isAdult: (age: number) => age >= 18 } },
      );

      expect(flagsOf(tree, 'adult')).toEqual({ hidden: false });
      expect(flagsOf(tree, 'valid')).toEqual({ hidden: false });
      expect(flagsOf(tree, 'withoutErrors')).toEqual({ hidden: false });
    });
  });

  describe('a widget below a hidden widget', () => {
    it('hides every widget below a hidden layout, with the flag hidden alone', () => {
      const tree = flagsFor(
        compile({
          form: [
            layout(
              'card',
              [
                heading('title'),
                layout('inner', [
                  textInput('name', 'name', {
                    include: { when: 'true' },
                    disabled: { when: 'true' },
                  }),
                ]),
              ],
              { include: { when: 'false' } },
            ),
            heading('after'),
          ],
        }),
        {},
      );

      expect(flagsOf(tree, 'card')).toEqual({ hidden: true });
      for (const uid of ['title', 'inner', 'name']) {
        expect(flagsOf(tree, uid)).toEqual({ hidden: true });
        expect(Object.keys(flagsOf(tree, uid) ?? {})).toEqual(['hidden']);
      }
      // The widgets below a hidden widget share one flags object.
      expect(flagsOf(tree, 'title')).toBe(flagsOf(tree, 'name'));
      expect(flagsOf(tree, 'after')).toBeUndefined();
    });

    it('gives the hidden widget itself all its own flags', () => {
      const tree = flagsFor(
        compile({
          form: [
            textInput('name', 'name', {
              include: { when: 'false' },
              disabled: { when: 'true' },
              readonly: { when: 'false' },
            }),
          ],
        }),
        {},
      );

      expect(flagsOf(tree, 'name')).toEqual({ hidden: true, disabled: true, readonly: false });
    });

    it('evaluates no condition below a hidden widget', () => {
      const evaluated: string[] = [];
      const compiledRoot = compile({
        form: [
          layout(
            'card',
            [
              heading('counted', { include: { when: "$fn.note('counted')" } }),
              heading('failing', { include: { when: '$form.missing.deep' } }),
            ],
            { include: { when: '$form.showCard === true' } },
          ),
        ],
      });
      const functions = {
        note: (name: string) => {
          evaluated.push(name);
          return true;
        },
      };

      const tree = flagsFor(compiledRoot, { showCard: false }, { functions });

      expect(evaluated).toEqual([]);
      expect(flagsOf(tree, 'failing')).toEqual({ hidden: true });
    });

    it('hides the rows of a hidden repeater and everything in them', () => {
      const tree = flagsFor(
        compile({
          form: [
            repeater('users', 'users', 'row', [textInput('name', 'users.items.name')], {
              include: { when: 'false' },
            }),
          ],
        }),
        { users: [{}, {}] },
      );

      for (const uid of ['row[0]', 'name[0]', 'row[1]', 'name[1]']) {
        expect(flagsOf(tree, uid)).toEqual({ hidden: true });
      }
    });

    it('hides only the rows of the hidden repeater when two repeaters have one path', () => {
      const tree = flagsFor(
        compile({
          form: [
            repeater('shown', 'users', 'shownRow', [textInput('shownName', 'users.items.name')]),
            repeater('gone', 'users', 'goneRow', [textInput('goneName', 'users.items.name')], {
              include: { when: 'false' },
            }),
          ],
        }),
        { users: [{}] },
      );

      expect(flagsOf(tree, 'goneRow[0]')).toEqual({ hidden: true });
      expect(flagsOf(tree, 'goneName[0]')).toEqual({ hidden: true });
      expect(flagsOf(tree, 'shownRow[0]')).toBeUndefined();
      expect(flagsOf(tree, 'shownName[0]')).toBeUndefined();
    });

    it('hides the children of a hidden layout whose written uid ends with an index', () => {
      const tree = flagsFor(
        compile({
          form: [
            layout('card[1]', [heading('title'), textInput('note', 'note')], {
              include: { when: 'false' },
            }),
          ],
        }),
        {},
      );

      expect(flagsOf(tree, 'title')).toEqual({ hidden: true });
      expect(flagsOf(tree, 'note')).toEqual({ hidden: true });
    });
  });

  describe('a widget of a repeater row', () => {
    it('reads the item and the index of its row', () => {
      const tree = flagsFor(
        compile({
          form: [
            repeater('users', 'users', 'row', [
              textInput('name', 'users.items.name', {
                include: { when: '$item.active === true' },
                disabled: { when: '$index === 0' },
              }),
            ]),
          ],
        }),
        { users: [{ active: true }, { active: false }] },
      );

      expect(flagsOf(tree, 'name[0]')).toEqual({ hidden: false, disabled: true });
      expect(flagsOf(tree, 'name[1]')).toEqual({ hidden: true, disabled: false });
    });

    it('reads its own row through the path of the row', () => {
      const tree = flagsFor(
        compile({
          form: [
            repeater('users', 'users', 'row', [
              heading('badge', { include: { when: '$form.users.items.active === true' } }),
            ]),
          ],
        }),
        { users: [{ active: false }, { active: true }] },
      );

      expect(flagsOf(tree, 'badge[0]')).toEqual({ hidden: true });
      expect(flagsOf(tree, 'badge[1]')).toEqual({ hidden: false });
    });

    it('reads the innermost row in a repeater inside a row', () => {
      const tree = flagsFor(
        compile({
          form: [
            repeater('teams', 'teams', 'team', [
              heading('teamBadge', { include: { when: "$item.name === 'core'" } }),
              repeater('devs', 'teams.items.devs', 'dev', [
                heading('devBadge', {
                  include: {
                    when: "$item.name === 'Ada' && $form.teams.items.devs.items.name === 'Ada'",
                  },
                }),
                heading('secondDev', { include: { when: '$index === 1' } }),
              ]),
            ]),
          ],
        }),
        {
          teams: [
            { name: 'core', devs: [{ name: 'Ada' }, { name: 'Grace' }] },
            { name: 'docs', devs: [{ name: 'Ada' }] },
          ],
        },
      );

      expect(flagsOf(tree, 'teamBadge[0]')).toEqual({ hidden: false });
      expect(flagsOf(tree, 'teamBadge[1]')).toEqual({ hidden: true });
      expect(flagsOf(tree, 'devBadge[0][0]')).toEqual({ hidden: false });
      expect(flagsOf(tree, 'devBadge[0][1]')).toEqual({ hidden: true });
      expect(flagsOf(tree, 'devBadge[1][0]')).toEqual({ hidden: false });
      // The outer row of the last dev has the index 1, and its own row has the index 0.
      expect(flagsOf(tree, 'secondDev[0][0]')).toEqual({ hidden: true });
      expect(flagsOf(tree, 'secondDev[0][1]')).toEqual({ hidden: false });
      expect(flagsOf(tree, 'secondDev[1][0]')).toEqual({ hidden: true });
    });

    it('gives a condition of a nested row the indexes of both rows', () => {
      const tree = flagsFor(
        compile({
          form: [
            repeater('teams', 'teams', 'team', [
              repeater('devs', 'teams.items.devs', 'dev', [
                heading('lead', {
                  include: { when: '$form.teams.items.devs.items.name === $form.teams.items.lead' },
                }),
              ]),
            ]),
          ],
        }),
        {
          teams: [
            { lead: 'Grace', devs: [{ name: 'Ada' }, { name: 'Grace' }] },
            { lead: 'Ada', devs: [{ name: 'Ada' }, { name: 'Grace' }] },
          ],
        },
      );

      expect(flagsOf(tree, 'lead[0][0]')).toEqual({ hidden: true });
      expect(flagsOf(tree, 'lead[0][1]')).toEqual({ hidden: false });
      expect(flagsOf(tree, 'lead[1][0]')).toEqual({ hidden: false });
      expect(flagsOf(tree, 'lead[1][1]')).toEqual({ hidden: true });
    });

    it('gives a widget of the outer row the outer row, also next to a repeater inside the row', () => {
      const tree = flagsFor(
        compile({
          form: [
            repeater('teams', 'teams', 'team', [
              repeater('devs', 'teams.items.devs', 'dev', [
                textInput('devName', 'teams.items.devs.items.name'),
              ]),
              heading('afterDevs', { include: { when: "$item.name === 'core' && $index === 0" } }),
            ]),
          ],
        }),
        { teams: [{ name: 'core', devs: [{ name: 'Ada' }] }] },
      );

      expect(flagsOf(tree, 'afterDevs[0]')).toEqual({ hidden: false });
    });
  });

  describe('the flags of the computation before', () => {
    const cardForm = () =>
      compile({
        form: [
          layout(
            'card',
            [textInput('name', 'name', { disabled: { when: '$form.locked === true' } })],
            {
              include: { when: '$form.showCard !== false' },
            },
          ),
          heading('hint', { include: { when: '$form.showHint === true' } }),
          heading('plain'),
        ],
      });

    it('returns the previous tree when no flag changed', () => {
      const compiledRoot = cardForm();
      const first = flagsFor(compiledRoot, { locked: false });

      const second = flagsFor(compiledRoot, { locked: false, other: 1 }, { previous: first });

      expect(second).toBe(first);
    });

    it('keeps the flags object of a widget whose flags did not change', () => {
      const compiledRoot = cardForm();
      const first = flagsFor(compiledRoot, { showHint: false });

      const second = flagsFor(compiledRoot, { showHint: true }, { previous: first });

      expect(flagsOf(second, 'hint')).toEqual({ hidden: false });
      expect(flagsOf(second, 'card')).toBe(flagsOf(first, 'card'));
      expect(flagsOf(second, 'name')).toBe(flagsOf(first, 'name'));
    });

    it('gives a new instance only to the widget whose flags changed and to the widgets above it', () => {
      const compiledRoot = cardForm();
      const first = flagsFor(compiledRoot, { locked: false });

      const second = flagsFor(compiledRoot, { locked: true }, { previous: first });

      expect(flagsOf(second, 'name')).toEqual({ disabled: true });
      expect(instanceOf(second, 'name')).not.toBe(instanceOf(first, 'name'));
      expect(instanceOf(second, 'card')).not.toBe(instanceOf(first, 'card'));
      expect(second.root).not.toBe(first.root);
      expect(instanceOf(second, 'hint')).toBe(instanceOf(first, 'hint'));
      expect(instanceOf(second, 'plain')).toBe(instanceOf(first, 'plain'));
      // The previous instance is not changed.
      expect(flagsOf(first, 'name')).toEqual({ disabled: false });
    });

    it('keeps the instance of a widget that its own condition hides when the widget above it is hidden too', () => {
      const compiledRoot = compile({
        form: [
          layout('card', [heading('title', { include: { when: '$form.showTitle === true' } })], {
            include: { when: '$form.showCard !== false' },
          }),
        ],
      });
      const first = flagsFor(compiledRoot, { showTitle: false });
      expect(flagsOf(first, 'title')).toEqual({ hidden: true });

      const second = flagsFor(
        compiledRoot,
        { showTitle: false, showCard: false },
        { previous: first },
      );

      expect(flagsOf(second, 'card')).toEqual({ hidden: true });
      expect(instanceOf(second, 'title')).toBe(instanceOf(first, 'title'));
    });

    it('gives a widget its own flags again when the widget above it is shown again', () => {
      const compiledRoot = cardForm();
      const hidden = flagsFor(compiledRoot, { showCard: false, locked: true });
      expect(flagsOf(hidden, 'name')).toEqual({ hidden: true });

      const shown = flagsFor(compiledRoot, { showCard: true, locked: true }, { previous: hidden });

      expect(flagsOf(shown, 'card')).toEqual({ hidden: false });
      expect(flagsOf(shown, 'name')).toEqual({ disabled: true });
    });

    it('removes the flags of a widget with no condition when the widget above it is shown again', () => {
      const compiledRoot = compile({
        form: [
          layout('card', [heading('title')], { include: { when: '$form.showCard === true' } }),
        ],
      });
      const hidden = flagsFor(compiledRoot, { showCard: false });
      expect(flagsOf(hidden, 'title')).toEqual({ hidden: true });

      const shown = flagsFor(compiledRoot, { showCard: true }, { previous: hidden });

      expect(flagsOf(shown, 'title')).toBeUndefined();
    });

    it('gives the widgets of a new row their flags and keeps the previous rows', () => {
      const compiledRoot = compile({
        form: [
          repeater('users', 'users', 'row', [
            textInput('name', 'users.items.name', { include: { when: '$item.active === true' } }),
          ]),
        ],
      });
      const first = flagsFor(compiledRoot, { users: [{ active: true }] });

      const second = flagsFor(
        compiledRoot,
        { users: [{ active: true }, { active: false }] },
        { previous: first },
      );

      expect(flagsOf(second, 'name[1]')).toEqual({ hidden: true });
      expect(instanceOf(second, 'row[0]')).toBe(instanceOf(first, 'row[0]'));
      expect(instanceOf(second, 'name[0]')).toBe(instanceOf(first, 'name[0]'));
    });
  });

  describe('a condition that fails', () => {
    it('throws the error of the first failing condition in the order of the document', () => {
      const compiledRoot = compile({
        form: [
          heading('first', { include: { when: 'true' } }),
          layout('card', [heading('second', { include: { when: '$form.a.inCard' } })]),
          heading('third', { include: { when: '$form.b.afterCard' } }),
        ],
      });

      expect(() => flagsFor(compiledRoot, {})).toThrow(
        "Cannot read properties of undefined (reading 'inCard')",
      );
      expect(() => flagsFor(compiledRoot, { a: {} })).toThrow(
        "Cannot read properties of undefined (reading 'afterCard')",
      );
      expect(flagsOf(flagsFor(compiledRoot, { a: {}, b: {} }), 'third')).toEqual({ hidden: true });
    });

    it('evaluates the conditions of one widget in the order include, exclude, disabled, readonly', () => {
      const evaluated: string[] = [];
      const functions = {
        note: (name: string) => {
          evaluated.push(name);
          return true;
        },
      };
      const compiledRoot = compile({
        form: [
          textInput('name', 'name', {
            readonly: { when: "$fn.note('readonly')" },
            disabled: { when: "$fn.note('disabled')" },
            exclude: { when: "$fn.note('exclude')" },
            include: { when: "$fn.note('include')" },
          }),
        ],
      });

      flagsFor(compiledRoot, {}, { functions });

      expect(evaluated).toEqual(['include', 'exclude', 'disabled', 'readonly']);
    });

    it('throws the error of the expression check for a rejected condition', () => {
      const compiledRoot = compile({
        form: [heading('title', { include: { when: '$form.tags.pop() === 1' } })],
      });

      expect(() => flagsFor(compiledRoot, { tags: [1] })).toThrow(ExpressionRejectedError);
    });

    it('quotes a rejected condition of a row as it is written', () => {
      const compiledRoot = compile({
        form: [
          repeater('users', 'users', 'row', [
            heading('badge', { include: { when: '$form.users.items.tags.pop() === 1' } }),
          ]),
        ],
      });

      expect(flagsFor(compiledRoot, { users: [] }).root).toBeDefined();
      expect(() => flagsFor(compiledRoot, { users: [{ tags: [1] }] })).toThrow(
        'Rejected expression "$form.users.items.tags.pop() === 1"',
      );
    });
  });

  it('returns the tree as it is for a form without a compiled root', () => {
    const empty = emptyWidgetInstanceTree();

    expect(computeWidgetFlags(empty, undefined, {}, scopeFor({}, {}), new Set())).toBe(empty);
  });

  it('returns a tree without a root as it is', () => {
    const compiledRoot = compile({ form: [heading('title', { include: { when: 'false' } })] });
    const empty = emptyWidgetInstanceTree();

    expect(computeWidgetFlags(empty, compiledRoot, {}, scopeFor({}, {}), new Set())).toBe(empty);
  });

  it('returns a tree with instances as it is when there is no compiled root', () => {
    const compiledRoot = compile({ form: [heading('title', { include: { when: 'false' } })] });
    const tree = buildWidgetInstances(compiledRoot, {}, emptyWidgetInstanceTree());

    expect(computeWidgetFlags(tree, undefined, {}, scopeFor({}, {}), new Set())).toBe(tree);
  });
});
