import * as jd from 'ts.data.json';
import { Localizable, TranslationConfig } from './i18n';
import {
  DotPath,
  FunctionWidgetParams,
  ReactiveExpression,
  Uid,
  UiState,
  WidgetPropertyFunction,
} from './shared';
import { objectWithSuffix } from './utils/decoder';
import { shortUUID } from './utils/random';
import { AllSuffixable, SomeSuffixable } from './utils/suffixable';

// --------------------------------
//
// Types
//
// --------------------------------

/**
 * The widget type identifier used to resolve the corresponding UI component from the registry.
 * Examples: 'textinput', 'textarea', 'password', 'stack', 'grid', 'heading', 'markdown', 'alert'
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

  // <dev-note>
  //    TODO: Is this better? {in} and {when} is maybe too verbose...
  //    includeIn?: StateKeys[] | ReactiveExpression;
  //    excludeFrom?: StateKeys[] | ReactiveExpression;
  //    disabled?: boolean | ReactiveExpression;
  //    required?: boolean | ReactiveExpression;
  //    readonly?: boolean | ReactiveExpression;
  // </ dev-note>

  // TODO: figure out the type to make props AllSuffixable. e.g. AllSuffixable<Record<string, unknown>, StateKeys>

  // TODO: Fix the type. `props` should only accept functions or Json serializable values.
  // TODO: WidgetPropertyFunction<any> should be WidgetPropertyFunction<MyFormType>
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
    ? Props[K] | Localizable | WidgetPropertyFunction<Props[K], FormType>
    : Props[K] | WidgetPropertyFunction<Props[K], FormType>;
};

// type MakeProps_old<
//   Props extends Record<string, any> = any,
//   FormType extends Record<string, any> = any,
// > = Partial<
//   Record<
//     keyof Props,
//     | string
//     | boolean
//     | number
//     | any[]
//     | Localizable
//     | Record<string, any>
//     | WidgetPropertyFunction<any, FormType>
//   >
// >;

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
> = SomeSuffixable<
  BaseWidget<StateKeys, FormType, Props> & {
    kind: 'input';
    path: DotPath;
    label?: ReactiveWidgetPropertyValue<Localizable, FormType>;
    disabled?: boolean | { when: ReactiveExpression };
    readonly?: boolean | { when: ReactiveExpression };
    on?: On<StateKeys, FormType>;
    defaultValue?: T;
    validator?: ReactiveWidgetPropertyValue<object, FormType>; // `object` should be `V` (the validator type)
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
> =
  | DisplayWidget<StateKeys, FormType>
  | InputWidget<any, StateKeys, FormType>
  | LayoutWidget<StateKeys, FormType>
  | ActionWidget<StateKeys, FormType>;

// TODO: we should remove StateKeys because FunctionWidget don't support states
export type FunctionWidget<
  StateKeys extends UiState = never,
  FormType extends Record<string, any> = any,
> = {
  uid?: Uid;
  type?: string;
  path?: string; // when this is a control, this will have a path, otherwise undefined
  /**
   * Function that calculates the widget definition.
   * Function Widgets are called at least once with `undefined`.
   */
  (api?: FunctionWidgetParams<FormType>): NonFunctionWidget<StateKeys, FormType>;
};

export type FormWidget<
  StateKeys extends UiState = never,
  FormType extends Record<string, any> = any,
> = NonFunctionWidget<StateKeys, FormType> | FunctionWidget<StateKeys, FormType>;

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

const inDecoder = jd.object({ in: jd.array(jd.string(), 'In[]') }, 'In');
type In = jd.FromDecoder<typeof inDecoder>;

const whenDecoder = jd.object({ when: jd.string() }, 'When');
type When = jd.FromDecoder<typeof whenDecoder>;

// include
const includeDecoder = jd.oneOf<In | When>([inDecoder, whenDecoder], 'In | When');

const fromDecoder = jd.object({ from: jd.array(jd.string(), 'From[]') }, 'From');
type From = jd.FromDecoder<typeof fromDecoder>;

// exclude
const excludeDecoder = jd.oneOf<From | When>([fromDecoder, whenDecoder], 'Exclude');

// disable / readonly
const boolWhenDecoder = jd.oneOf<boolean | When>([jd.boolean(), whenDecoder], 'Bool | When');

// all widget properties that support states can potentially be a WidgetPropertyFunction
const widgetPropFnDecoder: jd.Decoder<WidgetPropertyFunction<any>> = new jd.Decoder(
  (json: unknown) => {
    const jsonTypeof = typeof json;
    if (jsonTypeof === 'function') {
      return jd.ok(json as WidgetPropertyFunction<any>);
    } else {
      return jd.err(`Expected a function, got '${jsonTypeof}'`);
    }
  },
);
const decodeWidgetPropOrWidgetPropFn = <T>(decoder: jd.Decoder<T>) =>
  jd.oneOf<T | WidgetPropertyFunction<any>>([decoder, widgetPropFnDecoder], '');

