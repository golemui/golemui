// @vitest-environment jsdom
import { preloadFormWidgets, type WithWidget } from '@golemui/core';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { FormComponent } from './FormComponent';
import { formData, noopValidators, stubWidgetLoaders } from './ssr.fixture';

type StubComponent = React.ComponentType<WithWidget>;

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
