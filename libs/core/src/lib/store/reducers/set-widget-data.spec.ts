import { DotPath } from '../../shared';
import { SET_WIDGET_DATA, SET_WIDGET_INITIAL_DATA } from '../actions';
import { createInitialState } from '../model';
import { setWidgetData } from './set-widget-data';

const setData = (path: DotPath, data: any): SET_WIDGET_DATA => ({
  type: 'SET_WIDGET_DATA',
  payload: {
    path,
    data,
  },
});

const setInitialData = (path: DotPath, data: any): SET_WIDGET_INITIAL_DATA => ({
  type: 'SET_WIDGET_INITIAL_DATA',
  payload: {
    path,
    data,
  },
});

let state = createInitialState('en-US');

describe('setWidgetData', () => {
  beforeEach(() => {
    state = createInitialState('en-US');
  });

  it('should set data initially', () => {
    const action = setInitialData('a.b.c', 'hello');
    expect(setWidgetData(state, action)).toHaveProperty('data.a.b.c', 'hello');
  });

  it('should set data on top of the the default value', () => {
    const a1 = setInitialData('a.b.c', 'hello');
    expect(setWidgetData(state, a1)).toHaveProperty('data.a.b.c', 'hello');
    const a2 = setData('a.b.c', 'hello2');
    expect(setWidgetData(state, a2)).toHaveProperty('data.a.b.c', 'hello2');
  });

  it('should not set a default value on top of already present data', () => {
    const a1 = setData('a.b.c', 'hello');
    expect(setWidgetData(state, a1)).toHaveProperty('data.a.b.c', 'hello');

    const a2 = setInitialData('a.b.c', 'BYE!!');
    expect(setWidgetData(state, a2)).toHaveProperty('data.a.b.c', 'hello');
  });
});
