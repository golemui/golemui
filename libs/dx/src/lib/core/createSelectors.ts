// ===================================================
// createSelectors - the generated selector chain of a widget set
//
// A widget set declares its selector methods as a flat map of GSL factories
// (one line per method) and gets back a chainable selector root:
// type-selector methods emit `GslLeafSelector`s, scope methods
// (`tag`, `state`, `tagsAnd`, `tagsOr`) extend the chain immutably.
// ===================================================

import { UmbrellaItemTypes, type GslLeafConfig, type GslLeafSelector } from './dx.domain';
import { createGslSelector } from './dxUtilityTypes';

/**
 * A selector factory as it appears in the map passed to
 * {@link createSelectors}: any function returning a `GslLeafSelector`.
 * Covers both call shapes, `(config, matcher?)` and `(uid, config)`.
 */
export type SelectorFactory = (...args: any[]) => GslLeafSelector;

export type SelectorFactoryMap = Record<string, SelectorFactory>;

const SCOPE_METHOD_NAMES = ['tag', 'state', 'tagsAnd', 'tagsOr'] as const;

type ScopeMethodName = (typeof SCOPE_METHOD_NAMES)[number];

/**
 * The umbrella selector methods every chain provides. A widget set's map can
 * override any of them with a factory of its own (the gui set does, to keep
 * its typed configs); the ones not overridden are generated with the open
 * `GslLeafConfig` config shape.
 */
export interface UmbrellaSelectorMethods {
  /** Matches every widget whose item type is registered with kind 'input'. */
  inputs(config: GslLeafConfig): GslLeafSelector;
  inputByUid(uid: string, config: GslLeafConfig): GslLeafSelector;
  /** Matches every widget whose item type is registered with kind 'action'. */
  actions(config: GslLeafConfig): GslLeafSelector;
  actionByUid(uid: string, config: GslLeafConfig): GslLeafSelector;
  /** Matches every widget whose item type is registered with kind 'display'. */
  displays(config: GslLeafConfig): GslLeafSelector;
  displayByUid(uid: string, config: GslLeafConfig): GslLeafSelector;
  /** Matches every widget whose item type is registered with kind 'layout'. */
  layouts(config: GslLeafConfig): GslLeafSelector;
  layoutByUid(uid: string, config: GslLeafConfig): GslLeafSelector;
}

/**
 * The chainable selector root of a widget set. One method per entry in the
 * widget set's factory map (argument types are taken from the factory
 * itself), plus the umbrella methods not covered by the map, plus the four
 * scope methods that extend the chain.
 */
export type SelectorChain<TMap extends SelectorFactoryMap> = {
  [K in keyof TMap]: (...args: Parameters<TMap[K]>) => GslLeafSelector;
} & Omit<UmbrellaSelectorMethods, keyof TMap> & {
    /** Narrows the chain to widgets carrying the given tag. */
    tag(name: string): SelectorChain<TMap>;
    /** Targets the emitted config at the given state name (state-suffixed overrides). */
    state(name: string): SelectorChain<TMap>;
    /** Narrows the chain to widgets carrying ALL of the given tags. */
    tagsAnd(names: string[]): SelectorChain<TMap>;
    /** Narrows the chain to widgets carrying AT LEAST ONE of the given tags. */
    tagsOr(names: string[]): SelectorChain<TMap>;
  };

type ScopeCondition =
  | { kind: 'tagsAnd'; tags: string[] }
  | { kind: 'tagsOr'; tags: string[] }
  | { kind: 'state'; name: string };

/**
 * Applies the chain's accumulated scope conditions to a leaf selector:
 * tag conditions narrow the leaf's matcher, and the first state condition
 * (if any) sets `targetState` so the config lands as state-suffixed
 * overrides.
 */
