import {
  array,
  boolean,
  Decoder,
  discriminatedUnion,
  err,
  lazy,
  literal,
  number,
  object,
  ok,
  oneOf,
  optional,
  string,
  succeed,
  type FromDecoder,
} from 'ts.data.json';
import { type Localizable, type TranslationConfig } from './i18n';
import { type DotPath, type ReactiveExpression, type Uid, type UiState } from './shared';
import { functionInDefinitionMessage, noFunction, objectWithSuffix } from './utils/decoder';
import { forbiddenPathSegmentIssue } from './utils/object';
import { type AllSuffixable, type SomeSuffixable } from './utils/suffixable';
import { derivedInputUid } from './utils/widget-uid';

// --------------------------------
//
// Types
//
// --------------------------------

/**
 * The widget type identifier used to resolve the corresponding UI component from the registry.
 * Examples: 'textinput', 'textarea', 'password', 'grid', 'tabs', 'markdown', 'alert'
 */
export type WidgetType = string;

type ReactiveWidgetPropertyValue<T> = ReactiveExpression | T;

/**
 * An event expression is basically a way to send an event `loadData` for the forms engine runtime to process.
 */
type EventExpression = string;

/**
 * The events of a widget. Each value is the name of the event that the form sends to the host.
 *
 * @typeParam StateKeys - The state names that a suffixed key can use.
 *
 * @example
 * ```typescript
 * const on: On<'editing'> = { click: 'save', 'click.editing': 'saveDraft' };
 * ```
 */
export type On<StateKeys extends UiState = never> = AllSuffixable<
  {
    load?: EventExpression;
    click?: EventExpression;
    change?: EventExpression;
    filter?: EventExpression;
    blur?: EventExpression;
  },
  StateKeys
>;

/**
 * The fields that every widget kind has.
 *
 * @typeParam StateKeys - The state names that a suffixed key can use.
 * @typeParam _FormType - The shape of the form data. No field reads it. It stays so that the
 *   type arguments after it keep their positions.
 * @typeParam Props - The props of the widget type.
 */
export type BaseWidget<
  StateKeys extends UiState = never,
  _FormType extends Record<string, any> = any,
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
  props?: AllSuffixable<MakeProps<Props>, StateKeys>;
};

type MakeProps<Props extends Record<string, any> = any> = {
  [K in keyof Props]: Props[K] extends string | (string | undefined)
    ? // We reconstruct the union to preserve literals.
      // 1. Props[K]: Keeps e.g. 'horizontal' | 'vertical'
      // 2. Exclude<Localizable, string>: Adds the object part of Localizable { key: ... }
      // 3. (string & {}): Adds generic string support WITHOUT swallowing the literals
      Props[K] | Exclude<Localizable, string> | (string & {})
    : Props[K];
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
    actionType?: 'button' | 'submit';
    label?: ReactiveWidgetPropertyValue<Localizable>;
    disabled?: boolean | { when: ReactiveExpression };
    on?: On<StateKeys>;
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
    label?: ReactiveWidgetPropertyValue<Localizable>;
    disabled?: boolean | { when: ReactiveExpression };
    readonly?: boolean | { when: ReactiveExpression };
    on?: On<StateKeys>;
    defaultValue?: T;
    // TODO: this shouldn't be a ReactiveWidgetPropertyValue because it cannot be a string
    validator?: ReactiveWidgetPropertyValue<V>;
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
)[];

export type LayoutWidget<
  StateKeys extends UiState = never,
  FormType extends Record<string, any> = any,
  Props extends Record<string, any> = any,
  Children extends FormWidget<StateKeys, FormType>[] = LayoutChildren<StateKeys, FormType>,
> = SomeSuffixable<
  BaseWidget<StateKeys, FormType, Props> & {
    kind: 'layout';
    on?: On<StateKeys>;
    // ⚠️ This should be FormWidget, but types cannot reference themselves. Keep in sync!
    children: Children;
  },
  'size',
  StateKeys
>;

