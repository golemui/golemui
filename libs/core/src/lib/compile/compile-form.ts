import { type Form } from '../form';
import { type FormWidget, isActionWidget, isInputWidget, isLayoutWidget } from '../form-widget';
import { type DotPath } from '../shared';
import { expandStateExpressions } from '../store/reducers/calculate-current-state';
import { hasWhen } from '../store/reducers/utils';
import { type ExpressionPolicy } from '../utils/check-expression';
import { ITEMS_TOKEN, type RepeaterTemplateWidget } from '../utils/repeater';
import { compileFormExpression, compileRowCondition, type RowLevel } from './compile-expression';
import {
  compileCoreFields,
  compileOnFields,
  compilePropFields,
  createFieldCompileContext,
  type FieldCompileContext,
} from './compile-fields';
import {
  type CompiledConditions,
  type CompiledExpression,
  type CompiledForm,
  type CompiledPath,
  type CompiledRepeater,
  type CompiledState,
  type CompiledWidget,
} from './compiled-form';

type WidgetCompileContext = FieldCompileContext & {
  /** The repeaters around the widget, the outermost first. Empty outside a row template. */
  rowLevels: RowLevel[];
};

/**
 * Compiles a decoded form definition. A part of the definition that cannot work, such as an
 * expression that does not parse, keeps its error. The form reports that error when a widget
 * uses the part.
 *
 * @param formDef - The decoded form definition. Its `form` is the root layout.
 * @param policy - Which issues of the expression check make an expression fail.
 * @returns The compiled form.
 *
 * @example
 * ```ts
 * const root = { uid: '', kind: 'layout', type: 'grid', children: widgets };
 * const compiled = compileForm(formDefDecoder.parse({ states, form: root }), 'warn');
 * // compiled.root is the compiled root layout, and compiled.states are the declared states
 * ```
 */
export function compileForm(formDef: Form<string>, policy: ExpressionPolicy): CompiledForm {
  const stateNames = Object.keys(formDef.states ?? {});
  const context: WidgetCompileContext = {
    ...createFieldCompileContext(stateNames, policy),
    rowLevels: [],
  };
  return {
    root: compileWidget(formDef.form, context),
    states: compileStates(formDef.states, policy),
  };
}

function compileStates(states: Form<string>['states'], policy: ExpressionPolicy): CompiledState[] {
  if (!states) {
    return [];
  }
  // Each expression gets the expressions of its parent states: `a:b` is `(a) && (b)`.
  const expressions = expandStateExpressions(states);
  return Object.keys(expressions).map((name) => ({
    name,
    condition: compileFormExpression(expressions[name], policy),
  }));
}

function compileWidget(source: FormWidget<string>, context: WidgetCompileContext): CompiledWidget {
  const path = isInputWidget(source) ? compilePath(source.path, context.rowLevels) : undefined;
  const children = isLayoutWidget(source)
    ? source.children.map((child) => compileWidget(child, context))
    : [];
  const repeater =
    isRepeater(source) && path !== undefined ? compileRows(source, path, context) : undefined;
  const conditions = compileConditions(source, context);

  const hasConditionsBelow =
    Object.keys(conditions).length > 0 ||
    children.some((child) => child.hasConditionsBelow) ||
    repeater?.rowLayout.hasConditionsBelow === true;

  return {
    source,
    children,
    repeater,
    path,
    conditions,
    hasConditionsBelow,
    coreFields: compileCoreFields(source, context),
    propFields: compilePropFields(source, isRepeater(source), context),
    onFields: compileOnFields(source, context),
  };
}

// A display or a layout with the type `repeater` has no path, so it has no rows.
function isRepeater(source: FormWidget<string>): source is RepeaterTemplateWidget {
  return isInputWidget(source) && source.type === 'repeater';
}

// -----------------------------------------------------------------------------
// Paths and rows
// -----------------------------------------------------------------------------

/**
 * The path of an input in a row replaces the declared path of the row, `users.items`, by the
 * path of the row, `users.2`. Another segment `items` in the path is a property name.
 */
function compilePath(declared: DotPath, rowLevels: RowLevel[]): CompiledPath {
  if (rowLevels.length === 0) {
    return { declared, parts: [declared] };
  }
  const { declaredItemPath, itemPathParts } = rowLevels[rowLevels.length - 1];
  if (declared !== declaredItemPath && !declared.startsWith(`${declaredItemPath}.`)) {
    return {
      declared,
      error: new Error(`Path "${declared}" is not inside the repeater row "${declaredItemPath}".`),
    };
  }
  const parts = [...itemPathParts];
  parts[parts.length - 1] += declared.slice(declaredItemPath.length);
  return { declared, parts };
}

function compileRows(
  source: RepeaterTemplateWidget,
  path: CompiledPath,
  context: WidgetCompileContext,
): CompiledRepeater | undefined {
  if ('error' in path) {
    return undefined;
  }
  const declaredItemPath = `${path.declared}.${ITEMS_TOKEN}`;
  // The path of a row is the path of the repeater, a dot and the index of the row.
  const itemPathParts = [...path.parts, ''];
  itemPathParts[itemPathParts.length - 2] += '.';
  const rowLevels = [...context.rowLevels, { declaredItemPath, itemPathParts }];
  return {
    rowLayout: compileWidget(source.props.template, { ...context, rowLevels }),
    declaredItemPath,
  };
}

// -----------------------------------------------------------------------------
// Conditions
// -----------------------------------------------------------------------------

function compileConditions(
  source: FormWidget<string>,
  context: WidgetCompileContext,
): CompiledConditions {
  // Outside a row template the widget has no rows around it, and no reference is read as a row.
  const compileCondition = (condition: string): CompiledExpression =>
    compileRowCondition(condition, context.rowLevels, context.policy);

  const conditions: CompiledConditions = {};
  if (source.include && 'in' in source.include) {
    conditions.include = { in: source.include.in };
  } else if (source.include && 'when' in source.include) {
    conditions.include = { when: compileCondition(source.include.when) };
  }
  if (source.exclude && 'from' in source.exclude) {
    conditions.exclude = { from: source.exclude.from };
  } else if (source.exclude && 'when' in source.exclude) {
    conditions.exclude = { when: compileCondition(source.exclude.when) };
  }
  // A boolean `disabled` or `readonly` is a value of the widget, not a condition.
  if ((isInputWidget(source) || isActionWidget(source)) && hasWhen(source.disabled)) {
    conditions.disabled = compileCondition(source.disabled.when);
  }
  if (isInputWidget(source) && hasWhen(source.readonly)) {
    conditions.readonly = compileCondition(source.readonly.when);
  }
  return conditions;
}
