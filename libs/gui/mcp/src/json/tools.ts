import { defineTool, type ToolEntry } from '../shared/tool';
import {
  JSON_GENERATE_FROM_SCHEMA_TOOL,
  generateFromJsonSchema,
} from './generate-from-json-schema';
import { JSON_GENERATE_FROM_OPENAPI_TOOL, generateFromOpenapi } from './generate-from-openapi';
import { JSON_GET_WIDGET_SPEC_TOOL, getWidgetSpec } from './get-widget-spec';
import {
  JSON_VALIDATE_FORM_DEFINITION_TOOL,
  validateFormDefinition,
} from './validate-form-definition';

/** The JSON form-definition path's MCP tools: generate, look up, and validate. */
export const jsonTools: ToolEntry[] = [
  defineTool(JSON_VALIDATE_FORM_DEFINITION_TOOL, validateFormDefinition),
  defineTool(JSON_GENERATE_FROM_SCHEMA_TOOL, generateFromJsonSchema),
  defineTool(JSON_GENERATE_FROM_OPENAPI_TOOL, generateFromOpenapi),
  defineTool(JSON_GET_WIDGET_SPEC_TOOL, getWidgetSpec),
];
