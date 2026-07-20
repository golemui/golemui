import type {
  ExpressionFunctions,
  Form,
  FormEvent,
  FormHealth,
  FormSubmitEvent,
  I18nTranslator,
  UiState,
} from '@golemui/core';
import { type Action, type Middleware, type State, type ValidateOn } from '@golemui/core';
import { type Dependencies } from '@golemui/gui-shared';
import { type CustomValidatorSchemas } from '@golemui/gui-validators';

export interface FormHandle {
  setData: (data: Record<string, any>) => void;
  setMeta: (meta: Record<string, any>) => void;
}

export interface MountOptions<StateKeys extends UiState = string> {
  formDef: Form<StateKeys>;
  data?: Record<string, any>;
  meta?: Record<string, any>;
  middlewares?: Middleware<State, Action>[];
  validators?: CustomValidatorSchemas;
  formEvent?: (event: FormEvent) => void | Promise<void>;
  formHealth?: (error: FormHealth) => void | Promise<void>;
  formSubmit?: (event: FormSubmitEvent) => void;
  validateOn?: ValidateOn;
  withCustomComponent?: boolean;
  localization?: I18nTranslator;
  dependencies?: Dependencies;
  functions?: ExpressionFunctions;
  onFormReady?: (handle: FormHandle) => void;
}

export type MountComponentFn<StateKeys extends UiState = string> = (
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
      console.warn('⚠️ GC failed:', e);
    });
  }
};
