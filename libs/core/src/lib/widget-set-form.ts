import type { WidgetLoaders } from './context/widget-registry';
import type { FormInitConfig } from './form';
import type { ValidatorFn } from './form-validator';
import type { I18nTranslator } from './i18n';
import type { ExpressionFunctions, ValidateOn } from './shared';
import type { Action } from './store/actions';
import type { Middleware, State } from './store/model';

/**
 * The services that the components of a widget set read at render time. Core does not read
 * them. A widget set declares its own keys on top of this open shape.
 */
export type WidgetSetDependencies = Record<string, unknown>;

/**
 * The configuration of one form that the form component of a widget set accepts. A widget set
 * declares its own config type with these fields, and narrows the dependency and custom
 * validator shapes.
 *
 * @typeParam TDependencies - The dependency keys that the components of the widget set read.
 */
export interface WidgetSetFormInitConfig<
  TDependencies extends WidgetSetDependencies = WidgetSetDependencies,
> {
  /** The form definition: a JSON document, as an object or as a string. */
  formDef: string | Record<string, any>;
  customWidgetLoaders?: Record<string, () => Promise<unknown>>;
  customValidators?: Record<string, unknown>;
  data?: Record<string, any>;
  meta?: Record<string, any>;
  middlewares?: Middleware<State, Action>[];
  validateOn?: ValidateOn;
  itemRenderers?: Record<string, unknown>;
  localization?: I18nTranslator;
  dependencies?: TDependencies;
  /**
   * Pure functions that expressions call under the `$fn` namespace, for example
   * `"text": "Total: {{ $fn.grandTotal($form.lineItems) }}"`.
   */
  functions?: ExpressionFunctions;
  /**
   * How the form treats an expression that the expression check rejects. Defaults to `'warn'`.
   * See `FormInitConfig.expressionPolicy`.
   */
  expressionPolicy?: FormInitConfig['expressionPolicy'];
  formName?: string;
}

/**
 * What the form component factory of a binding needs to know about a widget set: its widget
 * loaders, its validator factory and its default dependencies.
 *
 * @typeParam TComponent - The component type that the widget loaders resolve to, for example
 * `ComponentType<WithWidget>` in React.
 * @typeParam TConfig - The form config type of the widget set.
 *
 * @example
 * const GuiForm = createFormComponent<GuiFormInitConfig>({
 *   widgetLoaders: guiWidgetLoaders,
 *   validators: initValidators,
 * });
 */
export interface WidgetSetDefinition<
  TComponent = unknown,
  TConfig extends WidgetSetFormInitConfig<any> = WidgetSetFormInitConfig,
> {
  /**
   * Lazy widget loaders by widget type name. They must include the reserved `grid` and
   * `repeater` entries.
   */
  widgetLoaders: WidgetLoaders<TComponent>;
  /**
   * Builds the validator function of the widget set, with the custom validator schemas of the
   * form merged into the standard set.
   */
  validators: (customValidators?: NonNullable<TConfig['customValidators']>) => ValidatorFn<any>;
  /** Dependencies that every form of this widget set receives. A form overrides them by key. */
  dependencies?: NonNullable<TConfig['dependencies']>;
}

/** The result of {@link buildWidgetSetForm}. The binding casts `initConfig` to its component type. */
export interface WidgetSetFormBundle {
  /** The core form config, with the merge rules applied. */
  initConfig: FormInitConfig<unknown>;
  /** The validator function of this form, built by the validator factory of the widget set. */
  validators: ValidatorFn<any>;
}

/**
 * Builds the core form config and the validator function of one widget set form. The four
 * bindings call it, so the merge rules cannot differ between frameworks.
 *
 * The form wins in every merge:
 * - Widget loaders: the loaders of the widget set, then `customWidgetLoaders` of the form.
 * - Dependencies: the defaults of the widget set, then the dependencies of the form.
 * - `validateOn`: the setting of the form, then `'eager'`.
 *
 * @param widgetSet - The widget set definition that the factory was created with.
 * @param config - The configuration that the form component received.
 * @returns The core form config and the validator function.
 */
export function buildWidgetSetForm<TConfig extends WidgetSetFormInitConfig<any>>(
  widgetSet: WidgetSetDefinition<any, TConfig>,
  config: TConfig,
): WidgetSetFormBundle {
  const initConfig: FormInitConfig<unknown> = {
    formDef: config.formDef,
    widgetLoaders: {
      ...widgetSet.widgetLoaders,
      ...((config.customWidgetLoaders ?? {}) as WidgetLoaders<unknown>),
    },
    dependencies: {
      ...(widgetSet.dependencies ?? {}),
      ...(config.dependencies ?? {}),
    },
    functions: { ...(config.functions ?? {}) },
    validateOn: config.validateOn ?? 'eager',
    expressionPolicy: config.expressionPolicy,
    itemRenderers: { ...(config.itemRenderers ?? {}) } as NonNullable<
      FormInitConfig<unknown>['itemRenderers']
    >,
    localization: config.localization,
    middlewares: config.middlewares ?? [],
    data: config.data,
    meta: config.meta,
    formName: config.formName,
  };

  // The validator factory always receives a new object. The cast is needed because the factory
  // is typed with the custom validator shape of the widget set.
  const customValidators = { ...(config.customValidators ?? {}) };
  const validators = widgetSet.validators(
    customValidators as NonNullable<TConfig['customValidators']>,
  );

  return { initConfig, validators };
}
