import * as z from 'zod/mini';
import { JsonPath, ReactiveExpression, UiState } from './shared';
import { AllSuffixable, SomeSuffixable } from './utils/suffixable';

// --------------------------------
//
// Types
//
// --------------------------------

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

type On = AllSuffixable<{
  load?: EventExpression;
  click?: EventExpression;
  change?: EventExpression;
  //[k: string]: any;
}>;

export type BaseField = {
  //kind: 'field' | 'button' | 'control' | 'layout';
  uid: string;
  widget: FieldWidget;
  enabled?: boolean | { when: ReactiveExpression };
  required?: boolean | { when: ReactiveExpression };
  include?: { in: UiState[] } | { when: ReactiveExpression };
  exclude?: { from: UiState[] } | { when: ReactiveExpression };
  //[k: string]: any;
};

export type Field = SomeSuffixable<
  BaseField & { kind: 'field' },
  'enabled' | 'required'
>;

export type ButtonField = SomeSuffixable<
  BaseField & { kind: 'button'; label: string; on?: On },
  'enabled' | 'required' | 'label'
>;

export type ControlField<T> = SomeSuffixable<
  BaseField & {
    kind: 'control';
    path: JsonPath;
    label?: ReactiveExpression | string;
    on?: On;
    defaultValue?: T;
    validators?: Record<string, any>;
  },
  'enabled' | 'required' | 'label' | 'validators'
>;

export type LayoutField = SomeSuffixable<
  BaseField & { kind: 'layout'; children: FormField[] },
  'enabled' | 'required'
>;

export type FormField = Field | ControlField<any> | LayoutField | ButtonField;

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
    z.transform((s) => s || crypto.randomUUID())
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
  defaultValueSchema: S
) =>
  z.pipe(
    z.extend(FieldSchema, {
      kind: z.literal('control'),
      path: z.string(),
      label: z.optional(z.string()),
      defaultValue: z.optional(defaultValueSchema),
    }),
    z.transform((ctrl) => ({ ...ctrl, uid: `${ctrl.path}-${ctrl.widget}` }))
  );

export const StringControlFieldSchema = ControlFieldSchema(z.string());
export const NumberControlFieldSchema = ControlFieldSchema(z.number());
export const BooleanControlFieldSchema = ControlFieldSchema(z.boolean());

export const LayoutFieldSchema = z.extend(FieldSchema, {
  kind: z.literal('layout'),
  children: z.array(z.lazy(() => AllFieldSchema)),
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
