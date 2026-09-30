import { describe, expect, it } from 'vitest';
import { fromJsonSchema } from './convert';
import {
  type ConvertOptions,
  type Diagnostic,
  type FormWidgetJson,
  type JsonSchema,
  type Preset,
} from './types';

/**
 * A minimal widget set, so the specs show that the walker holds no widget knowledge: groups for
 * objects and tuples, lists for arrays, a choice for enums and one input per scalar type.
 */
const fakePreset = (overrides: Partial<Preset> = {}): Preset => {
  const preset: Preset = {
    name: 'fake',
    rules: [
      {
        name: 'enum',
        when: (node) => Array.isArray(node.schema['enum']),
        build: (node, context) => ({
          kind: 'input',
          type: 'choice',
          path: node.path,
          label: context.label(node),
          props: { options: context.enumOptions(node) },
        }),
      },
      {
        name: 'object',
        when: (node) => node.type === 'object',
        build: (node, context) =>
          preset.group(context.buildChildren(node), { title: context.label(node) }),
      },
      {
        name: 'tuple',
        when: (node) => node.type === 'array' && Array.isArray(node.schema['prefixItems']),
        build: (node, context) => preset.group(context.buildChildren(node), {}),
      },
      {
        name: 'array',
        when: (node) => node.type === 'array',
        build: (node, context) => {
          const item = context.item(node);
          return {
            kind: 'input',
            type: 'list',
            path: node.path,
            label: context.label(node),
            props: { template: item ? context.build(item) : undefined },
          };
        },
      },
      {
        name: 'scalar',
        when: (node) => node.type !== undefined && node.type !== 'null',
        build: (node, context) => ({
          kind: 'input',
          type: `${node.type}-input`,
          path: node.path,
          label: context.label(node),
          validator: context.validator(node),
        }),
      },
    ],
    widgets: {
      textarea: (node, context) => ({
        kind: 'input',
        type: 'textarea',
        path: node.path,
        label: context.label(node),
      }),
    },
    validator: (node) => (node.required ? { required: true } : undefined),
    group: (children, options) => ({
      kind: 'layout',
      type: 'group',
      uid: options.uid,
      children,
      props: { title: options.title },
    }),
    root: (children) => [...children, { kind: 'action', type: 'submit' }],
    schemaUrl: 'https://example.com/form.schema.json',
    ...overrides,
  };
  return preset;
};

const convert = (schema: JsonSchema | boolean, options: Partial<ConvertOptions> = {}) =>
  fromJsonSchema(schema, { preset: fakePreset(), ...options });

/** The widgets built from the schema, without the submit button the fake preset adds. */
const formOf = (schema: JsonSchema | boolean, options: Partial<ConvertOptions> = {}) =>
  convert(schema, options).formDefinition.form.slice(0, -1);

const objectOf = (properties: JsonSchema, extra: JsonSchema = {}): JsonSchema => ({
  type: 'object',
  properties,
  ...extra,
});

const input = (path: string, fields: Partial<FormWidgetJson> = {}): FormWidgetJson => ({
  kind: 'input',
  type: 'string-input',
  path,
  ...fields,
});

const codesOf = (diagnostics: Diagnostic[]) => diagnostics.map((diagnostic) => diagnostic.code);

