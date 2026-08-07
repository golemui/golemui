import { isInputWidget, type NonFunctionWidget } from '../../form-widget';
import { type ADD_WIDGET } from '../actions';
import { type State } from '../model';

export function addWidget(state: State, action: ADD_WIDGET): State {
  const uid = action.payload.widget.uid;
  if (!uid) {
    throw new Error('addWidget: widget must have a uid');
  }

  const widget = action.payload.widget;

  // Widgets added after a VALIDATE_ALL pass (a submit attempt) are marked as touched so
  // their errors show immediately.
  const touchedControls =
    state.allControlsValidated && isInputWidget(widget)
      ? { ...state.touchedControls, [widget.path]: true }
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