/**
 * A widget of a form definition: a display, an input, a layout or an action widget. A widget is
 * an object, never a function.
 *
 * @typeParam StateKeys - The state names that a suffixed key can use.
 * @typeParam FormType - The shape of the form data. No field reads it. It stays so that
 *   `Validator` keeps its position.
 * @typeParam Validator - The validator type of an input widget of this union. An input inside
 *   the `children` of a layout has the default type.
 */
// ⚠️ When updating, update LayoutWidget['children'] too!
export type FormWidget<
  StateKeys extends UiState = never,
  FormType extends Record<string, any> = any,
  Validator = any,
> =
  | DisplayWidget<StateKeys, FormType>
  | InputWidget<any, StateKeys, FormType, any, Validator>
  | LayoutWidget<StateKeys, FormType>
  | ActionWidget<StateKeys, FormType>;

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
): widget is DisplayWidget<StateKeys, FormType> => widget.kind === 'display';

export const isActionWidget = <
  StateKeys extends string,
  FormType extends Record<string, any> = any,
>(
  widget: FormWidget<StateKeys, FormType>,
): widget is ActionWidget<StateKeys, FormType> => widget.kind === 'action';

export const isInputWidget = <
  T,
  StateKeys extends string,
  FormType extends Record<string, any> = any,
>(
  widget: FormWidget<StateKeys, FormType>,
): widget is InputWidget<T, StateKeys, FormType> => widget.kind === 'input';

export const isLayoutWidget = <
  StateKeys extends string,
  FormType extends Record<string, any> = any,
>(
  widget: FormWidget<StateKeys, FormType>,
): widget is LayoutWidget<StateKeys, FormType> => widget.kind === 'layout';

// --------------------------------
//
// Json Decoder
//
// --------------------------------

const inDecoder = object({ in: array(string()) });
type In = FromDecoder<typeof inDecoder>;

const whenDecoder = object({ when: string() });
type When = FromDecoder<typeof whenDecoder>;

// include
const includeDecoder = oneOf<In | When>([inDecoder, whenDecoder]);

const fromDecoder = object({ from: array(string()) });
type From = FromDecoder<typeof fromDecoder>;

// exclude
const excludeDecoder = oneOf<From | When>([fromDecoder, whenDecoder]);

// disable / readonly
const boolWhenDecoder = oneOf<boolean | When>([boolean(), whenDecoder]);

const onDecoder = objectWithSuffix({
  load: { suffixed: true, decoder: optional(string()) },
  click: { suffixed: true, decoder: optional(string()) },
  change: { suffixed: true, decoder: optional(string()) },
  filter: { suffixed: true, decoder: optional(string()) },
  blur: { suffixed: true, decoder: optional(string()) },
});

const translationConfigDecoder = object<TranslationConfig>({
  key: string(),
  default: optional(string()),
  params: optional(succeed()),
});
const localizableDecoder = oneOf<Localizable>([string(), translationConfigDecoder]);

// Missing uids are assigned later by assignDeterministicUids (see formDefDecoder)
const uidDecoder = optional(string());

// Nothing calls a prop that is a function, so it is an issue. A function deeper inside a prop
// value is not checked: what a list or an object of a prop holds belongs to the widget.
const propsDecoder = optional(
  new Decoder<Record<string, any>>((json: unknown) => {
    if (typeof json === 'object' && json !== null) {
      for (const key of Object.keys(json)) {
        if (typeof (json as Record<string, unknown>)[key] === 'function') {
          return err([{ message: functionInDefinitionMessage, path: [key] }]);
        }
      }
    }
    return ok(json as Record<string, any>);
  }),
);

// The path writers throw on these segments too. Rejecting them at decode names the widget in the
// form health message, and the `unset` of a hidden input at submit never throws.
const inputPathDecoder = new Decoder<DotPath>((json: unknown) => {
  if (typeof json !== 'string') {
    return string().decode(json);
  }
  const issue = forbiddenPathSegmentIssue(json);
  return issue === undefined ? ok(json) : err([{ message: issue, path: [] }]);
});

const widgetTypeDecoder = string();

