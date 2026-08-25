import { distinctUntilChanged, map, type Observable, pipe } from 'rxjs';
import { type State } from './model';

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
