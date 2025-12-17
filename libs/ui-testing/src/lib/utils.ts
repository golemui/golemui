import * as Core from '@golemui/core';
import { Action, Middleware, State } from '@golemui/core';
import { CustomValidatorSchemas } from '@golemui/validators-vanilla';

export type MountComponentFn<StateKeys extends Core.UiState = string> = (
  formDef: Core.Form<StateKeys>,
  middlewares?: Middleware<State, Action>[],
  validators?: CustomValidatorSchemas,
) => void;
