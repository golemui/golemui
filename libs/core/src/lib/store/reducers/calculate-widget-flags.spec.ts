import { beforeEach, describe, expect, it } from 'vitest';
import { type FormWidget } from '../../form-widget';
import { createInitialState, type State } from '../model';
import { calculateWidgetFlags } from './calculate-widget-flags';
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

// Flags read the maps built by the materialization stage, so run both, in pipeline order
const runFlagsPipeline = (state: State) => calculateWidgetFlags(materializeRepeaterItems(state));

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
