import {
  FormWidget,
  FunctionWidgetParams,
  LayoutWidget,
  NonFunctionWidget,
} from '@golemui/core';
import type { MergeResult } from '../../core/dx.domain';
import type {
  BuildWidgetContext,
  ItemTypeHandler,
  ParsedEntry,
} from '../../core/itemTypeRegistry';
import { registerItemType } from '../../core/itemTypeRegistry';
import { createGslSelector } from '../../core/dxUtilityTypes';
import type { RepeaterDecorator, RepeaterEntry, GslRepeaterConfig } from './repeater.domain';

function buildRepeaterProps(def: RepeaterDecorator): Record<string, any> {
  const props: Record<string, any> = {};
  if (def.addLabel != null) props['addLabel'] = def.addLabel;
  if (def.removeLabel != null) props['removeLabel'] = def.removeLabel;
  if (def.limit != null) props['limit'] = def.limit;
  if (def.title != null) props['title'] = def.title;
  if (def.addButtonIcon != null) props['addButtonIcon'] = def.addButtonIcon;
  if (def.removeButtonIcon != null) props['removeButtonIcon'] = def.removeButtonIcon;
  return props;
}

function mapToWidget(def: Record<string, any>): NonFunctionWidget {
  return {
    uid: def['uid'] ?? '',
    kind: 'input',
    type: 'repeater',
    path: def['path'] ?? '',
    props: {
      ...buildRepeaterProps(def as RepeaterDecorator),
      template: { kind: 'layout', type: 'flex', children: [], props: { direction: 'column' } },
    },
  } as NonFunctionWidget;
}

function prefixTemplatePaths(widgets: FormWidget[], prefix: string): void {
  for (const widget of widgets) {
    if (typeof widget === 'function') continue;
    const w = widget as NonFunctionWidget & { path?: string };
    if (typeof w.path === 'string' && w.path) {
      w.path = prefix + w.path;
    }
    // Recurse into layout children (e.g. horizontal/vertical stacks)
    if ('children' in w && Array.isArray(w.children)) {
      prefixTemplatePaths(w.children as FormWidget[], prefix);
    }
    // Recurse into nested repeater templates — each nesting level uses a
    // different prefix so this is additive, not double-prefixing.
    const props = (w as any).props;
    if (props?.template?.children && Array.isArray(props.template.children)) {
      prefixTemplatePaths(props.template.children as FormWidget[], prefix);
    }
  }
}

function buildWidget(
  mergeResult: MergeResult,
  context: BuildWidgetContext,
): FormWidget {
  const walkedChildren = context.walkChildren(context.children ?? []);

  // Auto-prefix: prepend {path}.items. to all template children paths.
  // The path is always static (entry.key) — for dynamic mergeResults
  // the walker bakes it into the fn return, so we can extract it safely.
  const repeaterPath =
    mergeResult.kind === 'static'
      ? (mergeResult.def['path'] as string) ?? ''
      : (mergeResult.fn({} as FunctionWidgetParams<any>)?.['path'] as string) ?? '';
  if (repeaterPath) {
    prefixTemplatePaths(walkedChildren, repeaterPath + '.items.');
  }

  const template: LayoutWidget = {
    kind: 'layout',
    type: 'flex',
    uid: '',
    children: walkedChildren,
    props: { direction: 'column' },
  };

  if (mergeResult.kind === 'static') {
    const mapped = context.mapStaticDef(mergeResult.def, 'REPEATER');
    return {
      ...mapped,
      props: { ...mapped.props, template },
    } as NonFunctionWidget;
  }

  const fn = mergeResult.fn;
  return ((params: FunctionWidgetParams<any>) => {
    const runtimeDef = fn(params);
    const mapped = context.mapStaticDef(runtimeDef, 'REPEATER');
    return {
      ...mapped,
      props: { ...mapped.props, template },
    };
  }) as FormWidget;
}

function parseEntry(entry: RepeaterEntry): ParsedEntry<RepeaterDecorator> {
  return {
    baseDef: entry.def,
    path: entry.key,
    children: entry.children,
  };
}

function getChildren(entry: RepeaterEntry): any[] | undefined {
  return entry.children;
}

const handler: ItemTypeHandler<RepeaterEntry, RepeaterDecorator, GslRepeaterConfig> = {
  parseEntry,
  rollUpSensibleDefaults: () => ({}) as GslRepeaterConfig,
  applySensibleDefaults: (def) => def,
  mapToWidget: mapToWidget as any,
  buildWidget,
  getChildren,
};

registerItemType('REPEATER', handler);

// GSL selectors
export const _gslRepeaters = createGslSelector<RepeaterDecorator, GslRepeaterConfig>('REPEATER');

export const _gslRepeaterById = (id: string, config: GslRepeaterConfig) =>
  _gslRepeaters(config, ((d: any) => d.uid === id) as any);
