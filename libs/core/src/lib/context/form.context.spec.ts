import { type StandardSchemaV1 } from '@standard-schema/spec';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type ValidatorFn } from '../form-validator';
import { identityTranslator } from '../i18n';
import { type FormPlugin, type FormPluginContext } from '../plugin';
import { type FormSubmitEvent } from '../shared';
import { type ValueSchemaResolver } from '../value-schema';
import { FormContext } from './form.context';

/**
 * Plugin lifecycle spec: drives a real `FormContext` (real store, real reducer) through the
 * public API and asserts what a plugin sees and when.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/context/form.context.spec.ts
 */

type TestValidator = { required?: boolean };

const validators: ValidatorFn<TestValidator> = (validator): StandardSchemaV1 => ({
  '~standard': {
    version: 1,
    vendor: 'form-context-spec',
    validate: (value: unknown) => {
      const isEmpty = value === undefined || value === null || value === '';
      if (validator?.required && isEmpty) {
        return { issues: [{ message: 'required' }] };
      }
      return { value };
    },
  },
});

const formDef = {
  form: {
    uid: 'root',
    kind: 'layout',
    type: 'flex',
    children: [
      {
        uid: 'name',
        kind: 'input',
        type: 'textinput',
        path: 'name',
        label: 'Name',
        validator: { required: true },
        on: { change: 'nameChanged' },
      },
    ],
  },
};

const valueSchemas: ValueSchemaResolver = {
  valueSchema: () => ({ schema: { type: 'string' } }),
};

function createContext(data: Record<string, unknown> = {}) {
  const context = new FormContext<unknown>();
  context.initialize(
    {} as never,
    [],
    validators as ValidatorFn<any>,
    'eager',
    {},
    identityTranslator('en-US'),
    {},
    {},
    valueSchemas,
  );
  context.store.dispatch({ type: 'INITIALIZE', payload: { formName: 'spec-form', formDef } });
  context.store.dispatch({ type: 'SET_DATA', payload: { data } });
  context.store.dispatch({ type: 'SET_META', payload: { meta: {} } });
  return context;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('attachPlugins / detachPlugins', () => {
  it('calls every plugin once with one frozen context bound to the live store', () => {
    const context = createContext();
    const seen: FormPluginContext[] = [];
    const plugin: FormPlugin = (pluginContext) => {
      seen.push(pluginContext);
    };

    context.attachPlugins([plugin, plugin]);

    expect(seen).toHaveLength(2);
    expect(seen[0]).toBe(seen[1]);
    expect(Object.isFrozen(seen[0])).toBe(true);
    expect(seen[0].store).toBe(context.store);
    expect(seen[0].localization).toBe(context.localization);
    expect(seen[0].valueSchemas).toBe(valueSchemas);
    expect(seen[0].store.getState().formName).toBe('spec-form');
  });

  it('runs each teardown exactly once, on detach and on a second attach', () => {
    const context = createContext();
    const teardown = vi.fn();
    const plugin: FormPlugin = () => teardown;

    context.attachPlugins([plugin]);
    expect(teardown).not.toHaveBeenCalled();

    context.attachPlugins([plugin]);
    expect(teardown).toHaveBeenCalledTimes(1);

    context.detachPlugins();
    expect(teardown).toHaveBeenCalledTimes(2);

    context.detachPlugins();
    expect(teardown).toHaveBeenCalledTimes(2);
  });

  it('skips a plugin that throws while attaching and keeps the others', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const context = createContext();
    const healthy = vi.fn();

    context.attachPlugins([
      () => {
        throw new Error('boom');
      },
      healthy,
    ]);

    expect(healthy).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(context.store.getState().formHealth).toEqual({ status: 'ok' });
  });

  it('reports a teardown that throws and still detaches the others', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const context = createContext();
    const secondTeardown = vi.fn();

    context.attachPlugins([
      () => () => {
        throw new Error('boom');
      },
      () => secondTeardown,
    ]);
    context.detachPlugins();

    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(secondTeardown).toHaveBeenCalledTimes(1);
  });

  it('accepts a plugin that returns nothing', () => {
    const context = createContext();
    context.attachPlugins([() => undefined]);
    expect(() => context.detachPlugins()).not.toThrow();
  });
});

describe('the plugin context', () => {
  const attach = (context: FormContext<unknown>): FormPluginContext => {
    let captured: FormPluginContext | undefined;
    context.attachPlugins([
      (pluginContext) => {
        captured = pluginContext;
      },
    ]);
    return captured as FormPluginContext;
  };

  it('submit() returns false and emits nothing while the form is invalid', () => {
    const context = createContext();
    const submits: FormSubmitEvent[] = [];
    context.submit$.subscribe((event) => submits.push(event));
    const pluginContext = attach(context);

    expect(pluginContext.submit()).toBe(false);
    expect(submits).toEqual([]);
    expect(context.store.getState().isFormValid).toBe(false);
  });

  it('submit() returns true and emits the pruned data once the form is valid', () => {
    const context = createContext({ name: 'Ada' });
    const submits: FormSubmitEvent[] = [];
    context.submit$.subscribe((event) => submits.push(event));
    const pluginContext = attach(context);

    expect(pluginContext.submit()).toBe(true);
    expect(submits).toHaveLength(1);
    expect(submits[0].data).toEqual({ name: 'Ada' });
  });

  it('validate() reports the errors without dispatching or touching anything', () => {
    const context = createContext();
    const pluginContext = attach(context);
    const before = context.store.getState();

    const report = pluginContext.validate();

    expect(report).toEqual({ isValid: false, errors: { name: ['required'] } });
    expect(context.store.getState()).toBe(before);
    expect(before.touched).toBe(false);
    expect(before.touchedControls).toEqual({});
  });

  it('validate() merges injected issues with the schema ones', () => {
    const context = createContext({ name: 'Ada' });
    const pluginContext = attach(context);
    context.store.dispatch({
      type: 'INJECT_VALIDATION_ISSUES',
      payload: { path: 'name', issues: ['taken'] },
    });

    expect(pluginContext.validate()).toEqual({ isValid: false, errors: { name: ['taken'] } });
  });

  it('validate() reports a valid form', () => {
    const pluginContext = attach(createContext({ name: 'Ada' }));
    expect(pluginContext.validate()).toEqual({ isValid: true, errors: {} });
  });

  it('emitEvent() routes the widget handler to events$ like a user interaction', () => {
    const context = createContext({ name: 'Ada' });
    const events: string[] = [];
    context.events$.subscribe((event) => events.push(event.name));
    const pluginContext = attach(context);
    const widget = context.store.getState().calculatedWidgets['name'].current;

    pluginContext.emitEvent('change', widget as never);

    expect(events).toEqual(['nameChanged']);
    // `change` runs the validateOn-gated validation, which touches the control.
    expect(context.store.getState().touchedControls).toEqual({ name: true });
  });

  it('events$ and submit$ are read-only views of the context subjects', () => {
    const pluginContext = attach(createContext({ name: 'Ada' }));
    expect('next' in pluginContext.events$).toBe(false);
    expect('next' in pluginContext.submit$).toBe(false);
  });
});

describe('emitSubmitEvent', () => {
  it('returns whether the submit was emitted', () => {
    expect(createContext().emitSubmitEvent()).toBe(false);
    expect(createContext({ name: 'Ada' }).emitSubmitEvent()).toBe(true);
  });
});
