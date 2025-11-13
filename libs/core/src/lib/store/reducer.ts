import { assertNever } from '../utils/assert-never';
import { pipe } from '../utils/pipe';
import { Action } from './actions';
import { State } from './model';
import * as Reducers from './reducers';

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INITIALIZE':
      return Reducers.initialize(state, action);

    case 'SET_DATA':
      return pipe(
        Reducers.setData(state, action),
        Reducers.calculateCurrentState,
        Reducers.applyCurrentState,
        Reducers.validateAll,
      );

    case 'ADD_FIELD':
      return pipe(
        Reducers.addField(state, action),
        Reducers.calculateCurrentState,
        Reducers.applyCurrentState,
        Reducers.validateAll,
      );

    case 'REMOVE_FIELD':
      return Reducers.removeField(state, action);

    case 'SET_FIELD_DATA':
      return pipe(
        Reducers.setFieldData(state, action),
        Reducers.calculateCurrentState,
        Reducers.applyCurrentState,
        Reducers.validateAll,
      );

    case 'OVERRIDE_FIELD_PROP':
      return pipe(
        Reducers.overrideFieldProp(state, action),
        Reducers.calculateCurrentState,
        Reducers.applyCurrentState,
        Reducers.validateAll,
      );

    case 'SET_ERROR':
      return Reducers.setError(state, action);

    case 'TOUCHED':
      return state.touched === false ? { ...state, touched: true } : state;

    default: {
      return assertNever(action);
    }
  }
}
