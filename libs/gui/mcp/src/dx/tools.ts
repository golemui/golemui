import { defineTool, type ToolEntry } from '../shared/tool';
import { CHECK_DX_CODE_TOOL, checkDxCode } from './check-dx-code';
import { GET_DX_SPEC_TOOL, getDxSpec } from './get-dx-spec';
import { LIST_DX_FACTORIES_TOOL, listDxFactoriesCatalog } from './list-dx-factories';

/** The `gui.*` DX path's MCP tools: list the catalog, deep-dive one factory, type-check. */
export const dxTools: ToolEntry[] = [
  // `list_dx_factories` takes no arguments — it defaults the framework from the env, so
  // its handler ignores the (empty) MCP arguments object.
  defineTool(LIST_DX_FACTORIES_TOOL, () => listDxFactoriesCatalog()),
  defineTool(GET_DX_SPEC_TOOL, getDxSpec),
  defineTool(CHECK_DX_CODE_TOOL, checkDxCode),
];
