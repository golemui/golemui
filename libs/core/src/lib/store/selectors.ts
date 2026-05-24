import {
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  type Observable,
  pipe,
  startWith,
} from 'rxjs';
import { type LayoutWidget } from '../form-widget';
import { type DotPath, type Uid } from '../shared';
import { get } from '../utils/object';
import { type State } from './model';

// --------------------------------
//
// DATA
//
// --------------------------------

const selectData = pipe(
  map((store: State) => store.data),
  distinctUntilChanged(),
);

export const dataByPath$ = <T = any>(path: DotPath) =>
  pipe(
    selectData,
    map((data) => get<T>(data, path)),
    distinctUntilChanged(),
  );

// --------------------------------
//
// VALIDATIONS
//
// --------------------------------

const selectValidations = pipe(
  filter((store: State) => store.touched === true),
  map((store) => store.validations),
  distinctUntilChanged(),
);

export const validationByPath$ = (path: DotPath) =>
  pipe(
    selectValidations,
    map((validations) => validations[path]),
    distinctUntilChanged(),
  );

// --------------------------------
//
// INJECTED VALIDATIONS
//
// --------------------------------

const selectInjectedValidations = pipe(
  filter((store: State) => store.touched === true),
  map((store) => store.injectedValidations),
  distinctUntilChanged(),
);

export const injectedValidationByPath$ = (path: DotPath) =>
  pipe(
    selectInjectedValidations,
    map((validations) => validations[path]),
    distinctUntilChanged(),
    // we want to make sure combineLatest([validation$, injectedValidation$]) triggers
    startWith(null),
  );

// --------------------------------
//
// CALCULATED WIDGETS
//
// --------------------------------

const selectLang = pipe(
  map((store: State) => store.lang),
  distinctUntilChanged(),
);

const selectCalculatedWidgets = pipe(
  map((store: State) => store.calculatedWidgets),
  distinctUntilChanged(),
);

/**
 * Emits the current calculated widget for the given uid
 * Re triggers on widget changes OR store.lang changes
 */
export const calculatedWidgetsByUid$ = (uid: Uid) => (state$: Observable<State>) => {
  return combineLatest([state$.pipe(selectLang), state$.pipe(selectCalculatedWidgets)]).pipe(
    map(([lang, calculatedWidgets]) => ({ lang, widget: calculatedWidgets[uid] })),
    filter((data) => data.widget !== undefined),
    distinctUntilChanged((prev, curr) => {
      return prev.lang === curr.lang && prev.widget === curr.widget;
    }),
    map((data) => data.widget.current),
  );
};

// --------------------------------
//
// LAYOUT CHILDREN
//
// --------------------------------

export const calculatedLayoutChildrenByUid$ = (uid: Uid) =>
  pipe(
    selectCalculatedWidgets,
    map((calculatedWidgets) => calculatedWidgets[uid]),
    filter((derivedWidget) => derivedWidget !== undefined),
    map((derivedWidget) => (derivedWidget.current as LayoutWidget).children),
    distinctUntilChanged(),
  );

// --------------------------------
//
// WIDGET FLAGS
//
// --------------------------------

export const selectWidgetFlags = pipe(
  map((store: State) => store.widgetFlags),
  distinctUntilChanged(),
);

export const widgetFlagsByUid$ = (uid: Uid) =>
  pipe(
    selectWidgetFlags,
    map((widgetFlags) => widgetFlags[uid]),
    distinctUntilChanged(),
  );

// --------------------------------
//
// TOUCHED CONTROLS
//
// --------------------------------

const selectTouchedControls = pipe(
  map((store: State) => store.touchedControls),
  distinctUntilChanged(),
);

export const touchedControlsByPath$ = (path: DotPath) =>
  pipe(
    selectTouchedControls,
    map((touchedControls) => touchedControls[path]),
    distinctUntilChanged(),
  );

// --------------------------------
//
// FORM HEALTH
//
// --------------------------------

const selectFormHealth = pipe(
  map((store: State) => store.formHealth),
  distinctUntilChanged((prev, current) => {
    if (prev.status !== current.status) {
      return false;
    }
    if (prev.status === 'errored' && current.status === 'errored') {
      return prev.message === current.message && prev.code === current.code;
    }
    return true;
  }),
);

export const formHealth = (store: Observable<State>) => store.pipe(selectFormHealth);