function applyScopeConditions(
  leaf: GslLeafSelector,
  conditions: readonly ScopeCondition[],
): GslLeafSelector {
  if (conditions.length === 0) {
    return leaf;
  }

  const stateCondition = conditions.find(
    (condition): condition is { kind: 'state'; name: string } => condition.kind === 'state',
  );
  const tagConditions = conditions.filter(
    (condition): condition is { kind: 'tagsAnd' | 'tagsOr'; tags: string[] } =>
      condition.kind !== 'state',
  );

  const baseMatcher = leaf.matcher;
  return {
    ...leaf,
    matcher: (decorator: any) => {
      if (!baseMatcher(decorator)) {
        return false;
      }
      for (const condition of tagConditions) {
        const widgetTags: string[] = decorator.tags ?? [];
        if (condition.kind === 'tagsAnd') {
          for (const tag of condition.tags) {
            if (!widgetTags.includes(tag)) {
              return false;
            }
          }
        } else {
          if (condition.tags.length === 0) {
            continue;
          }
          if (!condition.tags.some((tag) => widgetTags.includes(tag))) {
            return false;
          }
        }
      }
      return true;
    },
    ...(stateCondition ? { targetState: stateCondition.name } : {}),
  };
}

function byUidVariantOf(gsl: SelectorFactory): SelectorFactory {
  return (uid: string, config: GslLeafConfig) =>
    gsl(config, (decorator: any) => decorator.uid === uid);
}

function buildUmbrellaFactories(): SelectorFactoryMap {
  const inputs = createGslSelector(UmbrellaItemTypes.INPUTS);
  const actions = createGslSelector(UmbrellaItemTypes.ACTIONS);
  const displays = createGslSelector(UmbrellaItemTypes.DISPLAYS);
  const layouts = createGslSelector(UmbrellaItemTypes.LAYOUTS);
  return {
    inputs,
    inputByUid: byUidVariantOf(inputs),
    actions,
    actionByUid: byUidVariantOf(actions),
    displays,
    displayByUid: byUidVariantOf(displays),
    layouts,
    layoutByUid: byUidVariantOf(layouts),
  };
}

/**
 * One level of the chain: the four scope methods (each returning a new level
 * with one more condition) plus one method per selector factory (each calling
 * the factory and applying the accumulated conditions to its leaf).
 */
function buildChainLevel(
  selectorFactories: SelectorFactoryMap,
  conditions: readonly ScopeCondition[],
): Record<string, unknown> {
  const chainLevel: Record<string, unknown> = {
    tag: (name: string) =>
      buildChainLevel(selectorFactories, [...conditions, { kind: 'tagsAnd', tags: [name] }]),
    state: (name: string) =>
      buildChainLevel(selectorFactories, [...conditions, { kind: 'state', name }]),
    tagsAnd: (names: string[]) =>
      buildChainLevel(selectorFactories, [...conditions, { kind: 'tagsAnd', tags: names }]),
    tagsOr: (names: string[]) =>
      buildChainLevel(selectorFactories, [...conditions, { kind: 'tagsOr', tags: names }]),
  };

  for (const [methodName, factory] of Object.entries(selectorFactories)) {
    chainLevel[methodName] = (...args: unknown[]) =>
      applyScopeConditions(factory(...args), conditions);
  }

  return chainLevel;
}

/**
 * Builds the chainable selector root of a widget set from a flat map of GSL
 * selector factories. The method names are the map's keys and each method's
 * argument types are taken from its factory, so the map is the single place
 * a widget set declares its selector surface.
 *
 * The umbrella methods (`inputs`, `actions`, `displays`, `layouts` and their
 * `ByUid` variants) are generated automatically for every chain; a map entry
 * with the same name replaces the generated one.
 *
 * @example
 * const kendoSelectors = createSelectors({
 *   grids: gridSelectors.gsl,
 *   gridByUid: gridSelectors.gslByUid,
 *   // one line per selector method, fully inferred
 * });
 * kendoSelectors.tag('billing').grids({ suppressAutomaticLabels: true });
 */
export function createSelectors<TMap extends SelectorFactoryMap>(
  selectorFactories: TMap & Partial<Record<ScopeMethodName, never>>,
): SelectorChain<TMap> {
  const collisions = SCOPE_METHOD_NAMES.filter((name) => name in selectorFactories);
  if (collisions.length > 0) {
    throw new Error(
      `Selector factory map must not use the reserved scope method name(s): ` +
        `${collisions.join(', ')}.`,
    );
  }

  const factories: SelectorFactoryMap = { ...buildUmbrellaFactories(), ...selectorFactories };

  // AUDIT BOUNDARY: The chain levels are built as plain records in a loop;
  // this single assertion presents them as the mapped SelectorChain type.
  // The parity/snapshot specs pin that the runtime methods and the mapped
  // type stay in sync. Do NOT replicate this pattern elsewhere.
  return buildChainLevel(factories, []) as SelectorChain<TMap>;
}
