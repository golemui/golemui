import { distinctUntilChanged, map, Observable, pipe } from 'rxjs';
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

const selectFieldFlags = pipe(
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
// FORM FIELDS (calculatedForm)
//
// --------------------------------

const selectCalculatedForm = pipe(
  map((store: State) => store.calculatedForm),
  distinctUntilChanged(),
);

export const calculatedForm = (store: Observable<State>) =>
  store.pipe(selectCalculatedForm);

// --------------------------------
//
// ERRORS
//
// --------------------------------

const selectErrors = pipe(
  map((store: State) => store.error),
  distinctUntilChanged(),
);

export const formErrors = (store: Observable<State>) =>
  store.pipe(selectErrors);
