import { beforeEach, describe, expect, it } from 'vitest';
import { type FormWidget, type FunctionWidget } from '../../form-widget';
import { createInitialState, type State } from '../model';
import { dropRemovedWidgetEntries } from './drop-removed-widget-entries';

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

const displayChild = (uid: string) =>
  ({
    kind: 'display',
    uid,
    type: 'markdownText',
    props: {},
  }) as unknown as FormWidget<string>;

const functionInput = (uid: string, path: string) => {
  const widget: FunctionWidget<string> = () => inputChild(uid, path) as any;
  widget.uid = uid;
  widget.path = path;
  return widget as unknown as FormWidget<string>;
};

const sourcesOf = (...widgets: FormWidget<string>[]): State['resolvedSources'] =>
  Object.fromEntries(widgets.map((widget) => [widget.uid as string, widget]));

describe('dropRemovedWidgetEntries', () => {
  let state: State;

  beforeEach(() => {
    state = createInitialState('en-US');
  });

  it('drops the prop override of a uid that is gone', () => {
    state.resolvedSources = sourcesOf(inputChild('name[0]', 'users.0.name'));
    state.widgetPropOverrides = {
      'name[0]': { label: 'First' },
      'name[1]': { label: 'Second' },
    };

    const result = dropRemovedWidgetEntries(state);

    expect(Object.keys(result.widgetPropOverrides)).toEqual(['name[0]']);
    expect(result.widgetPropOverrides['name[0]']).toBe(state.widgetPropOverrides['name[0]']);
  });

  it('drops the touched, validation and injected entries of a path that is gone', () => {
    state.resolvedSources = sourcesOf(inputChild('name[0]', 'users.0.name'));
    state.touchedControls = { 'users.0.name': true, 'users.1.name': true };
    state.validations = { 'users.0.name': null, 'users.1.name': ['Required'] };
    state.injectedValidations = { 'users.0.name': null, 'users.1.name': ['Taken'] };

    const result = dropRemovedWidgetEntries(state);

    expect(result.touchedControls).toEqual({ 'users.0.name': true });
    expect(result.validations).toEqual({ 'users.0.name': null });
    expect(result.injectedValidations).toEqual({ 'users.0.name': null });
  });

  it('counts the path of a function widget as live', () => {
    state.resolvedSources = sourcesOf(functionInput('note[0]', 'users.0.note'));
    state.touchedControls = { 'users.0.note': true, 'users.1.note': true };

    const result = dropRemovedWidgetEntries(state);

    expect(result.touchedControls).toEqual({ 'users.0.note': true });
  });

  it('keeps every entry of a widget that is still there, whatever its flags say', () => {
    const bio = inputChild('bio', 'bio');
    state.resolvedSources = sourcesOf(bio, displayChild('note'));
    state.widgetFlags = { bio: { hidden: true } };
    state.touchedControls = { bio: true };
    state.widgetPropOverrides = { bio: { label: 'Bio' } };

    const result = dropRemovedWidgetEntries(state);

    expect(result).toBe(state);
    expect(result.touchedControls).toBe(state.touchedControls);
    expect(result.widgetPropOverrides).toBe(state.widgetPropOverrides);
  });

  it('returns the same state and the same records when nothing was removed', () => {
    state.resolvedSources = sourcesOf(inputChild('firstName', 'firstName'));
    state.touchedControls = { firstName: true };
    state.validations = { firstName: null };
    state.injectedValidations = { firstName: null };
    state.widgetPropOverrides = { firstName: { label: 'First' } };

    const result = dropRemovedWidgetEntries(state);

    expect(result).toBe(state);
    expect(result.validations).toBe(state.validations);
    expect(result.injectedValidations).toBe(state.injectedValidations);
  });

  it('keeps the records that did not lose an entry by reference', () => {
    state.resolvedSources = sourcesOf(inputChild('name[0]', 'users.0.name'));
    state.touchedControls = { 'users.0.name': true };
    state.widgetPropOverrides = { 'name[0]': {}, 'name[1]': {} };

    const result = dropRemovedWidgetEntries(state);

    expect(result).not.toBe(state);
    expect(result.touchedControls).toBe(state.touchedControls);
    expect(result.widgetPropOverrides).not.toBe(state.widgetPropOverrides);
  });
});
