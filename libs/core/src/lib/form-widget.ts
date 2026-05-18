import { Decoder, type FromDecoder, array, boolean, err, lazy, literal, number, object, ok, oneOf, optional, string, succeed } from 'ts.data.json'
import { type Localizable, type TranslationConfig } from './i18n';
import {
  type DotPath,
  type FunctionWidgetParams,
  type ReactiveExpression,
  type Uid,
  type UiState,
  type WidgetPropertyFunction,
} from './shared';
import { objectWithSuffix } from './utils/decoder';
import { shortUUID } from './utils/random';
import { type AllSuffixable, type SomeSuffixable } from './utils/suffixable';

// --------------------------------
//
// Types
//
// --------------------------------

/**
 * The widget type identifier used to resolve the corresponding UI component from the registry.
 * Examples: 'textinput', 'textarea', 'password', 'flex', 'grid', 'heading', 'markdown', 'alert'
 */
export type WidgetType = string;

type ReactiveWidgetPropertyValue<T, FormType extends Record<string, any> = any> =
  | ReactiveExpression
  | WidgetPropertyFunction<T, FormType>
  | T;

/**
 * An event expression is basically a way to send an event `loadData` for the forms engine runtime to process.
 */
type EventExpression = string;

export type On<
  StateKeys extends UiState = never,
  FormType extends Record<string, any> = any,
> = AllSuffixable<
  {
    load?: ReactiveWidgetPropertyValue<EventExpression, FormType>;
    click?: ReactiveWidgetPropertyValue<EventExpression, FormType>;
    change?: ReactiveWidgetPropertyValue<EventExpression, FormType>;
    filter?: ReactiveWidgetPropertyValue<EventExpression, FormType>;
    blur?: ReactiveWidgetPropertyValue<EventExpression, FormType>;
  },
  StateKeys
>;

export type BaseWidget<
  StateKeys extends UiState = never,
  FormType extends Record<string, any> = any,
  Props extends Record<string, any> = any,
> = {
  // kind: 'display' | 'action' | 'input' | 'layout';
  uid: Uid;
  type: WidgetType;
  size?: number;
  include?: { in: StateKeys[] } | { when: ReactiveExpression };
  exclude?: { from: StateKeys[] } | { when: ReactiveExpression };

  /**
   * Non-core properties e.g. text, level...
   * props can be suffixed with state keys. e.g. { props: {text: 'Login', 'text.register': 'Register'} }
   */
  props?: AllSuffixable<MakeProps<Props, FormType>, StateKeys>;
};

type MakeProps<
  Props extends Record<string, any> = any,
  FormType extends Record<string, any> = any,
> = {
  [K in keyof Props]: Props[K] extends string | (string | undefined)
    ? // We reconstruct the union to preserve literals.
      // 1. Props[K]: Keeps e.g. 'horizontal' | 'vertical'
      // 2. Exclude<Localizable, string>: Adds the object part of Localizable { key: ... }
      // 3. (string & {}): Adds generic string support WITHOUT swallowing the literals
      | Props[K]
        | WidgetPropertyFunction<Props[K], FormType>
        | Exclude<Localizable, string>
        | (string & {})
    : Props[K] | WidgetPropertyFunction<Props[K], FormType>;
};

export type DisplayWidget<
  StateKeys extends UiState = never,
  FormType extends Record<string, any> = any,
  Props extends Record<string, any> = any,
> = SomeSuffixable<BaseWidget<StateKeys, FormType, Props> & { kind: 'display' }, never, StateKeys>;

export type ActionWidget<
  StateKeys extends UiState = never,
  FormType extends Record<string, any> = any,
  Props extends Record<string, any> = any,
> = SomeSuffixable<
  BaseWidget<StateKeys, FormType, Props> & {
    kind: 'action';
    label?: ReactiveWidgetPropertyValue<Localizable, FormType>;
    disabled?: boolean | { when: ReactiveExpression };
    on?: On<StateKeys, FormType>;
  },
  'disabled' | 'label' | 'size',
  StateKeys
