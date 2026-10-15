// @vitest-environment jsdom
import { preloadFormWidgets } from '@golemui/core';
import { gui, type GuiFormInitConfig } from '@golemui/gui-shared';
import { act } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { GuiForm } from './components/Form';
import { widgetLoaders } from './widget.loaders';

// Vitest resolves @lit/react's Node build, which skips the layout effects the browser build runs
// on hydration. The browser build sits next to it, mapped only by export condition.
vi.mock('@lit/react', async () => {
  const { createRequire } = await import('node:module');
  const { join } = await import('node:path');
  const nodeBuild = createRequire(import.meta.url).resolve('@lit/react');
  const packageDir = join('@lit', 'react');
  const root = nodeBuild.slice(0, nodeBuild.lastIndexOf(packageDir) + packageDir.length);
  return import(/* @vite-ignore */ join(root, 'development', 'index.js'));
});

// The widgets the adapter renders as plain gui-* tags: no React wrapper holds them with
// defer-hydration, so they upgrade, and add their ARIA attributes, before React hydrates.
const config: GuiFormInitConfig = {
  formName: 'hydration',
  formDef: [
    gui.displays.alert({ text: 'Rendered on the server' }),
    gui.layouts.tabs([
      { label: 'Shipping', children: [gui.displays.alert({ text: 'Shipping panel' })] },
      { label: 'Billing', children: [gui.displays.alert({ text: 'Billing panel' })] },
    ]),
  ],
};

describe('hydrating a server-rendered form', () => {
  let root: Root | undefined;
  let container: HTMLDivElement | undefined;

  beforeAll(async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
      },
    );
    // As an app does before hydrateRoot: the elements are defined by the time React hydrates.
    await preloadFormWidgets({ widgetLoaders });
  }, 30_000);

  afterEach(async () => {
    const mounted = root;
    if (mounted) await act(async () => mounted.unmount());
    container?.remove();
    root = undefined;
    vi.restoreAllMocks();
  });

  it('reports no mismatch for the elements that upgrade before React hydrates', async () => {
    const messages: string[] = [];
    vi.spyOn(console, 'error').mockImplementation((...args) => messages.push(args.join(' ')));

    container = document.createElement('div');
    container.innerHTML = renderToString(<GuiForm config={config} />);
    document.body.append(container);
    // The upgraded elements keep their attributes: the server markup must already have them.
    expect(container.querySelector('gui-alert')?.getAttribute('role')).toBe('alert');
    expect(container.querySelector('gui-tab-list')?.getAttribute('role')).toBe('tablist');

    const target = container;
    await act(async () => {
      root = hydrateRoot(target, <GuiForm config={config} />, {
        onRecoverableError: (error) => messages.push(String(error)),
      });
    });

    expect(messages).toEqual([]);
  });
});
