import type { NonFunctionWidget, FormWidget } from '@golemui/core';
import type { GslLeafSelector, MergeResult } from './dx.domain';
import { createGslSelector } from './dxUtilityTypes';
import type { GslConfigBase } from './dxUtilityTypes';
import type {
  ItemTypeHandler,
  ItemTypeRegistry,
  ParsedEntry,
  AfterMergeContext,
  BuildWidgetContext,
} from './itemTypeRegistry';
import { type ShortcutItemKind } from './itemTypeRegistry';
import type { DxCommonFields } from './dxBase.types';

export type EntryShape = 'bare' | 'keyed' | 'compound';

export interface SensibleDefaultsSpec<TDecorator, TConfig> {
  base: TConfig;
  fields: (keyof TConfig)[];
  apply: (def: TDecorator, config: TConfig) => TDecorator;
}

export interface ShortcutTypeConfig<TEntry, TDecorator, TConfig> {
  itemType: string;
  kind: ShortcutItemKind;
  entryShape: EntryShape;
  mapToWidget: (def: TDecorator) => NonFunctionWidget;
  sensibleDefaults?: SensibleDefaultsSpec<TDecorator, TConfig>;
  afterMerge?: (mergeResult: MergeResult, context: AfterMergeContext) => MergeResult;
  buildCustomWidget?: (mergeResult: MergeResult, context: BuildWidgetContext) => FormWidget;
  getChildren?: (entry: TEntry) => any[] | undefined;
}

export interface ShortcutTypeSelectors<TDecorator, TConfig extends GslConfigBase<TDecorator>> {
  gsl: (config: TConfig, matcher?: (decorator: TDecorator) => boolean) => GslLeafSelector;
  gslByUid: (uid: string, config: TConfig) => GslLeafSelector;
}

/**
 * A fully assembled widget type: the handler for the DX pipeline, the GSL
 * selector factories, and the registration metadata. Pure data — building one
 * has no side effects, registration happens separately through
 * {@link registerShortcutType} (or in one step through {@link defineShortcutType}).
 */
export interface ShortcutTypeDefinition<
  TEntry,
  TDecorator extends DxCommonFields,
  TConfig extends GslConfigBase<TDecorator>,
> extends ShortcutTypeSelectors<TDecorator, TConfig> {
  itemType: string;
  kind: ShortcutItemKind;
  handler: ItemTypeHandler<TEntry, TDecorator, TConfig>;
}

/**
 * Assembles a full widget type definition from a simple config object
 * (entry shape, mapToWidget, optional hooks) — generating `parseEntry`,
 * `rollUpSensibleDefaults`, and `applySensibleDefaults` automatically —
 * plus the GSL selector factories (`gsl`, `gslByUid`) for styling/configuring
 * widgets of this type.
 *
 * This function is pure: it does NOT register anything. A widget set builds
 * its definitions with this and registers them all in one explicit place with
 * {@link registerShortcutType}, so registration is carried by the module that
 * owns the registry instead of import side effects (which bundlers may drop).
 */
export function createShortcutType<
  TEntry,
  TDecorator extends DxCommonFields,
  TConfig extends GslConfigBase<TDecorator> = GslConfigBase<TDecorator>,
