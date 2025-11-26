import { DotPath, ReactiveExpression, Uid, UiState } from './shared';
import { shortUUID } from './utils/random';
import { AllSuffixable, SomeSuffixable } from './utils/suffixable';
import {
  any,
  array,
  boolean,
  extend,
  lazy,
  literal,
  looseObject,
  object,
  optional,
  pipe,
  string,
  transform,
  union,
  ZodMiniType,
} from 'zod/mini';

// --------------------------------
//
// Types
//
// --------------------------------

export type Flags = {
  hidden?: boolean;
  disabled?: boolean;
  required?: boolean;
  readonly?: boolean;
};

export type FieldWidget = string;
// export type FieldWidget = 'textinput' | 'textarea' | 'password' | ... | 'stack' | 'grid' | ... | 'heading' | 'markdown' | 'alert' |...

/**
 * An event expression is basically a way to change the current UI state: `currentState = 'loading'` or send an event `loadData` for the forms engine runtime to process.
 */
type EventExpression = string;

export type On<StateKeys extends UiState = never> = AllSuffixable<
  {
    load?: EventExpression;
    click?: EventExpression;
    change?: EventExpression;
  },
  StateKeys
>;

export type BaseField<StateKeys extends UiState = never> = {
  // kind: 'display' | 'interactive' | 'control' | 'layout';
  uid: Uid;
  widget: FieldWidget;
  include?: { in: StateKeys[] } | { when: ReactiveExpression };
  exclude?: { from: StateKeys[] } | { when: ReactiveExpression };
  disabled?: boolean | { when: ReactiveExpression };
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
  /**
   * Non-core properties e.g. text, level...
   * props can be suffixed with state keys. e.g. { props: {text: 'Login', 'text.register': 'Register'} }
   */
  props?: Record<string, any>;
};

export type DisplayField<StateKeys extends UiState = never> = SomeSuffixable<
  BaseField<StateKeys> & { kind: 'display' },
  never,
  StateKeys
>;

export type InteractiveField<StateKeys extends UiState = never> = SomeSuffixable<
  BaseField<StateKeys> & { kind: 'interactive'; label: string; on?: On<StateKeys> },
  'disabled' | 'label',
  StateKeys
>;

export type ControlField<T, StateKeys extends UiState = never> = SomeSuffixable<
  BaseField<StateKeys> & {
    kind: 'control';
    path: DotPath;
    /**
     * Defines the label behavior:
     * - If `label` is `undefined`, it will be derived from the control path.
     * - If `label` is an empty string, no label will be displayed.
     * - Otherwise, the provided label will be rendered.
     */
    label?: ReactiveExpression | string;
    on?: On<StateKeys>;
    defaultValue?: T;
    validator?: any;
  },
  'disabled' | 'label' | 'validator',
  StateKeys
>;

export type LayoutField<StateKeys extends UiState = never> = SomeSuffixable<
  BaseField<StateKeys> & {
    kind: 'layout';
    // TODO: this should be FormField, but types cannot reference themselves. Keep in sync!
    children: (
      | DisplayField<StateKeys>
      | ControlField<any, StateKeys>
      | LayoutField<StateKeys>
      | InteractiveField<StateKeys>
    )[];
  },
  never,
  StateKeys
>;

// TODO: when updating, update LayoutField['children'] too!
export type FormField<StateKeys extends UiState = never> =
  | DisplayField<StateKeys>
  | ControlField<any, StateKeys>
  | LayoutField<StateKeys>
  | InteractiveField<StateKeys>;

// --------------------------------
//
// Type guards
//
// --------------------------------

export const isDisplayField = <StateKeys extends string>(
  field: FormField<StateKeys>,
): field is DisplayField<StateKeys> => field.kind === 'display';

export const isInteractiveField = <StateKeys extends string>(
  field: FormField<StateKeys>,
): field is InteractiveField<StateKeys> => field.kind === 'interactive';

export const isControlField = <T, StateKeys extends string>(
  field: FormField<StateKeys>,
): field is ControlField<T, StateKeys> => field.kind === 'control';

export const isLayoutField = <StateKeys extends string>(
  field: FormField<StateKeys>,
): field is LayoutField<StateKeys> => field.kind === 'layout';

// --------------------------------
//
// Schema
//
// --------------------------------

const InWhenSchema = union([
  object({
    in: array(string()),
  }),
  object({
    when: string(),
  }),
]);

const InWhenBoolSchema = union([
  boolean(),
  object({
    in: array(string()),
  }),
  object({
    when: string(),
  }),
]);

const ExcludeSchema = union([
  object({
    from: array(string()),
  }),
  object({
    when: string(),
  }),
]);

const OnSchema = looseObject({
  load: optional(string()),
  click: optional(string()),
  change: optional(string()),
});

// TODO: add types ZodMiniType<Field>
const DisplayFieldSchema = looseObject({
  kind: literal('display'),
  uid: pipe(
    optional(string()),
    transform((s) => s || shortUUID()),
  ),
  widget: string(),
  include: optional(InWhenSchema),
  exclude: optional(ExcludeSchema),
  enabled: optional(InWhenBoolSchema),
  on: optional(OnSchema),
});

export const InteractiveFieldSchema = extend(DisplayFieldSchema, {
  kind: literal('interactive'),
  label: optional(string()),
  on: optional(OnSchema),
});

export const ControlFieldSchema = <S extends ZodMiniType>(defaultValueSchema: S) =>
  pipe(
    extend(DisplayFieldSchema, {
      kind: literal('control'),
      path: string(),
      label: optional(string()),
      required: optional(InWhenBoolSchema),
      readonly: optional(InWhenBoolSchema),
      defaultValue: optional(defaultValueSchema),
    }),
    transform((ctrl) => {
      const transformed = { ...ctrl };
      if (!ctrl.uid) {
        transformed.uid = `${ctrl.path}-${ctrl.widget}`;
      }
      // TODO: no type safety in this block
      if (ctrl.widget === 'repeater') {
        const props = ctrl['props'] as Record<string, any>;
        props['template'] = LayoutFieldSchema.parse(props['template']);
      }
      return transformed;
    }),
  );

export const LayoutFieldSchema = extend(DisplayFieldSchema, {
  kind: literal('layout'),
  children: lazy(() => array(AllFieldSchema)),
});

const AllFieldSchema: ZodMiniType = union([
  LayoutFieldSchema,
  ControlFieldSchema(any()),
  DisplayFieldSchema,
  InteractiveFieldSchema,
]);
