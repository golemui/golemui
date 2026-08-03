import { describe, expect, it } from 'vitest';
import { createGslSelector, createSelectors } from '../../index';

// A tiny widget-set-shaped map: one gsl-style factory and one byUid-style
// factory, the two call shapes a selector method can have.
const grids = createGslSelector('DEMO_GRID');
const gridByUid = (uid: string, config: Record<string, unknown>) =>
  grids(config, (decorator: any) => decorator.uid === uid);

function buildChain() {
  return createSelectors({ grids, gridByUid });
}

describe('createSelectors', () => {
  it("exposes one method per map entry, emitting that factory's leaves", () => {
    const chain = buildChain();
    const config = { override: { label: 'probe' } };

    const leaf = chain.grids(config);
    expect(leaf.kind).toBe('leaf');
    expect(leaf.selectorType).toBe('DEMO_GRID');
    expect(leaf.config).toBe(config);

    const byUidLeaf = chain.gridByUid('grid-1', config);
    expect(byUidLeaf.selectorType).toBe('DEMO_GRID');
    expect(byUidLeaf.matcher({ uid: 'grid-1' })).toBe(true);
    expect(byUidLeaf.matcher({ uid: 'grid-2' })).toBe(false);
  });

  it('generates the umbrella methods not covered by the map', () => {
    const chain = buildChain();

    expect(chain.inputs({}).selectorType).toBe('INPUTS');
    expect(chain.actions({}).selectorType).toBe('ACTIONS');
    expect(chain.displays({}).selectorType).toBe('DISPLAYS');
    expect(chain.layouts({}).selectorType).toBe('LAYOUTS');

    // Umbrella matchers accept every decorator; the kind-based narrowing
    // happens later, in the SelectorResolver, against the registry.
    expect(chain.inputs({}).matcher({ uid: 'anything' })).toBe(true);

    const byUidLeaf = chain.inputByUid('field-1', {});
    expect(byUidLeaf.selectorType).toBe('INPUTS');
    expect(byUidLeaf.matcher({ uid: 'field-1' })).toBe(true);
    expect(byUidLeaf.matcher({ uid: 'field-2' })).toBe(false);
  });

  it('lets a map entry replace a generated umbrella method', () => {
    const customInputs = createGslSelector('MY_INPUTS');
    const chain = createSelectors({ inputs: customInputs });
    expect(chain.inputs({}).selectorType).toBe('MY_INPUTS');
  });

  it('rejects map entries named after the scope methods', () => {
    expect(() => createSelectors({ tag: grids } as any)).toThrowError(/reserved scope method name/);
  });

  it('tag, tagsAnd, and tagsOr narrow the emitted matcher', () => {
    const chain = buildChain();

    const tagged = chain.tag('billing').grids({});
    expect(tagged.matcher({ tags: ['billing'] })).toBe(true);
    expect(tagged.matcher({ tags: [] })).toBe(false);
    expect(tagged.matcher({})).toBe(false);

    const allOf = chain.tagsAnd(['billing', 'admin']).grids({});
    expect(allOf.matcher({ tags: ['billing', 'admin'] })).toBe(true);
    expect(allOf.matcher({ tags: ['billing'] })).toBe(false);

    const anyOf = chain.tagsOr(['billing', 'admin']).grids({});
    expect(anyOf.matcher({ tags: ['admin'] })).toBe(true);
    expect(anyOf.matcher({ tags: ['other'] })).toBe(false);

    // An empty tagsOr list is a no-op, not a match-nothing condition.
    expect(chain.tagsOr([]).grids({}).matcher({})).toBe(true);
  });

  it('scope conditions stack on top of a byUid matcher', () => {
    const leaf = buildChain().tag('billing').gridByUid('grid-1', {});
    expect(leaf.matcher({ uid: 'grid-1', tags: ['billing'] })).toBe(true);
    expect(leaf.matcher({ uid: 'grid-1', tags: [] })).toBe(false);
    expect(leaf.matcher({ uid: 'grid-2', tags: ['billing'] })).toBe(false);
  });

  it('state targets the leaf at a state name, and the first state in the chain wins', () => {
    const chain = buildChain();

    expect(chain.grids({}).targetState).toBeUndefined();
    expect(chain.state('draft').grids({}).targetState).toBe('draft');

    const doubleState = chain.state('draft').tag('billing').state('final').grids({});
    expect(doubleState.targetState).toBe('draft');
    expect(doubleState.matcher({ tags: ['billing'] })).toBe(true);
    expect(doubleState.matcher({ tags: [] })).toBe(false);
  });

  it('extends the chain immutably', () => {
    const root = buildChain();
    const scoped = root.tag('billing');
    expect(scoped).not.toBe(root);
    expect(root.grids({}).matcher({ tags: [] })).toBe(true);
    expect(scoped.grids({}).matcher({ tags: [] })).toBe(false);
  });
});
