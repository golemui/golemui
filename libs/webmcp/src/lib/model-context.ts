import type { ModelContextLike, ModelContextTool } from './types';

const isModelContext = (candidate: unknown): candidate is ModelContextLike =>
  candidate !== null &&
  typeof candidate === 'object' &&
  typeof (candidate as ModelContextLike).registerTool === 'function';

/**
 * The page's model context: `document.modelContext` (the specified location), else the
 * deprecated `navigator.modelContext` of older previews, else `undefined` (server runtimes,
 * browsers without WebMCP).
 */
export function resolveModelContext(): ModelContextLike | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }
  const fromDocument = (document as unknown as { modelContext?: unknown }).modelContext;
  if (isModelContext(fromDocument)) {
    return fromDocument;
  }
  if (typeof navigator === 'undefined') {
    return undefined;
  }
  const fromNavigator = (navigator as unknown as { modelContext?: unknown }).modelContext;
  return isModelContext(fromNavigator) ? fromNavigator : undefined;
}

/**
 * Holds one set of registered tools and replaces it atomically. Registrations and
 * unregistrations run on one promise chain, so a replacement never overlaps the abort of the
 * previous set, and every registration gets a fresh `AbortController` (a spec-conformant
 * context rejects an already-aborted signal).
 */
export class ToolRegistry {
  private queue: Promise<void> = Promise.resolve();
  private controller: AbortController | undefined;
  private names: string[] = [];

  constructor(
    private readonly context: ModelContextLike,
    private readonly exposedTo: string[] | undefined,
  ) {}

  /** Unregisters the current tools and registers the given ones. */
  replace(tools: ModelContextTool[]): void {
    this.release();
    const controller = new AbortController();
    this.controller = controller;
    this.names = tools.map((tool) => tool.name);
    this.queue = this.queue.then(async () => {
      for (const tool of tools) {
        if (controller.signal.aborted) {
          return;
        }
        try {
          await this.context.registerTool(tool, {
            signal: controller.signal,
            exposedTo: this.exposedTo,
          });
        } catch (err) {
          // Duplicate name, invalid name, a document that is not origin-keyed: the form must
          // keep working, so the failure is reported and the other tools still register.
          console.warn(`[GolemUI webmcp] Could not register the tool "${tool.name}":`, err);
        }
      }
    });
  }

  /** Unregisters the current tools. Safe to call when nothing is registered. */
  release(): void {
    const controller = this.controller;
    const names = this.names;
    this.controller = undefined;
    this.names = [];
    if (controller === undefined) {
      return;
    }
    controller.abort();
    // Previews that predate the `signal` option expose unregisterTool instead. It runs after
    // the pending registrations, on the same chain.
    const unregisterTool = this.context.unregisterTool;
    if (typeof unregisterTool === 'function') {
      this.queue = this.queue.then(() => {
        for (const name of names) {
          try {
            unregisterTool.call(this.context, name);
          } catch {
            // Already gone.
          }
        }
      });
    }
  }

  /** Resolves once every queued registration and unregistration has run. For tests. */
  settled(): Promise<void> {
    return this.queue;
  }
}
