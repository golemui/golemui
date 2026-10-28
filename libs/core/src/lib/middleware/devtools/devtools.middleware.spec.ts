import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFormStore } from '../../form-store';
import { identityTranslator } from '../../i18n';
import { type Action } from '../../store/actions';
import { type State } from '../../store/model';
import { devToolsMiddleware } from './devtools.middleware';

/**
 * Runs the middleware with a fake browser extension. The spec environment is node, so each test
 * sets the `window` global it needs.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/middleware/devtools/devtools.middleware.spec.ts
 */

const acceptEveryValue = () => ({
  '~standard': { version: 1 as const, vendor: 'test', validate: (value: unknown) => ({ value }) },
});

const makeStore = (name?: string) =>
  createFormStore(
    [devToolsMiddleware(name)],
    acceptEveryValue,
    'eager',
    identityTranslator('en-US'),
  );

const makeFakeExtension = () => {
  const connection = { init: vi.fn(), send: vi.fn() };
  const extension = { connect: vi.fn(() => connection) };
  return { extension, connection };
};

describe('devToolsMiddleware', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('passes actions to the reducer when there is no window', () => {
    vi.stubGlobal('window', undefined);
    const store = makeStore();

    store.dispatch({ type: 'SET_META', payload: { meta: { mode: 'dev' } } });

    expect(store.getState().meta).toEqual({ mode: 'dev' });
  });

  it('passes actions to the reducer when the window has no extension', () => {
    vi.stubGlobal('window', {});
    const store = makeStore();

    store.dispatch({ type: 'SET_META', payload: { meta: { mode: 'dev' } } });

    expect(store.getState().meta).toEqual({ mode: 'dev' });
  });

  it('connects with the default name and sends the state at creation', () => {
    const { extension, connection } = makeFakeExtension();
    vi.stubGlobal('window', { __REDUX_DEVTOOLS_EXTENSION__: extension });

    const store = makeStore();

    expect(extension.connect).toHaveBeenCalledTimes(1);
    expect(extension.connect).toHaveBeenCalledWith({ name: 'GolemUI Form Store' });
    expect(connection.init).toHaveBeenCalledTimes(1);
    expect(connection.init).toHaveBeenCalledWith(store.getState());
  });

  it('connects with a custom name', () => {
    const { extension } = makeFakeExtension();
    vi.stubGlobal('window', { __REDUX_DEVTOOLS_EXTENSION__: extension });

    makeStore('Checkout form');

    expect(extension.connect).toHaveBeenCalledWith({ name: 'Checkout form' });
  });

  it('sends every action with the state after the reducer ran', () => {
    const { extension, connection } = makeFakeExtension();
    vi.stubGlobal('window', { __REDUX_DEVTOOLS_EXTENSION__: extension });
    const store = makeStore();
    const first: Action = { type: 'SET_META', payload: { meta: { mode: 'dev' } } };
    const second: Action = { type: 'SET_LANGUAGE', payload: { lang: 'fr-FR' } };

    store.dispatch(first);
    const afterFirst = store.getState();
    store.dispatch(second);

    expect(connection.send).toHaveBeenCalledTimes(2);
    expect(connection.send.mock.calls[0][0]).toBe(first);
    expect(connection.send.mock.calls[0][1]).toBe(afterFirst);
    expect(connection.send.mock.calls[0][1].meta).toEqual({ mode: 'dev' });
    expect(connection.send.mock.calls[1][0]).toBe(second);
    expect(connection.send.mock.calls[1][1]).toBe(store.getState());
    expect(connection.send.mock.calls[1][1].lang).toBe('fr-FR');
  });

  it('sends a state that JSON.stringify can serialize', () => {
    const { extension, connection } = makeFakeExtension();
    vi.stubGlobal('window', { __REDUX_DEVTOOLS_EXTENSION__: extension });
    const store = makeStore();

    store.dispatch({
      type: 'INITIALIZE',
      payload: {
        formName: 'test',
        formDef: {
          form: [
            { uid: 'name', kind: 'input', type: 'textinput', path: 'name' },
            {
              uid: 'users',
              kind: 'input',
              type: 'repeater',
              path: 'users',
              props: {
                template: {
                  uid: 'userRow',
                  kind: 'layout',
                  type: 'flex',
                  children: [
                    { uid: 'n', kind: 'input', type: 'textinput', path: 'users.items.name' },
                  ],
                },
              },
            },
          ],
        },
      },
    });
    store.dispatch({
      type: 'SET_DATA',
      payload: { data: { name: 'Ada', users: [{ name: 'x' }] } },
    });

    const sentState = connection.send.mock.calls.at(-1)?.[1] as State;
    expect(() => JSON.stringify(sentState)).not.toThrow();
    expect(JSON.parse(JSON.stringify(sentState)).data.name).toBe('Ada');
  });
});
