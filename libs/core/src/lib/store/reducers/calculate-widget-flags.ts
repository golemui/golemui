import { compile, parse } from 'subscript/justin';
import { isActionWidget, isFunctionWidget, isInputWidget } from '../../form-widget';
import { Debug } from '../../utils/debug';
import { State } from '../model';
import { hasWhen } from './utils';

export const calculateWidgetFlags = (state: State): State => {
  return {
    ...state,
    widgetFlags: calculateFlags(state),
  };
};

// TODO: Do we need this at all? can't we just do this during calculate-widget-props during the layout.children calculations?
function calculateFlags(state: State): State['widgetFlags'] {
  // TODO: we are not accounting for repeater widgets here
  return (
    Object.values(state.calculatedWidgets)
      // TODO: use filterMap
      .map((derived) => {
        const source = derived.source;
        if (isFunctionWidget(source)) {
          const widget_ = source({
            $form: state.data,
            errors: undefined,
            touched: undefined,
            translate: undefined,
          });
          widget_.uid = source.uid!;
          return widget_;
        }
        return derived.current;
      })
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

          // show
          if (widget.include && 'in' in widget.include) {
            flags[widget.uid].hidden = !widget.include.in.some((widgetState) =>
              state.currentStates.includes(widgetState),
            );
          } else if (widget.include && 'when' in widget.include) {
            flags[widget.uid].hidden = !expressionIsTrue(widget.include.when, state.data);
          }

          // hide
          if (widget.exclude && 'from' in widget.exclude) {
            flags[widget.uid].hidden = widget.exclude.from.some((widgetState) =>
              state.currentStates.includes(widgetState),
            );
          } else if (widget.exclude && 'when' in widget.exclude) {
            flags[widget.uid].hidden = expressionIsTrue(widget.exclude.when, state.data);
          }

          // TODO: We have to document that (disabled|readonly).when is NOT compatible with states e.g. `{'disabled.register': {when: '...'}}`
          //       It's either boolean, states + boolean or when.

          // disabled
          if (isInputWidget(widget) || isActionWidget(widget)) {
            if (hasWhen(widget.disabled)) {
              flags[widget.uid].disabled = expressionIsTrue(
                (widget.disabled as { when: string }).when,
                state.data,
              );
            }
          }

          // readonly
          if (isInputWidget(widget) && hasWhen(widget.readonly)) {
            flags[widget.uid].readonly = expressionIsTrue(
              (widget.readonly as { when: string }).when,
              state.data,
            );
          }

          return flags;
        },
        {} as State['widgetFlags'],
      )
  );
}

// TODO: caching or memoization or...?
function expressionIsTrue(expression: string, data: State['data']): boolean {
  const ast = parse(expression);
  const evaluate = compile(ast);
  const result = evaluate({
    $form: data,
    $log: Debug.log,
  });
  return result === true;
}
