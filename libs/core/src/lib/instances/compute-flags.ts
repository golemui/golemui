import {
  type CompiledConditions,
  type CompiledWidget,
  type ExpressionScope,
} from '../compile/compiled-form';
import { scopeOfRow } from './row-scope';
import {
  previousIfSameInstances,
  type WidgetFlags,
  type WidgetInstance,
  type WidgetInstanceTree,
} from './widget-instance';

// Every widget below a hidden widget has these flags. One object, so it is never built again.
const HIDDEN_BY_A_WIDGET_ABOVE: WidgetFlags = Object.freeze({ hidden: true });

type FlagsContext = {
  data: Record<string, any>;
  activeStates: ReadonlySet<string>;
};

/**
 * Computes the flags of every widget instance: `hidden`, `disabled` and `readonly`.
 *
 * A widget gets a flag for each condition that it has. A widget below a hidden widget is hidden
 * too. Its own conditions are not evaluated, so it has no other flag.
 *
 * @param tree - The widget instances, with the flags of the computation before.
 * @param compiledRoot - The compiled root layout that the tree was built from.
 * @param data - The form data. A row reads its `$item` from it.
 * @param scope - The values that a condition reads outside a repeater row, for example `$form`.
 * @param activeStates - The names of the states that are active now.
 * @returns The tree with the flags. An instance whose flags have the same values, and that has
 *   no changed instance below it, is the previous object. So a computation that changes no flag
 *   returns `tree` itself.
 * @throws The error of the first condition that fails, in the order of the document.
 *
 * @example
 * ```ts
 * const scope = { $form: data, $meta: {}, $errors: {}, $formIsInvalid: false };
 * const withFlags = computeWidgetFlags(tree, compiled.root, data, scope, new Set(['company']));
 * // An instance with `include: { in: ['company'] }` has the flags { hidden: false } now.
 * ```
 */
export function computeWidgetFlags(
  tree: WidgetInstanceTree,
  compiledRoot: CompiledWidget | undefined,
  data: Record<string, any>,
  scope: ExpressionScope,
  activeStates: ReadonlySet<string>,
): WidgetInstanceTree {
  if (tree.root === undefined || compiledRoot === undefined) {
    return tree;
  }
  const root = withFlags(tree.root, compiledRoot, scope, false, { data, activeStates });
  return root === tree.root ? tree : { root };
}

/**
 * @param scope - The values that the conditions of this widget read. In a row it has the row.
 * @param isBelowHidden - True when a widget above this one is hidden.
 */
function withFlags(
  instance: WidgetInstance,
  widget: CompiledWidget,
  scope: ExpressionScope,
  isBelowHidden: boolean,
  context: FlagsContext,
): WidgetInstance {
  const flags = isBelowHidden
    ? flagsBelowHiddenWidget(instance.flags)
    : flagsOfConditions(widget.conditions, scope, context.activeStates, instance.flags);
  const isHidden = isBelowHidden || flags?.hidden === true;

  const children = previousIfSameInstances(
    instance.children,
    instance.children.map((child, position) =>
      withFlags(child, widget.children[position], scope, isHidden, context),
    ),
  );
  const rows = previousIfSameInstances(
    instance.rows,
    rowsWithFlags(instance, widget, scope, isHidden, context),
  );

  if (flags === instance.flags && children === instance.children && rows === instance.rows) {
    return instance;
  }
  return { ...instance, flags, children, rows };
}

/**
 * @param previous - The flags of the previous computation.
 * @returns `previous` when it is `{ hidden: true }` alone, so that a widget that its own
 *   condition hid keeps its flags object. Otherwise the one object of the widgets below a hidden
 *   widget.
 */
function flagsBelowHiddenWidget(previous: WidgetFlags | undefined): WidgetFlags {
  const isHiddenAlone =
    previous !== undefined && previous.hidden === true && Object.keys(previous).length === 1;
  return isHiddenAlone ? previous : HIDDEN_BY_A_WIDGET_ABOVE;
}

function rowsWithFlags(
  instance: WidgetInstance,
  widget: CompiledWidget,
  scope: ExpressionScope,
  isHidden: boolean,
  context: FlagsContext,
): WidgetInstance[] {
  const rowLayout = widget.repeater?.rowLayout;
  if (rowLayout === undefined) {
    return instance.rows;
  }
  return instance.rows.map((row) => {
    // No condition of a hidden row is evaluated, so a hidden row needs no scope of its own.
    const scopeOfWidgets = isHidden ? scope : scopeOfRow(scope, row, context.data);
    return withFlags(row, rowLayout, scopeOfWidgets, isHidden, context);
  });
}

/**
 * Evaluates the conditions of one widget, in the order `include`, `exclude`, `disabled`,
 * `readonly`. A condition is true only when its result is exactly `true`.
 *
 * @param previous - The flags of the computation before.
 * @returns `undefined` for a widget with no condition, and `previous` when no flag changed.
 */
function flagsOfConditions(
  conditions: CompiledConditions,
  scope: ExpressionScope,
  activeStates: ReadonlySet<string>,
  previous: WidgetFlags | undefined,
): WidgetFlags | undefined {
  const { include, exclude, disabled, readonly } = conditions;
  // Most widgets have no condition. For them, return before a flags object is created.
  if (
    include === undefined &&
    exclude === undefined &&
    disabled === undefined &&
    readonly === undefined
  ) {
    return undefined;
  }

  const flags: WidgetFlags = {};
  if (include !== undefined) {
    flags.hidden =
      'in' in include
        ? !include.in.some((stateName) => activeStates.has(stateName))
        : include.when.evaluate(scope) !== true;
  }
  // A widget with `include` and `exclude` follows `exclude` alone.
  if (exclude !== undefined) {
    flags.hidden =
      'from' in exclude
        ? exclude.from.some((stateName) => activeStates.has(stateName))
        : exclude.when.evaluate(scope) === true;
  }
  if (disabled !== undefined) {
    flags.disabled = disabled.evaluate(scope) === true;
  }
  if (readonly !== undefined) {
    flags.readonly = readonly.evaluate(scope) === true;
  }

  const isSameAsPrevious =
    previous !== undefined &&
    Object.keys(previous).length === Object.keys(flags).length &&
    previous.hidden === flags.hidden &&
    previous.disabled === flags.disabled &&
    previous.readonly === flags.readonly;
  return isSameAsPrevious ? previous : flags;
}
