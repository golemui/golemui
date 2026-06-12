import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

// Each shortcut registers its DX handler as a side effect of importing its
// `register.ts`. Framework bundles only evaluate those side effects through the
// `registerAll.ts` barrel — the `_gsl*` re-exports in `index.ts` get tree-shaken
// out, so a shortcut missing from `registerAll.ts` works in source/tests but
// throws `No handler registered for item type "..."` once bundled.
//
// Regression: MARKDOWN_TEXTS and TAGS shipped a `register.ts` but were never
// wired into the barrel. This guards every current and future shortcut. See
// SHORTCUTS.md "Wire it up".

const dxDir = dirname(__dirname); // __dirname = .../dx/__tests__ → .../dx
const shortcutsDir = join(dxDir, 'shortcuts');
const registerAllSource = readFileSync(join(dxDir, 'registerAll.ts'), 'utf8');

const shortcutsWithRegister = readdirSync(shortcutsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => existsSync(join(shortcutsDir, name, 'register.ts')))
  .sort();

describe('registerAll barrel', () => {
  it('discovers the shortcuts that ship a register.ts', () => {
    // Sanity check that the filesystem scan actually found shortcuts — guards
    // against a silently-empty list making the assertion below vacuous.
    expect(shortcutsWithRegister.length).toBeGreaterThan(0);
  });

  it('imports a register module for every shortcut that defines one', () => {
    const missing = shortcutsWithRegister.filter(
      (name) => !registerAllSource.includes(`./shortcuts/${name}/register`),
    );

    expect(
      missing,
      `Missing side-effect import(s) in registerAll.ts — add ` +
        missing.map((name) => `\`import './shortcuts/${name}/register';\``).join(', '),
    ).toEqual([]);
  });
});
