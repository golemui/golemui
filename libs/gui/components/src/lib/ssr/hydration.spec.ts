// @vitest-environment jsdom
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { resumeServerRendered } from '@golemui/lit-utils';
import serverMarkup from './goldens/server-markup.html?raw';
import './ssr.fixture';

/**
 * Resume spec: loads the server markup (asserted by the server render spec) into the DOM,
 * verifies the defer-hydration hold, and verifies that resumeServerRendered replaces the
 * content the elements render with one live render while the app's children stay.
 */

// Lit renders on the microtask schedule, so waiting one macrotask completes every
// nested first render.
const afterLitRenderSchedule = () => new Promise((resolve) => setTimeout(resolve, 0));

const settle = async () => {
  await afterLitRenderSchedule();
  await afterLitRenderSchedule();
};

describe('resuming server-rendered standalone elements', () => {
  beforeAll(() => {
    // gui-tabs watches its size for the scroll shadows; jsdom has no ResizeObserver.
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
    document.body.innerHTML = serverMarkup;
  });

  it('holds the server markup unchanged while defer-hydration is present', async () => {
    const before = document.body.innerHTML;
    await settle();
    expect(document.body.innerHTML).toBe(before);
  });

  it('replaces the rendered content with one live render, without copies', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    resumeServerRendered();
    await settle();

    expect(document.querySelectorAll('[defer-hydration]')).toHaveLength(0);
    for (const id of ['email', 'plan', 'terms']) {
      expect(document.querySelectorAll(`#${id}`), id).toHaveLength(1);
      expect(document.querySelectorAll(`label[for="${id}"]`), id).toHaveLength(1);
    }
    expect((document.getElementById('email') as HTMLInputElement).value).toBe('ada@example.com');
    expect((document.getElementById('plan') as HTMLSelectElement).value).toBe('team');
    expect((document.getElementById('terms') as HTMLInputElement).checked).toBe(true);

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("keeps the app's children and runs the held connectedCallback", async () => {
    resumeServerRendered();
    await settle();

    const alert = document.querySelector('gui-alert') as HTMLElement;
    expect(alert.textContent).toBe('Yearly billing saves two months.');
    expect(alert.getAttribute('role')).toBe('alert');

    const tab = document.querySelector('gui-tab') as HTMLElement;
    expect(tab.textContent).toBe('Billing');
    expect(tab.getAttribute('role')).toBe('tab');
    expect(document.querySelector('gui-tab-panel')?.getAttribute('role')).toBe('tabpanel');
    expect(document.querySelector('gui-tab-panel > gui-select')).not.toBeNull();
  });

  it('accepts user input after the resume', async () => {
    resumeServerRendered();
    await settle();

    const element = document.querySelector('gui-textinput') as HTMLElement & { value?: string };
    const input = document.getElementById('email') as HTMLInputElement;
    input.value = 'grace@example.com';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(element.value).toBe('grace@example.com');
  });

  it('resumes only the elements under the root it is given', async () => {
    const textinput = document.querySelector('gui-textinput') as HTMLElement;
    resumeServerRendered(textinput);
    await settle();

    expect(textinput.hasAttribute('defer-hydration')).toBe(false);
    expect(document.querySelectorAll('#email')).toHaveLength(1);
    expect(document.querySelector('gui-select')?.hasAttribute('defer-hydration')).toBe(true);
  });
});