>;

export type InputWidget<
  T,
  StateKeys extends UiState = never,
  FormType extends Record<string, any> = any,
  Props extends Record<string, any> = any,
  V = any,
> = SomeSuffixable<
  BaseWidget<StateKeys, FormType, Props> & {
    kind: 'input';
    path: DotPath;
    label?: ReactiveWidgetPropertyValue<Localizable, FormType>;
    disabled?: boolean | { when: ReactiveExpression };
    readonly?: boolean | { when: ReactiveExpression };
    on?: On<StateKeys, FormType>;
    defaultValue?: T;
    // TODO: this shouldn't be a ReactiveWidgetPropertyValue because it cannot be a string
    validator?: ReactiveWidgetPropertyValue<V, FormType>;
  },
  'disabled' | 'readonly' | 'label' | 'validator' | 'size',
  StateKeys
>;

type LayoutChildren<
  StateKeys extends UiState = never,
  FormType extends Record<string, any> = any,
> = (
  | DisplayWidget<StateKeys, FormType>
  | InputWidget<any, StateKeys, FormType>
  | LayoutWidget<StateKeys, FormType>
  | ActionWidget<StateKeys, FormType>
  | FunctionWidget<StateKeys, FormType>
)[];

export type LayoutWidget<
  StateKeys extends UiState = never,
  FormType extends Record<string, any> = any,
  Props extends Record<string, any> = any,
  Children extends FormWidget<StateKeys, FormType>[] = LayoutChildren<StateKeys, FormType>,
> = SomeSuffixable<
  BaseWidget<StateKeys, FormType, Props> & {
    kind: 'layout';
    on?: On<StateKeys, FormType>;
    // ⚠️ This should be FormWidget, but types cannot reference themselves. Keep in sync!
    children: Children;
  },
  'size',
  StateKeys
>;

// ⚠️ When updating, update LayoutWidget['children'] too!
export type NonFunctionWidget<
  StateKeys extends UiState = never,
  FormType extends Record<string, any> = any,
  Validator = any,
> =
  | DisplayWidget<StateKeys, FormType>
  | InputWidget<any, StateKeys, FormType, any, Validator>
  | LayoutWidget<StateKeys, FormType>
  | ActionWidget<StateKeys, FormType>;

// TODO: we should remove StateKeys because FunctionWidget don't support states
export type FunctionWidget<
  StateKeys extends UiState = never,
  FormType extends Record<string, any> = any,
  Validator = any,
> = {
  uid?: Uid;
  type?: string;
  path?: string; // when this is a control, this will have a path, otherwise undefined
  /**
   * Function that calculates the widget definition.
   * Function Widgets are called at least once with `undefined`.
   */
  (api?: FunctionWidgetParams<FormType>): NonFunctionWidget<StateKeys, FormType, Validator>;
};

export type FormWidget<
  StateKeys extends UiState = never,
  FormType extends Record<string, any> = any,
  Validator = any,
> =
  | NonFunctionWidget<StateKeys, FormType, Validator>
  | FunctionWidget<StateKeys, FormType, Validator>;

// --------------------------------
//
// Type guards
//
// --------------------------------

export const isDisplayWidget = <
  StateKeys extends string,
  FormType extends Record<string, any> = any,
>(
  widget: FormWidget<StateKeys, FormType>,
): widget is DisplayWidget<StateKeys, FormType> =>
  typeof widget !== 'function' && widget.kind === 'display';

export const isActionWidget = <
  StateKeys extends string,
  FormType extends Record<string, any> = any,
>(
  widget: FormWidget<StateKeys, FormType>,
): widget is ActionWidget<StateKeys, FormType> =>
  typeof widget !== 'function' && widget.kind === 'action';

