import { isInputWidget } from '../../form-widget';
import { pipe } from '../../utils/function';
import { deleteKey, unset } from '../../utils/object';
import { type REMOVE_WIDGET } from '../actions';
import { type State } from '../model';

export function removeWidget(state: State, action: REMOVE_WIDGET): State {
  return pipe(
    state,
    data(action),
    widgetFlags(action),
    calculatedWidgets(action),
    widgetPropOverrides(action),
    touchedControls(action),
  );
  // TODO: clear widget from injectedValidations
}

const data =
  (action: REMOVE_WIDGET) =>
  (state: State): State => ({
    ...state,
    data: pipe(state.calculatedWidgets, (calculatedWidgets) => {
      const widget = calculatedWidgets[action.payload.uid].current;
      if (widget && isInputWidget(widget)) {
        return unset(state.data, widget.path);
      }
      return state.data;
    }),
  });

const widgetFlags =
  (action: REMOVE_WIDGET) =>
  (state: State): State => ({
    ...state,
    widgetFlags: {
      ...deleteKey(state.widgetFlags, action.payload.uid),
    },
  });

const calculatedWidgets =
  (action: REMOVE_WIDGET) =>
  (state: State): State => ({
    ...state,
    // TODO: has this already been removed in calculate-widget-props??? Do we need this at all?
    calculatedWidgets: {
      ...deleteKey(state.calculatedWidgets, action.payload.uid),
    },
  });

const widgetPropOverrides =
  (action: REMOVE_WIDGET) =>
  (state: State): State => ({
    ...state,
    widgetPropOverrides: {
      ...deleteKey(state.widgetPropOverrides, action.payload.uid),
    },
  });

const touchedControls =
  (action: REMOVE_WIDGET) =>
  (state: State): State => ({
    ...state,
    touchedControls: pipe(state.touchedControls, (touchedControls) => {
      const widget = state.flatForm[action.payload.uid];
      if (widget && isInputWidget(widget)) {
        return deleteKey(touchedControls, widget.path);
      }
      return touchedControls;
    }),
  });
