import { beforeEach, describe, expect, it } from 'vitest';
import { type FormWidget, type NonFunctionWidget } from '../../form-widget';
import { createInitialState, type State } from '../model';
import { fillCalculatedWidgets } from './fill-calculated-widgets';

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

const inputChild = (uid: string, path: string) =>
  ({
    kind: 'input',
    uid,
    type: 'text',
    path,
    props: {},
  }) as unknown as FormWidget<string>;

const sourcesOf = (...widgets: FormWidget<string>[]): State['resolvedSources'] =>
  Object.fromEntries(widgets.map((widget) => [widget.uid as string, widget]));

const derived = (widget: FormWidget<string>): State['calculatedWidgets'][string] => ({
  source: widget,
  current: { ...(widget as NonFunctionWidget<string>) },
});

describe('fillCalculatedWidgets', () => {
  let state: State;

  beforeEach(() => {
    state = createInitialState('en-US');
  });

  it('seeds an entry with an empty current for every widget, hidden ones included', () => {
    const firstName = inputChild('firstName', 'firstName');
    const bio = inputChild('bio', 'bio');
    state.resolvedSources = sourcesOf(firstName, bio);
    state.widgetFlags = { bio: { hidden: true } };

    const result = fillCalculatedWidgets(state);

    expect(Object.keys(result.calculatedWidgets)).toEqual(['firstName', 'bio']);
    expect(result.calculatedWidgets['bio']).toEqual({ source: bio, current: {} });
    expect(result.calculatedWidgets['firstName'].source).toBe(firstName);
  });

  it('keeps an existing entry by reference', () => {
    const firstName = inputChild('firstName', 'firstName');
    const lastName = inputChild('lastName', 'lastName');
    state.resolvedSources = sourcesOf(firstName, lastName);
    state.calculatedWidgets = { firstName: derived(firstName) };

    const result = fillCalculatedWidgets(state);

    expect(result.calculatedWidgets['firstName']).toBe(state.calculatedWidgets['firstName']);
    expect(result.calculatedWidgets['lastName'].current).toEqual({});
  });

  it('drops an entry whose widget is gone', () => {
    const name0 = inputChild('name[0]', 'users.0.name');
    const name1 = inputChild('name[1]', 'users.1.name');
    state.resolvedSources = sourcesOf(name0);
    state.calculatedWidgets = { 'name[0]': derived(name0), 'name[1]': derived(name1) };

    const result = fillCalculatedWidgets(state);

    expect(Object.keys(result.calculatedWidgets)).toEqual(['name[0]']);
  });

  it('returns the same state when every widget already has an entry', () => {
    const firstName = inputChild('firstName', 'firstName');
    state.resolvedSources = sourcesOf(firstName);
    state.calculatedWidgets = { firstName: derived(firstName) };

    const result = fillCalculatedWidgets(state);

    expect(result).toBe(state);
  });

  it('replaces an entry that was dropped and re-added, without reusing the old one', () => {
    const name0 = inputChild('name[0]', 'users.0.name');
    state.resolvedSources = sourcesOf(name0);
    state.calculatedWidgets = { 'name[1]': derived(inputChild('name[1]', 'users.1.name')) };

    const result = fillCalculatedWidgets(state);

    expect(Object.keys(result.calculatedWidgets)).toEqual(['name[0]']);
    expect(result.calculatedWidgets['name[0]']).toEqual({ source: name0, current: {} });
  });
});
