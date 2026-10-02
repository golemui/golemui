import { describe, expect, it } from 'vitest';
import {
  normalizeNode,
  type NormalizedNode,
  type NormalizeEnvironment,
  type NormalizeProblem,
} from './normalize';
import { type JsonSchema } from './types';

/** Normalizes `raw`, the root by default, and collects what it reports. */
const normalize = (
  root: JsonSchema,
  { raw = root as unknown, pointer = '', refTrail = [] as string[], maxRefDepth = 2 } = {},
) => {
  const problems: NormalizeProblem[] = [];
  const environment: NormalizeEnvironment = {
    root,
    maxRefDepth,
    report: (problem) => problems.push(problem),
    pointers: new WeakMap(),
  };
  const node = normalizeNode(raw, pointer, refTrail, environment);
  return { node, problems, environment };
};

const codesOf = (problems: NormalizeProblem[]) => problems.map((problem) => problem.code);

describe('normalizeNode: plain schemas', () => {
  it('keeps a plain object schema and its single type', () => {
    const { node, problems } = normalize({
      type: 'object',
      title: 'Person',
      properties: { name: { type: 'string' } },
    });

    expect(node).toEqual<NormalizedNode>({
      schema: { type: 'object', title: 'Person', properties: { name: { type: 'string' } } },
      type: 'object',
      nullable: false,
      defName: undefined,
      conditionals: [],
      refTrail: [],
      allowedTypes: ['object'],
    });
    expect(problems).toEqual([]);
  });

  it('turns true into an empty schema and false into nothing', () => {
    expect(normalize({}, { raw: true }).node?.schema).toEqual({});
    expect(normalize({}, { raw: false }).node).toBeUndefined();
  });

  it('reports a value that is not a schema', () => {
    const { node, problems } = normalize({}, { raw: 42, pointer: '/properties/age' });

    expect(node).toBeUndefined();
    expect(problems).toEqual([
      expect.objectContaining({ code: 'invalid-schema', pointer: '/properties/age' }),
    ]);
  });

  it('drops the keywords that only matter for resolution', () => {
    const { node } = normalize({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'https://example.com/a.json',
      $defs: { A: {} },
      definitions: { B: {} },
      type: 'string',
    });

    expect(node?.schema).toEqual({ type: 'string' });
  });

  it.each([
    [{ properties: {} }, 'object'],
    [{ required: ['a'] }, 'object'],
    [{ items: { type: 'string' } }, 'array'],
    [{ const: 'fixed' }, 'string'],
    [{ enum: [1, 2, 3] }, 'integer'],
    [{ enum: [1, 2.5] }, 'number'],
    [{ enum: ['a', 1] }, undefined],
    [
      {
        oneOf: [
          { const: 'sm', title: 'Small' },
          { const: 'lg', title: 'Large' },
        ],
      },
      'string',
    ],
    [{ format: 'email' }, 'string'],
    [{ minimum: 0 }, 'number'],
    [{ title: 'anything' }, undefined],
  ])('infers the type of %j as %s', (schema, type) => {
    const { node } = normalize(schema);

    expect(node?.type).toBe(type);
    expect(node?.schema['type']).toBe(type);
  });
});

