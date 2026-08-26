// @ts-expect-error The following few lines are a hack to make subscrip/justin work
// eslint-disable-next-line import/no-namespace
import type * as justin from './types/subscript__justin';
type _ = justin;

export { FormContext } from './lib/context/form.context';
export type { WidgetLoaders } from './lib/context/widget-registry';
export type { WithWidget } from './lib/context/with-widget.type';

export { errorCodes } from './lib/errors';

export { defineForm } from './lib/form';
export type { Form, FormInitConfig } from './lib/form';

export { isStandardValidateSuccess, standardValidate } from './lib/form-validator';
export type { ValidatorFn } from './lib/form-validator';

export type {
  ActionWidget,
  BaseWidget,
  DisplayWidget,
  FormWidget,
  InputWidget,
  LayoutWidget,
  NonFunctionWidget,
} from './lib/form-widget';

export { getDirectionFromLanguage, identityTranslator } from './lib/i18n';
export type {
  I18nParams,
  I18nTranslator,
  Localizable,
  MutableI18nTranslator,
  TranslationKey,
} from './lib/i18n';

export type { ItemRenderContext, ItemRenderItemData } from './lib/item-renderer';

export { devToolsMiddleware } from './lib/middleware/devtools/devtools.middleware';

export { formEventNames } from './lib/shared';
export type {
  ActionWidgetTemplateData,
  ControlTemplateData,
  DisplayWidgetTemplateData,
  DotPath,
  EventHandlerCallback,
  ExpressionFunction,
  ExpressionFunctions,
  FormEvent,
  FormSubmitEvent,
  FunctionWidgetParams,
  LayoutTemplateData,
  ReactiveExpression,
  Uid,
  UiState,
  ValidateOn,
  Validator,
  WidgetPropertyFunctionParams,
} from './lib/shared';

export type { Action } from './lib/store/actions';

export type { FormHealth, Middleware, State } from './lib/store/model';

export { formHealth } from './lib/store/selectors';

export {
  createWidgetViewModelReader,
  widgetViewModel,
  widgetViewModel$,
} from './lib/store/view-model';
export type { WidgetViewModel } from './lib/store/view-model';

export { filterTap } from './lib/utils/array';
export { assertNoPropCollisions } from './lib/utils/assert-no-prop-collisions';
export { enableDevMode } from './lib/utils/dev-mode';
export { cloneObject } from './lib/utils/object';
export { shortUUID } from './lib/utils/random';
export { makeRepeaterItemConfig } from './lib/utils/repeater';
