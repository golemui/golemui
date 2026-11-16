import { collectWidgetUids } from '@golemui/core/internals';
import { describe, expect, it } from 'vitest';
import { formDefs } from '../formDefs';
import { gui } from '../gui';
import type { JsonFormDiagnostic, JsonFormWidget } from './jsonFormTypes';
import { toJsonFormDefinition } from './toJsonFormDefinition';

const codesOf = (diagnostics: JsonFormDiagnostic[]): string[] =>
  diagnostics.map((diagnostic) => diagnostic.code);

// A handler with a parameter. The builder calls a handler without parameters when it builds the
// form, to read an event name from it.
const received: unknown[] = [];
const handle = (value: unknown): void => {
  received.push(value);
};

/** The uids that a form gives the widgets of a JSON form more than one time. */
function repeatedUids(formDefinition: unknown): string[] {
  const uids = collectWidgetUids(formDefinition).map(
    (entry) => `${entry.repeaterDepth}:${entry.uid}`,
  );
  return uids.filter((uid, index) => uids.indexOf(uid) !== index);
}

/** The widgets of a form and of its layouts, parents before children. */
function everyWidget(widgets: JsonFormWidget[]): JsonFormWidget[] {
  return widgets.flatMap((widget) => {
    const template = widget.props?.['template'] as JsonFormWidget | undefined;
    return [
      widget,
      ...everyWidget(widget.children ?? []),
      ...(template === undefined ? [] : everyWidget([template])),
    ];
  });
}

