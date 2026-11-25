import { describe, expect, it } from 'vitest';
import { compileForm } from '../compile/compile-form';
import { type CompiledWidget } from '../compile/compiled-form';
import { formDefDecoder } from '../form';
import { buildWidgetInstances } from './build-instances';
import {
  emptyWidgetInstanceTree,
  forEachInstance,
  type WidgetInstance,
  type WidgetInstanceTree,
} from './widget-instance';

/**
 * The widget instances that a compiled form has for some data: which instances exist, what each
 * one holds, and which instances of the build before are used again.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/instances/build-instances.spec.ts
 */

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

/** Compiles the widgets of a form as `INITIALIZE` does, with the root layout around them. */
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

const build = (
  compiledRoot: CompiledWidget | undefined,
  data: Record<string, unknown>,
  previous: WidgetInstanceTree = emptyWidgetInstanceTree(),
): WidgetInstanceTree => buildWidgetInstances(compiledRoot, data, previous);

const instancesOf = (tree: WidgetInstanceTree): WidgetInstance[] => {
  const instances: WidgetInstance[] = [];
  forEachInstance(tree.root, (instance) => instances.push(instance));
  return instances;
};

const uidsOf = (tree: WidgetInstanceTree): string[] =>
  instancesOf(tree).map((instance) => instance.uid);

const instanceOf = (tree: WidgetInstanceTree, uid: string): WidgetInstance => {
  const instance = instancesOf(tree).find((candidate) => candidate.uid === uid);
  if (instance === undefined) {
    throw new Error(`The tree has no instance with the uid ${uid}`);
  }
  return instance;
};

/** The instance objects of a tree and a deep copy of it, taken before a test builds from it. */
const copyOfTree = (tree: WidgetInstanceTree) => ({
  instances: instancesOf(tree),
  values: structuredClone(tree),
});

/** Checks that a tree has the same instance objects as its copy, each with the same values. */
const expectUnchangedTree = (
  tree: WidgetInstanceTree,
  copy: ReturnType<typeof copyOfTree>,
): void => {
  const instances = instancesOf(tree);
  expect(instances).toHaveLength(copy.instances.length);
  instances.forEach((instance, position) => {
    expect(instance).toBe(copy.instances[position]);
  });
  expect(tree).toStrictEqual(copy.values);
};

const textInput = (uid: string, path: string, more: Record<string, unknown> = {}) => ({
  uid,
  kind: 'input',
  type: 'textinput',
  path,
  ...more,
});

const layout = (uid: string, children: unknown[]) => ({
  uid,
  kind: 'layout',
  type: 'flex',
  children,
});

const repeater = (uid: string, path: string, rowUid: string, rowWidgets: unknown[]) => ({
  uid,
  kind: 'input',
  type: 'repeater',
  path,
  props: { template: layout(rowUid, rowWidgets) },
});

/** A list of users, with a title before it and a button after it. */
const usersForm = () =>
  compile([
    layout('header', [{ uid: 'title', kind: 'display', type: 'heading' }]),
    repeater('users', 'users', 'row', [
      textInput('name', 'users.items.name', { props: { placeholder: 'Name' } }),
      { uid: 'remove', kind: 'action', type: 'button' },
    ]),
    { uid: 'save', kind: 'action', type: 'button' },
  ]);

