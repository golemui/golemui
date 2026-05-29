import {
  type ActionWidget,
  type DisplayWidget,
  type FunctionWidget,
  type InputWidget,
  type LayoutWidget,
} from '../../form-widget';
import { type I18nParams, type I18nTranslator, type TranslationKey } from '../../i18n';
import { createInitialState, type State } from '../model';
import { calculateWidgetProps } from './calculate-widget-props';

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

type RecordedCall = { key: TranslationKey; params?: I18nParams; defaultValue?: string };

const makeTranslator = (
  translate: (key: TranslationKey, params?: I18nParams, d?: string) => string = (k, _p, d) =>
    d ?? k,
): I18nTranslator & { calls: RecordedCall[] } => {
  const calls: RecordedCall[] = [];
  const translator = {
    get lang() {
      return 'en-US';
    },
    translate(key: TranslationKey, params?: I18nParams, defaultValue?: string): string {
      calls.push({ key, params, defaultValue });
      return translate(key, params, defaultValue);
    },
    subscribe(): () => void {
      return () => undefined;
    },
    calls,
  };
  return translator;
};

const seed = <W>(state: State, uid: string, source: W): void => {
  state.calculatedWidgets[uid] = { source: source as any, current: {} as any };
};

const run = (state: State, translator: I18nTranslator = makeTranslator()) =>
  calculateWidgetProps(translator)(state);

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('calculateWidgetProps', () => {
  let state: State;

  beforeEach(() => {
    state = createInitialState('en-US');
  });

  // ---------------------------------------------------------------------------
  // Per-kind core fields
  // ---------------------------------------------------------------------------

  describe('per-kind core fields', () => {
    it('DisplayWidget: copies uid, type, kind, size, include, exclude', () => {
      const source = {
        kind: 'display',
        uid: 'd1',
        type: 'heading',
        size: 2,
        include: { in: ['foo'] },
        exclude: { from: ['bar'] },
      } satisfies DisplayWidget<string>;
      seed(state, 'd1', source);

      const next = run(state);
      const current = next.calculatedWidgets['d1'].current as DisplayWidget<string>;

      expect(current.kind).toBe('display');
      expect(current.uid).toBe('d1');
      expect(current.type).toBe('heading');
      expect(current.size).toBe(2);
      expect(current.include).toEqual({ in: ['foo'] });
      expect(current.exclude).toEqual({ from: ['bar'] });
    });

    it('ActionWidget: copies core + label + disabled', () => {
      const source = {
        kind: 'action',
        uid: 'a1',
        type: 'button',
        size: 1,
        label: 'Submit',
        disabled: false,
      } satisfies ActionWidget<string>;
      seed(state, 'a1', source);

      const next = run(state);
      const current = next.calculatedWidgets['a1'].current as ActionWidget<string>;

      expect(current.kind).toBe('action');
      expect(current.uid).toBe('a1');
      expect(current.type).toBe('button');
      expect(current.size).toBe(1);
      expect(current.label).toBe('Submit');
      expect(current.disabled).toBe(false);
    });

    it('InputWidget: copies core + label + disabled + readonly + validator + path + defaultValue', () => {
      const validator = () => undefined;
      const source = {
        kind: 'input',
        uid: 'i1',
        type: 'textinput',
        path: 'user.name',
        size: 1,
        label: 'Name',
        disabled: false,
        readonly: false,
        defaultValue: 'initial',
        validator,
      } satisfies InputWidget<any, string>;
      seed(state, 'i1', source);

      const next = run(state);
      const current = next.calculatedWidgets['i1'].current as InputWidget<any, string>;

      expect(current.kind).toBe('input');
      expect(current.uid).toBe('i1');
      expect(current.type).toBe('textinput');
      expect(current.path).toBe('user.name');
      expect(current.size).toBe(1);
      expect(current.label).toBe('Name');
      expect(current.disabled).toBe(false);
      expect(current.readonly).toBe(false);
      expect(current.defaultValue).toBe('initial');
      // validator is a function on source — it gets invoked by resolvePropValue,
      // returning its result.
      expect(current.validator).toBeUndefined();
    });

    it('LayoutWidget: copies core + children (excluding `on`)', () => {
      // Non-empty children ensure the children branch sees a length change from
      // previous empty state, so `ctx.changed` stays true (the children branch
      // overwrites changed; we need children diff to stay truthy).
      const child = { kind: 'display', uid: 'c', type: 'heading' } satisfies DisplayWidget<string>;
      const source = {
        kind: 'layout',
        uid: 'l1',
        type: 'flex',
        size: 1,
        children: [child],
      } satisfies LayoutWidget<string>;
      seed(state, 'l1', source);

      const next = run(state);
      const current = next.calculatedWidgets['l1'].current as LayoutWidget<string>;

      expect(current.kind).toBe('layout');
      expect(current.uid).toBe('l1');
      expect(current.type).toBe('flex');
      expect(current.size).toBe(1);
      expect(current.children).toEqual([child]);
    });

    it('does not set a core field absent from source', () => {
      // Input widget without `label` — `current.label` should be entirely absent.
      const source = {
        kind: 'input',
        uid: 'i2',
        type: 'textinput',
        path: 'x',
      } satisfies InputWidget<any, string>;
      seed(state, 'i2', source);

      const next = run(state);
      const current = next.calculatedWidgets['i2'].current as InputWidget<any, string>;

      expect('label' in current).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Suffix resolution
  // ---------------------------------------------------------------------------

  describe('state suffix resolution', () => {
    const baseSource = () =>
      ({
        kind: 'action',
        uid: 'a',
        type: 'button',
        label: 'BASE',
        'label.register': 'REGISTER',
        'label.register:adult': 'REGISTER_ADULT',
      }) satisfies ActionWidget<string>;

    it('no matching state → uses base', () => {
      seed(state, 'a', baseSource());
      state.currentStates = [];

      const next = run(state);

      expect((next.calculatedWidgets['a'].current as ActionWidget<string>).label).toBe('BASE');
    });

    it('one matching state → uses that state suffix', () => {
      seed(state, 'a', baseSource());
      state.currentStates = ['register'];

      const next = run(state);

      expect((next.calculatedWidgets['a'].current as ActionWidget<string>).label).toBe('REGISTER');
    });

    it('non-matching state → falls back to base', () => {
      seed(state, 'a', baseSource());
      state.currentStates = ['unknown'];

      const next = run(state);

      expect((next.calculatedWidgets['a'].current as ActionWidget<string>).label).toBe('BASE');
    });

    it('longest matching state wins (sort by length DESC)', () => {
      seed(state, 'a', baseSource());
      state.currentStates = ['register', 'register:adult'];

      const next = run(state);

      expect((next.calculatedWidgets['a'].current as ActionWidget<string>).label).toBe(
        'REGISTER_ADULT',
      );
    });

    it('longest wins regardless of input order', () => {
      seed(state, 'a', baseSource());
      state.currentStates = ['register:adult', 'register'];

      const next = run(state);

      expect((next.calculatedWidgets['a'].current as ActionWidget<string>).label).toBe(
        'REGISTER_ADULT',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // hasWhen for disabled / readonly
  // ---------------------------------------------------------------------------

  describe('hasWhen', () => {
    it('disabled: { when } uses pre-computed widgetFlags[uid].disabled', () => {
      const source = {
        kind: 'input',
        uid: 'i',
        type: 'textinput',
        path: 'x',
        disabled: { when: '$form.x' },
      } satisfies InputWidget<any, string>;
      seed(state, 'i', source);
      state.widgetFlags['i'] = { disabled: true };

      const next = run(state);

      expect((next.calculatedWidgets['i'].current as InputWidget<any, string>).disabled).toBe(true);
    });

    it('readonly: { when } uses pre-computed widgetFlags[uid].readonly', () => {
      const source = {
        kind: 'input',
        uid: 'i',
        type: 'textinput',
        path: 'x',
        readonly: { when: '$form.x' },
      } satisfies InputWidget<any, string>;
      seed(state, 'i', source);
      state.widgetFlags['i'] = { readonly: true };

      const next = run(state);

      expect((next.calculatedWidgets['i'].current as InputWidget<any, string>).readonly).toBe(true);
    });

    it('{ when } on a non-disabled/readonly prop passes through unchanged (parity quirk)', () => {
      const whenObj = { when: '$form.x' };
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { foo: whenObj },
      } satisfies DisplayWidget<string>;
      seed(state, 'd', source);

      const next = run(state);

      expect((next.calculatedWidgets['d'].current as DisplayWidget<string>).props?.['foo']).toBe(
        whenObj,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Function props
  // ---------------------------------------------------------------------------

  describe('function props', () => {
    it('core field function receives { $form, translate } and its result is stored', () => {
      const source = {
        kind: 'action',
        uid: 'a',
        type: 'button',
        label: ({ $form }: { $form: any }) => `Hello ${$form.name}`,
      } satisfies ActionWidget<string>;
      seed(state, 'a', source);
      state.data = { name: 'World' };

      const next = run(state);

      expect((next.calculatedWidgets['a'].current as ActionWidget<string>).label).toBe(
        'Hello World',
      );
    });

    it('props field function is invoked and its result is stored', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: {
          text: ({ $form }: { $form: any }) => `Hi ${$form.user}`,
        },
      } satisfies DisplayWidget<string>;
      seed(state, 'd', source);
      state.data = { user: 'joan' };

      const next = run(state);

      expect((next.calculatedWidgets['d'].current as DisplayWidget<string>).props?.['text']).toBe(
        'Hi joan',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // TranslationConfig
  // ---------------------------------------------------------------------------

  describe('translation config', () => {
    it('label: TranslationConfig calls translator with key, resolved params, default', () => {
      const translator = makeTranslator((_k, params) => `RESOLVED:${params?.['name']}`);
      const source = {
        kind: 'action',
        uid: 'a',
        type: 'button',
        label: {
          key: 'greet',
          default: 'Hello',
          params: { name: '$form.user.name' },
        },
      } satisfies ActionWidget<string>;
      seed(state, 'a', source);
      state.data = { user: { name: 'Alice' } };

      const next = run(state, translator);

      expect(translator.calls).toHaveLength(1);
      expect(translator.calls[0].key).toBe('greet');
      expect(translator.calls[0].params).toEqual({ name: 'Alice' });
      expect(translator.calls[0].defaultValue).toBe('Hello');
      expect((next.calculatedWidgets['a'].current as ActionWidget<string>).label).toBe(
        'RESOLVED:Alice',
      );
    });

    it('i18n params: non-scoped values pass through as strings', () => {
      const translator = makeTranslator();
      const source = {
        kind: 'action',
        uid: 'a',
        type: 'button',
        label: {
          key: 'k',
          params: { a: 'literal', n: 42 as any },
        },
      } satisfies ActionWidget<string>;
      seed(state, 'a', source);

      run(state, translator);

      expect(translator.calls[0].params).toEqual({ a: 'literal', n: '42' });
    });

    it('i18n params: string concat expression resolves', () => {
      const translator = makeTranslator();
      const source = {
        kind: 'action',
        uid: 'a',
        type: 'button',
        label: { key: 'k', params: { name: "$form.first + ' ' + $form.last" } },
      } satisfies ActionWidget<string>;
      seed(state, 'a', source);
      state.data = { first: 'John', last: 'Doe' };

      run(state, translator);

      expect(translator.calls[0].params).toEqual({ name: 'John Doe' });
    });

    it('i18n params: arithmetic expression resolves', () => {
      const translator = makeTranslator();
      const source = {
        kind: 'action',
        uid: 'a',
        type: 'button',
        label: { key: 'k', params: { n: '$form.count + 1' } },
      } satisfies ActionWidget<string>;
      seed(state, 'a', source);
      state.data = { count: 4 };

      run(state, translator);

      expect(translator.calls[0].params).toEqual({ n: 5 });
    });

    it('i18n params: unknown path falls back to the param string', () => {
      const translator = makeTranslator();
      const source = {
        kind: 'action',
        uid: 'a',
        type: 'button',
        label: { key: 'k', params: { x: '$form.missing' } },
      } satisfies ActionWidget<string>;
      seed(state, 'a', source);
      state.data = {};

      run(state, translator);

      expect(translator.calls[0].params).toEqual({ x: '$form.missing' });
    });

    it('i18n params: bad expression sets formHealth to errored', () => {
      const source = {
        kind: 'action',
        uid: 'a',
        type: 'button',
        label: { key: 'k', params: { x: '$form..broken' } },
      } satisfies ActionWidget<string>;
      seed(state, 'a', source);

      const next = run(state);

      expect(next.formHealth.status).toBe('errored');
      if (next.formHealth.status === 'errored') {
        expect(next.formHealth.code).toBe(40);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Scoped-path templates
  // ---------------------------------------------------------------------------

  describe('scoped-path templates', () => {
    it('resolves $form.path inside a string prop', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: 'Hello {{$form.user}}' },
      } satisfies DisplayWidget<string>;
      seed(state, 'd', source);
      state.data = { user: 'Bob' };

      const next = run(state);

      expect((next.calculatedWidgets['d'].current as DisplayWidget<string>).props?.['text']).toBe(
        'Hello Bob',
      );
    });

    it('resolves $meta.path', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: 'Status: {{$meta.status}}' },
      } satisfies DisplayWidget<string>;
      seed(state, 'd', source);
      state.meta = { status: 'active' };

      const next = run(state);

      expect((next.calculatedWidgets['d'].current as DisplayWidget<string>).props?.['text']).toBe(
        'Status: active',
      );
    });

    it('resolves $formIsInvalid to "true"/"false"', () => {
      const source1 = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: 'Invalid? {{$formIsInvalid}}' },
      } satisfies DisplayWidget<string>;
      seed(state, 'd', source1);
      state.validations = { 'some.path': [{ message: 'bad' }] as any };

      const next = run(state);

      expect((next.calculatedWidgets['d'].current as DisplayWidget<string>).props?.['text']).toBe(
        'Invalid? true',
      );
    });

    it('resolves $errors.path', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: 'Err: {{$errors.user.age}}' },
      } satisfies DisplayWidget<string>;
      seed(state, 'd', source);
      state.validations = { 'user.age': [{ message: 'too young' }] as any };

      const next = run(state);

      const text = (next.calculatedWidgets['d'].current as DisplayWidget<string>).props?.['text'];
      // Errors serialize via String() inside the template replace → "[object Object]"-ish
      // but that's the current behavior; we just assert resolution happened.
      expect(text.startsWith('Err: ')).toBe(true);
      expect(text).not.toContain('{{');
    });
  });

  // ---------------------------------------------------------------------------
  // widgetPropOverrides
  // ---------------------------------------------------------------------------

  describe('widgetPropOverrides', () => {
    it('overrides a literal props value', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: 'original' },
      } satisfies DisplayWidget<string>;
      seed(state, 'd', source);
      state.widgetPropOverrides = { d: { text: 'overridden' } };

      const next = run(state);

      expect((next.calculatedWidgets['d'].current as DisplayWidget<string>).props?.['text']).toBe(
        'overridden',
      );
    });

    it('overrides a function-result props value', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: () => 'fn result' },
      } satisfies DisplayWidget<string>;
      seed(state, 'd', source);
      state.widgetPropOverrides = { d: { text: 'overridden' } };

      const next = run(state);

      expect((next.calculatedWidgets['d'].current as DisplayWidget<string>).props?.['text']).toBe(
        'overridden',
      );
    });

    it('overrides a TranslationConfig-result props value', () => {
      const translator = makeTranslator(() => 'translated');
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: { key: 'foo' } },
      } satisfies DisplayWidget<string>;
      seed(state, 'd', source);
      state.widgetPropOverrides = { d: { text: 'overridden' } };

      const next = run(state, translator);

      expect((next.calculatedWidgets['d'].current as DisplayWidget<string>).props?.['text']).toBe(
        'overridden',
      );
    });

    it('introduces a key not present on source.props', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: 'x' },
      } satisfies DisplayWidget<string>;
      seed(state, 'd', source);
      state.widgetPropOverrides = { d: { newKey: 'new value' } };

      const next = run(state);

      expect((next.calculatedWidgets['d'].current as DisplayWidget<string>).props?.['newKey']).toBe(
        'new value',
      );
    });

    it('does NOT override core fields', () => {
      const source = {
        kind: 'action',
        uid: 'a',
        type: 'button',
        label: 'original',
      } satisfies ActionWidget<string>;
      seed(state, 'a', source);
      // Even though `label` is a core field, the override only applies to `props.*`.
      state.widgetPropOverrides = { a: { label: 'overridden' } };

      const next = run(state);

      const cur = next.calculatedWidgets['a'].current as ActionWidget<string>;
      expect(cur.label).toBe('original');
    });
  });

  // ---------------------------------------------------------------------------
  // on handlers
  // ---------------------------------------------------------------------------

  describe('on handlers', () => {
    it('Action widget: string on.click is copied', () => {
      const source = {
        kind: 'action',
        uid: 'a',
        type: 'button',
        on: { click: 'submit' },
      } satisfies ActionWidget<string>;
      seed(state, 'a', source);

      const next = run(state);

      const cur = next.calculatedWidgets['a'].current as ActionWidget<string>;
      expect(cur.on?.click).toBe('submit');
    });

    it('Input widget: function on.change is invoked', () => {
      const source = {
        kind: 'input',
        uid: 'i',
        type: 'textinput',
        path: 'x',
        on: {
          change: ({ $form }: { $form: any }) => `go:${$form.x}`,
        },
      } satisfies InputWidget<any, string>;
      seed(state, 'i', source);
      state.data = { x: 'go' };

      const next = run(state);

      const cur = next.calculatedWidgets['i'].current as InputWidget<any, string>;
      expect(cur.on?.change).toBe('go:go');
    });

    it('LayoutWidget on.* is NOT computed (parity quirk)', () => {
      const source = {
        kind: 'layout',
        uid: 'l',
        type: 'flex',
        children: [],
        on: { click: 'x' },
      } satisfies LayoutWidget<string>;
      seed(state, 'l', source);

      const next = run(state);

      expect('on' in next.calculatedWidgets['l'].current).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // FunctionWidget
  // ---------------------------------------------------------------------------

  describe('FunctionWidget', () => {
    it('is invoked on each call, current is fresh, source ref is preserved, uid is set', () => {
      const source: FunctionWidget<string> = Object.assign(
        () =>
          ({
            kind: 'display',
            uid: 'ignored',
            type: 'heading',
            props: { text: 'fn!' },
          }) satisfies DisplayWidget<string>,
        { uid: 'f', type: 'heading' },
      );
      seed(state, 'f', source);

      const first = run(state);
      const second = run(first);

      expect(first.calculatedWidgets['f'].source).toBe(source);
      expect(first.calculatedWidgets['f'].current.uid).toBe('f');
      // FunctionWidget always yields a fresh `current` — no ref preservation.
      expect(second.calculatedWidgets['f']).not.toBe(first.calculatedWidgets['f']);
    });
  });

  // ---------------------------------------------------------------------------
  // Hidden widget
  // ---------------------------------------------------------------------------

  describe('hidden widgets', () => {
    it('hidden widget is absent from output', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
      } satisfies DisplayWidget<string>;
      seed(state, 'd', source);
      state.widgetFlags['d'] = { hidden: true };

      const next = run(state);

      expect('d' in next.calculatedWidgets).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Layout children
  // ---------------------------------------------------------------------------

  describe('layout children filtering', () => {
    it('hidden child is dropped from current.children', () => {
      const child1 = {
        kind: 'display',
        uid: 'c1',
        type: 'heading',
      } satisfies DisplayWidget<string>;
      const child2 = {
        kind: 'display',
        uid: 'c2',
        type: 'heading',
      } satisfies DisplayWidget<string>;
      const source = {
        kind: 'layout',
        uid: 'l',
        type: 'flex',
        children: [child1, child2],
      } satisfies LayoutWidget<string>;
      seed(state, 'l', source);
      state.widgetFlags['c2'] = { hidden: true };

      const next = run(state);
      const children = (next.calculatedWidgets['l'].current as LayoutWidget<string>).children;

      expect(children).toHaveLength(1);
      expect(children[0].uid).toBe('c1');
    });

    it('repeater children: looks up widgetFlags under child uid + [index]', () => {
      // Two children: one hidden under repeater-index suffix, one not.
      // Need a non-trivial filter result (length diff from previous empty) to
      // ensure the children branch flags `ctx.changed = true`.
      const c1 = { kind: 'display', uid: 'cell1', type: 'heading' } satisfies DisplayWidget<string>;
      const c2 = { kind: 'display', uid: 'cell2', type: 'heading' } satisfies DisplayWidget<string>;
      const source = {
        kind: 'layout',
        uid: 'row[0]',
        type: 'flex',
        children: [c1, c2],
      } satisfies LayoutWidget<string>;
      seed(state, 'row[0]', source);
      state.widgetFlags['cell1[0]'] = { hidden: true };

      const next = run(state);
      const children = (next.calculatedWidgets['row[0]'].current as LayoutWidget<string>).children;

      expect(children).toHaveLength(1);
      expect(children[0].uid).toBe('cell2');
    });

    it('repeater children: nested indexes append [i][j]', () => {
      const c1 = { kind: 'display', uid: 'leaf1', type: 'heading' } satisfies DisplayWidget<string>;
      const c2 = { kind: 'display', uid: 'leaf2', type: 'heading' } satisfies DisplayWidget<string>;
      const source = {
        kind: 'layout',
        uid: 'grid[2][3]',
        type: 'flex',
        children: [c1, c2],
      } satisfies LayoutWidget<string>;
      seed(state, 'grid[2][3]', source);
      state.widgetFlags['leaf1[2][3]'] = { hidden: true };

      const next = run(state);
      const children = (next.calculatedWidgets['grid[2][3]'].current as LayoutWidget<string>)
        .children;

      expect(children).toHaveLength(1);
      expect(children[0].uid).toBe('leaf2');
    });

    it('structural order change trips change detection (new DerivedWidget ref)', () => {
      const a = { kind: 'display', uid: 'a', type: 'heading' } satisfies DisplayWidget<string>;
      const b = { kind: 'display', uid: 'b', type: 'heading' } satisfies DisplayWidget<string>;
      const source1 = {
        kind: 'layout',
        uid: 'l',
        type: 'flex',
        children: [a, b],
      } satisfies LayoutWidget<string>;
      seed(state, 'l', source1);

      const first = run(state);
      const prevDerived = first.calculatedWidgets['l'];

      // Swap children order
      const source2 = { ...source1, children: [b, a] } satisfies LayoutWidget<string>;
      first.calculatedWidgets['l'] = { source: source2, current: prevDerived.current };

      const second = run(first);

      expect(second.calculatedWidgets['l']).not.toBe(prevDerived);
      expect(
        (second.calculatedWidgets['l'].current as LayoutWidget<string>).children.map((c) => c.uid),
      ).toEqual(['b', 'a']);
    });

    it('core-field change on a layout with structurally stable children → new DerivedWidget ref', () => {
      // Source has size=1 but previous.current has no size. Core loop marks
      // changed=true; children are structurally stable (both empty), so the
      // children branch must NOT clobber that signal - change detection ORs.
      const source = {
        kind: 'layout',
        uid: 'l',
        type: 'flex',
        size: 1,
        children: [],
      } satisfies LayoutWidget<string>;
      seed(state, 'l', source);
      const prevDerived = state.calculatedWidgets['l'];

      const next = run(state);

      expect(next.calculatedWidgets['l']).not.toBe(prevDerived);
      expect(next.calculatedWidgets['l'].current.size).toBe(1);
    });

    it('structural length change trips change detection', () => {
      const a = { kind: 'display', uid: 'a', type: 'heading' } satisfies DisplayWidget<string>;
      const b = { kind: 'display', uid: 'b', type: 'heading' } satisfies DisplayWidget<string>;
      const source1 = {
        kind: 'layout',
        uid: 'l',
        type: 'flex',
        children: [a, b],
      } satisfies LayoutWidget<string>;
      seed(state, 'l', source1);

      const first = run(state);
      const prevDerived = first.calculatedWidgets['l'];

      const source2 = { ...source1, children: [a] } satisfies LayoutWidget<string>;
      first.calculatedWidgets['l'] = { source: source2, current: prevDerived.current };

      const second = run(first);

      expect(second.calculatedWidgets['l']).not.toBe(prevDerived);
      expect((second.calculatedWidgets['l'].current as LayoutWidget<string>).children).toHaveLength(
        1,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Global ref preservation
  // ---------------------------------------------------------------------------

  describe('ref preservation', () => {
    it('widget with identical resolved values across calls → same DerivedWidget ref', () => {
      const source = {
        kind: 'action',
        uid: 'a',
        type: 'button',
        label: 'Go',
        disabled: false,
      } satisfies ActionWidget<string>;
      seed(state, 'a', source);

      const first = run(state);
      const second = run(first);

      expect(second.calculatedWidgets['a']).toBe(first.calculatedWidgets['a']);
    });

    it('layout with stable structure → same DerivedWidget ref across calls', () => {
      const child = { kind: 'display', uid: 'c', type: 'heading' } satisfies DisplayWidget<string>;
      const source = {
        kind: 'layout',
        uid: 'l',
        type: 'flex',
        children: [child],
      } satisfies LayoutWidget<string>;
      seed(state, 'l', source);

      const first = run(state);
      const second = run(first);

      expect(second.calculatedWidgets['l']).toBe(first.calculatedWidgets['l']);
    });
  });

  // ---------------------------------------------------------------------------
  // Expression templates (subscript evaluation)
  // ---------------------------------------------------------------------------

  describe('expression templates (subscript evaluation)', () => {
    it('evaluates string concatenation', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: "{{$form.firstName + ' ' + $form.lastName}}" },
      } satisfies DisplayWidget<string>;
      seed(state, 'd', source);
      state.data = { firstName: 'John', lastName: 'Doe' };

      const next = run(state);
      expect(next.calculatedWidgets['d']?.current?.props?.['text']).toBe('John Doe');
    });

    it('evaluates arithmetic', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: 'Next: {{$form.count + 1}}' },
      } satisfies DisplayWidget<string>;
      seed(state, 'd', source);
      state.data = { count: 4 };

      const next = run(state);
      expect(next.calculatedWidgets['d']?.current?.props?.['text']).toBe('Next: 5');
    });

    it('evaluates ternary expressions', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: "{{$meta.isVip ? 'VIP' : 'Guest'}}" },
      } satisfies DisplayWidget<string>;
      seed(state, 'd', source);
      state.meta = { isVip: true };

      const next = run(state);
      expect(next.calculatedWidgets['d']?.current?.props?.['text']).toBe('VIP');
    });

    it('returns empty string when expression evaluates to undefined', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: 'Hello {{$form.missing}}' },
      } satisfies DisplayWidget<string>;
      seed(state, 'd', source);
      state.data = {};

      const next = run(state);
      expect(next.calculatedWidgets['d']?.current?.props?.['text']).toBe('Hello ');
    });

    it('returns empty string when expression evaluates to null', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: '{{$form.x}}' },
      } satisfies DisplayWidget<string>;
      seed(state, 'd', source);
      state.data = { x: null };

      const next = run(state);
      expect(next.calculatedWidgets['d']?.current?.props?.['text']).toBe('');
    });

    it('preserves false and 0 as "false" and "0"', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: '{{$form.flag}} {{$form.count}}' },
      } satisfies DisplayWidget<string>;
      seed(state, 'd', source);
      state.data = { flag: false, count: 0 };

      const next = run(state);
      expect(next.calculatedWidgets['d']?.current?.props?.['text']).toBe('false 0');
    });

    it('sets formHealth to errored on a parse error', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: 'x: {{$form..broken}}' },
      } satisfies DisplayWidget<string>;
      seed(state, 'd', source);

      const next = run(state);
      expect(next.formHealth.status).toBe('errored');
      if (next.formHealth.status === 'errored') {
        expect(next.formHealth.code).toBe(40);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Validation variables integration
  // ---------------------------------------------------------------------------

  describe('calculateValidationVariables integration', () => {
    it('uses $formIsInvalid = false when no validations fail', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: '{{$formIsInvalid}}' },
      } satisfies DisplayWidget<string>;
      seed(state, 'd', source);
      state.validations = {};

      const next = run(state);

      expect((next.calculatedWidgets['d'].current as DisplayWidget<string>).props?.['text']).toBe(
        'false',
      );
    });

    it('uses $formIsInvalid = true when at least one validation has errors', () => {
      const source = {
        kind: 'display',
        uid: 'd',
        type: 'heading',
        props: { text: '{{$formIsInvalid}}' },
      } satisfies DisplayWidget<string>;
      seed(state, 'd', source);
      state.validations = { 'u.n': [{ message: 'bad' }] as any };

      const next = run(state);

      expect((next.calculatedWidgets['d'].current as DisplayWidget<string>).props?.['text']).toBe(
        'true',
      );
    });
  });
});
