import {
  type FormWidget,
  isActionWidget,
  isFunctionWidget,
  isInputWidget,
  type NonFunctionWidget,
} from '../../form-widget';
import { type $Errors, type ExpressionFunctions, type Uid } from '../../shared';
import { calculateValidationVariables, type ValidationVariables } from '../../utils/form';
import { expressionIsTrue } from '../../utils/justin';
import { get } from '../../utils/object';
import { extractRepeaterIndexes, transformWidgetWhenExpressions } from '../../utils/repeater';
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

  return widgets
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
    widget = source({
      $form: state.data,
      $item: itemScope ? get(state.data, itemScope.itemPath) : undefined,
      $index: itemScope?.index,
      errors: undefined,
      touched: undefined,
      translate: undefined,
    });
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
