import { describe, expect, it } from 'vitest';
import { type ValidatorFn } from '../form-validator';
import { type ActionWidget, type InputWidget } from '../form-widget';
import { type FormEvent, type FormSubmitEvent } from '../shared';
import { type Action } from '../store/actions';
import { type Middleware, type State } from '../store/model';
import { FormContext } from './form.context';

/**
 * Runs `FormContext` without a framework. The store builds every widget on `SET_DATA`, so a test
 * emits from the same widget objects the adapters render.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/context/form.context.spec.ts
 */

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

const acceptEveryValue: ValidatorFn<unknown> = () => ({
  '~standard': { version: 1, vendor: 'test', validate: (value) => ({ value }) },
});

/** Fails an empty value when the validator descriptor has `required: true`. */
const requiredValidators: ValidatorFn<{ required?: boolean }> = (validator) => ({
  '~standard': {
    version: 1,
    vendor: 'test',
    validate: (value) => {
      const isEmpty = value === undefined || value === null || value === '';
      return validator?.required && isEmpty ? { issues: [{ message: 'required' }] } : { value };
    },
  },
});

type EventWidget = Parameters<FormContext<unknown>['emitEvent']>[1];
type EventType = Parameters<FormContext<unknown>['emitEvent']>[0];

/**
 * Creates a form from a definition and data. It records every form event it sends, and every
 * action that reaches the store after the form is set up.
 */
function createForm(
  formDef: Record<string, any>,
  data: Record<string, any>,
  validators: ValidatorFn<{ required?: boolean }> = acceptEveryValue,
) {
  const actions: Action[] = [];
  const recordActions: Middleware<State, Action> = () => (next) => (action) => {
    actions.push(action);
    next(action);
  };

  const context = new FormContext<unknown>();
  context.initialize({}, [recordActions], validators, 'eager', {}, undefined, {});
  context.store.dispatch({ type: 'INITIALIZE', payload: { formName: 'test', formDef } });
  context.store.dispatch({ type: 'SET_DATA', payload: { data } });
  actions.length = 0;

  const events: FormEvent[] = [];
  context.events$.subscribe((event) => events.push(event));

  // Adapters emit with the node they render: a layout passes its children from `resolvedSources`
  // (`stampedChildren` in view-model.ts), not the calculated widget.
  const emitFrom = (eventType: EventType, uid: string, detail?: unknown) => {
    const widget = context.store.getState().resolvedSources[uid];
    if (widget === undefined) {
      throw new Error(`The form has no widget "${uid}"`);
    }
    context.emitEvent(eventType, widget as EventWidget, detail);
  };

  return { context, events, actions, emitFrom };
}

const button = (uid: string, on: Record<string, string>) => ({
  uid,
  kind: 'action',
  type: 'button',
  label: uid,
  on,
});

/** A `users` repeater. Each row has a name input and a menu button. */
const makeUsersFormDef = (rowChildren: unknown[] = []) => ({
  form: [
    button('save', { click: 'saveClicked' }),
    {
      uid: 'users',
      kind: 'input',
      type: 'repeater',
      path: 'users',
      props: {
        template: {
          uid: 'userRow',
          kind: 'layout',
          type: 'grid',
          on: { change: 'userRowChanged' },
          children: [
            { uid: 'name', kind: 'input', type: 'textinput', path: 'users.items.name' },
            button('userMenu', { click: 'userMenuClicked' }),
            ...rowChildren,
          ],
        },
      },
    },
  ],
});

const threeUsers = () => ({ users: [{ name: 'Ada' }, { name: 'Linus' }, { name: 'Grace' }] });

/** A `teams` repeater. Each team row has a `devs` repeater, and each dev row has a menu button. */
const makeTeamsFormDef = () => ({
  form: [
    {
      uid: 'teams',
      kind: 'input',
      type: 'repeater',
      path: 'teams',
      props: {
        template: {
          uid: 'teamRow',
          kind: 'layout',
          type: 'grid',
          children: [
            {
              uid: 'devs',
              kind: 'input',
              type: 'repeater',
              path: 'teams.items.devs',
              on: { change: 'devsChanged' },
              props: {
                template: {
                  uid: 'devRow',
                  kind: 'layout',
                  type: 'grid',
                  children: [button('devMenu', { click: 'devMenuClicked' })],
                },
              },
            },
          ],
        },
      },
    },
  ],
});

