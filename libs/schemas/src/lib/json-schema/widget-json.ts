import { type BuildResult, type FormWidgetJson, type WidgetPatch } from './types.js';

/** A build result as a list: `null` and `undefined` become an empty list. */
export function asWidgetList(result: BuildResult): FormWidgetJson[] {
  if (result === null || result === undefined) {
    return [];
  }
  return Array.isArray(result) ? result : [result];
}

// Patch fields copied onto the widget as they are. `props` merges key by key.
const COPIED_PATCH_FIELDS = [
  'label',
  'validator',
  'defaultValue',
  'readonly',
  'size',
  'uid',
] as const;

/**
 * Copies the widget fields of a patch onto a build result. When a node builds several widgets,
 * the patch goes to the first one. The result is copied, never modified.
 */
export function applyPatch(result: BuildResult, patch: WidgetPatch | undefined): BuildResult {
  const widgets = asWidgetList(result);
  if (patch === undefined || widgets.length === 0) {
    return result;
  }
  const patched: Record<string, unknown> = { ...widgets[0] };
  for (const field of COPIED_PATCH_FIELDS) {
    if (patch[field] !== undefined) {
      patched[field] = patch[field];
    }
  }
  if (patch.props !== undefined) {
    patched['props'] = { ...widgets[0].props, ...patch.props };
  }
  const patchedWidget = patched as FormWidgetJson;
  return Array.isArray(result) ? [patchedWidget, ...widgets.slice(1)] : patchedWidget;
}

/**
 * Adds a visibility condition to every widget of a build result. An existing `include.when` is
 * combined with `&&`. An `include.in` (state-based) is replaced, it cannot be combined.
 */
export function withIncludeCondition(result: BuildResult, when: string): BuildResult {
  const widgets = asWidgetList(result).map((widget): FormWidgetJson => {
    const existing = widget.include;
    const combined =
      existing !== undefined && 'when' in existing ? `(${existing.when}) && ${when}` : when;
    return { ...widget, include: { when: combined } };
  });
  if (result === null || result === undefined) {
    return result;
  }
  return Array.isArray(result) ? widgets : widgets[0];
}

/**
 * Removes every input whose `path`, and every widget whose `uid`, an earlier widget already
 * has. Two inputs on one path would both write it, and the form treats a repeated uid as an
 * error. Repeater templates are checked too.
 *
 * @param onRemoved - Called for each removed widget, with the field that repeats.
 */
export function removeDuplicateWidgets(
  widgets: FormWidgetJson[],
  onRemoved: (widget: FormWidgetJson, field: 'path' | 'uid') => void,
): FormWidgetJson[] {
  const seenPaths = new Set<string>();
  const seenUids = new Set<string>();

  const visitList = (list: FormWidgetJson[]): FormWidgetJson[] => {
    const kept: FormWidgetJson[] = [];
    for (const widget of list) {
      if (widget.kind === 'input' && typeof widget.path === 'string') {
        if (seenPaths.has(widget.path)) {
          onRemoved(widget, 'path');
          continue;
        }
        seenPaths.add(widget.path);
      }
      if (typeof widget.uid === 'string') {
        if (seenUids.has(widget.uid)) {
          onRemoved(widget, 'uid');
          continue;
        }
        seenUids.add(widget.uid);
      }
      kept.push(visitNested(widget));
    }
    return kept;
  };

  const visitNested = (widget: FormWidgetJson): FormWidgetJson => {
    let visited = widget;
    if (Array.isArray(widget.children)) {
      visited = { ...visited, children: visitList(widget.children) };
    }
    const template = widget.props?.['template'];
    if (isWidget(template)) {
      visited = { ...visited, props: { ...widget.props, template: visitNested(template) } };
    }
    return visited;
  };

  return visitList(widgets);
}

// Output key order, so files written at build time have readable diffs. Other keys follow in
// the order they were set, and a state-suffixed key like `validator.us` follows its base key.
const KEY_ORDER = [
  'kind',
  'type',
  'uid',
  'actionType',
  'path',
  'label',
  'include',
  'exclude',
  'disabled',
  'readonly',
  'defaultValue',
  'validator',
  'size',
  'on',
  'props',
  'children',
];

/**
 * Copies a widget without `undefined` values, in the key order of `KEY_ORDER`, and does the
 * same for its children, its repeater template and the first level of its `props`.
 */
export function cleanWidget(widget: FormWidgetJson): FormWidgetJson {
  const rankOf = (key: string) => {
    const rank = KEY_ORDER.indexOf(key.split('.')[0]);
    return rank === -1 ? KEY_ORDER.length : rank;
  };
  const keys = Object.keys(widget)
    .filter((key) => widget[key] !== undefined)
    .map((key, position) => ({ key, position }))
    .sort((first, second) => {
      const byRank = rankOf(first.key) - rankOf(second.key);
      if (byRank !== 0) {
        return byRank;
      }
      // Within one base key, the plain key comes before its state-suffixed ones.
      const bySuffix = Number(first.key.includes('.')) - Number(second.key.includes('.'));
      return bySuffix !== 0 ? bySuffix : first.position - second.position;
    });

  const cleaned: Record<string, unknown> = {};
  for (const { key } of keys) {
    cleaned[key] = widget[key];
  }
  if (Array.isArray(widget.children)) {
    cleaned['children'] = widget.children.map(cleanWidget);
  }
  if (widget.props !== undefined) {
    const props = Object.fromEntries(
      Object.entries(widget.props).filter(([, value]) => value !== undefined),
    );
    if (isWidget(props['template'])) {
      props['template'] = cleanWidget(props['template']);
    }
    cleaned['props'] = props;
  }
  return cleaned as FormWidgetJson;
}

function isWidget(value: unknown): value is FormWidgetJson {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as FormWidgetJson).kind === 'string' &&
    typeof (value as FormWidgetJson).type === 'string'
  );
}
