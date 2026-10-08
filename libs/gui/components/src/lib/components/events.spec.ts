// @vitest-environment jsdom
import { create, ts } from '@custom-elements-manifest/analyzer';
import { describe, expect, it } from 'vitest';

const sources = import.meta.glob<string>(
  ['./*.ts', '!./*.spec.ts', '../gui-element.ts', '../gui-form-control.ts'],
  { query: '?raw', import: 'default', eager: true },
);

// Each element exports its events map (`GuiTextinputEvents`), which the React components and the
// Vue typings read. The `@fires` JSDoc documents the same events in the Custom Elements Manifest.
describe('gui-components events maps', () => {
  it('list the events each element documents with @fires', { timeout: 30_000 }, async () => {
    const modules = import.meta.glob<Record<string, unknown>>(['./*.ts', '!./*.spec.ts']);
    const manifest = create({
      modules: Object.entries(sources).map(([path, source]) =>
        ts.createSourceFile(path, source, ts.ScriptTarget.ES2022, true),
      ),
    });

    const mismatches: string[] = [];
    let checked = 0;
    for (const [path, load] of Object.entries(modules)) {
      const exports = await load();
      // The analyzer drops the leading `./` of the paths it was given.
      const module = manifest.modules.find(
        (candidate) => candidate.path === path.replace(/^\.\//, ''),
      );
      for (const declaration of module?.declarations ?? []) {
        if (declaration.kind !== 'class' || !(declaration.name in exports)) continue;
        const map = exports[`${declaration.name}Events`] as object | undefined;
        const mapped = Object.keys(map ?? {}).sort();
        // The analyzer also reads `new CustomEvent(type)` as an event named `type`.
        const documented = (declaration.events ?? [])
          .map(({ name }) => name)
          .filter((name) => name.startsWith('gui-'))
          .sort();
        checked++;
        if (mapped.join() !== documented.join()) {
          mismatches.push(`${declaration.name}: map [${mapped}] vs @fires [${documented}]`);
        }
      }
    }

    expect(checked).toBeGreaterThan(30);
    expect(mismatches).toEqual([]);
  });
});
