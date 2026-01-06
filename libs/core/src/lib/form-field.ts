import * as jd from 'ts.data.json';
import { DotPath, ReactiveExpression, ReactiveFieldFunction, Uid, UiState } from './shared';
import { objectWithSuffix } from './utils/decoder';
import { shortUUID } from './utils/random';
import { AllSuffixable, SomeSuffixable } from './utils/suffixable';

// --------------------------------
//
// Types
//
// --------------------------------

export type Flags = {
  hidden?: boolean;
};

export type FieldWidget = string;
// export type FieldWidget = 'textinput' | 'textarea' | 'password' | ... | 'stack' | 'grid' | ... | 'heading' | 'markdown' | 'alert' |...

type ReactiveFieldValue<T, FormData extends Record<string, any> = any> =
  | ReactiveExpression
  | ReactiveFieldFunction<T, FormData>
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
    load?: ReactiveFieldValue<EventExpression, FormData>;
    click?: ReactiveFieldValue<EventExpression, FormData>;
    change?: ReactiveFieldValue<EventExpression, FormData>;
  },
  StateKeys
>;

export type BaseField<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
> = {
  // kind: 'display' | 'interactive' | 'control' | 'layout';
  uid: Uid;
  widget: FieldWidget;
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
  // TODO: ReactiveFieldFunction<any> should be ReactiveFieldFunction<MyFormDataType>
  /**
   * Non-core properties e.g. text, level...
   * props can be suffixed with state keys. e.g. { props: {text: 'Login', 'text.register': 'Register'} }
   */
  props?: Record<
    string,
    string | boolean | number | any[] | Record<string, any> | ReactiveFieldFunction<any, FormData>
  >;
};

export type DisplayField<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
> = SomeSuffixable<BaseField<StateKeys, FormData> & { kind: 'display' }, never, StateKeys>;

export type InteractiveField<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
> = SomeSuffixable<
  BaseField<StateKeys, FormData> & {
    kind: 'interactive';
    label?: ReactiveFieldValue<string, FormData>;
    on?: On<StateKeys, FormData>;
  },
  'disabled' | 'label',
  StateKeys
>;

export type ControlField<
  T,
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
> = SomeSuffixable<
  BaseField<StateKeys, FormData> & {
    kind: 'control';
    path: DotPath;
    /**
     * Defines the label behavior:
     * - If `label` is `undefined`, it will be derived from the control path.
     * - If `label` is an empty string, no label will be displayed.
     * - Otherwise, the provided label will be rendered.
     */
    label?: ReactiveFieldValue<string, FormData>;
    on?: On<StateKeys, FormData>;
    defaultValue?: T;
    validator?: ReactiveFieldValue<object, FormData>; // `object` should be `V` (the validator type)
  },
  'disabled' | 'label' | 'validator',
  StateKeys
>;

export type LayoutField<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
> = SomeSuffixable<
  BaseField<StateKeys, FormData> & {
    kind: 'layout';
    on?: On<StateKeys, FormData>;
    // TODO: this should be FormField, but types cannot reference themselves. Keep in sync!
    children: (
      | DisplayField<StateKeys, FormData>
      | ControlField<any, StateKeys, FormData>
      | LayoutField<StateKeys, FormData>
      | InteractiveField<StateKeys, FormData>
      | FunctionField<StateKeys, FormData>
    )[];
  },
  never,
  StateKeys
>;

// ⚠️ When updating, update LayoutField['children'] too!
export type NonFunctionField<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
> =
  | DisplayField<StateKeys, FormData>
  | ControlField<any, StateKeys, FormData>
  | LayoutField<StateKeys, FormData>
  | InteractiveField<StateKeys, FormData>;

// TODO: we should remove StateKeys because FunctionField don't support states
export type FunctionField<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
> = {
  uid?: Uid;
  widget?: string;
  (formData?: FormData): NonFunctionField<StateKeys, FormData>;
};

export type FormField<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
> = NonFunctionField<StateKeys, FormData> | FunctionField<StateKeys, FormData>;

// --------------------------------
//
// Type guards
//
// --------------------------------

export const isDisplayField = <
  StateKeys extends string,
  FormData extends Record<string, any> = any,
>(
  field: FormField<StateKeys, FormData>,
): field is DisplayField<StateKeys, FormData> =>
  typeof field !== 'function' && field.kind === 'display';

export const isInteractiveField = <
  StateKeys extends string,
  FormData extends Record<string, any> = any,
>(
  field: FormField<StateKeys, FormData>,
): field is InteractiveField<StateKeys, FormData> =>
  typeof field !== 'function' && field.kind === 'interactive';

export const isControlField = <
  T,
  StateKeys extends string,
  FormData extends Record<string, any> = any,
>(
  field: FormField<StateKeys, FormData>,
): field is ControlField<T, StateKeys, FormData> =>
  typeof field !== 'function' && field.kind === 'control';

export const isLayoutField = <StateKeys extends string, FormData extends Record<string, any> = any>(
  field: FormField<StateKeys, FormData>,
): field is LayoutField<StateKeys, FormData> =>
  typeof field !== 'function' && field.kind === 'layout';

export const isFunctionField = <
  StateKeys extends string,
  FormData extends Record<string, any> = any,
>(
  field: FormField<StateKeys, FormData>,
): field is FunctionField<StateKeys, FormData> => typeof field === 'function';

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

