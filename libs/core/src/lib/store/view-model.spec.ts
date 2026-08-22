import { type StandardSchemaV1 } from '@standard-schema/spec';
import { BehaviorSubject } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { type ValidatorFn } from '../form-validator';
import { type LayoutWidget, type NonFunctionWidget } from '../form-widget';
import { identityTranslator } from '../i18n';
import { type ExpressionFunctions, type ValidateOn } from '../shared';
import { type Action } from './actions';
import { createInitialState, type State } from './model';
import { reducer } from './reducer';
import {
  calculatedLayoutChildrenByUid$,
  calculatedWidgetsByUid$,
  dataByPath$,
  touchedControlsByPath$,
  validationByPath$,
} from './selectors';
import {
  createWidgetViewModelReader,
  widgetViewModel,
  widgetViewModel$,
  type WidgetViewModel,
} from './view-model';

/**
 * Drives the real reducer through real actions (same style as reducer.spec.ts) and asserts the view
 * model built from the resulting states.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/store/view-model.spec.ts
 */

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

/** Minimal validator descriptor: only `required` is supported, enough to make errors observable. */
type TestValidator = { required?: boolean };

const validators: ValidatorFn<TestValidator> = (validator): StandardSchemaV1 => ({
  '~standard': {
    version: 1,
    vendor: 'view-model-spec',
    validate: (value: unknown) => {
      const isEmpty = value === undefined || value === null || value === '';
      if (validator?.required && isEmpty) {
        return { issues: [{ message: 'required' }] };
      }
      return { value };
    },
  },
});

const functions: ExpressionFunctions = {};

const makeReducer = (validateOn: ValidateOn = 'eager') =>
  reducer({
    validators: validators as ValidatorFn<any>,
    validateOn,
    localization: identityTranslator('en-US'),
    functions,
  });

/** Dispatches a sequence of actions from a fresh initial state and returns the final state. */
const drive = (actions: Action[]): State => {
  const reduce = makeReducer();
  return actions.reduce((state, action) => reduce(state, action), createInitialState('en-US'));
};

const init = (formDef: Record<string, any>): Action => ({
  type: 'INITIALIZE',
  payload: { formName: 'view-model-form', formDef },
});

const setData = (data: Record<string, any>): Action => ({
  type: 'SET_DATA',
  payload: { data },
});

const setWidgetData = (path: string, data: unknown): Action => ({
  type: 'SET_WIDGET_DATA',
  payload: { path, data },
});

const setLanguage = (lang: string): Action => ({ type: 'SET_LANGUAGE', payload: { lang } });

const validateAllAction: Action = { type: 'VALIDATE_ALL' };

const injectIssues = (path: string, issues: string[] | null): Action => ({
  type: 'INJECT_VALIDATION_ISSUES',
  payload: { path, issues },
});

/** Reads the first (synchronous) emission of a selector over a single state snapshot. */
const readSelector = <T>(state: State, operator: (state$: BehaviorSubject<State>) => any): T => {
  let emitted: T = undefined as T;
  const subscription = operator(new BehaviorSubject(state)).subscribe((value: T) => {
    emitted = value;
  });
  subscription.unsubscribe();
  return emitted;
};

const uidsOf = (widgets: { uid?: string }[]): (string | undefined)[] =>
  widgets.map((widget) => widget.uid);

// -----------------------------------------------------------------------------
// Fixtures
//
// Each fixture is a factory: `initialize` rewrites the `form` array in place, so a shared object
// would be mutated by the first INITIALIZE and reused in a different shape by the next test.
// -----------------------------------------------------------------------------

/**
 * A layout holding a validated input, a state-gated display and a submit button, next to a repeater
 * whose template holds one input. Authored as plain JSON so it runs the real decoder.
 */
const makeBaseFormDef = () => ({
  states: { adult: '$form.age >= 18' },
  form: [
    {
      uid: 'box',
      kind: 'layout',
      type: 'flex',
      children: [
        {
          uid: 'firstName',
          kind: 'input',
          type: 'textinput',
          path: 'firstName',
          validator: { required: true },
        },
        { uid: 'bio', kind: 'display', type: 'heading', include: { in: ['adult'] } },
        { uid: 'save', kind: 'action', type: 'button', actionType: 'submit' },
      ],
    },
    {
      uid: 'users',
      kind: 'input',
      type: 'repeater',
      path: 'users',
      props: {
        template: {
          uid: 'usersRow',
          kind: 'layout',
          type: 'flex',
          children: [{ uid: 'name', kind: 'input', type: 'textinput', path: 'users.items.name' }],
        },
      },
    },
  ],
});

