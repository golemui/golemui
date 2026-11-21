// @vitest-environment jsdom
import { type Action, type Middleware, preloadFormWidgets, type State } from '@golemui/core';
import { type GuiFormInitConfig } from '@golemui/gui-shared';
import { type FormComponentHandle } from '@golemui/react';
import { act, useEffect, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { GuiForm } from './components/Form';
import { widgetLoaders } from './widget.loaders';

// Vitest resolves the Node build of @lit/react, which never sets the properties of an element.
// The browser build is in the same package folder, and only an export condition selects it.
vi.mock('@lit/react', async () => {
  const { createRequire } = await import('node:module');
  const { join } = await import('node:path');
  const nodeBuild = createRequire(import.meta.url).resolve('@lit/react');
  const packageDir = join('@lit', 'react');
  const root = nodeBuild.slice(0, nodeBuild.lastIndexOf(packageDir) + packageDir.length);
  return import(/* @vite-ignore */ join(root, 'development', 'index.js'));
});

const actionsOfStores = new Map<string, Action[]>();

// A store calls the outer function one time, when it is created.
const recordActionsOf =
  (customer: string): Middleware<State, Action> =>
  () => {
    const actions: Action[] = [];
    actionsOfStores.set(customer, actions);
    return (next) => (action) => {
      actions.push(action);
      next(action);
    };
  };

const customerConfig = (customer: string): GuiFormInitConfig => ({
  formName: 'customer',
  formDef: {
    form: [
      {
        kind: 'input',
        type: 'textinput',
        uid: 'firstName',
        path: 'firstName',
        label: 'First name',
        validator: { type: 'string' },
        props: { placeholder: 'firstName' },
      },
    ],
  },
  data: { firstName: customer },
  middlewares: [recordActionsOf(customer)],
});

/** Fills in a saved draft from an effect each time it shows the form of another customer. */
function Host({ config, draft }: { config: GuiFormInitConfig; draft?: Record<string, unknown> }) {
  const formRef = useRef<FormComponentHandle>(null);
  useEffect(() => {
    if (draft) {
      formRef.current?.setData(draft);
    }
  }, [config, draft]);
  return <GuiForm ref={formRef} config={config} />;
}

describe('a GuiForm with a new config object', () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeAll(async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    // Preloaded widgets render in the first commit, inside act.
    await preloadFormWidgets({
      widgetLoaders: { grid: widgetLoaders.grid, textinput: widgetLoaders.textinput },
    });
  });

  beforeEach(() => {
    actionsOfStores.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it('shows the draft that a useEffect of the host sets with setData after the new config', async () => {
    await act(async () => root.render(<Host config={customerConfig('Ada')} />));
    const oldStoreActionCount = actionsOfStores.get('Ada')?.length;

    await act(async () =>
      root.render(<Host config={customerConfig('Grace')} draft={{ firstName: 'Linus' }} />),
    );

    const firstNameInput = container.querySelector<HTMLElement & { value?: string }>(
      'gui-textinput',
    );
    expect(firstNameInput?.value).toBe('Linus');
    expect(actionsOfStores.get('Ada')?.slice(oldStoreActionCount)).toEqual([]);
  });
});