const onDecoder = objectWithSuffix(
  {
    load: { suffixed: true, decoder: decodeWidgetPropOrWidgetPropFn(jd.optional(jd.string())) },
    click: { suffixed: true, decoder: decodeWidgetPropOrWidgetPropFn(jd.optional(jd.string())) },
    change: { suffixed: true, decoder: decodeWidgetPropOrWidgetPropFn(jd.optional(jd.string())) },
    filter: { suffixed: true, decoder: decodeWidgetPropOrWidgetPropFn(jd.optional(jd.string())) },
  },
  'On',
);

const translationConfigDecoder = jd.object<TranslationConfig>(
  {
    key: jd.string(),
    default: jd.optional(jd.string()),
    params: jd.succeed(),
  },
  'TranslationConfig',
);
const localizableDecoder = jd.oneOf<Localizable>(
  [jd.string(), translationConfigDecoder],
  'Localizable',
);

const uidDecoder = jd.optional(jd.string()).map((s) => s || shortUUID());

const displayWidgetDecoder = objectWithSuffix<DisplayWidget<string>>(
  {
    kind: { decoder: jd.literal('display') },
    uid: { decoder: uidDecoder },
    type: { decoder: jd.string() },
    size: { suffixed: true, decoder: jd.optional(jd.number()) },
    include: { decoder: jd.optional(includeDecoder) },
    exclude: { decoder: jd.optional(excludeDecoder) },
    props: { decoder: jd.optional(jd.succeed()) },
  },
  'DisplayWidget',
);

const actionWidgetDecoder = objectWithSuffix<ActionWidget<string>>(
  {
    kind: { decoder: jd.literal('action') },
    uid: { decoder: uidDecoder },
    type: { decoder: jd.string() },
    size: { suffixed: true, decoder: jd.optional(jd.number()) },
    include: { decoder: jd.optional(includeDecoder) },
    exclude: { decoder: jd.optional(excludeDecoder) },
    label: { suffixed: true, decoder: decodeWidgetPropOrWidgetPropFn(localizableDecoder) },
    disabled: { suffixed: true, decoder: jd.optional(boolWhenDecoder) },
    on: { decoder: jd.optional(onDecoder) },
    props: { decoder: jd.optional(jd.succeed()) },
  },
  'ActionWidget',
);

const functionWidgetDecoder: jd.Decoder<FunctionWidget<string>> = new jd.Decoder(
  (json: unknown) => {
    const jsonTypeof = typeof json;
    if (jsonTypeof === 'function') {
      const fnWidget = json as FunctionWidget<string>;
      const widget = fnWidget(undefined);
      fnWidget.uid = widget.uid || shortUUID();
      fnWidget.type = widget.type;
      fnWidget.path = (widget as InputWidget<unknown>).path; // this could be undefined, and it's ok.
      return jd.ok(fnWidget);
    } else {
      return jd.err(`Expected a function, got '${jsonTypeof}'`);
    }
  },
);

const inputWidgetDecoder = objectWithSuffix<InputWidget<any, string>>(
  {
    kind: { decoder: jd.literal('input') },
    uid: { decoder: uidDecoder },
    type: { decoder: jd.string() },
    size: { suffixed: true, decoder: jd.optional(jd.number()) },
    include: { decoder: jd.optional(includeDecoder) },
    exclude: { decoder: jd.optional(excludeDecoder) },
    disabled: { suffixed: true, decoder: jd.optional(boolWhenDecoder) },
    readonly: { suffixed: true, decoder: jd.optional(boolWhenDecoder) },
    on: { decoder: jd.optional(onDecoder) },
    props: { decoder: jd.optional(jd.succeed()) },
    label: {
      suffixed: true,
      decoder: decodeWidgetPropOrWidgetPropFn(jd.optional(localizableDecoder)),
    },
    path: { decoder: jd.string() },
    defaultValue: { decoder: jd.optional(jd.succeed()) },
    validator: {
      suffixed: true,
      decoder: decodeWidgetPropOrWidgetPropFn(jd.optional(jd.succeed())),
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

type FormWidgetDecoder = jd.Decoder<
  | DisplayWidget<string>
  | ActionWidget<string>
  | InputWidget<any, string>
  | LayoutWidget<string>
  | FunctionWidget<string>
>;
const formWidgetDecoder = jd.lazy(
  (): FormWidgetDecoder =>
    jd.oneOf<
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
    kind: { decoder: jd.literal('layout') },
    uid: { decoder: uidDecoder },
    type: { decoder: jd.string() },
    size: { suffixed: true, decoder: jd.optional(jd.number()) },
    include: { decoder: jd.optional(includeDecoder) },
    exclude: { decoder: jd.optional(excludeDecoder) },
    props: { decoder: jd.optional(jd.succeed()) },
    on: { decoder: jd.optional(onDecoder) },
    children: { decoder: jd.array(formWidgetDecoder, 'FormWidget[]') },
  },
  'LayoutWidget',
);