describe('fromJsonSchema: output', () => {
  it('builds one widget per property and lets the preset finish the list', () => {
    const result = convert(
      objectOf(
        {
          email: { type: 'string', title: 'E-mail address' },
          firstName: { type: 'string' },
          age: { type: 'integer' },
        },
        { required: ['email'] },
      ),
    );

    expect(result).toEqual({
      formDefinition: {
        $schema: 'https://example.com/form.schema.json',
        form: [
          input('email', { label: 'E-mail address', validator: { required: true } }),
          input('firstName', { label: 'First Name' }),
          input('age', { type: 'integer-input', label: 'Age' }),
          { kind: 'action', type: 'submit' },
        ],
      },
      diagnostics: [],
    });
  });

  it('groups a nested object and writes full dot paths', () => {
    const form = formOf(
      objectOf({
        address: objectOf({ street: { type: 'string' } }, { title: 'Delivery address' }),
      }),
    );

    expect(form).toEqual([
      {
        kind: 'layout',
        type: 'group',
        props: { title: 'Delivery address' },
        children: [input('address.street', { label: 'Street' })],
      },
    ]);
  });

  it('uses the items token in the paths of array items', () => {
    const form = formOf(
      objectOf({ lines: { type: 'array', items: objectOf({ quantity: { type: 'integer' } }) } }),
    );

    expect(form[0].props?.['template']).toEqual({
      kind: 'layout',
      type: 'group',
      props: {},
      children: [input('lines.items.quantity', { type: 'integer-input', label: 'Quantity' })],
    });
  });

  it('gives tuple positions index paths, required up to minItems', () => {
    const form = formOf(
      objectOf({
        point: {
          type: 'array',
          prefixItems: [{ type: 'number' }, { type: 'number' }],
          minItems: 1,
        },
      }),
    );

    expect(form[0].children).toEqual([
      input('point.0', { type: 'number-input', validator: { required: true } }),
      input('point.1', { type: 'number-input' }),
    ]);
  });

  it('writes the known keys in a fixed order and removes undefined values', () => {
    const [widget] = formOf(objectOf({ name: { type: 'string' } }));

    expect(Object.keys(widget)).toEqual(['kind', 'type', 'path', 'label']);
  });

  it('passes the form definition to transform last', () => {
    const result = convert(objectOf({ name: { type: 'string' } }), {
      transform: (definition) => ({ ...definition, states: { ready: 'true' } }),
    });

    expect(result.formDefinition.states).toEqual({ ready: 'true' });
  });

  it('writes no $schema when the preset has no schema URL', () => {
    const result = convert(objectOf({}), { preset: fakePreset({ schemaUrl: undefined }) });

    expect(result.formDefinition).not.toHaveProperty('$schema');
  });

  it('builds enum options with labels', () => {
    const [widget] = formOf(
      objectOf({ size: { enum: ['sm', 'lg'], enumNames: ['Small', 'Large'] } }),
    );

    expect(widget.props?.['options']).toEqual([
      { label: 'Small', value: 'sm' },
      { label: 'Large', value: 'lg' },
    ]);
  });
});

