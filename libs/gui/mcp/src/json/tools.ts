import { defineTool, type ToolEntry } from '../shared/tool';
import { GENERATE_FROM_JSON_SCHEMA_TOOL, generateFromJsonSchema } from './generate-from-json-schema';
import { GENERATE_FROM_OPENAPI_TOOL, generateFromOpenapi } from './generate-from-openapi';
import { GET_WIDGET_SPEC_TOOL, getWidgetSpec } from './get-widget-spec';
import { VALIDATE_FORM_DEFINITION_TOOL, validateFormDefinition } from './validate-form-definition';

/** The JSON form-definition path's MCP tools: generate, look up, and validate. */
export const jsonTools: ToolEntry[] = [
  defineTool(VALIDATE_FORM_DEFINITION_TOOL, validateFormDefinition),
  defineTool(GENERATE_FROM_JSON_SCHEMA_TOOL, generateFromJsonSchema),
  defineTool(GENERATE_FROM_OPENAPI_TOOL, generateFromOpenapi),
  defineTool(GET_WIDGET_SPEC_TOOL, getWidgetSpec),
];
