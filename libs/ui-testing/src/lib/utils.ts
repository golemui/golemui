import * as Core from '@golemui/core';
import { Action, Middleware, State } from '@golemui/core';

export type MountComponentFn<StateKeys extends Core.UiState = string> = (
  formDef: Core.Form<StateKeys>,
  middlewares?: Middleware<State, Action>[],
) => void;
