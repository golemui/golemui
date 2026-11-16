import type { JsonFormWidget } from './jsonFormTypes';

/**
 * Keeps the letters, the digits and `_` of a text, and writes one `_` for each group of other
 * characters.
 *
 * @param text - Any text, for example a path or a label.
 * @returns The text as one part of a name, for example `user_address_city`. It can be empty.
 *
 * @example
 * toNamePart('user.address.city'); // 'user_address_city'
 */
export function toNamePart(text: string): string {
  return text
    .replace(/[^\p{L}\p{N}_]+/gu, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * The name of a widget inside an event name: its uid, else its path, else its label in lower
 * case, else its type.
 *
 * @param widget - A widget of the JSON form.
 * @returns The name, for example `save` or `user_email`.
 */
export function widgetNameForEvents(widget: JsonFormWidget): string {
  for (const candidate of [widget.uid, widget.path]) {
    if (typeof candidate === 'string') {
      const namePart = toNamePart(candidate);
      if (namePart !== '') {
        return namePart;
      }
    }
  }
  const label = widget['label'];
  // A label with a template has no fixed text.
  if (typeof label === 'string' && !label.includes('{{')) {
    const namePart = toNamePart(label).toLowerCase();
    if (namePart !== '') {
      return namePart;
    }
  }
  return toNamePart(String(widget.type)) || 'widget';
}

/**
 * Returns `baseName`, or `baseName` with the first number from 2 that makes it different from
 * every name of `takenNames`.
 *
 * @param baseName - The name to start from.
 * @param takenNames - The names that are already in use.
 * @returns A name that is not in `takenNames`.
 *
 * @example
 * uniqueName('save_click', new Set(['save_click'])); // 'save_click_2'
 */
export function uniqueName(baseName: string, takenNames: ReadonlySet<string>): string {
  if (!takenNames.has(baseName)) {
    return baseName;
  }
  let counter = 2;
  while (takenNames.has(`${baseName}_${counter}`)) {
    counter += 1;
  }
  return `${baseName}_${counter}`;
}
