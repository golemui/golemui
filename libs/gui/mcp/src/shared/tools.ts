import { GET_CONCEPT_TOOL, getConcept } from './get-concept';
import { defineTool, type ToolEntry } from './tool';

/**
 * Cross-cutting reference tools that serve both authoring paths. `get_concept` explains
 * behavior that spans widgets (conditional rendering, per-state props, the reactive
 * scope), which a JSON author and a `gui.*` DX author both reach for.
 */
export const sharedTools: ToolEntry[] = [defineTool(GET_CONCEPT_TOOL, getConcept)];
