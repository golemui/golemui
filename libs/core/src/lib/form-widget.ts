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

export type WidgetType = string;
// export type WidgetType = 'textinput' | 'textarea' | 'password' | ... | 'stack' | 'grid' | ... | 'heading' | 'markdown' | 'alert' |...

type ReactiveWidgetPropertyValue<T, FormData extends Record<string, any> = any> =
  | ReactiveExpression
  | WidgetPropertyFunction<T, FormData>
  | T;

/**
 * An event expression is basically a way to change the current UI state: `currentState = 'loading'` or send an event `loadData` for the forms engine runtime to process.
 */
type EventExpression = string;

export type On<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
> = AllSuffixable<
  {
    load?: ReactiveWidgetPropertyValue<EventExpression, FormData>;
    click?: ReactiveWidgetPropertyValue<EventExpression, FormData>;
    change?: ReactiveWidgetPropertyValue<EventExpression, FormData>;
    filter?: ReactiveWidgetPropertyValue<EventExpression, FormData>;
  },
  StateKeys
>;

export type BaseWidget<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
> = {
  // kind: 'display' | 'action' | 'input' | 'layout';
  uid: Uid;
  type: WidgetType;
  size?: number;
  include?: { in: StateKeys[] } | { when: ReactiveExpression };
  exclude?: { from: StateKeys[] } | { when: ReactiveExpression };
  // TODO: this shouldn't go here
  disabled?: boolean | { when: ReactiveExpression };
  // TODO: this shouldn't go here
  readonly?: boolean | { when: ReactiveExpression };

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
  // TODO: WidgetPropertyFunction<any> should be WidgetPropertyFunction<MyFormDataType>
  /**
   * Non-core properties e.g. text, level...
   * props can be suffixed with state keys. e.g. { props: {text: 'Login', 'text.register': 'Register'} }
   */
  props?: Record<
    string,
    | string
    | boolean
    | number
    | any[]
    | Localizable
    | Record<string, any>
    | WidgetPropertyFunction<any, FormData>
  >;
};

export type DisplayWidget<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
> = SomeSuffixable<BaseWidget<StateKeys, FormData> & { kind: 'display' }, never, StateKeys>;

export type ActionWidget<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
> = SomeSuffixable<
  BaseWidget<StateKeys, FormData> & {
    kind: 'action';
    label?: ReactiveWidgetPropertyValue<Localizable, FormData>;
    on?: On<StateKeys, FormData>;
  },
  'disabled' | 'label',
  StateKeys
>;

export type InputWidget<
  T,
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
> = SomeSuffixable<
  BaseWidget<StateKeys, FormData> & {
    kind: 'input';
    path: DotPath;
    /**
     * Defines the label behavior:
     * - If `label` is `undefined`, it will be derived from the widget path.
     * - If `label` is an empty string, no label will be displayed.
     * - Otherwise, the provided label will be rendered.
     */
    label?: ReactiveWidgetPropertyValue<Localizable, FormData>;
    on?: On<StateKeys, FormData>;
    defaultValue?: T;
    validator?: ReactiveWidgetPropertyValue<object, FormData>; // `object` should be `V` (the validator type)
  },
  'disabled' | 'readonly' | 'label' | 'validator' | 'size',
  StateKeys
>;

export type LayoutWidget<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
> = SomeSuffixable<
  BaseWidget<StateKeys, FormData> & {
    kind: 'layout';
    on?: On<StateKeys, FormData>;
    // TODO: this should be FormWidget, but types cannot reference themselves. Keep in sync!
    children: (
      | DisplayWidget<StateKeys, FormData>
      | InputWidget<any, StateKeys, FormData>
      | LayoutWidget<StateKeys, FormData>
      | ActionWidget<StateKeys, FormData>
      | FunctionWidget<StateKeys, FormData>
    )[];
  },
  'size',
  StateKeys
>;

// ⚠️ When updating, update LayoutWidget['children'] too!
export type NonFunctionWidget<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
> =
  | DisplayWidget<StateKeys, FormData>
  | InputWidget<any, StateKeys, FormData>
  | LayoutWidget<StateKeys, FormData>
  | ActionWidget<StateKeys, FormData>;

