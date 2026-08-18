import { beforeEach, describe, expect, it } from 'vitest';
import { type FormWidget, type FunctionWidget } from '../../form-widget';
import { type ExpressionFunctions } from '../../shared';
import { createInitialState, type State } from '../model';
import { calculateWidgetFlags } from './calculate-widget-flags';
import { applyExpandSources } from './expand-sources';

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

// Flags read the maps built by the expand step, so run both, in pipeline order
const runFlagsPipeline = (state: State, functions: ExpressionFunctions = {}) =>
  calculateWidgetFlags(functions)(applyExpandSources(state));

describe('calculateWidgetFlags: $item / $index in item when conditions', () => {
  let state: State;

  beforeEach(() => {
    state = createInitialState('en-US');
  });

  it('evaluates include.when with $item per item', () => {
    state.flatForm = {
      lineItems: repeater('lineItems', 'lineItems', [
        displayChild('row-note', { include: { when: '$item.active === true' } }),
      ]),
    };
    state.data = { lineItems: [{ active: true }, { active: false }] };

    const next = runFlagsPipeline(state);

    expect(next.widgetFlags['row-note[0]'].hidden).toBe(false);
    expect(next.widgetFlags['row-note[1]'].hidden).toBe(true);
  });

  it('evaluates include.when with $index per item', () => {
    state.flatForm = {
      lineItems: repeater('lineItems', 'lineItems', [
        displayChild('row-note', { include: { when: '$index === 0' } }),
      ]),
    };
    state.data = { lineItems: [{}, {}] };

    const next = runFlagsPipeline(state);

    expect(next.widgetFlags['row-note[0]'].hidden).toBe(false);
    expect(next.widgetFlags['row-note[1]'].hidden).toBe(true);
  });

  it('evaluates exclude.when and disabled.when with $item', () => {
    state.flatForm = {
      lineItems: repeater('lineItems', 'lineItems', [
        displayChild('row-note', { exclude: { when: '$item.done === true' } }),
        {
          kind: 'input',
          uid: 'row-qty',
          type: 'number',
          path: 'lineItems.items.quantity',
          disabled: { when: '$item.locked === true' },
        },
      ]),
    };
    state.data = {
      lineItems: [
        { done: true, locked: false },
        { done: false, locked: true },
      ],
    };

    const next = runFlagsPipeline(state);

    expect(next.widgetFlags['row-note[0]'].hidden).toBe(true);
    expect(next.widgetFlags['row-note[1]'].hidden).toBe(false);
    expect(next.widgetFlags['row-qty[0]'].disabled).toBe(false);
    expect(next.widgetFlags['row-qty[1]'].disabled).toBe(true);
  });

  it('keeps the legacy items path token working alongside $item', () => {
    state.flatForm = {
      lineItems: repeater('lineItems', 'lineItems', [
        displayChild('row-note', {
          include: { when: '$form.lineItems.items.active === true' },
        }),
      ]),
    };
    state.data = { lineItems: [{ active: true }, { active: false }] };

    const next = runFlagsPipeline(state);

    expect(next.widgetFlags['row-note[0]'].hidden).toBe(false);
    expect(next.widgetFlags['row-note[1]'].hidden).toBe(true);
  });

  it('evaluates the include.when of a nested repeater container per outer item', () => {
    state.flatForm = {
      teams: repeater('teams', 'teams', [
        repeater('devs', 'teams.items.devs', [displayChild('dev-name')]),
      ]),
    };
    (state.flatForm['teams'] as any).props.template.children[0].include = {
      when: '$item.showDevs === true',
    };
    state.data = {
      teams: [
        { showDevs: true, devs: [{}] },
        { showDevs: false, devs: [{}] },
      ],
    };

    const next = runFlagsPipeline(state);

    expect(next.widgetFlags['devs[0]']).toEqual({ hidden: false });
    expect(next.widgetFlags['devs[1]']).toEqual({ hidden: true });
  });

  it('resolves a row function widget with $item and $index before reading its flags', () => {
    const rowNote: FunctionWidget<string> = (api) =>
      ({
        kind: 'display',
        type: 'markdownText',
        props: {},
        include: { when: `${api?.$index} === 0 || ${(api?.$item as { flag?: boolean })?.flag}` },
      }) as never;
    rowNote.uid = 'row-note' as never;
    state.flatForm = {
      lineItems: repeater('lineItems', 'lineItems', [rowNote]),
    };
    state.data = { lineItems: [{ flag: false }, { flag: true }, { flag: false }] };

    const next = runFlagsPipeline(state);

    expect(next.widgetFlags['row-note[0]']).toEqual({ hidden: false });
    expect(next.widgetFlags['row-note[1]']).toEqual({ hidden: false });
    expect(next.widgetFlags['row-note[2]']).toEqual({ hidden: true });
  });

  it('creates no flag entry for repeater item widgets without reactive flags', () => {
    state.flatForm = {
      lineItems: repeater('lineItems', 'lineItems', [displayChild('row-note')]),
    };
    state.data = { lineItems: [{}, {}] };

    const next = runFlagsPipeline(state);

    expect(next.widgetFlags['row-note[0]']).toBeUndefined();
    expect(next.widgetFlags['row-note[1]']).toBeUndefined();
  });
});

describe('calculateWidgetFlags: $fn in when conditions', () => {
  let state: State;

  const functions: ExpressionFunctions = {
    hasItems: (items: unknown[] | undefined) => (items?.length ?? 0) > 0,
    isEven: (value: number) => value % 2 === 0,
  };

  beforeEach(() => {
    state = createInitialState('en-US');
  });

  it('evaluates include.when with a $fn call outside a repeater', () => {
    state.flatForm = {
      summary: displayChild('summary', { include: { when: '$fn.hasItems($form.items)' } }),
    };
    state.data = { items: [] };

    expect(runFlagsPipeline(state, functions).widgetFlags['summary'].hidden).toBe(true);

    state.data = { items: [1] };

    expect(runFlagsPipeline(state, functions).widgetFlags['summary'].hidden).toBe(false);
  });

  it('evaluates include.when combining $fn with $item inside a repeater template', () => {
    state.flatForm = {
      lineItems: repeater('lineItems', 'lineItems', [
        displayChild('row-note', { include: { when: '$fn.isEven($item.quantity)' } }),
      ]),
    };
    state.data = { lineItems: [{ quantity: 2 }, { quantity: 3 }] };

    const next = runFlagsPipeline(state, functions);

    expect(next.widgetFlags['row-note[0]'].hidden).toBe(false);
    expect(next.widgetFlags['row-note[1]'].hidden).toBe(true);
  });
});