describe('fromJsonSchema: layers', () => {
  const bio = { type: 'string', title: 'Bio' };
  const markRule = (type: string) => ({
    when: (node: { name?: string }) => node.name === 'bio',
    build: (node: { path: string }) => input(node.path, { type }),
  });

  it('lets a user rule win over the preset rules', () => {
    const [widget] = formOf(objectOf({ bio }), { rules: [markRule('user-rule')] });

    expect(widget.type).toBe('user-rule');
  });

  it('lets the vendor keyword win over the user rules', () => {
    const [widget] = formOf(objectOf({ bio: { ...bio, 'x-golemui': { widget: 'textarea' } } }), {
      rules: [markRule('user-rule')],
    });

    expect(widget.type).toBe('textarea');
  });

  it('lets a $defs override win over the vendor keyword', () => {
    const schema = objectOf(
      { bio: { $ref: '#/$defs/LongText' } },
      { $defs: { LongText: { type: 'string', 'x-golemui': { widget: 'textarea' } } } },
    );

    const [widget] = formOf(schema, { overrides: { '$defs/LongText': { widget: 'markdown' } } });

    expect(widget.type).toBe('markdown');
  });

  it('lets a path override win over a $defs override', () => {
    const schema = objectOf(
      { bio: { $ref: '#/$defs/LongText' } },
      { $defs: { LongText: { type: 'string' } } },
    );

    const [widget] = formOf(schema, {
      overrides: { '$defs/LongText': { widget: 'markdown' }, bio: { widget: 'textarea' } },
    });

    expect(widget.type).toBe('textarea');
  });

  it('merges the patch fields from the least to the most specific layer', () => {
    const schema = objectOf(
      {
        bio: {
          $ref: '#/$defs/LongText',
          'x-golemui': { label: 'From the keyword', props: { keyword: 1 } },
        },
      },
      { $defs: { LongText: { type: 'string' } } },
    );

    const [widget] = formOf(schema, {
      rules: [{ match: { $name: 'bio' }, label: 'From the rule', props: { rule: 1 } }],
      overrides: {
        '$defs/LongText': { label: 'From the definition', props: { definition: 1 } },
        bio: { props: { path: 1 } },
      },
    });

    expect(widget.label).toBe('From the definition');
    expect(widget.props).toEqual({ rule: 1, keyword: 1, definition: 1, path: 1 });
  });

  it.each([
    ['a path override', { overrides: { bio: { skip: true } } }, bio],
    ['the vendor keyword', {}, { ...bio, 'x-golemui': { skip: true } }],
    ['a declarative rule', { rules: [{ match: { $name: 'bio' }, skip: true }] }, bio],
  ])('leaves out a node that %s skips', (_, options, bioSchema) => {
    const form = formOf(objectOf({ bio: bioSchema, name: { type: 'string' } }), options);

    expect(form.map((widget) => widget.path)).toEqual(['name']);
  });

  it('reads a custom vendor keyword, or none', () => {
    const schema = objectOf({
      bio: { ...bio, 'x-form': { widget: 'textarea' }, 'x-golemui': { widget: 'markdown' } },
    });

    expect(formOf(schema, { vendorKeyword: 'x-form' })[0].type).toBe('textarea');
    expect(formOf(schema, { vendorKeyword: false })[0].type).toBe('string-input');
  });

  it('reports a vendor keyword value that is not an object', () => {
    const result = convert(objectOf({ bio: { ...bio, 'x-golemui': 'textarea' } }));

    expect(result.diagnostics).toEqual([
      expect.objectContaining({ code: 'invalid-hint', path: 'bio', pointer: '/properties/bio' }),
    ]);
  });

  it('orders properties by the order of a layer, with * for the rest', () => {
    const schema = objectOf({
      a: { type: 'string' },
      b: { type: 'string' },
      c: { type: 'string' },
      d: { type: 'string' },
    });
    const pathsOf = (options: Partial<ConvertOptions>) =>
      formOf(schema, options).map((widget) => widget.path);

    expect(pathsOf({ overrides: { '': { order: ['c', '*', 'a'] } } })).toEqual([
      'c',
      'b',
      'd',
      'a',
    ]);
    expect(pathsOf({ overrides: { '': { order: ['d'] } } })).toEqual(['d', 'a', 'b', 'c']);
    expect(pathsOf({ rules: [{ match: { $path: '' }, order: ['b', '*'] }] })).toEqual([
      'b',
      'a',
      'c',
      'd',
    ]);
  });
});

