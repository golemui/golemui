import { FunctionWidgetParams } from '@golemui/core';
import {
  GslItemType,
  MergeResult,
  ResolvedSelectors,
  RuntimeFunction,
} from './dx.domain';
import { InputDecorator, InputSensibleDefaultsConfig, GslInputsConfig } from '../shortcuts/inputs/inputs.domain';
import { ActionDecorator, GslActionsConfig, GslActionByIdConfig } from '../shortcuts/actions/actions.domain';
import { LayoutDecorator, GslLayoutByIdConfig } from '../shortcuts/layouts/layouts.domain';
import objectUtils, { ObjectUtils } from '../../../utils/objectUtils.service';
import inputSensibleDefaultsService, {
  InputSensibleDefaultsService,
} from '../shortcuts/inputs/inputSensibleDefaults.service';

export class WidgetMerger {
  constructor(
    private readonly objectUtils: ObjectUtils,
    private readonly inputSensibleDefaults: InputSensibleDefaultsService,
  ) {}

  merge(
    baseDef: InputDecorator | ActionDecorator | LayoutDecorator | RuntimeFunction,
    itemType: GslItemType,
    resolved: ResolvedSelectors,
  ): MergeResult {

    let accumulated: Record<string, any> = {};
    let promotedToRuntime: RuntimeFunction | null = null;

    // ── If the base itself is a runtime function, start in runtime mode ──
    if (typeof baseDef === 'function') {
      promotedToRuntime = baseDef;
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
            baseDef as InputDecorator | ActionDecorator | LayoutDecorator,
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

    // ── Inline _gui def wins last ──
    const merged = this.objectUtils.deepMerge(accumulated, baseDef as Record<string, any>);

    // ── Apply sensible defaults ──
    // Sensible defaults produce values based on the MERGED state of the def
    // (so they can read `path` from baseDef). They only fill in properties
    // that are still missing after all decorators and the inline def.
    let final = { ...merged };

    if (itemType === 'INPUTS') {
      final = this.applyInputSensibleDefaults(
        final as InputDecorator,
        resolved.aggregatedInputSensibleDefaults,
      );
    }

    return { kind: 'static', def: final };
  }

  // ── Collect all decorators in priority order ──

  private collectDecorators(
    resolved: ResolvedSelectors,
  ): (Partial<InputDecorator | ActionDecorator | LayoutDecorator> | ((...args: any[]) => any))[] {

    const decorators: (Partial<InputDecorator | ActionDecorator | LayoutDecorator> | ((...args: any[]) => any))[] = [];

    // From widget selectors (root → tags, already ordered by resolver)
    for (const ws of resolved.widgetSelectors) {
      const config = ws.config as GslInputsConfig | GslActionsConfig;
      if (config.decorator != null) {
        decorators.push(config.decorator);
      }
    }

    // From ID selectors (higher priority than tag selectors)
    for (const ids of resolved.idSelectors) {
      const config = ids.config as GslLayoutByIdConfig | GslActionByIdConfig;
      if (config.decorator != null) {
        decorators.push(config.decorator);
      }
    }

    return decorators;
  }

  // ── Apply input sensible defaults ──

  private applyInputSensibleDefaults(
    item: InputDecorator,
    config: InputSensibleDefaultsConfig,
  ): InputDecorator {
    let result = this.inputSensibleDefaults.processAutomaticLabels(item, config);
    result = this.inputSensibleDefaults.processAutomaticPlaceholders(result, config);
    return result;
  }

  // ── Create promoted FunctionWidget ──

  private createPromotedFunction(
    accumulatedSoFar: Record<string, any>,
    baseDef: InputDecorator | ActionDecorator | LayoutDecorator,
    runtimeFn: RuntimeFunction,
    itemType: GslItemType,
    resolved: ResolvedSelectors,
  ): RuntimeFunction {
    return (params: FunctionWidgetParams<any>) => {
      const runtimeResult = runtimeFn(params);
      let merged = this.objectUtils.deepMerge(accumulatedSoFar, runtimeResult);

      // Inline wins last
      merged = this.objectUtils.deepMerge(merged, baseDef);

      if (itemType === 'INPUTS') {
        merged = this.applyInputSensibleDefaults(
          merged as InputDecorator,
          resolved.aggregatedInputSensibleDefaults,
        );
      }

      return merged;
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

      if (itemType === 'INPUTS') {
        result = this.applyInputSensibleDefaults(
          result as InputDecorator,
          resolved.aggregatedInputSensibleDefaults,
        );
      }

      return result;
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

const widgetMerger = new WidgetMerger(objectUtils, inputSensibleDefaultsService);
export default widgetMerger;
