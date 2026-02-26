import * as Core from '@golemui/core';
import { Action, Middleware, State, ValidateOn } from '@golemui/core';
import { CustomValidatorSchemas } from '@golemui/validators';

export interface MountOptions<StateKeys extends Core.UiState = string> {
  formDef: Core.Form<StateKeys>;
  data?: Record<string, any>;
  middlewares?: Middleware<State, Action>[];
  validators?: CustomValidatorSchemas;
  formEvent?: (event: Core.FormEvent) => void | Promise<void>;
  formHealth?: (error: Core.FormHealth) => void | Promise<void>;
  validateOn?: ValidateOn;
  withCustomComponent?: boolean;
  localization?: Core.I18nTranslator;
}

export type MountComponentFn<StateKeys extends Core.UiState = string> = (
  options: MountOptions<StateKeys>,
) => void;
