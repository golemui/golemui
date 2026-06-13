// --- JSON form-definition path ---
export {
  validateFormDefinition,
  JSON_VALIDATE_FORM_DEFINITION_TOOL,
} from './json/validate-form-definition';
export type { ValidateInput, ValidateResult } from './json/validate-form-definition';
export {
  generateFromJsonSchema,
  JSON_GENERATE_FROM_SCHEMA_TOOL,
} from './json/generate-from-json-schema';
export type {
  GenerateFromJsonSchemaInput,
  GenerateFromJsonSchemaResult,
} from './json/generate-from-json-schema';
export { generateFromOpenapi, JSON_GENERATE_FROM_OPENAPI_TOOL } from './json/generate-from-openapi';
export { getWidgetSpec, JSON_GET_WIDGET_SPEC_TOOL } from './json/get-widget-spec';

// --- gui.* DX path ---
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

// --- shared (cross-cutting reference) ---
export { getConcept, GET_CONCEPT_TOOL } from './shared/get-concept';
