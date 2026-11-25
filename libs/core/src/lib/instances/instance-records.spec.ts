import { describe, expect, it } from 'vitest';
import { compileForm } from '../compile/compile-form';
import { type CompiledWidget } from '../compile/compiled-form';
import { formDefDecoder } from '../form';
import { buildWidgetInstances } from './build-instances';
import { computeWidgetFlags } from './compute-flags';
import {
  flagsRecordOfInstances,
  type InstanceRecords,
  recordsOfInstances,
} from './instance-records';
import { emptyWidgetInstanceTree } from './widget-instance';

/**
 * The four records of the state that are written from the widget instances: the source of
 * every widget, for a row widget its row and the rows around it, and the flags.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/instances/instance-records.spec.ts
 */

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

const compile = (form: unknown[]): CompiledWidget => {
  const formDef = formDefDecoder.parse({
    form: { uid: '', kind: 'layout', type: 'grid', children: form },
  });
  const root = compileForm(formDef, 'warn').root;
  if (root === undefined) {
    throw new Error('The form has no compiled root');
  }
  return root;
};

const recordsFor = (compiledRoot: CompiledWidget, data: Record<string, unknown>): InstanceRecords =>
  recordsOfInstances(
    buildWidgetInstances(compiledRoot, data, emptyWidgetInstanceTree()),
    compiledRoot,
  );

const textInput = (uid: string, path: string) => ({ uid, kind: 'input', type: 'textinput', path });

const repeater = (uid: string, path: string, rowUid: string, rowWidgets: unknown[]) => ({
  uid,
  kind: 'input',
  type: 'repeater',
  path,
  props: { template: { uid: rowUid, kind: 'layout', type: 'flex', children: rowWidgets } },
});

const teamsForm = () =>
  compile([
    { uid: 'title', kind: 'display', type: 'heading' },
    repeater('teams', 'teams', 'team', [
      textInput('teamName', 'teams.items.name'),
      repeater('devs', 'teams.items.devs', 'dev', [
        textInput('devName', 'teams.items.devs.items.name'),
      ]),
    ]),
    { uid: 'save', kind: 'action', type: 'button' },
  ]);

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('recordsOfInstances', () => {
  it('gives empty records for a tree without instances', () => {
    expect(recordsOfInstances(emptyWidgetInstanceTree(), undefined)).toEqual({
      resolvedSources: {},
      repeaterItemScopes: {},
      repeaterRows: {},
      widgetFlags: {},
    });
  });

  it('lists the source of every instance by its uid, in the order of the document', () => {
    const compiledRoot = teamsForm();
    const tree = buildWidgetInstances(
      compiledRoot,
      { teams: [{ devs: [{}] }, { devs: [] }] },
      emptyWidgetInstanceTree(),
    );

    const { resolvedSources } = recordsOfInstances(tree, compiledRoot);

    expect(Object.keys(resolvedSources)).toEqual([
      '#0',
      'title',
      'teams',
      'team[0]',
      'teamName[0]',
      'devs[0]',
      'dev[0][0]',
      'devName[0][0]',
      'team[1]',
      'teamName[1]',
      'devs[1]',
      'save',
    ]);
    expect(resolvedSources['title']).toBe(tree.root?.children[0].source);
    expect(resolvedSources['team[1]']).toBe(tree.root?.children[1].rows[1].source);
    expect(resolvedSources['devName[0][0]']).toMatchObject({
      uid: 'devName[0][0]',
      path: 'teams.0.devs.0.name',
    });
  });

  it('gives a widget outside a repeater an entry only in the record of the sources', () => {
    const { resolvedSources, repeaterItemScopes, repeaterRows } = recordsFor(teamsForm(), {
      teams: [{ devs: [] }],
    });

    for (const uid of ['#0', 'title', 'teams', 'save']) {
      expect(resolvedSources).toHaveProperty([uid]);
      expect(repeaterItemScopes).not.toHaveProperty([uid]);
      expect(repeaterRows).not.toHaveProperty([uid]);
    }
  });

  it('gives a row widget the path and the index of its innermost row', () => {
    const { repeaterItemScopes } = recordsFor(teamsForm(), {
      teams: [{ devs: [] }, { devs: [{}, {}] }],
    });

    expect(repeaterItemScopes['team[1]']).toEqual({ itemPath: 'teams.1', index: 1 });
    expect(repeaterItemScopes['teamName[1]']).toEqual({ itemPath: 'teams.1', index: 1 });
    expect(repeaterItemScopes['devs[1]']).toEqual({ itemPath: 'teams.1', index: 1 });
    expect(repeaterItemScopes['dev[1][1]']).toEqual({ itemPath: 'teams.1.devs.1', index: 1 });
    expect(repeaterItemScopes['devName[1][0]']).toEqual({ itemPath: 'teams.1.devs.0', index: 0 });
  });

  it('lists the rows around a row widget, the outermost first, each with its declared path', () => {
    const { repeaterRows } = recordsFor(teamsForm(), { teams: [{ devs: [] }, { devs: [{}, {}] }] });

    expect(repeaterRows['teamName[1]']).toEqual([
      { declaredItemPath: 'teams.items', itemPath: 'teams.1', index: 1 },
    ]);
    expect(repeaterRows['devName[1][1]']).toEqual([
      { declaredItemPath: 'teams.items', itemPath: 'teams.1', index: 1 },
      { declaredItemPath: 'teams.items.devs.items', itemPath: 'teams.1.devs.1', index: 1 },
    ]);
  });

  it('takes the index of a row from the array and not from its position in the list of rows', () => {
    const teams: unknown[] = [];
    teams[2] = { devs: [] };

    const { repeaterItemScopes, repeaterRows } = recordsFor(teamsForm(), { teams });

    expect(repeaterItemScopes['team[2]']).toEqual({ itemPath: 'teams.2', index: 2 });
    expect(repeaterRows['teamName[2]']).toEqual([
      { declaredItemPath: 'teams.items', itemPath: 'teams.2', index: 2 },
    ]);
  });

  it('writes the same keys in the three records for the row widgets, in the same order', () => {
    const { resolvedSources, repeaterItemScopes, repeaterRows } = recordsFor(teamsForm(), {
      teams: [{ devs: [{}] }, { devs: [{}] }],
    });

    const rowUids = Object.keys(resolvedSources).filter((uid) => uid.includes('['));
    expect(Object.keys(repeaterItemScopes)).toEqual(rowUids);
    expect(Object.keys(repeaterRows)).toEqual(rowUids);
  });

  it('writes new records on each call', () => {
    const compiledRoot = teamsForm();
    const tree = buildWidgetInstances(compiledRoot, { teams: [{}] }, emptyWidgetInstanceTree());

    const first = recordsOfInstances(tree, compiledRoot);
    const second = recordsOfInstances(tree, compiledRoot);

    expect(second).toEqual(first);
    expect(second.resolvedSources).not.toBe(first.resolvedSources);
    expect(second.repeaterItemScopes).not.toBe(first.repeaterItemScopes);
    expect(second.repeaterRows).not.toBe(first.repeaterRows);
  });
});

