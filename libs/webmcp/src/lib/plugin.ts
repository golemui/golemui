import type { FormPlugin, State, Uid } from '@golemui/core';
import { inputPath } from '@golemui/core/internals';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs';
import { resolveModelContext, ToolRegistry } from './model-context';
import { assertBaseName, assertToolName, claimBaseName } from './names';
import { buildFormSchema } from './schema';
import { buildTools } from './tools';
import type { WebmcpOptions } from './types';

/** How long the form has to settle before its tools are registered or replaced. */
const REGISTRATION_DELAY_MS = 100;

/**
 * Exposes the form to the browser's AI agent through WebMCP.
 *
 * Attached by the form binding once the form is live on the client. When no model context is
 * available (a server render, a browser without WebMCP) it does nothing. Otherwise it registers
 * one tool per requested kind as soon as the form has derived its widgets, and re-registers them
 * when the description of the form changes (a language switch, options loaded asynchronously, a
 * replaced form definition), never for a mere data change.
 *
 * @example
 * const config = {
 *   formDef,
 *   plugins: [webmcp({ name: 'signup', description: 'Create a new account' })],
 * };
 */
export function webmcp(options: WebmcpOptions): FormPlugin {
  assertBaseName(options.name);
  if (typeof options.description !== 'string' || options.description.trim() === '') {
    throw new TypeError('[GolemUI webmcp] "description" is required: tell the agent what the form is for.');
  }
  for (const override of Object.values(options.toolOverrides ?? {})) {
    if (override?.name !== undefined) {
      assertToolName(override.name);
    }
  }

  return (context) => {
    const modelContext = options.modelContext ?? resolveModelContext();
    if (modelContext === undefined) {
      return undefined;
    }

    const claim = claimBaseName(options.name);
    const registry = new ToolRegistry(modelContext, options.exposedTo);
    let lastDescription: string | undefined;
    let warnedInferred = false;

    const subscription = context.store.state$
      .pipe(
        filter(isDerived),
        map((state) => ({ state, refs: descriptionRefs(state) })),
        distinctUntilChanged((previous, next) => sameRefs(previous.refs, next.refs)),
        debounceTime(REGISTRATION_DELAY_MS),
      )
      .subscribe(({ state }) => {
        try {
          const schema = buildFormSchema(state, context, options);
          const description = JSON.stringify([state.lang, schema.inputSchema]);
          if (description === lastDescription) {
            return;
          }
          lastDescription = description;
          if (schema.inferredTypes.length > 0 && !warnedInferred) {
            warnedInferred = true;
            console.warn(
              `[GolemUI webmcp] No value description for widget type(s) ${schema.inferredTypes.map((type) => `"${type}"`).join(', ')}; their schema was inferred. Describe them through the "fields" option.`,
            );
          }
          registry.replace(buildTools(claim.name, schema, context, options));
        } catch (err) {
          console.error('[GolemUI webmcp] Could not describe the form:', err);
        }
      });

    return () => {
      subscription.unsubscribe();
      registry.release();
      claim.release();
    };
  };
}

/**
 * INITIALIZE alone only decodes the definition; the first SET_DATA runs the first derive and
 * fills `calculatedWidgets`. Nothing is registered before that, nor while the form is errored.
 */
function isDerived(state: State): boolean {
  return state.formHealth.status === 'ok' && Object.keys(state.calculatedWidgets).length > 0;
}

/**
 * The state slices the description is built from. Calculated entries are reference-stable
 * while unchanged, so comparing references is enough to skip the rebuild on a plain data change.
 */
function descriptionRefs(state: State): unknown[] {
  const refs: unknown[] = [state.formDef, state.flatForm, state.lang, state.widgetPropOverrides];
  for (const [uid, widget] of Object.entries(state.flatForm)) {
    if (inputPath(widget) !== undefined) {
      refs.push(state.calculatedWidgets[uid as Uid]);
    }
  }
  return refs;
}

function sameRefs(previous: unknown[], next: unknown[]): boolean {
  return previous.length === next.length && previous.every((ref, index) => ref === next[index]);
}
