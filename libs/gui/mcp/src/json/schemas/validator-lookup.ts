import type { ValidateFunction } from 'ajv';

/**
 * Where the walk in `errors.ts` gets its generated validators from. The `json` entry reads them
 * from static imports (`sync-validators.ts`); the `json-lazy` entry loads the ones a form needs
 * first (`lazy-validators.ts`). The walk is the same for both.
 */
export interface ValidatorLookup {
  /** The form schema with every widget accepted as is: the root keys, `states`, `form`. */
  root(): ValidateFunction;
  /** A chunk reference (`{ "$ref": "./x.form-chunk.json" }`). */
  chunkRef(): ValidateFunction;
  /** One built-in widget, without its children, template or validator. Null for unknown types. */
  shallowWidget(widgetType: string): ValidateFunction | null;
  /** A `validator` object of the given `type`. Null for unknown types. */
  validatorBranch(validatorType: string): ValidateFunction | null;
  /** A custom widget of the given `kind`. Null for unknown kinds. */
  customWidget(kind: string): ValidateFunction | null;
}

/**
 * Reads `key` from a table of validators or loaders. An own-property check keeps keys such as
 * `constructor` from resolving to a built-in of the table.
 */
export function lookupOwn<T>(table: Readonly<Record<string, T>>, key: string): T | null {
  return Object.prototype.hasOwnProperty.call(table, key) ? (table[key] ?? null) : null;
}
