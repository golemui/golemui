// Full package surface (Node). Re-exports the runtime-portable JSON + shared tools
// plus the Node-only `gui.*` DX type-check path. Non-Node consumers (e.g. a Cloudflare
// Worker) should import from `@golemui/gui-mcp/json` instead, to avoid bundling the DX
// machinery (the `typescript` compiler and `node:*` builtins).

// --- runtime-portable: JSON form-definition path + shared reference ---
export * from './json';

// --- gui.* DX path (Node-only) ---
export { checkDxCode, DX_CHECK_CODE_TOOL } from './dx/check-dx-code';
export type { CheckDxCodeInput, CheckDxCodeResult } from './dx/check-dx-code';
export { getDxSpec, DX_GET_SPEC_TOOL } from './dx/get-dx-spec';
export type { GetDxSpecInput, GetDxSpecResult } from './dx/get-dx-spec';
export { listDxFactoriesCatalog, DX_LIST_FACTORIES_TOOL } from './dx/list-dx-factories';
export type { ListDxFactoriesResult } from './dx/list-dx-factories';
export { typeCheckDx } from './dx/typecheck';
export type { DxDiagnostic, DxCheckResult } from './dx/typecheck';
export { DX_SPECS, listDxFactories, dxCatalog } from './dx/dx-specs';
export type { DxSpec, DxNamespace, DxCatalog, DxCatalogEntry } from './dx/dx-specs';