// TODO: we should remove StateKeys because FunctionWidget don't support states
export type FunctionWidget<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
> = {
  uid?: Uid;
  type?: string;
  path?: string; // when this is a control, this will have a path, otherwise undefined
  /**
   * Function that calculates the widget definition.
   * Function Widgets are called at least once with `undefined`.
   */
  (api?: FunctionWidgetParams<FormData>): NonFunctionWidget<StateKeys, FormData>;
};

export type FormWidget<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
> = NonFunctionWidget<StateKeys, FormData> | FunctionWidget<StateKeys, FormData>;

// --------------------------------
//
// Type guards
//
// --------------------------------

export const isDisplayWidget = <
  StateKeys extends string,
  FormData extends Record<string, any> = any,
>(
  widget: FormWidget<StateKeys, FormData>,
): widget is DisplayWidget<StateKeys, FormData> =>
  typeof widget !== 'function' && widget.kind === 'display';

export const isActionWidget = <
  StateKeys extends string,
  FormData extends Record<string, any> = any,
>(
  widget: FormWidget<StateKeys, FormData>,
): widget is ActionWidget<StateKeys, FormData> =>
  typeof widget !== 'function' && widget.kind === 'action';

export const isInputWidget = <
  T,
  StateKeys extends string,
  FormData extends Record<string, any> = any,
>(
  widget: FormWidget<StateKeys, FormData>,
): widget is InputWidget<T, StateKeys, FormData> =>
  typeof widget !== 'function' && widget.kind === 'input';

export const isLayoutWidget = <
  StateKeys extends string,
  FormData extends Record<string, any> = any,
>(
  widget: FormWidget<StateKeys, FormData>,
): widget is LayoutWidget<StateKeys, FormData> =>
  typeof widget !== 'function' && widget.kind === 'layout';

export const isFunctionWidget = <
  StateKeys extends string,
  FormData extends Record<string, any> = any,
>(
  widget: FormWidget<StateKeys, FormData>,
): widget is FunctionWidget<StateKeys, FormData> => typeof widget === 'function';

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

const displayWidgetDecoder = jd.object<DisplayWidget<string>>(
  {
    kind: jd.literal('display'),
    uid: uidDecoder,
    type: jd.string(),
    size: jd.optional(jd.number()),
    include: jd.optional(includeDecoder),
    exclude: jd.optional(excludeDecoder),
    // TODO: disabled and reaonly make no sense for display widgets
    disabled: jd.optional(boolWhenDecoder),
    readonly: jd.optional(boolWhenDecoder),
    props: jd.optional(jd.succeed()),
  },
  'DisplayWidget',
);

const actionWidgetDecoder = objectWithSuffix<ActionWidget<string>>(
  {
    kind: { decoder: jd.literal('action') },
    uid: { decoder: uidDecoder },
    type: { decoder: jd.string() },
    size: { decoder: jd.optional(jd.number()) },
    include: { decoder: jd.optional(includeDecoder) },
    exclude: { decoder: jd.optional(excludeDecoder) },
    label: { suffixed: true, decoder: decodeWidgetPropOrWidgetPropFn(localizableDecoder) },
    disabled: { suffixed: true, decoder: jd.optional(boolWhenDecoder) },
    // TODO: readonly makes no sense for action widgets
    readonly: { suffixed: true, decoder: jd.optional(boolWhenDecoder) },
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
    size: { decoder: jd.optional(jd.number()) },
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
    size: { decoder: jd.optional(jd.number()) },
    include: { decoder: jd.optional(includeDecoder) },
    exclude: { decoder: jd.optional(excludeDecoder) },
    // TODO: disabled and readonly make no sense for layouts
    disabled: { suffixed: true, decoder: jd.optional(boolWhenDecoder) },
    readonly: { suffixed: true, decoder: jd.optional(boolWhenDecoder) },
    props: { decoder: jd.optional(jd.succeed()) },
    on: { decoder: jd.optional(onDecoder) },
    children: { decoder: jd.array(formWidgetDecoder, 'FormWidget[]') },
  },
  'LayoutWidget',
);
