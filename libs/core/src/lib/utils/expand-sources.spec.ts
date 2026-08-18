import { describe, expect, it } from 'vitest';
import {
  type FormWidget,
  type FunctionWidget,
  type InputWidget,
  isFunctionWidget,
} from '../form-widget';
import { type State } from '../store/model';
import { expandSources } from './repeater';

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

const repeater = (uid: string, path: string, children: unknown[], templateUid?: string) =>
  ({
    kind: 'input',
    uid,
    type: 'repeater',
    path,
    props: {
      template: {
        kind: 'layout',
        uid: templateUid ?? `${uid}-template`,
        type: 'flex',
        children,
      },
    },
  }) as unknown as FormWidget<string>;

const flatFormOf = (...widgets: FormWidget<string>[]): State['flatForm'] =>
  Object.fromEntries(widgets.map((widget) => [widget.uid as string, widget]));

const pathOf = (widget: FormWidget<string> | undefined) =>
  (widget as InputWidget<any, string> | undefined)?.path;

describe('expandSources: top-level widgets', () => {
  it('copies every flatForm widget by reference', () => {
    const firstName = inputChild('firstName', 'firstName');
    const note = displayChild('note');
    const flatForm = flatFormOf(firstName, note);

    const { resolvedSources, repeaterItemScopes } = expandSources(flatForm, {});

    expect(resolvedSources['firstName']).toBe(firstName);
    expect(resolvedSources['note']).toBe(note);
    expect(Object.keys(resolvedSources)).toEqual(['firstName', 'note']);
    expect(repeaterItemScopes).toEqual({});
  });

  it('keeps a top-level function widget callable and by reference', () => {
    const fn: FunctionWidget<string> = () => displayChild('fn') as never;
    fn.uid = 'fn' as never;

    const { resolvedSources } = expandSources(flatFormOf(fn), {});

    expect(resolvedSources['fn']).toBe(fn);
  });
});

describe('expandSources: repeater rows', () => {
  it('produces one subtree per row, the row layout node included', () => {
    const lineItems = repeater('lineItems', 'lineItems', [displayChild('row-note')]);

    const { resolvedSources, repeaterItemScopes } = expandSources(flatFormOf(lineItems), {
      lineItems: [{ active: true }, { active: false }],
    });

    expect(Object.keys(resolvedSources).sort()).toEqual([
      'lineItems',
      'lineItems-template[0]',
      'lineItems-template[1]',
      'row-note[0]',
      'row-note[1]',
    ]);
    expect(resolvedSources['lineItems']).toBe(lineItems);
    expect(repeaterItemScopes['row-note[0]']).toEqual({ itemPath: 'lineItems.0', index: 0 });
    expect(repeaterItemScopes['row-note[1]']).toEqual({ itemPath: 'lineItems.1', index: 1 });
    expect(repeaterItemScopes['lineItems-template[0]']).toEqual({
      itemPath: 'lineItems.0',
      index: 0,
    });
    // The repeater itself is not owned by any row.
    expect(repeaterItemScopes['lineItems']).toBeUndefined();
  });

  it('writes the row index into uid and input path', () => {
    const lineItems = repeater('lineItems', 'lineItems', [
      inputChild('row-qty', 'lineItems.items.quantity'),
    ]);

    const { resolvedSources } = expandSources(flatFormOf(lineItems), { lineItems: [{}, {}] });

    expect(resolvedSources['row-qty[0]']).toMatchObject({
      uid: 'row-qty[0]',
      path: 'lineItems.0.quantity',
    });
    expect(resolvedSources['row-qty[1]']).toMatchObject({
      uid: 'row-qty[1]',
      path: 'lineItems.1.quantity',
    });
  });

  it('does not rewrite legacy items tokens in when expressions', () => {
    const lineItems = repeater('lineItems', 'lineItems', [
      displayChild('row-note', { include: { when: '$form.lineItems.items.active === true' } }),
    ]);

    const { resolvedSources } = expandSources(flatFormOf(lineItems), { lineItems: [{}] });

    // The flags stage rewrites the expression at evaluation time.
    expect(resolvedSources['row-note[0]']).toMatchObject({
      include: { when: '$form.lineItems.items.active === true' },
    });
  });

  it.each([
    ['missing', {}],
    ['empty', { lineItems: [] }],
    ['not an array', { lineItems: { active: true } }],
  ])('produces no rows when the repeater data is %s', (_, data) => {
    const lineItems = repeater('lineItems', 'lineItems', [displayChild('row-note')]);

    const { resolvedSources, repeaterItemScopes } = expandSources(flatFormOf(lineItems), data);

    expect(Object.keys(resolvedSources)).toEqual(['lineItems']);
    expect(repeaterItemScopes).toEqual({});
  });

  it('rebuilds both maps from the data on every call', () => {
    const lineItems = repeater('lineItems', 'lineItems', [displayChild('row-note')]);
    const flatForm = flatFormOf(lineItems);

    const twoRows = expandSources(flatForm, { lineItems: [{}, {}] });
    const oneRow = expandSources(flatForm, { lineItems: [{}] });
    const threeRows = expandSources(flatForm, { lineItems: [{}, {}, {}] });

    expect(twoRows.resolvedSources).toHaveProperty('row-note[1]');
    expect(oneRow.resolvedSources).not.toHaveProperty('row-note[1]');
    expect(oneRow.repeaterItemScopes).not.toHaveProperty('row-note[1]');
    expect(threeRows.resolvedSources).toHaveProperty('row-note[2]');
    expect(threeRows.repeaterItemScopes['row-note[2]']).toEqual({
      itemPath: 'lineItems.2',
      index: 2,
    });
  });

  it('keeps a row function widget callable with concrete uid and path', () => {
    const rowName: FunctionWidget<string> = (api) =>
      ({
        kind: 'input',
        type: 'text',
        path: 'users.items.name',
        props: { seen: `${api?.$index}:${(api?.$item as { name?: string } | undefined)?.name}` },
      }) as never;
    rowName.uid = 'rowName' as never;
    rowName.path = 'users.items.name';
    const users = repeater('users', 'users', [rowName]);

    const { resolvedSources, repeaterItemScopes } = expandSources(flatFormOf(users), {
      users: [{ name: 'Ada' }, { name: 'Linus' }],
    });

    const second = resolvedSources['rowName[1]'];
    expect(isFunctionWidget(second)).toBe(true);
    expect(second.uid).toBe('rowName[1]');
    expect(pathOf(second)).toBe('users.1.name');
    expect(repeaterItemScopes['rowName[1]']).toEqual({ itemPath: 'users.1', index: 1 });
    // Not pre-resolved: whoever reads it calls it with the item in scope.
    const resolved = (second as FunctionWidget<string>)({
      $form: {},
      $item: { name: 'Linus' },
      $index: 1,
      errors: undefined,
      touched: undefined,
      translate: undefined,
    });
    expect(resolved.props?.['seen']).toBe('1:Linus');
  });

  it('indexes position uids the same way as authored uids', () => {
    const lineItems = repeater('#0.2', 'lineItems', [displayChild('#0.2.t.1')], '#0.2.t');

    const { resolvedSources, repeaterItemScopes } = expandSources(flatFormOf(lineItems), {
      lineItems: [{}],
    });

    expect(Object.keys(resolvedSources).sort()).toEqual(['#0.2', '#0.2.t.1[0]', '#0.2.t[0]']);
    expect(repeaterItemScopes['#0.2.t.1[0]']).toEqual({ itemPath: 'lineItems.0', index: 0 });
  });
});