// The rows of a repeater are built from its path and its row layout, which only an input has.
const typeOfNonInputDecoder = new Decoder<WidgetType>((json: unknown) => {
  if (json === 'repeater') {
    return err([
      {
        message:
          'The type "repeater" needs "kind": "input", a "path" and a row layout in "props.template".',
        path: [],
      },
    ]);
  }
  return widgetTypeDecoder.decode(json);
});

const displayWidgetDecoder = objectWithSuffix<DisplayWidget<string>>({
  kind: { decoder: literal('display') },
  uid: { decoder: uidDecoder },
  type: { decoder: typeOfNonInputDecoder },
  size: { suffixed: true, decoder: optional(number()) },
  include: { decoder: optional(includeDecoder) },
  exclude: { decoder: optional(excludeDecoder) },
  props: { decoder: propsDecoder },
});

const actionWidgetDecoder = objectWithSuffix<ActionWidget<string>>({
  kind: { decoder: literal('action') },
  uid: { decoder: uidDecoder },
  type: { decoder: typeOfNonInputDecoder },
  actionType: {
    decoder: optional(oneOf([literal('button'), literal('submit')])),
  },
  size: { suffixed: true, decoder: optional(number()) },
  include: { decoder: optional(includeDecoder) },
  exclude: { decoder: optional(excludeDecoder) },
  label: { suffixed: true, decoder: optional(localizableDecoder) },
  disabled: { suffixed: true, decoder: optional(boolWhenDecoder) },
  on: { decoder: optional(onDecoder) },
  props: { decoder: propsDecoder },
});

const inputWidgetDecoder = objectWithSuffix<InputWidget<any, string>>({
  kind: { decoder: literal('input') },
  uid: { decoder: optional(string()) },
  type: { decoder: string() },
  size: { suffixed: true, decoder: optional(number()) },
  include: { decoder: optional(includeDecoder) },
  exclude: { decoder: optional(excludeDecoder) },
  disabled: { suffixed: true, decoder: optional(boolWhenDecoder) },
  readonly: { suffixed: true, decoder: optional(boolWhenDecoder) },
  on: { decoder: optional(onDecoder) },
  props: { decoder: propsDecoder },
  label: { suffixed: true, decoder: optional(localizableDecoder) },
  path: { decoder: inputPathDecoder },
  defaultValue: { decoder: optional(succeed()) },
  validator: { suffixed: true, decoder: optional(succeed()) },
}).flatMap(
  (ctrl) =>
    new Decoder<InputWidget<any, string>>(() => {
      const transformed = { ...ctrl };
      if (!ctrl.uid) {
        transformed.uid = derivedInputUid(ctrl.path, ctrl.type);
      }
      // TODO: no type safety in this block
      if (ctrl.type === 'repeater') {
        const props = ctrl['props'] as Record<string, any> | null | undefined;
        const template = layoutWidgetDecoder.decode(props?.['template']);
        if (!template.isOk()) {
          return err(
            template.issues.map((issue) => ({
              ...issue,
              path: ['props', 'template', ...issue.path],
            })),
          );
        }
        // Copy the props so decoding never writes into the original form definition
        transformed.props = { ...props, template: template.value };
      }
      return ok(transformed);
    }),
);

const formWidgetDecoder = lazy(
  (): Decoder<FormWidget<string>> =>
    noFunction(
      discriminatedUnion('kind', {
        input: inputWidgetDecoder,
        layout: layoutWidgetDecoder,
        display: displayWidgetDecoder,
        action: actionWidgetDecoder,
      }),
    ),
);

export const layoutWidgetDecoder = objectWithSuffix<LayoutWidget<string>>({
  kind: { decoder: literal('layout') },
  uid: { decoder: uidDecoder },
  type: { decoder: typeOfNonInputDecoder },
  size: { suffixed: true, decoder: optional(number()) },
  include: { decoder: optional(includeDecoder) },
  exclude: { decoder: optional(excludeDecoder) },
  props: { decoder: propsDecoder },
  on: { decoder: optional(onDecoder) },
  children: { decoder: array(formWidgetDecoder) },
});
