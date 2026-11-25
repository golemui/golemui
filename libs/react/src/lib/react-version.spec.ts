import { version as reactVersion } from 'react';
import { version as reactDomVersion } from 'react-dom';
import { describe, expect, it } from 'vitest';

// Without the aliases of vite.config.ts, a REACT18=1 run tests React 19 and still passes.
describe('the React version of the test run', () => {
  it.runIf(process.env.REACT18 === '1')('is React 18 when REACT18=1 is set', () => {
    expect(reactVersion).toMatch(/^18\./);
    expect(reactDomVersion).toMatch(/^18\./);
  });
});
