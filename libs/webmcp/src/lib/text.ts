import type { I18nTranslator } from '@golemui/core';
import { isTranslationConfig } from '@golemui/core/internals';

/** Chrome's recommended limits: 500 characters per tool description, 150 per parameter. */
export const TOOL_DESCRIPTION_LIMIT = 500;
export const FIELD_DESCRIPTION_LIMIT = 150;

export function truncate(text: string, limit: number): string {
  return text.length <= limit ? text : `${text.slice(0, limit - 1).trimEnd()}…`;
}

/**
 * Resolves a `Localizable` the way the widgets do: a string as it is, a translation config
 * through the form's translator. Anything else (a function, an object) yields `undefined`.
 */
export function resolveText(text: unknown, localization: I18nTranslator): string | undefined {
  if (typeof text === 'string') {
    return text;
  }
  if (isTranslationConfig(text)) {
    return localization.translate(text.key, text.params, text.default);
  }
  return undefined;
}

/** Joins the defined, non-empty parts with a separator. */
export function joinText(parts: (string | undefined)[], separator = '. '): string {
  return parts.filter((part): part is string => part !== undefined && part !== '').join(separator);
}
