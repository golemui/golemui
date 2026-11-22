// ─── Public API ───────────────────────────────────────────────────────────
//
// The end-user surface: the form config type, the dependency types and the form composition
// utils. Building blocks and the types for framework adapters are not exported here. They are
// in `./internals` (see `internals.ts`), and renderer and adapter libraries import them from
// `@golemui/gui-shared/internals`.

// --- form config ---
export type { GuiFormInitConfig } from './lib/form-init-config';

// ─── shared (external libs dependency injection) ───
export type {
  Dependencies,
  FileItem,
  FileStatus,
  MarkdownParser,
  SanitizedHtml,
  UploadService,
} from './lib/shared';
export type { ExpressionFunction, ExpressionFunctions } from '@golemui/core';

// ─── utils (form composition) ───
export { resolveChunkRefs } from './lib/utils/schema';
