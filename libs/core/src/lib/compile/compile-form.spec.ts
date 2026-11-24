import { describe, expect, it } from 'vitest';
import { formDefDecoder } from '../form';
import { ExpressionRejectedError } from '../utils/justin';
import { ROW_INDEXES_SCOPE_KEY } from './compile-expression';
import { compileForm } from './compile-form';
import { type CompiledForm, type CompiledWidget, pathInRow } from './compiled-form';

/**
 * The compiled form of a definition: its widgets, the paths of its inputs, the rows of its
 * repeaters, its conditions and its states. `compile-fields.spec.ts` has the fields of a widget.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/compile/compile-form.spec.ts
 */

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

type Definition = { states?: Record<string, string>; form: unknown[] };

/** Decodes a definition as `INITIALIZE` does, with the root layout around the widgets. */
const decode = ({ states, form }: Definition) =>
  formDefDecoder.parse({
    states,
    form: { uid: '', kind: 'layout', type: 'grid', children: form },
  });

const compile = (definition: Definition): CompiledForm => compileForm(decode(definition), 'warn');

/** Every compiled widget of a form, the widgets of row templates included. */
const allWidgets = (widget: CompiledWidget | undefined): CompiledWidget[] => {
  if (widget === undefined) {
    return [];
  }
  return [
    widget,
    ...widget.children.flatMap(allWidgets),
    ...allWidgets(widget.repeater?.rowLayout),
  ];
};

const widgetOf = (compiled: CompiledForm, uid: string): CompiledWidget => {
  const widget = allWidgets(compiled.root).find((candidate) => candidate.source.uid === uid);
  if (widget === undefined) {
    throw new Error(`The compiled form has no widget with the uid ${uid}`);
  }
  return widget;
};

const partsOf = (widget: CompiledWidget): string[] => {
  if (widget.path === undefined || 'error' in widget.path) {
    throw new Error(`The widget ${widget.source.uid} has no path parts`);
  }
  return widget.path.parts;
};

const textInput = (uid: string, path: string, more: Record<string, unknown> = {}) => ({
  uid,
  kind: 'input',
  type: 'textinput',
  path,
  ...more,
});

const repeater = (uid: string, path: string, rowWidgets: unknown[], more = {}) => ({
  uid,
  kind: 'input',
  type: 'repeater',
  path,
  props: { template: { uid: `${uid}Row`, kind: 'layout', type: 'grid', children: rowWidgets } },
  ...more,
});

