// @vitest-environment jsdom
import { defineForm, preloadFormWidgets } from '@golemui/core';
import type { WidgetErrorFallback } from '@golemui/react';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { GuiForm } from './components/Form';
import { widgetLoaders } from './widget.loaders';

function ThrowingWidget(): ReactNode {
  throw new Error('render failed');
}

const config = {
  formDef: defineForm({
    form: [{ uid: 'broken', kind: 'input', type: 'throwing', path: 'broken' }],
  }),
  customWidgetLoaders: { throwing: async () => ThrowingWidget },
};

const customFallback: WidgetErrorFallback = (error, widget) => (
  <p className="custom-fallback">
    {widget.type}[{widget.uid}]: {error.message}
  </p>
);

describe('the widgetErrorFallback prop of GuiForm', () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeAll(async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    // Preloaded widgets render in the first commit, inside act.
    await preloadFormWidgets({
      widgetLoaders: { grid: widgetLoaders.grid, ...config.customWidgetLoaders },
    });
  });

  beforeEach(() => {
    // React and the error boundary log the caught error, which is expected here.
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

  it('renders the fallback for a widget that threw', async () => {
    await act(async () =>
      root.render(<GuiForm config={config} widgetErrorFallback={customFallback} />),
    );

    expect(container.querySelector('.custom-fallback')?.textContent).toBe(
      'throwing[broken]: render failed',
    );
    expect(container.textContent).not.toContain('failed with:');
  });

  it('renders the default fallback without the prop', async () => {
    await act(async () => root.render(<GuiForm config={config} />));

    expect(container.textContent).toContain('Component throwing[broken] failed with:');
    expect(container.querySelector('.custom-fallback')).toBeNull();
  });
});
