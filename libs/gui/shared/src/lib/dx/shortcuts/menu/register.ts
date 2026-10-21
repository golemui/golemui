import { type ActionWidget, type FunctionWidgetParams } from '@golemui/core';
import {
  type AfterMergeContext,
  createShortcutType,
  type MergeResult,
  probeForHostEventName,
} from '@golemui/dx';
import type { GslMenusConfig, MenuDecorator, MenuEntry } from './menu.domain';

/**
 * Turns `onClick` into `on.click`. Unlike a button's `onClick(data)`, the handler gets the whole
 * event, because the picked item's value is in `event.detail.value`. A handler with no
 * parameters that returns a string names a host event instead, as `onChange` does.
 */
function wireOnClick(def: Record<string, any>, context: AfterMergeContext) {
  const { onClick, ...rest } = def;
  if (typeof onClick !== 'function') return def;

  let eventName = probeForHostEventName(onClick);
  if (eventName == null) {
    eventName = context.eventIdGenerator.next();
    context.eventRegistry.set(eventName, onClick);
  }
  return { ...rest, on: { ...(rest['on'] ?? {}), click: eventName } };
}

export const menuShortcutType = createShortcutType<MenuEntry, MenuDecorator, GslMenusConfig>({
  itemType: 'MENUS',
  kind: 'action',
  entryShape: 'bare',
  mapToWidget: (def) => {
    const {
      uid,
      label,
      disabled,
      on,
      onClick: _onClick,
      tags: _tags,
      size: _size,
      include: _include,
      exclude: _exclude,
      states: _states,
      ...menuProps
    } = def as MenuDecorator & { on?: { click: string } };
    return {
      uid: uid ?? '',
      kind: 'action',
      type: 'menu',
      label,
      disabled,
      ...(on != null ? { on } : {}),
      props: menuProps,
    } as ActionWidget;
  },
  afterMerge: (mergeResult: MergeResult, context: AfterMergeContext): MergeResult => {
    if (mergeResult.kind === 'dynamic') {
      const fn = mergeResult.fn;
      return {
        kind: 'dynamic',
        fn: (params: FunctionWidgetParams<any>) =>
          wireOnClick(fn(params) as Record<string, any>, context),
      };
    }
    return { kind: 'static', def: wireOnClick(mergeResult.def, context) };
  },
});

export const _gslMenus = menuShortcutType.gsl;
export const _gslMenuByUid = menuShortcutType.gslByUid;
