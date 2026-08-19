import { set } from '../../utils/object';
import type { SET_WIDGET_DATA } from '../actions';
import { type State } from '../model';

export const setWidgetData = (state: State, action: SET_WIDGET_DATA): State => ({
  ...state,
  data: { ...set(state.data, action.payload.path, action.payload.data) },
});
