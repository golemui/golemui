import { BehaviorSubject, distinctUntilChanged, Observable } from 'rxjs';
import { ValidatorConfig } from './form-validator';
import { ValidateOn } from './shared';
import { Action } from './store/actions';
import { createInitialState, Middleware, MiddlewareAPI, State } from './store/model';
import { reducer } from './store/reducer';

export function createFormStore(
  middlewares: Middleware<State, Action>[] = [],
  validatorConfig: ValidatorConfig<any>,
  validateOn: ValidateOn,
): FormStore {
  const subject = new BehaviorSubject<State>(createInitialState());
  const state$ = subject.asObservable().pipe(distinctUntilChanged());
  const reducerFn = reducer({ validatorConfig, validateOn });

  function baseDispatch(action: Action) {
    const current = subject.getValue();
    const next = reducerFn(current, action);
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
