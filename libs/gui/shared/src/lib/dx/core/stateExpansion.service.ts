import { FunctionWidgetParams, NonFunctionWidget } from '@golemui/core';
import { GslLeafSelector, MergeResult, RuntimeFunction } from './dx.domain';
import { EventIdGenerator, EventRegistry } from './itemTypeRegistry';

// ═══════════════════════════════════════════════════
// State Expansion Service
//
// Processes per-widget `states` blocks, `when` inline
// conditions, and `_gslStates` overrides into core's
// state-suffixed properties, include/exclude, and
// conditional { when } forms.
// ═══════════════════════════════════════════════════

/**
 * Core widget properties that accept state suffixing at the widget root level.
 * Everything else goes into `props`.
 *
 * Mirrors core's SomeSuffixable declarations in form-widget.ts.
 */
const CORE_SUFFIXABLE: Record<string, Set<string>> = {
  input: new Set(['disabled', 'readonly', 'label', 'validator', 'size']),
  action: new Set(['disabled', 'label', 'size']),
  layout: new Set(['size']),
  display: new Set([]),
};

/** DX event property names → core `on` keys. */
const EVENT_PROPS: Record<string, string> = {
  onChange: 'change',
  onLoad: 'load',
  onFilter: 'filter',
  onClick: 'click',
};

export type DxWhenTuple = [string, Record<string, any>];

export interface StateData {
  stateOverrides: Record<string, Record<string, any>>;
  whenConditions: DxWhenTuple[];
}

export class StateExpansionService {

  /**
   * Extracts `states` and `when` from a merge result, combining with
   * state-targeted GSL leaf selectors from `_gslStates`.
   *
   * Returns a cleaned merge result (no states/when) and accumulated state data.
   */
  extractFromMergeResult(
    mergeResult: MergeResult,
    stateLeafs: GslLeafSelector[],
  ): { cleanedResult: MergeResult; stateData: StateData } {

    // Accumulate state overrides from _gslStates selectors.
    // GSL config may use `{ override: { ... } }` (typed) or raw properties (untyped).
    const gslStateOverrides: Record<string, Record<string, any>> = {};
    for (const leaf of stateLeafs) {
      const stateName = leaf.targetState!;
      const config = leaf.config;
      const overrides = (config['override'] && typeof config['override'] !== 'function')
        ? config['override']
        : config;
      gslStateOverrides[stateName] = {
        ...(gslStateOverrides[stateName] || {}),
        ...overrides,
      };
    }

    if (mergeResult.kind === 'dynamic') {
      const originalFn = mergeResult.fn;
      const wrappedFn: RuntimeFunction = (params: FunctionWidgetParams<any>) => {
        const result = originalFn(params);
        const { states: _, when: __, ...clean } = result;
        return clean;
      };
      return {
        cleanedResult: { kind: 'dynamic', fn: wrappedFn },
        stateData: { stateOverrides: gslStateOverrides, whenConditions: [] },
      };
    }

    // Static path
    const { states: inlineStates, when: inlineWhen, ...cleanDef } = mergeResult.def;

    // GSL state overrides are base; inline states override (per-widget > GSL)
    const allOverrides: Record<string, Record<string, any>> = {};
    for (const [stateName, overrides] of Object.entries(gslStateOverrides)) {
      allOverrides[stateName] = { ...overrides };
    }
    if (inlineStates) {
      for (const [stateName, overrides] of Object.entries(inlineStates as Record<string, Record<string, any>>)) {
        allOverrides[stateName] = { ...(allOverrides[stateName] || {}), ...overrides };
      }
    }

    // Parse when conditions
    const whenConditions: DxWhenTuple[] = [];
    if (inlineWhen) {
      if (Array.isArray(inlineWhen[0])) {
        whenConditions.push(...(inlineWhen as DxWhenTuple[]));
      } else if (typeof inlineWhen[0] === 'string') {
        whenConditions.push(inlineWhen as DxWhenTuple);
      }
    }

    return {
      cleanedResult: { kind: 'static', def: cleanDef },
      stateData: { stateOverrides: allOverrides, whenConditions },
    };
  }