/** A repeater whose template child interpolates the row through `$item` and `$index`. */
const makeRowScopeFormDef = () => ({
  form: [
    {
      uid: 'lineItems',
      kind: 'input',
      type: 'repeater',
      path: 'lineItems',
      props: {
        template: {
          uid: 'lineItemsRow',
          kind: 'layout',
          type: 'flex',
          children: [
            {
              uid: 'rowTotal',
              kind: 'display',
              type: 'heading',
              props: { text: 'Row {{$index + 1}}: {{$item.quantity}}' },
            },
          ],
        },
      },
    },
  ],
});

/**
 * A repeater whose row prop throws when the row has no `name`. Adding such a row fails the props
 * pass, and the errored state then carries a `users` array longer than `resolvedSources` knows.
 */
const makeThrowingRowPropFormDef = () => ({
  form: [
    {
      uid: 'users',
      kind: 'input',
      type: 'repeater',
      path: 'users',
      props: {
        template: {
          uid: 'usersRow',
          kind: 'layout',
          type: 'flex',
          children: [
            {
              uid: 'greeting',
              kind: 'display',
              type: 'heading',
              props: { text: 'Hi {{$item.name.toUpperCase()}}' },
            },
          ],
        },
      },
    },
  ],
});

/** A repeater inside a repeater template, so row index chains can be asserted. */
const makeNestedRepeaterFormDef = () => ({
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
          type: 'flex',
          children: [
            {
              uid: 'devs',
              kind: 'input',
              type: 'repeater',
              path: 'teams.items.devs',
              props: {
                template: {
                  uid: 'devRow',
                  kind: 'layout',
                  type: 'flex',
                  children: [
                    {
                      uid: 'devName',
                      kind: 'input',
                      type: 'textinput',
                      path: 'teams.items.devs.items.devName',
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    },
  ],
});

// -----------------------------------------------------------------------------
// 1. widgetViewModel
// -----------------------------------------------------------------------------

describe('widgetViewModel', () => {
  it('mirrors the calculated widget and the data value of a visible input', () => {
    const state = drive([init(makeBaseFormDef()), setData({ firstName: 'Joan', users: [] })]);
    const vm = widgetViewModel<string>(state, 'firstName');

    expect(vm.uid).toBe('firstName');
    expect(vm.widget).toBe(state.calculatedWidgets['firstName'].current);
    expect(vm.value).toBe('Joan');
    expect(vm.lang).toBe('en-US');
    expect(vm.hidden).toBe(false);
    expect(vm.children).toEqual([]);
    expect(vm.rows).toEqual([]);
  });

  it('keeps errors empty until the form is touched, then merges schema and injected issues', () => {
    const untouched = drive([init(makeBaseFormDef()), setData({ users: [] })]);
    expect(widgetViewModel(untouched, 'firstName').errors).toEqual([]);
    expect(widgetViewModel(untouched, 'firstName').touched).toBe(false);
    expect(widgetViewModel(untouched, 'save').formInvalid).toBe(false);

    const submitted = drive([init(makeBaseFormDef()), setData({ users: [] }), validateAllAction]);
    expect(widgetViewModel(submitted, 'firstName').errors).toEqual(['required']);
    expect(widgetViewModel(submitted, 'firstName').touched).toBe(true);
    expect(widgetViewModel(submitted, 'save').formInvalid).toBe(true);

    const injected = drive([
      init(makeBaseFormDef()),
      setData({ users: [] }),
      validateAllAction,
      injectIssues('firstName', ['already taken']),
    ]);
    expect(widgetViewModel(injected, 'firstName').errors).toEqual(['required', 'already taken']);
  });

  it('reports a hidden widget as hidden and recovers when it is revealed', () => {
    const reduce = makeReducer();
    let state = drive([init(makeBaseFormDef()), setData({ users: [] })]);

    // `age` is undefined, so the `adult` state is off and `bio` is hidden.
    const hidden = widgetViewModel(state, 'bio');
    expect(hidden.widget).toBeUndefined();
    expect(hidden.hidden).toBe(true);
    expect(hidden.children).toEqual([]);
    expect(hidden.rows).toEqual([]);

    state = reduce(state, setWidgetData('age', 30));
    const revealed = widgetViewModel(state, 'bio');
    expect(revealed.widget).toBe(state.calculatedWidgets['bio'].current);
    expect(revealed.hidden).toBe(false);
  });

  it('returns an empty view model for an unknown uid without throwing', () => {
    const state = drive([init(makeBaseFormDef()), setData({ users: [] })]);
    const vm = widgetViewModel(state, 'does-not-exist');

    expect(vm.widget).toBeUndefined();
    expect(vm.hidden).toBe(false);
    expect(vm.value).toBeUndefined();
    expect(vm.children).toEqual([]);
    expect(vm.rows).toEqual([]);
    expect(vm.errors).toEqual([]);
    expect(vm.touched).toBe(false);
  });

  it('reports the same values as the individual selectors', () => {
    // A submit attempt with the required input empty, so every slice carries a real value.
    const state = drive([init(makeBaseFormDef()), setData({ users: [] }), validateAllAction]);
    const vm = widgetViewModel<string>(state, 'firstName');
    const box = widgetViewModel(state, 'box');

    expect(vm.widget).toBe(readSelector(state, calculatedWidgetsByUid$('firstName')));
    expect(vm.value).toBe(readSelector(state, dataByPath$('firstName')));
    expect(vm.errors).toEqual(readSelector(state, validationByPath$('firstName')));
    expect(vm.touched).toBe(readSelector(state, touchedControlsByPath$('firstName')));
    expect(box.children).toBe(readSelector(state, calculatedLayoutChildrenByUid$('box')));
  });

  describe('layout children', () => {
    it('passes a top-level layout its calculated children by reference', () => {
      const state = drive([init(makeBaseFormDef()), setData({ users: [] })]);
      const vm = widgetViewModel(state, 'box');

      const calculated = state.calculatedWidgets['box'].current as LayoutWidget<string>;
      expect(vm.children).toBe(calculated.children);
      // `bio` is hidden, so the visible children are the input and the button.
      expect(uidsOf(vm.children as { uid?: string }[])).toEqual(['firstName', 'save']);
    });

    it('applies the row indexes to the children of a row layout', () => {
      const state = drive([init(makeBaseFormDef()), setData({ users: [{}, {}] })]);
      const vm = widgetViewModel(state, 'usersRow[1]');

      expect(uidsOf(vm.children as { uid?: string }[])).toEqual(['name[1]']);
      // The nodes are the indexed sources `expandSources` produced, so a binding can hand them
      // straight to its renderer.
      expect(vm.children[0]).toBe(state.resolvedSources['name[1]']);
      expect((vm.children[0] as { path?: string }).path).toBe('users.1.name');
    });
  });

  describe('repeater rows', () => {
    it('lists one indexed row layout node per data row', () => {
      const state = drive([init(makeBaseFormDef()), setData({ users: [{}, {}] })]);
      const vm = widgetViewModel(state, 'users');

      expect(uidsOf(vm.rows)).toEqual(['usersRow[0]', 'usersRow[1]']);
      expect(vm.rows[0]).toBe(state.resolvedSources['usersRow[0]']);
      expect(vm.rows[1]).toBe(state.resolvedSources['usersRow[1]']);
    });

    it('reshapes the rows when a row is added or removed', () => {
      const reduce = makeReducer();
      let state = drive([init(makeBaseFormDef()), setData({ users: [{}] })]);
      expect(uidsOf(widgetViewModel(state, 'users').rows)).toEqual(['usersRow[0]']);

      state = reduce(state, setWidgetData('users', [{}, {}]));
      expect(uidsOf(widgetViewModel(state, 'users').rows)).toEqual(['usersRow[0]', 'usersRow[1]']);

      state = reduce(state, setWidgetData('users', [{}]));
      expect(uidsOf(widgetViewModel(state, 'users').rows)).toEqual(['usersRow[0]']);
    });

    it('chains the indexes of nested repeaters', () => {
      const state = drive([
        init(makeNestedRepeaterFormDef()),
        setData({ teams: [{ devs: [] }, { devs: [] }, { devs: [{}, {}] }] }),
      ]);

      const outer = widgetViewModel(state, 'teams');
      expect(uidsOf(outer.rows)).toEqual(['teamRow[0]', 'teamRow[1]', 'teamRow[2]']);

      // The inner repeater instance carries its outer row index in its uid, and its rows carry the
      // full chain.
      const inner = widgetViewModel(state, 'devs[2]');
      expect(uidsOf(inner.rows)).toEqual(['devRow[2][0]', 'devRow[2][1]']);
      expect(inner.rows[0]).toBe(state.resolvedSources['devRow[2][0]']);

      const innerRow = widgetViewModel(state, 'devRow[2][0]');
      expect(uidsOf(innerRow.children as { uid?: string }[])).toEqual(['devName[2][0]']);
      expect((innerRow.children[0] as { path?: string }).path).toBe('teams.2.devs.0.devName');
    });

    // A derive-owned error publishes the new `data` with the previous derive's `resolvedSources`,
    // so the value array can be longer than the rows the store knows. A row renderer reads `.uid`
    // off every entry, so an `undefined` entry crashes the binding.
    it('skips the rows an errored derive never resolved', () => {
      const reduce = makeReducer();
      const ok = drive([init(makeThrowingRowPropFormDef()), setData({ users: [{ name: 'Ada' }] })]);
      expect(ok.formHealth).toEqual({ status: 'ok' });
      expect(uidsOf(widgetViewModel(ok, 'users').rows)).toEqual(['usersRow[0]']);

      const errored = reduce(ok, setData({ users: [{ name: 'Ada' }, {}] }));

      expect(errored.formHealth.status).toBe('errored');
      expect(errored.data['users']).toHaveLength(2);
      expect(errored.resolvedSources).toBe(ok.resolvedSources);

      const vm = widgetViewModel(errored, 'users');
      expect(vm.rows).not.toContain(undefined);
      expect(uidsOf(vm.rows)).toEqual(['usersRow[0]']);
    });
  });
});

// -----------------------------------------------------------------------------
// 2. createWidgetViewModelReader
// -----------------------------------------------------------------------------

describe('createWidgetViewModelReader', () => {
  it('returns the identical object while nothing relevant to the widget changed', () => {
    const reduce = makeReducer();
    let state = drive([
      init(makeBaseFormDef()),
      setData({ firstName: 'Joan', users: [{ name: 'a' }] }),
    ]);
    const read = createWidgetViewModelReader();

    const before = read(state, 'firstName');
    // A change on an unrelated path re-derives the whole form, and the reference-stable props pass
    // keeps this widget's slices untouched.
    state = reduce(state, setWidgetData('users.0.name', 'b'));
    const after = read(state, 'firstName');

    expect(after).toBe(before);
  });

  it('builds a new view model when the value changes and reuses the untouched errors array', () => {
    const reduce = makeReducer();
    let state = drive([init(makeBaseFormDef()), setData({ users: [] }), validateAllAction]);
    const read = createWidgetViewModelReader();

    const before = read<string>(state, 'firstName');
    expect(before.errors).toEqual(['required']);

    state = reduce(state, setWidgetData('firstName', 'Anna'));
    const after = read<string>(state, 'firstName');

    expect(after).not.toBe(before);
    expect(after.value).toBe('Anna');
    // Nothing re-validated, so the validation slices are unchanged and the array is reused.
    expect(after.errors).toBe(before.errors);
  });

  it('returns the identical repeater view model across a change outside the repeater', () => {
    const reduce = makeReducer();
    let state = drive([
      init(makeBaseFormDef()),
      setData({ users: [{ name: 'a' }, { name: 'b' }] }),
    ]);
    const read = createWidgetViewModelReader();

    const before = read(state, 'users');
    state = reduce(state, setWidgetData('firstName', 'Joan'));

    expect(read(state, 'users')).toBe(before);
  });

  it('rebuilds the rows when a row is appended through a container path write', () => {
    const reduce = makeReducer();
    let state = drive([init(makeBaseFormDef()), setData({ users: [{ name: 'Ada' }] })]);
    const read = createWidgetViewModelReader();

    const before = read(state, 'users');
    expect(uidsOf(before.rows)).toEqual(['usersRow[0]']);

    state = reduce(state, setWidgetData('users.1', { name: 'Grace' }));
    const after = read(state, 'users');

    expect(after).not.toBe(before);
    expect(uidsOf(after.rows)).toEqual(['usersRow[0]', 'usersRow[1]']);
  });

  it('reuses the rows array when only the form-invalid flag changed', () => {
    const reduce = makeReducer();
    let state = drive([
      init(makeBaseFormDef()),
      setData({ users: [{ name: 'a' }, { name: 'b' }] }),
    ]);
    const read = createWidgetViewModelReader();

    const before = read(state, 'users');
    // A submit attempt leaves the repeater and its rows untouched but flips `formInvalid`.
    state = reduce(state, validateAllAction);
    const after = read(state, 'users');

    expect(after).not.toBe(before);
    expect(after.formInvalid).toBe(true);
    expect(after.rows).toBe(before.rows);
  });

  it('reuses the children array when only the form-invalid flag changed', () => {
    const reduce = makeReducer();
    let state = drive([init(makeBaseFormDef()), setData({ users: [{ name: 'a' }] })]);
    const read = createWidgetViewModelReader();

    const before = read(state, 'usersRow[0]');
    state = reduce(state, validateAllAction);
    const after = read(state, 'usersRow[0]');

    expect(after).not.toBe(before);
    expect(after.formInvalid).toBe(true);
    expect(after.children).toBe(before.children);
  });

  it('builds a new view model when the language changes', () => {
    const reduce = makeReducer();
    let state = drive([init(makeBaseFormDef()), setData({ firstName: 'Joan', users: [] })]);
    const read = createWidgetViewModelReader();

    const before = read(state, 'firstName');
    state = reduce(state, setLanguage('es'));
    const after = read(state, 'firstName');

    expect(after).not.toBe(before);
    expect(after.lang).toBe('es');
  });

  it('returns a stable empty view model for a uid that no longer exists', () => {
    const reduce = makeReducer();
    let state = drive([init(makeBaseFormDef()), setData({ users: [{}, {}] })]);
    const read = createWidgetViewModelReader();

    // Remove the second row: its widgets disappear from the derive.
    state = reduce(state, setWidgetData('users', [{}]));
    const first = read(state, 'name[1]');
    const second = read(state, 'name[1]');

    expect(first.widget).toBeUndefined();
    expect(second).toBe(first);
    expect(first.children).toEqual([]);
    expect(first.rows).toEqual([]);
    expect(first.errors).toEqual([]);
  });

  it('updates a row widget reading $item only when that row changes', () => {
    const reduce = makeReducer();
    let state = drive([
      init(makeRowScopeFormDef()),
      setData({ lineItems: [{ quantity: 2 }, { quantity: 5 }] }),
    ]);
    const read = createWidgetViewModelReader();

    const firstRowBefore = read(state, 'rowTotal[0]');
    const secondRowBefore = read(state, 'rowTotal[1]');
    expect((secondRowBefore.widget as NonFunctionWidget<string>).props?.['text']).toBe('Row 2: 5');

    state = reduce(state, setWidgetData('lineItems.1.quantity', 9));

    expect(read(state, 'rowTotal[0]')).toBe(firstRowBefore);
    const secondRowAfter = read(state, 'rowTotal[1]');
    expect(secondRowAfter).not.toBe(secondRowBefore);
    expect((secondRowAfter.widget as NonFunctionWidget<string>).props?.['text']).toBe('Row 2: 9');
  });
});

// -----------------------------------------------------------------------------
// 3. widgetViewModel$
// -----------------------------------------------------------------------------

describe('widgetViewModel$', () => {
  it('emits only when the widget view model actually changed', () => {
    const reduce = makeReducer();
    const initial = drive([
      init(makeBaseFormDef()),
      setData({ firstName: 'Joan', users: [{ name: 'a' }] }),
    ]);
    const subject = new BehaviorSubject<State>(initial);

    const emissions: WidgetViewModel[] = [];
    const subscription = subject
      .pipe(widgetViewModel$('firstName'))
      .subscribe((vm) => emissions.push(vm));

    expect(emissions.length).toBe(1);

    // A change on an unrelated path: no new emission.
    subject.next(reduce(subject.getValue(), setWidgetData('users.0.name', 'b')));
    expect(emissions.length).toBe(1);

    // The widget's own value changes: one new emission.
    subject.next(reduce(subject.getValue(), setWidgetData('firstName', 'Anna')));
    expect(emissions.length).toBe(2);
    expect(emissions[1].value).toBe('Anna');

    subscription.unsubscribe();
  });

  it('emits the rows of a repeater when a row is added', () => {
    const reduce = makeReducer();
    const subject = new BehaviorSubject<State>(
      drive([init(makeBaseFormDef()), setData({ users: [{}] })]),
    );

    const emissions: WidgetViewModel[] = [];
    const subscription = subject
      .pipe(widgetViewModel$('users'))
      .subscribe((vm) => emissions.push(vm));

    subject.next(reduce(subject.getValue(), setWidgetData('users', [{}, {}])));

    expect(emissions.length).toBe(2);
    expect(uidsOf(emissions[1].rows)).toEqual(['usersRow[0]', 'usersRow[1]']);

    subscription.unsubscribe();
  });
});
