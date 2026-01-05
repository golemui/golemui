import { distinctUntilChanged, filter, map, Observable, pipe, startWith } from 'rxjs';
import { LayoutField } from '../form-field';
import { DotPath, Uid } from '../shared';
import * as Obj from '../utils/object';
import { State } from './model';

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
    map((data) => Obj.get<T>(data, path)),
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
    distinctUntilChanged((prev, current) => prev?.status !== current?.status),
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
// CALCULATED FIELDS
//
// --------------------------------

const selectCalculatedFields = pipe(
  map((store: State) => store.calculatedFields),
  distinctUntilChanged(),
);

export const calculatedFieldsByUid$ = (uid: Uid) =>
  pipe(
    selectCalculatedFields,
    map((calculatedFields) => calculatedFields[uid]),
    filter((derivedField) => derivedField !== undefined),
    map((derivedField) => derivedField.current),
    distinctUntilChanged(),
  );

// --------------------------------
//
// LAYOUT CHILDREN
//
// --------------------------------

export const calculatedLayoutChildrenByUid$ = (uid: Uid) =>
  pipe(
    selectCalculatedFields,
    map((calculatedFields) => calculatedFields[uid]),
    filter((derivedField) => derivedField !== undefined),
    map((derivedField) => (derivedField.current as LayoutField).children),
    distinctUntilChanged(),
  );

// --------------------------------
//
// FIELD FLAGS
//
// --------------------------------

export const selectFieldFlags = pipe(
  map((store: State) => store.fieldFlags),
  distinctUntilChanged(),
);

export const fieldFlagsByUid$ = (uid: Uid) =>
  pipe(
    selectFieldFlags,
    map((fieldFlags) => fieldFlags[uid]),
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
  distinctUntilChanged(),
);

export const formHealth = (store: Observable<State>) => store.pipe(selectFormHealth);
