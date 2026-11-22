import { describe, expect, it, vi } from 'vitest';
import type { ValidatorFn } from './form-validator';
import {
  buildWidgetSetForm,
  type WidgetSetDefinition,
  type WidgetSetFormInitConfig,
} from './widget-set-form';

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
    it('merges the widget set loaders, then the custom loaders of the form', () => {
      const setGrid = loader('set-grid');
      const setX = loader('set-x');
      const formX = loader('form-x');
      const formY = loader('form-y');
      const { widgetSet } = makeWidgetSet({ widgetLoaders: { grid: setGrid, x: setX } });

      const bundle = buildWidgetSetForm(
        widgetSet,
        makeConfig({ customWidgetLoaders: { x: formX, y: formY } }),
      );

      expect(bundle.initConfig.widgetLoaders).toStrictEqual({
        grid: setGrid,
        x: formX,
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
    it('lets the dependencies of the form win over the widget set', () => {
      const { widgetSet } = makeWidgetSet({ dependencies: { d: 'set-d', e: 'set-e' } });

      const bundle = buildWidgetSetForm(widgetSet, makeConfig({ dependencies: { e: 'form-e' } }));

      expect(bundle.initConfig.dependencies).toStrictEqual({ d: 'set-d', e: 'form-e' });
    });

    it('gives an empty object when no source has dependencies', () => {
      const { widgetSet } = makeWidgetSet();

      const bundle = buildWidgetSetForm(widgetSet, makeConfig());

      expect(bundle.initConfig.dependencies).toStrictEqual({});
    });
  });

  describe('functions', () => {
    it('passes the functions of the form', () => {
      const gForm = () => 2;
      const { widgetSet } = makeWidgetSet();

      const bundle = buildWidgetSetForm(widgetSet, makeConfig({ functions: { g: gForm } }));

      expect(bundle.initConfig.functions).toStrictEqual({ g: gForm });
    });

    it('gives an empty object when the form has no functions', () => {
      const { widgetSet } = makeWidgetSet();

      const bundle = buildWidgetSetForm(widgetSet, makeConfig());

      expect(bundle.initConfig.functions).toStrictEqual({});
    });
  });

  describe('item renderers', () => {
    it('passes the item renderers of the form', () => {
      const bForm = { name: 'b-form' };
      const { widgetSet } = makeWidgetSet();

      const bundle = buildWidgetSetForm(widgetSet, makeConfig({ itemRenderers: { b: bForm } }));

      expect(bundle.initConfig.itemRenderers).toStrictEqual({ b: bForm });
    });

    it('gives an empty object when the form has no item renderers', () => {
      const { widgetSet } = makeWidgetSet();

      const bundle = buildWidgetSetForm(widgetSet, makeConfig());

      expect(bundle.initConfig.itemRenderers).toStrictEqual({});
    });
  });

  describe('validateOn', () => {
    it('uses the setting of the form', () => {
      const { widgetSet } = makeWidgetSet();

      const bundle = buildWidgetSetForm(widgetSet, makeConfig({ validateOn: 'blur' }));

      expect(bundle.initConfig.validateOn).toBe('blur');
    });

    it('uses eager when the form sets none', () => {
      const { widgetSet } = makeWidgetSet();

      const bundle = buildWidgetSetForm(widgetSet, makeConfig());

      expect(bundle.initConfig.validateOn).toBe('eager');
    });
  });

  describe('values passed as given', () => {
    it('passes the form definition through', () => {
      const { widgetSet } = makeWidgetSet();
      const formDef = { kind: 'layout', type: 'grid', children: [] };

      const bundle = buildWidgetSetForm(widgetSet, makeConfig({ formDef }));

      expect(bundle.initConfig.formDef).toBe(formDef);
    });

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
});
