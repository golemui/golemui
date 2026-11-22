import { describe, expect, it } from 'vitest';
import { type LayoutWidget } from '../form-widget';
import { assignDeterministicUids } from './deterministic-uids';

const makeRoot = (children: unknown[]): LayoutWidget<string> =>
  ({ kind: 'layout', type: 'flex', children }) as LayoutWidget<string>;

const collectUids = (widget: any): string[] => {
  const uids: string[] = typeof widget.uid === 'string' ? [widget.uid] : [];
  for (const child of widget.children ?? []) {
    uids.push(...collectUids(child));
  }
  if (widget.props?.template) {
    uids.push(...collectUids(widget.props.template));
  }
  return uids;
};

describe('assignDeterministicUids', () => {
  it('gives the root #0 and each child the position of its parent plus its index', () => {
    const root = makeRoot([
      { kind: 'display', type: 'heading' },
      makeRoot([{ kind: 'display', type: 'heading' }]),
    ]);

    assignDeterministicUids(root);

    expect(root.uid).toBe('#0');
    expect(collectUids(root)).toEqual(['#0', '#0.0', '#0.1', '#0.1.0']);
  });

  it('gives a repeater template the t segment', () => {
    const template = makeRoot([{ kind: 'display', type: 'heading' }]);
    const root = makeRoot([{ kind: 'input', type: 'repeater', path: 'rows', props: { template } }]);

    assignDeterministicUids(root);

    expect(collectUids(root)).toEqual(['#0', '#0.0', '#0.0.t', '#0.0.t.0']);
  });

  it('keeps the uids that the form definition already has', () => {
    const root = makeRoot([
      { uid: 'title', kind: 'display', type: 'heading' },
      { kind: 'display', type: 'heading' },
    ]);

    assignDeterministicUids(root);

    expect(collectUids(root)).toEqual(['#0', 'title', '#0.1']);
  });

  it('never writes a uid that ends with a bracketed number', () => {
    const template = makeRoot([makeRoot([{ kind: 'display', type: 'heading' }])]);
    const root = makeRoot([
      { kind: 'input', type: 'repeater', path: 'rows', props: { template } },
      makeRoot([{ kind: 'display', type: 'heading' }]),
    ]);

    assignDeterministicUids(root);

    for (const uid of collectUids(root)) {
      expect(uid).not.toMatch(/\[\d+\]/);
    }
  });
});
