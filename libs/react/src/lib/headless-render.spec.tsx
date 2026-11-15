import { type FormHealth, type FormSubmitEvent, preloadFormWidgets } from '@golemui/core';
import { createElement, createRef, useEffect, useRef, useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { FormComponent, type FormComponentHandle } from './FormComponent';
import {
  buildFormConfig,
  buildMissingLoaderConfig,
  buildThrowingWidgetConfig,
  noopValidators,
  stubWidgetErrorFallback,
  stubWidgetHostTypes,
  stubWidgetLoaders,
} from './headless.fixture';
import { type RootKind, renderToObjects } from './object-renderer.fixture';

// The renderer is built on react-reconciler 0.31, which needs React 19.
describe.skipIf(process.env.REACT18 === '1')('rendering a headless form without a DOM', () => {
  beforeAll(async () => {
    // Preloaded widgets mount in the same commit as the form, which is the commit whose
    // `load` events the subscription order has to catch.
    await preloadFormWidgets({ widgetLoaders: stubWidgetLoaders });
  });

  describe.each<RootKind>(['legacy', 'concurrent'])('in a %s root', (rootKind) => {
    it('delivers the load events emitted by the first commit', async () => {
      const receivedEventNames: string[] = [];
      const rendered = await renderToObjects(
        <FormComponent
          config={buildFormConfig()}
          validators={noopValidators}
          headless
          formEvent={(event) => receivedEventNames.push(event.name)}
        />,
        rootKind,
      );

      expect(receivedEventNames).toContain('textLoaded');
      expect(receivedEventNames).toContain('buttonLoaded');

      await rendered.unmount();
    });

    it('submits the typed value when the submit button is pressed', async () => {
      const receivedSubmits: FormSubmitEvent[] = [];
      const rendered = await renderToObjects(
        <FormComponent
          config={buildFormConfig()}
          validators={noopValidators}
          headless
          formSubmit={(event) => receivedSubmits.push(event)}
        />,
        rootKind,
      );

      await rendered.act(() => rendered.findByType('stub-input').props.onType('Ab'));
      expect(rendered.findByType('stub-input').props.value).toBe('Ab');

      await rendered.act(() => rendered.findByType('stub-button').props.onPress());
      expect(receivedSubmits).toHaveLength(1);
      expect(receivedSubmits[0].data.firstName).toBe('Ab');

      await rendered.unmount();
    });

    it('renders the injected widget error fallback for a widget that threw', async () => {
      // The error boundary logs the caught error, which is expected here.
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      try {
        const rendered = await renderToObjects(
          <FormComponent
            config={buildThrowingWidgetConfig()}
            validators={noopValidators}
            headless
            widgetErrorFallback={stubWidgetErrorFallback}
          />,
          rootKind,
        );

        expect(rendered.findByType('stub-fallback').props.widgetType).toBe('throwing');
        expect(rendered.findByType('stub-input').props.value).toBe('Ada');

        await rendered.unmount();
      } finally {
        consoleError.mockRestore();
      }
    });

    it('keeps the widget tree when the form health turns errored and no boundary is passed', async () => {
      // The health error is logged on purpose, the spec asserts on it.
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      try {
        const rendered = await renderToObjects(
          <FormComponent
            config={buildMissingLoaderConfig()}
            validators={noopValidators}
            headless
          />,
          rootKind,
        );

        expect(consoleError).toHaveBeenCalledWith(
          'GolemUI form failed to initialize:',
          expect.stringContaining('"missing"'),
        );
        expect(rendered.findByType('stub-input').props.value).toBe('Ada');

        await rendered.unmount();
      } finally {
        consoleError.mockRestore();
      }
    });

    it('renders nothing for a widget that threw when no fallback is passed', async () => {
      // The error boundary logs the caught error, which is expected here.
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      try {
        const rendered = await renderToObjects(
          <FormComponent
            config={buildThrowingWidgetConfig()}
            validators={noopValidators}
            headless
          />,
          rootKind,
        );

        expect([...rendered.hostTypes()].sort()).toEqual(['stub-grid', 'stub-input']);

        await rendered.unmount();
      } finally {
        consoleError.mockRestore();
      }
    });

    it('renders the new value after setData is called through the ref handle', async () => {
      const handle = createRef<FormComponentHandle>();
      const rendered = await renderToObjects(
        <FormComponent
          ref={handle}
          config={buildFormConfig()}
          validators={noopValidators}
          headless
        />,
        rootKind,
      );

      await rendered.act(() => handle.current?.setData({ firstName: 'Grace' }));

      expect(rendered.findByType('stub-input').props.value).toBe('Grace');

      await rendered.unmount();
    });

    it('renders the draft that a useEffect of the host sets with setData after a new config', async () => {
      const firstConfig = buildFormConfig();
      const nextConfig = { ...buildFormConfig(), data: { firstName: 'Ada' } };
      function Host() {
        const [config, setConfig] = useState(firstConfig);
        const formRef = useRef<FormComponentHandle>(null);
        useEffect(() => {
          if (config === nextConfig) {
            formRef.current?.setData({ firstName: 'Grace' });
          }
        }, [config]);
        return (
          <>
            {createElement('stub-next-customer', { onPress: () => setConfig(nextConfig) })}
            <FormComponent ref={formRef} config={config} validators={noopValidators} headless />
          </>
        );
      }
      const rendered = await renderToObjects(<Host />, rootKind);

      await rendered.act(() => rendered.findByType('stub-next-customer').props.onPress());

      expect(rendered.findByType('stub-input').props.value).toBe('Grace');

      await rendered.unmount();
    });

    it('emits the start health of the new form before the health that a useEffect of the host sets after a new config', async () => {
      // The form logs an errored health, which is expected here.
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const draftError: FormHealth = {
        status: 'errored',
        message: 'The draft could not be loaded',
        code: 1001,
      };
      const healths: FormHealth[] = [];
      const firstConfig = buildFormConfig();
      const nextConfig = buildFormConfig();
      function Host() {
        const [config, setConfig] = useState(firstConfig);
        const formRef = useRef<FormComponentHandle>(null);
        useEffect(() => {
          if (config === nextConfig) {
            formRef.current?.setHealth(draftError);
          }
        }, [config]);
        return (
          <>
            {createElement('stub-next-customer', { onPress: () => setConfig(nextConfig) })}
            <FormComponent
              ref={formRef}
              config={config}
              validators={noopValidators}
              formHealth={(health) => {
                healths.push(health);
              }}
              headless
            />
          </>
        );
      }
      try {
        const rendered = await renderToObjects(<Host />, rootKind);

        await rendered.act(() => rendered.findByType('stub-next-customer').props.onPress());

        expect(healths).toEqual([{ status: 'ok' }, { status: 'ok' }, draftError]);

        await rendered.unmount();
      } finally {
        consoleError.mockRestore();
      }
    });

    it('renders only the stub elements and logs nothing', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      try {
        const rendered = await renderToObjects(
          <FormComponent config={buildFormConfig()} validators={noopValidators} headless />,
          rootKind,
        );

        expect([...rendered.hostTypes()].sort()).toEqual([...stubWidgetHostTypes].sort());
        expect(consoleError).not.toHaveBeenCalled();

        await rendered.unmount();
      } finally {
        consoleError.mockRestore();
      }
    });
  });
});