describe('fromJsonSchema: rules', () => {
  const schema = objectOf({
    email: { type: 'string', format: 'email' },
    bio: { type: 'string' },
  });

  it('lets a declarative rule without widget patch what the next rule builds', () => {
    const [email] = formOf(schema, {
      rules: [{ match: { format: 'email' }, props: { icon: 'mail' } }],
    });

    expect(email).toEqual(input('email', { label: 'Email', props: { icon: 'mail' } }));
  });

  it('lets a declarative rule with widget build that widget', () => {
    const [, bio] = formOf(schema, {
      rules: [{ match: { $name: 'bio' }, widget: 'textarea', label: 'About you' }],
    });

    expect(bio).toEqual(input('bio', { type: 'textarea', label: 'About you' }));
  });

  it('lets a predicate rule change one detail of the default with next()', () => {
    const [email] = formOf(schema, {
      rules: [
        {
          when: (node) => node.name === 'email',
          build: (_node, context) => ({ ...(context.next() as FormWidgetJson), size: 6 }),
        },
      ],
    });

    expect(email).toEqual(input('email', { label: 'Email', size: 6 }));
  });

  it('moves to the next rule when a rule returns undefined, and renders nothing for null', () => {
    const form = formOf(schema, {
      rules: [
        { when: (node) => node.name === 'email', build: () => undefined },
        { when: (node) => node.name === 'bio', build: () => null },
      ],
    });

    expect(form).toEqual([input('email', { label: 'Email' })]);
  });

  it('reports a rule that throws and builds the node with the next rule', () => {
    const result = convert(schema, {
      rules: [
        {
          name: 'broken',
          when: (node) => node.name === 'bio',
          build: () => {
            throw new Error('boom');
          },
        },
        { match: { $name: { $regex: '(' } }, widget: 'textarea' },
      ],
    });

    expect(result.formDefinition.form[1]).toEqual(input('bio', { label: 'Bio' }));
    expect(result.diagnostics).toEqual([
      expect.objectContaining({ severity: 'warning', code: 'rule-error', path: 'email' }),
      expect.objectContaining({
        severity: 'warning',
        code: 'rule-error',
        path: 'bio',
        message: expect.stringContaining('broken threw (boom)'),
      }),
      expect.objectContaining({ severity: 'warning', code: 'rule-error', path: 'bio' }),
    ]);
  });

  it('builds a plain input for a widget the preset does not know', () => {
    const result = convert(objectOf({ color: { type: 'string' } }, { required: ['color'] }), {
      overrides: { color: { widget: 'colorPicker' } },
    });

    expect(result.formDefinition.form[0]).toEqual(
      input('color', { type: 'colorPicker', label: 'Color', validator: { required: true } }),
    );
    expect(result.diagnostics).toEqual([
      expect.objectContaining({ severity: 'info', code: 'custom-widget', path: 'color' }),
    ]);
  });

  it('reports a node that no rule builds and leaves it out', () => {
    const result = convert(objectOf({ nothing: { type: 'null' }, name: { type: 'string' } }));

    expect(result.formDefinition.form.map((widget) => widget.path)).toEqual(['name', undefined]);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({ severity: 'error', code: 'unsupported-shape', path: 'nothing' }),
    ]);
  });

  it('lets a user rule build the root, never a preset rule', () => {
    const form = formOf(schema, {
      rules: [
        {
          when: (node) => node.path === '',
          build: (node, context) => ({
            kind: 'layout',
            type: 'tabs',
            children: context.buildChildren(node),
          }),
        },
      ],
    });

    expect(form).toEqual([
      {
        kind: 'layout',
        type: 'tabs',
        children: [input('email', { label: 'Email' }), input('bio', { label: 'Bio' })],
      },
    ]);
  });

  it('lets a builder report a diagnostic on the current node', () => {
    const result = convert(schema, {
      rules: [
        {
          when: (node) => node.name === 'bio',
          build: (_node, context) => {
            context.diagnostic({ severity: 'info', code: 'note', message: 'Checked.' });
            return context.next();
          },
        },
      ],
    });

    expect(result.diagnostics).toEqual([
      {
        severity: 'info',
        code: 'note',
        message: 'Checked.',
        path: 'bio',
        pointer: '/properties/bio',
      },
    ]);
  });
});

