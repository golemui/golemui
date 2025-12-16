import * as Core from '@golemui/core';

export type MountComponentFn<StateKeys extends Core.UiState = string> = (
  formDef: Core.Form<StateKeys>,
) => void;
