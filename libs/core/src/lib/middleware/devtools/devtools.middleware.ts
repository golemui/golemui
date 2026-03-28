import { Action } from '../../store/actions';
import { Middleware, State } from '../../store/model';

interface DevToolsConnection {
  init(state: unknown): void;
  send(action: unknown, state: unknown): void;
}

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__?: {
      connect(options?: { name?: string }): DevToolsConnection;
    };
  }
}

export function devToolsMiddleware(name = 'GolemUI Form Store'): Middleware<State, Action> {
  return (api) => {
    const ext = typeof window !== 'undefined' ? window.__REDUX_DEVTOOLS_EXTENSION__ : undefined;
    const devTools = ext?.connect({ name });
    devTools?.init(api.getState());

    return (next) => (action) => {
      next(action);
      devTools?.send(action, api.getState());
    };
  };
}
