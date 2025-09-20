import { BehaviorSubject, distinctUntilChanged, Observable } from 'rxjs';
import * as Field from './Field';
import * as Form from './Form';

const NoErrors: FormStoreError = { kind: 'none' };

export type FormStoreError =
  | { kind: 'none' }
  | { kind: 'fatal'; error: string }
  | { kind: 'validation'; errors: string[] };

export type State = {
  formName: string;
  formDef: Form.Form;
  data: Record<string, any>;
  error: FormStoreError;
};

const createInitialState = (): State => ({
  formName: '',
  formDef: Form.FormSchema.parse({
    form: Field.stack([] as Field.FormField[]),
  }) as Form.Form,
  data: {},
  error: NoErrors,
});

export type Action =
  | {
      type: 'INITIALIZE';
      payload: { formDef: string | Record<string, any>; formName: string };
    }
  | { type: 'SET_DATA'; payload: { data: Record<string, any> } };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INITIALIZE': {
      const initialState = {
        ...createInitialState(),
        formName: action.payload.formName,
      };
      let formDef = action.payload.formDef;
      let formStoreError: FormStoreError = NoErrors;

      if (typeof formDef === 'string') {
        try {
          formDef = JSON.parse(formDef);
        } catch {
          formStoreError = { kind: 'fatal', error: 'Invalid JSON form schema' };
        }
        if (formStoreError.kind === 'fatal') {
          return { ...initialState, error: formStoreError };
        }
      }

      const { error, success, data } = Form.FormSchema.safeParse(formDef);

      if (success) {
        return { ...initialState, formDef: data as Form.Form };
      }

      return {
        ...initialState,
        error: { kind: 'fatal', error: error.message },
      };
    }

    default: {
      return state;
    }
  }
}

type MiddlewareAPI<S, A> = {
  getState: () => S;
  dispatch: (action: A) => void;
};

export type Middleware<S, A> = (
  api: MiddlewareAPI<S, A>,
) => (next: (action: A) => void) => (action: A) => void;

export function createFormStore(
  middlewares: Middleware<State, Action>[] = [],
): FormStore {
  const subject = new BehaviorSubject<State>(createInitialState());

  const state$ = subject.asObservable().pipe(distinctUntilChanged());

  function baseDispatch(action: Action) {
    const current = subject.getValue();
    const next = reducer(current, action);
    subject.next(next);
  }

  let realDispatch: (action: Action) => void = baseDispatch;

  const middlewareAPI: MiddlewareAPI<State, Action> = {
    getState: () => subject.getValue(),
    dispatch: (action) => realDispatch(action), // reference is updated later
  };

  // Compose middleware chain
  const chain = middlewares.map((mw) => mw(middlewareAPI));
  realDispatch = chain.reduceRight((next, mw) => mw(next), baseDispatch);

  return {
    state$,
    dispatch: realDispatch,
    getState: () => subject.getValue(),
  };
}

export type FormStore = {
  state$: Observable<State>;
  dispatch: (action: Action) => void;
  getState: () => State;
};
