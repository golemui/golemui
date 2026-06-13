import { formatIssuePath } from 'ts.data.json';
import { errorCodes } from '../../errors';
import { type Form, formDefDecoder } from '../../form';
import { type FormWidget, isInputWidget, isLayoutWidget } from '../../form-widget';
import { flattenForm } from '../../utils/form';
import type { INITIALIZE } from '../actions';
import { createInitialState, type FormHealth, type State } from '../model';

export const initialize = ({ lang }: State, action: INITIALIZE): State => {
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

  // defineForm() converts the form array into a layout (the formDef.form entry point).
  // When the form declaration originates from JSON (i.e., not via defineForm()),
  // the layout must be generated here instead.
  if (Array.isArray((formDef as Record<string, any>)['form'])) {
    const formDef_ = formDef as Record<string, any>;
    const widgets: any[] = formDef_['form'];
    // mutate
    formDef_['form'] = {
      uid: '',
      type: 'flex',
      kind: 'layout',
      children: widgets,
    };
  }

  const result = formDefDecoder.decode(formDef);

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

    warnUndeclaredStateReferences(flatForm, result.value.states);

    return {
      ...initialState,
      formDef: result.value as Form,
      flatForm,
      formHealth,
    };
  }

  const doubleWrapped = detectDoubleWrappedForm(formDef);
  if (doubleWrapped) {
    return { ...initialState, formHealth: doubleWrapped };
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

function erroredHealth(code: number, message: string): FormHealth {
  return { status: 'errored', code, message: `[${code}] ${message}` };
}

function malformedShapeMessage(): string {
  return 'Malformed form definition. Pass it directly as formDef - `config={{ formDef: { states, form: [...] } }}`. Do NOT wrap it in an extra `{ form: ... }`.';
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
  flatForm: State['flatForm'],
  declaredStates: Form['states'],
): void {
  const declared = new Set(Object.keys(declaredStates ?? {}));
  const offenders = new Map<string, string[]>(); // state name -> widget uids that reference it
  for (const widget of Object.values(flatForm)) {
    const refs: string[] = [];
    const include = (widget as { include?: { in?: unknown } }).include;
    if (include && Array.isArray(include.in)) refs.push(...(include.in as string[]));
    const exclude = (widget as { exclude?: { from?: unknown } }).exclude;
    if (exclude && Array.isArray(exclude.from)) refs.push(...(exclude.from as string[]));
    for (const name of refs) {
      if (declared.has(name)) {
        continue;
      }
      const uids = offenders.get(name) ?? [];
      uids.push((widget.uid as string) || '(unknown)');
      offenders.set(name, uids);
    }
  }
  if (offenders.size === 0) {
    return;
  }
  const available = declared.size ? [...declared].join(', ') : '(none declared)';
  for (const [name, uids] of offenders) {
    console.error(
      `[GolemUI] include/exclude references undefined state "${name}" (on ${uids.join(', ')}); ` +
        `these widgets will stay hidden. Declared states: ${available}. ` +
        `Fix: declare "${name}" in formConfig.states, or correct the name.`,
    );
  }
}