describe('toJsonFormDefinition', () => {
  describe('a form without functions', () => {
    const source = {
      formDef: [
        gui.inputs.textInput('email', {
          label: 'Email',
          validator: { required: true, format: 'email' },
        }),
        gui.inputs.numberInput('age', { validator: { minimum: 18 } }),
        gui.layouts.grid(
          [
            gui.actions.button({ uid: 'back', label: 'Back', onClick: () => 'goBack' }),
            gui.actions.button({ label: 'Sign up', actionType: 'submit' }),
          ],
          { uid: 'buttons', direction: 'row' },
        ),
      ],
      formConfig: { states: { adult: '$form.age >= 18', adult$senior: '$form.age >= 65' } },
    };

    it('writes the widgets, the automatic values of the builder and the states', () => {
      const { formDefinition, diagnostics } = toJsonFormDefinition(source);

      expect(formDefinition).toEqual({
        $schema: 'https://golemui.com/schemas/form.schema.json',
        states: { adult: '$form.age >= 18', 'adult:senior': '$form.age >= 65' },
        form: [
          {
            kind: 'input',
            type: 'textinput',
            uid: 'email',
            path: 'email',
            label: 'Email',
            validator: { type: 'string', required: true, format: 'email' },
            props: { placeholder: 'email' },
          },
          {
            kind: 'input',
            type: 'number',
            uid: 'age',
            path: 'age',
            label: 'Age',
            validator: { type: 'number', minimum: 18 },
            props: { placeholder: 'age' },
          },
          {
            kind: 'layout',
            type: 'grid',
            uid: 'buttons',
            props: { direction: 'row' },
            children: [
              {
                kind: 'action',
                type: 'button',
                uid: 'back',
                label: 'Back',
                on: { click: 'goBack' },
              },
              { kind: 'action', type: 'button', label: 'Sign up', actionType: 'submit' },
            ],
          },
        ],
      });
      expect(diagnostics).toEqual([]);
    });

    it('gives a value that is equal after JSON.stringify and JSON.parse', () => {
      const { formDefinition } = toJsonFormDefinition(source);

      expect(JSON.parse(JSON.stringify(formDefinition))).toEqual(formDefinition);
    });

    it('writes the keys of a widget in a fixed order, with props and children last', () => {
      const { formDefinition } = toJsonFormDefinition(source);

      expect(Object.keys(formDefinition.form[0])).toEqual([
        'kind',
        'type',
        'uid',
        'path',
        'label',
        'validator',
        'props',
      ]);
      expect(Object.keys(formDefinition.form[2])).toEqual([
        'kind',
        'type',
        'uid',
        'props',
        'children',
      ]);
      expect(Object.keys(formDefinition)).toEqual(['$schema', 'states', 'form']);
    });

    it('does not change the form that the builder gives at runtime', () => {
      const before = JSON.stringify(
        formDefs.processDxFacade(source.formDef, [], source.formConfig),
      );
      toJsonFormDefinition(source);
      const after = JSON.stringify(formDefs.processDxFacade(source.formDef, [], source.formConfig));

      expect(after).toBe(before);
    });
  });

  describe('selectors', () => {
    it('writes the values that a selector adds to each widget', () => {
      const { formDefinition } = toJsonFormDefinition({
        formDef: [gui.inputs.textInput('firstName'), gui.inputs.textInput('lastName')],
        formSelectors: [gui.selectors.inputs({ override: { size: 6 } })],
      });

      expect(formDefinition.form.map((widget) => widget['size'])).toEqual([6, 6]);
    });

    it('writes no automatic label when a selector turns the automatic labels off', () => {
      const { formDefinition } = toJsonFormDefinition({
        formDef: [gui.inputs.textInput('firstName')],
        formSelectors: [gui.selectors.inputs({ suppressAutomaticLabels: true })],
      });

      expect(formDefinition.form[0]).not.toHaveProperty('label');
    });
  });

  describe('uids', () => {
    it('keeps the uid that the definition of a button has', () => {
      const { formDefinition } = toJsonFormDefinition({
        formDef: [gui.actions.button({ uid: 'save', label: 'Save' })],
      });

      expect(formDefinition.form[0].uid).toBe('save');
    });

    it('writes no uid for a widget that has none in its definition', () => {
      const { formDefinition } = toJsonFormDefinition({
        formDef: [
          gui.actions.button({ label: 'Save' }),
          gui.layouts.grid([gui.displays.alert({ text: 'Saved' })]),
        ],
      });

      for (const widget of everyWidget(formDefinition.form)) {
        expect(widget).not.toHaveProperty('uid');
      }
    });

    it('gives the first input of a path the path as its uid, and the second one no uid', () => {
      const { formDefinition, diagnostics } = toJsonFormDefinition({
        formDef: [gui.inputs.checkbox('isNewUser'), gui.inputs.booleanInput('isNewUser')],
      });

      expect(formDefinition.form[0].uid).toBe('isNewUser');
      expect(formDefinition.form[1]).not.toHaveProperty('uid');
      expect(diagnostics).toEqual([]);
    });

    it('writes a uid for an input whose derived uid is already in use', () => {
      const { formDefinition, diagnostics } = toJsonFormDefinition({
        formDef: [
          gui.inputs.textInput('email'),
          gui.inputs.textInput('email'),
          gui.inputs.textInput('email'),
        ],
      });

      // A JSON form derives `email-textinput` for the second and for the third input.
      expect(formDefinition.form.map((widget) => widget.uid)).toEqual([
        'email',
        undefined,
        'email-textinput_2',
      ]);
      expect(diagnostics).toEqual([
        expect.objectContaining({
          severity: 'info',
          code: 'repeated-uid',
          pointer: '/form/2',
          message: expect.stringContaining('derives the uid "email-textinput" for this input'),
        }),
      ]);
      expect(Object.keys(formDefinition.form[2]).slice(0, 4)).toEqual([
        'kind',
        'type',
        'uid',
        'path',
      ]);
      expect(repeatedUids(formDefinition)).toEqual([]);
    });

    it('writes no uid for a button whose uid is also the uid of another widget', () => {
      const { formDefinition, diagnostics } = toJsonFormDefinition({
        formDef: [
          gui.actions.button({ uid: 'search', label: 'Search' }),
          gui.inputs.textInput('search'),
          gui.actions.button({ uid: 'next', label: 'Next' }),
          gui.actions.button({ uid: 'next', label: 'Next page' }),
        ],
      });

      // The builder replaces the uid of each button, so its form starts with these definitions.
      expect(formDefinition.form.map((widget) => widget.uid)).toEqual([
        undefined,
        'search',
        'next',
        undefined,
      ]);
      expect(
        diagnostics.map(({ severity, code, pointer }) => ({ severity, code, pointer })),
      ).toEqual([
        { severity: 'info', code: 'repeated-uid', pointer: '/form/0' },
        { severity: 'info', code: 'repeated-uid', pointer: '/form/3' },
      ]);
      expect(diagnostics[0].message).toContain('Another widget also has the uid "search"');
      expect(repeatedUids(formDefinition)).toEqual([]);
    });
  });

  describe('event handlers', () => {
    it('keeps an event name that a handler without parameters returns', () => {
      const { formDefinition, diagnostics } = toJsonFormDefinition({
        formDef: [gui.inputs.textInput('country', { onChange: () => 'loadCities' })],
      });

      expect(formDefinition.form[0]['on']).toEqual({ change: 'loadCities' });
      expect(diagnostics).toEqual([]);
    });

    it('names the event of a handler function after the uid of the widget', () => {
      const { formDefinition, diagnostics } = toJsonFormDefinition({
        formDef: [
          gui.actions.button({ uid: 'save', label: 'Save', onClick: (data) => handle(data) }),
        ],
      });

      expect(formDefinition.form[0]['on']).toEqual({ click: 'save_click' });
      expect(diagnostics).toEqual([
        {
          severity: 'warning',
          code: 'event-handler',
          message:
            'The onClick handler of the button "save" is a function, and JSON cannot hold a ' +
            'function. The JSON form holds the event name "save_click". Handle this event in ' +
            'the formEvent handler of the form component.',
          pointer: '/form/0/on/click',
        },
      ]);
    });

    it('names the event after the path, the label or the type when the widget has no uid', () => {
      const { formDefinition } = toJsonFormDefinition({
        formDef: [
          gui.inputs.dropdown('address.city', { onLoad: (event) => handle(event), items: [] }),
          gui.actions.button({ label: 'Sign up', onClick: (data) => handle(data) }),
          gui.actions.button({ icon: 'close', onClick: (data) => handle(data) }),
        ],
      });

      expect(formDefinition.form.map((widget) => widget['on'])).toEqual([
        { load: 'address_city_load' },
        { click: 'sign_up_click' },
        { click: 'button_click' },
      ]);
    });

    it('gives two handlers different event names, also next to a written event name', () => {
      const { formDefinition, diagnostics } = toJsonFormDefinition({
        formDef: [
          gui.actions.button({ label: 'Add', onClick: () => 'add_click_2' }),
          gui.actions.button({ label: 'Add', onClick: (data) => handle(data) }),
          gui.actions.button({ label: 'Add', onClick: (data) => handle(data) }),
        ],
      });

      expect(formDefinition.form.map((widget) => widget['on'])).toEqual([
        { click: 'add_click_2' },
        { click: 'add_click' },
        { click: 'add_click_3' },
      ]);
      expect(diagnostics.map((diagnostic) => diagnostic.pointer)).toEqual([
        '/form/1/on/click',
        '/form/2/on/click',
      ]);
    });

    it('names the handler of a state with the state in the event name', () => {
      const { formDefinition, diagnostics } = toJsonFormDefinition({
        formDef: [
          gui.actions.button({
            uid: 'submit',
            label: 'Log in',
            onClick: () => 'logIn',
            states: { register: { label: 'Register', onClick: (data: unknown) => handle(data) } },
          }),
        ],
        formConfig: { states: { register: '$form.registerMode === true' } },
      });

      expect(formDefinition.form[0]).toMatchObject({
        label: 'Log in',
        'label.register': 'Register',
        on: { click: 'logIn', 'click.register': 'submit_click_register' },
      });
      expect(diagnostics).toEqual([
        expect.objectContaining({
          code: 'event-handler',
          pointer: '/form/0/on/click.register',
          message: expect.stringContaining('The onClick in the state "register" handler'),
        }),
      ]);
    });

    it('names a handler inside the template of a repeater', () => {
      const { formDefinition, diagnostics } = toJsonFormDefinition({
        formDef: [
          gui.inputs.repeater('guests', {
            template: [gui.inputs.textInput('name', { onBlur: (event) => handle(event) })],
          }),
        ],
      });

      const template = formDefinition.form[0].props?.['template'] as JsonFormWidget;
      expect(template.children?.[0]).toMatchObject({
        uid: 'name',
        path: 'guests.items.name',
        on: { blur: 'name_blur' },
      });
      expect(diagnostics.map((diagnostic) => diagnostic.pointer)).toEqual([
        '/form/0/props/template/children/0/on/blur',
      ]);
    });
  });

  describe('widgets that are functions', () => {
    it('writes the result of one call of a callback widget, with a warning', () => {
      const { formDefinition, diagnostics } = toJsonFormDefinition({
        formDef: [
          gui.inputs.textInput('name'),
          gui.inputs.booleanInput('registerMode', (params) => ({
            label: params.$form.registerMode ? 'Switch to login' : 'Switch to register',
          })),
        ],
      });

      expect(formDefinition.form[1]).toEqual({
        kind: 'input',
        type: 'toggle',
        path: 'registerMode',
        label: 'Switch to register',
      });
      expect(diagnostics).toEqual([
        expect.objectContaining({
          severity: 'warning',
          code: 'callback-widget',
          pointer: '/form/1',
          message: expect.stringContaining('The toggle "registerMode" is a callback'),
        }),
      ]);
    });

    it('calls the callback of a widget one time', () => {
      let calls = 0;
      toJsonFormDefinition({
        formDef: [
          gui.actions.button(() => {
            calls += 1;
            return { uid: 'save', label: 'Save', onClick: (data) => handle(data) };
          }),
        ],
      });

      expect(calls).toBe(1);
    });

    it('keeps the uid and names the handler of a button that is a callback', () => {
      const { formDefinition } = toJsonFormDefinition({
        formDef: [
          gui.actions.button(() => ({
            uid: 'save',
            label: 'Save',
            onClick: (data) => handle(data),
          })),
        ],
      });

      expect(formDefinition.form[0]).toEqual({
        kind: 'action',
        type: 'button',
        uid: 'save',
        label: 'Save',
        on: { click: 'save_click' },
      });
    });

    it('leaves out a callback widget whose callback throws, with an error', () => {
      const { formDefinition, diagnostics } = toJsonFormDefinition({
        formDef: [
          gui.inputs.textInput('name'),
          gui.inputs.textInput('city', () => {
            throw new Error('no country');
          }),
        ],
      });

      expect(formDefinition.form.map((widget) => widget.path)).toEqual(['name']);
      expect(diagnostics).toEqual([
        expect.objectContaining({
          severity: 'error',
          code: 'callback-failed',
          pointer: '/form',
          message: expect.stringContaining('The widget at position 2 of its list'),
        }),
      ]);
    });

    it('leaves out a display widget that is a render function, with an error', () => {
      const { formDefinition, diagnostics } = toJsonFormDefinition({
        formDef: [
          gui.layouts.grid([
            gui.displays.display(() => 'rendered by the host'),
            gui.inputs.textInput('name'),
          ]),
          () => 'a render function as a whole definition',
        ],
      });

      expect(formDefinition.form).toHaveLength(1);
      expect(formDefinition.form[0].children?.map((widget) => widget.path)).toEqual(['name']);
      expect(
        diagnostics.map(({ severity, code, pointer }) => ({ severity, code, pointer })),
      ).toEqual([
        { severity: 'error', code: 'render-function', pointer: '/form/0/children' },
        { severity: 'error', code: 'render-function', pointer: '/form' },
      ]);
    });

    it('counts only the widgets that are written in the pointer of a later widget', () => {
      const { diagnostics } = toJsonFormDefinition({
        formDef: [
          gui.displays.display(() => 'rendered by the host'),
          gui.actions.button({ uid: 'save', onClick: (data) => handle(data) }),
        ],
      });

      expect(diagnostics.map(({ code, pointer }) => ({ code, pointer }))).toEqual([
        { code: 'render-function', pointer: '/form' },
        { code: 'event-handler', pointer: '/form/0/on/click' },
      ]);
    });
  });

  describe('values that JSON cannot hold', () => {
    it('leaves out a function value and says where it was', () => {
      const { formDefinition, diagnostics } = toJsonFormDefinition({
        formDef: [
          gui.inputs.custom('stars', 'rating', {
            label: 'Rating',
            props: { max: 5, format: (value: number) => `${value} stars` },
          }),
        ],
      });

      expect(formDefinition.form[0].props).toEqual({ max: 5 });
      expect(diagnostics).toEqual([
        {
          severity: 'warning',
          code: 'function-value',
          message:
            'The value `props.format` of the stars "rating" is a function. JSON cannot hold ' +
            'it, so the value is left out. Use a template ({{ }}), a `when` rule or a state.',
          pointer: '/form/0/props/format',
        },
      ]);
    });

    it('writes a Date as a string, null for a function in an array, and no class instance', () => {
      class Money {
        constructor(readonly amount: number) {}
      }
      const { formDefinition, diagnostics } = toJsonFormDefinition({
        formDef: [
          gui.inputs.custom('money', 'price', {
            props: {
              since: new Date('2026-01-02T03:04:05.000Z'),
              steps: [1, () => 2, 3],
              minimum: new Money(5),
              ratio: Number.NaN,
            },
          }),
        ],
      });

      expect(formDefinition.form[0].props).toEqual({
        since: '2026-01-02T03:04:05.000Z',
        steps: [1, null, 3],
      });
      expect(diagnostics.map(({ code, pointer }) => ({ code, pointer }))).toEqual([
        { code: 'not-json-value', pointer: '/form/0/props/since' },
        { code: 'function-value', pointer: '/form/0/props/steps/1' },
        { code: 'not-json-value', pointer: '/form/0/props/minimum' },
        { code: 'not-json-value', pointer: '/form/0/props/ratio' },
      ]);
      expect(diagnostics[2].message).toContain('is an instance of Money');
    });

    it('leaves out a value that contains itself', () => {
      const options: Record<string, unknown> = { name: 'options' };
      options['self'] = options;
      const { formDefinition, diagnostics } = toJsonFormDefinition({
        formDef: [gui.inputs.custom('picker', 'choice', { props: { options } })],
      });

      expect(formDefinition.form[0].props).toEqual({ options: { name: 'options' } });
      expect(codesOf(diagnostics)).toEqual(['not-json-value']);
    });
  });

  describe('values that the builder adds and a JSON form does not need', () => {
    it('leaves out the automatic placeholder of an input that has no placeholder', () => {
      const { formDefinition } = toJsonFormDefinition({
        formDef: [
          gui.inputs.booleanInput('newsletter'),
          gui.inputs.datePicker('birthDate', { label: 'Birth date' }),
          gui.inputs.textInput('name'),
        ],
      });

      expect(formDefinition.form[0]).not.toHaveProperty('props');
      expect(formDefinition.form[1].props ?? {}).not.toHaveProperty('placeholder');
      expect(formDefinition.form[2].props).toEqual({ placeholder: 'name' });
    });

    it('leaves out an empty props object', () => {
      const { formDefinition } = toJsonFormDefinition({
        formDef: [gui.actions.button({ label: 'Save' })],
      });

      expect(formDefinition.form[0]).toEqual({ kind: 'action', type: 'button', label: 'Save' });
    });
  });

  describe('the root layout', () => {
    it('keeps the root layout as one widget when a selector gives it a value', () => {
      const { formDefinition, diagnostics } = toJsonFormDefinition({
        formDef: [gui.inputs.textInput('name')],
        formSelectors: [gui.selectors.layouts({ override: { gap: 'lg' } })],
      });

      expect(formDefinition.form).toHaveLength(1);
      expect(formDefinition.form[0]).toMatchObject({
        kind: 'layout',
        type: 'grid',
        props: { direction: 'column', gap: 'lg' },
      });
      expect(formDefinition.form[0]).not.toHaveProperty('uid');
      expect(formDefinition.form[0].children?.[0].path).toBe('name');
      expect(diagnostics).toEqual([
        expect.objectContaining({ severity: 'info', code: 'root-layout', pointer: '/form/0' }),
      ]);
    });

    it('writes the children of a default grid when the form has no automatic root', () => {
      const { formDefinition, diagnostics } = toJsonFormDefinition({
        formDef: [gui.layouts.grid([gui.inputs.textInput('name')])],
        formConfig: { suppressAutomaticStack: true },
      });

      expect(formDefinition.form.map((widget) => widget.path)).toEqual(['name']);
      expect(diagnostics).toEqual([]);
    });

    it('keeps a root layout with a uid when the form has no automatic root', () => {
      const { formDefinition, diagnostics } = toJsonFormDefinition({
        formDef: [gui.layouts.grid([gui.inputs.textInput('name')], { uid: 'page' })],
        formConfig: { suppressAutomaticStack: true },
      });

      expect(formDefinition.form).toHaveLength(1);
      expect(formDefinition.form[0].uid).toBe('page');
      expect(codesOf(diagnostics)).toEqual(['root-layout']);
    });
  });

  describe('the form config', () => {
    it('gives one warning for each value that is not part of a JSON form', () => {
      const { diagnostics } = toJsonFormDefinition({
        formDef: [gui.inputs.textInput('name')],
        formConfig: {
          functions: { double: (value: number) => value * 2 },
          validateOn: 'blur',
          widgetLoaders: { stars: () => Promise.resolve({}) },
          dependencies: undefined,
        },
      });

      expect(
        diagnostics.map(({ severity, code, pointer }) => ({ severity, code, pointer })),
      ).toEqual([
        { severity: 'warning', code: 'host-config', pointer: '' },
        { severity: 'warning', code: 'host-config', pointer: '' },
        { severity: 'warning', code: 'host-config', pointer: '' },
      ]);
      expect(diagnostics[2].message).toContain(
        'Pass the same value as `customWidgetLoaders` in the config of the form component.',
      );
    });
  });

  describe('an input that is not a gui.* form', () => {
    it('throws for a JSON form', () => {
      const jsonForm = { form: [{ kind: 'input', type: 'textinput', path: 'name' }] };

      expect(() => toJsonFormDefinition({ formDef: jsonForm as never })).toThrow(TypeError);
    });
  });
});
