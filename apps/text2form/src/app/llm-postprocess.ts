/**
 * Converts the flat LLM output into a nested Golem form definition.
 *
 * LLM output (flat, UID references):
 *   { root: "r", elements: { "r": { ..., children: ["a","b"] }, "a": {...}, "b": {...} } }
 *
 * Golem form input (nested):
 *   { form: [{ ..., children: [{ ... }, { ... }] }] }
 *
 * The flat representation is what we ask the LLM to produce (see golem-prompt.ts)
 * because deep nesting causes LLMs to hallucinate closing brackets. This step
 * restores the nested tree that the Golem form engine expects.
 */

// ---------------------------------------------------------------------------
// LLM output types (flat format produced by the LLM)
// ---------------------------------------------------------------------------

export interface LlmElement {
  uid: string;
  kind: 'input' | 'action' | 'display' | 'layout';
  type: string;
  /** Only present on layout widgets - array of child UIDs. */
  children?: string[];
  [key: string]: unknown;
}

export interface LlmFlatOutput {
  root: string;
  elements: Record<string, LlmElement>;
}

// ---------------------------------------------------------------------------
// Golem form output types (nested format expected by the form engine)
// ---------------------------------------------------------------------------

export interface GolemWidget {
  uid: string;
  kind: 'input' | 'action' | 'display' | 'layout';
  type: string;
  children?: GolemWidget[];
  [key: string]: unknown;
}

export interface GolemFormDef {
  form: GolemWidget[];
}

// ---------------------------------------------------------------------------
// Resolver
// ---------------------------------------------------------------------------

/**
 * Recursively resolves a single element by UID, replacing child UID strings
 * with the actual resolved widget objects.
 *
 * @param uid UID to resolve.
 * @param elements Flat element map from the LLM.
 * @param visited UIDs already on the current resolution path. Prevents cycles.
 */
function resolveElement(
  uid: string,
  elements: Record<string, LlmElement>,
  visited: Set<string>,
): GolemWidget | null {
  if (visited.has(uid)) {
    console.warn(`[llm-postprocess] Cycle detected at uid "${uid}" - skipping subtree.`);
    return null;
  }

  const el = elements[uid];
  if (!el) {
    console.warn(`[llm-postprocess] Widget "${uid}" not found in elements - skipping.`);
    return null;
  }

  // Clone the visited set so sibling branches don't see each other as cycles.
  const branch = new Set(visited);
  branch.add(uid);

  const { children, ...rest } = el;

  if (el.kind === 'layout' && Array.isArray(children)) {
    const resolvedChildren = children
      .map((childUid) => resolveElement(childUid, elements, branch))
      .filter((c): c is GolemWidget => c !== null);
    return { ...rest, children: resolvedChildren };
  }

  // Repeater: resolve props.template UID into a nested flex widget.
  if (
    el.type === 'repeater' &&
    rest['props'] &&
    typeof (rest['props'] as Record<string, unknown>)['template'] === 'string'
  ) {
    const props = rest['props'] as Record<string, unknown>;
    const templateUid = props['template'] as string;
    const resolved = resolveElement(templateUid, elements, branch);
    if (resolved) {
      return { ...rest, props: { ...props, template: resolved } };
    }
  }

  // Non-layout widgets: drop `children` entirely even if the LLM hallucinated it.
  return rest;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Converts the flat LLM output object into a nested Golem form definition.
 *
 * @example
 * const golemForm = flatToGolemForm(llmOutput);
 * // -> { form: [{ uid: "root", kind: "layout", type: "flex", children: [...] }] }
 */
export function flatToGolemForm(llmOutput: LlmFlatOutput): GolemFormDef {
  const root = resolveElement(llmOutput.root, llmOutput.elements, new Set());

  if (!root) {
    console.warn('[llm-postprocess] Root element could not be resolved - returning empty form.');
    return { form: [] };
  }

  // If the root is a plain flex wrapping the whole form, unwrap it so the
  // form array contains the top-level widgets directly (matches Golem conventions).
  // Keep the wrapper if it has props/on/include/etc. that the developer may need.
  if (root.kind === 'layout' && root.type === 'flex' && isPlainWrapper(root)) {
    return { form: root.children ?? [] };
  }

  return { form: [root] };
}

/**
 * Parses a raw JSON string from the LLM and converts it to a Golem form definition.
 * Throws if the JSON is malformed.
 */
export function parseLlmResponse(raw: string): GolemFormDef {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const json = match ? match[1].trim() : raw.trim();
  const parsed = JSON.parse(json) as LlmFlatOutput;
  return flatToGolemForm(parsed);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if a layout widget is a plain wrapper with no extra configuration
 * (no props, no on-handlers, no include/exclude, no size).
 * Used to decide whether to unwrap the root flex.
 */
function isPlainWrapper(widget: GolemWidget): boolean {
  return (
    widget['props'] == null &&
    widget['on'] == null &&
    widget['include'] == null &&
    widget['exclude'] == null &&
    widget['size'] == null
  );
}
