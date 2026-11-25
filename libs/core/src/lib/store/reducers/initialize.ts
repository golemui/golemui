import { formatIssuePath } from 'ts.data.json';
import { compileForm } from '../../compile/compile-form';
import {
  type CompiledExpression,
  type CompiledForm,
  type CompiledWidget,
  forEachCompiledWidget,
} from '../../compile/compiled-form';
import { errorCodes, errorMessage } from '../../errors';
import { type Form, formDefDecoder } from '../../form';
import { type FormWidget, isInputWidget, isLayoutWidget } from '../../form-widget';
import { buildWidgetInstances } from '../../instances/build-instances';
import { recordsOfInstances } from '../../instances/instance-records';
import { type ExpressionPolicy } from '../../utils/check-expression';
import { isDevMode } from '../../utils/dev-mode';
import { flattenForm } from '../../utils/form';
import type { INITIALIZE } from '../actions';
import { createInitialState, type FormHealth, type State } from '../model';

/**
 * Builds the state of a form from a new definition. Only the language of the state before
 * stays. A definition that cannot be used gives a state with an errored form health.
 *
 * @param state - The state before. Only its language is read.
 * @param action - The action with the form definition and the form name.
 * @param expressionPolicy - Which issues of the expression check make an expression fail.
 * @returns The new state. No widget is computed yet.
 */
export const initialize = (
  { lang }: State,
  action: INITIALIZE,
  expressionPolicy: ExpressionPolicy = 'warn',
): State => {
  const initialState = {
    ...createInitialState(lang),
    formName: action.payload.formName,
  };
  let formDef = action.payload.formDef;
  let formHealth: FormHealth = { status: 'ok' };

  if (typeof formDef === 'string') {
    try {
      formDef = JSON.parse(formDef);
    } catch (err) {
      const error = err as Error;
      const code = errorCodes.initializeParseError;
      formHealth = {
        status: 'errored',
        message: `[${code}] ${error.message}`,
        code,
      };
    }
    if (formHealth.status === 'errored') {
      return { ...initialState, formHealth };
    }
  }

  let result: ReturnType<typeof formDefDecoder.decode>;
  try {
    result = formDefDecoder.decode(withRootLayout(formDef));
  } catch (error) {
    // A read of the definition object threw, for example a getter of a prop.
    return {
      ...initialState,
      formHealth: erroredHealth(
        errorCodes.initializeUnknownError,
        `The form definition cannot be read: ${errorMessage(error)}`,
      ),
    };
  }

  if (result.isOk()) {
    formHealth = { status: 'ok' };
    let flatForm = {} as State['flatForm'];
    try {
      flatForm = flattenForm([result.value.form] as FormWidget[]).reduce(
        (acc, cur) => {
          const uid = cur.uid as string;
          if (acc[uid]) {
            throw { existingWidget: acc[uid], newWidget: cur };
          }
          acc[uid] = cur;
          return acc;
        },
        {} as State['flatForm'],
      );
    } catch (error: any) {
      formHealth = uidCollisionError(error.existingWidget, error.newWidget);
      flatForm = {};
    }

    const decodedFormDef = result.value as Form;
    let compiled: CompiledForm;
    try {
      compiled = compileForm(decodedFormDef, expressionPolicy);
    } catch (error) {
      // A read of the definition object threw after the decode, for example the keys of a prop
      // object that can be listed only one time.
      return {
        ...initialState,
        formHealth: erroredHealth(
          errorCodes.initializeUnknownError,
          `The form definition cannot be read: ${errorMessage(error)}`,
        ),
      };
    }
    if (formHealth.status !== 'ok') {
      // A definition with a repeated uid computes no widget. Its states are still evaluated
      // when the host clears the error.
      compiled = { ...compiled, root: undefined };
    }
    warnUndeclaredStateReferences(compiled.root, decodedFormDef.states);
    warnAboutExpressions(compiled);

    // No data yet, so no repeater has a row. The first derive builds the rows.
    const instances = buildWidgetInstances(compiled.root, {}, initialState.instances);
    return {
      ...initialState,
      formDef: decodedFormDef,
      compiled,
      instances,
      flatForm,
      ...recordsOfInstances(instances, compiled.root),
      formHealth,
    };
  }

  const malformedShape = detectBareArrayForm(formDef) ?? detectDoubleWrappedForm(formDef);
  if (malformedShape) {
    return { ...initialState, formHealth: malformedShape };
  }

  const code = errorCodes.initializeUnknownError;
  const message = result.issues
    .map((issue) => {
      const location = issue.path.length > 0 ? formatIssuePath(issue.path) : 'root';
      return `${location}: ${issue.message}`;
    })
    .join('; ');
  return {
    ...initialState,
    formHealth: {
      status: 'errored',
      message: `[${code}] ${message}`,
      code,
    },
  };
};

/**
 * Returns what the decoder reads. `defineForm()` converts the form array into a layout (the
 * `formDef.form` entry point). When the form declaration originates from JSON (not via
 * `defineForm()`), the layout is generated here.
 */
