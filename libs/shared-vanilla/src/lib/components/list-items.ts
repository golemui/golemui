import { ListItem, ListProps } from '../field.props';

export type ListItemValue = string | number;

/**
 * Checks whether a value is a fully compliant ListItem (with template and value fields)
 */
export const isListItem = (opt: unknown): opt is ListItem<any> =>
  opt !== null &&
  typeof opt === 'object' &&
  Object.prototype.hasOwnProperty.call(opt, 'template') &&
  Object.prototype.hasOwnProperty.call(opt, 'value');

/**
 * Checks whether a value is a valid option value
 */
export function isListItemValue(value: unknown): value is ListItemValue {
  const t = typeof value;
  return t === 'string' || t === 'number';
}

/** Checks if an object can be converted into an actual ListItem */
export const isProtoListItem = (
  opt: unknown,
  { valueField }: ListProps<any>,
): opt is Record<string, unknown> => {
  if (opt === null || typeof opt !== 'object') {
    return false;
  }
  const obj = opt as Record<string, unknown>;

  const hasValue = valueField ? Object.prototype.hasOwnProperty.call(obj, valueField) : false;

  if (valueField && !hasValue) {
    // valueField is provided but hasValue is false → invalid
    return false;
  }
  return true;
};

/** Returns a mapper function that converts objects into { template, value } */
export function createListItemMapper(opt: unknown, { valueField }: ListProps<any>) {
  if (opt === null || typeof opt !== 'object') {
    throw new Error('Provided value is not an object');
  }

  const obj = opt as Record<string, unknown>;

  // Resolve fields: only keep those that exist on the object
  const resolvedValueField =
    valueField && Object.prototype.hasOwnProperty.call(obj, valueField) ? valueField : undefined;

  if (!resolvedValueField) {
    throw new Error('No valueField exists on the object');
  }

  // Return the mapping function
  return (item: unknown): ListItem<any> => {
    if (item === null || typeof item !== 'object') {
      throw new Error('Item is not an object');
    }
    const o = item as Record<string, unknown>;
    return {
      template: item,
      value: resolvedValueField ? (o[resolvedValueField] as string) : '',
    };
  };
}

export const updateListItems = (opts: ListItem<any>[], props: ListProps<any>): ListItem<any>[] => {
  if (Array.isArray(opts) && opts.length > 0) {
    if (isListItem(opts[0])) {
      // nothing to do
    } else if (isListItemValue(opts[0])) {
      return (opts as unknown as ListItemValue[]).map((opt) => ({
        template: opt,
        value: opt,
      }));
    } else if (isProtoListItem(opts[0], props)) {
      const optionMapper = createListItemMapper(opts[0], props as ListProps<any>);
      return opts.map(optionMapper);
    } else {
      throw new Error('Invalid list item shape');
    }
  }

  return opts;
};
