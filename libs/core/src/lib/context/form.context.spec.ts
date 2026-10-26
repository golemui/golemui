import { describe, expect, it } from 'vitest';
import { type ValidatorFn } from '../form-validator';
import { type FormEvent, type FormSubmitEvent } from '../shared';
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

type EventWidget = Parameters<FormContext<unknown>['emitEvent']>[1];
type EventType = Parameters<FormContext<unknown>['emitEvent']>[0];

/** Creates a form from a definition and data, and records every form event it sends. */
function createForm(formDef: Record<string, any>, data: Record<string, any>) {
  const context = new FormContext<unknown>();
  context.initialize({}, [], acceptEveryValue, 'eager', {}, undefined, {});
  context.store.dispatch({ type: 'INITIALIZE', payload: { formName: 'test', formDef } });
  context.store.dispatch({ type: 'SET_DATA', payload: { data } });

  const events: FormEvent[] = [];
  context.events$.subscribe((event) => events.push(event));

  // Adapters emit with the node they render: a layout passes its children from `resolvedSources`
  // (`stampedChildren` in view-model.ts), not the calculated widget.
  const emitFrom = (eventType: EventType, uid: string) => {
    const widget = context.store.getState().resolvedSources[uid];
    if (widget === undefined) {
      throw new Error(`The form has no widget "${uid}"`);
    }
    context.emitEvent(eventType, widget as EventWidget);
  };

  return { context, events, emitFrom };
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
});
