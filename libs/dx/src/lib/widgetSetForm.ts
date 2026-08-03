import type {
  Action,
  ExpressionFunctions,
  FormInitConfig,
  I18nTranslator,
  Middleware,
  State,
  ValidateOn,
  ValidatorFn,
  WidgetLoaders,
} from '@golemui/core';
import type { DxFormConfig, GslSelectorsInput } from './core/dx.domain';
import type { FormInput, ResolvedFormInput, ResolveFormInputFn } from './resolveFormInput';
import type { Dependencies } from './shared';

// ===================================================
// buildWidgetSetForm - the shared merge step behind every framework's
// `createFormComponent` factory.
//
// Each framework package (react, vue, lit, angular) exposes a factory that
// turns a widget set definition into a ready-to-use form component. The
// framework factories keep only framework concerns (refs, emits, signals,
// custom-element wiring). Everything the four wrappers used to copy from each
// other - resolving the form input and the merge precedence rules - lives
// here, in one place, so the implementations cannot drift apart per framework.
//
// Merge precedence (last wins):
// - widget loaders: widget set built-ins, then DX-provided loaders, then the
//   form's `customWidgetLoaders`.
// - dependencies: widget set defaults, then DX-provided, then the form's.
// - functions and item renderers: DX-provided, then the form's.
// - validateOn: the form's setting, then DX-provided, then 'eager'.
// ===================================================

/**
 * The per-form configuration a widget set's form component accepts. This is
 * the framework-independent base shape: a widget set implementation declares
 * its own config type on top of it, narrowing the dependency and custom
 * validator shapes (the gui set's `GuiFormInitConfig` is one example).
 */
export interface WidgetSetFormInitConfig<TDependencies extends Dependencies = Dependencies> {
  formDef: FormInput;
  formSelectors?: GslSelectorsInput;
  formConfig?: DxFormConfig<string, TDependencies>;
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
   * Pure functions callable from reactive expressions under the `$fn` namespace,
   * e.g. `"text": "Total: {{ $fn.grandTotal($form.lineItems) }}"`.
   * Merged over any functions declared by the DX bundle's `formConfig`;
   * this config wins on name collisions.
   */
  functions?: ExpressionFunctions;
  formName?: string;
}

/**
 * Everything a framework form component factory needs to know about a widget
 * set: its widget loaders, its validator factory, and (for widget sets with a
 * TS builder API) the implementation-bound form input resolver.
 *
 * @typeParam TComponent - The framework component type the widget loaders
 * resolve to (for example `ComponentType<WithWidget>` in React).
 * @typeParam TConfig - The widget set's form config type. Defaults to the
 * open {@link WidgetSetFormInitConfig}.
 *
 * @example
 * const GuiForm = createFormComponent<GuiFormInitConfig>({
 *   widgetLoaders: guiWidgetLoaders,
 *   validators: initValidators,
 *   resolveFormInput,
 * });
 */
export interface WidgetSetDefinition<
  TComponent = unknown,
  TConfig extends WidgetSetFormInitConfig<any> = WidgetSetFormInitConfig,
> {
  /**
   * Lazy widget loaders keyed by widget type name. Must include the reserved
   * `flex` and `repeater` entries every implementation provides.
   */
  widgetLoaders: WidgetLoaders<TComponent>;
  /**
   * Builds the widget set's validator function, merging the form's custom
   * validator schemas into the standard set.
   */
  validators: (customValidators?: NonNullable<TConfig['customValidators']>) => ValidatorFn<any>;
  /**
   * The implementation-bound resolver returned by `createImplementation`.
   * It turns a TS builder bundle (or passes through a JSON definition) into
   * the resolved form input. Omit for a JSON-only widget set.
   */
  resolveFormInput?: ResolveFormInputFn<NonNullable<TConfig['dependencies']>>;
  /**
   * Dependencies every form of this widget set receives. Lowest merge
   * precedence: DX-provided and per-form dependencies override these.
   */
  dependencies?: NonNullable<TConfig['dependencies']>;
}

/**
 * The framework-independent output of {@link buildWidgetSetForm}. The
 * framework factory casts `initConfig` to its component type and wires
 * `resolved.formEvent` into its event handling.
 */
export interface WidgetSetFormBundle {
  /** The core form init config, with all merge precedence rules applied. */
  initConfig: FormInitConfig<unknown>;
  /** The validator function for this form, built from the widget set's validator factory. */
  validators: ValidatorFn<any>;
  /** The resolved form input. `resolved.formEvent` carries DX-registered event handlers. */
  resolved: ResolvedFormInput<any, Dependencies>;
}

/**
 * Builds the core form init config, the validator function, and the resolved
 * form input for one widget-set form. This is the single implementation of
 * the merge precedence rules shared by every framework's form component
 * factory.
 *
 * @param widgetSet - The widget set definition the factory was created with.
 * @param config - The per-form configuration passed to the form component.
 */
export function buildWidgetSetForm<TConfig extends WidgetSetFormInitConfig<any>>(
  widgetSet: WidgetSetDefinition<any, TConfig>,
  config: TConfig,
): WidgetSetFormBundle {
  const resolved: ResolvedFormInput<any, Dependencies> = widgetSet.resolveFormInput
    ? widgetSet.resolveFormInput(config.formDef, config.formSelectors, config.formConfig)
    : { formDef: config.formDef as string | Record<string, any> };

  const initConfig: FormInitConfig<unknown> = {
    formDef: resolved.formDef as string | Record<string, any>,
    widgetLoaders: {
      ...widgetSet.widgetLoaders,
      ...((resolved.widgetLoaders ?? {}) as WidgetLoaders<unknown>),
      ...((config.customWidgetLoaders ?? {}) as WidgetLoaders<unknown>),
    },
    dependencies: {
      ...(widgetSet.dependencies ?? {}),
      ...(resolved.dependencies ?? {}),
      ...(config.dependencies ?? {}),
    },
    functions: { ...(resolved.functions ?? {}), ...(config.functions ?? {}) },
    validateOn: config.validateOn ?? resolved.validateOn ?? 'eager',
    itemRenderers: {
      ...(resolved.itemRenderers ?? {}),
      ...(config.itemRenderers ?? {}),
    } as NonNullable<FormInitConfig<unknown>['itemRenderers']>,
    localization: config.localization,
    middlewares: config.middlewares ?? [],
    data: config.data,
    meta: config.meta,
    formName: config.formName,
  };

  // Always hand the validator factory a fresh object, exactly like the
  // wrappers this replaces did. The cast is needed because the factory is
  // typed with the widget set's own custom validator shape.
  const customValidators = { ...(config.customValidators ?? {}) };
  const validators = widgetSet.validators(
    customValidators as NonNullable<TConfig['customValidators']>,
  );

  return { initConfig, validators, resolved };
}