describe('expandSources: nested repeaters', () => {
  const teams = repeater('teams', 'teams', [
    repeater('devs', 'teams.items.devs', [inputChild('dev-name', 'teams.items.devs.items.name')]),
  ]);
  const data = {
    teams: [{ devs: [] }, { devs: [{}] }, { devs: [{ name: 'Alice' }, { name: 'Bob' }] }],
  };

  it('adds the nested container with a concrete path and the outer item scope', () => {
    const { resolvedSources, repeaterItemScopes } = expandSources(flatFormOf(teams), data);

    expect(resolvedSources['devs[2]']).toMatchObject({ uid: 'devs[2]', type: 'repeater' });
    expect(pathOf(resolvedSources['devs[2]'])).toBe('teams.2.devs');
    expect(repeaterItemScopes['devs[2]']).toEqual({ itemPath: 'teams.2', index: 2 });
  });

  it('recurses into the nested rows with both indexes and the innermost item scope', () => {
    const { resolvedSources, repeaterItemScopes } = expandSources(flatFormOf(teams), data);

    expect(pathOf(resolvedSources['dev-name[2][0]'])).toBe('teams.2.devs.0.name');
    expect(pathOf(resolvedSources['dev-name[2][1]'])).toBe('teams.2.devs.1.name');
    expect(resolvedSources).toHaveProperty('devs-template[2][1]');
    expect(repeaterItemScopes['dev-name[2][1]']).toEqual({ itemPath: 'teams.2.devs.1', index: 1 });
    expect(repeaterItemScopes['devs-template[2][0]']).toEqual({
      itemPath: 'teams.2.devs.0',
      index: 0,
    });
    // An outer row without inner rows only gets its own subtree.
    expect(resolvedSources).toHaveProperty('devs[0]');
    expect(resolvedSources).not.toHaveProperty('dev-name[0][0]');
    expect(pathOf(resolvedSources['dev-name[1][0]'])).toBe('teams.1.devs.0.name');
  });

  it('recurses into a nested repeater produced by a row function widget', () => {
    const devsFn: FunctionWidget<string> = () =>
      repeater('devs', 'teams.items.devs', [
        inputChild('dev-name', 'teams.items.devs.items.name'),
      ]) as never;
    devsFn.uid = 'devs' as never;
    const teamsWithFn = repeater('teams', 'teams', [devsFn]);

    const { resolvedSources, repeaterItemScopes } = expandSources(flatFormOf(teamsWithFn), data);

    // The container entry is the callable wrapper, its rows are expanded from the resolved repeater.
    expect(isFunctionWidget(resolvedSources['devs[2]'])).toBe(true);
    expect(pathOf(resolvedSources['dev-name[2][1]'])).toBe('teams.2.devs.1.name');
    expect(repeaterItemScopes['dev-name[2][1]']).toEqual({ itemPath: 'teams.2.devs.1', index: 1 });
  });
});