describe('normalizeNode: $ref', () => {
  const root: JsonSchema = {
    $defs: {
      Address: {
        type: 'object',
        title: 'Address',
        properties: { street: { type: 'string' } },
        required: ['street'],
      },
      Money: { $ref: '#/$defs/Decimal' },
      Decimal: { type: 'number', multipleOf: 0.01 },
    },
  };

  it('merges the target under the keywords next to $ref, which win for annotations', () => {
    const { node, problems } = normalize(root, {
      raw: { $ref: '#/$defs/Address', title: 'Shipping address', required: ['city'] },
      pointer: '/properties/shipping',
    });

    expect(node?.schema).toEqual({
      type: 'object',
      title: 'Shipping address',
      required: ['city', 'street'],
      properties: { street: { type: 'string' } },
    });
    expect(node?.defName).toBe('Address');
    expect(node?.refTrail).toEqual(['#/$defs/Address']);
    expect(problems).toEqual([]);
  });

  it('names the node after the first definition of a ref chain', () => {
    const { node } = normalize(root, { raw: { $ref: '#/$defs/Money' } });

    expect(node?.defName).toBe('Money');
    expect(node?.type).toBe('number');
    expect(node?.refTrail).toEqual(['#/$defs/Money', '#/$defs/Decimal']);
  });

  it('resolves against the reference root, e.g. an OpenAPI document', () => {
    const openApi = { components: { schemas: { User: { type: 'object' } } } };
    const problems: NormalizeProblem[] = [];
    const node = normalizeNode({ $ref: '#/components/schemas/User' }, '/requestBody', [], {
      root: openApi,
      maxRefDepth: 2,
      report: (problem) => problems.push(problem),
      pointers: new WeakMap(),
    });

    expect(node?.defName).toBe('User');
    expect(node?.type).toBe('object');
  });

  it('reports a ref that cannot be resolved and renders nothing', () => {
    const { node, problems } = normalize(root, {
      raw: { $ref: '#/$defs/Missing' },
      pointer: '/properties/x',
    });

    expect(node).toBeUndefined();
    expect(problems).toEqual([
      expect.objectContaining({
        severity: 'error',
        code: 'unresolved-ref',
        pointer: '/properties/x',
      }),
    ]);
  });

  it('stops a recursive ref after maxRefDepth expansions', () => {
    const tree: JsonSchema = {
      $defs: {
        Category: {
          type: 'object',
          properties: { name: { type: 'string' }, parent: { $ref: '#/$defs/Category' } },
        },
      },
    };
    const parentOf = (node: NormalizedNode | undefined) =>
      (node?.schema['properties'] as Record<string, unknown>)['parent'];

    const first = normalize(tree, { raw: { $ref: '#/$defs/Category' } }).node;
    const second = normalize(tree, { raw: parentOf(first), refTrail: first?.refTrail }).node;
    const third = normalize(tree, {
      raw: parentOf(second),
      refTrail: second?.refTrail,
      pointer: '/$defs/Category/properties/parent',
    });

    expect(second?.refTrail).toEqual(['#/$defs/Category', '#/$defs/Category']);
    expect(third.node).toBeUndefined();
    expect(third.problems).toEqual([
      expect.objectContaining({ severity: 'warning', code: 'recursive-ref' }),
    ]);
  });

  it('does not count the same ref in sibling allOf parts as recursion', () => {
    const { node, problems } = normalize(
      { $defs: { Named: { properties: { name: { type: 'string' } } } } },
      { raw: { allOf: [{ $ref: '#/$defs/Named' }, { $ref: '#/$defs/Named' }] }, maxRefDepth: 1 },
    );

    expect(problems).toEqual([]);
    expect(node?.refTrail).toEqual(['#/$defs/Named', '#/$defs/Named']);
  });
});

describe('normalizeNode: allOf', () => {
  it('merges a base definition and an extension', () => {
    const { node } = normalize({
      $defs: {
        Base: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
      },
      allOf: [
        { $ref: '#/$defs/Base' },
        { properties: { email: { type: 'string', format: 'email' } }, required: ['email'] },
      ],
    });

    expect(node?.schema).toEqual({
      type: 'object',
      properties: { id: { type: 'string' }, email: { type: 'string', format: 'email' } },
      required: ['id', 'email'],
    });
    // Two parts: the node is not one definition, so it has no definition name.
    expect(node?.defName).toBeUndefined();
  });

  it('keeps the definition name of a single allOf part next to a description', () => {
    const { node } = normalize({
      $defs: { Address: { type: 'object' } },
      allOf: [{ $ref: '#/$defs/Address' }],
      description: 'Where to send the order',
    });

    expect(node?.defName).toBe('Address');
    expect(node?.schema['description']).toBe('Where to send the order');
  });

  it('merges nested allOf parts', () => {
    const { node } = normalize({
      allOf: [{ allOf: [{ minLength: 2 }, { maxLength: 9 }] }, { type: 'string' }],
    });

    expect(node?.schema).toEqual({ minLength: 2, maxLength: 9, type: 'string' });
  });

  it('reports conflicts as allof-conflict warnings at the part that conflicts', () => {
    const { node, problems } = normalize({
      allOf: [{ type: 'string', pattern: '^a' }, { pattern: '^b' }],
    });

    expect(node?.schema['pattern']).toBe('^a');
    expect(problems).toEqual([
      expect.objectContaining({ severity: 'warning', code: 'allof-conflict', pointer: '/allOf/1' }),
    ]);
  });
});

