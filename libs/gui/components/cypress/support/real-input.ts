/**
 * Trusted input, sent through the Chrome DevTools Protocol. The browser runs its own behavior only
 * for trusted events: Escape and a click outside close a popover, a click focuses. The events
 * Cypress dispatches from the page are untrusted, so they reach the listeners and nothing else.
 *
 * Firefox has no DevTools Protocol in Cypress: a spec that needs these runs in Chromium only.
 */

/** Whether this browser takes trusted input. */
export const takesRealInput = () => Cypress.isBrowser({ family: 'chromium' });

const send = (command: string, params: Record<string, unknown>) =>
  Cypress.automation('remote:debugger:protocol', { command, params });

// The DevTools Protocol's key, code and Windows key code of each key the specs press. A key that
// types a character carries it as `text`, or the browser does not activate a button with it.
const keys = {
  Escape: { key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 },
  Tab: { key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 },
  Enter: { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' },
  Space: { key: ' ', code: 'Space', windowsVirtualKeyCode: 32, text: ' ' },
  ArrowRight: { key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 },
  ArrowLeft: { key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 },
} as const;

/** Presses and releases a key, in the element that has focus. */
export const realPress = (key: keyof typeof keys) =>
  cy.then(async () => {
    const event = keys[key];
    await send('Input.dispatchKeyEvent', {
      type: 'text' in event ? 'keyDown' : 'rawKeyDown',
      ...event,
    });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', ...event });
  });

/**
 * Clicks at a point of the page under test, in its own CSS pixels. The page runs in a scaled
 * iframe of the Cypress runner, so the point is mapped to the runner's viewport first.
 */
export const realClick = (x: number, y: number) =>
  cy.window({ log: false }).then(async (win) => {
    // `frameElement` is null in the runner: find the frame from the runner's side.
    const frame = win.parent.document.querySelector<HTMLIFrameElement>('iframe.aut-iframe');
    if (!frame) throw new Error('realClick: no Cypress runner frame around the page');
    const box = frame.getBoundingClientRect();
    const scale = box.width / win.innerWidth;
    const point = { x: box.x + x * scale, y: box.y + y * scale, button: 'left', clickCount: 1 };
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point });
  });