export const isInputWidget = <
  T,
  StateKeys extends string,
  FormType extends Record<string, any> = any,
>(
  widget: FormWidget<StateKeys, FormType>,
): widget is InputWidget<T, StateKeys, FormType> =>
  typeof widget !== 'function' && widget.kind === 'input';

export const isLayoutWidget = <
  StateKeys extends string,
  FormType extends Record<string, any> = any,
>(
  widget: FormWidget<StateKeys, FormType>,
): widget is LayoutWidget<StateKeys, FormType> =>
  typeof widget !== 'function' && widget.kind === 'layout';

export const isFunctionWidget = <
  StateKeys extends string,
  FormType extends Record<string, any> = any,
>(
  widget: FormWidget<StateKeys, FormType>,
): widget is FunctionWidget<StateKeys, FormType> => typeof widget === 'function';

// --------------------------------
//
// Json Decoder
//
// --------------------------------

const inDecoder = object({ in: array(string(), 'In[]') }, 'In');
type In = FromDecoder<typeof inDecoder>;

const whenDecoder = object({ when: string() }, 'When');
type When = FromDecoder<typeof whenDecoder>;

// include
const includeDecoder = oneOf<In | When>([inDecoder, whenDecoder], 'In | When');

const fromDecoder = object({ from: array(string(), 'From[]') }, 'From');
type From = FromDecoder<typeof fromDecoder>;

// exclude
const excludeDecoder = oneOf<From | When>([fromDecoder, whenDecoder], 'Exclude');

// disable / readonly
const boolWhenDecoder = oneOf<boolean | When>([boolean(), whenDecoder], 'Bool | When');

// all widget properties that support states can potentially be a WidgetPropertyFunction
const widgetPropFnDecoder: Decoder<WidgetPropertyFunction<any>> = new Decoder(
  (json: unknown) => {
    const jsonTypeof = typeof json;
    if (jsonTypeof === 'function') {
      return ok(json as WidgetPropertyFunction<any>);
    } else {
      return err(`Expected a function, got '${jsonTypeof}'`);
    }
  },
);
const decodeWidgetPropOrWidgetPropFn = <T>(decoder: Decoder<T>) =>
  oneOf<T | WidgetPropertyFunction<any>>([decoder, widgetPropFnDecoder], '');

const onDecoder = objectWithSuffix(
  {
    load: { suffixed: true, decoder: decodeWidgetPropOrWidgetPropFn(optional(string())) },
    click: { suffixed: true, decoder: decodeWidgetPropOrWidgetPropFn(optional(string())) },
    change: { suffixed: true, decoder: decodeWidgetPropOrWidgetPropFn(optional(string())) },
    filter: { suffixed: true, decoder: decodeWidgetPropOrWidgetPropFn(optional(string())) },
    blur: { suffixed: true, decoder: decodeWidgetPropOrWidgetPropFn(optional(string())) },
  },
  'On',
);

const translationConfigDecoder = object<TranslationConfig>(
  {
    key: string(),
    default: optional(string()),
    params: succeed(),
  },
  'TranslationConfig',
);
const localizableDecoder = oneOf<Localizable>(
  [string(), translationConfigDecoder],
  'Localizable',
);

const uidDecoder = optional(string()).map((s) => s || shortUUID());

const displayWidgetDecoder = objectWithSuffix<DisplayWidget<string>>(
  {
    kind: { decoder: literal('display') },
    uid: { decoder: uidDecoder },
    type: { decoder: string() },
    size: { suffixed: true, decoder: optional(number()) },
    include: { decoder: optional(includeDecoder) },
    exclude: { decoder: optional(excludeDecoder) },
    props: { decoder: optional(succeed()) },
  },
  'DisplayWidget',
);

