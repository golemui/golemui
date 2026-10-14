import type { FormEvent, FormSubmitEvent } from '@golemui/core';
import type { GuiFormInitConfig } from '@golemui/gui-shared';
import { render as inkRender } from 'ink';
import { render } from 'ink-testing-library';
import { EventEmitter } from 'node:events';
import { GuiForm } from '../components/Form';
import { stripAnsi } from './strip-ansi';

// Built from the escape character code so no source line carries a literal control character.
const ESCAPE_CHARACTER = String.fromCharCode(27);

/** Keys the specs send through the fake stdin. */
export const keys = {
  tab: '\t',
  enter: '\r',
  space: ' ',
  backspace: String.fromCharCode(127),
  delete: `${ESCAPE_CHARACTER}[3~`,
  escape: ESCAPE_CHARACTER,
  shiftTab: `${ESCAPE_CHARACTER}[Z`,
  up: `${ESCAPE_CHARACTER}[A`,
  down: `${ESCAPE_CHARACTER}[B`,
  right: `${ESCAPE_CHARACTER}[C`,
  left: `${ESCAPE_CHARACTER}[D`,
  home: `${ESCAPE_CHARACTER}[H`,
  end: `${ESCAPE_CHARACTER}[F`,
  pageUp: `${ESCAPE_CHARACTER}[5~`,
  pageDown: `${ESCAPE_CHARACTER}[6~`,
};

/**
 * Wraps a text in the markers a terminal sends around a paste when bracketed paste is on.
 *
 * @param text - The pasted text.
 * @returns The bytes to write to the fake stdin.
 *
 * @example
 * await form.press(bracketedPaste('joan@example.com\n'));
 */
export function bracketedPaste(text: string): string {
  return `${ESCAPE_CHARACTER}[200~${text}${ESCAPE_CHARACTER}[201~`;
}

/**
 * Lets Ink flush its render and the form focus effects.
 *
 * The first focus is given in a mount effect, so the very first frame shows no focused field.
 * Every spec waits once before it reads a frame or sends a key.
 */
export function tick(milliseconds = 20): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Waits until two consecutive polls return the same non-empty frame.
 *
 * Widgets are loaded through dynamic imports and focus is applied in an effect, so a key sent
 * too early is dropped by a widget that has not registered its input handler yet.
 */
async function waitForStableFrame(readFrame: () => string, attempts = 100): Promise<void> {
  let previous = readFrame();
  for (let attempt = 0; attempt < attempts; attempt++) {
    await tick();
    const current = readFrame();
    if (current !== '' && current === previous) {
      return;
    }
    previous = current;
  }
}

/**
 * Returns the frame line that holds the focus, with every run of spaces collapsed to one.
 *
 * Every focusable widget draws the focus marker in front of its value, so one line of the frame is
 * enough to name the focused widget in a tab order assertion.
 *
 * @param frame - A frame without escape sequences, from `frame()`.
 * @returns The focused line, or an empty string when no widget holds the focus.
 *
 * @example
 * expect(focusedLine(form.frame())).toBe('> [ Save ]');
 */
export function focusedLine(frame: string): string {
  const focused = frame.split('\n').find((line) => line.includes('> '));
  if (focused === undefined) {
    return '';
  }
  return focused.replace(/\s+/g, ' ').trim();
}

/**
 * Renders a GuiForm into Ink's testing renderer and waits for the first stable frame.
 *
 * @param config - The form config, usually just `{ formDef }`.
 * @param formSubmit - Receives the submit event, normally a spy.
 * @param formEvent - Receives the events a widget declares under `on`, normally a spy.
 * @returns The Ink testing instance plus `frame()` (ANSI stripped) and `press()`.
 *
 * @example
 * const form = await renderForm({ formDef });
 * await form.press('joan@example.com');
 * expect(form.frame()).toContain('joan@example.com');
 */
export async function renderForm(
  config: GuiFormInitConfig,
  formSubmit?: (event: FormSubmitEvent) => void,
  formEvent?: (event: FormEvent) => void,
) {
  // GuiForm preloads the widget set itself, so the first committed tree already holds every
  // widget and focus always starts on the first field of the definition.
  const instance = render(
    <GuiForm config={config} formSubmit={formSubmit} formEvent={formEvent} />,
  );
  const frame = () => stripAnsi(instance.lastFrame());
  await waitForStableFrame(frame);
  return {
    ...instance,
    frame,
    press: async (data: string) => {
      instance.stdin.write(data);
      await tick();
    },
  };
}

/** A stdout that keeps the last frame in memory instead of writing it to a terminal. */
class MemoryStdout extends EventEmitter {
  columns = 100;
  lastFrame = '';
  write = (frame: string) => {
    this.lastFrame = frame;
  };
}

/** A stdin that reports no terminal, which is what a closed or piped stdin looks like. */
class ClosedStdin extends EventEmitter {
  isTTY = false;
  /** Set when something asks for raw mode, which a host without a terminal cannot give. */
  wasRawModeRequested = false;
  read = () => null;
  setEncoding() {
    // Nothing to do, the fake stream holds no data.
  }
  setRawMode = () => {
    this.wasRawModeRequested = true;
  };
  ref() {
    // Nothing to do, the fake stream never keeps the process alive.
  }
  unref() {
    // Nothing to do, the fake stream never keeps the process alive.
  }
  resume() {
    // Nothing to do, the fake stream never delivers data.
  }
  pause() {
    // Nothing to do, the fake stream never delivers data.
  }
}

/**
 * Renders a GuiForm on a host that has no terminal, the way a piped or closed stdin looks.
 *
 * Ink's testing library always reports a terminal, so this one builds the streams itself.
 *
 * @param config - The form config, usually just `{ formDef }`.
 * @returns The Ink instance, `frame()` (ANSI stripped) and the stdin, which records whether
 * anything asked for raw mode.
 *
 * @example
 * const form = await renderFormWithoutTerminal({ formDef });
 * expect(form.frame()).toContain('The form is shown read-only.');
 * form.unmount();
 */
export async function renderFormWithoutTerminal(config: GuiFormInitConfig) {
  const stdout = new MemoryStdout();
  const stdin = new ClosedStdin();
  const instance = inkRender(<GuiForm config={config} />, {
    stdout: stdout as unknown as NodeJS.WriteStream,
    stdin: stdin as unknown as NodeJS.ReadStream,
    // Every frame is written whole, so the spec can read the last one.
    debug: true,
    exitOnCtrlC: false,
    patchConsole: false,
  });
  const frame = () => stripAnsi(stdout.lastFrame);
  await waitForStableFrame(frame);
  return { ...instance, frame, stdin };
}
