import { useEffect, useLayoutEffect } from 'react';

/**
 * `useLayoutEffect` in the browser, `useEffect` in a server render, where layout
 * effects never run and `renderToString` warns on them.
 */
export const useBrowserLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;
