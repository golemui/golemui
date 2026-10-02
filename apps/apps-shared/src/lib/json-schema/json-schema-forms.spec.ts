import { FormContext, identityTranslator } from '@golemui/core';
import { guiPreset } from '@golemui/gui-schemas/json-schema';
import { initValidators } from '@golemui/gui-validators';
import { fromJsonSchema, type JsonSchema } from '@golemui/schemas/json-schema';
import { describe, expect, it } from 'vitest';

// End to end: a JSON Schema goes through the converter with the gui preset, and the form
// definition it produces runs in the real form store with the real gui validators. This is
// what shows that the generated conditions, states and state validators do what the schema
// says, which the converter specs alone cannot.

/** A form store running the form definition converted from `schema`. */
function formFor(schema: JsonSchema) {
  const { formDefinition, diagnostics } = fromJsonSchema(schema, {
    preset: guiPreset({ submitAction: false }),
  });
  const context = new FormContext<unknown>();
  context.initialize({}, [], initValidators(), 'eager', {}, identityTranslator('en-US'), {});
  context.store.dispatch({
    type: 'INITIALIZE',
    payload: { formName: 'json-schema', formDef: formDefinition },
  });
  return { context, diagnostics };
}

/** Sets the data, validates every field and returns the state and the data a submit sends. */
function submit(context: FormContext<unknown>, data: Record<string, unknown>) {
  context.store.dispatch({ type: 'SET_DATA', payload: { data } });
  let submitted: Record<string, unknown> | undefined;
  const subscription = context.submit$.subscribe((event) => {
    submitted = event.data;
  });
  context.emitSubmitEvent();
  subscription.unsubscribe();
  const state = context.store.getState();
  expect(state.formHealth).toEqual({ status: 'ok' });
  return { state, submitted };
}

/** The paths that have validation errors. */
function invalidPaths(state: ReturnType<FormContext<unknown>['store']['getState']>): string[] {
  return Object.entries(state.validations)
    .filter(([, issues]) => Array.isArray(issues) && issues.length > 0)
    .map(([path]) => path)
    .sort();
}

const objectOf = (properties: JsonSchema, extra: JsonSchema = {}): JsonSchema => ({
  type: 'object',
  properties,
  ...extra,
});

describe('JSON Schema forms in the form store: if/then/else', () => {
  const address = objectOf(
    { country: { type: 'string', enum: ['US', 'NL'] }, zip: { type: 'string' } },
    {
      required: ['country'],
      if: { properties: { country: { const: 'US' } }, required: ['country'] },
      then: {
        properties: { zip: { pattern: '^[0-9]{5}$' }, state: { type: 'string' } },
        required: ['zip', 'state'],
      },
      else: { properties: { zip: { pattern: '^[0-9]{4}[A-Z]{2}$' } } },
    },
  );

  it('applies the then branch: its pattern and its required property', () => {
    const { context, diagnostics } = formFor(address);
    expect(diagnostics).toEqual([]);

    const { state, submitted } = submit(context, { country: 'US', zip: '1234AB' });

    expect(invalidPaths(state)).toEqual(['state', 'zip']);
    expect(submitted).toBeUndefined();
  });

  it('accepts data that satisfies the then branch', () => {
    const { context } = formFor(address);

    const { state, submitted } = submit(context, { country: 'US', zip: '12345', state: 'CA' });

    expect(invalidPaths(state)).toEqual([]);
    expect(submitted).toEqual({ country: 'US', zip: '12345', state: 'CA' });
  });

  it('applies the else branch and removes the hidden then property on submit', () => {
    const { context } = formFor(address);

    expect(invalidPaths(submit(context, { country: 'NL', zip: '12345' }).state)).toEqual(['zip']);
    const { submitted } = submit(context, { country: 'NL', zip: '1234AB', state: 'CA' });
    expect(submitted).toEqual({ country: 'NL', zip: '1234AB' });
  });
});

describe('JSON Schema forms in the form store: discriminated oneOf', () => {
  const payment = {
    oneOf: [
      objectOf(
        { method: { const: 'card' }, cardNumber: { type: 'string' } },
        { required: ['method', 'cardNumber'] },
      ),
      objectOf(
        { method: { const: 'bank' }, iban: { type: 'string' } },
        { required: ['method', 'iban'] },
      ),
    ],
  };

  it('requires the properties of the chosen branch only', () => {
    const { context } = formFor(objectOf({ payment }));

    expect(invalidPaths(submit(context, { payment: { method: 'card' } }).state)).toEqual([
      'payment.cardNumber',
    ]);
    expect(invalidPaths(submit(context, { payment: { method: 'bank' } }).state)).toEqual([
      'payment.iban',
    ]);
  });

  it('sends only the chosen branch', () => {
    const { context } = formFor(objectOf({ payment }));

    const { submitted } = submit(context, {
      payment: { method: 'bank', iban: 'NL00BANK0123456789', cardNumber: '4111' },
    });

    expect(submitted).toEqual({ payment: { method: 'bank', iban: 'NL00BANK0123456789' } });
  });

  it('decides per row inside an array, through $item', () => {
    const { context } = formFor(objectOf({ payments: { type: 'array', items: payment } }));

    const { state, submitted } = submit(context, {
      payments: [{ method: 'card' }, { method: 'bank', iban: 'X', cardNumber: '4111' }],
    });

    expect(invalidPaths(state)).toEqual(['payments.0.cardNumber']);
    expect(submitted).toBeUndefined();
    const fixed = submit(context, {
      payments: [
        { method: 'card', cardNumber: '4111' },
        { method: 'bank', iban: 'X', cardNumber: '9' },
      ],
    });
    expect(fixed.submitted).toEqual({
      payments: [
        { method: 'card', cardNumber: '4111' },
        { method: 'bank', iban: 'X' },
      ],
    });
  });
});

describe('JSON Schema forms in the form store: dependencies and arrays', () => {
  it('requires billing only when card is present', () => {
    const { context } = formFor(
      objectOf(
        { card: { type: 'string' }, billing: { type: 'string' } },
        { dependentRequired: { card: ['billing'] } },
      ),
    );

    expect(invalidPaths(submit(context, { card: '4111' }).state)).toEqual(['billing']);
    expect(invalidPaths(submit(context, {}).state)).toEqual([]);
  });

  it('validates the rows of an array on a property named items', () => {
    const { context } = formFor(
      objectOf({
        invoice: objectOf({
          items: {
            type: 'array',
            items: objectOf({ sku: { type: 'string' } }, { required: ['sku'] }),
          },
        }),
      }),
    );

    const { state } = submit(context, { invoice: { items: [{ sku: 'A-1' }, {}] } });

    expect(invalidPaths(state)).toEqual(['invoice.items.1.sku']);
  });
});