describe('the flags in the records', () => {
  const scope = { $form: {}, $meta: {}, $errors: {}, $formIsInvalid: false, $fn: {} };

  /** The instances of a form with their flags, for a form whose conditions read no data. */
  const treeWithFlags = (compiledRoot: CompiledWidget, data: Record<string, unknown>) =>
    computeWidgetFlags(
      buildWidgetInstances(compiledRoot, data, emptyWidgetInstanceTree()),
      compiledRoot,
      data,
      scope,
      new Set<string>(),
    );

  const cardForm = () =>
    compile([
      { uid: 'title', kind: 'display', type: 'heading' },
      {
        uid: 'card',
        kind: 'layout',
        type: 'flex',
        include: { when: 'false' },
        children: [{ ...textInput('note', 'note'), disabled: { when: 'true' } }],
      },
      { ...textInput('name', 'name'), disabled: { when: 'true' } },
    ]);

  it('lists the flags of every instance that has flags, in the order of the document', () => {
    const compiledRoot = cardForm();
    const tree = treeWithFlags(compiledRoot, {});

    const widgetFlags = flagsRecordOfInstances(tree);

    expect(widgetFlags).toEqual({
      card: { hidden: true },
      note: { hidden: true },
      name: { disabled: true },
    });
    expect(Object.keys(widgetFlags)).toEqual(['card', 'note', 'name']);
    expect(widgetFlags).not.toHaveProperty('title');
    expect(widgetFlags['name']).toBe(tree.root?.children[2].flags);
  });

  it('writes the same flags record together with the other records', () => {
    const compiledRoot = cardForm();
    const tree = treeWithFlags(compiledRoot, {});

    const records = recordsOfInstances(tree, compiledRoot);

    expect(records.widgetFlags).toEqual(flagsRecordOfInstances(tree));
    expect(Object.keys(records.widgetFlags)).toEqual(['card', 'note', 'name']);
  });

  it('gives a uid that two widgets have the flags of the last widget', () => {
    // The first input is hidden by its own condition, and the second input has no condition.
    const compiledRoot = compile([
      repeater('contacts', 'contacts', 'row', [
        { ...textInput('phone', 'contacts.items.home'), include: { when: 'false' } },
        textInput('phone', 'contacts.items.mobile'),
      ]),
    ]);
    const tree = treeWithFlags(compiledRoot, { contacts: [{}] });

    expect(flagsRecordOfInstances(tree)).toEqual({});
    expect(recordsOfInstances(tree, compiledRoot).widgetFlags).toEqual({});
    expect(recordsOfInstances(tree, compiledRoot).resolvedSources['phone[0]']).toMatchObject({
      path: 'contacts.0.mobile',
    });
  });

  it('gives a uid that two widgets have the flags of the last widget when both have flags', () => {
    const compiledRoot = compile([
      repeater('contacts', 'contacts', 'row', [
        { ...textInput('phone', 'contacts.items.home'), include: { when: 'false' } },
        { ...textInput('phone', 'contacts.items.mobile'), include: { when: 'true' } },
      ]),
    ]);
    const tree = treeWithFlags(compiledRoot, { contacts: [{}] });

    expect(flagsRecordOfInstances(tree)).toEqual({ 'phone[0]': { hidden: false } });
  });
});
