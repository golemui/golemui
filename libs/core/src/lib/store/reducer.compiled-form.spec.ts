import { type StandardSchemaV1 } from '@standard-schema/spec';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { type CompiledWidget, pathInRow } from '../compile/compiled-form';
import { errorCodes } from '../errors';
import { type ValidatorFn } from '../form-validator';
import { type FormWidget } from '../form-widget';
import { identityTranslator } from '../i18n';
import { type ExpressionFunctions } from '../shared';
import { type ExpressionPolicy } from '../utils/check-expression';
import { inputPath } from '../utils/form';
import { ExpressionRejectedError } from '../utils/justin';
import { get } from '../utils/object';
import { type Action } from './actions';
import { createInitialState, type RepeaterRow, type State } from './model';
import { reducer } from './reducer';

/**
 * The compiled form of the state, checked through the reducer: `INITIALIZE` builds it from the
 * form definition, and no other action changes it.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/store/reducer.compiled-form.spec.ts
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

const reducerWith = (expressionPolicy?: ExpressionPolicy) =>
  reducer({
    validators,
    validateOn: 'eager',
    localization: identityTranslator('en-US'),
    functions,
    expressionPolicy,
  });

const initialize = (formDef: unknown): Action => ({
  type: 'INITIALIZE',
  payload: { formName: 'test-form', formDef: formDef as Record<string, unknown> },
});

const drive = (actions: Action[], expressionPolicy?: ExpressionPolicy): State =>
  actions.reduce(reducerWith(expressionPolicy), createInitialState('en-US'));

const signUpForm = {
  states: { company: '$form.kind === "company"' },
  form: [
    { uid: 'kind', kind: 'input', type: 'select', path: 'kind' },
    {
      uid: 'vat',
      kind: 'input',
      type: 'textinput',
      path: 'vat',
      label: 'VAT of {{ $form.companyName }}',
      include: { in: ['company'] },
    },
  ],
};

/** Every compiled widget of a form, the widgets of row templates included. */
const compiledWidgets = (widget: CompiledWidget | undefined): CompiledWidget[] => {
  if (widget === undefined) {
    return [];
  }
  return [
    widget,
    ...widget.children.flatMap(compiledWidgets),
    ...compiledWidgets(widget.repeater?.rowLayout),
  ];
};

