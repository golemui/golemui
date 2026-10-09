import type { GuiPillItem } from '../components/pills';
import type { ListItem, OptionValue } from '../types';

/** How to read the items given as objects: which keys hold the text and the value. */
export type ItemFields = {
  /** The key of the text to show. `label` by default. */
  labelField?: string;
  /** The key of the value. */
  valueField?: string;
  /**
   * The keys the search looks in. By default `labelField` and `valueField`, or every key when
   * neither is set.
   */
  searchFields?: string[];
};

/**
 * The items whose text contains `query`, ignoring case. A value is searched as it is, an object in
 * its `searchFields`. Keys that hold nothing never match.
 */
export function searchItems<T>(items: readonly T[], query: string, fields: ItemFields = {}): T[] {
  const needle = query.toLowerCase();
  const matches = (value: unknown) => value != null && String(value).toLowerCase().includes(needle);
  const searchFields =
    fields.searchFields ??
    [fields.labelField, fields.valueField].filter((field): field is string => !!field);

  return items.filter((item) => {
    if (item === null || typeof item !== 'object') return matches(item);

    const keys = Object.keys(item);
    return (searchFields.length ? keys.filter((key) => searchFields.includes(key)) : keys).some(
      (key) => matches((item as Record<string, unknown>)[key]),
    );
  });
}

/** The text of an item: a value as it is, an object's `labelField` (`label` by default). */
export function itemLabel(template: unknown, labelField?: string): string {
  return template !== null && typeof template === 'object'
    ? String((template as Record<string, unknown>)[labelField ?? 'label'])
    : String(template);
}

/**
 * The pills of the selected values, in order. Each value's text comes from the first of `items`
 * that holds it, then of `fallbackItems`, or is the value itself when none does.
 */
export function selectedPills(
  values: readonly OptionValue[],
  items: readonly ListItem<unknown>[],
  labelField?: string,
  fallbackItems: readonly ListItem<unknown>[] = [],
): GuiPillItem[] {
  return values.map((value) => {
    const item =
      items.find((candidate) => candidate.value === value) ??
      fallbackItems.find((candidate) => candidate.value === value);
    return {
      key: String(value),
      label: item ? itemLabel(item.template, labelField) : String(value),
    };
  });
}