function withRootLayout(formDef: unknown): unknown {
  // `formDef` can be null, undefined or a function at runtime. The decoder reports those.
  if (typeof formDef !== 'object' || formDef === null) {
    return formDef;
  }
  const form = (formDef as Record<string, any>)['form'];
  if (!Array.isArray(form)) {
    return formDef;
  }
  const widgets: any[] = form;
  // A copy, because the caller keeps using the object it dispatched.
  return {
    ...(formDef as Record<string, any>),
    form: {
      uid: '',
      type: 'grid',
      kind: 'layout',
      children: widgets,
    },
  };
}

function erroredHealth(code: number, message: string): FormHealth {
  return { status: 'errored', code, message: `[${code}] ${message}` };
}

function malformedShapeMessage(): string {
  return 'Malformed form definition. Pass it directly as formDef - `config={{ formDef: { states, form: [...] } }}`. Do NOT wrap it in an extra `{ form: ... }`.';
}

function bareArrayMessage(): string {
  return 'The form definition is an array of widgets. Pass a document with a `form` key - `config={{ formDef: { form: [...] } }}`.';
}

/**
 * A form definition is a document with a `form` key. The bare widget array is not one.
 */
function detectBareArrayForm(formDef: unknown): FormHealth | null {
  if (!Array.isArray(formDef)) {
    return null;
  }
  return erroredHealth(errorCodes.initializeMalformedFormShapeError, bareArrayMessage());
}

/**
 * A valid `form` is an array or a `kind: 'layout'` widget; any other object is a double-wrap bug.
 */
function detectDoubleWrappedForm(formDef: unknown): FormHealth | null {
  if (!formDef || typeof formDef !== 'object' || Array.isArray(formDef)) {
    return null;
  }
  const form = (formDef as Record<string, any>)['form'];

  if (
    form &&
    typeof form === 'object' &&
    !Array.isArray(form) &&
    !isLayoutWidget(form as FormWidget)
  ) {
    return erroredHealth(errorCodes.initializeMalformedFormShapeError, malformedShapeMessage());
  }

  return null;
}

/** Errored FormHealth for two widgets sharing a UID (raised while flattening the form). */
function uidCollisionError(
  existingWidget: FormWidget<string>,
  newWidget: FormWidget<string>,
): FormHealth {
  const getPath = (f: FormWidget<string>) => (isInputWidget(f) ? ` at "${f.path}"` : '');
  const message = `Duplicate UID "${newWidget.uid}": Assigned to widget "${existingWidget.type}"${getPath(existingWidget)} and "${newWidget.type}"${getPath(newWidget)}.`;
  return erroredHealth(errorCodes.initializeUidCollisionError, message);
}

/** console.error when an `include.in` / `exclude.from` names an undeclared state. */
function warnUndeclaredStateReferences(
  root: CompiledWidget | undefined,
  declaredStates: Form['states'],
): void {
  const declared = new Set(Object.keys(declaredStates ?? {}));
  const offenders = new Map<string, string[]>(); // state name -> widget uids that reference it
  forEachCompiledWidget(root, (widget) => {
    const { include, exclude } = widget.conditions;
    const refs: string[] = [];
    if (include !== undefined && 'in' in include) {
      refs.push(...include.in);
    }
    if (exclude !== undefined && 'from' in exclude) {
      refs.push(...exclude.from);
    }
    for (const name of refs) {
      if (declared.has(name)) {
        continue;
      }
      const uids = offenders.get(name) ?? [];
      uids.push(widget.source.uid || '(unknown)');
      offenders.set(name, uids);
    }
  });
  if (offenders.size === 0) {
    return;
  }
  const available = declared.size ? [...declared].join(', ') : '(none declared)';
  for (const [name, uids] of offenders) {
    console.error(
      `[GolemUI] include/exclude references undefined state "${name}" (on ${uids.join(', ')}); ` +
        `these widgets will stay hidden. Declared states: ${available}. ` +
        `Fix: declare "${name}" in the "states" of the form definition, or correct the name.`,
    );
  }
}

/**
 * In dev mode, prints the warning of each state expression and of each condition that has one.
 * A text that the form uses in several places gives one warning.
 */
function warnAboutExpressions(compiled: CompiledForm): void {
  if (!isDevMode()) {
    return;
  }
  const warnings = new Set<string>();
  const collect = (expression: CompiledExpression | undefined): void => {
    if (expression?.warning !== undefined) {
      warnings.add(expression.warning);
    }
  };
  for (const state of compiled.states) {
    collect(state.condition);
  }
  forEachCompiledWidget(compiled.root, ({ conditions }) => {
    collect(
      conditions.include !== undefined && 'when' in conditions.include
        ? conditions.include.when
        : undefined,
    );
    collect(
      conditions.exclude !== undefined && 'when' in conditions.exclude
        ? conditions.exclude.when
        : undefined,
    );
    collect(conditions.disabled);
    collect(conditions.readonly);
  });
  for (const warning of warnings) {
    console.warn(warning);
  }
}
