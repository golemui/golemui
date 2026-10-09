// The analyzer exports `create` and its own TypeScript as `ts` (its index.js), but its index.d.ts
// declares neither. events.spec.ts uses both to build the manifest from source.
import type { Package } from 'custom-elements-manifest/schema';
import type typescript from 'typescript';

declare module '@custom-elements-manifest/analyzer' {
  export function create(options: {
    modules: typescript.SourceFile[];
    plugins?: unknown[];
    context?: Record<string, unknown>;
  }): Package;
  export const ts: typeof typescript;
}
