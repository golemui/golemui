import { type FormEvent, type FunctionWidgetParams } from '@golemui/core';
import { type ActionDecorator } from '../shortcuts/actions/actions.domain';
import { type FormConfig, type MergeResult, type RuntimeFunction } from './dx.domain';
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

type ActionDecoratorWithPresetClick = ActionDecorator & { on?: { click: string } };

/**
 * Generalisation of ActionOnClickService.
 *
 * Two entry points:
 * - `extractOnClickFromMergeResult` — action-specific: handles onClick + submit promotion.
 *   Called from the actions afterMerge hook.
 * - `wireInputLayoutEvents` — universal: handles onLoad, onChange, onFilter on any widget.
 *   Called from ItemWalker.processItem for every item.
 */
export class EventWiringService {
  // ── Action-specific: onClick + submit ─────────────────────────

  extractOnClickFromMergeResult(
    mergeResult: MergeResult,
    eventRegistry: EventRegistry,
    formConfig: FormConfig,
    eventIdGenerator: EventIdGenerator,
  ): MergeResult {
    if (mergeResult.kind === 'dynamic') {
      const originalFn = mergeResult.fn;
      const wrappedFn: RuntimeFunction = (params: FunctionWidgetParams<any>) => {
        const result = originalFn(params) as ActionDecoratorWithPresetClick;
        return this.wireOnClick(result, eventRegistry, formConfig, eventIdGenerator);
      };
      return { kind: 'dynamic', fn: wrappedFn };
    }

    const actionDef = mergeResult.def as ActionDecoratorWithPresetClick;
    const wired = this.wireOnClick(actionDef, eventRegistry, formConfig, eventIdGenerator);
    return { kind: 'static', def: wired as ActionDecorator };
  }

  private wireOnClick(
    actionDef: ActionDecoratorWithPresetClick,
    eventRegistry: EventRegistry,
    formConfig: FormConfig,
    eventIdGenerator: EventIdGenerator,
  ): Record<string, any> {
    const rawOnClick = actionDef.onClick as ((data: any) => string | void) | undefined;
    const preSetEventName = actionDef.on?.click as string | undefined;

    // Case 1: on.click already set (only _guiSubmitButton pre-sets this)
    // Register formConfig.onSubmit or user onClick against the pre-set event name.
    if (preSetEventName) {
      const effectiveOnClick =
        rawOnClick ?? (preSetEventName === 'submit' ? formConfig.onSubmit : undefined);
      if (effectiveOnClick) {
        eventRegistry.set(preSetEventName, (event: FormEvent) => {
          const returned = effectiveOnClick(event.data);
          if (typeof returned === 'string') {
            const secondary = eventRegistry.get(returned);
            if (secondary) {
              secondary(event);
            }
          }
        });
      }
      const { onClick: _, ...rest } = actionDef;
      return rest;
    }

    // Case 2: user-provided onClick - generate event name and register handler.
    if (rawOnClick) {
      const eventName = eventIdGenerator.next();
      eventRegistry.set(eventName, (event: FormEvent) => {
        const returned = rawOnClick(event.data);
        if (typeof returned === 'string') {
          const secondary = eventRegistry.get(returned);
          if (secondary) {
            secondary(event);
          }
        }
      });
      const { onClick: _, ...rest } = actionDef;
      return { ...rest, uid: actionDef.uid ?? eventName, on: { click: eventName } };
    }

    // Case 3: no onClick, no pre-set on.click - no event wiring, ensure uid exists.
    return { ...actionDef, uid: actionDef.uid ?? eventIdGenerator.next() };
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
