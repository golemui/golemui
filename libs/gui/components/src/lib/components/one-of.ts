import { OneOfProps, Option } from '../widget.props';

/**
 * Checks whether a value is a valid option value
 */
export function isOptionValue(value: unknown): value is OptionValue {
  const t = typeof value;
  return t === 'string' || t === 'number';
}

export function inferOptionValue(value: string, options: Option[]): OptionValue {
  return options.find((op) => op.value.toString() === value)?.value as OptionValue;
}

export type OptionValue = string | number;

/**
 * Returns an array of normalized Options
 */
export const updateOptions = (opts: Option[], props: OneOfProps): Option[] => {
  if (Array.isArray(opts) && opts.length > 0) {
    if (isOption(opts[0])) {
      // nothing to do
    } else if (isOptionValue(opts[0])) {
      return (opts as unknown as OptionValue[]).map((opt) => ({
        label: opt.toString(),
        value: opt,
      }));
    } else if (isProtoOption(opts[0], props)) {
      const optionMapper = createOptionMapper(opts[0], props);
      return opts.map(optionMapper);
    } else {
      throw new Error('Invalid option shape');
    }
  }

  return opts;
};

/**
 * Checks whether a value is a fully compliant Option (with label and value fields)
 */
export const isOption = (opt: unknown): opt is Option =>
  opt !== null &&
  typeof opt === 'object' &&
  Object.prototype.hasOwnProperty.call(opt, 'label') &&
  Object.prototype.hasOwnProperty.call(opt, 'value');

/** Checks if an object can be converted into an actual Option */
export const isProtoOption = (
  opt: unknown,
  { labelField, valueField }: OneOfProps,
): opt is Record<string, unknown> => {
  if (opt === null || typeof opt !== 'object') {
    return false;
  }
  const obj = opt as Record<string, unknown>;

  const hasLabel = labelField ? Object.prototype.hasOwnProperty.call(obj, labelField) : false;
  const hasValue = valueField ? Object.prototype.hasOwnProperty.call(obj, valueField) : false;

  if (labelField && !hasLabel) {
    // labelField is provided but hasLabel is false → invalid
    return false;
  } else if (valueField && !hasValue) {
    // valueField is provided but hasValue is false → invalid
    return false;
  }
  return true;
};

/** Returns a mapper function that converts objects into { label, value } */
export function createOptionMapper(opt: unknown, { labelField, valueField }: OneOfProps) {
  if (opt === null || typeof opt !== 'object') {
    throw new Error('Provided value is not an object');
  }

  const obj = opt as Record<string, unknown>;

  // Resolve fields: only keep those that exist on the object
  const resolvedLabelField =
    labelField && Object.prototype.hasOwnProperty.call(obj, labelField) ? labelField : undefined;
  const resolvedValueField =
    valueField && Object.prototype.hasOwnProperty.call(obj, valueField) ? valueField : undefined;

  if (!resolvedLabelField && !resolvedValueField) {
    throw new Error('Neither labelField nor valueField exists on the object');
  }

  // Return the mapping function
  return (item: unknown): Option => {
    if (item === null || typeof item !== 'object') {
      throw new Error('Item is not an object');
    }
    const o = item as Record<string, unknown>;
    return {
      label: resolvedLabelField ? (o[resolvedLabelField] as string) : '',
      value: resolvedValueField ? (o[resolvedValueField] as string) : '',
    };
  };
}
