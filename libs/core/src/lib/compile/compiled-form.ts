import { type FormWidget } from '../form-widget';
import { type TranslationConfig } from '../i18n';
import { type DotPath } from '../shared';

/**
 * A form definition in which everything that does not depend on the form data is already
 * computed: the parsed expressions, the values that each widget field can take, and the place of
 * the row indexes in each path. It is built one time for a definition.
 */
export type CompiledForm = {
  /** The root layout of the form. `undefined` when the form has no usable definition. */
  root: CompiledWidget | undefined;
  /** The declared states, in the order of the declaration. */
  states: CompiledState[];
};

/** One declared state of a form definition. */
export type CompiledState = {
  name: string;
  /** The expression of the state, joined with the expressions of its parent states. */
  condition: CompiledExpression;
};

/**
 * One widget of a form definition. A widget of a repeater row template is compiled one time, for
 * all the rows.
 */
export type CompiledWidget = {
  /** The decoded widget of the form definition, the same object. */
  source: FormWidget<string>;
  /** The children of a layout, in the order of the definition. Empty for the other kinds. */
  children: CompiledWidget[];
  /**
   * The rows of a repeater, and `undefined` for every other widget. A repeater whose path is
   * outside the row of the repeater around it has no rows either, because the repeater itself
   * cannot be built.
   */
  repeater: CompiledRepeater | undefined;
  /** The path of an input, and `undefined` for the other kinds. */
  path: CompiledPath | undefined;
  conditions: CompiledConditions;
  /** True when this widget, or a widget below it or in its rows, has a condition. */
  hasConditionsBelow: boolean;
  /** The fields that the widget kind has, in the order in which the computed widget gets them. */
  coreFields: CompiledField[];
  /** The props of the definition, in the order of the definition. */
  propFields: CompiledPropField[];
  /** The events of an action or an input. */
  onFields: CompiledField[];
};

/** The rows of a repeater. */
export type CompiledRepeater = {
  /** The layout of one row. */
  rowLayout: CompiledWidget;
  /** The path of one row as the paths of the row template write it, for example `users.items`. */
  declaredItemPath: DotPath;
};

/**
 * The path of an input, with the place of each row index.
 *
 * `parts` are the texts between the row indexes. An input in the row `[2, 1]` with the parts
 * `['teams.', '.devs.', '.name']` has the path `teams.2.devs.1.name`. An input outside a
 * repeater has one part.
 *
 * `error` replaces `parts` for a path that is not inside the row of its repeater. No widget can
 * be built for such a path, and the error says so when a row exists.
 */
export type CompiledPath =
  | { declared: DotPath; parts: string[] }
  | { declared: DotPath; error: Error };

/** The conditions that hide, disable or lock a widget. */
export type CompiledConditions = {
  include?: { in: string[] } | { when: CompiledExpression };
  exclude?: { from: string[] } | { when: CompiledExpression };
  /** Only for the `{ when }` form, on an input or an action. */
  disabled?: CompiledExpression;
  /** Only for the `{ when }` form, on an input. */
  readonly?: CompiledExpression;
};

/**
 * One field of a widget, for example `label` or the prop `placeholder`, with every value that
 * the definition gives it.
 */
export type CompiledField = {
  /** The name without a state suffix. */
  key: string;
  /**
   * The values of the keys with a state suffix, then the value of the key without a suffix.
   * The computed widget gets the first value whose state is active. A suffix with a state that
   * is not declared gives no entry.
   */
  candidates: CompiledCandidate[];
};

/** One prop of a widget. */
export type CompiledPropField = CompiledField & {
  /**
   * True when the arrays and the objects of this prop are searched for translation configs.
   * False for the row template of a repeater, whose widgets are compiled as widgets.
   */
  translatesNestedConfigs: boolean;
  /** The error of a prop name that cannot be written, such as `__proto__`. */
  nameError?: Error;
};

/** One value of a field. `state` is `undefined` for the key without a state suffix. */
export type CompiledCandidate = {
  state: string | undefined;
  value: CompiledValue;
};

