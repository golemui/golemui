import type { NonFunctionWidget, FormWidget } from '@golemui/core';
import type { GslLeafSelector, MergeResult } from './dx.domain';
import { createGslSelector } from './dxUtilityTypes';
import type { GslConfigBase } from './dxUtilityTypes';
import type {
  ItemTypeHandler,
  ParsedEntry,
  AfterMergeContext,
  BuildWidgetContext,
} from './itemTypeRegistry';
import { registerItemType } from './itemTypeRegistry';
import type { DxCommonFields } from './dxBase.types';

type EntryShape = 'bare' | 'keyed' | 'compound';

interface SensibleDefaultsSpec<TDecorator, TConfig> {
  base: TConfig;
  fields: (keyof TConfig)[];
  apply: (def: TDecorator, config: TConfig) => TDecorator;
}

interface ShortcutTypeConfig<TEntry, TDecorator, TConfig> {
  itemType: string;
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
 * Convenience factory for registering a new widget type into the DX pipeline.
 *
 * Accepts a simple config object (entry shape, mapToWidget, optional hooks) and
 * assembles a full {@link ItemTypeHandler} from it — generating `parseEntry`,
 * `rollUpSensibleDefaults`, and `applySensibleDefaults` automatically.
 * The handler is registered in the global registry so the pipeline can look it up
 * by `itemType` at runtime.
 *
 * Returns GSL selector factories (`gsl`, `gslByUid`) for styling/configuring
 * widgets of this type.
 */
export function defineShortcutType<
  TEntry,
  TDecorator extends DxCommonFields,
  TConfig extends GslConfigBase<TDecorator> = GslConfigBase<TDecorator>,
>(
  config: ShortcutTypeConfig<TEntry, TDecorator, TConfig>,
): ShortcutTypeSelectors<TDecorator, TConfig> {
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
   * `defineShortcutType<TEntry, TDecorator>` call site.
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
  //
  // Examples of registrations that show different capabilities:
  //   - shortcuts/inputs/register.ts   — keyed entries + sensibleDefaults (simplest full example)
  //   - shortcuts/actions/register.ts  — bare entries + afterMerge hook (onClick wiring)
  //   - shortcuts/layouts/register.ts  — compound entries + buildCustomWidget + getChildren (recursive)
  const handler: ItemTypeHandler<TEntry, TDecorator, TConfig> = {
    rollUpSensibleDefaults,
    applySensibleDefaults,
    mapToWidget: config.mapToWidget as any,
    parseEntry,
    ...(config.afterMerge ? { afterMerge: config.afterMerge } : {}),
    ...(config.buildCustomWidget ? { buildCustomWidget: config.buildCustomWidget } : {}),
    ...(config.getChildren ? { getChildren: config.getChildren } : {}),
  };

  registerItemType(config.itemType, handler);

  const gsl = createGslSelector<TDecorator, TConfig>(config.itemType);
  const gslByUid = (uid: string, gslConfig: TConfig) =>
    gsl(gslConfig, ((d: any) => d.uid === uid) as any);

  return { gsl, gslByUid };
}
