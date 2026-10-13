import { type FormSubmitEvent, preloadFormWidgets } from '@golemui/core';
import { render } from 'ink-testing-library';
import { createRef } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { FormComponent, type FormComponentHandle } from './FormComponent';
import {
  buildInkConfig,
  buildMissingLoaderInkConfig,
  buildThrowingInkConfig,
  inkStubWidgetLoaders,
  inkWidgetErrorFallback,
  noopValidators,
  widgetErrorFallbackMarker,
} from './ink.fixture';

/** Every frame carries styling and cursor escape sequences, remove them before matching text. */
const withoutAnsiCodes = (frame: string | undefined) =>
  // eslint-disable-next-line no-control-regex -- every escape sequence starts with the escape control character
  (frame ?? '').replace(/\u001B\[[0-9;]*[A-Za-z]/g, '');

// Ink 7 needs React 19.2.
describe.skipIf(process.env.REACT18 === '1')('rendering a headless form under Ink', () => {
  beforeAll(async () => {
    // Preloaded widgets mount in the same commit as the form, which is the commit whose
    // `load` events the subscription order has to catch.
    await preloadFormWidgets({ widgetLoaders: inkStubWidgetLoaders });
  });

  it('delivers the load events emitted by the first commit', async () => {
    const receivedEventNames: string[] = [];
    const { unmount } = render(
      <FormComponent
        config={buildInkConfig()}
        validators={noopValidators}
        headless
        formEvent={(event) => receivedEventNames.push(event.name)}
      />,
    );

    await vi.waitFor(() => {
      expect(receivedEventNames).toContain('textLoaded');
      expect(receivedEventNames).toContain('buttonLoaded');
    });

    unmount();
  });

  it('submits the typed value when Enter is pressed on the focused button', async () => {
    const receivedSubmits: FormSubmitEvent[] = [];
    const { lastFrame, stdin, unmount } = render(
      <FormComponent
        config={buildInkConfig()}
        validators={noopValidators}
        headless
        formSubmit={(event) => receivedSubmits.push(event)}
      />,
    );

    // The first frame is written before the passive effects run, so the text input is not
    // focused yet. Wait for its focus marker, otherwise the typed characters go nowhere.
    await vi.waitFor(() => {
      expect(withoutAnsiCodes(lastFrame())).toContain('> First name:');
    });

    stdin.write('A');
    await vi.waitFor(() => {
      expect(withoutAnsiCodes(lastFrame())).toContain('First name: A');
    });

    stdin.write('b');
    await vi.waitFor(() => {
      expect(withoutAnsiCodes(lastFrame())).toContain('First name: Ab');
    });

    // Tab moves the focus to the button. Wait for the focus marker, otherwise Enter
    // arrives while the button still ignores input.
    stdin.write('\t');
    await vi.waitFor(() => {
      expect(withoutAnsiCodes(lastFrame())).toContain('> [Send]');
    });

    stdin.write('\r');
    await vi.waitFor(() => {
      expect(receivedSubmits).toHaveLength(1);
    });
    expect(receivedSubmits[0].data.firstName).toBe('Ab');

    unmount();
  });

  it('renders the injected widget error fallback for a widget that threw', async () => {
    // The error boundary logs the caught error, which is expected noise here.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const { lastFrame, unmount } = render(
        <FormComponent
          config={buildThrowingInkConfig()}
          validators={noopValidators}
          headless
          widgetErrorFallback={inkWidgetErrorFallback}
        />,
      );

      await vi.waitFor(() => {
        const frame = withoutAnsiCodes(lastFrame());
        expect(frame).toContain(widgetErrorFallbackMarker);
        expect(frame).toContain('First name: Ada');
      });

      unmount();
    } finally {
      consoleError.mockRestore();
    }
  });

  it('keeps the form on screen when the form health turns errored and no boundary is passed', async () => {
    // The health error is logged on purpose, the spec asserts on it.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const { lastFrame, unmount } = render(
        <FormComponent
          config={buildMissingLoaderInkConfig()}
          validators={noopValidators}
          headless
        />,
      );

      await vi.waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'GolemUI form failed to initialize:',
          expect.stringContaining('"missing"'),
        );
      });
      expect(withoutAnsiCodes(lastFrame())).toContain('First name: Ada');

      unmount();
    } finally {
      consoleError.mockRestore();
    }
  });

  it('renders nothing for a widget that threw when no fallback is passed', async () => {
    // The error boundary logs the caught error, which is expected noise here.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const { lastFrame, unmount } = render(
        <FormComponent config={buildThrowingInkConfig()} validators={noopValidators} headless />,
      );

      await vi.waitFor(() => {
        expect(withoutAnsiCodes(lastFrame())).toContain('First name: Ada');
      });
      expect(withoutAnsiCodes(lastFrame())).not.toContain(widgetErrorFallbackMarker);

      unmount();
    } finally {
      consoleError.mockRestore();
    }
  });

  it('shows the new value after setData is called through the ref handle', async () => {
    const handle = createRef<FormComponentHandle>();
    const { lastFrame, unmount } = render(
      <FormComponent ref={handle} config={buildInkConfig()} validators={noopValidators} headless />,
    );

    await vi.waitFor(() => {
      expect(withoutAnsiCodes(lastFrame())).toContain('First name:');
    });

    handle.current?.setData({ firstName: 'Grace' });

    await vi.waitFor(() => {
      expect(withoutAnsiCodes(lastFrame())).toContain('First name: Grace');
    });

    unmount();
  });

  it('logs nothing on the error console, because headless renders no DOM element', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const { lastFrame, unmount } = render(
        <FormComponent config={buildInkConfig()} validators={noopValidators} headless />,
      );

      await vi.waitFor(() => {
        expect(withoutAnsiCodes(lastFrame())).toContain('[Send]');
      });

      expect(consoleError).not.toHaveBeenCalled();

      unmount();
    } finally {
      consoleError.mockRestore();
    }
  });
});