// all fields that support states can potentially be a ReactiveFieldFunction
const fieldFnDecoder: jd.Decoder<ReactiveFieldFunction<any>> = new jd.Decoder((json: unknown) => {
  const jsonTypeof = typeof json;
  if (jsonTypeof === 'function') {
    return jd.ok(json as ReactiveFieldFunction<any>);
  } else {
    return jd.err(`Expected a function, got '${jsonTypeof}'`);
  }
});
const decodeFieldOrFn = <T>(decoder: jd.Decoder<T>) =>
  jd.oneOf<T | ReactiveFieldFunction<any>>([decoder, fieldFnDecoder], '');

const onDecoder = objectWithSuffix(
  {
    load: { suffixed: true, decoder: decodeFieldOrFn(jd.optional(jd.string())) },
    click: { suffixed: true, decoder: decodeFieldOrFn(jd.optional(jd.string())) },
    change: { suffixed: true, decoder: decodeFieldOrFn(jd.optional(jd.string())) },
  },
  'On',
);

const uidDecoder = jd.optional(jd.string()).map((s) => s || shortUUID());

const displayFieldDecoder = jd.object<DisplayField<string>>(
  {
    kind: jd.literal('display'),
    uid: uidDecoder,
    widget: jd.string(),
    include: jd.optional(includeDecoder),
    exclude: jd.optional(excludeDecoder),
    disabled: jd.optional(boolWhenDecoder),
    readonly: jd.optional(boolWhenDecoder),
    props: jd.optional(jd.succeed()),
  },
  'DisplayField',
);

const interactiveFieldDecoder = objectWithSuffix<InteractiveField<string>>(
  {
    kind: { decoder: jd.literal('interactive') },
    uid: { decoder: uidDecoder },
    widget: { decoder: jd.string() },
    include: { decoder: jd.optional(includeDecoder) },
    exclude: { decoder: jd.optional(excludeDecoder) },
    disabled: { suffixed: true, decoder: jd.optional(boolWhenDecoder) },
    label: { suffixed: true, decoder: decodeFieldOrFn(jd.string()) },
    readonly: { decoder: jd.optional(boolWhenDecoder) },
    on: { decoder: jd.optional(onDecoder) },
    props: { decoder: jd.optional(jd.succeed()) },
  },
  'InteractiveField',
);

const functionFieldDecoder: jd.Decoder<FunctionField<string>> = new jd.Decoder((json: unknown) => {
  const jsonTypeof = typeof json;
  if (jsonTypeof === 'function') {
    const fnField = json as FunctionField<string>;
    const field = fnField(undefined);
    fnField.uid = field.uid ?? shortUUID();
    fnField.widget = field.widget;
    return jd.ok(fnField);
  } else {
    return jd.err(`Expected a function, got '${jsonTypeof}'`);
  }
});

const controlFieldDecoder = objectWithSuffix<ControlField<any, string>>(
  {
    kind: { decoder: jd.literal('control') },
    uid: { decoder: uidDecoder },
    widget: { decoder: jd.string() },
    include: { decoder: jd.optional(includeDecoder) },
    exclude: { decoder: jd.optional(excludeDecoder) },
    disabled: { suffixed: true, decoder: jd.optional(boolWhenDecoder) },
    // TODO: shoudn't readonly have suffix support?
    readonly: { decoder: jd.optional(boolWhenDecoder) },
    on: { decoder: jd.optional(onDecoder) },
    props: { decoder: jd.optional(jd.succeed()) },
    label: { suffixed: true, decoder: decodeFieldOrFn(jd.optional(jd.string())) },
    path: { decoder: jd.string() },
    defaultValue: { decoder: jd.optional(jd.succeed()) },
    validator: { suffixed: true, decoder: decodeFieldOrFn(jd.optional(jd.succeed())) },
  },
  'ControlField',
).map((ctrl) => {
  const transformed = { ...ctrl };
  if (!ctrl.uid) {
    transformed.uid = `${ctrl.path}-${ctrl.widget}`;
  }
  // TODO: no type safety in this block
  if (ctrl.widget === 'repeater') {
    const props = ctrl['props'] as Record<string, any>;
    props['template'] = layoutFieldDecoder.parse(props['template']);
  }
  return transformed;
});

type FormFieldDecoder = jd.Decoder<
  | DisplayField<string>
  | InteractiveField<string>
  | ControlField<any, string>
  | LayoutField<string>
  | FunctionField<string>
>;
const formFieldDecoder = jd.lazy(
  (): FormFieldDecoder =>
    jd.oneOf<
      | DisplayField<string>
      | InteractiveField<string>
      | ControlField<any, string>
      | LayoutField<string>
      | FunctionField<string>
    >(
      [
        functionFieldDecoder,
        controlFieldDecoder,
        layoutFieldDecoder,
        displayFieldDecoder,
        interactiveFieldDecoder,
      ],
      'FormField',
    ),
);

export const layoutFieldDecoder = objectWithSuffix<LayoutField<string>>(
  {
    kind: { decoder: jd.literal('layout') },
    uid: { decoder: uidDecoder },
    widget: { decoder: jd.string() },
    include: { decoder: jd.optional(includeDecoder) },
    exclude: { decoder: jd.optional(excludeDecoder) },
    disabled: { suffixed: true, decoder: jd.optional(boolWhenDecoder) },
    // TODO: shoudn't readonly have suffix support?
    readonly: { decoder: jd.optional(boolWhenDecoder) },
    props: { decoder: jd.optional(jd.succeed()) },
    on: { decoder: jd.optional(onDecoder) },
    children: { decoder: jd.array(formFieldDecoder, 'FormField[]') },
  },
  'LayoutField',
);
