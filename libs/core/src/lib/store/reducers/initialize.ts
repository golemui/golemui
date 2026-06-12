import { formatIssuePath } from 'ts.data.json';
import { errorCodes } from '../../errors';
import { type Form, formDefDecoder } from '../../form';
import { type FormWidget, isInputWidget } from '../../form-widget';
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

  // GUARD: gui.* facade items (`type: 'ITEMS'`) must be expanded by resolveFormInput before reaching
  // core. If any survive — the classic case is `{ states, form: [...] }` passed as `formDef` (it
  // type-checks but is never resolved) — the form would render BLANK. Fail loud with a fix instead.
  if (containsUnresolvedDxItems(formDef)) {
    const code = errorCodes.initializeUnresolvedDxError;
    return {
      ...initialState,
      formHealth: { status: 'errored', code, message: `[${code}] ${unresolvedDxErrorMessage}` },
    };
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
      const code = errorCodes.initializeUidCollisionError;
      formHealth = {
        status: 'errored',
        message: `[${code}] ${uidCollisionErrorMessage(error.existingWidget, error.newWidget)}`,
        code,
      };
      flatForm = {};
    }

    // Dev diagnostic: an `include`/`exclude` naming a state not in `formConfig.states` leaves the widget
    // hidden forever (a typo'd/undeclared state) — surface it loudly. Console-only; the form still works.
    warnUndeclaredStateReferences(flatForm, result.value.states);

    return {
      ...initialState,
      formDef: result.value as Form,
      flatForm,
      formHealth,
    };
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

/** A gui.* facade item, before resolveFormInput expands it, carries `type: 'ITEMS'`. */
function isUnresolvedDxItem(node: unknown): boolean {
  return !!node && typeof node === 'object' && (node as Record<string, unknown>)['type'] === 'ITEMS';
}

/** True when a `gui.*` form was passed to core without going through resolveFormInput first. */
function containsUnresolvedDxItems(formDef: unknown): boolean {
  if (!formDef || typeof formDef !== 'object') return false;
  const form = (formDef as Record<string, any>)['form'];
  if (isUnresolvedDxItem(form)) return true;
  return Array.isArray(form) && form.some(isUnresolvedDxItem);
}

/**
 * Console-warns when a widget's `include: { in: [...] }` / `exclude: { from: [...] }` names a state that
 * is not declared in the form's `states` (i.e. `formConfig.states` on the gui.* facade). Such a reference
 * never matches an active state, so the widget stays hidden with no other signal — a common silent bug.
 */
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
      if (declared.has(name)) continue;
      const uids = offenders.get(name) ?? [];
      uids.push((widget.uid as string) || '(unknown)');
      offenders.set(name, uids);
    }
  }
  if (offenders.size === 0) return;
  const available = declared.size ? [...declared].join(', ') : '(none declared)';
  for (const [name, uids] of offenders) {
    console.error(
      `[GolemUI] include/exclude references undefined state "${name}" (on ${uids.join(', ')}); ` +
        `these widgets will stay hidden. Declared states: ${available}. ` +
        `Fix: declare "${name}" in formConfig.states, or correct the name.`,
    );
  }
}

const unresolvedDxErrorMessage =
  'This form was built with the gui.* helpers but passed to the form in the wrong shape, so its ' +
  'fields were never resolved (the form would render blank). Fix: pass the gui.* array DIRECTLY as ' +
  'formDef — `config={{ formDef: form }}` — and put any named `states` in `formConfig`: ' +
  '`config={{ formDef: form, formConfig: { states } }}`. Do NOT wrap them as a ' +
  '`{ states, form: [...] }` object and pass that as formDef.';

function uidCollisionErrorMessage(
  existingWidget: FormWidget<string>,
  newWidget: FormWidget<string>,
) {
  const getPath = (f: FormWidget<string>) => (isInputWidget(f) ? ` at "${f.path}"` : '');
  return `Duplicate UID "${newWidget.uid}": Assigned to widget "${existingWidget.type}"${getPath(existingWidget)} and "${newWidget.type}"${getPath(newWidget)}.`;
}