/**
 * How the value of a field is computed.
 *
 * - `constant`: the value of the definition, the same reference.
 * - `interpolation`: a text with `{{ }}`. The result is the texts and the results of the
 *   expressions, joined into one text.
 * - `translation`: a translation config. The result is what the translator returns.
 * - `nested`: an array or an object of a prop that holds translation configs.
 * - `flag`: a `{ when }` value of `disabled` or `readonly`. The result is the flag that the
 *   condition of the key without a suffix gave.
 * - `path`: the path of the input, with the indexes of its row.
 * - `failure`: the value could not be read. The error is thrown when the value is used.
 */
export type CompiledValue =
  | { kind: 'constant'; value: unknown }
  | { kind: 'interpolation'; parts: (string | CompiledExpression)[] }
  | CompiledTranslation
  | CompiledNestedTranslations
  | { kind: 'flag'; flag: 'disabled' | 'readonly' }
  | { kind: 'path' }
  | CompiledFailure;

/** A value of the definition that could not be read, with the error of the read. */
export type CompiledFailure = { kind: 'failure'; error: unknown };

/** A translation config of the definition. */
export type CompiledTranslation = {
  kind: 'translation';
  /** The config of the definition. The translator gets its `key` and its `default`. */
  config: TranslationConfig;
  /** `undefined` when the config has no params. The translator then gets `config.params`. */
  params: CompiledParam[] | undefined;
};

/** One param of a translation config: a value, or an expression that gives the value. */
export type CompiledParam =
  | { name: string; value: unknown }
  | { name: string; expression: CompiledExpression };

/**
 * An array or an object of a prop with translation configs inside it. The result is a copy of
 * `source` in which each entry of `entries` is replaced by its result, in the order of the
 * entries. The other entries keep their reference.
 *
 * An entry that could not be read is a `failure`, and it is the last entry. Its error is thrown
 * after the entries before it are computed.
 */
export type CompiledNestedTranslations = {
  kind: 'nested';
  source: unknown[] | Record<string, unknown>;
  entries: {
    key: string | number;
    value: CompiledTranslation | CompiledNestedTranslations | CompiledFailure;
  }[];
};

/** The values that an expression reads, by name: `$form`, `$meta`, `$item` and so on. */
export type ExpressionScope = Record<string, unknown>;

/**
 * One expression of a form definition, parsed and checked one time.
 *
 * A row condition that names its row outside code is the one case that is compiled when a row
 * evaluates it: it has no `failure` and no `warning`. See `compileRowCondition`.
 */
export type CompiledExpression = {
  /** The text that a message about this expression quotes. */
  source: string;
  /** Returns the result for the scope. It throws `failure` when the expression has one. */
  evaluate: (scope: ExpressionScope) => unknown;
  /**
   * Why the expression cannot run: it does not parse, the expression check rejects it (an
   * `ExpressionRejectedError`), or the compiler of the parsed text rejects it.
   */
  failure?: Error;
  /** The developer warning for an issue that the expression policy of the form allows. */
  warning?: string;
};

/**
 * @returns The compiled form of a store that has no definition, or whose definition has an
 *   error. It has no widget and no state.
 */
export function emptyCompiledForm(): CompiledForm {
  return { root: undefined, states: [] };
}

/**
 * Writes the indexes of a row between the parts of a path.
 *
 * @param parts - The texts between the row indexes, see {@link CompiledPath}.
 * @param rowIndexes - The index of the row in each repeater around the widget, the outermost
 *   first. The indexes after the last part are not used.
 * @returns The path with the indexes.
 *
 * @example
 * ```ts
 * pathInRow(['teams.', '.devs.', '.name'], [2, 1]); // 'teams.2.devs.1.name'
 * ```
 */
export function pathInRow(parts: string[], rowIndexes: number[]): DotPath {
  let path = parts[0];
  for (let level = 1; level < parts.length; level++) {
    path += `${rowIndexes[level - 1]}${parts[level]}`;
  }
  return path;
}
