import {
  FormContext,
  type FormPluginContext,
  identityTranslator,
  type InputWidget,
  type ValidatorFn,
  type ValueSchemaResolver,
  type WidgetValueSchema,
} from '@golemui/core';
import type {
  ModelContextLike,
  ModelContextRegisterOptions,
  ModelContextTool,
} from '../types';

/**
 * Spec support: a real `FormContext` driven through the public API, a hand-written value
 * schema resolver standing in for a widget set, and a fake model context that records what
 * gets registered.
 */

// -----------------------------------------------------------------------------
// Validators: JSON-Schema-shaped objects, like the gui ones
// -----------------------------------------------------------------------------

type TestValidator = {
  type?: string;
  required?: boolean;
  minLength?: number;
  minimum?: number;
  enum?: unknown[];
};

// Typed through core's ValidatorFn so the harness needs no dependency of its own on the
// Standard Schema package (it is not a spec file, so the lint dependency check counts it).
export const validators: ValidatorFn<TestValidator> = (validator) =>
  ({
    '~standard': {
      version: 1,
      vendor: 'webmcp-spec',
      validate: (value: unknown) => {
        const isEmpty = value === undefined || value === null || value === '';
        if (validator?.required && isEmpty) {
          return { issues: [{ message: 'required' }] };
        }
        if (
          !isEmpty &&
          validator?.minLength !== undefined &&
          String(value).length < validator.minLength
        ) {
          return { issues: [{ message: `at least ${validator.minLength} characters` }] };
        }
        if (!isEmpty && validator?.minimum !== undefined && Number(value) < validator.minimum) {
          return { issues: [{ message: `at least ${validator.minimum}` }] };
        }
        return { value };
      },
    },
  }) as ReturnType<ValidatorFn<TestValidator>>;

// -----------------------------------------------------------------------------
// A widget set: the value shapes of a few widget types
// -----------------------------------------------------------------------------

const KEYWORDS = ['minLength', 'maxLength', 'minimum', 'maximum', 'enum', 'const', 'format'];

export const testValueSchemas: ValueSchemaResolver = {
  valueSchema(widget: InputWidget<any, string>): WidgetValueSchema | undefined {
    const props = (widget.props ?? {}) as Record<string, unknown>;
    switch (widget.type) {
      case 'textinput':
        return { schema: { type: 'string' }, description: props['hint'] as string | undefined };
      case 'password':
        return { schema: { type: 'string' }, sensitive: true };
      case 'number':
        return { schema: { type: 'number' } };
      case 'checkbox':
        return { schema: { type: 'boolean' } };
      case 'tags':
        return { schema: { type: 'array', items: { type: 'string' } } };
      case 'select': {
        const options = props['options'];
        return {
          schema: { type: ['string', 'number'] },
          choices: Array.isArray(options) ? (options as WidgetValueSchema['choices']) : undefined,
        };
      }
      case 'multiSelect': {
        const options = props['options'];
        return {
          schema: { type: 'array', items: { type: ['string', 'number'] } },
          choices: Array.isArray(options) ? (options as WidgetValueSchema['choices']) : undefined,
        };
      }
      case 'fileUpload':
        return { schema: { type: 'object' }, writable: false };
      case 'repeater':
        return { schema: { type: 'array', items: { type: 'object' } } };
      default:
        return undefined;
    }
  },
  validatorSchema(validator: unknown) {
    if (validator === null || typeof validator !== 'object') {
      return undefined;
    }
    const source = validator as Record<string, unknown>;
    const schema: Record<string, unknown> = {};
    if (typeof source['type'] === 'string' && source['type'] !== 'custom') {
      schema['type'] = source['type'];
    }
    for (const keyword of KEYWORDS) {
      if (source[keyword] !== undefined) {
        schema[keyword] = source[keyword];
      }
    }
    return { schema, required: source['required'] === true };
  },
};

// -----------------------------------------------------------------------------
// The fake model context
// -----------------------------------------------------------------------------

export type Registration = {
  tool: ModelContextTool;
  options: ModelContextRegisterOptions | undefined;
};

export type FakeModelContext = ModelContextLike & {
  /** The tools registered right now, by name. */
  tools: Map<string, Registration>;
  /** Every registration ever made, in order. */
  history: Registration[];
  /** Runs a registered tool the way the browser would: a JSON round trip on both sides. */
  execute(name: string, input?: unknown): Promise<unknown>;
};

/**
 * @param behaviour.legacy - Emulates a preview that predates the `signal` option: the signal is
 *   ignored and `unregisterTool` exists.
 * @param behaviour.rejectNames - Names whose registration rejects, like a duplicate would.
 */
