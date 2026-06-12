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

function uidCollisionErrorMessage(
  existingWidget: FormWidget<string>,
  newWidget: FormWidget<string>,
) {
  const getPath = (f: FormWidget<string>) => (isInputWidget(f) ? ` at "${f.path}"` : '');
  return `Duplicate UID "${newWidget.uid}": Assigned to widget "${existingWidget.type}"${getPath(existingWidget)} and "${newWidget.type}"${getPath(newWidget)}.`;
}
