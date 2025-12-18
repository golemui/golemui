import * as Core from '@golemui/core';
import { Action, Middleware, State } from '@golemui/core';
import { CustomValidatorSchemas } from '@golemui/validators-vanilla';

export interface MountOptions<StateKeys extends Core.UiState = string> {
  formDef: Core.Form<StateKeys>;
  middlewares?: Middleware<State, Action>[];
  validators?: CustomValidatorSchemas;
  withCustomComponent?: boolean;
}

export type MountComponentFn<StateKeys extends Core.UiState = string> = (
  options: MountOptions<StateKeys>,
) => void;
