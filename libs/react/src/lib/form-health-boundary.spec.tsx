// @vitest-environment jsdom
import { type FormHealth, preloadFormWidgets, type WithWidget } from '@golemui/core';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { FormComponent } from './FormComponent';
import type { FormHealthBoundaryProps } from './FormHealthBoundary';
import { buildConfig, formData, noopValidators, stubWidgetLoaders } from './ssr.fixture';

type StubComponent = React.ComponentType<WithWidget>;

const duplicateUidFormDef = {
  form: {
    uid: 'root',
    kind: 'layout',
    type: 'flex',
    children: [
      { uid: 'same', kind: 'input', type: 'textinput', path: 'firstName' },
      { uid: 'same', kind: 'input', type: 'textinput', path: 'lastName' },
    ],
  },
};

const duplicateUidMessage =
  '[21] Duplicate UID "same": Assigned to widget "textinput" at "firstName" and "textinput" at "lastName".';

describe('the default form health boundary', () => {
  let root: Root;
  let container: HTMLDivElement;
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeAll(async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders });
  });

  beforeEach(() => {
    // The errored health is logged, which is expected here.
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    consoleError.mockRestore();
  });

  it('keeps the form DOM and the focus when the health changes to errored', async () => {
    let rejectLoad: (error: Error) => void = () => undefined;
    const failingLoader = () =>
      new Promise<StubComponent>((_resolve, reject) => {
        rejectLoad = reject;
      });
    const config = {
      formDef: {
        form: {
          uid: 'root',
          kind: 'layout',
          type: 'flex',
          children: [
            { kind: 'input', type: 'textinput', path: 'firstName', label: 'First name' },
            { kind: 'input', type: 'failing', path: 'lastName', label: 'Last name' },
          ],
        },
      },
      widgetLoaders: { ...stubWidgetLoaders, failing: failingLoader },
      data: formData,
    };

    await act(async () => {
      root.render(<FormComponent config={config} validators={noopValidators} />);
    });
    const form = container.querySelector('form');
    const input = container.querySelector<HTMLInputElement>('input[name="firstName"]');
    input?.focus();
    expect(document.activeElement).toBe(input);

    await act(async () => rejectLoad(new Error('network down')));

    expect(container.querySelector('.gui-form-health-error')).not.toBeNull();
    expect(container.querySelector('form')).toBe(form);
    expect(container.querySelector('input[name="firstName"]')).toBe(input);
    expect(document.activeElement).toBe(input);
  });
});

describe('the health of a form with an invalid definition', () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeAll(async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders });
  });

  beforeEach(() => {
    // The errored health is logged, which is expected here.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  it('reports only the errored health at mount', async () => {
    const healths: FormHealth[] = [];

    await act(async () => {
      root.render(
        <FormComponent
          config={{ ...buildConfig(), formDef: duplicateUidFormDef }}
          validators={noopValidators}
          formHealth={(health) => healths.push(health)}
        />,
      );
    });

    expect(healths).toEqual([{ status: 'errored', code: 21, message: duplicateUidMessage }]);
  });

  it('removes the default banner when a new config has a valid definition', async () => {
    const validConfig = buildConfig();
    await act(async () => {
      root.render(
        <FormComponent
          config={{ ...validConfig, formDef: duplicateUidFormDef }}
          validators={noopValidators}
        />,
      );
    });
    const banner = container.querySelector('.gui-form-health-error');
    expect(banner?.getAttribute('role')).toBe('alert');
    expect(banner?.textContent).toContain(duplicateUidMessage);

    await act(async () => {
      root.render(<FormComponent config={validConfig} validators={noopValidators} />);
    });

    expect(container.querySelector('.gui-form-health-error')).toBeNull();
    expect(container.querySelector<HTMLInputElement>('input[name="firstName"]')?.value).toBe('Ada');
  });

  it('passes the health to a custom boundary and keeps the form mounted', async () => {
    const receivedHealths: FormHealth[] = [];
    function CustomBoundary({ health, children }: FormHealthBoundaryProps) {
      receivedHealths.push(health);
      return (
        <section className="custom-boundary">
          {health.status === 'errored' ? <p className="custom-error">{health.message}</p> : null}
          {children}
        </section>
      );
    }
    const validConfig = buildConfig();

    await act(async () => {
      root.render(
        <FormComponent
          config={validConfig}
          validators={noopValidators}
          formHealthBoundary={CustomBoundary}
        />,
      );
    });
    const form = container.querySelector('.custom-boundary form');
    expect(form).not.toBeNull();
    expect(receivedHealths.at(-1)).toEqual({ status: 'ok' });

    await act(async () => {
      root.render(
        <FormComponent
          config={{ ...validConfig, formDef: duplicateUidFormDef }}
          validators={noopValidators}
          formHealthBoundary={CustomBoundary}
        />,
      );
    });

    expect(receivedHealths.at(-1)).toEqual({
      status: 'errored',
      code: 21,
      message: duplicateUidMessage,
    });
    expect(container.querySelector('.custom-error')?.textContent).toBe(duplicateUidMessage);
    expect(container.querySelector('.custom-boundary form')).toBe(form);
    expect(container.querySelector('.gui-form-health-error')).toBeNull();
  });
});
