// ─── Public API ───────────────────────────────────────────────────────────
//
// Curated, end-user form-authoring surface. Building blocks, the extension API,
// and framework-adapter contract types are intentionally NOT re-exported here —
// they live in `./internals` (see `internals.ts`). Renderer/adapter libraries
// import those from `@golemui/gui-shared/internals`.

// ─── DX form-authoring API ───
export { gui } from './lib/dx';
export type {
  DxDefinitionItem,
  DxDefinitions,
  DxFormConfig,
  GslSelectorsInput,
  GuiFormInitConfig,
} from './lib/dx';

// ─── shared (external libs dependency injection) ───
export type { Dependencies } from './lib/shared';

// ─── utils (form composition) ───
export { resolveChunkRefs } from './lib/utils/schema';
