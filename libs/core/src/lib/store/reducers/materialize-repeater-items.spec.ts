import { beforeEach, describe, expect, it } from 'vitest';
import { type FormWidget, type FunctionWidget } from '../../form-widget';
import { createInitialState, type State } from '../model';
import { materializeRepeaterItems } from './materialize-repeater-items';

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

const displayChild = (uid: string, extra: Record<string, unknown> = {}) =>
  ({
    kind: 'display',
    uid,
    type: 'markdownText',
    props: {},
    ...extra,
  }) as unknown as FormWidget<string>;

const inputChild = (uid: string, path: string, extra: Record<string, unknown> = {}) =>
  ({
    kind: 'input',
    uid,
    type: 'number',
    path,
    props: {},
    ...extra,
  }) as unknown as FormWidget<string>;

const repeater = (uid: string, path: string, children: unknown[]) =>
  ({
    kind: 'input',
    uid,
    type: 'repeater',
    path,
    props: {
      template: {
        kind: 'layout',
        uid: `${uid}-template`,
        type: 'flex',
        children,
      },
    },
  }) as unknown as FormWidget<string>;

describe('materializeRepeaterItems: repeater item scopes', () => {
  let state: State;

  beforeEach(() => {
    state = createInitialState('en-US');
  });

  it('builds a scope entry for every template descendant of every item', () => {
    state.flatForm = {
      lineItems: repeater('lineItems', 'lineItems', [displayChild('row-note')]),
    };
    state.data = { lineItems: [{ active: true }, { active: false }] };

    const next = materializeRepeaterItems(state);

    expect(next.repeaterItemScopes['row-note[0]']).toEqual({
      itemPath: 'lineItems.0',
      index: 0,
    });
    expect(next.repeaterItemScopes['row-note[1]']).toEqual({
      itemPath: 'lineItems.1',
      index: 1,
    });
    // The template root layout is a descendant too.
    expect(next.repeaterItemScopes['lineItems-template[0]']).toEqual({
      itemPath: 'lineItems.0',
      index: 0,
    });
  });

  it('gives nested repeater descendants the innermost item scope', () => {
    state.flatForm = {
      teams: repeater('teams', 'teams', [
        repeater('devs', 'teams.items.devs', [displayChild('dev-name')]),
      ]),
    };
    state.data = {
      teams: [{ devs: [{ firstName: 'Alice' }, { firstName: 'Bob' }] }],
    };

    const next = materializeRepeaterItems(state);

    // The nested repeater widget itself belongs to the outer item
    expect(next.repeaterItemScopes['devs[0]']).toEqual({ itemPath: 'teams.0', index: 0 });
    // Its template descendants belong to the inner items
    expect(next.repeaterItemScopes['dev-name[0][0]']).toEqual({
      itemPath: 'teams.0.devs.0',
      index: 0,
    });
    expect(next.repeaterItemScopes['dev-name[0][1]']).toEqual({
      itemPath: 'teams.0.devs.1',
      index: 1,
    });
  });

  it('produces an empty scope map when the repeater data is not an array', () => {
    state.flatForm = {
      lineItems: repeater('lineItems', 'lineItems', [displayChild('row-note')]),
    };
    state.data = {};

    const next = materializeRepeaterItems(state);

    expect(next.repeaterItemScopes).toEqual({});
    expect(next.materializedRepeaterWidgets).toEqual({});
  });

  it('rebuilds both maps from scratch on every run', () => {
    state.flatForm = {
      lineItems: repeater('lineItems', 'lineItems', [displayChild('row-note')]),
    };
    state.data = { lineItems: [{}, {}] };
    state.repeaterItemScopes = {
      'stale[9]': { itemPath: 'lineItems.9', index: 9 },
    };
    state.materializedRepeaterWidgets = {
      'stale[9]': displayChild('stale[9]') as never,
    };

    const next = materializeRepeaterItems(state);

    expect(next.repeaterItemScopes['stale[9]']).toBeUndefined();
    expect(next.materializedRepeaterWidgets['stale[9]']).toBeUndefined();
    expect(next.repeaterItemScopes['row-note[0]']).toBeDefined();
    expect(next.repeaterItemScopes['row-note[1]']).toBeDefined();
  });
});

describe('materializeRepeaterItems: materialized widgets', () => {
  let state: State;

  beforeEach(() => {
    state = createInitialState('en-US');
  });

  it('bakes the item indexes into uid and input path', () => {
    state.flatForm = {
      lineItems: repeater('lineItems', 'lineItems', [
        inputChild('row-qty', 'lineItems.items.quantity'),
      ]),
    };
    state.data = { lineItems: [{}, {}] };

    const next = materializeRepeaterItems(state);

    expect(next.materializedRepeaterWidgets['row-qty[0]']).toMatchObject({
      uid: 'row-qty[0]',
      path: 'lineItems.0.quantity',
    });
    expect(next.materializedRepeaterWidgets['row-qty[1]']).toMatchObject({
      uid: 'row-qty[1]',
      path: 'lineItems.1.quantity',
    });
  });

  it('rewrites items path tokens in when expressions per item', () => {
    state.flatForm = {
      lineItems: repeater('lineItems', 'lineItems', [
        displayChild('row-note', {
          include: { when: '$form.lineItems.items.active === true' },
        }),
      ]),
    };
    state.data = { lineItems: [{}, {}] };

    const next = materializeRepeaterItems(state);

    expect(next.materializedRepeaterWidgets['row-note[0]']).toMatchObject({
      include: { when: '$form.lineItems.0.active === true' },
    });
    expect(next.materializedRepeaterWidgets['row-note[1]']).toMatchObject({
      include: { when: '$form.lineItems.1.active === true' },
    });
  });

  it('resolves function widgets once per item with $item and $index', () => {
    const functionWidget: FunctionWidget<string> = (api) =>
      ({
        kind: 'display',
        type: 'markdownText',
        props: { md: `${api?.$index}:${(api?.$item as { name: string } | undefined)?.name}` },
      }) as never;
    functionWidget.uid = 'row-note' as never;
    state.flatForm = {
      lineItems: repeater('lineItems', 'lineItems', [functionWidget]),
    };
    state.data = { lineItems: [{ name: 'a' }, { name: 'b' }] };

    const next = materializeRepeaterItems(state);

    expect(next.materializedRepeaterWidgets['row-note[0]']).toMatchObject({
      uid: 'row-note[0]',
      props: { md: '0:a' },
    });
    expect(next.materializedRepeaterWidgets['row-note[1]']).toMatchObject({
      uid: 'row-note[1]',
      props: { md: '1:b' },
    });
  });

  it('keeps nested repeater containers out of the widget map but in the scope map', () => {
    state.flatForm = {
      teams: repeater('teams', 'teams', [
        repeater('devs', 'teams.items.devs', [displayChild('dev-name')]),
      ]),
    };
    state.data = { teams: [{ devs: [{}] }] };

    const next = materializeRepeaterItems(state);

    expect(next.repeaterItemScopes['devs[0]']).toBeDefined();
    expect(next.materializedRepeaterWidgets['devs[0]']).toBeUndefined();
    expect(next.materializedRepeaterWidgets['dev-name[0][0]']).toBeDefined();
  });
});
