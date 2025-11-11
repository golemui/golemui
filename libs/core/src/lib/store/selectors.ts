import { distinctUntilChanged, filter, map, Observable, pipe } from 'rxjs';
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
  map((store: State) => store.validations),
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
// FIELDS
//
// --------------------------------

const selectFields = pipe(
  map((store: State) => store.fields),
  distinctUntilChanged(),
);

export const fieldsByUid$ = (uid: Uid) =>
  pipe(
    selectFields,
    map((fields) => fields[uid]),
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
// FIELD PROP OVERRIDES
//
// --------------------------------

export const selectFieldPropOverrides = pipe(
  map((store: State) => store.fieldPropOverrides),
  distinctUntilChanged(),
);

export const fieldPropOverridesByUid$ = (uid: Uid) =>
  pipe(
    selectFieldPropOverrides,
    map((fieldPropOverrides) => fieldPropOverrides[uid]),
    filter((fieldPropOverrides) => fieldPropOverrides !== undefined),
    distinctUntilChanged(),
  );

// --------------------------------
//
// CURRENT STATES
//
// --------------------------------

const selectCurrentStates = pipe(
  map((store: State) => store.currentStates),
  distinctUntilChanged(),
);

export const currentStates = (store: Observable<State>) => store.pipe(selectCurrentStates);

// --------------------------------
//
// ERRORS
//
// --------------------------------

const selectErrors = pipe(
  map((store: State) => store.error),
  distinctUntilChanged(),
);

export const formErrors = (store: Observable<State>) => store.pipe(selectErrors);
