import { type FormEvent, type FunctionWidgetParams } from '@golemui/core';
import { type MergeResult, type RuntimeFunction } from './dx.domain';
import { type ActionDecorator } from '../shortcuts/actions/actions.domain';
import { type EventIdGenerator } from './itemTypeRegistry';

export type EventRegistry = Map<string, (event: FormEvent) => void>;

/**
 * Mapping from DX event property names to core `on` keys.
 * onClick is handled separately in the action-specific path.
 */
const INPUT_LAYOUT_EVENT_PROPS: Record<string, string> = {
  onLoad: 'load',
  onChange: 'change',
  onFilter: 'filter',
  onBlur: 'blur',
};

const INPUT_LAYOUT_EVENT_KEYS = Object.keys(INPUT_LAYOUT_EVENT_PROPS);

/**
 * Generalisation of ActionOnClickService.
 *
 * Two entry points:
 * - `extractOnClickFromMergeResult` — action-specific: handles onClick wiring.
 *   Called from the actions afterMerge hook.
 * - `wireInputLayoutEvents` — universal: handles onLoad, onChange, onFilter on any widget.
 *   Called from ItemWalker.processItem for every item.
 */
export class EventWiringService {
  // ── Action-specific: onClick ───────────────────────────────────

  extractOnClickFromMergeResult(
    mergeResult: MergeResult,
    eventRegistry: EventRegistry,
    eventIdGenerator: EventIdGenerator,
  ): MergeResult {
    if (mergeResult.kind === 'dynamic') {
      const originalFn = mergeResult.fn;
      const wrappedFn: RuntimeFunction = (params: FunctionWidgetParams<any>) => {
        const result = originalFn(params) as ActionDecorator & Record<string, any>;
        return this.wireOnClick(result, eventRegistry, eventIdGenerator);
      };
      return { kind: 'dynamic', fn: wrappedFn };
    }

    const actionDef = mergeResult.def as ActionDecorator & Record<string, any>;
    const wired = this.wireOnClick(actionDef, eventRegistry, eventIdGenerator);
    return { kind: 'static', def: wired as ActionDecorator };
  }

  private wireOnClick(
    actionDef: ActionDecorator & Record<string, any>,
    eventRegistry: EventRegistry,
    eventIdGenerator: EventIdGenerator,
  ): Record<string, any> {
    const actionId = eventIdGenerator.next();
    const rawOnClick = actionDef.onClick;

    if (typeof rawOnClick === 'function') {
      eventRegistry.set(actionId, (event: FormEvent) => rawOnClick(event.data));
      const { onClick: _, ...rest } = actionDef;
      return { ...rest, uid: actionId, on: { click: actionId } };
    }

    if (typeof rawOnClick === 'string') {
      const { onClick: _, ...rest } = actionDef;
      return { ...rest, uid: actionId, on: { click: rawOnClick } };
    }

    return { ...actionDef, uid: actionId };
  }

  // ── Universal: onLoad, onChange, onFilter ──────────────────────

  wireInputLayoutEvents(
    mergeResult: MergeResult,
    eventRegistry: EventRegistry,
    eventIdGenerator: EventIdGenerator,
  ): MergeResult {
    if (mergeResult.kind === 'dynamic') {
      const originalFn = mergeResult.fn;
      const wrappedFn: RuntimeFunction = (params: FunctionWidgetParams<any>) => {
        const result = originalFn(params);
        return this.wireEventProperties(result, eventRegistry, eventIdGenerator);
      };
      return { kind: 'dynamic', fn: wrappedFn };
    }

    const wired = this.wireEventProperties(mergeResult.def, eventRegistry, eventIdGenerator);
    return { kind: 'static', def: wired };
  }

  private wireEventProperties(
    def: Record<string, any>,
    eventRegistry: EventRegistry,
    eventIdGenerator: EventIdGenerator,
  ): Record<string, any> {
    const on: Record<string, string> = { ...(def['on'] || {}) };
    let hasNewEvents = false;
    const result: Record<string, any> = { ...def };

    for (const prop of INPUT_LAYOUT_EVENT_KEYS) {
      const value = def[prop];
      if (value == null) continue;

      const coreKey = INPUT_LAYOUT_EVENT_PROPS[prop];

      if (typeof value === 'function') {
        const eventName = eventIdGenerator.next();
        eventRegistry.set(eventName, value);
        on[coreKey] = eventName;
        hasNewEvents = true;
      } else if (typeof value === 'string') {
        on[coreKey] = value;
        hasNewEvents = true;
      }

      delete result[prop];
    }

    if (hasNewEvents) {
      result['on'] = on;
    }

    return result;
  }
}

const eventWiringService = new EventWiringService();
export default eventWiringService;
