import { isInputWidget, type NonFunctionWidget } from '../../form-widget';
import { type ADD_WIDGET } from '../actions';
import { type State } from '../model';

export function addWidget(state: State, action: ADD_WIDGET): State {
  const uid = action.payload.widget.uid;
  if (!uid) {
    throw new Error('addWidget: widget must have a uid');
  }

  const widget = action.payload.widget;

  // If the form has already been globally touched (e.g. submitted), immediately
  // mark the incoming widget as touched so its validation errors are visible.
  const touchedControls =
    state.touched && isInputWidget(widget)
      ? { ...state.touchedControls, [(widget as any).path]: true }
      : state.touchedControls;

  return {
    ...state,
    touchedControls,
    calculatedWidgets: {
      ...state.calculatedWidgets,
      [uid]: {
        source: widget,
        current: {} as NonFunctionWidget,
      },
    },
  };
}
