import { describe, expect, it } from 'vitest';
import {
  dataReference,
  equalsAny,
  innermostItemNode,
  literal,
  pathExpression,
} from './expressions';
import { type JsonType, type SchemaNode } from './types';

const node = (path: string, type: JsonType, parent?: SchemaNode): SchemaNode => ({
  schema: { type },
  type,
  nullable: false,
  path,
  pointer: '',
  required: false,
  repeaterDepth: 0,
  parent,
});

describe('literal', () => {
  it.each([
    ['card', '"card"'],
    ['say "hi"', '"say \\"hi\\""'],
    ['a.1', '"a." + "1"'],
    ['1.2.3', '"1." + "2." + "3"'],
    ['v.x', '"v.x"'],
    [1.5, '1.5'],
    [-3, '-3'],
    [true, 'true'],
    [null, 'null'],
  ])('%j -> %s', (value, expected) => {
    expect(literal(value)).toBe(expected);
  });
});

describe('pathExpression', () => {
  it.each([
    [['payment'], '$form.payment'],
    [['payment', 'method'], '$form.payment?.method'],
    [['zip-code'], '$form["zip-code"]'],
    [['address', 'zip-code'], '$form.address?.["zip-code"]'],
    [['point', '0'], '$form.point?.["0"]'],
    [['items', 'items'], '$form.items?.items'],
  ])('%j -> %s', (segments, expected) => {
    expect(pathExpression('$form', segments)).toBe(expected);
  });
});

describe('dataReference', () => {
  const root = node('', 'object');

  it('reads through $form outside repeaters', () => {
    const payment = node('payment', 'object', root);

    expect(dataReference(payment, 'payment.method')).toBe('$form.payment?.method');
    expect(dataReference(root, 'method')).toBe('$form.method');
  });

  it('reads through $item inside a repeater row', () => {
    const lines = node('lines', 'array', root);
    const item = node('lines.items', 'object', lines);
    const payment = node('lines.items.payment', 'object', item);

    expect(innermostItemNode(payment)).toBe(item);
    expect(dataReference(payment, 'lines.items.payment.method')).toBe('$item.payment?.method');
    expect(dataReference(item, 'lines.items.method')).toBe('$item.method');
  });

  it('reads the innermost row of nested repeaters', () => {
    const teams = node('teams', 'array', root);
    const team = node('teams.items', 'object', teams);
    const devs = node('teams.items.devs', 'array', team);
    const dev = node('teams.items.devs.items', 'object', devs);

    expect(dataReference(dev, 'teams.items.devs.items.role')).toBe('$item.role');
  });

  it('finds the row of an array on a property named items', () => {
    const invoice = node('invoice', 'object', root);
    const lines = node('invoice.items', 'array', invoice);
    const line = node('invoice.items.items', 'object', lines);

    expect(dataReference(line, 'invoice.items.items.kind')).toBe('$item.kind');
  });

  it('does not treat a tuple position as a row', () => {
    const point = node('point', 'array', root);
    const x = node('point.0', 'object', point);

    expect(innermostItemNode(x)).toBeUndefined();
    expect(dataReference(x, 'point.0.unit')).toBe('$form.point?.["0"]?.unit');
  });
});

describe('equalsAny', () => {
  it('compares with one value, or with several joined by ||', () => {
    expect(equalsAny('$form.kind', ['a'])).toBe('$form.kind === "a"');
    expect(equalsAny('$item.size', [1, 2])).toBe('($item.size === 1 || $item.size === 2)');
  });
});
