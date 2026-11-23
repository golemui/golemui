import { type StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';
import { type ValidatorFn } from '../form-validator';
import { type I18nTranslator, type TranslationKey } from '../i18n';
import { type Action } from './actions';
import { createInitialState, type State } from './model';
import { reducer } from './reducer';

/**
 * The language change of a form, checked through the reducer: each test sends `INITIALIZE`,
 * sometimes `SET_DATA` and more actions, then `SET_LANGUAGE`, and reads `calculatedWidgets`, `lang`
 * and the form health of the state that results.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/store/reducer.language-change.spec.ts
 */

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

/**
 * A translator whose language can change. A translation is `<language>:<key>`. While `broken` is
 * true, every translation throws an `Error` without a code.
 */
const makeTranslator = () => {
  let lang = 'en-US';
  const translator = {
    broken: false,
    keys: [] as TranslationKey[],
    get lang() {
      return lang;
    },
    setLang(nextLang: string) {
      lang = nextLang;
    },
    translate(key: TranslationKey): string {
      translator.keys.push(key);
      if (translator.broken) {
        throw new Error('no catalog');
      }
      return `${lang}:${key}`;
    },
    subscribe(): () => void {
      return () => undefined;
    },
  } satisfies I18nTranslator & Record<string, unknown>;
  return translator;
};

/** No test of this file validates an input, so the validator accepts every value. */
const validators: ValidatorFn<unknown> = (): StandardSchemaV1 => ({
  '~standard': {
    version: 1,
    vendor: 'reducer-spec',
    validate: (value: unknown) => ({ value }),
  },
});

/**
 * Makes a reducer with a new translator.
 *
 * @returns The reducer, the translator, and `changeLanguage`, which changes the language of the
 *   translator first and then sends `SET_LANGUAGE`, as the bindings do.
 */
const makeForm = () => {
  const translator = makeTranslator();
  const reduce = reducer({
    validators,
    validateOn: 'eager',
    localization: translator,
    functions: {},
  });
  const changeLanguage = (state: State, lang: string): State => {
    translator.setLang(lang);
    return reduce(state, { type: 'SET_LANGUAGE', payload: { lang } });
  };
  return { reduce, translator, changeLanguage };
};

const init = (form: Record<string, unknown>[]): Action => ({
  type: 'INITIALIZE',
  payload: { formName: 'test-form', formDef: { form } },
});

const setData = (data: Record<string, any>): Action => ({
  type: 'SET_DATA',
  payload: { data },
});

/** A heading whose text is the translation of the key `title`. */
const translatedTitle = {
  uid: 'title',
  kind: 'display',
  type: 'heading',
  props: { text: { key: 'title' } },
};

const textOf = (state: State, uid: string): unknown =>
  state.calculatedWidgets[uid].current.props?.['text'];

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('reducer: SET_LANGUAGE', () => {
  it('computes no widget for a language change directly after INITIALIZE', () => {
    const { reduce, translator, changeLanguage } = makeForm();
    const initialized = [init([translatedTitle])].reduce(reduce, createInitialState('en-US'));

    const next = changeLanguage(initialized, 'es-ES');

    expect(next.formHealth).toEqual({ status: 'ok' });
    expect(next.lang).toBe('es-ES');
    expect(next.calculatedWidgets).toEqual({});
    expect(translator.keys).toEqual([]);
  });

  it('keeps a health that the app set and translates the props', () => {
    const { reduce, changeLanguage } = makeForm();
    const appHealth = { status: 'errored' as const, code: 30, message: '[30] no widget' };
    const errored = [
      init([translatedTitle]),
      setData({}),
      { type: 'SET_FORM_HEALTH', payload: { formHealth: appHealth } } satisfies Action,
    ].reduce(reduce, createInitialState('en-US'));
    expect(textOf(errored, 'title')).toBe('en-US:title');

    const next = changeLanguage(errored, 'es-ES');

    expect(next.formHealth).toEqual(appHealth);
    expect(next.lang).toBe('es-ES');
    expect(textOf(next, 'title')).toBe('es-ES:title');
  });

  it('keeps the new language and the previous widgets when the translator throws on a healthy form', () => {
    const { reduce, translator, changeLanguage } = makeForm();
    const healthy = [init([translatedTitle]), setData({})].reduce(
      reduce,
      createInitialState('en-US'),
    );
    expect(healthy.formHealth).toEqual({ status: 'ok' });

    translator.broken = true;
    const next = changeLanguage(healthy, 'es-ES');

    expect(next.formHealth).toEqual({ status: 'errored', code: 12, message: '[12] no catalog' });
    expect(next.lang).toBe('es-ES');
    expect(next.calculatedWidgets).toBe(healthy.calculatedWidgets);
  });

  it('keeps the health with code 40 of a failed derive when the props of the language change compute', () => {
    const { reduce, changeLanguage } = makeForm();
    const users = {
      uid: 'users',
      kind: 'input',
      type: 'repeater',
      path: 'users',
      props: {
        template: {
          uid: 'userRow',
          kind: 'layout',
          type: 'flex',
          children: [
            {
              uid: 'userName',
              kind: 'display',
              type: 'heading',
              props: { text: '{{ $item.profile.name }}' },
            },
          ],
        },
      },
    };
    const healthy = [init([translatedTitle, users]), setData({ users: [] })].reduce(
      reduce,
      createInitialState('en-US'),
    );
    expect(healthy.formHealth).toEqual({ status: 'ok' });
    // The new row has no profile, so its text cannot be computed.
    const failed = reduce(healthy, setData({ users: [{}] }));
    const failedHealth = {
      status: 'errored',
      code: 40,
      message:
        "[40] Failed to evaluate '{{$item.profile.name}}': Cannot read properties of undefined (reading 'name')",
    };
    expect(failed.formHealth).toEqual(failedHealth);

    const next = changeLanguage(failed, 'es-ES');

    expect(next.formHealth).toEqual(failedHealth);
    expect(textOf(next, 'title')).toBe('es-ES:title');
    // The failed derive made no entry for the widget of the new row.
    expect(next.calculatedWidgets).not.toHaveProperty('userName[0]');
  });
});
