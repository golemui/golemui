import { type StandardSchemaV1 } from '@standard-schema/spec';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type ValidatorFn } from '../form-validator';
import {
  identityTranslator,
  type I18nParams,
  type I18nTranslator,
  type TranslationKey,
} from '../i18n';
import { type ExpressionPolicy } from '../utils/check-expression';
import { type Action } from './actions';
import { createInitialState, type State } from './model';
import { reducer } from './reducer';

/**
 * How the reducer reads, checks and evaluates the text of an expression: conditions, `{{ }}`
 * templates and translation params. Each test sends `INITIALIZE` and `SET_DATA`, and reads the
 * form health, `widgetFlags` or `calculatedWidgets` of the state that results.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/store/reducer.expressions.spec.ts
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

/** The parser puts this combining character after the character at the error position. */
const ERROR_POSITION_MARK = String.fromCodePoint(0x32d);

const BOTH_POLICIES: ExpressionPolicy[] = ['warn', 'strict'];

type RecordedCall = { key: TranslationKey; params?: I18nParams };

/** A translator that returns the key and records the params of each call. */
const makeRecordingTranslator = (): I18nTranslator & { calls: RecordedCall[] } => {
  const calls: RecordedCall[] = [];
  return {
    get lang() {
      return 'en-US';
    },
    translate(key: TranslationKey, params?: I18nParams): string {
      calls.push({ key, params });
      return key;
    },
    subscribe(): () => void {
      return () => undefined;
    },
    calls,
  };
};

type Scenario = {
  /** The widgets of the form. */
  form: Record<string, unknown>[];
  data?: Record<string, unknown>;
  expressionPolicy?: ExpressionPolicy;
  translator?: I18nTranslator;
};

/** Initializes a form with the given widgets, sets the data, and returns the state that results. */
const run = ({
  form,
  data = {},
  expressionPolicy = 'warn',
  translator = identityTranslator('en-US'),
}: Scenario): State => {
  const reduce = reducer({
    validators,
    validateOn: 'eager',
    localization: translator,
    functions: {},
    expressionPolicy,
  });
  const actions: Action[] = [
    { type: 'INITIALIZE', payload: { formName: 'test-form', formDef: { form } } },
    { type: 'SET_DATA', payload: { data } },
  ];
  return actions.reduce(reduce, createInitialState('en-US'));
};

const heading = (uid: string, fields: Record<string, unknown> = {}) => ({
  kind: 'display',
  uid,
  type: 'heading',
  ...fields,
});

/** A repeater whose row layout has the uid `<uid>-template`. */
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