describe('fromJsonSchema: diagnostics', () => {
  it.each([
    ['an array root', { type: 'array', items: { type: 'string' } }],
    ['an untyped root', {}],
    ['a false root', false],
  ])('reports %s and builds an empty form', (_, schema) => {
    const result = convert(schema as JsonSchema | boolean);

    expect(result.formDefinition.form).toEqual([{ kind: 'action', type: 'submit' }]);
    expect(codesOf(result.diagnostics)).toEqual(['root-not-object']);
  });

  it('never throws for a value that is not a schema', () => {
    const result = convert(42 as unknown as JsonSchema);

    expect(result.formDefinition.form).toEqual([{ kind: 'action', type: 'submit' }]);
    expect(codesOf(result.diagnostics)).toEqual(['invalid-schema']);
  });

  it('gives normalization problems the form path and the input pointer', () => {
    const result = convert(objectOf({ owner: { $ref: '#/$defs/Missing' } }));

    expect(result.formDefinition.form).toHaveLength(1);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        severity: 'error',
        code: 'unresolved-ref',
        path: 'owner',
        pointer: '/properties/owner',
      }),
    ]);
  });

  it('points at the definition for a node reached through a $ref', () => {
    const result = convert(
      objectOf(
        { shipping: { $ref: '#/$defs/Address' } },
        { $defs: { Address: objectOf({ code: { type: 'string', not: { const: '' } } }) } },
      ),
    );

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: 'unsupported-keyword',
        path: 'shipping.code',
        pointer: '/$defs/Address/properties/code',
      }),
    ]);
  });

  it('resolves refs against refRoot, e.g. an OpenAPI document', () => {
    const openApi = { components: { schemas: { Tag: { type: 'string' } } } };

    const form = formOf(objectOf({ tag: { $ref: '#/components/schemas/Tag' } }), {
      refRoot: openApi,
    });

    expect(form).toEqual([input('tag', { label: 'Tag' })]);
  });

  it('stops a recursive schema at maxRefDepth and reports where', () => {
    const result = convert({
      $ref: '#/$defs/Category',
      $defs: {
        Category: objectOf({ name: { type: 'string' }, parent: { $ref: '#/$defs/Category' } }),
      },
    });

    const [name, parent] = result.formDefinition.form;
    expect(name.path).toBe('name');
    expect(parent.children?.map((child) => child.path)).toEqual(['parent.name']);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        severity: 'warning',
        code: 'recursive-ref',
        path: 'parent.parent',
      }),
    ]);
  });

  it.each([
    ['not', { type: 'string', not: { const: 'x' } }],
    ['contains', { type: 'array', items: { type: 'string' }, contains: { const: 'x' } }],
    ['patternProperties', objectOf({}, { patternProperties: { '^x-': { type: 'string' } } })],
    ['additionalProperties', objectOf({}, { additionalProperties: { type: 'string' } })],
    [
      'oneOf',
      { oneOf: [objectOf({ a: { type: 'string' } }), objectOf({ b: { type: 'string' } })] },
    ],
    [
      'if',
      objectOf({ a: { type: 'string' } }, { if: { required: ['a'] }, then: { required: [] } }),
    ],
    ['dependentRequired', objectOf({ a: { type: 'string' } }, { dependentRequired: { a: ['b'] } })],
  ])('reports %s as not supported', (keyword, field) => {
    const result = convert(objectOf({ field }));

    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        severity: 'warning',
        code: 'unsupported-keyword',
        path: 'field',
        message: expect.stringContaining(`\`${keyword}\``),
      }),
    );
  });

  it('leaves out a property whose name has a dot, and warns about a numeric one', () => {
    const result = convert(objectOf({ 'a.b': { type: 'string' }, '0': { type: 'string' } }));

    expect(result.formDefinition.form.map((widget) => widget.path)).toEqual(['0', undefined]);
    expect(codesOf(result.diagnostics).sort()).toEqual([
      'invalid-property-name',
      'numeric-property-name',
    ]);
  });

  it('removes the later of two widgets on one path and reports it', () => {
    const result = convert(objectOf({ first: { type: 'string' }, second: { type: 'string' } }), {
      rules: [{ when: (node) => node.path !== '', build: () => input('shared') }],
    });

    expect(result.formDefinition.form.map((widget) => widget.path)).toEqual(['shared', undefined]);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        severity: 'error',
        code: 'duplicate-path',
        path: 'second',
        pointer: '/properties/second',
      }),
    ]);
  });

  it('stops after maxNodes and reports it once', () => {
    const result = convert(
      objectOf({ a: { type: 'string' }, b: { type: 'string' }, c: { type: 'string' } }),
      { maxNodes: 2 },
    );

    expect(result.formDefinition.form.map((widget) => widget.path)).toEqual(['a', 'b', undefined]);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({ severity: 'error', code: 'max-nodes', path: 'c' }),
    ]);
  });
});
