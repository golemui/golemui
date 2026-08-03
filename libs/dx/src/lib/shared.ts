/**
 * Dependencies are any 3rd party services widget components may need
 * internally, injected at the form level and read by components at render
 * time. The shape is deliberately open at this level: each widget set
 * implementation documents and narrows its own dependency keys (the gui set,
 * for example, narrows this to its `markdown` parser entry).
 */
export type Dependencies = Record<string, unknown>;
