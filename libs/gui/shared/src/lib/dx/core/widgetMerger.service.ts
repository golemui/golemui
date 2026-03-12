import { FunctionWidgetParams } from '@golemui/core';
import {
  GslItemType,
  MergeResult,
  ResolvedSelectors,
  RuntimeFunction,
} from './dx.domain';
import objectUtils, { ObjectUtils } from '../../utils/objectUtils.service';
import { getItemTypeHandler, hasItemTypeHandler } from './itemTypeRegistry';

export class WidgetMerger {
  constructor(
    private readonly objectUtils: ObjectUtils,
  ) {}

  merge(
    baseDef: Record<string, any> | RuntimeFunction,
    itemType: GslItemType,
    resolved: ResolvedSelectors,
  ): MergeResult {

    let accumulated: Record<string, any> = {};
    let promotedToRuntime: RuntimeFunction | null = null;

    // ── If the base itself is a runtime function, start in runtime mode ──
    if (typeof baseDef === 'function') {
      promotedToRuntime = baseDef as RuntimeFunction;
    }

    // ── Collect all decorators in priority order ──
    const allDecorators = this.collectDecorators(resolved);

    // ── Apply decorators from lowest to highest priority ──
    for (const decorator of allDecorators) {
      if (promotedToRuntime != null) {
        promotedToRuntime = this.composeRuntimeFunctions(
          promotedToRuntime,
          decorator,
        );
        continue;
      }

      if (typeof decorator === 'function') {
        const result = decorator({ ...accumulated, ...(typeof baseDef === 'function' ? {} : baseDef) });

        if (typeof result === 'function') {
          promotedToRuntime = this.createPromotedFunction(
            accumulated,
            baseDef as Record<string, any>,
            result as RuntimeFunction,
            itemType,
            resolved,
          );
          continue;
        }

        accumulated = this.objectUtils.deepMerge(accumulated, result);
      } else {
        accumulated = this.objectUtils.deepMerge(accumulated, decorator);
      }
    }

    // ── If promoted to runtime, return dynamic ──
    if (promotedToRuntime != null) {
      return { kind: 'dynamic', fn: this.wrapWithSensibleDefaults(promotedToRuntime, accumulated, itemType, resolved) };
    }

    // ── GSL decorators override inline _gui def for matching properties ──
    const merged = this.objectUtils.deepMerge(baseDef as Record<string, any>, accumulated);

    // ── Apply sensible defaults ──
    // Sensible defaults produce values based on the MERGED state of the def
    // (so they can read `path` from baseDef). They only fill in properties
    // that are still missing after all decorators and the inline def.
    const final = this.applySensibleDefaults({ ...merged }, itemType, resolved);

    return { kind: 'static', def: final };
  }

  // ── Collect all decorators in priority order ──

  private collectDecorators(
    resolved: ResolvedSelectors,
  ): (Record<string, any> | ((...args: any[]) => any))[] {

    const decorators: (Record<string, any> | ((...args: any[]) => any))[] = [];

    for (const leaf of resolved.leafSelectors) {
      const config = leaf.config as { decorator?: any };
      if (config.decorator != null) {
        decorators.push(config.decorator);
      }
    }

    return decorators;
  }

  // ── Apply sensible defaults via registry ──

  private applySensibleDefaults(
    def: Record<string, any>,
    itemType: GslItemType,
    resolved: ResolvedSelectors,
  ): Record<string, any> {
    if (!hasItemTypeHandler(itemType)) return def;
    const config = resolved.sensibleDefaults[itemType] ?? {};
    return getItemTypeHandler(itemType).applySensibleDefaults(def, config);
  }

  // ── Create promoted FunctionWidget ──

  private createPromotedFunction(
    accumulatedSoFar: Record<string, any>,
    baseDef: Record<string, any>,
    runtimeFn: RuntimeFunction,
    itemType: GslItemType,
    resolved: ResolvedSelectors,
  ): RuntimeFunction {
    return (params: FunctionWidgetParams<any>) => {
      const runtimeResult = runtimeFn(params);
      let merged = this.objectUtils.deepMerge(accumulatedSoFar, runtimeResult);

      // Inline wins last
      merged = this.objectUtils.deepMerge(merged, baseDef);

      return this.applySensibleDefaults(merged, itemType, resolved);
    };
  }

  // ── Wrap runtime function with accumulated static decorators and sensible defaults ──

  private wrapWithSensibleDefaults(
    runtimeFn: RuntimeFunction,
    accumulated: Record<string, any>,
    itemType: GslItemType,
    resolved: ResolvedSelectors,
  ): RuntimeFunction {
    return (params: FunctionWidgetParams<any>) => {
      let result = runtimeFn(params);

      if (Object.keys(accumulated).length > 0) {
        result = this.objectUtils.deepMerge(accumulated, result);
      }

      return this.applySensibleDefaults(result, itemType, resolved);
    };
  }

  // ── Compose two runtime functions ──

  private composeRuntimeFunctions(
    existing: RuntimeFunction,
    newDecorator: Partial<any> | ((...args: any[]) => any),
  ): RuntimeFunction {
    if (typeof newDecorator === 'function') {
      return (params: FunctionWidgetParams<any>) => {
        const existingResult = existing(params);
        const newResult = newDecorator(existingResult);
        if (typeof newResult === 'function') {
          return (newResult as RuntimeFunction)(params);
        }
        return this.objectUtils.deepMerge(newResult, existingResult);
      };
    }
    // newDecorator is static — merge into the runtime fn's output
    return (params: FunctionWidgetParams<any>) => {
      const existingResult = existing(params);
      return this.objectUtils.deepMerge(existingResult, newDecorator);
    };
  }
}

const widgetMerger = new WidgetMerger(objectUtils);
export default widgetMerger;
