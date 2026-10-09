// @vitest-environment jsdom
import { act, createElement, useState } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { resumeServerRendered } from '@golemui/lit-utils';
import { GuiTextinput } from '../../react';
import '../components/dropdown';
import type { GuiDropdown } from '../components/dropdown';
import '../components/list';
import '../components/textinput';

// Vitest resolves @lit/react's Node build, which never sets the properties or removes
// defer-hydration (it skips its layout effects). The browser build is what hydrates in a browser:
// it sits next to the Node build, which the package exports map only by condition.
vi.mock('@lit/react', async () => {
  const { createRequire } = await import('node:module');
  const { join } = await import('node:path');
  const nodeBuild = createRequire(import.meta.url).resolve('@lit/react');
  const packageDir = join('@lit', 'react');
  const root = nodeBuild.slice(0, nodeBuild.lastIndexOf(packageDir) + packageDir.length);
  return import(/* @vite-ignore */ join(root, 'development', 'index.js'));
});

/**
 * Client spec for the framework integrations: the markup the server spec produces, upgraded the
 * way each framework leaves it. Vue and Angular leave the elements to upgrade as soon as they are
 * defined, React holds them until it has hydrated.
 */

// Lit renders on the microtask schedule, so waiting one macrotask completes every
// nested first render.
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

// What renderElementsInHtml makes of <gui-textinput uid="email" label="Email" value="…">.
const serverTextinput = (holds = '') =>
  `<gui-textinput uid="email" label="Email" value="ada@example.com" class="gui-field" data-golemui-ssr${holds}>` +
  '<label class="gui-label" for="email" id="email_label">Email</label>' +
  '<div class="gui-widget"><input type="text" id="email" value="ada@example.com"></div>' +
  '</gui-textinput>';

describe('an element whose content the server rendered', () => {
  beforeAll(() => {
    // Lets React hydrate inside act() without warning.
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    // gui-list measures its viewport; jsdom has no ResizeObserver.
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
      },
    );
  });

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('replaces it on its first render, without a second copy', async () => {
    document.body.innerHTML = serverTextinput();
    await settle();

    expect(document.querySelectorAll('#email')).toHaveLength(1);
    expect(document.querySelectorAll('label[for="email"]')).toHaveLength(1);
    expect(document.querySelector('gui-textinput')?.hasAttribute('data-golemui-ssr')).toBe(false);
    expect((document.getElementById('email') as HTMLInputElement).value).toBe('ada@example.com');
  });

  it('keeps children it did not get from the server', async () => {
    document.body.innerHTML =
      '<gui-textinput uid="email"><span id="app-child"></span></gui-textinput>';
    await settle();

    expect(document.getElementById('app-child')).not.toBeNull();
    expect(document.querySelectorAll('#email')).toHaveLength(1);
  });

  it('hydrates in React without an error or a second copy, and keeps its content on updates', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const container = document.createElement('div');
    container.innerHTML = serverTextinput(' defer-hydration=""');
    document.body.append(container);

    let setLabel: (label: string) => void = () => undefined;
    function App() {
      const [label, update] = useState('Email');
      setLabel = update;
      return createElement(GuiTextinput, { uid: 'email', label, value: 'ada@example.com' });
    }
    await act(async () => {
      hydrateRoot(container, createElement(App), {
        onRecoverableError: (error) => console.error(error),
      });
    });
    await settle();

    expect(errorSpy).not.toHaveBeenCalled();
    expect(document.querySelector('gui-textinput')?.hasAttribute('defer-hydration')).toBe(false);
    expect(document.querySelectorAll('#email')).toHaveLength(1);

    const input = document.getElementById('email');
    await act(async () => setLabel('Work email'));
    await settle();
    expect(document.getElementById('email')).toBe(input);
    expect(document.querySelector('label[for="email"]')?.textContent).toContain('Work email');
    errorSpy.mockRestore();
  });
});

describe('a gui-list', () => {
  it('keeps the items of its server markup when it resumes', async () => {
    document.body.innerHTML =
      '<gui-list uid="l" defer-hydration><div role="option">A</div></gui-list>';
    resumeServerRendered();
    await settle();

    expect(document.querySelector('gui-list > [role="option"]')?.textContent).toBe('A');
  });
});

describe('a gui-dropdown', () => {
  it('replaces its server markup, inner list included, without a second copy', async () => {
    document.body.innerHTML =
      '<gui-dropdown uid="plan" label="Plan" value="team" class="gui-dropdown gui-field" data-golemui-ssr>' +
      '<label class="gui-label" for="plan" id="plan_label">Plan</label>' +
      '<div class="gui-widget"><input type="text" role="combobox" id="plan" value="team">' +
      '<button type="button" class="gui-dropdown__arrow"></button>' +
      '<div class="gui-picker__panel" hidden><gui-list id="plan-list" defer-hydration></gui-list></div>' +
      '</div></gui-dropdown>';
    await settle();

    const dropdown = document.querySelector<GuiDropdown>('gui-dropdown');
    expect(dropdown?.hasAttribute('data-golemui-ssr')).toBe(false);
    expect(document.querySelectorAll('#plan')).toHaveLength(1);
    expect(document.querySelectorAll('[id="plan-list"]')).toHaveLength(1);
    expect(document.querySelectorAll('label[for="plan"]')).toHaveLength(1);

    dropdown!.items = [{ label: 'Team', value: 'team' }];
    await settle();
    expect((document.getElementById('plan') as HTMLInputElement).value).toBe('Team');
  });
});