  /**
   * Applies state overrides and when conditions to a core widget.
   *
   * State overrides produce:
   * - `visible: true/false` → `include: { in }` / `exclude: { from }`
   * - Core suffixable props → `'prop.stateName': value` at widget root
   * - Event handlers → `on: { 'eventType.stateName': eventId }` with registry wiring
   * - Custom props → `props: { 'prop.stateName': value }`
   *
   * When conditions produce:
   * - `visible: true` → `include: { when: condition }`
   * - `visible: false` → `exclude: { when: condition }`
   * - `disabled: true` → `disabled: { when: condition }`
   * - `readonly: true` → `readonly: { when: condition }`
   */
  applyToWidget(
    widget: NonFunctionWidget,
    stateData: StateData,
    eventRegistry: EventRegistry,
    eventIdGenerator: EventIdGenerator,
  ): NonFunctionWidget {
    const { stateOverrides, whenConditions } = stateData;

    if (Object.keys(stateOverrides).length === 0 && whenConditions.length === 0) {
      return widget;
    }

    const result: Record<string, any> = { ...widget };
    const kind = (widget as any).kind as string;
    const suffixable = CORE_SUFFIXABLE[kind] || new Set();

    // Shallow-copy mutable sub-objects
    if ((widget as any).props) result['props'] = { ...(widget as any).props };
    if ((widget as any).on) result['on'] = { ...(widget as any).on };

    // ── Named state overrides ──
    for (const [coreStateName, overrides] of Object.entries(stateOverrides)) {
      for (const [prop, value] of Object.entries(overrides)) {
        if (prop === 'visible') {
          this.applyVisibility(result, coreStateName, value as boolean);
        } else if (EVENT_PROPS[prop]) {
          this.applyStateEvent(result, coreStateName, prop, value, eventRegistry, eventIdGenerator);
        } else if (suffixable.has(prop)) {
          result[`${prop}.${coreStateName}`] = value;
        } else {
          // Custom prop → state-suffixed in props
          if (!result['props']) result['props'] = {};
          result['props'][`${prop}.${coreStateName}`] = value;
        }
      }
    }

    // ── Inline when conditions ──
    for (const [condition, overrides] of whenConditions) {
      for (const [prop, value] of Object.entries(overrides)) {
        if (prop === 'visible') {
          if (value) {
            result['include'] = { ...(result['include'] || {}), when: condition };
          } else {
            result['exclude'] = { ...(result['exclude'] || {}), when: condition };
          }
        } else if (prop === 'disabled' && value) {
          result['disabled'] = { when: condition };
        } else if (prop === 'readonly' && value) {
          result['readonly'] = { when: condition };
        }
      }
    }

    return result as NonFunctionWidget;
  }

  hasStateData(stateData: StateData): boolean {
    return Object.keys(stateData.stateOverrides).length > 0 || stateData.whenConditions.length > 0;
  }

  // ── Visibility helpers ──

  private applyVisibility(
    widget: Record<string, any>,
    coreStateName: string,
    visible: boolean,
  ): void {
    if (visible) {
      const existing: string[] = widget['include']?.in || [];
      widget['include'] = { ...(widget['include'] || {}), in: [...existing, coreStateName] };
    } else {
      const existing: string[] = widget['exclude']?.from || [];
      widget['exclude'] = { ...(widget['exclude'] || {}), from: [...existing, coreStateName] };
    }
  }

  // ── State-suffixed event helpers ──

  private applyStateEvent(
    widget: Record<string, any>,
    coreStateName: string,
    dxProp: string,
    value: any,
    eventRegistry: EventRegistry,
    eventIdGenerator: EventIdGenerator,
  ): void {
    const coreKey = EVENT_PROPS[dxProp];
    if (!widget['on']) widget['on'] = {};

    if (typeof value === 'function') {
      const eventName = eventIdGenerator.next();
      eventRegistry.set(eventName, value);
      widget['on'][`${coreKey}.${coreStateName}`] = eventName;
    } else if (typeof value === 'string') {
      widget['on'][`${coreKey}.${coreStateName}`] = value;
    }
  }
}

const stateExpansionService = new StateExpansionService();
export default stateExpansionService;