const threeTeams = () => ({ teams: [{ devs: [{}] }, { devs: [{}] }, { devs: [{}, {}] }] });

// -----------------------------------------------------------------------------
// Specs
// -----------------------------------------------------------------------------

describe('FormContext.emitEvent', () => {
  describe('row', () => {
    it('should not add a row key for a widget outside a repeater', () => {
      const { events, emitFrom } = createForm(makeUsersFormDef(), threeUsers());

      emitFrom('click', 'save');

      expect(events).toHaveLength(1);
      expect(events[0].name).toBe('saveClicked');
      expect(events[0]).not.toHaveProperty('row');
    });

    it('should add the row of a widget in a flat repeater', () => {
      const { events, emitFrom } = createForm(makeUsersFormDef(), threeUsers());

      emitFrom('click', 'userMenu[1]');

      expect(events[0].name).toBe('userMenuClicked');
      expect(events[0].row).toEqual({ index: 1, indexes: [1], path: 'users.1' });
    });

    it('should add the innermost row and every index of a widget in a nested repeater', () => {
      const { events, emitFrom } = createForm(makeTeamsFormDef(), threeTeams());

      emitFrom('click', 'devMenu[2][1]');

      expect(events[0].row).toEqual({ index: 1, indexes: [2, 1], path: 'teams.2.devs.1' });
    });

    it('should add the outer row for a nested repeater widget', () => {
      const { events, emitFrom } = createForm(makeTeamsFormDef(), threeTeams());

      emitFrom('change', 'devs[2]');

      expect(events[0].name).toBe('devsChanged');
      expect(events[0].row).toEqual({ index: 2, indexes: [2], path: 'teams.2' });
    });

    it('should add the row for the layout widget of a row', () => {
      const { events, emitFrom } = createForm(makeUsersFormDef(), threeUsers());

      emitFrom('change', 'userRow[2]');

      expect(events[0].name).toBe('userRowChanged');
      expect(events[0].row).toEqual({ index: 2, indexes: [2], path: 'users.2' });
    });

    it('should add the row for a handler with a state suffix', () => {
      const formDef = {
        states: { editing: "$form.mode === 'edit'" },
        ...makeUsersFormDef([
          button('editMenu', { click: 'editMenuClicked', 'click.editing': 'editMenuEditClicked' }),
        ]),
      };
      const { events, emitFrom } = createForm(formDef, { mode: 'edit', ...threeUsers() });

      emitFrom('click', 'editMenu[1]');

      expect(events[0].name).toBe('editMenuEditClicked');
      expect(events[0].row).toEqual({ index: 1, indexes: [1], path: 'users.1' });
    });

    it('should read the row and the data from the same state', () => {
      const { context, events, emitFrom } = createForm(makeUsersFormDef(), threeUsers());
      // Removing the first row moves Linus to row 0.
      context.store.dispatch({
        type: 'SET_DATA',
        payload: { data: { users: [{ name: 'Linus' }, { name: 'Grace' }] } },
      });

      emitFrom('click', 'userMenu[0]');

      const { row, data } = events[0];
      expect(row).toEqual({ index: 0, indexes: [0], path: 'users.0' });
      // Index 0 of the event data is the same user.
      expect(data['users'][0]).toEqual({ name: 'Linus' });
    });
  });

  describe('handlers with a state suffix', () => {
    const makeStatesFormDef = (states: Record<string, string>) => ({
      states,
      form: [button('save', { click: 'base', 'click.a': 'onA', 'click.bb': 'onBB' })],
    });

    it('sends one event per active state that has a handler, in the order of the active states', () => {
      const { context, events, emitFrom } = createForm(
        makeStatesFormDef({ a: 'true', bb: 'true' }),
        {},
      );

      emitFrom('click', 'save');

      expect(events.map((event) => event.name)).toEqual(['onA', 'onBB']);
      // The calculated widget holds the handler of the longest state name only.
      // An event is still sent for every active state that has a handler.
      const calculated = context.store.getState().calculatedWidgets['save']
        .current as ActionWidget<string>;
      expect(calculated.on?.click).toBe('onBB');
    });

    it('follows the order of the declared states, not the length of their names', () => {
      const { events, emitFrom } = createForm(makeStatesFormDef({ bb: 'true', a: 'true' }), {});

      emitFrom('click', 'save');

      expect(events.map((event) => event.name)).toEqual(['onBB', 'onA']);
    });

    it('sends only the handlers of the states that are active', () => {
      const { events, emitFrom } = createForm(makeStatesFormDef({ a: 'true', bb: 'false' }), {});

      emitFrom('click', 'save');

      expect(events.map((event) => event.name)).toEqual(['onA']);
    });

    it('sends the base handler when no active state has a handler for the event', () => {
      const { events, emitFrom } = createForm(makeStatesFormDef({ other: 'true' }), {});

      emitFrom('click', 'save');

      expect(events.map((event) => event.name)).toEqual(['base']);
    });

    it('sends the base handler when no state is active', () => {
      const { events, emitFrom } = createForm(makeStatesFormDef({ a: 'false' }), {});

      emitFrom('click', 'save');

      expect(events.map((event) => event.name)).toEqual(['base']);
    });

    it('sends no event for an event type the widget has no handler for', () => {
      const { events, emitFrom } = createForm(makeStatesFormDef({ a: 'true' }), {});

      emitFrom('blur', 'save');

      expect(events).toEqual([]);
      // The same widget sends an event for a handler it has.
      emitFrom('click', 'save');
      expect(events).toHaveLength(1);
    });
  });

  describe('validation actions', () => {
    const formDef = {
      form: [
        {
          uid: 'name',
          kind: 'input',
          type: 'textinput',
          path: 'profile.name',
          on: {
            change: 'nameChanged',
            blur: 'nameBlurred',
            filter: 'nameFiltered',
            load: 'loaded',
          },
        },
        { uid: 'noHandlers', kind: 'input', type: 'textinput', path: 'nickname' },
        {
          uid: 'send',
          kind: 'action',
          type: 'button',
          actionType: 'submit',
          on: { click: 'sendClicked' },
        },
        {
          uid: 'cancel',
          kind: 'action',
          type: 'button',
          actionType: 'button',
          on: { click: 'cancelClicked' },
        },
        {
          uid: 'group',
          kind: 'layout',
          type: 'grid',
          on: { change: 'groupChanged' },
          children: [{ uid: 'inGroup', kind: 'input', type: 'textinput', path: 'inGroup' }],
        },
      ],
    };

    it('validates the input on change, with the reason and the path of the widget', () => {
      const { events, actions, emitFrom } = createForm(formDef, {});

      emitFrom('change', 'name');

      expect(events.map((event) => event.name)).toEqual(['nameChanged']);
      expect(actions).toEqual([
        {
          type: 'ATTEMPT_VALIDATION',
          payload: { reason: 'change', path: 'profile.name', uid: 'name' },
        },
      ]);
    });

    it('validates the input on change when the input has no change handler', () => {
      const { events, actions, emitFrom } = createForm(formDef, {});

      emitFrom('change', 'noHandlers');

      expect(events).toEqual([]);
      expect(actions).toEqual([
        {
          type: 'ATTEMPT_VALIDATION',
          payload: { reason: 'change', path: 'nickname', uid: 'noHandlers' },
        },
      ]);
    });

    it('validates the whole form on a click of a submit button', () => {
      const { events, actions, emitFrom } = createForm(formDef, {});

      emitFrom('click', 'send');

      expect(events.map((event) => event.name)).toEqual(['sendClicked']);
      expect(actions).toEqual([{ type: 'VALIDATE_ALL' }]);
    });

    it('does not validate on a click of a button that is not a submit button', () => {
      const { events, actions, emitFrom } = createForm(formDef, {});

      emitFrom('click', 'cancel');

      expect(events.map((event) => event.name)).toEqual(['cancelClicked']);
      expect(actions).toEqual([]);
    });

    it('does not validate on a change of a layout', () => {
      const { events, actions, emitFrom } = createForm(formDef, {});

      emitFrom('change', 'group');

      expect(events.map((event) => event.name)).toEqual(['groupChanged']);
      expect(actions).toEqual([]);
    });

    it.each(['blur', 'filter', 'load'] as const)('does not validate on %s of an input', (type) => {
      const { events, actions, emitFrom } = createForm(formDef, {});

      emitFrom(type, 'name', type === 'filter' ? 'Ad' : undefined);

      expect(events).toHaveLength(1);
      expect(actions).toEqual([]);
    });

    it('sends the filter text as the detail of the event', () => {
      const { events, emitFrom } = createForm(formDef, {});

      emitFrom('filter', 'name', 'Ad');

      expect(events[0].name).toBe('nameFiltered');
      expect(events[0].detail).toBe('Ad');
    });
  });

  describe('event data and callback', () => {
    const formDef = {
      states: { vip: '$form.vip === true' },
      form: [
        { uid: 'name', kind: 'input', type: 'textinput', path: 'name', on: { change: 'changed' } },
        {
          uid: 'secret',
          kind: 'input',
          type: 'textinput',
          path: 'secret',
          include: { in: ['vip'] },
        },
      ],
    };

    it('removes the value of a hidden input from the data of the event', () => {
      const { events, emitFrom } = createForm(formDef, { vip: false, name: 'Ada', secret: 'x' });

      emitFrom('change', 'name');

      expect(events[0].data).toEqual({ vip: false, name: 'Ada' });
    });

    it('keeps the value of an input that is visible in the data of the event', () => {
      const { events, emitFrom } = createForm(formDef, { vip: true, name: 'Ada', secret: 'x' });

      emitFrom('change', 'name');

      expect(events[0].data).toEqual({ vip: true, name: 'Ada', secret: 'x' });
    });

    it('sends an undefined detail when the caller gives none', () => {
      const { events, emitFrom } = createForm(formDef, {});

      emitFrom('change', 'name');

      expect(events[0].detail).toBeUndefined();
    });

    it('dispatches a widget prop override from the callback', () => {
      const { context, events, emitFrom } = createForm(formDef, {});
      emitFrom('change', 'name');

      events[0].callback({
        type: 'OVERRIDE_WIDGET_PROP',
        payload: { uid: 'name', prop: 'placeholder', value: 'Your name' },
      });

      const state = context.store.getState();
      expect(state.widgetPropOverrides['name']).toEqual({ placeholder: 'Your name' });
      const calculated = state.calculatedWidgets['name'].current as InputWidget<any, string>;
      expect(calculated.props?.['placeholder']).toBe('Your name');
    });

    it('dispatches validation issues from the callback', () => {
      const { context, events, emitFrom } = createForm(formDef, {});
      emitFrom('change', 'name');

      events[0].callback({
        type: 'INJECT_VALIDATION_ISSUES',
        payload: { path: 'name', issues: ['taken'] },
      });

      expect(context.store.getState().injectedValidations['name']).toEqual(['taken']);
    });
  });
});

