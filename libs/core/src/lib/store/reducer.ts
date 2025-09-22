import { assertNever } from '../utils/assert-never';
import { Action } from './actions';
import { State } from './model';
import * as Reducers from './reducers';

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INITIALIZE':
      return Reducers.initialize(state, action);

    case 'SET_DATA':
      return Reducers.setData(state, action);

    case 'ADD_FIELD':
      return Reducers.addField(state, action);

    case 'REMOVE_FIELD':
      return Reducers.removeField(state, action);

    case 'SET_FIELD_DATA':
      return Reducers.setFieldData(state, action);

    case 'SET_ERROR':
      return Reducers.setError(state, action);

    default: {
      return assertNever(action);
    }
  }
}
