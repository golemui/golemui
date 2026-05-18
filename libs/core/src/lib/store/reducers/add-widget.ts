import { type NonFunctionWidget } from '../../form-widget';
import { type ADD_WIDGET } from '../actions';
import { type State } from '../model';

export function addWidget(state: State, action: ADD_WIDGET): State {
  const uid = action.payload.widget.uid;
  if (!uid) {
    throw new Error('addWidget: widget must have a uid');
  }
  return {
    ...state,
    calculatedWidgets: {
      ...state.calculatedWidgets,
      [uid]: {
        source: action.payload.widget,
        current: {} as NonFunctionWidget,
      },
    },
  };
}
