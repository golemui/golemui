import { type FormEvent, type FunctionWidgetParams } from '@golemui/core';
import { type MergeResult, type RuntimeFunction } from './dx.domain';
import { type EventIdGenerator } from './itemTypeRegistry';

/**
 * Structural view of an action decorator: the only field this service reads
 * is `onClick`. Widget sets keep their own richer action decorator types.
 */
type ActionDefLike = { onClick?: (...args: any[]) => any } & Record<string, any>;

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
 * Probe a DX event handler for a host-managed event name.
 *
 * Mirrors the action `onClick` pattern: a handler that simply returns a string
 * (`() => 'fieldChange'`) declares a host-managed dispatch by name. Only **zero-arg**
 * handlers are probed — a handler that declares the `event` parameter
 * (`(event) => event.update(...)`) is an imperative handler and is never invoked here,
 * so its method-bearing `DxFormEvent` is never touched with `undefined`.
 *
 * @returns the returned event name, or `null` when the handler is not a declarative
 *   zero-arg string-returning handler (i.e. it should be registered and run on dispatch).
 */
export function probeForHostEventName(handler: (...args: any[]) => any): string | null {
  if (handler.length > 0) {
    return null;
  }
  try {
    const result = handler();
    return typeof result === 'string' ? result : null;
  } catch {
    // A zero-arg handler that throws is treated as an imperative handler.
    return null;
  }
}

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
        const result = originalFn(params) as ActionDefLike;
        return this.wireOnClick(result, eventRegistry, eventIdGenerator);
      };
      return { kind: 'dynamic', fn: wrappedFn };
    }

    const actionDef = mergeResult.def as ActionDefLike;
    const wired = this.wireOnClick(actionDef, eventRegistry, eventIdGenerator);
    return { kind: 'static', def: wired };
  }

  private wireOnClick(
    actionDef: ActionDefLike,
    eventRegistry: EventRegistry,
    eventIdGenerator: EventIdGenerator,
  ): Record<string, any> {
    const actionId = eventIdGenerator.next();
    const rawOnClick = actionDef.onClick;

    if (typeof rawOnClick === 'function') {
      const { onClick: _, ...rest } = actionDef;
      const probeResult = rawOnClick(undefined);
      if (typeof probeResult === 'string') {
        return { ...rest, uid: actionId, on: { click: probeResult } };
      }
      eventRegistry.set(actionId, (event: FormEvent) => rawOnClick(event.data));
      return { ...rest, uid: actionId, on: { click: actionId } };
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
        const hostEventName = probeForHostEventName(value);
        if (hostEventName != null) {
          // Declarative form `() => 'evName'`: wire the host-managed event name directly.
          on[coreKey] = hostEventName;
        } else {
          const eventName = eventIdGenerator.next();
          eventRegistry.set(eventName, value);
          on[coreKey] = eventName;
        }
        hasNewEvents = true;
      } else if (typeof value === 'string') {
        // Strings are still honored at runtime for internal/core wiring (and untyped
        // `states` overrides), the public DX type rejects them, so authors use functions.
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
