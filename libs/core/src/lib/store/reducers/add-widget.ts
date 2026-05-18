import { type NonFunctionWidget } from '../../form-widget';
import { type ADD_WIDGET } from '../actions';
import { type State } from '../model';

export function addWidget(state: State, action: ADD_WIDGET): State {
  return {
    ...state,
    calculatedWidgets: {
      ...state.calculatedWidgets,
      [action.payload.widget.uid!]: {
        source: action.payload.widget,
        current: {} as NonFunctionWidget,
      },
    },
  };
}