describe('FormContext.emitSubmitEvent', () => {
  it('should not add a row key to the submit event', () => {
    const { context } = createForm(makeUsersFormDef(), threeUsers());
    const submitEvents: FormSubmitEvent[] = [];
    context.submit$.subscribe((event) => submitEvents.push(event));

    context.emitSubmitEvent();

    expect(submitEvents).toHaveLength(1);
    expect(submitEvents[0]).not.toHaveProperty('row');
  });

  describe('data and validity', () => {
    const formDef = {
      states: { vip: '$form.vip === true' },
      form: [
        {
          uid: 'name',
          kind: 'input',
          type: 'textinput',
          path: 'name',
          validator: { required: true },
        },
        {
          uid: 'secret',
          kind: 'input',
          type: 'textinput',
          path: 'secret',
          include: { in: ['vip'] },
        },
      ],
    };

    const collectSubmits = (context: FormContext<unknown>) => {
      const submitEvents: FormSubmitEvent[] = [];
      context.submit$.subscribe((event) => submitEvents.push(event));
      return submitEvents;
    };

    it('sends no submit event while the form is invalid, and sends one when it is valid', () => {
      const { context } = createForm(formDef, { vip: false }, requiredValidators);
      const submitEvents = collectSubmits(context);

      context.emitSubmitEvent();

      expect(submitEvents).toEqual([]);
      expect(context.store.getState().isFormValid).toBe(false);

      context.store.dispatch({ type: 'SET_DATA', payload: { data: { vip: false, name: 'Ada' } } });
      context.emitSubmitEvent();

      expect(submitEvents).toHaveLength(1);
    });

    it('removes the value of a hidden input from the submitted data', () => {
      const { context } = createForm(
        formDef,
        { vip: false, name: 'Ada', secret: 'x' },
        requiredValidators,
      );
      const submitEvents = collectSubmits(context);

      context.emitSubmitEvent();

      expect(submitEvents[0].data).toEqual({ vip: false, name: 'Ada' });
    });

    it('keeps the value of a visible input in the submitted data', () => {
      const { context } = createForm(
        formDef,
        { vip: true, name: 'Ada', secret: 'x' },
        requiredValidators,
      );
      const submitEvents = collectSubmits(context);

      context.emitSubmitEvent();

      expect(submitEvents[0].data).toEqual({ vip: true, name: 'Ada', secret: 'x' });
    });

    it('dispatches validation issues from the callback of the submit event', () => {
      const { context } = createForm(formDef, { vip: false, name: 'Ada' }, requiredValidators);
      const submitEvents = collectSubmits(context);
      context.emitSubmitEvent();

      submitEvents[0].callback({
        type: 'INJECT_VALIDATION_ISSUES',
        payload: { path: 'name', issues: ['taken'] },
      });

      expect(context.store.getState().injectedValidations['name']).toEqual(['taken']);
    });
  });
});

