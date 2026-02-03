import { get, set } from '../../utils/object';
import * as Actions from '../actions';
import { State } from '../model';

export const setWidgetData = (
  state: State,
  action: Actions.SET_WIDGET_DATA | Actions.SET_WIDGET_INITIAL_DATA,
): State => {
  const oldValue = get(state.data, action.payload.path);
  const shouldUpdate =
    action.type === 'SET_WIDGET_DATA' ||
    (action.type === 'SET_WIDGET_INITIAL_DATA' && oldValue === undefined);
  if (shouldUpdate) {
    return {
      ...state,
      data: { ...set(state.data, action.payload.path, action.payload.data) },
    };
  } else {
    return state;
  }
};
