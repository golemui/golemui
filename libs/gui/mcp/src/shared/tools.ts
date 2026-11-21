import { GET_CONCEPT_TOOL, getConcept } from './get-concept';
import { defineTool, type ToolEntry } from './tool';

/**
 * Cross-cutting reference tools. `get_concept` explains behavior that spans widgets
 * (conditional rendering, per-state props, the reactive scope).
 */
export const sharedTools: ToolEntry[] = [defineTool(GET_CONCEPT_TOOL, getConcept)];
