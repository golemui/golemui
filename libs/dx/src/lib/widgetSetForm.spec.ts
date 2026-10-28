import { describe, expect, it, vi } from 'vitest';
import type { ValidatorFn } from '@golemui/core';
import {
  buildWidgetSetForm,
  type WidgetSetDefinition,
  type WidgetSetFormInitConfig,
} from './widgetSetForm';

const loader = (name: string) => () => Promise.resolve(name);

function makeWidgetSet(overrides: Partial<WidgetSetDefinition> = {}) {
  const validatorFn = vi.fn() as unknown as ValidatorFn<any>;
  const validatorFactory = vi.fn((_customValidators?: Record<string, unknown>) => validatorFn);
  const widgetSet: WidgetSetDefinition = {
    widgetLoaders: { grid: loader('set-grid'), x: loader('set-x') },
    validators: validatorFactory,
    ...overrides,
  };
  return { widgetSet, validatorFactory, validatorFn };
}

function makeConfig(overrides: Partial<WidgetSetFormInitConfig> = {}): WidgetSetFormInitConfig {
  return { formDef: '{"kind":"layout","type":"grid"}', ...overrides };
}

describe('buildWidgetSetForm', () => {
  describe('widget loaders', () => {
    it('merges the widget set loaders, then the resolved loaders, then the custom loaders of the form', () => {
      const setGrid = loader('set-grid');
      const setX = loader('set-x');
      const resolvedX = loader('resolved-x');
      const resolvedY = loader('resolved-y');
      const formY = loader('form-y');
      const { widgetSet } = makeWidgetSet({
        widgetLoaders: { grid: setGrid, x: setX },
        resolveFormInput: () => ({
          formDef: 'def',
          widgetLoaders: { x: resolvedX, y: resolvedY },
        }),
      });

      const bundle = buildWidgetSetForm(
        widgetSet,
        makeConfig({ customWidgetLoaders: { y: formY } }),
      );

      expect(bundle.initConfig.widgetLoaders).toStrictEqual({
        grid: setGrid,
        x: resolvedX,
        y: formY,
      });
    });

    it('keeps the widget set loaders when nothing else provides loaders', () => {
      const setGrid = loader('set-grid');
      const setX = loader('set-x');
      const { widgetSet } = makeWidgetSet({ widgetLoaders: { grid: setGrid, x: setX } });

      const bundle = buildWidgetSetForm(widgetSet, makeConfig());

      expect(bundle.initConfig.widgetLoaders).toStrictEqual({ grid: setGrid, x: setX });
      expect(bundle.initConfig.widgetLoaders?.['grid']).toBe(setGrid);
    });
  });

  describe('dependencies', () => {
    it('lets the resolved dependencies win over the widget set and the form win over both', () => {
      const { widgetSet } = makeWidgetSet({
        dependencies: { d: 'set-d', e: 'set-e' },
        resolveFormInput: () => ({
          formDef: 'def',
          dependencies: { e: 'resolved-e', f: 'resolved-f' },
        }),
      });

      const bundle = buildWidgetSetForm(widgetSet, makeConfig({ dependencies: { e: 'form-e' } }));

      expect(bundle.initConfig.dependencies).toStrictEqual({
        d: 'set-d',
        e: 'form-e',
        f: 'resolved-f',
      });
    });

    it('gives an empty object when no source has dependencies', () => {
      const { widgetSet } = makeWidgetSet();

      const bundle = buildWidgetSetForm(widgetSet, makeConfig());

      expect(bundle.initConfig.dependencies).toStrictEqual({});
    });
  });

  describe('functions', () => {
    it('lets the functions of the form win over the resolved functions', () => {
      const f = () => 1;
      const gResolved = () => 1;
      const gForm = () => 2;
      const { widgetSet } = makeWidgetSet({
        resolveFormInput: () => ({ formDef: 'def', functions: { f, g: gResolved } }),
      });

      const bundle = buildWidgetSetForm(widgetSet, makeConfig({ functions: { g: gForm } }));

      expect(bundle.initConfig.functions).toStrictEqual({ f, g: gForm });
    });

    it('gives an empty object when neither source has functions', () => {
      const { widgetSet } = makeWidgetSet();

      const bundle = buildWidgetSetForm(widgetSet, makeConfig());

      expect(bundle.initConfig.functions).toStrictEqual({});
    });
  });

  describe('item renderers', () => {
    it('lets the item renderers of the form win over the resolved item renderers', () => {
      const a = { name: 'a' };
      const bResolved = { name: 'b-resolved' };
      const bForm = { name: 'b-form' };
      const { widgetSet } = makeWidgetSet({
        resolveFormInput: () => ({ formDef: 'def', itemRenderers: { a, b: bResolved } }),
      });

      const bundle = buildWidgetSetForm(widgetSet, makeConfig({ itemRenderers: { b: bForm } }));

      expect(bundle.initConfig.itemRenderers).toStrictEqual({ a, b: bForm });
    });

    it('gives an empty object when neither source has item renderers', () => {
      const { widgetSet } = makeWidgetSet();

      const bundle = buildWidgetSetForm(widgetSet, makeConfig());

      expect(bundle.initConfig.itemRenderers).toStrictEqual({});
    });
  });

  describe('validateOn', () => {
    it('uses the setting of the form before the resolved setting', () => {
      const { widgetSet } = makeWidgetSet({
        resolveFormInput: () => ({ formDef: 'def', validateOn: 'change' }),
      });

      const bundle = buildWidgetSetForm(widgetSet, makeConfig({ validateOn: 'blur' }));

      expect(bundle.initConfig.validateOn).toBe('blur');
    });

    it('uses the resolved setting when the form sets none', () => {
      const { widgetSet } = makeWidgetSet({
        resolveFormInput: () => ({ formDef: 'def', validateOn: 'change' }),
      });

      const bundle = buildWidgetSetForm(widgetSet, makeConfig());

      expect(bundle.initConfig.validateOn).toBe('change');
    });

    it('falls back to eager when no source sets it', () => {
      const { widgetSet } = makeWidgetSet();

      const bundle = buildWidgetSetForm(widgetSet, makeConfig());

      expect(bundle.initConfig.validateOn).toBe('eager');
    });
  });

  describe('values passed as given', () => {
    it('gives an empty middleware list when the form has none', () => {
      const { widgetSet } = makeWidgetSet();

      const bundle = buildWidgetSetForm(widgetSet, makeConfig());

      expect(bundle.initConfig.middlewares).toStrictEqual([]);
    });

    it('passes the middlewares, data, meta, localization, expression policy and form name through', () => {
      const { widgetSet } = makeWidgetSet();
      const middlewares = [vi.fn()] as unknown as WidgetSetFormInitConfig['middlewares'];
      const data = { name: 'Ada' };
      const meta = { source: 'test' };
      const localization = {
        translate: vi.fn(),
      } as unknown as WidgetSetFormInitConfig['localization'];

      const bundle = buildWidgetSetForm(
        widgetSet,
        makeConfig({
          middlewares,
          data,
          meta,
          localization,
          expressionPolicy: 'strict',
          formName: 'signup',
        }),
      );

      expect(bundle.initConfig.middlewares).toBe(middlewares);
      expect(bundle.initConfig.data).toBe(data);
      expect(bundle.initConfig.meta).toBe(meta);
      expect(bundle.initConfig.localization).toBe(localization);
      expect(bundle.initConfig.expressionPolicy).toBe('strict');
      expect(bundle.initConfig.formName).toBe('signup');
    });

    it('leaves the values the form does not set undefined', () => {
      const { widgetSet } = makeWidgetSet();

      const bundle = buildWidgetSetForm(widgetSet, makeConfig());

      expect(bundle.initConfig.data).toBeUndefined();
      expect(bundle.initConfig.meta).toBeUndefined();
      expect(bundle.initConfig.localization).toBeUndefined();
      expect(bundle.initConfig.expressionPolicy).toBeUndefined();
      expect(bundle.initConfig.formName).toBeUndefined();
    });
  });

  describe('validators', () => {
    it('calls the validator factory once and returns its result', () => {
      const { widgetSet, validatorFactory, validatorFn } = makeWidgetSet();

      const bundle = buildWidgetSetForm(widgetSet, makeConfig());

      expect(validatorFactory).toHaveBeenCalledTimes(1);
      expect(bundle.validators).toBe(validatorFn);
    });

    it('calls the factory with an empty object when the form has no custom validators', () => {
      const { widgetSet, validatorFactory } = makeWidgetSet();

      buildWidgetSetForm(widgetSet, makeConfig());

      expect(validatorFactory.mock.calls[0][0]).toStrictEqual({});
    });

    it('calls the factory with a copy of the custom validators', () => {
      const { widgetSet, validatorFactory } = makeWidgetSet();
      const customValidators = { even: { type: 'number' } };

      buildWidgetSetForm(widgetSet, makeConfig({ customValidators }));

      const received = validatorFactory.mock.calls[0][0];
      expect(received).toStrictEqual(customValidators);
      expect(received).not.toBe(customValidators);
    });
  });

  describe('form input resolution', () => {
    it('uses the form definition as given when the widget set has no resolver', () => {
      const { widgetSet } = makeWidgetSet();
      const formDef = { kind: 'layout', type: 'grid', children: [] };

      const bundle = buildWidgetSetForm(widgetSet, makeConfig({ formDef }));

      expect(bundle.resolved).toStrictEqual({ formDef });
      expect(bundle.initConfig.formDef).toBe(formDef);
    });

    it('calls the resolver once with the form definition, selectors and form config', () => {
      const resolvedFormDef = { kind: 'layout', type: 'grid', children: [] };
      const resolved = { formDef: resolvedFormDef };
      const resolveFormInput = vi.fn(() => resolved);
      const { widgetSet } = makeWidgetSet({ resolveFormInput: resolveFormInput as any });
      const formDef = [] as unknown as WidgetSetFormInitConfig['formDef'];
      const formSelectors = [] as unknown as WidgetSetFormInitConfig['formSelectors'];
      const formConfig = { suppressAutomaticStack: true };

      const bundle = buildWidgetSetForm(
        widgetSet,
        makeConfig({ formDef, formSelectors, formConfig }),
      );

      expect(resolveFormInput).toHaveBeenCalledTimes(1);
      expect(resolveFormInput).toHaveBeenCalledWith(formDef, formSelectors, formConfig);
      expect(bundle.resolved).toBe(resolved);
      expect(bundle.initConfig.formDef).toBe(resolvedFormDef);
    });
  });
});