/** A list of teams. Each team has a name and a list of developers. */
const teamsForm = () =>
  compile([
    repeater('teams', 'teams', 'team', [
      textInput('teamName', 'teams.items.name'),
      repeater('devs', 'teams.items.devs', 'dev', [
        textInput('devName', 'teams.items.devs.items.name'),
      ]),
    ]),
  ]);

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('buildWidgetInstances', () => {
  describe('the instances of a form', () => {
    it('has one instance for each widget outside a repeater, in the order of the document', () => {
      const tree = build(usersForm(), {});

      expect(uidsOf(tree)).toEqual(['#0', 'header', 'title', 'users', 'save']);
    });

    it('gives an instance outside a repeater the decoded widget as its source', () => {
      const compiledRoot = usersForm();
      const tree = build(compiledRoot, {});

      const header = instanceOf(tree, 'header');
      expect(header.source).toBe(compiledRoot.children[0].source);
      expect(header.path).toBeUndefined();
      expect(header.rowIndexes).toEqual([]);
      expect(header.itemPath).toBeUndefined();
      expect(header.children.map((child) => child.uid)).toEqual(['title']);
      expect(header.rows).toEqual([]);
    });

    it('gives an input its path', () => {
      const tree = build(compile([textInput('email', 'contact.email')]), {});

      expect(instanceOf(tree, 'email').path).toBe('contact.email');
    });

    it('has no instance for a form without a compiled root', () => {
      const tree = build(undefined, { users: [{}] });

      expect(tree.root).toBeUndefined();
      expect(uidsOf(tree)).toEqual([]);
    });

    it('gives every widget without children or rows one shared empty list, which is frozen', () => {
      const tree = build(usersForm(), { users: [{}] });
      const title = instanceOf(tree, 'title');

      expect(title.children).toBe(instanceOf(tree, 'name[0]').rows);
      expect(Object.isFrozen(title.children)).toBe(true);
      expect(Object.isFrozen(title.rowIndexes)).toBe(true);
    });
  });

  describe('the rows of a repeater', () => {
    it('has one row layout for each entry of the array, with the widgets of the row below it', () => {
      const tree = build(usersForm(), { users: [{}, {}] });

      expect(uidsOf(tree)).toEqual([
        '#0',
        'header',
        'title',
        'users',
        'row[0]',
        'name[0]',
        'remove[0]',
        'row[1]',
        'name[1]',
        'remove[1]',
        'save',
      ]);
      expect(instanceOf(tree, 'users').rows.map((row) => row.uid)).toEqual(['row[0]', 'row[1]']);
      expect(instanceOf(tree, 'users').children).toEqual([]);
    });

    it('gives a row widget the uid, the path and the indexes of its row', () => {
      const tree = build(usersForm(), { users: [{}, {}] });

      const name = instanceOf(tree, 'name[1]');
      expect(name.path).toBe('users.1.name');
      expect(name.rowIndexes).toEqual([1]);
      expect(name.itemPath).toBe('users.1');
      expect(instanceOf(tree, 'row[1]').itemPath).toBe('users.1');
      expect(instanceOf(tree, 'row[1]').path).toBeUndefined();
    });

    it('gives a row widget a copy of the widget of the definition, with its own uid and path', () => {
      const compiledRoot = usersForm();
      const rowLayout = compiledRoot.children[1].repeater?.rowLayout as CompiledWidget;
      const nameOfDefinition = rowLayout.children[0].source;
      const tree = build(compiledRoot, { users: [{}, {}] });

      const source = instanceOf(tree, 'name[1]').source;
      expect(source).toEqual({ ...nameOfDefinition, uid: 'name[1]', path: 'users.1.name' });
      expect(Object.keys(source)).toEqual(Object.keys(nameOfDefinition));
      expect(source.props).toBe(nameOfDefinition.props);
      expect(nameOfDefinition.uid).toBe('name');
    });

    it('gives a row widget that is no input a copy with only its own uid', () => {
      const compiledRoot = usersForm();
      const rowLayout = compiledRoot.children[1].repeater?.rowLayout as CompiledWidget;
      const tree = build(compiledRoot, { users: [{}] });

      const removeOfDefinition = rowLayout.children[1].source;
      const source = instanceOf(tree, 'remove[0]').source;
      expect(source).toEqual({ ...removeOfDefinition, uid: 'remove[0]' });
      expect(Object.keys(source)).toEqual(Object.keys(removeOfDefinition));
      expect(source).not.toHaveProperty('path');
      expect(instanceOf(tree, 'remove[0]').path).toBeUndefined();
    });

    it.each([
      ['no value', {}],
      ['an object', { users: { 0: {} } }],
      ['a text', { users: 'ab' }],
      ['null', { users: null }],
    ])('has no row for a repeater whose value is %s', (_name, data) => {
      const tree = build(usersForm(), data);

      expect(instanceOf(tree, 'users').rows).toEqual([]);
    });

    it('has no row for an empty place of the array', () => {
      const users: unknown[] = [];
      users[0] = {};
      users[2] = {};

      const tree = build(usersForm(), { users });

      const rows = instanceOf(tree, 'users').rows;
      expect(rows.map((row) => row.uid)).toEqual(['row[0]', 'row[2]']);
      expect(rows.map((row) => row.rowIndexes)).toEqual([[0], [2]]);
      expect(instanceOf(tree, 'name[2]').path).toBe('users.2.name');
    });

    it('has a row for an entry that holds undefined', () => {
      const tree = build(usersForm(), { users: [undefined, {}] });

      expect(instanceOf(tree, 'users').rows.map((row) => row.uid)).toEqual(['row[0]', 'row[1]']);
    });

    it('builds the rows of a repeater inside a row with the indexes of both rows', () => {
      const tree = build(teamsForm(), {
        teams: [{ devs: [{}] }, { devs: [] }, { devs: [{}, {}] }],
      });

      expect(uidsOf(tree)).toEqual([
        '#0',
        'teams',
        'team[0]',
        'teamName[0]',
        'devs[0]',
        'dev[0][0]',
        'devName[0][0]',
        'team[1]',
        'teamName[1]',
        'devs[1]',
        'team[2]',
        'teamName[2]',
        'devs[2]',
        'dev[2][0]',
        'devName[2][0]',
        'dev[2][1]',
        'devName[2][1]',
      ]);
      const devName = instanceOf(tree, 'devName[2][1]');
      expect(devName.path).toBe('teams.2.devs.1.name');
      expect(devName.rowIndexes).toEqual([2, 1]);
      expect(devName.itemPath).toBe('teams.2.devs.1');
      expect(instanceOf(tree, 'devs[2]').path).toBe('teams.2.devs');
      expect(instanceOf(tree, 'devs[2]').itemPath).toBe('teams.2');
    });

    it('reads a property that is named items as a property, not as a row', () => {
      const compiledRoot = compile([
        repeater('lines', 'invoice.items', 'line', [textInput('sku', 'invoice.items.items.sku')]),
      ]);

      const tree = build(compiledRoot, { invoice: { items: [{}, {}] } });

      expect(instanceOf(tree, 'sku[1]').path).toBe('invoice.items.1.sku');
      expect(instanceOf(tree, 'line[1]').itemPath).toBe('invoice.items.1');
    });
  });

  describe('a path that is not inside the row of its repeater', () => {
    const formWithWrongPath = () =>
      compile([repeater('users', 'users', 'row', [textInput('name', 'people.items.name')])]);

    it('builds the form while the repeater has no row', () => {
      expect(uidsOf(build(formWithWrongPath(), { users: [] }))).toEqual(['#0', 'users']);
    });

    it('throws the error of the path when a row has the input', () => {
      expect(() => build(formWithWrongPath(), { users: [{}] })).toThrow(
        'Path "people.items.name" is not inside the repeater row "users.items".',
      );
    });

    it('throws for a repeater inside a row whose path is outside that row', () => {
      const compiledRoot = compile([
        repeater('teams', 'teams', 'team', [
          repeater('devs', 'staff', 'dev', [textInput('devName', 'staff.items.name')]),
        ]),
      ]);

      expect(uidsOf(build(compiledRoot, { teams: [] }))).toEqual(['#0', 'teams']);
      expect(() => build(compiledRoot, { teams: [{}] })).toThrow(
        'Path "staff" is not inside the repeater row "teams.items".',
      );
    });
  });

  describe('the instances of the build before', () => {
    it('returns the previous tree when the data has the same rows', () => {
      const compiledRoot = usersForm();
      const first = build(compiledRoot, { users: [{ name: 'Ada' }, {}] });

      const second = build(compiledRoot, { users: [{ name: 'Grace' }, { name: 'Edsger' }] }, first);

      expect(second).toBe(first);
    });

    it('returns the previous tree for a form without a repeater', () => {
      const compiledRoot = compile([textInput('email', 'email')]);
      const first = build(compiledRoot, {});

      expect(build(compiledRoot, { email: 'ada@example.org' }, first)).toBe(first);
    });

    it('returns the previous tree when it has no instance and the form has no compiled root', () => {
      const empty = emptyWidgetInstanceTree();

      expect(build(undefined, {}, empty)).toBe(empty);
    });

    it('returns a tree without instances when the form has no compiled root any more', () => {
      const first = build(usersForm(), { users: [{}] });

      const second = build(undefined, { users: [{}] }, first);

      expect(second).not.toBe(first);
      expect(second.root).toBeUndefined();
    });

    it('keeps the previous row instances when a row is added', () => {
      const compiledRoot = usersForm();
      const first = build(compiledRoot, { users: [{}, {}] });

      const second = build(compiledRoot, { users: [{}, {}, {}] }, first);

      expect(uidsOf(second)).toContain('name[2]');
      for (const uid of ['row[0]', 'name[0]', 'remove[0]', 'row[1]', 'name[1]', 'remove[1]']) {
        expect(instanceOf(second, uid)).toBe(instanceOf(first, uid));
      }
    });

    it('gives a new instance to the repeater whose rows changed and to the layouts above it', () => {
      const compiledRoot = usersForm();
      const first = build(compiledRoot, { users: [{}, {}] });

      const second = build(compiledRoot, { users: [{}, {}, {}] }, first);

      expect(second).not.toBe(first);
      expect(second.root).not.toBe(first.root);
      expect(instanceOf(second, 'users')).not.toBe(instanceOf(first, 'users'));
      // The source of an instance is made one time, so a new instance has the previous source.
      expect(instanceOf(second, 'users').source).toBe(instanceOf(first, 'users').source);
      expect(instanceOf(second, 'users').rows).not.toBe(instanceOf(first, 'users').rows);
    });

    it('keeps the instance of a widget that is not above the changed rows', () => {
      const compiledRoot = usersForm();
      const first = build(compiledRoot, { users: [{}] });

      const second = build(compiledRoot, { users: [{}, {}] }, first);

      expect(instanceOf(second, 'header')).toBe(instanceOf(first, 'header'));
      expect(instanceOf(second, 'title')).toBe(instanceOf(first, 'title'));
      expect(instanceOf(second, 'save')).toBe(instanceOf(first, 'save'));
    });

    it('keeps the first rows by their index when a row is removed', () => {
      const compiledRoot = usersForm();
      const first = build(compiledRoot, { users: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] });

      // The first row is deleted. The previous rows with the indexes 0 and 1 stay.
      const second = build(compiledRoot, { users: [{ name: 'b' }, { name: 'c' }] }, first);

      expect(instanceOf(second, 'users').rows).toEqual([
        instanceOf(first, 'row[0]'),
        instanceOf(first, 'row[1]'),
      ]);
      expect(instanceOf(second, 'row[0]')).toBe(instanceOf(first, 'row[0]'));
      expect(instanceOf(second, 'row[1]')).toBe(instanceOf(first, 'row[1]'));
      expect(uidsOf(second)).not.toContain('row[2]');
    });

    it('removes every row when the value is no array any more', () => {
      const compiledRoot = usersForm();
      const first = build(compiledRoot, { users: [{}, {}] });

      const second = build(compiledRoot, { users: undefined }, first);

      expect(instanceOf(second, 'users').rows).toEqual([]);
      expect(instanceOf(second, 'users')).not.toBe(instanceOf(first, 'users'));
    });

    it('puts the row of a place that was empty before at the position of its index', () => {
      const compiledRoot = usersForm();
      const withEmptyPlace: unknown[] = [];
      withEmptyPlace[0] = {};
      withEmptyPlace[2] = {};
      const first = build(compiledRoot, { users: withEmptyPlace });

      const second = build(compiledRoot, { users: [{}, {}, {}] }, first);

      expect(instanceOf(second, 'users').rows.map((row) => row.uid)).toEqual([
        'row[0]',
        'row[1]',
        'row[2]',
      ]);
      expect(instanceOf(second, 'row[0]')).toBe(instanceOf(first, 'row[0]'));
      expect(instanceOf(second, 'row[2]')).toBe(instanceOf(first, 'row[2]'));
      expect(instanceOf(second, 'name[1]').path).toBe('users.1.name');
    });

    it('keeps the rows by their index when other places of the array become empty', () => {
      const compiledRoot = usersForm();
      const first = build(compiledRoot, { users: [{}, {}, {}, {}] });
      const withEmptyPlaces: unknown[] = [];
      withEmptyPlaces[1] = {};
      withEmptyPlaces[3] = {};

      const second = build(compiledRoot, { users: withEmptyPlaces }, first);

      expect(instanceOf(second, 'users').rows).toEqual([
        instanceOf(first, 'row[1]'),
        instanceOf(first, 'row[3]'),
      ]);
      expect(instanceOf(second, 'row[1]')).toBe(instanceOf(first, 'row[1]'));
      expect(instanceOf(second, 'row[3]')).toBe(instanceOf(first, 'row[3]'));
    });

    it('builds new rows in front of, between and after the previous rows', () => {
      const compiledRoot = usersForm();
      const withEmptyPlaces: unknown[] = [];
      withEmptyPlaces[1] = {};
      withEmptyPlaces[3] = {};
      const first = build(compiledRoot, { users: withEmptyPlaces });

      const second = build(compiledRoot, { users: [{}, {}, {}, {}, {}] }, first);

      expect(instanceOf(second, 'users').rows.map((row) => row.uid)).toEqual([
        'row[0]',
        'row[1]',
        'row[2]',
        'row[3]',
        'row[4]',
      ]);
      expect(instanceOf(second, 'row[1]')).toBe(instanceOf(first, 'row[1]'));
      expect(instanceOf(second, 'row[3]')).toBe(instanceOf(first, 'row[3]'));
      expect(instanceOf(second, 'name[0]').path).toBe('users.0.name');
      expect(instanceOf(second, 'name[4]').rowIndexes).toEqual([4]);
    });

    it('keeps the other rows when a row gets a new row of its own repeater', () => {
      const compiledRoot = teamsForm();
      const first = build(compiledRoot, { teams: [{ devs: [{}] }, { devs: [{}] }] });

      const second = build(compiledRoot, { teams: [{ devs: [{}] }, { devs: [{}, {}] }] }, first);

      expect(instanceOf(second, 'team[0]')).toBe(instanceOf(first, 'team[0]'));
      expect(instanceOf(second, 'dev[1][0]')).toBe(instanceOf(first, 'dev[1][0]'));
      expect(instanceOf(second, 'teamName[1]')).toBe(instanceOf(first, 'teamName[1]'));
      expect(instanceOf(second, 'team[1]')).not.toBe(instanceOf(first, 'team[1]'));
      expect(instanceOf(second, 'devs[1]')).not.toBe(instanceOf(first, 'devs[1]'));
      const added = instanceOf(second, 'devName[1][1]');
      expect(added.path).toBe('teams.1.devs.1.name');
      expect(added.rowIndexes).toEqual([1, 1]);
      expect(added.itemPath).toBe('teams.1.devs.1');
    });

    it('builds the same instances with and without a previous tree', () => {
      const compiledRoot = teamsForm();
      const data = { teams: [{ devs: [{}, {}] }, { devs: [{}] }] };
      const first = build(compiledRoot, { teams: [{ devs: [{}] }, { devs: [] }, { devs: [{}] }] });

      expect(build(compiledRoot, data, first)).toEqual(build(compiledRoot, data));
    });

    it('never changes an instance of the previous tree', () => {
      const compiledRoot = usersForm();
      const first = build(compiledRoot, { users: [{}, {}] });
      const firstAsBuilt = copyOfTree(first);

      build(compiledRoot, { users: [{}, {}, {}] }, first);
      build(compiledRoot, { users: [] }, first);

      expect(uidsOf(first)).toHaveLength(11);
      expectUnchangedTree(first, firstAsBuilt);
    });
  });

  describe('an older tree', () => {
    it('gives the row of the older tree when the tree before has no row with that index', () => {
      const compiledRoot = usersForm();
      const older = build(compiledRoot, { users: [{}, {}] });
      const withoutRows = build(compiledRoot, {}, older);

      const tree = buildWidgetInstances(compiledRoot, { users: [{}, {}] }, withoutRows, older);

      expect(instanceOf(withoutRows, 'users').rows).toEqual([]);
      expect(instanceOf(tree, 'row[0]')).toBe(instanceOf(older, 'row[0]'));
      expect(instanceOf(tree, 'name[1]')).toBe(instanceOf(older, 'name[1]'));
      expect(instanceOf(tree, 'users').rows).toEqual(instanceOf(older, 'users').rows);
    });

    it('gives the row of the tree before when both trees have a row with that index', () => {
      const compiledRoot = usersForm();
      const data = { users: [{}] };
      const older = build(compiledRoot, data);
      const before = build(compiledRoot, data);

      const tree = buildWidgetInstances(compiledRoot, data, before, older);

      expect(tree).toBe(before);
      expect(instanceOf(tree, 'row[0]')).not.toBe(instanceOf(older, 'row[0]'));
    });

    it('builds a new row for an index that no tree has', () => {
      const compiledRoot = usersForm();
      const older = build(compiledRoot, { users: [{}] });
      const withoutRows = build(compiledRoot, { users: 'no list' }, older);

      const tree = buildWidgetInstances(compiledRoot, { users: [{}, {}] }, withoutRows, older);

      expect(instanceOf(tree, 'row[0]')).toBe(instanceOf(older, 'row[0]'));
      expect(instanceOf(tree, 'row[1]').rowIndexes).toEqual([1]);
      expect(instanceOf(tree, 'name[1]').path).toBe('users.1.name');
    });

    it('finds the rows of the older tree by their index when it has empty places', () => {
      const compiledRoot = usersForm();
      const usersWithEmptyPlace: unknown[] = [{}, {}, {}];
      delete usersWithEmptyPlace[1];
      const older = build(compiledRoot, { users: usersWithEmptyPlace });
      const withoutRows = build(compiledRoot, {}, older);

      const tree = buildWidgetInstances(compiledRoot, { users: [{}, {}, {}] }, withoutRows, older);

      const rows = instanceOf(tree, 'users').rows;
      expect(rows.map((row) => row.uid)).toEqual(['row[0]', 'row[1]', 'row[2]']);
      expect(rows[0]).toBe(instanceOf(older, 'row[0]'));
      expect(rows[2]).toBe(instanceOf(older, 'row[2]'));
    });

    it('takes a row from the older tree and the next row from the tree before', () => {
      const compiledRoot = usersForm();
      const older = build(compiledRoot, { users: [{}] });
      const withOtherRow: unknown[] = [];
      withOtherRow[1] = {};
      const before = build(compiledRoot, { users: withOtherRow }, older);

      const tree = buildWidgetInstances(compiledRoot, { users: [{}, {}] }, before, older);

      const rows = instanceOf(tree, 'users').rows;
      expect(rows[0]).toBe(instanceOf(older, 'row[0]'));
      expect(rows[1]).toBe(instanceOf(before, 'row[1]'));
    });

    it('gives the row of a repeater inside a row from the older tree', () => {
      const compiledRoot = teamsForm();
      const older = build(compiledRoot, { teams: [{ devs: [{}, {}] }] });
      const withoutDevs = build(compiledRoot, { teams: [{ devs: 'no list' }] }, older);

      const tree = buildWidgetInstances(
        compiledRoot,
        { teams: [{ devs: [{}, {}] }] },
        withoutDevs,
        older,
      );

      expect(instanceOf(withoutDevs, 'devs[0]').rows).toEqual([]);
      expect(instanceOf(tree, 'dev[0][1]')).toBe(instanceOf(older, 'dev[0][1]'));
      expect(instanceOf(tree, 'devName[0][0]')).toBe(instanceOf(older, 'devName[0][0]'));
    });

    it('gives the older tree itself when the build has exactly its instances', () => {
      const compiledRoot = usersForm();
      const older = build(compiledRoot, { users: [{}, {}] });
      const withoutRows = build(compiledRoot, {}, older);

      const tree = buildWidgetInstances(compiledRoot, { users: [{}, {}] }, withoutRows, older);

      expect(tree).toBe(older);
    });

    it('gives the widgets above a row of the older tree their older instances when nothing else below them changed', () => {
      const compiledRoot = teamsForm();
      const older = build(compiledRoot, { teams: [{ devs: [{}] }, { devs: [{}] }] });
      const withoutDevs = build(
        compiledRoot,
        { teams: [{ devs: 'no list' }, { devs: [{}] }] },
        older,
      );

      const tree = buildWidgetInstances(
        compiledRoot,
        { teams: [{ devs: [{}] }, { devs: [{}, {}] }] },
        withoutDevs,
        older,
      );

      expect(instanceOf(tree, 'devs[0]')).toBe(instanceOf(older, 'devs[0]'));
      expect(instanceOf(tree, 'team[0]')).toBe(instanceOf(older, 'team[0]'));
      expect(instanceOf(tree, 'team[1]')).not.toBe(instanceOf(older, 'team[1]'));
      expect(tree).not.toBe(older);
    });

    it('builds the instances for the data, with the rows below a row of the older tree', () => {
      const compiledRoot = teamsForm();
      const older = build(compiledRoot, { teams: [{ devs: [{}, {}] }, { devs: [{}] }] });
      const withoutTeams = build(compiledRoot, {}, older);
      const data = { teams: [{ devs: [{}] }, { devs: [{}, {}] }, { devs: [] }] };

      const tree = buildWidgetInstances(compiledRoot, data, withoutTeams, older);

      expect(tree).toEqual(build(compiledRoot, data));
      expect(instanceOf(tree, 'dev[0][0]')).toBe(instanceOf(older, 'dev[0][0]'));
      expect(instanceOf(tree, 'team[1]')).not.toBe(instanceOf(older, 'team[1]'));
    });

    it('never changes an instance of the older tree', () => {
      const compiledRoot = usersForm();
      const older = build(compiledRoot, { users: [{}, {}] });
      const olderAsBuilt = copyOfTree(older);
      const withoutRows = build(compiledRoot, {}, older);

      buildWidgetInstances(compiledRoot, { users: [{}, {}, {}] }, withoutRows, older);

      expect(uidsOf(older)).toHaveLength(11);
      expectUnchangedTree(older, olderAsBuilt);
    });
  });
});

describe('forEachInstance', () => {
  it('calls nothing for no instance', () => {
    let calls = 0;

    forEachInstance(undefined, () => {
      calls += 1;
    });

    expect(calls).toBe(0);
  });

  it('visits a widget before the widgets below it, in the order of the document', () => {
    const tree = build(teamsForm(), { teams: [{ devs: [{}] }, { devs: [] }] });

    expect(uidsOf(tree)).toEqual([
      '#0',
      'teams',
      'team[0]',
      'teamName[0]',
      'devs[0]',
      'dev[0][0]',
      'devName[0][0]',
      'team[1]',
      'teamName[1]',
      'devs[1]',
    ]);
  });
});
