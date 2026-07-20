import { isActionWidget, isFunctionWidget, isInputWidget } from '../../form-widget';
import { type $Errors, type ExpressionFunctions } from '../../shared';
import { calculateValidationVariables } from '../../utils/form';
import { expressionIsTrue } from '../../utils/justin';
import { get } from '../../utils/object';
import { type State } from '../model';
import { hasWhen } from './utils';

export const calculateWidgetFlags =
  (functions: ExpressionFunctions) =>
  (state: State): State => {
    // Precalculate the validation variables for all the following steps
    const { $formIsInvalid, $errors } = calculateValidationVariables(state);

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
  const plainWidgets = Object.values(state.flatForm).map((widget) => {
    if (isFunctionWidget(widget)) {
      const resolved = widget({
        $form: state.data,
        errors: undefined,
        touched: undefined,
        translate: undefined,
      });
      resolved.uid = widget.uid as string;
      return resolved;
    }
    return widget;
  });

  // Repeater item widgets come from the materialization stage: their uid is concrete, their `when` expressions are already rewritten for their item, and function widgets are already resolved
  const repeaterItemWidgets = Object.values(state.materializedRepeaterWidgets);

  return [...plainWidgets, ...repeaterItemWidgets]
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
