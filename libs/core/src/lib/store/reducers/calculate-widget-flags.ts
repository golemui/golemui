import {
  type FormWidget,
  isActionWidget,
  isFunctionWidget,
  isInputWidget,
  isLayoutWidget,
  type NonFunctionWidget,
} from '../../form-widget';
import { type $Errors, type ExpressionFunctions, type Uid } from '../../shared';
import { calculateValidationVariables, type ValidationVariables } from '../../utils/form';
import { expressionIsTrue } from '../../utils/justin';
import { get } from '../../utils/object';
import {
  extractRepeaterIndexes,
  isRepeaterWidget,
  toRepeaterItemUid,
  transformWidgetWhenExpressions,
} from '../../utils/repeater';
import { type State } from '../model';
import { hasWhen } from './utils';

/**
 * Evaluates the include / exclude / disabled / readonly conditions of every widget in `resolvedSources`.
 *
 * @param validationVariables - Pass them when already computed for this pass, otherwise they are computed here.
 */
export const calculateWidgetFlags =
  (functions: ExpressionFunctions) =>
  (state: State, validationVariables?: ValidationVariables): State => {
    const { $formIsInvalid, $errors } = validationVariables ?? calculateValidationVariables(state);

    return {
      ...state,
      widgetFlags: calculateFlags(state, $errors, $formIsInvalid, functions),
    };
  };

function calculateFlags(
  state: State,
  $errors: $Errors,
  $formIsInvalid: boolean,
  functions: ExpressionFunctions,
): State['widgetFlags'] {
  const widgets = Object.entries(state.resolvedSources).map(([uid, source]) =>
    resolveForFlags(uid as Uid, source, state),
  );

  const flags = widgets
    .filter((widget) => {
      if (widget.include && ('in' in widget.include || 'when' in widget.include)) {
        return true;
      }
      if (widget.exclude && ('from' in widget.exclude || 'when' in widget.exclude)) {
        return true;
      }
      if ((isInputWidget(widget) || isActionWidget(widget)) && hasWhen(widget.disabled)) {
        return true;
      }
      if (isInputWidget(widget) && hasWhen(widget.readonly)) {
        return true;
      }
      return false;
    })
    .reduce(
      (flags, widget) => {
        flags[widget.uid] = flags[widget.uid] || {};

        // Widgets inside a repeater item see that item through $item / $index
        const itemScope = state.repeaterItemScopes[widget.uid];
        const extraScope = itemScope
          ? { $item: get(state.data, itemScope.itemPath), $index: itemScope.index, $fn: functions }
          : { $fn: functions };

        // show
        if (widget.include && 'in' in widget.include) {
          flags[widget.uid].hidden = !widget.include.in.some((widgetState) =>
            state.currentStates.includes(widgetState),
          );
        } else if (widget.include && 'when' in widget.include) {
          flags[widget.uid].hidden = !expressionIsTrue(
            widget.include.when,
            state.data,
            state.meta,
            $errors,
            $formIsInvalid,
            extraScope,
          );
        }

        // hide
        if (widget.exclude && 'from' in widget.exclude) {
          flags[widget.uid].hidden = widget.exclude.from.some((widgetState) =>
            state.currentStates.includes(widgetState),
          );
        } else if (widget.exclude && 'when' in widget.exclude) {
          flags[widget.uid].hidden = expressionIsTrue(
            widget.exclude.when,
            state.data,
            state.meta,
            $errors,
            $formIsInvalid,
            extraScope,
          );
        }

        // TODO: We have to document that (disabled|readonly).when is NOT compatible with states e.g. `{'disabled.register': {when: '...'}}`
        //       It's either boolean, states + boolean or when.

        // disabled
        if (isInputWidget(widget) || isActionWidget(widget)) {
          if (hasWhen(widget.disabled)) {
            flags[widget.uid].disabled = expressionIsTrue(
              (widget.disabled as { when: string }).when,
              state.data,
              state.meta,
              $errors,
              $formIsInvalid,
              extraScope,
            );
          }
        }

        // readonly
        if (isInputWidget(widget) && hasWhen(widget.readonly)) {
          flags[widget.uid].readonly = expressionIsTrue(
            (widget.readonly as { when: string }).when,
            state.data,
            state.meta,
            $errors,
            $formIsInvalid,
            extraScope,
          );
        }

        return flags;
      },
      {} as State['widgetFlags'],
    );

  propagateHiddenToDescendants(state, flags);
  return flags;
}

/**
 * Marks every widget below a hidden widget hidden, so a hidden subtree leaves validation,
 * touch-all, `isFormValid` and data pruning together with its root.
 */
function propagateHiddenToDescendants(state: State, flags: State['widgetFlags']): void {
  const hiddenRoots = Object.keys(flags).filter((uid) => flags[uid].hidden === true);
  for (const uid of hiddenRoots) {
    markDescendantsHidden(uid as Uid, state, flags);
  }
}

function markDescendantsHidden(uid: Uid, state: State, flags: State['widgetFlags']): void {
  const source = state.resolvedSources[uid];
  if (source === undefined) {
    return;
  }

  // Every widget a repeater row produces has a scope whose item path sits under the
  // repeater's path, nested rows included, so one scan covers the whole row forest.
  if (isRepeaterWidget(source) || (isFunctionWidget(source) && source.path !== undefined)) {
    const rowPrefix = `${source.path}.`;
    for (const [rowUid, scope] of Object.entries(state.repeaterItemScopes)) {
      if (scope.itemPath.startsWith(rowPrefix)) {
        markHidden(rowUid as Uid, flags);
      }
    }
  }

  // A layout's children live in resolvedSources under the layout's own row index suffix.
  if (isLayoutWidget(source)) {
    const repeaterIndexes = extractRepeaterIndexes(uid);
    for (const child of source.children) {
      const childUid = (
        repeaterIndexes.length > 0
          ? toRepeaterItemUid(child.uid as Uid, repeaterIndexes)
          : child.uid
      ) as Uid;
      if (state.resolvedSources[childUid] === undefined) {
        continue;
      }
      // A child that is already hidden had its subtree handled by its own iteration.
      const alreadyHidden = flags[childUid]?.hidden === true;
      markHidden(childUid, flags);
      if (!alreadyHidden) {
        markDescendantsHidden(childUid, state, flags);
      }
    }
  }
}

function markHidden(uid: Uid, flags: State['widgetFlags']): void {
  flags[uid] = flags[uid] || {};
  flags[uid].hidden = true;
}

/**
 * Turns a `resolvedSources` entry into the plain widget the flag conditions are read from:
 * a function widget is called with its item in scope, and a row widget gets its legacy `.items.`
 * when tokens rewritten for its row.
 */
function resolveForFlags(
  uid: Uid,
  source: FormWidget<string>,
  state: State,
): NonFunctionWidget<string> {
  const itemScope = state.repeaterItemScopes[uid];
  let widget: NonFunctionWidget<string>;
  if (isFunctionWidget(source)) {
    // The function may return a cached object. Copy it before writing the uid,
    // so the write never reaches the object the function owns.
    widget = {
      ...source({
        $form: state.data,
        $item: itemScope ? get(state.data, itemScope.itemPath) : undefined,
        $index: itemScope?.index,
        errors: undefined,
        touched: undefined,
        translate: undefined,
      }),
    };
    widget.uid = uid;
  } else {
    widget = source;
  }
  const repeaterIndexes = extractRepeaterIndexes(uid);
  if (repeaterIndexes.length > 0) {
    widget = transformWidgetWhenExpressions(widget, repeaterIndexes);
  }
  return widget;
}
