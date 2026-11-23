import { type StandardSchemaV1 } from '@standard-schema/spec';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { type ValidatorFn } from '../form-validator';
import { type FormWidget } from '../form-widget';
import { type I18nParams, type I18nTranslator, type TranslationKey } from '../i18n';
import { type ExpressionFunctions } from '../shared';
import { isPlainObject } from '../utils/object';
import { type Action } from './actions';
import { createInitialState, type State } from './model';
import { reducer } from './reducer';

/**
 * The computed state of complete forms, compared with recorded files.
 *
 * Each `goldens/<case>.input.json` holds a form definition with its data and meta. The inputs are
 * copies of the example forms of `apps/apps-shared/src/lib/mocks`, so a change of an example does
 * not change a result here. Each `goldens/<case>.output.json` holds the state after each step of
 * {@link stepsOf}, with the parts that {@link snapshotOf} names.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/store/reducer.goldens.spec.ts
 * To record an intended change, add `-u` to that command and review the diff of the files.
 */

const GOLDENS_DIRECTORY = join(__dirname, 'goldens');
const INPUT_SUFFIX = '.input.json';

// -----------------------------------------------------------------------------
// What the forms get from the host
// -----------------------------------------------------------------------------

type ValidatorRules = { required?: boolean };

/** Only `required` is supported: an empty value gives the message `required`. */
const validators: ValidatorFn<ValidatorRules | undefined> = (rules): StandardSchemaV1 => ({
  '~standard': {
    version: 1,
    vendor: 'reducer-goldens-spec',
    validate: (value: unknown) => {
      const isEmpty =
        value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0);
      if (isPlainObject(rules) && rules.required === true && isEmpty) {
        return { issues: [{ message: 'required' }] };
      }
      return { value };
    },
  },
});

/** Gives a text that shows the key, the params and the default text that the form passed. */
const translator: I18nTranslator = {
  get lang() {
    return 'en-US';
  },
  translate(key: TranslationKey, params?: I18nParams, defaultValue?: string): string {
    const shownParams = params === undefined ? '' : ` ${serialize(params, 0)}`;
    const shownDefault = defaultValue === undefined ? '' : ` (default: ${defaultValue})`;
    return `translated[${key}]${shownParams}${shownDefault}`;
  },
  subscribe(): () => void {
    return () => undefined;
  },
};

type LineItem = { quantity?: number; unitPrice?: number };

const lineTotal = (item: LineItem | undefined): number =>
  (item?.quantity ?? 0) * (item?.unitPrice ?? 0);

/** The functions that the expressions of the input forms call as `$fn.<name>(...)`. */
const functions: ExpressionFunctions = {
  lineTotal,
  grandTotal: (items: LineItem[] | undefined) =>
    (items ?? []).reduce((total, item) => total + lineTotal(item), 0),
  hasItems: (items: unknown[] | undefined) => (items?.length ?? 0) > 0,
  formatMoney: (amount: number, currency: string | undefined) =>
    `${currency ?? 'USD'} ${amount.toFixed(2)}`,
};

// -----------------------------------------------------------------------------
// The steps and the recorded state
// -----------------------------------------------------------------------------