describe('FormContext.initialize', () => {
  const formDef = {
    form: [
      {
        uid: 'title',
        kind: 'display',
        type: 'heading',
        include: { when: "$form.name.startsWith('A')" },
      },
    ],
  };

  const stateWithPolicy = (expressionPolicy?: 'warn' | 'strict') => {
    const context = new FormContext<unknown>();
    context.initialize({}, [], acceptEveryValue, 'eager', {}, undefined, {}, {}, expressionPolicy);
    context.store.dispatch({ type: 'INITIALIZE', payload: { formName: 'test', formDef } });
    context.store.dispatch({ type: 'SET_DATA', payload: { data: { name: 'Ada' } } });
    return context.store.getState();
  };

  it.each([undefined, 'warn' as const])(
    'runs a method outside the allowed list with the %s expression policy',
    (expressionPolicy) => {
      const state = stateWithPolicy(expressionPolicy);

      expect(state.formHealth).toEqual({ status: 'ok' });
      expect(state.widgetFlags['title']).toEqual({ hidden: false });
    },
  );

  it('fails a method outside the allowed list with the strict expression policy', () => {
    const state = stateWithPolicy('strict');

    expect(state.formHealth.status).toBe('errored');
    if (state.formHealth.status === 'errored') {
      expect(state.formHealth.code).toBe(50);
    }
  });

  describe('defaults', () => {
    it('uses a translator that returns the translation key', () => {
      const context = new FormContext<unknown>();
      context.initialize({}, [], acceptEveryValue, 'eager', {}, undefined, {});

      expect(context.localization.translate('some.key')).toBe('some.key');
    });

    it('uses no host functions when none are given', () => {
      const context = new FormContext<unknown>();
      context.initialize({}, [], acceptEveryValue, 'eager', {}, undefined, {});
      context.store.dispatch({
        type: 'INITIALIZE',
        payload: {
          formName: 'test',
          formDef: { states: { adult: '$fn.isAdult($form.age)', always: 'true' }, form: [] },
        },
      });
      context.store.dispatch({ type: 'SET_DATA', payload: { data: { age: 30 } } });

      const state = context.store.getState();

      expect(state.currentStates).toEqual(['always']);
      expect(state.formHealth).toEqual({ status: 'ok' });
    });

    it('calls the host functions that are given', () => {
      const context = new FormContext<unknown>();
      context.initialize(
        {},
        [],
        acceptEveryValue,
        'eager',
        {},
        undefined,
        {},
        { isAdult: (age: number) => age >= 18 },
      );
      context.store.dispatch({
        type: 'INITIALIZE',
        payload: {
          formName: 'test',
          formDef: { states: { adult: '$fn.isAdult($form.age)' }, form: [] },
        },
      });
      context.store.dispatch({ type: 'SET_DATA', payload: { data: { age: 30 } } });

      expect(context.store.getState().currentStates).toEqual(['adult']);
    });
  });
});
