import type { DotPath, FormPluginContext, Uid } from '@golemui/core';
import { pruneHiddenData } from '@golemui/core/internals';
import { applyInput, redactValues } from './coerce';
import type { FormSchema } from './schema';
import type { WebmcpResult } from './types';

/** Above this many serialized characters the values are left out of a result. */
const VALUES_SIZE_LIMIT = 64_000;

const error = (message: string): WebmcpResult => ({ status: 'error', message });

/** `read`: the current values and validity, nothing dispatched. */
export function runRead(context: FormPluginContext, schema: FormSchema): WebmcpResult {
  const state = context.store.getState();
  if (state.formHealth.status === 'errored') {
    return error(`The form is not operational: ${state.formHealth.message}`);
  }
  const report = context.validate();
  return withValues(
    {
      status: 'read',
      isValid: report.isValid,
      errors: report.errors,
      hidden: hiddenPaths(context, schema),
    },
    context,
    schema,
  );
}

/**
 * `fill` and `submit`: writes the accepted values in one `SET_DATA`, emits a `change` for every
 * written visible widget (its `on.change` handlers and the validateOn-gated validation run,
 * as they do for a user), then previews the validation or submits.
 */
export function runFill(
  context: FormPluginContext,
  schema: FormSchema,
  input: unknown,
  submit: boolean,
): WebmcpResult {
  const state = context.store.getState();
  if (state.formHealth.status === 'errored') {
    return error(`The form is not operational: ${state.formHealth.message}`);
  }
  if (input === undefined || input === null) {
    input = {};
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    return error('The input must be an object whose keys are the form fields.');
  }

  const applied = applyInput(input as Record<string, unknown>, schema.fields, state.data);
  context.store.dispatch({ type: 'SET_DATA', payload: { data: applied.data } });

  const afterWrite = context.store.getState();
  const notVisible: DotPath[] = [];
  for (const field of applied.written) {
    const current = afterWrite.calculatedWidgets[field.uid as Uid]?.current;
    if (current !== undefined) {
      context.emitEvent('change', current as never);
    } else {
      notVisible.push(field.path);
    }
  }

  const rejected = Object.keys(applied.errors).length > 0;
  let status: WebmcpResult['status'] = 'filled';
  if (submit) {
    // A rejected value never reaches the data, so a submit with rejections would submit a
    // form the agent did not describe. It is refused as invalid instead.
    status = !rejected && context.submit() ? 'submitted' : 'invalid';
  }

  const report = context.validate();
  const result: WebmcpResult = {
    status,
    isValid: report.isValid && !rejected,
    errors: { ...report.errors, ...applied.errors },
  };
  if (notVisible.length > 0) {
    result.notVisible = notVisible;
  }
  if (applied.ignored.length > 0) {
    result.ignored = applied.ignored;
  }
  return withValues(result, context, schema);
}

function withValues(
  result: WebmcpResult,
  context: FormPluginContext,
  schema: FormSchema,
): WebmcpResult {
  const values = compact(
    redactValues(pruneHiddenData(context.store.getState()), schema.fields),
  ) as Record<string, unknown>;
  if (JSON.stringify(values).length > VALUES_SIZE_LIMIT) {
    return { ...result, values: {}, valuesTruncated: true };
  }
  return { ...result, values };
}

/**
 * Drops the `undefined` placeholders the derive writes for every input path, and the objects
 * that held nothing else, so the agent sees only the values that exist.
 */
function compact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(compact);
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }
  const source = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(source)) {
    const child = compact(source[key]);
    const emptied =
      child !== null &&
      typeof child === 'object' &&
      !Array.isArray(child) &&
      Object.keys(child as object).length === 0 &&
      Object.keys(source[key] as object).length > 0;
    if (child !== undefined && !emptied) {
      out[key] = child;
    }
  }
  return out;
}

function hiddenPaths(context: FormPluginContext, schema: FormSchema): DotPath[] {
  const state = context.store.getState();
  return schema.fields
    .filter((field) => state.widgetFlags[field.uid as Uid]?.hidden === true)
    .map((field) => field.path);
}
