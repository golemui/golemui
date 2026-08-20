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
import { type Dependencies } from '@golemui/dx';
import { type CustomValidatorSchemas } from '@golemui/gui-validators';

export interface FormHandle {
  setData: (data: Record<string, any>) => void;
  setMeta: (meta: Record<string, any>) => void;
  /** Replaces the mounted form's whole config object, which reinitializes the form. */
  setConfig: (next: SetConfigInput) => void;
}

/** The parts of the config `FormHandle.setConfig` replaces. */
export interface SetConfigInput {
  formDef: Form<any>;
  data?: Record<string, any>;
  meta?: Record<string, any>;
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

const PILLS_WIDTH_STYLE_ID = 'ui-testing-pills-width-override';

const setPillsWidth = (wrapperSelector: string, width: string) => {
  cy.document().then((doc) => {
    let style = doc.getElementById(PILLS_WIDTH_STYLE_ID);
    if (!style) {
      style = doc.createElement('style');
      style.id = PILLS_WIDTH_STYLE_ID;
      doc.head.appendChild(style);
    }
    style.textContent = `${wrapperSelector} { width: ${width} !important; max-width: none !important; }`;
  });
};

export const forcePillsStripMode = (wrapperSelector: string) =>
  setPillsWidth(wrapperSelector, '700px');

export const forcePillsCompactMode = (wrapperSelector: string) =>
  setPillsWidth(wrapperSelector, '400px');

export const clearPillsWidthOverride = () => {
  cy.document().then((doc) => doc.getElementById(PILLS_WIDTH_STYLE_ID)?.remove());
};

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
