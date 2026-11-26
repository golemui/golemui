// @vitest-environment jsdom
import { preloadFormWidgets } from '@golemui/core';
import { type GuiFormInitConfig } from '@golemui/gui-shared';
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
  formDef: {
    form: [
      { kind: 'display', type: 'alert', props: { text: 'Rendered on the server' } },
      {
        kind: 'layout',
        type: 'tabs',
        props: {
          tabs: [
            { label: 'Shipping', uid: 'shipping' },
            { label: 'Billing', uid: 'billing' },
          ],
          renderMode: 'all',
        },
        children: [
          {
            kind: 'layout',
            type: 'grid',
            uid: 'shipping',
            props: { direction: 'column' },
            children: [{ kind: 'display', type: 'alert', props: { text: 'Shipping panel' } }],
          },
          {
            kind: 'layout',
            type: 'grid',
            uid: 'billing',
            props: { direction: 'column' },
            children: [{ kind: 'display', type: 'alert', props: { text: 'Billing panel' } }],
          },
        ],
      },
      // A plain <button> React renders, which gui-menu-button gives aria-haspopup once it connects: its
      // React wrapper holds that until React has hydrated.
      {
        kind: 'action',
        type: 'menuButton',
        uid: 'rowActions',
        label: 'Actions',
        props: {
          items: [
            { label: 'Edit', value: 'edit' },
            { label: 'Delete', value: 'delete' },
          ],
          tooltip: 'Edit or delete the row',
        },
      },
      // gui-tooltip names itself and its target's description on connect: the adapter renders
      // both, so the server markup already has them.
      {
        kind: 'action',
        type: 'button',
        uid: 'deleteRow',
        props: { icon: 'delete', ariaLabel: 'Delete', tooltip: 'Deletes the row' },
      },
    ],
  },
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
    expect(target.querySelector('#hydration-rowActions_menu')?.getAttribute('role')).toBe('menu');
    expect(target.querySelector('#hydration-rowActions')?.getAttribute('aria-haspopup')).toBe(
      'menu',
    );
    for (const uid of ['rowActions', 'deleteRow']) {
      const tooltip = target.querySelector(`#hydration-${uid}_tooltip`);
      expect(tooltip?.getAttribute('role'), uid).toBe('tooltip');
      expect(target.querySelector(`#hydration-${uid}`)?.getAttribute('aria-describedby'), uid).toBe(
        `hydration-${uid}_tooltip`,
      );
    }
  });

  it('server renders a sidebar with its side child once, and hydrates', async () => {
    const messages: string[] = [];
    vi.spyOn(console, 'error').mockImplementation((...args) => messages.push(args.join(' ')));
    const sidebarConfig: GuiFormInitConfig = {
      formName: 'shell',
      formDef: {
        form: [
          {
            uid: 'layout',
            kind: 'layout',
            type: 'sidebar',
            children: [
              {
                uid: 'nav',
                kind: 'action',
                type: 'menu',
                label: 'Main',
                props: {
                  current: 'billing',
                  items: [
                    { label: 'Orders', value: 'orders' },
                    {
                      label: 'Settings',
                      value: 'settings',
                      items: [{ label: 'Billing', value: 'billing' }],
                    },
                  ],
                },
              },
              { uid: 'notes', kind: 'input', type: 'textarea', path: 'notes', label: 'Notes' },
            ],
          },
        ],
      },
    };

    container = document.createElement('div');
    container.innerHTML = renderToString(<GuiForm config={sidebarConfig} />);
    document.body.append(container);
    const ids = Array.from(container.querySelectorAll('[id]'), (element) => element.id);
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
    expect(ids).toContain('shell-nav_group_settings');
    expect(ids.filter((id) => id.includes('drawer'))).toEqual([]);
    const side = container.querySelector('aside.gui-sidebar__side') as HTMLElement;
    expect(side.id).toBe('shell-layout_side');
    expect(side.hasAttribute('popover')).toBe(true);
    expect(container.querySelector('.gui-sidebar__toggle')?.getAttribute('popovertarget')).toBe(
      'shell-layout_side',
    );

    const target = container;
    await act(async () => {
      root = hydrateRoot(target, <GuiForm config={sidebarConfig} />, {
        onRecoverableError: (error) => messages.push(String(error)),
      });
    });

    expect(messages).toEqual([]);
    const after = Array.from(target.querySelectorAll('[id]'), (element) => element.id);
    expect(after.filter((id, index) => after.indexOf(id) !== index)).toEqual([]);
  });
});
