import { describe, expect, it } from 'vitest';
import { createImplementation, createItemTypeRegistry } from '../index';
import {
  buildDemoImplementation,
  demoNote,
  demoStack,
  demoText,
  rootLayoutOf,
} from './demo-widget-set.fixture';

describe('createImplementation', () => {
  it('assembles the namespace from the facade groups plus the selector chain', () => {
    const demo = buildDemoImplementation();

    expect(demo.name).toBe('demo');
    expect(demo.namespace.inputs.text).toBe(demoText);
    expect(demo.namespace.displays.note).toBe(demoNote);
    expect(demo.namespace.layouts.stack).toBe(demoStack);
    expect(typeof demo.namespace.selectors.fields).toBe('function');
    expect(typeof demo.namespace.selectors.tag).toBe('function');
  });

  it('rejects a facade that already contains a selectors key', () => {
    expect(() =>
      createImplementation({
        name: 'demo',
        registry: createItemTypeRegistry(),
        facade: { selectors: {} } as unknown as Record<string, unknown>,
        selectors: {},
        adapter: {
          bareItemToWidget: () => demoNote(() => null),
          rootEntry: (children) => demoStack(children),
        },
      }),
    ).toThrowError(/must not contain a "selectors" key/);
  });

  it('processes a definition through the second widget set end to end', () => {
    const demo = buildDemoImplementation();
    const result = demo.formDefs.processDxFacade([demoText('email', { label: 'Email' })]);

    const root = rootLayoutOf(result);
    expect(root.kind).toBe('layout');
    expect(root.type).toBe('flex');
    expect(root.uid).toBe('#root');
    expect(root.children).toHaveLength(1);

    const field = root.children[0];
    expect(field.kind).toBe('input');
    expect(field.type).toBe('demoText');
    expect(field.path).toBe('email');
    expect(field.uid).toBe('email');
    expect(field.label).toBe('Email');
  });

  it('applies umbrella selectors to the second vocabulary through its registered kinds', () => {
    const demo = buildDemoImplementation();
    const result = demo.formDefs.processDxFacade(
      [demoText('email')],
      [demo.namespace.selectors.inputs({ override: { label: 'From umbrella' } })],
    );

    const field = rootLayoutOf(result).children[0];
    expect(field.label).toBe('From umbrella');
  });

  it('applies a selector that matches the second vocabulary item type exactly', () => {
    const demo = buildDemoImplementation();
    const result = demo.formDefs.processDxFacade(
      [demoText('email')],
      [demo.namespace.selectors.fields({ override: { label: 'From DEMO_FIELD' } })],
    );

    const field = rootLayoutOf(result).children[0];
    expect(field.label).toBe('From DEMO_FIELD');
  });

  it('targets one widget of the second vocabulary by its declared uid', () => {
    const demo = buildDemoImplementation();
    const result = demo.formDefs.processDxFacade(
      [demoText('email', { uid: 'email-field' }), demoText('name', { uid: 'name-field' })],
      [demo.namespace.selectors.fieldByUid('email-field', { override: { label: 'Only email' } })],
    );

    const [email, name] = rootLayoutOf(result).children;
    expect(email.label).toBe('Only email');
    expect(name.label).toBeUndefined();
  });

  it('maps bare functions through the adapter', () => {
    const demo = buildDemoImplementation();
    const render = () => 'hello';
    const result = demo.formDefs.processDxFacade([render]);

    const note = rootLayoutOf(result).children[0];
    expect(note.kind).toBe('display');
    expect(note.type).toBe('note');
    expect(note.props.render).toBe(render);
  });

  describe('the bound resolveFormInput bridge', () => {
    it('passes JSON form definitions through untouched', () => {
      const demo = buildDemoImplementation();
      const json = '{"kind": "layout", "type": "flex"}';
      expect(demo.resolveFormInput(json).formDef).toBe(json);
    });

    it('memoizes by reference identity of the (defs, selectors, config) triple', () => {
      const demo = buildDemoImplementation();
      const defs = [demoText('email')];
      const selectors = [demo.namespace.selectors.fields({ override: { label: 'x' } })];
      const config = { suppressAutomaticStack: false };

      const plain = demo.resolveFormInput(defs);
      expect(demo.resolveFormInput(defs)).toBe(plain);

      const withSelectors = demo.resolveFormInput(defs, selectors);
      expect(withSelectors).not.toBe(plain);
      expect(demo.resolveFormInput(defs, selectors)).toBe(withSelectors);

      const withConfig = demo.resolveFormInput(defs, selectors, config);
      expect(withConfig).not.toBe(withSelectors);
      expect(demo.resolveFormInput(defs, selectors, config)).toBe(withConfig);

      // A structurally equal but fresh defs array is a different cache key.
      expect(demo.resolveFormInput([demoText('email')])).not.toBe(plain);
    });
  });
});
