import { copyOnWriteSet } from '../../utils/object';
import type { SET_WIDGET_DATA } from '../actions';
import { type State } from '../model';
import { moveRowState } from './move-row-state';

export const setWidgetData = (state: State, action: SET_WIDGET_DATA): State => {
  const { path, data, rowChange } = action.payload;
  const written: State = { ...state, data: copyOnWriteSet(state.data, path, data) };
  return rowChange === undefined ? written : moveRowState(written, path, rowChange);
};
