import type {
  ExpressionFunctions,
  Form,
  FormEvent,
  FormHealth,
  FormSubmitEvent,
  I18nTranslator,
  MutableI18nTranslator,
  UiState,
} from '@golemui/core';
import {
  type Action,
  identityTranslator,
  type Middleware,
  type State,
  type ValidateOn,
} from '@golemui/core';
import { type Dependencies } from '@golemui/dx';
import { type CustomValidatorSchemas } from '@golemui/gui-validators';

export interface FormHandle {
  setData: (data: Record<string, any>) => void;
  setMeta: (meta: Record<string, any>) => void;
  setHealth: (health: FormHealth) => void;
  /** Replaces the mounted form's whole config object, which reinitializes the form. */
  setConfig: (next: SetConfigInput) => void;
  /**
   * Renders the host again and passes the same config object to the form. Resolves after two
   * animation frames, so a render or effect that the host render starts has finished.
   */
  rerender: () => Promise<void>;
}

/**
 * The parts of the config `FormHandle.setConfig` replaces. `formName` and `localization` keep
 * their current value when the key is missing. A key set to `undefined` removes the value.
 */
export interface SetConfigInput {
  formDef: Form<any>;
  data?: Record<string, any>;
  meta?: Record<string, any>;
  formName?: string;
  localization?: I18nTranslator;
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
  /**
   * Adds the custom widget loaders of the test fixtures: `heading` (display), `customdate`
   * (input), `customLayout` (layout) and `customAction` (action).
   */
  withCustomComponent?: boolean;
  /**
   * Loads every widget component with `preloadFormWidgets` before the mount, so the form renders
   * the widgets without a dynamic import. The loaded components stay loaded for the next tests
   * of the same spec file.
   */
  preloadWidgets?: boolean;
  /** Adds the `custom` item renderer of the test fixtures to `config.itemRenderers`. */
  withCustomItemRenderer?: boolean;
  localization?: I18nTranslator;
  dependencies?: Dependencies;
  functions?: ExpressionFunctions;
  onFormReady?: (handle: FormHandle) => void;
  /** The `formName` of the config, which is also the id of the form element. */
  formName?: string;
  /** The `autocomplete` attribute of the form element. */
  autocomplete?: string;
  /**
   * Mounts one more form per entry after the first, with the same options: the same definition,
   * data, handlers and widgets. An entry's `formName` replaces the shared one, and without it the
   * form generates its own. `onFormReady` gets the handle of the first form only.
   */
  extraForms?: ExtraFormOptions[];
}

/** A form mounted next to the first one, see `MountOptions.extraForms`. */
export interface ExtraFormOptions {
  formName?: string;
  formSubmit?: (event: FormSubmitEvent) => void;
}

export type MountComponentFn<StateKeys extends UiState = string> = (
  options: MountOptions<StateKeys>,
) => void;

/** The `formName` of the forms that the suites selecting elements by id mount. */
export const TEST_FORM_NAME = 'test-form';

/**
 * The DOM id of a widget part in a form named {@link TEST_FORM_NAME}: every DOM id starts with
 * the form's name, see `toDomId` in `@golemui/core`.
 *
 * @param id - The id without the prefix, the widget uid or an id built from it.
 * @example
 * testDomId('email-textinput_label'); // 'test-form-email-textinput_label'
 */
export const testDomId = (id: string) => `${TEST_FORM_NAME}-${id}`;

/**
 * Mounts every form with `formName` {@link TEST_FORM_NAME} unless the options set one, so a suite
 * can select its elements by the ids {@link testDomId} returns.
 */
export const withTestFormName =
  <StateKeys extends UiState = string>(
    mountFn: MountComponentFn<StateKeys>,
  ): MountComponentFn<StateKeys> =>
  (options) =>
    mountFn({ ...options, formName: options.formName ?? TEST_FORM_NAME });

/**
 * A translator that looks keys up in one dictionary per language, falling back to the default and
 * then the key. `setLang` switches the dictionary and notifies the form.
 */
export const dictionaryTranslator = (
  lang: string,
  dictionaries: Record<string, Record<string, string>>,
): MutableI18nTranslator => {
  const translator = identityTranslator(lang);
  return {
    ...translator,
    get lang() {
      return translator.lang;
    },
    translate: (key, _params, defaultValue) =>
      dictionaries[translator.lang]?.[key] ?? defaultValue ?? key,
  };
};

/**
 * Waits for two animation frames and one task.
 *
 * @returns A promise that resolves after the second frame and the task that follows it.
 */
export const afterTwoFrames = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 0)));
  });

/** The form events with this name that a `formEvent` stub received, in order. */
export const eventsNamed = (handler: sinon.SinonStub, name: string): FormEvent[] =>
  handler
    .getCalls()
    .map((call) => call.args[0] as FormEvent)
    .filter((event) => event.name === name);

const PILLS_WIDTH_STYLE_ID = 'ui-testing-pills-width-override';

/**
 * Fails when an id appears more than once in the document, which also breaks every `aria-controls`
 * and `aria-labelledby` that names it. The style element this file injects is excluded.
 */
export const expectNoDuplicateIds = () => {
  cy.document().then((doc) => {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    doc.querySelectorAll('[id]').forEach((element) => {
      const id = element.id;
      if (!id || id === PILLS_WIDTH_STYLE_ID) {
        return;
      }
      if (seen.has(id)) {
        duplicates.add(id);
      }
      seen.add(id);
    });

    expect(Array.from(duplicates), 'duplicate DOM ids').to.deep.equal([]);
  });
};

/** The attributes that point at other elements by id. */
const ID_REFERENCES = [
  'for',
  'aria-describedby',
  'aria-labelledby',
  'aria-controls',
  'aria-activedescendant',
  'aria-errormessage',
  'aria-owns',
  'list',
  'popovertarget',
];

/**
 * Fails when two elements of the page share an id, or when an id reference inside a `<form>`
 * points at an element outside that form. With several forms on one page, such a reference makes
 * a label focus, or a screen reader announce, the field of another form.
 *
 * A closed picker's `aria-controls` may point at nothing: its popup renders only while it is open.
 */
export const assertIdsScopedPerForm = () => {
  expectNoDuplicateIds();
  cy.get('form').should((forms) => {
    forms.each((_, form) => {
      for (const attribute of ID_REFERENCES) {
        form.querySelectorAll(`[${attribute}]`).forEach((node) => {
          for (const id of (node.getAttribute(attribute) ?? '').split(/\s+/).filter(Boolean)) {
            const target = form.ownerDocument.getElementById(id);
            const closedPopup =
              attribute === 'aria-controls' && node.getAttribute('aria-expanded') === 'false';
            if (!target && closedPopup) continue;
            const where = `#${id}, from ${attribute} in form #${form.id}`;
            expect(target, where).not.to.equal(null);
            expect(form.contains(target), `${where}, is inside that form`).to.equal(true);
          }
        });
      }
    });
  });
};

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