export function createFakeModelContext(
  behaviour: { legacy?: boolean; rejectNames?: string[] } = {},
): FakeModelContext {
  const tools = new Map<string, Registration>();
  const history: Registration[] = [];

  const fake: FakeModelContext = {
    tools,
    history,
    async registerTool(tool, options) {
      if (behaviour.rejectNames?.includes(tool.name)) {
        throw new DOMException(`Tool "${tool.name}" rejected`, 'InvalidStateError');
      }
      if (tools.has(tool.name)) {
        throw new DOMException(`Tool "${tool.name}" already registered`, 'InvalidStateError');
      }
      const registration = { tool, options };
      tools.set(tool.name, registration);
      history.push(registration);
      if (!behaviour.legacy) {
        options?.signal?.addEventListener('abort', () => {
          if (tools.get(tool.name) === registration) {
            tools.delete(tool.name);
          }
        });
      }
    },
    async execute(name, input = {}) {
      const registration = tools.get(name);
      if (registration === undefined) {
        throw new DOMException(`No tool "${name}"`, 'NotFoundError');
      }
      const result = await registration.tool.execute(JSON.parse(JSON.stringify(input)), {
        signal: new AbortController().signal,
      });
      return JSON.parse(JSON.stringify(result));
    },
  };
  if (behaviour.legacy) {
    fake.unregisterTool = (name: string) => {
      tools.delete(name);
    };
  }
  return fake;
}

// -----------------------------------------------------------------------------
// A live form
// -----------------------------------------------------------------------------

export type Harness = {
  context: FormContext<unknown>;
  /** The plugin context a plugin attached to this form receives. */
  pluginContext: FormPluginContext;
};

/**
 * A form initialized through the public API, with the initial data and meta dispatched (so the
 * first derive has run) and one probe plugin attached to capture the plugin context.
 */
export function createHarness(
  formDef: Record<string, unknown>,
  data: Record<string, unknown> = {},
  options: { valueSchemas?: ValueSchemaResolver | null; lang?: string } = {},
): Harness {
  const context = new FormContext<unknown>();
  context.initialize(
    {} as never,
    [],
    validators as ValidatorFn<any>,
    'eager',
    {},
    identityTranslator(options.lang ?? 'en-US'),
    {},
    {},
    options.valueSchemas === null ? undefined : (options.valueSchemas ?? testValueSchemas),
  );
  context.store.dispatch({ type: 'INITIALIZE', payload: { formName: 'spec-form', formDef } });
  context.store.dispatch({ type: 'SET_DATA', payload: { data } });
  context.store.dispatch({ type: 'SET_META', payload: { meta: {} } });

  let pluginContext: FormPluginContext | undefined;
  context.attachPlugins([
    (captured) => {
      pluginContext = captured;
    },
  ]);
  return { context, pluginContext: pluginContext as FormPluginContext };
}

/** A representative form: nested paths, a required field, choices, a hidden field, a repeater. */
export const signupForm = {
  states: { register: '$form.registerMode === true' },
  form: [
    {
      kind: 'input',
      type: 'textinput',
      path: 'user.email',
      label: 'Email',
      props: { hint: 'Your work email' },
      validator: { type: 'string', required: true, format: 'email' },
    },
    {
      kind: 'input',
      type: 'password',
      path: 'user.password',
      label: 'Password',
      validator: { type: 'string', required: true, minLength: 8 },
    },
    {
      kind: 'input',
      type: 'select',
      path: 'plan',
      label: { key: 'labels.plan', default: 'Plan' },
      props: {
        options: [
          { label: 'Free', value: 'free' },
          { label: 'Team plan', value: 'team' },
        ],
      },
      validator: { type: 'string', required: true },
      on: { change: 'planChanged' },
    },
    { kind: 'input', type: 'number', path: 'seats', label: 'Seats', validator: { type: 'number', minimum: 1 } },
    { kind: 'input', type: 'checkbox', path: 'registerMode', label: 'Register' },
    {
      kind: 'input',
      type: 'textinput',
      path: 'company',
      label: 'Company',
      include: { in: ['register'] },
    },
    { kind: 'input', type: 'tags', path: 'interests', label: 'Interests' },
    { kind: 'input', type: 'fileUpload', path: 'avatar', label: 'Avatar' },
    {
      kind: 'input',
      type: 'repeater',
      path: 'members',
      label: 'Members',
      props: {
        template: {
          kind: 'layout',
          type: 'flex',
          children: [
            { kind: 'input', type: 'textinput', path: 'members.items.name', label: 'Name', validator: { type: 'string', required: true } },
            { kind: 'input', type: 'number', path: 'members.items.age', label: 'Age' },
          ],
        },
      },
    },
    { kind: 'action', type: 'button', actionType: 'submit', label: 'Sign up' },
  ],
};
