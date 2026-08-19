import { type DotPath } from '../../shared';
import { type SET_WIDGET_DATA } from '../actions';
import { createInitialState } from '../model';
import { setWidgetData } from './set-widget-data';

const setData = (path: DotPath, data: any): SET_WIDGET_DATA => ({
  type: 'SET_WIDGET_DATA',
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

  it('writes the value at the path, creating the parents', () => {
    expect(setWidgetData(state, setData('a.b.c', 'hello'))).toHaveProperty('data.a.b.c', 'hello');
  });

  it('overwrites an existing value', () => {
    const first = setWidgetData(state, setData('a.b.c', 'hello'));
    expect(setWidgetData(first, setData('a.b.c', 'hello2'))).toHaveProperty('data.a.b.c', 'hello2');
  });
});
