import type { DotPath, InputWidget, JsonSchemaFragment, WidgetValueSchema } from '@golemui/core';

// -----------------------------------------------------------------------------
// Plugin options
// -----------------------------------------------------------------------------

/** The tools a form can be exposed as. */
export type WebmcpToolKind = 'read' | 'fill' | 'submit';

/** Per-tool overrides of the generated name, texts and annotations. */
export interface WebmcpToolOverride {
  /** Replaces the generated name (`<name>-fill`, `<name>-submit`, `<name>-read`). */
  name?: string;
  /** Replaces the generated description. Keep it under 500 characters. */
  description?: string;
  /** Replaces the generated title. */
  title?: string;
  /**
   * Whether running the tool is a consequential action the agent must confirm with the user.
   * Defaults to true for `submit` and false for the others.
   */
  consequential?: boolean;
}

/**
 * Describes the value of one widget type the widget set does not know (a custom widget): a
 * fixed description, or a function of the widget for one that depends on its props.
 */
export type FieldSchemaResolver =
  | WidgetValueSchema
  | ((widget: InputWidget<any, string>) => WidgetValueSchema | undefined);

export interface WebmcpOptions {
  /**
   * The base of the tool names, `^[A-Za-z0-9_.-]{1,100}$`. Never derived from the form name,
   * which is random or framework-generated when the config leaves it out.
   */
  name: string;
  /** What the form is for, in the agent's words. Keep it under 500 characters. */
  description: string;
  /** A short title for user interfaces. Defaults to `name`. */
  title?: string;
  /** The tools to register. Defaults to `['fill', 'submit']`; `read` is opt-in. */
  tools?: WebmcpToolKind[];
  /** Per-tool overrides of the generated names, texts and annotations. */
  toolOverrides?: Partial<Record<WebmcpToolKind, WebmcpToolOverride>>;
  /** Data paths never exposed to the agent, in addition to the widget set's sensitive values. */
  exclude?: DotPath[];
  /**
   * Value descriptions by widget type, for custom widgets the widget set cannot describe.
   * Wins over the widget set's own description.
   */
  fields?: Record<string, FieldSchemaResolver>;
  /** Origins the tools are exposed to, passed through to `registerTool`. Same-origin only by default. */
  exposedTo?: string[];
  /**
   * The model context to register with. Defaults to `document.modelContext`, falling back to
   * the deprecated `navigator.modelContext`. Inject a fake for tests or a polyfill.
   */
  modelContext?: ModelContextLike;
}

// -----------------------------------------------------------------------------
// Tool results
// -----------------------------------------------------------------------------

export type WebmcpStatus = 'read' | 'filled' | 'submitted' | 'invalid' | 'error';

/**
 * What every tool returns to the agent. Never thrown: a rejected execution reaches the agent
 * as an opaque error, so problems travel as data.
 */
export type WebmcpResult = {
  status: WebmcpStatus;
  /** For every status but `error`: whether the form validates with its current values. */
  isValid?: boolean;
  /** The current form values, hidden fields pruned and sensitive values redacted. */
  values?: Record<string, unknown>;
  /** Validation messages by data path. */
  errors?: Record<DotPath, string[]>;
  /** Declared fields currently hidden by the form's conditions (`read`). */
  hidden?: DotPath[];
  /** Fields written by this call that the form hides after the write, so a submit leaves them out. */
  notVisible?: DotPath[];
  /** Input keys that match no fillable field and were left out. */
  ignored?: string[];
  /** Set when `values` was left out because it exceeded the size cap. */
  valuesTruncated?: boolean;
  /** Only for `error`. */
  message?: string;
};

// -----------------------------------------------------------------------------
// The WebMCP browser API, typed locally (no global augmentation)
// -----------------------------------------------------------------------------

export interface ModelContextToolAnnotations {
  readOnlyHint?: boolean;
  consequentialHint?: boolean;
  untrustedContentHint?: boolean;
}

export interface ModelContextTool {
  name: string;
  title?: string;
  description: string;
  inputSchema: JsonSchemaFragment;
  execute: (input: unknown, options?: { signal?: AbortSignal }) => Promise<unknown>;
  annotations?: ModelContextToolAnnotations;
}

export interface ModelContextRegisterOptions {
  /** Aborting it unregisters the tool (spec; Chrome 153+). */
  signal?: AbortSignal;
  exposedTo?: string[];
}

/**
 * The part of `document.modelContext` this package uses. `unregisterTool` only exists on
 * previews that predate the `signal` option; it is called as a fallback when present.
 */
export interface ModelContextLike {
  registerTool(tool: ModelContextTool, options?: ModelContextRegisterOptions): Promise<void> | void;
  unregisterTool?(name: string): void;
}