>(
  config: ShortcutTypeConfig<TEntry, TDecorator, TConfig>,
): ShortcutTypeDefinition<TEntry, TDecorator, TConfig> {
  const rollUpSensibleDefaults = (leafSelectors: GslLeafSelector[]): TConfig => {
    if (!config.sensibleDefaults) {
      return {} as TConfig;
    }

    let result = { ...config.sensibleDefaults.base };

    for (const leaf of leafSelectors) {
      const gslConfig = leaf.config as Record<string, any>;

      for (const field of config.sensibleDefaults.fields) {
        const key = field as string;

        if (gslConfig[key] != null) {
          result = { ...result, [key]: gslConfig[key] };
        }
      }
    }

    return result;
  };

  const applySensibleDefaults = (def: TDecorator, sensibleConfig: TConfig): TDecorator => {
    if (!config.sensibleDefaults) {
      return def;
    }

    return config.sensibleDefaults.apply(def, sensibleConfig);
  };

  /**
   * Generated parseEntry for the '${config.entryShape}' entry shape.
   *
   * ⚠️ AUDIT BOUNDARY: Uses `as any` for entry shape coercion.
   * Type safety relies on the generic constraints at the
   * `createShortcutType<TEntry, TDecorator>` call site.
   * Do NOT replicate this pattern elsewhere.
   */
  const parseEntry = (entry: TEntry): ParsedEntry<TDecorator> => {
    switch (config.entryShape) {
      case 'bare':
        return { baseDef: entry as any };
      case 'keyed': {
        const keyed = entry as any;
        return { baseDef: keyed.def, path: keyed.key };
      }
      case 'compound': {
        const compound = entry as any;
        return { baseDef: compound.def, children: compound.children };
      }
    }
  };

  // Assemble the full ItemTypeHandler from the config above.
  // The generated functions (parseEntry, rollUpSensibleDefaults, applySensibleDefaults)
  // are combined with pass-through hooks from the caller (mapToWidget, afterMerge, etc.).
  //
  // See ItemTypeHandler in itemTypeRegistry.ts for the contract and pipeline stages.
  // The pipeline that consumes this handler lives in ItemWalker.processItem.
  const handler: ItemTypeHandler<TEntry, TDecorator, TConfig> = {
    rollUpSensibleDefaults,
    applySensibleDefaults,
    mapToWidget: config.mapToWidget as any,
    parseEntry,
    ...(config.afterMerge ? { afterMerge: config.afterMerge } : {}),
    ...(config.buildCustomWidget ? { buildCustomWidget: config.buildCustomWidget } : {}),
    ...(config.getChildren ? { getChildren: config.getChildren } : {}),
  };

  const gsl = createGslSelector<TDecorator, TConfig>(config.itemType);
  const gslByUid = (uid: string, gslConfig: TConfig) =>
    gsl(gslConfig, ((d: any) => d.uid === uid) as any);

  return { itemType: config.itemType, kind: config.kind, handler, gsl, gslByUid };
}

/**
 * Registers an assembled widget type definition in the given registry.
 */
export function registerShortcutType<
  TEntry,
  TDecorator extends DxCommonFields,
  TConfig extends GslConfigBase<TDecorator>,
>(
  registry: ItemTypeRegistry,
  definition: ShortcutTypeDefinition<TEntry, TDecorator, TConfig>,
): void {
  registry.registerItemType(definition.itemType, definition.handler, definition.kind);
}

/**
 * Convenience factory for registering a new widget type into a widget set's
 * DX pipeline: {@link createShortcutType} plus {@link registerShortcutType}
 * in one call.
 *
 * Returns GSL selector factories (`gsl`, `gslByUid`) for styling/configuring
 * widgets of this type.
 *
 * @example
 * const gridSelectors = defineShortcutType(kendoRegistry, {
 *   itemType: 'KENDO_GRID',
 *   kind: 'input',
 *   entryShape: 'keyed',
 *   mapToWidget: (def) => {
 *     return { kind: 'input', type: 'kendoGrid', path: def.path, props: buildGridProps(def) };
 *   },
 * });
 */
export function defineShortcutType<
  TEntry,
  TDecorator extends DxCommonFields,
  TConfig extends GslConfigBase<TDecorator> = GslConfigBase<TDecorator>,
>(
  registry: ItemTypeRegistry,
  config: ShortcutTypeConfig<TEntry, TDecorator, TConfig>,
): ShortcutTypeSelectors<TDecorator, TConfig> {
  const definition = createShortcutType(config);
  registerShortcutType(registry, definition);
  return { gsl: definition.gsl, gslByUid: definition.gslByUid };
}
