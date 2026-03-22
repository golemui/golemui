import { describe, expect, it } from 'vitest';
import { LayoutWidget, NonFunctionWidget } from '@golemui/core';
import { processDx, getStaticChild } from './helpers';
import { formDefs } from '../dx.service';
import { _guiInputs } from '../shortcuts/inputs/guiInputs.impl';
import { _guiTextInput } from '../shortcuts/inputs/guiTextInput.impl';
import { _guiSelect } from '../shortcuts/select/guiSelect.impl';
import { _guiRepeater } from '../shortcuts/repeater/guiRepeater.impl';
import { _guiButton } from '../shortcuts/actions/guiActions.impl';
import { _guiVerticalStack, _guiHorizontalStack } from '../shortcuts/layouts/guiStack.impl';
import { _gslRoot } from '../shortcuts/scopes/gslRoot.impl';
import { _gslStates } from '../shortcuts/scopes/gslStates.impl';
import { _gslInputs } from '../shortcuts/inputs/register';
import { _gslLayouts } from '../shortcuts/layouts/register';
import { _gslActions } from '../shortcuts/actions/register';

const opts = [
  { label: 'US', value: 'US' },
  { label: 'FR', value: 'FR' },
];

describe('DX Pipeline — Per-Widget State Behaviour (Phase 1.2.2.4)', () => {

  // ═══════════════════════════════════════════════════
  // Concern 1: states block on decorators
  // ═══════════════════════════════════════════════════

  describe('states block — input decorators', () => {
    it('produces state-suffixed core props (disabled, label) on an input', () => {
      const root = processDx(
        [_guiTextInput('name', {
          label: 'Name',
          states: { editing: { label: 'Edit name', disabled: true } },
        })],
        undefined,
        { suppressAutomaticSubmit: true, states: { editing: '!!$form.name' } },
      );

      const widget = getStaticChild(root, 0) as any;
      expect(widget.kind).toBe('input');
      expect(widget.label).toBe('Name');
      expect((widget as any)['label.editing']).toBe('Edit name');
      expect((widget as any)['disabled.editing']).toBe(true);
    });

    it('produces state-suffixed readonly on an input', () => {
      const root = processDx(
        [_guiTextInput('name', {
          states: { locked: { readonly: true } },
        })],
        undefined,
        { suppressAutomaticSubmit: true, states: { locked: '!!$form.locked' } },
      );

      const widget = getStaticChild(root, 0) as any;
      expect((widget as any)['readonly.locked']).toBe(true);
    });

    it('produces state-suffixed size on an input', () => {
      const root = processDx(
        [_guiTextInput('name', {
          size: 6,
          states: { wide: { size: 12 } },
        })],
        undefined,
        { suppressAutomaticSubmit: true, states: { wide: '!!$form.wide' } },
      );

      const widget = getStaticChild(root, 0) as any;
      expect((widget as any).size).toBe(6);
      expect((widget as any)['size.wide']).toBe(12);
    });
  });

  describe('states block — select decorator', () => {
    it('produces state-suffixed label on a select', () => {
      const root = processDx(
        [_guiSelect('country', {
          options: opts,
          label: 'Country',
          states: { locked: { label: 'Country (locked)', disabled: true } },
        })],
        undefined,
        { suppressAutomaticSubmit: true, states: { locked: '!!$form.locked' } },
      );

      const widget = getStaticChild(root, 0) as any;
      expect(widget.kind).toBe('input');
      expect(widget.label).toBe('Country');
      expect((widget as any)['label.locked']).toBe('Country (locked)');
      expect((widget as any)['disabled.locked']).toBe(true);
    });
  });

  describe('states block — layout decorator', () => {
    it('produces state-suffixed custom props (direction) in props', () => {
      const root = processDx(
        _guiVerticalStack({
          direction: 'row',
          children: [_guiInputs({ a: 'string' })],
          states: { compact: { direction: 'column' } },
        }),
        undefined,
        { suppressAutomaticSubmit: true, states: { compact: '!!$form.compact' } },
      );

      // The root IS the vertical stack (wrapped in auto-stack root)
      const innerStack = getStaticChild(root, 0) as LayoutWidget;
      expect(innerStack.kind).toBe('layout');
      expect(innerStack.props?.['direction']).toBe('row');
      expect(innerStack.props?.['direction.compact']).toBe('column');
    });
  });

  describe('states block — action decorator', () => {
    it('produces state-suffixed label and disabled on an action', () => {
      const root = processDx(
        [_guiButton({ label: 'Save', states: { saving: { label: 'Saving...', disabled: true } } })],
        undefined,
        { suppressAutomaticSubmit: true, states: { saving: '!!$form.saving' } },
      );

      const widget = getStaticChild(root, 0);
      expect(widget.kind).toBe('action');
      expect((widget as any).label).toBe('Save');
      expect((widget as any)['label.saving']).toBe('Saving...');
      expect((widget as any)['disabled.saving']).toBe(true);
    });

    it('produces state-suffixed overrides on buttons inside a layout (demo 36)', () => {
      const root = processDx(
        [
          _guiInputs({ name: 'string', email: 'string' }),
          _guiHorizontalStack([
            _guiButton({ label: 'Create', states: { editing: { label: 'Update' } } }),
            _guiButton({ label: 'Reset', disabled: true, states: { editing: { disabled: false } } }),
          ]),
        ],
        undefined,
        { suppressAutomaticSubmit: true, states: { editing: '!!$form.name' } },
      );

      // _guiInputs produces 2 children (name, email), then hstack is at index 2
      const hstack = getStaticChild(root, 2) as LayoutWidget;
      expect(hstack.kind).toBe('layout');
      const createBtn = hstack.children?.[0] as NonFunctionWidget & Record<string, any>;
      const resetBtn = hstack.children?.[1] as NonFunctionWidget & Record<string, any>;

      expect(createBtn.kind).toBe('action');
      expect(createBtn.label).toBe('Create');
      expect(createBtn['label.editing']).toBe('Update');

      expect(resetBtn.kind).toBe('action');
      expect(resetBtn.disabled).toBe(true);
      expect(resetBtn['disabled.editing']).toBe(false);
    });
  });

  describe('states block — repeater decorator', () => {
    it('produces state-suffixed custom props (addLabel) in props', () => {
      const root = processDx(
        [_guiRepeater('users', {
          addLabel: 'Add user',
          limit: 5,
          states: { limitReached: { addLabel: "Can't add more" } },
        }, [
          _guiInputs({ firstName: 'string' }),
        ])],
        undefined,
        { suppressAutomaticSubmit: true, states: { limitReached: '$form.users?.length >= 5' } },
      );

      // Repeater is a layout-like compound widget
      const repeater = getStaticChild(root, 0);
      expect(repeater.kind).toBe('input');
      expect((repeater as any).props?.['addLabel']).toBe('Add user');
      expect((repeater as any).props?.['addLabel.limitReached']).toBe("Can't add more");
    });
  });

  // ═══════════════════════════════════════════════════
  // Concern 2: visible → include/exclude
  // ═══════════════════════════════════════════════════

  describe('visible translation', () => {
    it('visible: true produces include: { in: [stateName] }', () => {
      const root = processDx(
        [_guiSelect('subregion', {
          options: opts,
          states: { hasCountry: { visible: true } },
        })],
        undefined,
        { suppressAutomaticSubmit: true, states: { hasCountry: '!!$form.country' } },
      );

      const widget = getStaticChild(root, 0);
      expect((widget as any).include).toEqual({ in: ['hasCountry'] });
    });

    it('visible: false produces exclude: { from: [stateName] }', () => {
      const root = processDx(
        [_guiTextInput('secret', {
          states: { locked: { visible: false } },
        })],
        undefined,
        { suppressAutomaticSubmit: true, states: { locked: '!!$form.locked' } },
      );

      const widget = getStaticChild(root, 0);
      expect((widget as any).exclude).toEqual({ from: ['locked'] });
    });

    it('multiple states with visible: true merge into include.in array', () => {
      const root = processDx(
        [_guiSelect('plan', {
          options: opts,
          states: {
            register: { visible: true },
            premium: { visible: true },
          },
        })],
        undefined,
        {
          suppressAutomaticSubmit: true,
          states: { register: '!!$form.register', premium: '!!$form.premium' },
        },
      );

      const widget = getStaticChild(root, 0);
      const includeIn = (widget as any).include?.in;
      expect(includeIn).toContain('register');
      expect(includeIn).toContain('premium');
      expect(includeIn).toHaveLength(2);
    });
  });

  // ═══════════════════════════════════════════════════
  // Concern 3: State-suffixed property generation
  // ═══════════════════════════════════════════════════

  describe('state-suffixed properties — core vs custom', () => {
    it('disabled (core suffixable) goes on widget root, direction (custom) goes in props', () => {
      const root = processDx(
        _guiVerticalStack({
          direction: 'row',
          children: [
            _guiTextInput('name', {
              disabled: false,
              states: { locked: { disabled: true } },
            }),
          ],
          states: { locked: { direction: 'column' } },
        }),
        undefined,
        { suppressAutomaticSubmit: true, states: { locked: '!!$form.locked' } },
      );

      // Input: disabled.locked at root level
      const innerStack = getStaticChild(root, 0) as LayoutWidget;
      const input = innerStack.children?.[0] as NonFunctionWidget;
      expect((input as any)['disabled.locked']).toBe(true);

      // Layout: direction.locked in props
      expect(innerStack.props?.['direction.locked']).toBe('column');
    });

    it('validator (core suffixable) gets state-suffixed on input', () => {
      const root = processDx(
        [_guiTextInput('email', {
          states: { strict: { validator: { required: true } } },
        })],
        undefined,
        { suppressAutomaticSubmit: true, states: { strict: '!!$form.strict' } },
      );

      const widget = getStaticChild(root, 0);
      expect((widget as any)['validator.strict']).toEqual({ required: true });
    });
  });

  describe('state-suffixed event handlers', () => {
    it('string event handler produces state-suffixed on entry', () => {
      const root = processDx(
        [_guiSelect('country', {
          options: opts,
          states: { editing: { onChange: 'customChangeHandler' } },
        })],
        undefined,
        { suppressAutomaticSubmit: true, states: { editing: '!!$form.editing' } },
      );

      const widget = getStaticChild(root, 0);
      expect((widget as any).on?.['change.editing']).toBe('customChangeHandler');
    });

    it('callback event handler produces state-suffixed on entry with event wiring', () => {
      let called = false;
      const handler = () => { called = true; };

      const result = formDefs.processDxFacade(
        [_guiSelect('country', {
          options: opts,
          states: { editing: { onChange: handler } },
        })],
        [],
        { suppressAutomaticSubmit: true, states: { editing: '!!$form.editing' } },
      );

      const rootLayout = result.form.form as LayoutWidget;
      const widget = rootLayout.children?.[0] as NonFunctionWidget & Record<string, any>;
      const eventName = widget.on?.['change.editing'];
      expect(eventName).toBeDefined();
      expect(typeof eventName).toBe('string');

      // Verify the event is wired in the registry
      expect(result.events).toBeDefined();
      result.events!({ name: eventName, data: {} } as any);
      expect(called).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════
  // Concern 3 continued: $ → : conversion in state names
  // ═══════════════════════════════════════════════════

  describe('hierarchical state names in overrides', () => {
    it('$ in state name converts to : in state-suffixed properties', () => {
      const root = processDx(
        [_guiTextInput('name', {
          label: 'Name',
          states: {
            register$adult: { label: 'Full legal name' },
            register$minor: { label: 'Name (parent must verify)' },
          },
        })],
        undefined,
        {
          suppressAutomaticSubmit: true,
          states: {
            register: '!!$form.register',
            register$adult: '$form.age >= 18',
            register$minor: '$form.age < 18',
          },
        },
      );

      const widget = getStaticChild(root, 0) as any;
      expect((widget as any)['label.register:adult']).toBe('Full legal name');
      expect((widget as any)['label.register:minor']).toBe('Name (parent must verify)');
    });

    it('$ in state name converts to : in include.in for visible', () => {
      const root = processDx(
        [_guiSelect('plan', {
          options: opts,
          states: { register$adult: { visible: true } },
        })],
        undefined,
        {
          suppressAutomaticSubmit: true,
          states: {
            register: '!!$form.register',
            register$adult: '$form.age >= 18',
          },
        },
      );

      const widget = getStaticChild(root, 0);
      expect((widget as any).include).toEqual({ in: ['register:adult'] });
    });
  });

  // ═══════════════════════════════════════════════════
  // Concern 4: when inline conditions
  // ═══════════════════════════════════════════════════

  describe('when — single tuple', () => {
    it('when with visible: true produces include: { when }', () => {
      const root = processDx(
        [_guiSelect('subregion', {
          options: opts,
          when: ['!!$form.country', { visible: true }],
        })],
        undefined,
        { suppressAutomaticSubmit: true },
      );

      const widget = getStaticChild(root, 0);
      expect((widget as any).include).toEqual({ when: '!!$form.country' });
    });

    it('when with visible: false produces exclude: { when }', () => {
      const root = processDx(
        [_guiTextInput('hidden', {
          when: ['$form.hideFields === true', { visible: false }],
        })],
        undefined,
        { suppressAutomaticSubmit: true },
      );

      const widget = getStaticChild(root, 0);
      expect((widget as any).exclude).toEqual({ when: '$form.hideFields === true' });
    });

    it('when with disabled: true produces disabled: { when }', () => {
      const root = processDx(
        [_guiTextInput('name', {
          when: ['$form.quantity > 100', { disabled: true }],
        })],
        undefined,
        { suppressAutomaticSubmit: true },
      );

      const widget = getStaticChild(root, 0);
      expect((widget as any).disabled).toEqual({ when: '$form.quantity > 100' });
    });

    it('when with readonly: true produces readonly: { when }', () => {
      const root = processDx(
        [_guiTextInput('name', {
          when: ['!!$form.isViewer', { readonly: true }],
        })],
        undefined,
        { suppressAutomaticSubmit: true },
      );

      const widget = getStaticChild(root, 0);
      expect((widget as any).readonly).toEqual({ when: '!!$form.isViewer' });
    });
  });

  describe('when — array of tuples', () => {
    it('multiple when conditions each produce their effect', () => {
      const root = processDx(
        [_guiTextInput('notes', {
          when: [
            ['$form.quantity > 100', { disabled: true }],
            ['!!$form.isViewer', { readonly: true }],
          ],
        })],
        undefined,
        { suppressAutomaticSubmit: true },
      );

      const widget = getStaticChild(root, 0);
      expect((widget as any).disabled).toEqual({ when: '$form.quantity > 100' });
      expect((widget as any).readonly).toEqual({ when: '!!$form.isViewer' });
    });
  });

  // ═══════════════════════════════════════════════════
  // Concern 5: _gslStates aggregation selector
  // ═══════════════════════════════════════════════════

  describe('_gslStates', () => {
    it('applies disabled to all matching inputs via _gslStates', () => {
      const root = processDx(
        [
          _guiTextInput('name'),
          _guiTextInput('email'),
        ],
        _gslRoot(
          _gslStates('locked', _gslInputs({ decorator: { disabled: true } })),
        ),
        { suppressAutomaticSubmit: true, states: { locked: '!!$form.locked' } },
      );

      const name = getStaticChild(root, 0);
      const email = getStaticChild(root, 1);
      expect((name as any)['disabled.locked']).toBe(true);
      expect((email as any)['disabled.locked']).toBe(true);
    });

    it('_gslStates applies custom props to layouts in props', () => {
      const root = processDx(
        _guiVerticalStack({
          direction: 'row',
          children: [_guiInputs({ a: 'string' })],
        }),
        _gslRoot(
          _gslStates('compact', _gslLayouts({ decorator: { direction: 'column' } })),
        ),
        { suppressAutomaticSubmit: true, states: { compact: '!!$form.compact' } },
      );

      const innerStack = getStaticChild(root, 0) as LayoutWidget;
      expect(innerStack.props?.['direction.compact']).toBe('column');
    });

    it('_gslStates applies direction override to _guiHorizontalStack (demo 39 pattern)', () => {
      const root = processDx(
        [
          _guiHorizontalStack([
            _guiInputs({ a: 'string', b: 'string' }),
          ]),
        ],
        _gslRoot(
          _gslStates('locked', _gslLayouts({ decorator: { direction: 'column' } })),
        ),
        { suppressAutomaticSubmit: true, states: { locked: '!!$form.locked' } },
      );

      const hstack = getStaticChild(root, 0) as LayoutWidget;
      expect(hstack.kind).toBe('layout');
      expect(hstack.props?.['direction']).toBe('row');
      expect(hstack.props?.['direction.locked']).toBe('column');
    });

    it('_gslStates applies label to actions', () => {
      const root = processDx(
        [_guiButton({ label: 'Save' })],
        _gslRoot(
          _gslStates('saving', _gslActions({ decorator: { label: 'Saving...' } })),
        ),
        { suppressAutomaticSubmit: true, states: { saving: '!!$form.saving' } },
      );

      const widget = getStaticChild(root, 0);
      expect((widget as any)['label.saving']).toBe('Saving...');
    });

    it('_gslStates with visible: false produces exclude on matched widgets', () => {
      const root = processDx(
        [
          _guiTextInput('name'),
          _guiTextInput('email'),
        ],
        _gslRoot(
          _gslStates('hidden', _gslInputs({ decorator: { visible: false } as any })),
        ),
        { suppressAutomaticSubmit: true, states: { hidden: '!!$form.hidden' } },
      );

      const name = getStaticChild(root, 0);
      expect((name as any).exclude).toEqual({ from: ['hidden'] });
    });

    it('inline states override _gslStates for same state name', () => {
      const root = processDx(
        [_guiTextInput('name', {
          states: { locked: { label: 'Inline label' } },
        })],
        _gslRoot(
          _gslStates('locked', _gslInputs({ decorator: { label: 'GSL label', disabled: true } })),
        ),
        { suppressAutomaticSubmit: true, states: { locked: '!!$form.locked' } },
      );

      const widget = getStaticChild(root, 0);
      // Inline overrides GSL for `label`, but GSL's `disabled` still applies
      expect((widget as any)['label.locked']).toBe('Inline label');
      expect((widget as any)['disabled.locked']).toBe(true);
    });

    it('multiple _gslStates for different state names both apply', () => {
      const root = processDx(
        [_guiTextInput('name')],
        _gslRoot(
          _gslStates('locked', _gslInputs({ decorator: { disabled: true } })),
          _gslStates('editing', _gslInputs({ decorator: { label: 'Edit name' } })),
        ),
        {
          suppressAutomaticSubmit: true,
          states: { locked: '!!$form.locked', editing: '!!$form.editing' },
        },
      );

      const widget = getStaticChild(root, 0);
      expect((widget as any)['disabled.locked']).toBe(true);
      expect((widget as any)['label.editing']).toBe('Edit name');
    });

    it('_gslStates works alongside non-state GSL selectors', () => {
      const root = processDx(
        [_guiTextInput('name')],
        _gslRoot(
          _gslStates('locked', _gslInputs({ decorator: { disabled: true } })),
          _gslInputs({ decorator: { size: 6 } }),
        ),
        { suppressAutomaticSubmit: true, states: { locked: '!!$form.locked' } },
      );

      const widget = getStaticChild(root, 0);
      expect((widget as any).size).toBe(6);
      expect((widget as any)['disabled.locked']).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════
  // Combined: states + when + _gslStates
  // ═══════════════════════════════════════════════════

  describe('combined usage', () => {
    it('states block and when condition coexist on the same widget', () => {
      const root = processDx(
        [_guiSelect('subregion', {
          options: opts,
          states: { hasCountry: { visible: true } },
          when: ['$form.quantity > 100', { disabled: true }],
        })],
        undefined,
        { suppressAutomaticSubmit: true, states: { hasCountry: '!!$form.country' } },
      );

      const widget = getStaticChild(root, 0);
      expect((widget as any).include).toEqual({ in: ['hasCountry'] });
      expect((widget as any).disabled).toEqual({ when: '$form.quantity > 100' });
    });

    it('_gslStates + inline states + when all combine correctly', () => {
      const root = processDx(
        [_guiTextInput('name', {
          label: 'Name',
          states: { editing: { label: 'Edit name' } },
          when: ['!!$form.isViewer', { readonly: true }],
        })],
        _gslRoot(
          _gslStates('locked', _gslInputs({ decorator: { disabled: true } })),
        ),
        {
          suppressAutomaticSubmit: true,
          states: {
            editing: '!!$form.editing',
            locked: '!!$form.locked',
          },
        },
      );

      const widget = getStaticChild(root, 0);
      expect((widget as any)['label.editing']).toBe('Edit name');
      expect((widget as any)['disabled.locked']).toBe(true);
      expect((widget as any).readonly).toEqual({ when: '!!$form.isViewer' });
    });
  });

  // ═══════════════════════════════════════════════════
  // Edge cases
  // ═══════════════════════════════════════════════════

  describe('edge cases', () => {
    it('no states or when — widget unchanged', () => {
      const root = processDx(
        [_guiTextInput('name', { label: 'Name' })],
        undefined,
        { suppressAutomaticSubmit: true },
      );

      const widget = getStaticChild(root, 0) as any;
      expect(widget.label).toBe('Name');
      expect((widget as any).include).toBeUndefined();
      expect((widget as any).exclude).toBeUndefined();
    });

    it('states block with empty overrides — no state-suffixed props added', () => {
      const root = processDx(
        [_guiTextInput('name', { states: { editing: {} } })],
        undefined,
        { suppressAutomaticSubmit: true, states: { editing: '!!$form.editing' } },
      );

      const widget = getStaticChild(root, 0) as any;
      // No state-suffixed props should be on the widget
      const keys = Object.keys(widget);
      expect(keys.filter(k => k.includes('.'))).toEqual([]);
    });

    it('states does not leak into widget props', () => {
      const root = processDx(
        [_guiTextInput('name', {
          states: { editing: { label: 'Edit' } },
        })],
        undefined,
        { suppressAutomaticSubmit: true, states: { editing: '!!$form.editing' } },
      );

      const widget = getStaticChild(root, 0) as any;
      // The `states` property itself should NOT be on the widget or in props
      expect((widget as any).states).toBeUndefined();
      expect(widget.props?.['states']).toBeUndefined();
    });

    it('when does not leak into widget props', () => {
      const root = processDx(
        [_guiTextInput('name', {
          when: ['!!$form.name', { visible: true }],
        })],
        undefined,
        { suppressAutomaticSubmit: true },
      );

      const widget = getStaticChild(root, 0);
      expect((widget as any).when).toBeUndefined();
      expect((widget as any).props?.['when']).toBeUndefined();
    });
  });
});
