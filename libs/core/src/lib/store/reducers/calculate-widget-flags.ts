import { isFunctionWidget } from '../../form-widget';
import { State } from '../model';

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
    Object.values(state.flatForm)
      // TODO: use filterMap
      .map((widget) => {
        if (isFunctionWidget(widget)) {
          const widget_ = widget({
            $form: state.data,
            errors: undefined,
            touched: undefined,
            translate: undefined,
          });
          widget_.uid = widget.uid!;
          return widget_;
        }
        return widget;
      })
      .filter((widget) => {
        if (widget.include && 'in' in widget.include) {
          return true;
        }
        if (widget.exclude && 'from' in widget.exclude) {
          return true;
        }
        // TODO: I don't think we need this `if` statement here anymore, we're only concerned about `include` and `exclude`
        // Has any of the properties a state suffix? e.g. '"disabled.someState" = true'
        if (Object.keys(widget).find((key) => key.indexOf('.') > -1)) {
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
          }
          // hide
          if (widget.exclude && 'from' in widget.exclude) {
            flags[widget.uid].hidden = widget.exclude.from.some((widgetState) =>
              state.currentStates.includes(widgetState),
            );
          }

          return flags;
        },
        {} as State['widgetFlags'],
      )
  );
}