const textOf = (state: State, uid: string): unknown =>
  state.calculatedWidgets[uid]?.current.props?.['text'];

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('reducer: expressions', () => {
  describe('reading values', () => {
    it('reads an array element for a numeric index written with a dot in a condition', () => {
      const next = run({
        form: [
          heading('first', { include: { when: '$form.list.0.a === 1' } }),
          heading('second', { include: { when: '$form.list.1.a === 1' } }),
        ],
        data: { list: [{ a: 0 }, { a: 1 }] },
      });

      expect(next.formHealth).toEqual({ status: 'ok' });
      expect(next.widgetFlags['first']).toEqual({ hidden: true });
      expect(next.widgetFlags['second']).toEqual({ hidden: false });
    });

    it('reads a scope name that is not an arrow parameter inside the arrow body', () => {
      const next = run({
        form: [
          repeater('rows', 'rows', [
            heading('rowSums', { props: { text: '{{ $form.list.map(x => x.a + $index) }}' } }),
          ]),
        ],
        data: { list: [{ a: 1 }, { a: 2 }], rows: [{}, {}] },
      });

      expect(next.formHealth).toEqual({ status: 'ok' });
      expect(textOf(next, 'rowSums[0]')).toBe('1,2');
      expect(textOf(next, 'rowSums[1]')).toBe('2,3');
    });
  });

  describe('texts that do not compile', () => {
    it.each([
      [
        'an include.when condition',
        heading('title', { include: { when: '$form..x' } }),
        11,
        `[11] Unexpected token at 1:6\n$form.${ERROR_POSITION_MARK}.x`,
      ],
      [
        'a {{ }} template',
        heading('title', { props: { text: 'Value: {{ $form..x }}' } }),
        40,
        `[40] Failed to evaluate '{{$form..x}}': Unexpected token at 1:6\n$form.${ERROR_POSITION_MARK}.x`,
      ],
    ])('reports the parse error of %s with the line and column', (_site, widget, code, message) => {
      const next = run({ form: [widget] });

      expect(next.formHealth).toEqual({ status: 'errored', code, message });
    });

    it.each([
      ['()', heading('title', { include: { when: '()' } }), 11, '[11] Empty ()'],
      ['$form[]', heading('title', { include: { when: '$form[]' } }), 11, '[11] Missing index'],
      [
        '$fn.f(1,,2)',
        heading('title', { props: { text: '{{ $fn.f(1,,2) }}' } }),
        40,
        "[40] Failed to evaluate '{{$fn.f(1,,2)}}': Empty argument",
      ],
    ])(
      'reports the compile error of %s, which the security check accepts',
      (_text, widget, code, message) => {
        for (const expressionPolicy of BOTH_POLICIES) {
          const next = run({ form: [widget], expressionPolicy });

          expect(next.formHealth).toEqual({ status: 'errored', code, message });
        }
      },
    );

    it('reports the error of a condition when a template of the same form is rejected', () => {
      // The template widget comes first, so the order of the widgets does not decide the error.
      const next = run({
        form: [
          heading('greeting', { props: { text: '{{ $form.tags.pop() }}' } }),
          heading('gate', { include: { when: '$form.missing.deep === 1' } }),
        ],
        data: { tags: ['a'] },
      });

      expect(next.formHealth).toEqual({
        status: 'errored',
        code: 11,
        message: "[11] Cannot read properties of undefined (reading 'deep')",
      });
    });
  });

  describe('texts that the security check rejects', () => {
    const makeData = () => ({ a: 1, n: 1, tags: ['a'] });

    it.each([
      [
        'a forbidden name as an identifier',
        '__lookupGetter__',
        'The name "__lookupGetter__" is not allowed as an identifier.',
      ],
      [
        'a forbidden name as a property',
        '$form.constructor',
        'The name "constructor" is not allowed as a property name.',
      ],
      [
        'a forbidden name as a literal computed key',
        "$form['__proto__']",
        'The name "__proto__" is not allowed as a computed key.',
      ],
      [
        'a forbidden name as an object key',
        '({ __defineGetter__: 1 }) !== null',
        'The name "__defineGetter__" is not allowed as an object key.',
      ],
      [
        'a forbidden name as an arrow parameter',
        '$form.tags.some(prototype => prototype)',
        'The name "prototype" is not allowed as an arrow parameter.',
      ],
      [
        'a Date write method',
        '$form.start.setFullYear(2000)',
        'The method "setFullYear" changes the Date in place, so it writes into the data. Expressions can only read.',
      ],
      [
        'a Map or Set write method',
        "$meta.cache.set('a', 1)",
        'The method "set" changes a Map or a Set in place, so it writes into the data. Expressions can only read. If the value is immutable, call the method in a $fn function.',
      ],
      ['a tagged template', '$fn.tag`x`', 'A tagged template (tag`...`) calls the tag function.'],
      ['the new operator', 'new Date()', '"new" calls a constructor.'],
      ['the ++ operator', '$form.n++', '"++" writes into the data. Expressions can only read.'],
      [
        'the delete operator',
        'delete $form.a',
        '"delete" removes a property from the data. Expressions can only read.',
      ],
      [
        'a syntax that the check does not support',
        '...$form.tags',
        'The syntax "..." is not supported in expressions.',
      ],
    ])('fails a condition with %s with both policies', (_kind, text, issueMessage) => {
      for (const expressionPolicy of BOTH_POLICIES) {
        const next = run({
          form: [heading('title', { include: { when: text } })],
          data: makeData(),
          expressionPolicy,
        });

        expect(next.formHealth).toEqual({
          status: 'errored',
          code: 50,
          message: `[50] Rejected expression "${text}": [EXPRESSION_REJECTED] ${issueMessage}`,
        });
        expect(next.data).toEqual(makeData());
      }
    });

    it.each(['$form', '$meta', '$errors', '$formIsInvalid', '$fn', '$item', '$index', '$log'])(
      'fails an arrow parameter named %s with both policies',
      (name) => {
        const expression = `$form.list.map(${name} => 1)`;

        for (const expressionPolicy of BOTH_POLICIES) {
          const next = run({
            form: [heading('title', { props: { text: `{{ ${expression} }}` } })],
            data: { list: [1] },
            expressionPolicy,
          });

          expect(next.formHealth).toEqual({
            status: 'errored',
            code: 50,
            message: `[50] Rejected expression "${expression}": [EXPRESSION_REJECTED] The arrow parameter "${name}" has the name of a scope value and would hide it.`,
          });
        }
      },
    );

    it('quotes a rejected condition with the spaces at its start and end', () => {
      const next = run({
        form: [heading('title', { include: { when: '  $form.tags.pop()  ' } })],
        data: { tags: ['a'] },
      });

      expect(next.formHealth).toEqual({
        status: 'errored',
        code: 50,
        message:
          '[50] Rejected expression "  $form.tags.pop()  ": [EXPRESSION_REJECTED] The method "pop" changes the array in place, so it writes into the data. Expressions can only read.',
      });
    });
  });

  describe('translation params', () => {
    it('passes a param that starts with a space as a text', () => {
      const translator = makeRecordingTranslator();
      const next = run({
        form: [
          {
            kind: 'action',
            uid: 'save',
            type: 'button',
            label: { key: 'save', params: { spaced: ' $form.n', plain: '$form.n' } },
          },
        ],
        data: { n: 5 },
        translator,
      });

      expect(next.formHealth).toEqual({ status: 'ok' });
      expect(translator.calls[0].params).toEqual({ spaced: ' $form.n', plain: 5 });
    });
  });

  describe('$log', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('logs the label and then the value for a $log call with a label', () => {
      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);

      const next = run({
        form: [heading('total', { props: { text: "Total: {{ $log($form.total, 'total') }}" } })],
        data: { total: 30 },
      });

      expect(next.formHealth).toEqual({ status: 'ok' });
      expect(textOf(next, 'total')).toBe('Total: 30');
      expect(consoleLog).toHaveBeenCalledWith('total', 30);
    });
  });
});
