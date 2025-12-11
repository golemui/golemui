import * as jd from 'ts.data.json';
import { DotPath, ReactiveExpression, Uid, UiState } from './shared';
import { shortUUID } from './utils/random';
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

const onDecoder = jd.object(
  {
    load: jd.optional(jd.string()),
    click: jd.optional(jd.string()),
    change: jd.optional(jd.string()),
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

const interactiveFieldDecoder = jd.object<InteractiveField<string>>(
  {
    kind: jd.literal('interactive'),
    uid: uidDecoder,
    widget: jd.string(),
    include: jd.optional(includeDecoder),
    exclude: jd.optional(excludeDecoder),
    disabled: jd.optional(boolWhenDecoder),
    readonly: jd.optional(boolWhenDecoder),
    label: jd.string(),
    on: jd.optional(onDecoder),
    props: jd.optional(jd.succeed()),
  },
  'InteractiveField',
);

const controlFieldDecoder = jd
  .object<ControlField<any, string>>(
    {
      kind: jd.literal('control'),
      uid: uidDecoder,
      widget: jd.string(),
      include: jd.optional(includeDecoder),
      exclude: jd.optional(excludeDecoder),
      disabled: jd.optional(boolWhenDecoder),
      readonly: jd.optional(boolWhenDecoder),
      on: jd.optional(onDecoder),
      props: jd.optional(jd.succeed()),
      label: jd.optional(jd.string()),
      path: jd.string(),
      defaultValue: jd.optional(jd.succeed()),
      validator: jd.optional(jd.succeed()),
    },
    'ControlField',
  )
  .map((ctrl) => {
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

export const layoutFieldDecoder = jd.lazy(() =>
  jd.object<LayoutField<string>>(
    {
      kind: jd.literal('layout'),
      uid: uidDecoder,
      widget: jd.string(),
      include: jd.optional(includeDecoder),
      exclude: jd.optional(excludeDecoder),
      disabled: jd.optional(boolWhenDecoder),
      readonly: jd.optional(boolWhenDecoder),
      props: jd.optional(jd.succeed()),
      children: jd.array(formFieldDecoder, 'FormField[]'),
    },
    'LayoutField',
  ),
);

type FormFieldDecoder = jd.Decoder<
  DisplayField<string> | InteractiveField<string> | ControlField<any, string> | LayoutField<string>
>;
const formFieldDecoder = jd.lazy(
  (): FormFieldDecoder =>
    jd.oneOf<
      | DisplayField<string>
      | InteractiveField<string>
      | ControlField<any, string>
      | LayoutField<string>
    >(
      [displayFieldDecoder, interactiveFieldDecoder, controlFieldDecoder, layoutFieldDecoder],
      'FormField',
    ),
);