/** Every widget of a decoded definition in the same order, the row templates included. */
const definedWidgets = (widget: FormWidget<string>): FormWidget<string>[] => {
  const children = widget.kind === 'layout' ? widget.children : [];
  const template: unknown =
    widget.kind === 'input' && widget.type === 'repeater' ? widget.props?.['template'] : undefined;
  return [
    widget,
    ...children.flatMap(definedWidgets),
    ...(template === undefined ? [] : definedWidgets(template as FormWidget<string>)),
  ];
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

type WidgetOfData = { uid: string; path: string | undefined; rows: RepeaterRow[] | undefined };

/**
 * The widgets that a compiled form gives for the data, in the order of the definition: a
 * widget, then its children, then the rows of a repeater. Each one has its uid and its path
 * with the indexes of its row, and the rows around it.
 */
const widgetsOfData = (
  widget: CompiledWidget,
  data: Record<string, unknown>,
  rowIndexes: number[] = [],
  rows: RepeaterRow[] = [],
): WidgetOfData[] => {
  const uid = `${widget.source.uid}${rowIndexes.map((index) => `[${index}]`).join('')}`;
  const path =
    widget.path !== undefined && 'parts' in widget.path
      ? pathInRow(widget.path.parts, rowIndexes)
      : undefined;
  const widgets: WidgetOfData[] = [{ uid, path, rows: rows.length > 0 ? rows : undefined }];
  for (const child of widget.children) {
    widgets.push(...widgetsOfData(child, data, rowIndexes, rows));
  }
  const repeater = widget.repeater;
  const rowValues: unknown = path === undefined ? undefined : get(data, path);
  if (repeater !== undefined && Array.isArray(rowValues)) {
    rowValues.forEach((_rowValue, index) => {
      const row: RepeaterRow = {
        declaredItemPath: repeater.declaredItemPath,
        itemPath: `${path}.${index}`,
        index,
      };
      widgets.push(
        ...widgetsOfData(repeater.rowLayout, data, [...rowIndexes, index], [...rows, row]),
      );
    });
  }
  return widgets;
};

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('reducer: the compiled form', () => {
  it('is the empty compiled form before a form definition', () => {
    expect(createInitialState('en-US').compiled).toEqual({ root: undefined, states: [] });
  });

  it('is built from the decoded definition at INITIALIZE', () => {
    const state = drive([initialize(signUpForm)]);

    expect(state.formHealth).toEqual({ status: 'ok' });
    expect(state.compiled.root?.source).toBe(state.formDef.form);
    expect(state.compiled.root?.children.map((child) => child.source)).toEqual(
      state.formDef.form.children,
    );
    expect(state.compiled.states.map((compiledState) => compiledState.name)).toEqual(['company']);
  });

  it('is built from a definition given as a JSON text', () => {
    const state = drive([initialize(JSON.stringify(signUpForm))]);

    expect(state.compiled.root?.children.map((child) => child.source.uid)).toEqual(['kind', 'vat']);
  });

  it('has example forms to compile', () => {
    expect(exampleForms.length).toBeGreaterThan(0);
  });

  it.each(exampleForms)(
    'gives the uid, the path and the rows of every widget of the form %s with its data',
    (_name, { formDef, data }) => {
      const state = drive([initialize(formDef), { type: 'SET_DATA', payload: { data } }]);
      expect(state.formHealth).toEqual({ status: 'ok' });
      const root = state.compiled.root;
      if (root === undefined) {
        throw new Error('The form has no compiled root');
      }

      const widgets = widgetsOfData(root, state.data);

      expect(widgets.map((widget) => widget.uid)).toEqual(Object.keys(state.resolvedSources));
      for (const { uid, path, rows } of widgets) {
        expect(path, `the path of ${uid}`).toBe(inputPath(state.resolvedSources[uid]));
        expect(rows, `the rows of ${uid}`).toEqual(state.repeaterRows[uid]);
      }
    },
  );

  it.each(exampleForms)(
    'has one compiled widget for each widget of the form %s',
    (_name, { formDef }) => {
      const state = drive([initialize(formDef)]);

      expect(state.formHealth).toEqual({ status: 'ok' });
      const sources = compiledWidgets(state.compiled.root).map((widget) => widget.source);
      const defined = definedWidgets(state.formDef.form);
      expect(sources).toHaveLength(defined.length);
      sources.forEach((source, position) => {
        expect(source, `the widget at the position ${position}`).toBe(defined[position]);
      });
    },
  );

  it('stays the same object in every action after INITIALIZE', () => {
    const afterInitialize = drive([initialize(signUpForm)]);
    const actions: Action[] = [
      { type: 'SET_DATA', payload: { data: { kind: 'company' } } },
      { type: 'SET_META', payload: { meta: { step: 2 } } },
      { type: 'SET_WIDGET_DATA', payload: { path: 'vat', data: 'ES-1' } },
      { type: 'ATTEMPT_VALIDATION', payload: { reason: 'blur', path: 'vat', uid: 'vat' } },
      { type: 'VALIDATE_ALL' },
      { type: 'OVERRIDE_WIDGET_PROP', payload: { uid: 'vat', prop: 'hint', value: 'Required' } },
      { type: 'INJECT_VALIDATION_ISSUES', payload: { path: 'vat', issues: ['Unknown VAT'] } },
      { type: 'SET_LANGUAGE', payload: { lang: 'es' } },
      {
        type: 'SET_FORM_HEALTH',
        payload: { formHealth: { status: 'errored', code: 2000, message: 'stopped' } },
      },
      { type: 'SET_FORM_HEALTH', payload: { formHealth: { status: 'ok' } } },
    ];
    const reduce = reducerWith();

    let state = afterInitialize;
    for (const action of actions) {
      state = reduce(state, action);
      expect(state.compiled, `after ${action.type}`).toBe(afterInitialize.compiled);
    }
  });

  it('is built again from the new definition at a second INITIALIZE', () => {
    const first = drive([initialize(signUpForm), { type: 'SET_DATA', payload: { data: {} } }]);

    const second = reducerWith()(
      first,
      initialize({ form: [{ uid: 'only', kind: 'display', type: 'heading' }] }),
    );

    expect(second.compiled).not.toBe(first.compiled);
    expect(second.compiled.root?.children.map((child) => child.source.uid)).toEqual(['only']);
    expect(second.compiled.states).toEqual([]);
  });

  it.each([
    ['a text that is not JSON', '{ not json', errorCodes.initializeParseError],
    [
      'a widget of an unknown kind',
      { form: [{ kind: 'unknown', type: 'x' }] },
      errorCodes.initializeUnknownError,
    ],
    [
      'an array of widgets',
      [{ kind: 'display', type: 'heading' }],
      errorCodes.initializeMalformedFormShapeError,
    ],
  ])('is the empty compiled form for %s', (_case, formDef, code) => {
    const previous = drive([initialize(signUpForm)]);

    const state = reducerWith()(previous, initialize(formDef));

    expect(state.formHealth).toMatchObject({ status: 'errored', code });
    expect(state.compiled).toEqual({ root: undefined, states: [] });
  });

  it('has no widget and the compiled states for a definition with a repeated uid', () => {
    const state = drive([
      initialize({
        states: { company: '$form.kind === "company"' },
        form: [
          { uid: 'same', kind: 'display', type: 'heading' },
          { uid: 'same', kind: 'display', type: 'text' },
        ],
      }),
    ]);

    expect(state.formHealth).toMatchObject({
      status: 'errored',
      code: errorCodes.initializeUidCollisionError,
    });
    expect(state.compiled.root).toBeUndefined();
    // The states are evaluated when the host clears the error, so they are compiled.
    expect(state.compiled.states.map((compiledState) => compiledState.name)).toEqual(['company']);
  });

  it('gives a form health error, and no exception, when the keys of a prop object can be listed one time only', () => {
    let listings = 0;
    const props = new Proxy(
      { text: 'Hello' },
      {
        ownKeys(target): (string | symbol)[] {
          listings += 1;
          if (listings > 1) {
            throw new Error('the keys are gone');
          }
          return Reflect.ownKeys(target);
        },
      },
    );

    const state = drive([
      initialize({ form: [{ uid: 'title', kind: 'display', type: 'heading', props }] }),
    ]);

    expect(state.formHealth).toEqual({
      status: 'errored',
      code: errorCodes.initializeUnknownError,
      message: '[22] The form definition cannot be read: the keys are gone',
    });
    expect(state.compiled).toEqual({ root: undefined, states: [] });
  });

  it('keeps the error of a prop that can be read one time only for the derive', () => {
    let reads = 0;
    const props = {
      get text(): string {
        reads += 1;
        if (reads > 1) {
          throw new Error('second read');
        }
        return 'first';
      },
    };

    const afterInitialize = drive([
      initialize({ form: [{ uid: 'title', kind: 'display', type: 'heading', props }] }),
    ]);
    const afterData = reducerWith()(afterInitialize, { type: 'SET_DATA', payload: { data: {} } });

    expect(afterInitialize.formHealth).toEqual({ status: 'ok' });
    expect(afterData.formHealth).toEqual({
      status: 'errored',
      code: errorCodes.calculateWidgetPropsError,
      message: '[12] second read',
    });
  });

  it('does not read a key that the props do not have', () => {
    const props = new Proxy(
      { text: 'Hello' },
      {
        get(target: Record<string, unknown>, key: string | symbol): unknown {
          if (typeof key === 'string' && !(key in target)) {
            throw new Error(`unknown prop ${key}`);
          }
          return Reflect.get(target, key);
        },
      },
    );

    const state = drive([
      initialize({
        // The state is never active, so no derive reads the key `text.other`.
        states: { other: 'false' },
        form: [{ uid: 'title', kind: 'display', type: 'heading', props }],
      }),
      { type: 'SET_DATA', payload: { data: {} } },
    ]);

    expect(state.formHealth).toEqual({ status: 'ok' });
    expect(state.calculatedWidgets['title'].current.props).toEqual({ text: 'Hello' });
  });

  it('keeps the error of an expression for the derive, and INITIALIZE stays healthy', () => {
    const state = drive([
      initialize({
        states: { broken: '$form..x' },
        form: [
          {
            uid: 'title',
            kind: 'display',
            type: 'heading',
            include: { when: '$form.tags.pop() === 1' },
            props: { text: '{{ $form..y }}' },
          },
        ],
      }),
    ]);

    expect(state.formHealth).toEqual({ status: 'ok' });
    const [title] = state.compiled.root?.children ?? [];
    const { include } = title.conditions;
    expect(include !== undefined && 'when' in include && include.when.failure).toBeInstanceOf(
      ExpressionRejectedError,
    );
    expect(state.compiled.states[0].condition.failure).toBeInstanceOf(SyntaxError);
  });

  it.each([
    ['warn', false],
    ['strict', true],
    [undefined, false],
  ] as const)(
    'compiles with the expression policy %s of the form',
    (expressionPolicy, methodOutsideTheListFails) => {
      const state = drive(
        [
          initialize({
            form: [
              {
                uid: 'title',
                kind: 'display',
                type: 'heading',
                include: { when: "$form.code.padEnd(4, '-') === 'ab--'" },
              },
            ],
          }),
        ],
        expressionPolicy,
      );

      const [title] = state.compiled.root?.children ?? [];
      const { include } = title.conditions;
      const condition = include !== undefined && 'when' in include ? include.when : undefined;
      expect(condition?.failure !== undefined).toBe(methodOutsideTheListFails);
      expect(condition?.warning !== undefined).toBe(!methodOutsideTheListFails);
    },
  );
});
