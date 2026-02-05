import { isInputWidget } from '../../form-widget';
import * as Fn from '../../utils/function';
import { deleteKey } from '../../utils/object';
import { REMOVE_WIDGET } from '../actions';
import { State } from '../model';

// TODO: should we remove data as well?
export function removeWidget(state: State, action: REMOVE_WIDGET): State {
  return {
    ...state,
    widgetFlags: {
      ...deleteKey(state.widgetFlags, action.payload.uid),
    },
    // TODO: has this already been removed in calculate-widget-props??? Do we need this at all?
    calculatedWidgets: {
      ...deleteKey(state.calculatedWidgets, action.payload.uid),
    },
    widgetPropOverrides: {
      ...deleteKey(state.widgetPropOverrides, action.payload.uid),
    },
    touchedControls: {
      ...Fn.pipe(state.touchedControls, (touchedControls) => {
        // TODO: this doesn't account for repeater items
        const widget = state.flatForm[action.payload.uid];
        if (widget && isInputWidget(widget)) {
          return deleteKey(touchedControls, widget.path);
        }
        return touchedControls;
      }),
    },
    // TODO: clear widget from injectedValidations
  };
}