const teamsWithDevs = repeater('teams', 'teams', [
  textInput('teamName', 'teams.items.name'),
  repeater('devs', 'teams.items.devs', [textInput('devName', 'teams.items.devs.items.name')]),
]);

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('compileForm', () => {
  describe('the widgets', () => {
    it('compiles the root layout and its children in the order of the definition', () => {
      const formDef = decode({
        form: [
          { uid: 'title', kind: 'display', type: 'heading' },
          {
            uid: 'section',
            kind: 'layout',
            type: 'grid',
            children: [textInput('name', 'name'), { uid: 'save', kind: 'action', type: 'button' }],
          },
        ],
      });

      const compiled = compileForm(formDef, 'warn');

      expect(compiled.root?.source).toBe(formDef.form);
      expect(compiled.root?.children.map((child) => child.source)).toEqual(formDef.form.children);
      expect(compiled.root?.children[1].source).toBe(formDef.form.children[1]);
      expect(widgetOf(compiled, 'section').children.map((child) => child.source.uid)).toEqual([
        'name',
        'save',
      ]);
    });

    it.each(['title', 'name', 'save'])('gives the widget %s no children', (uid) => {
      const compiled = compile({
        form: [
          { uid: 'title', kind: 'display', type: 'heading' },
          textInput('name', 'name'),
          { uid: 'save', kind: 'action', type: 'button' },
        ],
      });

      expect(widgetOf(compiled, uid).children).toEqual([]);
    });

    it('compiles the row template of a repeater one time, as the layout of one row', () => {
      const formDef = decode({
        form: [repeater('users', 'users', [textInput('name', 'users.items.name')])],
      });
      const template = (formDef.form.children[0].props as Record<string, unknown>)['template'];

      const users = widgetOf(compileForm(formDef, 'warn'), 'users');

      expect(users.children).toEqual([]);
      expect(users.repeater?.declaredItemPath).toBe('users.items');
      expect(users.repeater?.rowLayout.source).toBe(template);
      expect(users.repeater?.rowLayout.children.map((child) => child.source.uid)).toEqual(['name']);
    });
  });

  describe('the states', () => {
    it('compiles no state for a definition without states', () => {
      expect(compile({ form: [] }).states).toEqual([]);
      expect(compile({ states: {}, form: [] }).states).toEqual([]);
    });

    it('compiles each state in the order of the declaration, with the conditions of its parents', () => {
      const compiled = compile({
        states: {
          register: '$form.mode === "register"',
          'register:minor': '$form.age < 18',
          login: '$form.mode === "login"',
        },
        form: [],
      });

      expect(compiled.states.map((state) => state.name)).toEqual([
        'register',
        'register:minor',
        'login',
      ]);
      expect(compiled.states.map((state) => state.condition.source)).toEqual([
        '($form.mode === "register")',
        '($form.mode === "register") && ($form.age < 18)',
        '($form.mode === "login")',
      ]);
      const [, minor] = compiled.states;
      expect(minor.condition.evaluate({ $form: { mode: 'register', age: 12 } })).toBe(true);
      expect(minor.condition.evaluate({ $form: { mode: 'login', age: 12 } })).toBe(false);
    });

    it('keeps the error of a rejected state expression, with the conditions of its parents', () => {
      const compiled = compile({
        states: { open: '$form.open', 'open:empty': '$form.tags.pop() === undefined' },
        form: [],
      });

      const [open, empty] = compiled.states;
      expect(open.condition.failure).toBeUndefined();
      expect(empty.condition.failure).toBeInstanceOf(ExpressionRejectedError);
      expect(empty.condition.failure?.message).toContain(
        'Rejected expression "($form.open) && ($form.tags.pop() === undefined)"',
      );
    });
  });

  describe('the path of an input', () => {
    it('has one part outside a repeater', () => {
      const compiled = compile({ form: [textInput('name', 'user.name')] });

      expect(widgetOf(compiled, 'name').path).toEqual({
        declared: 'user.name',
        parts: ['user.name'],
      });
    });

    it.each(['title', 'section', 'save'])(
      'is not set for the widget %s, which is no input',
      (uid) => {
        const compiled = compile({
          form: [
            { uid: 'title', kind: 'display', type: 'heading' },
            { uid: 'section', kind: 'layout', type: 'grid', children: [] },
            { uid: 'save', kind: 'action', type: 'button' },
          ],
        });

        expect(widgetOf(compiled, uid).path).toBeUndefined();
      },
    );

    it('has the index of the row between its parts inside a repeater', () => {
      const compiled = compile({
        form: [
          repeater('users', 'users', [
            textInput('name', 'users.items.name'),
            textInput('row', 'users.items'),
          ]),
        ],
      });

      expect(partsOf(widgetOf(compiled, 'users'))).toEqual(['users']);
      expect(widgetOf(compiled, 'name').path).toEqual({
        declared: 'users.items.name',
        parts: ['users.', '.name'],
      });
      expect(pathInRow(partsOf(widgetOf(compiled, 'name')), [2])).toBe('users.2.name');
      expect(pathInRow(partsOf(widgetOf(compiled, 'row')), [2])).toBe('users.2');
    });

    it('has the index of each row inside a nested repeater', () => {
      const compiled = compile({ form: [teamsWithDevs] });

      expect(partsOf(widgetOf(compiled, 'devs'))).toEqual(['teams.', '.devs']);
      expect(partsOf(widgetOf(compiled, 'devName'))).toEqual(['teams.', '.devs.', '.name']);
      expect(pathInRow(partsOf(widgetOf(compiled, 'devs')), [2])).toBe('teams.2.devs');
      expect(pathInRow(partsOf(widgetOf(compiled, 'devName')), [2, 1])).toBe('teams.2.devs.1.name');
      expect(widgetOf(compiled, 'devs').repeater?.declaredItemPath).toBe('teams.items.devs.items');
    });

    it('keeps a property named items in the path of the repeater', () => {
      const compiled = compile({
        form: [repeater('lines', 'invoice.items', [textInput('line', 'invoice.items.items.name')])],
      });

      expect(partsOf(widgetOf(compiled, 'line'))).toEqual(['invoice.items.', '.name']);
      expect(pathInRow(partsOf(widgetOf(compiled, 'line')), [3])).toBe('invoice.items.3.name');
    });

    it.each(['summary', 'users.itemsCount', 'users'])(
      'keeps an error for the path %s, which is not inside the row of its repeater',
      (path) => {
        const compiled = compile({
          form: [repeater('users', 'users', [textInput('outside', path)])],
        });

        expect(widgetOf(compiled, 'outside').path).toEqual({
          declared: path,
          error: new Error(`Path "${path}" is not inside the repeater row "users.items".`),
        });
      },
    );

    it('compiles no rows for a nested repeater whose path is not inside the row around it', () => {
      const compiled = compile({
        form: [
          repeater('teams', 'teams', [
            repeater('devs', 'devs', [textInput('devName', 'devs.items.name')]),
          ]),
        ],
      });

      const devs = widgetOf(compiled, 'devs');
      expect(devs.path).toEqual({
        declared: 'devs',
        error: new Error('Path "devs" is not inside the repeater row "teams.items".'),
      });
      expect(devs.repeater).toBeUndefined();
    });
  });

  describe('pathInRow', () => {
    it('returns the one part of a path outside a repeater', () => {
      expect(pathInRow(['user.name'], [])).toBe('user.name');
    });

    it('does not use the indexes of the rows below the widget', () => {
      expect(pathInRow(['teams.', '.devs'], [2, 1])).toBe('teams.2.devs');
    });
  });

  describe('the conditions', () => {
    it('has no condition for a widget without rules', () => {
      const compiled = compile({
        form: [textInput('name', 'name', { disabled: true, readonly: false })],
      });

      expect(widgetOf(compiled, 'name').conditions).toEqual({});
      expect(widgetOf(compiled, 'name').hasConditionsBelow).toBe(false);
      expect(compiled.root?.hasConditionsBelow).toBe(false);
    });

    it('keeps the state lists of include.in and exclude.from', () => {
      const formDef = decode({
        states: { a: 'true', b: 'true' },
        form: [
          { uid: 'shown', kind: 'display', type: 'heading', include: { in: ['a', 'b'] } },
          { uid: 'removed', kind: 'display', type: 'heading', exclude: { from: ['b'] } },
        ],
      });

      const compiled = compileForm(formDef, 'warn');

      expect(widgetOf(compiled, 'shown').conditions).toEqual({ include: { in: ['a', 'b'] } });
      expect(widgetOf(compiled, 'removed').conditions).toEqual({ exclude: { from: ['b'] } });
    });

    it('compiles the when rules of an input', () => {
      const compiled = compile({
        form: [
          textInput('name', 'name', {
            include: { when: '$form.show' },
            exclude: { when: '$form.hide' },
            disabled: { when: '$form.locked' },
            readonly: { when: '$form.sent' },
          }),
        ],
      });

      const { include, exclude, disabled, readonly } = widgetOf(compiled, 'name').conditions;
      const sources = [
        include !== undefined && 'when' in include ? include.when.source : undefined,
        exclude !== undefined && 'when' in exclude ? exclude.when.source : undefined,
        disabled?.source,
        readonly?.source,
      ];
      expect(sources).toEqual(['$form.show', '$form.hide', '$form.locked', '$form.sent']);
      expect(disabled?.evaluate({ $form: { locked: true } })).toBe(true);
    });

    it('compiles the disabled rule of an action', () => {
      const compiled = compile({
        form: [
          { uid: 'save', kind: 'action', type: 'button', disabled: { when: '$formIsInvalid' } },
        ],
      });

      expect(widgetOf(compiled, 'save').conditions.disabled?.source).toBe('$formIsInvalid');
    });

    it.each(['display', 'layout'])('has no disabled rule for a %s widget', (kind) => {
      const compiled = compile({
        form: [{ uid: 'odd', kind, type: 'x', children: [], disabled: { when: '$form.locked' } }],
      });

      expect(widgetOf(compiled, 'odd').conditions).toEqual({});
    });

    it('keeps the error of a condition that does not parse', () => {
      const compiled = compile({
        form: [{ uid: 'title', kind: 'display', type: 'heading', include: { when: '$form..x' } }],
      });

      const { include } = widgetOf(compiled, 'title').conditions;
      expect(include !== undefined && 'when' in include && include.when.failure).toBeInstanceOf(
        SyntaxError,
      );
    });

    it('compiles a condition of a row widget for all the rows', () => {
      const compiled = compile({
        form: [
          repeater('users', 'users', [
            textInput('name', 'users.items.name', {
              disabled: { when: '$form.users.items.locked' },
            }),
          ]),
        ],
      });
      const $form = { users: [{ locked: false }, { locked: true }] };

      const disabled = widgetOf(compiled, 'name').conditions.disabled;

      expect(disabled?.source).toBe('$form.users.items.locked');
      expect(disabled?.evaluate({ $form, [ROW_INDEXES_SCOPE_KEY]: [0] })).toBe(false);
      expect(disabled?.evaluate({ $form, [ROW_INDEXES_SCOPE_KEY]: [1] })).toBe(true);
    });

    it('compiles a condition of an inner row with the rows of both repeaters', () => {
      const compiled = compile({
        form: [
          repeater('teams', 'teams', [
            repeater('devs', 'teams.items.devs', [
              textInput('devName', 'teams.items.devs.items.name', {
                include: { when: '$form.teams.items.open && $form.teams.items.devs.items.active' },
              }),
            ]),
          ]),
        ],
      });
      const $form = {
        teams: [
          { open: false, devs: [{ active: true }] },
          { open: true, devs: [{ active: false }, { active: true }] },
        ],
      };

      const { include } = widgetOf(compiled, 'devName').conditions;
      const isIncluded = (rowIndexes: number[]): unknown =>
        include !== undefined && 'when' in include
          ? include.when.evaluate({ $form, [ROW_INDEXES_SCOPE_KEY]: rowIndexes })
          : undefined;

      expect(isIncluded([0, 0])).toBe(false);
      expect(isIncluded([1, 0])).toBe(false);
      expect(isIncluded([1, 1])).toBe(true);
    });

    it('does not read the word items as a row outside a repeater', () => {
      const compiled = compile({
        form: [
          {
            uid: 'title',
            kind: 'display',
            type: 'heading',
            include: { when: '$form.cart.items.length > 1' },
          },
        ],
      });

      const { include } = widgetOf(compiled, 'title').conditions;
      expect(
        include !== undefined &&
          'when' in include &&
          include.when.evaluate({ $form: { cart: { items: ['a', 'b'] } } }),
      ).toBe(true);
    });

    it('tells which widgets have a condition in them, below them or in their rows', () => {
      const compiled = compile({
        form: [
          { uid: 'plain', kind: 'display', type: 'heading' },
          {
            uid: 'section',
            kind: 'layout',
            type: 'grid',
            children: [textInput('gated', 'gated', { include: { when: '$form.show' } })],
          },
          repeater('users', 'users', [
            textInput('name', 'users.items.name', { readonly: { when: '$item.sent' } }),
          ]),
          repeater('tags', 'tags', [textInput('tag', 'tags.items')]),
        ],
      });

      const withConditions = allWidgets(compiled.root)
        .filter((widget) => widget.hasConditionsBelow)
        .map((widget) => widget.source.uid);
      expect(withConditions).toEqual(['#0', 'section', 'gated', 'users', 'usersRow', 'name']);
    });
  });
});
