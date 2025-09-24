import * as z from 'zod/mini';
import { DotPath, ReactiveExpression, Uid, UiState } from './shared';
import { AllSuffixable, SomeSuffixable } from './utils/suffixable';

// --------------------------------
//
// Types
//
// --------------------------------

export type Flags = {
  hidden?: boolean;
  disabled?: boolean;
  required?: boolean;
  dirty?: boolean;
};

export type FieldWidget = string;
// export type FieldWidget =
//   | 'textinput'
//   | 'textarea'
//   | 'password'
//   | 'number'
//   | 'radio'
//   | 'checkbox'
//   | 'toggle'
//   | 'date'
//   | 'daterange'
//   | 'select'
//   | 'repeater'
//   | 'button'
//   // layout
//   | 'stack'
//   | 'grid'
//   | 'expander'
//   | 'card'
//   // presentation
//   | 'heading'
//   | 'markdown'
//   | 'alert';

/**
 * An event expression is basically a way to change the current UI state: `currentState = 'loading'` or send an event `loadData` for the forms engine runtime to process.
 */
type EventExpression = string;

export type On<StateKeys extends UiState = never> = AllSuffixable<
  {
    load?: EventExpression;
    click?: EventExpression;
    change?: EventExpression;
    //[k: string]: any;
  },
  StateKeys
>;

export type BaseField = {
  //kind: 'field' | 'button' | 'control' | 'layout';
  uid: Uid;
  widget: FieldWidget;
  disabled?: boolean | { when: ReactiveExpression };
  required?: boolean | { when: ReactiveExpression };
  include?: { in: UiState[] } | { when: ReactiveExpression };
  exclude?: { from: UiState[] } | { when: ReactiveExpression };
  //[k: string]: any;
};

export type Field<StateKeys extends UiState = never> = SomeSuffixable<
  BaseField & { kind: 'field' },
  never,
  StateKeys
>;

export type ButtonField<StateKeys extends UiState = never> = SomeSuffixable<
  BaseField & { kind: 'button'; label: string; on?: On<StateKeys> },
  'disabled' | 'label',
  StateKeys
>;

export type ControlField<T, StateKeys extends UiState = never> = SomeSuffixable<
  BaseField & {
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
    validators?: Record<string, any>;
  },
  'disabled' | 'required' | 'label' | 'validators',
  StateKeys
>;

export type LayoutField<StateKeys extends UiState = never> = SomeSuffixable<
  BaseField & {
    kind: 'layout';
    // TODO: this should be FormField, but types cannot reference themselves. Keep in sync!
    children: (
      | Field<StateKeys>
      | ControlField<any, StateKeys>
      | LayoutField<StateKeys>
      | ButtonField<StateKeys>
    )[];
  },
  never,
  StateKeys
>;

// TODO: when updating, update LayoutField['children'] too!
export type FormField<StateKeys extends UiState = never> =
  | Field<StateKeys>
  | ControlField<any, StateKeys>
  | LayoutField<StateKeys>
  | ButtonField<StateKeys>;

// --------------------------------
//
// Type guards
//
// --------------------------------

export const isField = (field: FormField): field is Field =>
  field.kind === 'field';

export const isButtonField = (field: FormField): field is ButtonField =>
  field.kind === 'button';

export const isControlField = (field: FormField): field is ControlField<any> =>
  field.kind === 'control';

export const isLayoutField = (field: FormField): field is LayoutField =>
  field.kind === 'layout';

// --------------------------------
//
// Schema
//
// --------------------------------

const InWhenSchema = z.union([
  z.object({
    in: z.array(z.string()),
  }),
  z.object({
    when: z.string(),
  }),
]);

const InWhenBoolSchema = z.union([
  z.boolean(),
  z.object({
    in: z.array(z.string()),
  }),
  z.object({
    when: z.string(),
  }),
]);

const ExcludeSchema = z.union([
  z.object({
    from: z.array(z.string()),
  }),
  z.object({
    when: z.string(),
  }),
]);

const OnSchema = z.looseObject({
  load: z.optional(z.string()),
  click: z.optional(z.string()),
  change: z.optional(z.string()),
});

// TODO: add types z.ZodMiniType<Field>
const FieldSchema = z.looseObject({
  kind: z.literal('field'),
  uid: z.pipe(
    z.optional(z.string()),
    z.transform((s) => s || crypto.randomUUID()),
  ),
  widget: z.string(),
  include: z.optional(InWhenSchema),
  exclude: z.optional(ExcludeSchema),
  required: z.optional(InWhenBoolSchema),
  enabled: z.optional(InWhenBoolSchema),
  on: z.optional(OnSchema),
});

export const ButtonFieldSchema = z.extend(FieldSchema, {
  kind: z.literal('button'),
  label: z.optional(z.string()),
  on: z.optional(OnSchema),
});

export const ControlFieldSchema = <S extends z.ZodMiniType>(
  defaultValueSchema: S,
) =>
  z.pipe(
    z.extend(FieldSchema, {
      kind: z.literal('control'),
      path: z.string(),
      label: z.optional(z.string()),
      defaultValue: z.optional(defaultValueSchema),
    }),
    z.transform((ctrl) => ({ ...ctrl, uid: `${ctrl.path}-${ctrl.widget}` })),
  );

export const StringControlFieldSchema = ControlFieldSchema(z.string());
export const NumberControlFieldSchema = ControlFieldSchema(z.number());
export const BooleanControlFieldSchema = ControlFieldSchema(z.boolean());

export const LayoutFieldSchema = z.extend(FieldSchema, {
  kind: z.literal('layout'),
  children: z.lazy(() => z.array(AllFieldSchema)),
});

const AllFieldSchema: z.ZodMiniType = z.union([
  LayoutFieldSchema,
  ControlFieldSchema(z.any()),
  FieldSchema,
  ButtonFieldSchema,
]);

// --------------------------------
//
// Factory
//
// --------------------------------

export const stack = (children: FormField[]): LayoutField => ({
  uid: '',
  widget: 'stack',
  kind: 'layout',
  children,
});
