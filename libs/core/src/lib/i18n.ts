import { DotPath } from './shared';

export type I18nParams = Record<string, string | number | DotPath>;

export type TranslationKey = string;

/**
 * Called by the core when rendering localizable text.
 *
 * @param key - Translation key (for example, "errors.required" or "form.register.title")
 * @param params - Values used for parameter interpolation
 * @param defaultValue - Fallback text used when the key cannot be resolved
 */
export interface I18nTranslator {
  translate(key: TranslationKey, params?: I18nParams, defaultValue?: string): string;
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
 * Represents a field property that can be localized.
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
 * Default no-op translator.
 *
 * This implementation performs no localization and simply returns the
 * translation key unchanged. It is intended for use as a safe default
 * when no i18n system is configured.
 */
export const identityTranslator: I18nTranslator = {
  /**
   * Returns the provided translation key without modification.
   *
   * @param key - Translation key
   * @returns The key itself
   */
  translate(key: TranslationKey): string {
    return key;
  },
};