const actionWidgetDecoder = objectWithSuffix<ActionWidget<string>>(
  {
    kind: { decoder: literal('action') },
    uid: { decoder: uidDecoder },
    type: { decoder: string() },
    size: { suffixed: true, decoder: optional(number()) },
    include: { decoder: optional(includeDecoder) },
    exclude: { decoder: optional(excludeDecoder) },
    label: { suffixed: true, decoder: decodeWidgetPropOrWidgetPropFn(localizableDecoder) },
    disabled: { suffixed: true, decoder: optional(boolWhenDecoder) },
    on: { decoder: optional(onDecoder) },
    props: { decoder: optional(succeed()) },
  },
  'ActionWidget',
);

const functionWidgetDecoder: Decoder<FunctionWidget<string>> = new Decoder(
  (json: unknown) => {
    const jsonTypeof = typeof json;
    if (jsonTypeof === 'function') {
      const fnWidget = json as FunctionWidget<string>;
      const widget = fnWidget(undefined);
      fnWidget.uid = widget.uid || shortUUID();
      fnWidget.type = widget.type;
      fnWidget.path = (widget as InputWidget<unknown>).path; // this could be undefined, and it's ok.
      return ok(fnWidget);
    } else {
      return err(`Expected a function, got '${jsonTypeof}'`);
    }
  },
);

const inputWidgetDecoder = objectWithSuffix<InputWidget<any, string>>(
  {
    kind: { decoder: literal('input') },
    uid: { decoder: uidDecoder },
    type: { decoder: string() },
    size: { suffixed: true, decoder: optional(number()) },
    include: { decoder: optional(includeDecoder) },
    exclude: { decoder: optional(excludeDecoder) },
    disabled: { suffixed: true, decoder: optional(boolWhenDecoder) },
    readonly: { suffixed: true, decoder: optional(boolWhenDecoder) },
    on: { decoder: optional(onDecoder) },
    props: { decoder: optional(succeed()) },
    label: {
      suffixed: true,
      decoder: decodeWidgetPropOrWidgetPropFn(optional(localizableDecoder)),
    },
    path: { decoder: string() },
    defaultValue: { decoder: optional(succeed()) },
    validator: {
      suffixed: true,
      decoder: decodeWidgetPropOrWidgetPropFn(optional(succeed())),
    },
  },
  'InputWidget',
).map((ctrl) => {
  const transformed = { ...ctrl };
  if (!ctrl.uid) {
    transformed.uid = `${ctrl.path}-${ctrl.type}`;
  }
  // TODO: no type safety in this block
  if (ctrl.type === 'repeater') {
    const props = ctrl['props'] as Record<string, any>;
    props['template'] = layoutWidgetDecoder.parse(props['template']);
  }
  return transformed;
});

type FormWidgetDecoder = Decoder<
  | DisplayWidget<string>
  | ActionWidget<string>
  | InputWidget<any, string>
  | LayoutWidget<string>
  | FunctionWidget<string>
>;
const formWidgetDecoder = lazy(
  (): FormWidgetDecoder =>
    oneOf<
      | DisplayWidget<string>
      | ActionWidget<string>
      | InputWidget<any, string>
      | LayoutWidget<string>
      | FunctionWidget<string>
    >(
      [
        functionWidgetDecoder,
        inputWidgetDecoder,
        layoutWidgetDecoder,
        displayWidgetDecoder,
        actionWidgetDecoder,
      ],
      'FormWidget',
    ),
);

export const layoutWidgetDecoder = objectWithSuffix<LayoutWidget<string>>(
  {
    kind: { decoder: literal('layout') },
    uid: { decoder: uidDecoder },
    type: { decoder: string() },
    size: { suffixed: true, decoder: optional(number()) },
    include: { decoder: optional(includeDecoder) },
    exclude: { decoder: optional(excludeDecoder) },
    props: { decoder: optional(succeed()) },
    on: { decoder: optional(onDecoder) },
    children: { decoder: array(formWidgetDecoder, 'FormWidget[]') },
  },
  'LayoutWidget',
);
