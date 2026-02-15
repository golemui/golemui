import { DotPath } from './shared';

export type I18nParams = Record<string, string | number | DotPath>;

export type TranslationKey = string;

/**
 * Contract for a core internationalization adapter.
 *
 * @example
 * ```ts
 * export const i18nTranslator: Core.I18nTranslator = {
 *   get lang() {
 *     return i18next.language;
 *   },
 *   translate(key: Core.TranslationKey, params?: Core.I18nParams, defaultValue?: string): string {
 *     return i18next.t(key, { ...params, defaultValue });
 *   },
 *   subscribe(listener: (lang: string) => void) {
 *     const onLanguageChanged = (lng: string) => listener(lng);
 *     i18next.on('languageChanged', onLanguageChanged);
 *     return () => {
 *       i18next.off('languageChanged', onLanguageChanged);
 *     };
 *   },
 * };
 * ```
 */
export interface I18nTranslator {
  /**
   * The BCP 47 language tag of the current locale (e.g., 'en-US', 'es', 'fr-CA').
   * Accessing this property should return the currently active language.
   */
  get lang(): string;

  /**
   * Resolves a localized string based on the provided key and parameters.
   *
   * @param key - The unique translation key (e.g., "errors.required").
   * @param params - Optional values for interpolation (e.g., `{ name: "Alice" }`).
   * @param defaultValue - A fallback string returned if the key cannot be resolved.
   * @returns The translated string or the default value.
   */
  translate(key: TranslationKey, params?: I18nParams, defaultValue?: string): string;

  /**
   * Subscribes to language change events.
   *
   * @param listener - A callback function invoked with the new language code when the locale changes.
   * @returns A teardown function that removes the listener and cleans up resources.
   */
  subscribe(listener: (lang: string) => void): () => void;
}

export type TranslationConfig = {
  /** Translation key used for lookup */
  key: TranslationKey;
  /** Parameters used for interpolation */
  params?: I18nParams;
  /** Fallback text used when the key cannot be resolved */
  default?: string;
};

/**
 * Represents a widget property that can be localized.
 *
 * - If a plain string is provided, it is returned as-is.
 * - If a structured descriptor is provided, it is resolved via the translation system.
 */
export type Localizable =
  | string
  | {
      /** Translation key used for lookup */
      key: TranslationKey;
      /** Parameters used for interpolation */
      params?: I18nParams;
      /** Fallback text used when the key cannot be resolved */
      default?: string;
    };

export const isTranslationConfig = (value: unknown): value is TranslationConfig => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const v = value as Record<string, unknown>;
  if (typeof v['key'] !== 'string') {
    return false;
  }
  return true;
};

/**
 * Determines the text direction (left-to-right or right-to-left) based on the given language code.
 *
 * @param {string} lang - The BCP 47 language tag of the current locale (e.g., 'en-US', 'es', 'fr-CA').
 * @return {'ltr' | 'rtl'} Returns 'ltr' for left-to-right or 'rtl' for right-to-left text direction.
 */
export function getDirectionFromLanguage(lang: string): 'ltr' | 'rtl' {
  const script = new Intl.Locale(lang).maximize().script;
  const rtlScripts = ['Arab', 'Hebr', 'Thaa', 'Syrc', 'Tfng', 'Adlm', 'Rohg'];
  return rtlScripts.includes(script || '') ? 'rtl' : 'ltr';
}

/**
 * Default no-op translator.
 *
 * This implementation performs no localization and simply returns the
 * translation key unchanged. It is intended for use as a safe default
 * when no i18n system is configured.
 * @param lang The BCP 47 language tag of the current localeby default `(navigator.language || 'en-US')`.
 */
export const identityTranslator = (lang = navigator.language || 'en-US'): I18nTranslator => ({
  /**
   * Returns a generic fallback language code.
   */
  get lang() {
    return lang;
  },
  /**
   * Returns the provided translation key without modification.
   *
   * @param key - Translation key
   * @returns The key itself
   */
  translate(key: TranslationKey): string {
    return key;
  },

  /**
   * No-op teardown function since state never changes.
   */
  subscribe() {
    return () => undefined;
  },
});