type GoldenInput = {
  formDef: Record<string, unknown>;
  data: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

/**
 * The actions of one case. The form starts with no data, with the three actions that a form
 * component sends. Then the form is submitted while it is empty. Then the host sets the data of
 * the input file, which adds the repeater rows to a submitted form. Then the host sets empty data,
 * which removes the rows.
 */
const stepsOf = ({ formDef, data, meta }: GoldenInput): { name: string; actions: Action[] }[] => [
  {
    name: 'afterStart',
    actions: [
      { type: 'INITIALIZE', payload: { formName: 'golden-form', formDef } },
      { type: 'SET_DATA', payload: { data: {} } },
      { type: 'SET_META', payload: { meta: meta ?? {} } },
    ],
  },
  { name: 'afterSubmit', actions: [{ type: 'VALIDATE_ALL' }] },
  { name: 'afterData', actions: [{ type: 'SET_DATA', payload: { data } }] },
  { name: 'afterEmptyData', actions: [{ type: 'SET_DATA', payload: { data: {} } }] },
];

/**
 * A widget in a short form. A layout lists the uids of its children, and a repeater names its row
 * template by uid, because these parts repeat other widgets. The keys whose value is `undefined`
 * are named in one text, `keysWithUndefined`, so that a file shows that the widget has them.
 */
const compactWidget = (widget: FormWidget<string>): Record<string, unknown> => {
  const compact: Record<string, unknown> = {};
  const keysWithUndefined: string[] = [];
  for (const [key, value] of Object.entries(widget)) {
    if (value === undefined) {
      keysWithUndefined.push(key);
    } else {
      compact[key] = value;
    }
  }
  if (Array.isArray(compact['children'])) {
    compact['children'] = compact['children'].map((child: FormWidget<string>) => child.uid);
  }
  const props = compact['props'];
  if (widget.type === 'repeater' && isPlainObject(props) && isPlainObject(props['template'])) {
    compact['props'] = { ...props, template: { rowTemplateUid: props['template']['uid'] } };
  }
  if (keysWithUndefined.length > 0) {
    compact['keysWithUndefined'] = keysWithUndefined.join(' ');
  }
  return compact;
};

const mapValues = <Value, Result>(
  record: Record<string, Value>,
  map: (value: Value) => Result,
): Record<string, Result> => {
  const mapped: Record<string, Result> = {};
  for (const key of Object.keys(record)) {
    mapped[key] = map(record[key]);
  }
  return mapped;
};

const withSortedKeys = <Value>(record: Record<string, Value>): Record<string, Value> => {
  const sorted: Record<string, Value> = {};
  for (const key of Object.keys(record).sort()) {
    sorted[key] = record[key];
  }
  return sorted;
};

const FLAG_NAMES = ['hidden', 'disabled', 'readonly'] as const;

/**
 * The flags of each widget in the order of {@link FLAG_NAMES}, because no code reads the order of
 * these keys. A hidden widget is written as `{ hidden: true }`, because no code reads the other
 * flags of a hidden widget.
 */
const flagsOf = (state: State): State['widgetFlags'] => {
  const flags: State['widgetFlags'] = {};
  for (const uid of Object.keys(state.widgetFlags)) {
    const widgetFlags = state.widgetFlags[uid];
    if (widgetFlags.hidden === true) {
      flags[uid] = { hidden: true };
      continue;
    }
    flags[uid] = {};
    for (const name of FLAG_NAMES) {
      if (name in widgetFlags) {
        flags[uid][name] = widgetFlags[name];
      }
    }
  }
  return flags;
};

/** The kind, the type and the path of a widget, as one text: `input textinput users.0.name`. */
const summaryOf = (widget: FormWidget<string>): string => {
  const path = (widget as { path?: unknown }).path;
  return typeof path === 'string'
    ? `${widget.kind} ${widget.type} ${path}`
    : `${widget.kind} ${widget.type}`;
};

type Snapshot = {
  /** Parts with one value, such as `isFormValid` and `data`. */
  values: Record<string, unknown>;
  /** Parts that map a uid or a path to an entry, such as `widgetFlags`. */
  records: Record<string, Record<string, unknown>>;
};

/**
 * The parts of the state that a derive or a validation computes. No step writes
 * `widgetPropOverrides`, `injectedValidations` or `widgetReportedIssuePaths`, so they are not
 * recorded.
 *
 * `resolvedSources` and `calculatedWidgets` have the key order of the state, and
 * {@link expectComputedWidgetKeys} checks the order of `calculatedWidgets` in each step. The other
 * records have their keys in alphabetical order, because no code reads the order of their keys.
 *
 * `resolvedSources` holds a summary of each widget and not the widget, because a widget is a copy
 * of a part of the input. `calculatedWidgets` holds the computed widget of each entry, and
 * {@link expectCopiedParts} checks the parts that {@link compactWidget} leaves out.
 */
const snapshotOf = (state: State): Snapshot => ({
  values: {
    formHealth: state.formHealth,
    isFormValid: state.isFormValid,
    touched: state.touched,
    allControlsValidated: state.allControlsValidated,
    currentStates: state.currentStates,
    data: state.data,
  },
  records: {
    validations: withSortedKeys(state.validations),
    touchedControls: withSortedKeys(state.touchedControls),
    widgetFlags: withSortedKeys(flagsOf(state)),
    resolvedSources: mapValues(state.resolvedSources, summaryOf),
    repeaterItemScopes: withSortedKeys(state.repeaterItemScopes),
    repeaterRows: withSortedKeys(state.repeaterRows),
    calculatedWidgets: mapValues(state.calculatedWidgets, (entry) => compactWidget(entry.current)),
  },
});

const UNDEFINED_VALUE = '[undefined]';

/** JSON text in which a key with the value `undefined` is kept, as the text `[undefined]`. */
function serialize(value: unknown, indentation: number): string {
  return JSON.stringify(
    value,
    (_key, item: unknown) => (item === undefined ? UNDEFINED_VALUE : item),
    indentation,
  );
}

const isSame = (first: unknown, second: unknown): boolean =>
  serialize(first, 0) === serialize(second, 0);

const hasKey = (record: Record<string, unknown>, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(record, key);

/**
 * What a step changed in one record. `allEntries` holds the record when every entry is new or has
 * a new value. Otherwise `changedEntries` holds the entries that are new or have a new value, and
 * `removedKeys` the keys that are gone.
 *
 * @param hasOrderOfState - True for `resolvedSources`, the record whose key order a file must
 *   show. When a key was added or moved, `keys` holds the whole list of keys.
 */
const recordDifference = (
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  hasOrderOfState: boolean,
): Record<string, unknown> => {
  const keysAfter = Object.keys(after);
  const changedEntries: Record<string, unknown> = {};
  for (const key of keysAfter) {
    if (!hasKey(before, key) || !isSame(before[key], after[key])) {
      changedEntries[key] = after[key];
    }
  }
  if (Object.keys(changedEntries).length === keysAfter.length) {
    return { allEntries: changedEntries };
  }

  const keptKeys = Object.keys(before).filter((key) => hasKey(after, key));
  const removedKeys = Object.keys(before).filter((key) => !hasKey(after, key));
  const difference: Record<string, unknown> = {};
  if (hasOrderOfState && !isSame(keptKeys, keysAfter)) {
    difference['keys'] = keysAfter;
  } else if (removedKeys.length > 0) {
    difference['removedKeys'] = removedKeys;
  }
  if (Object.keys(changedEntries).length > 0) {
    difference['changedEntries'] = changedEntries;
  }
  return difference;
};

/** The parts of a snapshot that differ from the snapshot of the step before it. */
const differenceOf = (before: Snapshot, after: Snapshot): Record<string, unknown> => {
  const difference: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(after.values)) {
    if (!isSame(before.values[name], value)) {
      difference[name] = value;
    }
  }
  for (const [name, entries] of Object.entries(after.records)) {
    if (!isSame(before.records[name], entries)) {
      difference[name] = recordDifference(
        before.records[name],
        entries,
        name === 'resolvedSources',
      );
    }
  }
  return difference;
};

type WidgetParts = { children?: unknown[]; props?: Record<string, unknown> };

/**
 * Checks the parts of each computed entry that an output file does not hold, because they are the
 * objects of another widget: the source of the entry, the child widgets of a layout and the row
 * template of a repeater.
 */
const expectCopiedParts = (state: State, stepName: string): void => {
  for (const [uid, entry] of Object.entries(state.calculatedWidgets)) {
    const place = `${uid} after ${stepName}`;
    // `toStrictEqual` fails when a key with the value undefined is missing.
    expect(entry.source, `the source of ${place}`).toStrictEqual(state.resolvedSources[uid]);

    const current: WidgetParts = entry.current;
    const source: WidgetParts = entry.source;
    for (const child of current.children ?? []) {
      expect(source.children, `a child of ${place}`).toContain(child);
    }
    if (entry.source.type === 'repeater') {
      expect(current.props?.['template'], `the row template of ${place}`).toBe(
        source.props?.['template'],
      );
    }
  }
};

/** The computed widgets are the widgets of `resolvedSources` that are not hidden, in that order. */
const expectComputedWidgetKeys = (state: State, stepName: string): void => {
  const visibleUids = Object.keys(state.resolvedSources).filter(
    (uid) => state.widgetFlags[uid]?.hidden !== true,
  );
  expect(Object.keys(state.calculatedWidgets), `the computed widgets after ${stepName}`).toEqual(
    visibleUids,
  );
};

/**
 * The text of an output file. The first step has every part of the state. Each step after it has
 * only what differs from the step before it.
 */
const record = (input: GoldenInput): string => {
  const reduce = reducer({
    validators,
    validateOn: 'eager',
    localization: translator,
    functions,
  });
  const recorded: Record<string, unknown> = {};
  let state = createInitialState('en-US');
  let previous: { state: State; text: string; snapshot: Snapshot } | undefined;

  for (const step of stepsOf(input)) {
    state = step.actions.reduce(reduce, state);
    expectCopiedParts(state, step.name);
    expectComputedWidgetKeys(state, step.name);

    if (previous !== undefined) {
      // An action must not change an object of the state before it.
      expect(serialize(snapshotOf(previous.state), 0), `the state before ${step.name}`).toBe(
        previous.text,
      );
    }

    const text = serialize(snapshotOf(state), 0);
    // A copy, so that no step after this one can change what this step recorded.
    const snapshot = JSON.parse(text) as Snapshot;
    recorded[step.name] =
      previous === undefined
        ? { ...snapshot.values, ...snapshot.records }
        : differenceOf(previous.snapshot, snapshot);
    previous = { state, text, snapshot };
  }

  return `${serialize(recorded, 2)}\n`;
};

const readInput = (fileName: string): GoldenInput => {
  try {
    return JSON.parse(readFileSync(join(GOLDENS_DIRECTORY, fileName), 'utf8')) as GoldenInput;
  } catch (error) {
    throw new Error(`The golden input ${fileName} cannot be read: ${String(error)}`);
  }
};

const cases = readdirSync(GOLDENS_DIRECTORY)
  .filter((fileName) => fileName.endsWith(INPUT_SUFFIX))
  .sort()
  .map((fileName): [string, GoldenInput, string] => {
    const name = fileName.slice(0, -INPUT_SUFFIX.length);
    return [name, readInput(fileName), join(GOLDENS_DIRECTORY, `${name}.output.json`)];
  });

describe('reducer: the recorded states of complete forms', () => {
  it.each(cases)('gives the recorded states for %s', async (_name, input, outputPath) => {
    await expect(record(input)).toMatchFileSnapshot(outputPath);
  });
});
