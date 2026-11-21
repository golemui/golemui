import { describe, expect, it } from 'vitest';
import type { GuiFormInitConfig } from './index';

// Compile-time probes of the gui dependency types. The vitest typecheck pass (`test.typecheck` in
// vite.config.ts) checks this file, so a probe that compiles without its error fails the run.

export const markdownParseAsNumberProbe: GuiFormInitConfig = {
  formDef: { form: [] },
  dependencies: {
    markdown: {
      // @ts-expect-error the gui markdown dependency must declare a parse function
      parse: 42,
    },
  },
};

// The cast to `SanitizedHtml` is where a host decides that the HTML is safe, so a parser
// that returns a plain string must keep failing.
export const markdownParserReturnTypeProbe: GuiFormInitConfig = {
  formDef: { form: [] },
  dependencies: {
    markdown: {
      // @ts-expect-error the gui markdown parser must return SanitizedHtml, not a plain string
      parse: (markdown: string) => markdown,
    },
  },
};

describe('the gui dependency types', () => {
  it('defines the compile-time probes', () => {
    expect(markdownParseAsNumberProbe).toBeDefined();
    expect(markdownParserReturnTypeProbe).toBeDefined();
  });
});
