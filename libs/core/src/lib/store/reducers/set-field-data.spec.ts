import { DotPath } from '../../shared';
import { SET_FIELD_DATA, SET_FIELD_INITIAL_DATA } from '../actions';
import { createInitialState } from '../model';
import { setFieldData } from './set-field-data';

const setData = (path: DotPath, data: any): SET_FIELD_DATA => ({
  type: 'SET_FIELD_DATA',
  payload: {
    path,
    data,
  },
});

const setInitialData = (path: DotPath, data: any): SET_FIELD_INITIAL_DATA => ({
  type: 'SET_FIELD_INITIAL_DATA',
  payload: {
    path,
    data,
  },
});

let state = createInitialState();

describe('setFieldData', () => {
  beforeEach(() => {
    state = createInitialState();
  });

  it('should set data initially', () => {
    const action = setInitialData('a.b.c', 'hello');
    expect(setFieldData(state, action)).toHaveProperty('data.a.b.c', 'hello');
  });

  it('should set data on top of the the default value', () => {
    const a1 = setInitialData('a.b.c', 'hello');
    expect(setFieldData(state, a1)).toHaveProperty('data.a.b.c', 'hello');
    const a2 = setData('a.b.c', 'hello2');
    expect(setFieldData(state, a2)).toHaveProperty('data.a.b.c', 'hello2');
  });

  it('should not set a default value on top of already present data', () => {
    const a1 = setData('a.b.c', 'hello');
    expect(setFieldData(state, a1)).toHaveProperty('data.a.b.c', 'hello');

    const a2 = setInitialData('a.b.c', 'BYE!!');
    expect(setFieldData(state, a2)).toHaveProperty('data.a.b.c', 'hello');
  });
});
