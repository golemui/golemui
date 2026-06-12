import { formatIssuePath } from 'ts.data.json';
import { errorCodes } from '../../errors';
import { type Form, formDefDecoder } from '../../form';
import type { FormWidget } from '../../form-widget';
import { flattenForm } from '../../utils/form';
import type { INITIALIZE } from '../actions';
import { createInitialState, type FormHealth, type State } from '../model';
import {
  detectMalformedFormShape,
  uidCollisionError,
  warnUndeclaredStateReferences,
} from './error-detection';

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

  // GUARD: a form passed in the wrong shape — the classic case is an extra `{ form: ... }` wrapper
  // around the actual definition (gui.* items or a JSON form) — type-checks but is never resolved,
  // so the form would render BLANK. Fail loud with an API-specific fix instead.
  const malformed = detectMalformedFormShape(formDef);
  if (malformed) {
    return { ...initialState, formHealth: malformed };
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
