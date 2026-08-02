import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { guiRegistry } from '../registry';

// Each shortcut folder exports a pure shortcut type definition from its
// `register.ts`; `registry.ts` is the single place that registers them all
// into `guiRegistry`. A shortcut whose definition is not wired into
// `registry.ts` works nowhere — the pipeline throws
// `No handler registered for item type "..."` on first use.
//
// Regression history: with the old side-effect registration, MARKDOWN_TEXTS
// and TAGS shipped a `register.ts` but were never wired into the barrel, so
// they broke only once bundled. This guards every current and future
// shortcut. See SHORTCUTS.md "Wire it up".

const dxDir = dirname(__dirname); // __dirname = .../dx/__tests__ → .../dx
const shortcutsDir = join(dxDir, 'shortcuts');
const registrySource = readFileSync(join(dxDir, 'registry.ts'), 'utf8');

const shortcutsWithRegister = readdirSync(shortcutsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => existsSync(join(shortcutsDir, name, 'register.ts')))
  .sort();

describe('gui registry wiring', () => {
  it('discovers the shortcuts that ship a register.ts', () => {
    // Sanity check that the filesystem scan actually found shortcuts — guards
    // against a silently-empty list making the assertion below vacuous.
    expect(shortcutsWithRegister.length).toBeGreaterThan(0);
  });

  it('imports the shortcut type definition of every shortcut that defines one', () => {
    const missing = shortcutsWithRegister.filter(
      (name) => !registrySource.includes(`./shortcuts/${name}/register`),
    );

    expect(
      missing,
      `Shortcut type(s) not wired into registry.ts — import the definition from ` +
        missing.map((name) => `'./shortcuts/${name}/register'`).join(', ') +
        ` and add it to guiShortcutTypes`,
    ).toEqual([]);
  });

  it('registers every exported shortcut type definition in guiRegistry', async () => {
    // The import check above only proves registry.ts references each folder.
    // Registration additionally requires the definition to be listed in the
    // guiShortcutTypes array, so this test asserts actual registration: a
    // definition that is imported but not listed fails here.
    for (const name of shortcutsWithRegister) {
      const registerModule: Record<string, unknown> = await import(
        `../shortcuts/${name}/register.ts`
      );

      const definitions = Object.values(registerModule).filter(
        (candidate): candidate is { itemType: string } => {
          if (typeof candidate !== 'object' || candidate === null) {
            return false;
          }
          const shape = candidate as { itemType?: unknown; handler?: unknown };
          return typeof shape.itemType === 'string' && typeof shape.handler === 'object';
        },
      );

      expect(
        definitions.length,
        `shortcuts/${name}/register.ts exports no shortcut type definition`,
      ).toBeGreaterThan(0);

      for (const definition of definitions) {
        expect(
          guiRegistry.hasItemTypeHandler(definition.itemType),
          `"${definition.itemType}" (from shortcuts/${name}) is not registered in guiRegistry; ` +
            `add it to guiShortcutTypes in registry.ts`,
        ).toBe(true);
      }
    }
  });
});
