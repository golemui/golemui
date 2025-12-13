import { State } from '../store/model';

export class GUIApi {
  private _data: any = {};

  set state(state: State) {
    this._data = this.deepFrozenCopy(state.data);
  }

  get data(): any {
    return this._data;
  }

  private deepFrozenCopy(o: any) {
    const frozenCopy = Object.assign({}, o);
    Object.freeze(frozenCopy);

    Object.getOwnPropertyNames(frozenCopy).forEach((prop) => {
      if (
        frozenCopy[prop] !== null &&
        (typeof frozenCopy[prop] === 'object' || typeof frozenCopy[prop] === 'function') &&
        !Object.isFrozen(frozenCopy[prop])
      ) {
        this.deepFrozenCopy(frozenCopy[prop]);
      }
    });

    return frozenCopy;
  }
}
