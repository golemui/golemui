// --- JSON form-definition path ---
export {
  validateFormDefinition,
  VALIDATE_FORM_DEFINITION_TOOL,
} from './json/validate-form-definition';
export type { ValidateInput, ValidateResult } from './json/validate-form-definition';
export {
  generateFromJsonSchema,
  GENERATE_FROM_JSON_SCHEMA_TOOL,
} from './json/generate-from-json-schema';
export type {
  GenerateFromJsonSchemaInput,
  GenerateFromJsonSchemaResult,
} from './json/generate-from-json-schema';
export { generateFromOpenapi, GENERATE_FROM_OPENAPI_TOOL } from './json/generate-from-openapi';
export { getWidgetSpec, GET_WIDGET_SPEC_TOOL } from './json/get-widget-spec';

// --- gui.* DX path ---
export { checkDxCode, CHECK_DX_CODE_TOOL } from './dx/check-dx-code';
export type { CheckDxCodeInput, CheckDxCodeResult } from './dx/check-dx-code';
export { getDxSpec, GET_DX_SPEC_TOOL } from './dx/get-dx-spec';
export type { GetDxSpecInput, GetDxSpecResult } from './dx/get-dx-spec';
export { listDxFactoriesCatalog, LIST_DX_FACTORIES_TOOL } from './dx/list-dx-factories';
export type { ListDxFactoriesResult } from './dx/list-dx-factories';
export { typeCheckDx } from './dx/typecheck';
export type { DxDiagnostic, DxCheckResult } from './dx/typecheck';
export { DX_SPECS, listDxFactories, dxCatalog } from './dx/dx-specs';
export type { DxSpec, DxNamespace, DxCatalog, DxCatalogEntry } from './dx/dx-specs';

// --- shared (cross-cutting reference) ---
export { getConcept, GET_CONCEPT_TOOL } from './shared/get-concept';
