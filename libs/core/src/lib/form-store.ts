import { BehaviorSubject, distinctUntilChanged, type Observable } from 'rxjs';
import { type ValidatorFn } from './form-validator';
import { type I18nTranslator } from './i18n';
import { type ExpressionFunctions, type ValidateOn } from './shared';
import { type Action } from './store/actions';
import { createInitialState, type Middleware, type MiddlewareAPI, type State } from './store/model';
import { reducer } from './store/reducer';

export function createFormStore(
  middlewares: Middleware<State, Action>[] = [],
  validators: ValidatorFn<any>,
  validateOn: ValidateOn,
  localization: I18nTranslator,
  functions: ExpressionFunctions = {},
): FormStore {
  const subject = new BehaviorSubject<State>(createInitialState(localization.lang));
  const state$ = subject.asObservable().pipe(distinctUntilChanged());
  const reducerFn = reducer({ validators, validateOn, localization, functions });

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