describe('normalizeNode: conditionals', () => {
  it('moves if/then/else out of the schema', () => {
    const condition = { properties: { country: { const: 'US' } } };
    const { node } = normalize({
      properties: { country: { type: 'string' } },
      if: condition,
      then: { required: ['state'] },
      else: { required: [] },
    });

    expect(node?.schema).toEqual({ properties: { country: { type: 'string' } }, type: 'object' });
    expect(node?.conditionals).toEqual([
      {
        kind: 'if',
        if: condition,
        then: { required: ['state'] },
        else: { required: [] },
        pointer: '',
      },
    ]);
  });

  it('collects the conditionals of every allOf part, the usual way to write several', () => {
    const { node } = normalize({
      allOf: [
        { if: { properties: { a: { const: 1 } } }, then: { required: ['b'] } },
        { if: { properties: { c: { const: 2 } } }, then: { required: ['d'] } },
      ],
    });

    expect(node?.conditionals.map((conditional) => conditional.pointer)).toEqual([
      '/allOf/0',
      '/allOf/1',
    ]);
  });

  it('splits draft-07 dependencies into dependentRequired and dependentSchemas', () => {
    const cardSchema = { properties: { billing: { type: 'string' } } };
    const { node } = normalize({ dependencies: { card: ['billing'], vat: cardSchema } });

    expect(node?.schema).toEqual({});
    expect(node?.conditionals).toEqual([
      {
        kind: 'dependentRequired',
        property: 'card',
        required: ['billing'],
        pointer: '/dependencies/card',
      },
      {
        kind: 'dependentSchemas',
        property: 'vat',
        schema: cardSchema,
        pointer: '/dependencies/vat',
      },
    ]);
  });

  it('collects the 2019-09 dependentRequired and dependentSchemas', () => {
    const { node } = normalize({
      dependentRequired: { card: ['billing'] },
      dependentSchemas: { card: { required: ['cvc'] } },
    });

    expect(node?.conditionals.map((conditional) => conditional.kind)).toEqual([
      'dependentRequired',
      'dependentSchemas',
    ]);
  });
});

describe('normalizeNode: older drafts', () => {
  it('turns a draft-07 tuple into prefixItems, and additionalItems into items', () => {
    const { node } = normalize({
      type: 'array',
      items: [{ type: 'number' }, { type: 'number' }],
      additionalItems: false,
    });

    expect(node?.schema).toEqual({
      type: 'array',
      prefixItems: [{ type: 'number' }, { type: 'number' }],
      items: false,
    });
  });

  it('turns draft-04 boolean exclusive bounds into numbers', () => {
    const { node } = normalize({
      type: 'number',
      minimum: 0,
      exclusiveMinimum: true,
      maximum: 10,
      exclusiveMaximum: false,
    });

    expect(node?.schema).toEqual({ type: 'number', exclusiveMinimum: 0, maximum: 10 });
  });

  it('turns the OpenAPI 3.0 example into examples', () => {
    expect(normalize({ type: 'string', example: 'jane' }).node?.schema).toEqual({
      type: 'string',
      examples: ['jane'],
    });
  });
});

describe('normalizeNode: nullable', () => {
  it.each([
    ['a type list with null', { type: ['string', 'null'] }],
    ['the OpenAPI 3.0 nullable keyword', { type: 'string', nullable: true }],
    ['a oneOf pair with a null branch', { oneOf: [{ type: 'string' }, { type: 'null' }] }],
    ['an anyOf pair with a null branch', { anyOf: [{ type: 'null' }, { type: 'string' }] }],
  ])('unwraps %s', (_, schema) => {
    const { node, problems } = normalize(schema);

    expect(node?.type).toBe('string');
    expect(node?.nullable).toBe(true);
    expect(node?.schema).toEqual({ type: 'string' });
    expect(problems).toEqual([]);
  });

  it('keeps the definition name of a nullable reference', () => {
    const { node } = normalize({
      $defs: { Address: { type: 'object' } },
      oneOf: [{ $ref: '#/$defs/Address' }, { type: 'null' }],
    });

    expect(node?.defName).toBe('Address');
    expect(node?.nullable).toBe(true);
    expect(node?.type).toBe('object');
  });

  it('removes null from an enum and marks the node nullable', () => {
    const { node } = normalize({ type: ['string', 'null'], enum: ['a', 'b', null] });

    expect(node?.schema['enum']).toEqual(['a', 'b']);
    expect(node?.nullable).toBe(true);
  });

  it('keeps a real union with a null branch as it is', () => {
    const { node } = normalize({
      oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'null' }],
    });

    expect(node?.schema['oneOf']).toHaveLength(3);
    expect(node?.nullable).toBe(false);
  });

  it('reports several non-null types and uses the first one', () => {
    const { node, problems } = normalize({ type: ['string', 'number', 'null'] });

    expect(node?.type).toBe('string');
    expect(node?.nullable).toBe(true);
    expect(codesOf(problems)).toEqual(['multi-type']);
  });

  it('is not nullable when an allOf part forbids null', () => {
    const { node } = normalize({ type: ['string', 'null'], allOf: [{ type: 'string' }] });

    expect(node?.nullable).toBe(false);
  });
});

describe('normalizeNode: pointers', () => {
  it('records where each subschema is, also through a $ref and an allOf part', () => {
    const root: JsonSchema = {
      $defs: { Base: { properties: { id: { type: 'string' } } } },
      allOf: [{ $ref: '#/$defs/Base' }, { properties: { email: { type: 'string' } } }],
    };
    const { node, environment } = normalize(root);
    const properties = node?.schema['properties'] as Record<string, object>;

    expect(environment.pointers.get(properties['id'])).toBe('/$defs/Base/properties/id');
    expect(environment.pointers.get(properties['email'])).toBe('/allOf/1/properties/email');
  });
});
