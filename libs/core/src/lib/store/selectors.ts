import { distinctUntilChanged, map, pipe } from 'rxjs';
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

//export const data$ = (store: Observable<State>) => store.pipe(selectData);

export const dataByPath$ = <T = any>(path: DotPath) =>
  pipe(
    selectData,
    map((data) => Obj.get<T>(data, path)),
    distinctUntilChanged(),
  );

// --------------------------------
//
// COMPONENTS
//
// --------------------------------

const selectComponents = pipe(
  map((store: State) => store.components),
  distinctUntilChanged(),
);

//export const components$ = (store: Observable<State>) => store.pipe(selectComponents);

export const componentsByUid$ = (uid: Uid) =>
  pipe(
    selectComponents,
    map((components) => components[uid]),
    distinctUntilChanged(),
  );
