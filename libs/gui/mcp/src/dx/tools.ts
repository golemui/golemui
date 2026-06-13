import { defineTool, type ToolEntry } from '../shared/tool';
import { DX_CHECK_CODE_TOOL, checkDxCode } from './check-dx-code';
import { DX_GET_SPEC_TOOL, getDxSpec } from './get-dx-spec';
import { DX_LIST_FACTORIES_TOOL, listDxFactoriesCatalog } from './list-dx-factories';

/** The `gui.*` DX path's MCP tools: list the catalog, deep-dive one factory, type-check. */
export const dxTools: ToolEntry[] = [
  // `dx_list_factories` takes no arguments — it defaults the framework from the env, so
  // its handler ignores the (empty) MCP arguments object.
  defineTool(DX_LIST_FACTORIES_TOOL, () => listDxFactoriesCatalog()),
  defineTool(DX_GET_SPEC_TOOL, getDxSpec),
  defineTool(DX_CHECK_CODE_TOOL, checkDxCode),
];
