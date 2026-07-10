import { describe, it, expect } from 'vitest';

// Every component schema allows scoped prop overrides via `name.<scope>` keys.
// The DX prop types permit a scoped value for ANY prop, and each widget uses
// `additionalProperties: false` on `props` (plus `unevaluatedProperties: false`
// on the widget), so a prop that lacks a `^name\.[^.]+$` patternProperties entry
// silently rejects its own scoped form even though the direct prop is allowed.
//
// This guard enforces the invariant every correct schema already satisfies:
// each direct `props.properties` key has a matching scoped pattern entry. It is
// the structural check that would have caught the timepicker / datetimecalendar
// drift (missing scoped entries for minTime/maxTime/allowCustomTime/etc.).

// import.meta.glob is a Vite feature (tests run under Vitest); the same pattern
// is used by schema.spec.utils.ts to assemble the component schemas.
const componentSchemas = import.meta.glob('./*.schema.json', {
  eager: true,
  import: 'default',
}) as Record<string, { title?: string; properties?: { props?: Record<string, any> } }>;

// `^minTime\.[^.]+$` -> `minTime`
const patternBaseName = (patternKey: string): string =>
  patternKey.replace(/^\^/, '').split('\\.')[0];

describe('Component schema props <-> patternProperties parity', () => {
  for (const [path, schema] of Object.entries(componentSchemas)) {
    const propsSchema = schema?.properties?.props;
    const directProps = propsSchema?.properties as Record<string, unknown> | undefined;
    if (!directProps) continue;

    const title = schema.title ?? path;

    it(`${title} declares a scoped patternProperties entry for every prop`, () => {
      const scopedBaseNames = new Set(
        Object.keys(propsSchema?.patternProperties ?? {}).map(patternBaseName),
      );
      const missing = Object.keys(directProps).filter((name) => !scopedBaseNames.has(name));
      expect(
        missing,
        `${title} is missing "<name>.<scope>" patternProperties for: ${missing.join(', ')}`,
      ).toEqual([]);
    });
  }
});
