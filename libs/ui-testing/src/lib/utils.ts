import * as Core from '@golemui/core';
import { Action, Middleware, State, ValidateOn } from '@golemui/core';
import { Dependencies } from '@golemui/gui-shared';
import { CustomValidatorSchemas } from '@golemui/gui-validators';

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
  dependencies?: Dependencies;
}

export type MountComponentFn<StateKeys extends Core.UiState = string> = (
  options: MountOptions<StateKeys>,
) => void;

// This command forces the Chrome V8 engine to clear memory immediately after every single test.
// Without this, the heap size could grow linearly with every test in the spec file until the GitHub Runner hits its 7GB limit and kills the process.
export const memoryCleaner = () => {
  if (Cypress.browser.family === 'chromium') {
    // Note: cy.log is optional, but helpful to see it's working in the runner
    Cypress.automation('remote:debugger:protocol', {
      command: 'Memory.forcedGC',
      params: {},
    }).catch((e) => {
      // Fail gracefully if the browser doesn't support the command
      console.warn('GC failed:', e);
    });
  }
};
