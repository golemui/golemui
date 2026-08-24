import { type StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';
import { type ValidatorFn } from '../form-validator';
import { identityTranslator } from '../i18n';
import { type Action } from './actions';
import { createInitialState, type State } from './model';
import { reducer } from './reducer';

/**
 * Keeps the cost of a derive in check: every input-changing action recomputes every visible
 * widget, so a large repeater must stay well inside interactive budgets.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/store/reducer.perf.spec.ts
 */

const ROWS = 200;
const EDITS = 20;
const BUDGET_MS = 2000;
const ITERATIONS = 5;

const validators: ValidatorFn<unknown> = (): StandardSchemaV1 => ({
  '~standard': { version: 1, vendor: 'reducer-perf-spec', validate: (value) => ({ value }) },
});

const makeFormDef = () => ({
  form: [
    {
      uid: 'rows',
      kind: 'input',
      type: 'repeater',
      path: 'rows',
      props: {
        template: {
          uid: 'row',
          kind: 'layout',
          type: 'flex',
          children: [
            { uid: 'a', kind: 'input', type: 'textinput', path: 'rows.items.a' },
            { uid: 'b', kind: 'input', type: 'textinput', path: 'rows.items.b' },
            { uid: 'c', kind: 'input', type: 'textinput', path: 'rows.items.c' },
            {
              uid: 'summary',
              kind: 'display',
              type: 'heading',
              props: { text: 'Row {{$index}}: {{$item.a}} / {{$item.b}}' },
            },
          ],
        },
      },
    },
  ],
});

const makeRows = () =>
  Array.from({ length: ROWS }, (_, index) => ({ a: `a${index}`, b: `b${index}`, c: `c${index}` }));

// INITIALIZE writes into the form array, so every run builds its own formDef and state.
const runScenario = (): { state: State; elapsedMs: number } => {
  const reduce = reducer({
    validators,
    validateOn: 'eager',
    localization: identityTranslator('en-US'),
    functions: {},
  });
  const actions: Action[] = [
    { type: 'INITIALIZE', payload: { formName: 'perf', formDef: makeFormDef() } },
    { type: 'SET_DATA', payload: { data: { rows: makeRows() } } },
    ...Array.from(
      { length: EDITS },
      (_, index): Action => ({
        type: 'SET_WIDGET_DATA',
        payload: { path: `rows.${index * 7}.a`, data: `edited ${index}` },
      }),
    ),
  ];

  const start = performance.now();
  const state = actions.reduce(
    (current: State, action) => reduce(current, action),
    createInitialState('en-US'),
  );
  return { state, elapsedMs: performance.now() - start };
};

describe('reducer performance', () => {
  it(`derives a ${ROWS}-row repeater on SET_DATA plus ${EDITS} edits with a median under ${BUDGET_MS} ms`, () => {
    // The warmup run also fills the module-level expression compile cache, so the timed
    // iterations measure the steady-state path.
    const warmup = runScenario();
    expect(warmup.state.formHealth.status).toBe('ok');
    expect(Object.keys(warmup.state.calculatedWidgets).length).toBe(ROWS * 5 + 2);
    expect(warmup.state.calculatedWidgets['summary[7]'].current.props?.['text']).toBe(
      'Row 7: edited 1 / b7',
    );

    const timings = Array.from({ length: ITERATIONS }, () => runScenario().elapsedMs);
    const median = [...timings].sort((left, right) => left - right)[Math.floor(ITERATIONS / 2)];

    console.info(
      `[reducer.perf] ${ROWS} rows, SET_DATA + ${EDITS} edits: median ${median.toFixed(0)} ms over ${ITERATIONS} runs (warmup ${warmup.elapsedMs.toFixed(0)} ms)`,
    );
    expect(median).toBeLessThan(BUDGET_MS);
  });
});
