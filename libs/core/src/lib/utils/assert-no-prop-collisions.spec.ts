import { describe, expect, it } from 'vitest';
import { assertNoPropCollisions } from './assert-no-prop-collisions';

const widgetBase = {
  uid: '',
  kind: 'input',
  type: 'dropdown',
  path: 'some-path',
  label: '',
  props: {},
  validator: {},
};

describe('assertNoPropCollisions', () => {
  it('does not throw for typical widget props', () => {
    const props = { itemHeight: 30, hint: 'Pick one', items: [1, 2, 3] };
    expect(() =>
      assertNoPropCollisions('dropdown-widget', props, widgetBase),
    ).not.toThrow();
  });

  it('does not throw when props is undefined', () => {
    expect(() =>
      assertNoPropCollisions('dropdown-widget', undefined, widgetBase),
    ).not.toThrow();
  });

  it('does not throw when props is empty', () => {
    expect(() =>
      assertNoPropCollisions('dropdown-widget', {}, widgetBase),
    ).not.toThrow();
  });

  it('throws when props.uid collides with widget uid', () => {
    expect(() =>
      assertNoPropCollisions('dropdown-widget', { uid: 'my-uid' }, widgetBase),
    ).toThrow();
  });

  it('throws when props.kind collides with widget kind', () => {
    expect(() =>
      assertNoPropCollisions('dropdown-widget', { kind: 'action' }, widgetBase),
    ).toThrow();
  });

  it('throws when props.type collides with widget type', () => {
    expect(() =>
      assertNoPropCollisions('dropdown-widget', { type: 'textinput' }, widgetBase),
    ).toThrow();
  });

  it('throws when multiple props collide with widget fields', () => {
    const props = { uid: 'x', kind: 'action', itemHeight: 30 };
    expect(() =>
      assertNoPropCollisions('dropdown-widget', props, widgetBase),
    ).toThrow();
  });

  it('includes the widget uid in the error message', () => {
    expect(() =>
      assertNoPropCollisions('dropdown-widget', { uid: '' }, widgetBase),
    ).toThrow('dropdown-widget');
  });

  it('includes all colliding key names in the error message', () => {
    expect(() =>
      assertNoPropCollisions('w', { uid: '', kind: 'action' }, widgetBase),
    ).toThrow(/uid.*kind|kind.*uid/);
  });

  it('does not report non-colliding mixed props as errors', () => {
    const props = {
      height: 150,
      itemHeight: 60,
      valueField: 'value',
      itemRenderer: 'complexListItemRenderer',
      items: [{ value: 'one' }],
    };
    expect(() =>
      assertNoPropCollisions('complex-dropdown', props, widgetBase),
    ).not.toThrow();
  });
});
