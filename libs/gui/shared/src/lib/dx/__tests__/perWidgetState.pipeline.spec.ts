import { describe, expect, it } from 'vitest';
import { type LayoutWidget, type NonFunctionWidget } from '@golemui/core';
import { processDx, getStaticChild } from './helpers';
import { formDefs } from '../dx.service';
import { _guiTextInput } from '../shortcuts/inputs/guiTextInput.impl';
import { _guiSelect } from '../shortcuts/select/guiSelect.impl';
import { _guiRepeater } from '../shortcuts/repeater/guiRepeater.impl';
import { _guiButton } from '../shortcuts/actions/guiActions.impl';
import { _guiAlert } from '../shortcuts/alert/guiAlert.impl';
import { _guiVerticalFlex, _guiHorizontalFlex } from '../shortcuts/layouts/guiFlex.impl';
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
        [
          _guiTextInput('name', {
            label: 'Name',
            states: { editing: { label: 'Edit name', disabled: true } },
          }),
        ],
        undefined,
        { states: { editing: '!!$form.name' } },
      );

      const widget = getStaticChild(root, 0) as any;
      expect(widget.kind).toBe('input');
      expect(widget.label).toBe('Name');
      expect((widget as any)['label.editing']).toBe('Edit name');
      expect((widget as any)['disabled.editing']).toBe(true);
    });

    it('produces state-suffixed readonly on an input', () => {
      const root = processDx(
        [
          _guiTextInput('name', {
            states: { locked: { readonly: true } },
          }),
        ],
        undefined,
        { states: { locked: '!!$form.locked' } },
      );

      const widget = getStaticChild(root, 0) as any;
      expect((widget as any)['readonly.locked']).toBe(true);
    });

    it('produces state-suffixed size on an input', () => {
      const root = processDx(
        [
          _guiTextInput('name', {
            size: 6,
            states: { wide: { size: 12 } },
          }),
        ],
        undefined,
        { states: { wide: '!!$form.wide' } },
      );

      const widget = getStaticChild(root, 0) as any;
      expect((widget as any).size).toBe(6);
      expect((widget as any)['size.wide']).toBe(12);
    });
  });

  describe('states block — select decorator', () => {
    it('produces state-suffixed label on a select', () => {
      const root = processDx(
        [
          _guiSelect('country', {
            options: opts,
            label: 'Country',
            states: { locked: { label: 'Country (locked)', disabled: true } },
          }),
        ],
        undefined,
        { states: { locked: '!!$form.locked' } },
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
        _guiVerticalFlex([_guiTextInput('a')], {
          direction: 'row',
          states: { compact: { direction: 'column' } },
        }),
        undefined,
        { states: { compact: '!!$form.compact' } },
      );

      // The root IS the vertical flex (wrapped in auto-stack root)
      const innerLayout = getStaticChild(root, 0) as LayoutWidget;
      expect(innerLayout.kind).toBe('layout');
      expect(innerLayout.props?.['direction']).toBe('row');
      expect(innerLayout.props?.['direction.compact']).toBe('column');
    });
  });

  describe('states block — action decorator', () => {
    it('produces state-suffixed label and disabled on an action', () => {
      const root = processDx(
        [_guiButton({ label: 'Save', states: { saving: { label: 'Saving...', disabled: true } } })],
        undefined,
        { states: { saving: '!!$form.saving' } },
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
          _guiTextInput('name'),
          _guiTextInput('email'),
          _guiHorizontalFlex([
            _guiButton({ label: 'Create', states: { editing: { label: 'Update' } } }),
            _guiButton({
              label: 'Reset',
              disabled: true,
              states: { editing: { disabled: false } },
            }),
          ]),
        ],
        undefined,
        { states: { editing: '!!$form.name' } },
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
        [
          _guiRepeater('users', {
            addLabel: 'Add user',
            limit: 5,
            states: { limitReached: { addLabel: "Can't add more" } },
            template: [_guiTextInput('firstName')],
          }),
        ],
        undefined,
        { states: { limitReached: '$form.users?.length >= 5' } },
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
        [
          _guiSelect('subregion', {
            options: opts,
            states: { hasCountry: { visible: true } },
          }),
        ],
        undefined,
        { states: { hasCountry: '!!$form.country' } },
      );

      const widget = getStaticChild(root, 0);
      expect((widget as any).include).toEqual({ in: ['hasCountry'] });
    });

    it('visible: false produces exclude: { from: [stateName] }', () => {
      const root = processDx(
        [
          _guiTextInput('secret', {
            states: { locked: { visible: false } },
          }),
        ],
        undefined,
        { states: { locked: '!!$form.locked' } },
      );

      const widget = getStaticChild(root, 0);
      expect((widget as any).exclude).toEqual({ from: ['locked'] });
    });

    it('multiple states with visible: true merge into include.in array', () => {
      const root = processDx(
        [
          _guiSelect('plan', {
            options: opts,
            states: {
              register: { visible: true },
              premium: { visible: true },
            },
          }),
        ],
        undefined,
        {
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
        _guiVerticalFlex(
          [
            _guiTextInput('name', {
              disabled: false,
              states: { locked: { disabled: true } },
            }),
          ],
          {
            direction: 'row',
            states: { locked: { direction: 'column' } },
          },
        ),
        undefined,
        { states: { locked: '!!$form.locked' } },
      );

      // Input: disabled.locked at root level
      const innerLayout = getStaticChild(root, 0) as LayoutWidget;
      const input = innerLayout.children?.[0] as NonFunctionWidget;
      expect((input as any)['disabled.locked']).toBe(true);

      // Layout: direction.locked in props
      expect(innerLayout.props?.['direction.locked']).toBe('column');
    });

    it('validator (core suffixable) gets state-suffixed on input', () => {
      const root = processDx(
        [
          _guiTextInput('email', {
            states: { strict: { validator: { required: true } } },
          }),
        ],
        undefined,
        { states: { strict: '!!$form.strict' } },
      );

      const widget = getStaticChild(root, 0);
      expect((widget as any)['validator.strict']).toEqual({ required: true });
    });
  });

  describe('state-suffixed event handlers', () => {
    it('string event handler produces state-suffixed on entry', () => {
      const root = processDx(
        [
          _guiSelect('country', {
            options: opts,
            states: { editing: { onChange: 'customChangeHandler' } },
          }),
        ],
        undefined,
        { states: { editing: '!!$form.editing' } },
      );

      const widget = getStaticChild(root, 0);
      expect((widget as any).on?.['change.editing']).toBe('customChangeHandler');
    });

    it('callback event handler produces state-suffixed on entry with event wiring', () => {
      let called = false;
      const handler = () => {
        called = true;
      };

      const result = formDefs.processDxFacade(
        [
          _guiSelect('country', {
            options: opts,
            states: { editing: { onChange: handler } },
          }),
        ],
        [],
        { states: { editing: '!!$form.editing' } },
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
  // Concern 3 continued: hierarchical state names with `:` separator
  // ═══════════════════════════════════════════════════

  describe('hierarchical state names in overrides', () => {
    it(': hierarchy in state name produces state-suffixed properties', () => {
      const root = processDx(
        [
          _guiTextInput('name', {
            label: 'Name',
            states: {
              'register:adult': { label: 'Full legal name' },
              'register:minor': { label: 'Name (parent must verify)' },
            },
          }),
        ],
        undefined,
        {
          states: {
            register: '!!$form.register',
            'register:adult': '$form.age >= 18',
            'register:minor': '$form.age < 18',
          },
        },
      );

      const widget = getStaticChild(root, 0) as any;
      expect((widget as any)['label.register:adult']).toBe('Full legal name');
      expect((widget as any)['label.register:minor']).toBe('Name (parent must verify)');
    });

    it(': hierarchy in state name lands in include.in for visible', () => {
      const root = processDx(
        [
          _guiSelect('plan', {
            options: opts,
            states: { 'register:adult': { visible: true } },
          }),
        ],
        undefined,
        {
          states: {
            register: '!!$form.register',
            'register:adult': '$form.age >= 18',
          },
        },
      );

      const widget = getStaticChild(root, 0);
      expect((widget as any).include).toEqual({ in: ['register:adult'] });
    });
  });

  // ═══════════════════════════════════════════════════
  // Concern 4: include / exclude / disabled / readonly conditional fields
  // ═══════════════════════════════════════════════════

  describe('conditional fields — discriminated unions', () => {
    it('include: { when } passes through to the widget unchanged', () => {
      const root = processDx(
        [
          _guiSelect('subregion', {
            options: opts,
            include: { when: '!!$form.country' },
          }),
        ],
        undefined,
        {},
      );

      const widget = getStaticChild(root, 0);
      expect((widget as any).include).toEqual({ when: '!!$form.country' });
    });

    it('exclude: { when } passes through to the widget unchanged', () => {
      const root = processDx(
        [
          _guiTextInput('hidden', {
            exclude: { when: '$form.hideFields === true' },
          }),
        ],
        undefined,
        {},
      );

      const widget = getStaticChild(root, 0);
      expect((widget as any).exclude).toEqual({ when: '$form.hideFields === true' });
    });

    it('disabled: { when } passes through to the widget unchanged', () => {
      const root = processDx(
        [
          _guiTextInput('name', {
            disabled: { when: '$form.quantity > 100' },
          }),
        ],
        undefined,
        {},
      );

      const widget = getStaticChild(root, 0);
      expect((widget as any).disabled).toEqual({ when: '$form.quantity > 100' });
    });

    it('readonly: { when } passes through to the widget unchanged', () => {
      const root = processDx(
        [
          _guiTextInput('name', {
            readonly: { when: '!!$form.isViewer' },
          }),
        ],
        undefined,
        {},
      );

      const widget = getStaticChild(root, 0);
      expect((widget as any).readonly).toEqual({ when: '!!$form.isViewer' });
    });

    it('include: { in } and exclude: { from } pass through with their state lists', () => {
      const root = processDx(
        [
          _guiTextInput('guardianName', {
            include: { in: ['register:minor'] },
          }),
          _guiTextInput('debugId', {
            exclude: { from: ['production'] },
          }),
        ],
        undefined,
        {},
      );

      const guardian = getStaticChild(root, 0);
      const debug = getStaticChild(root, 1);
      expect((guardian as any).include).toEqual({ in: ['register:minor'] });
      expect((debug as any).exclude).toEqual({ from: ['production'] });
    });

    it('disabled: true / readonly: true (boolean form) still work', () => {
      const root = processDx(
        [_guiTextInput('name', { disabled: true, readonly: true })],
        undefined,
        {},
      );

      const widget = getStaticChild(root, 0);
      expect((widget as any).disabled).toBe(true);
      expect((widget as any).readonly).toBe(true);
    });

    it('multiple conditional fields can coexist on one widget', () => {
      const root = processDx(
        [
          _guiTextInput('notes', {
            disabled: { when: '$form.quantity > 100' },
            readonly: { when: '!!$form.isViewer' },
          }),
        ],
        undefined,
        {},
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
        [_guiTextInput('name'), _guiTextInput('email')],
        _gslStates('locked', _gslInputs({ override: { disabled: true } })),
        { states: { locked: '!!$form.locked' } },
      );

      const name = getStaticChild(root, 0);
      const email = getStaticChild(root, 1);
      expect((name as any)['disabled.locked']).toBe(true);
      expect((email as any)['disabled.locked']).toBe(true);
    });

    it('_gslStates applies custom props to layouts in props', () => {
      const root = processDx(
        _guiVerticalFlex([_guiTextInput('a')], { direction: 'row' }),
        _gslStates('compact', _gslLayouts({ override: { direction: 'column' } })),
        { states: { compact: '!!$form.compact' } },
      );

      const innerLayout = getStaticChild(root, 0) as LayoutWidget;
      expect(innerLayout.props?.['direction.compact']).toBe('column');
    });

    it('_gslStates applies direction override to _guiHorizontalFlex (demo 39 pattern)', () => {
      const root = processDx(
        [_guiHorizontalFlex([_guiTextInput('a'), _guiTextInput('b')])],
        _gslStates('locked', _gslLayouts({ override: { direction: 'column' } })),
        { states: { locked: '!!$form.locked' } },
      );

      const hFlex = getStaticChild(root, 0) as LayoutWidget;
      expect(hFlex.kind).toBe('layout');
      expect(hFlex.props?.['direction']).toBe('row');
      expect(hFlex.props?.['direction.locked']).toBe('column');
    });

    it('_gslStates applies label to actions', () => {
      const root = processDx(
        [_guiButton({ label: 'Save' })],
        _gslStates('saving', _gslActions({ override: { label: 'Saving...' } })),
        { states: { saving: '!!$form.saving' } },
      );

      const widget = getStaticChild(root, 0);
      expect((widget as any)['label.saving']).toBe('Saving...');
    });

    it('_gslStates with visible: false produces exclude on matched widgets', () => {
      const root = processDx(
        [_guiTextInput('name'), _guiTextInput('email')],
        _gslStates('hidden', _gslInputs({ override: { visible: false } as any })),
        { states: { hidden: '!!$form.hidden' } },
      );

      const name = getStaticChild(root, 0);
      expect((name as any).exclude).toEqual({ from: ['hidden'] });
    });

    it('inline states override _gslStates for same state name', () => {
      const root = processDx(
        [
          _guiTextInput('name', {
            states: { locked: { label: 'Inline label' } },
          }),
        ],
        _gslStates('locked', _gslInputs({ override: { label: 'GSL label', disabled: true } })),
        { states: { locked: '!!$form.locked' } },
      );

      const widget = getStaticChild(root, 0);
      // Inline overrides GSL for `label`, but GSL's `disabled` still applies
      expect((widget as any)['label.locked']).toBe('Inline label');
      expect((widget as any)['disabled.locked']).toBe(true);
    });

    it('multiple _gslStates for different state names both apply', () => {
      const root = processDx(
        [_guiTextInput('name')],
        [
          ..._gslStates('locked', _gslInputs({ override: { disabled: true } })),
          ..._gslStates('editing', _gslInputs({ override: { label: 'Edit name' } })),
        ],
        {
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
        [
          ..._gslStates('locked', _gslInputs({ override: { disabled: true } })),
          _gslInputs({ override: { size: 6 } }),
        ],
        { states: { locked: '!!$form.locked' } },
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
    it('states block and inline conditional coexist on the same widget', () => {
      const root = processDx(
        [
          _guiSelect('subregion', {
            options: opts,
            states: { hasCountry: { visible: true } },
            disabled: { when: '$form.quantity > 100' },
          }),
        ],
        undefined,
        { states: { hasCountry: '!!$form.country' } },
      );

      const widget = getStaticChild(root, 0);
      expect((widget as any).include).toEqual({ in: ['hasCountry'] });
      expect((widget as any).disabled).toEqual({ when: '$form.quantity > 100' });
    });

    it('_gslStates + inline states + readonly { when } all combine correctly', () => {
      const root = processDx(
        [
          _guiTextInput('name', {
            label: 'Name',
            states: { editing: { label: 'Edit name' } },
            readonly: { when: '!!$form.isViewer' },
          }),
        ],
        _gslStates('locked', _gslInputs({ override: { disabled: true } })),
        {
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
      const root = processDx([_guiTextInput('name', { label: 'Name' })], undefined);

      const widget = getStaticChild(root, 0) as any;
      expect(widget.label).toBe('Name');
      expect((widget as any).include).toBeUndefined();
      expect((widget as any).exclude).toBeUndefined();
    });

    it('states block with empty overrides — no state-suffixed props added', () => {
      const root = processDx([_guiTextInput('name', { states: { editing: {} } })], undefined, {
        states: { editing: '!!$form.editing' },
      });

      const widget = getStaticChild(root, 0) as any;
      // No state-suffixed props should be on the widget
      const keys = Object.keys(widget);
      expect(keys.filter((k) => k.includes('.'))).toEqual([]);
    });

    it('states does not leak into widget props', () => {
      const root = processDx(
        [
          _guiTextInput('name', {
            states: { editing: { label: 'Edit' } },
          }),
        ],
        undefined,
        { states: { editing: '!!$form.editing' } },
      );

      const widget = getStaticChild(root, 0) as any;
      // The `states` property itself should NOT be on the widget or in props
      expect((widget as any).states).toBeUndefined();
      expect(widget.props?.['states']).toBeUndefined();
    });

    it('include / exclude do not leak into widget props', () => {
      const root = processDx(
        [
          _guiTextInput('name', {
            include: { when: '!!$form.name' },
            exclude: { from: ['hidden'] },
          }),
        ],
        undefined,
        { states: { hidden: '!!$form.hide' } },
      );

      const widget = getStaticChild(root, 0) as any;
      expect(widget.include).toEqual({ when: '!!$form.name' });
      expect(widget.exclude).toEqual({ from: ['hidden'] });
      expect(widget.props?.['include']).toBeUndefined();
      expect(widget.props?.['exclude']).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════
  // Concern 6: Conditional fields across kinds
  // (Phase 20 — universal include/exclude/disabled/readonly)
  // ═══════════════════════════════════════════════════

  describe('conditional fields — actions', () => {
    it('disabled: { when } passes through to the action widget', () => {
      const root = processDx(
        [_guiButton({ label: 'Save', disabled: { when: '!$form.country' } })],
        undefined,
        {},
      );

      const widget = getStaticChild(root, 0) as any;
      expect(widget.kind).toBe('action');
      expect(widget.disabled).toEqual({ when: '!$form.country' });
      expect(widget.props?.['disabled']).toBeUndefined();
    });

    it('include: { when } passes through to the action widget', () => {
      const root = processDx(
        [_guiButton({ label: 'Reset', include: { when: '!!$form.debug' } })],
        undefined,
        {},
      );

      const widget = getStaticChild(root, 0) as any;
      expect(widget.include).toEqual({ when: '!!$form.debug' });
      expect(widget.props?.['include']).toBeUndefined();
    });
  });

  describe('conditional fields — layouts', () => {
    it('include: { in } passes through to the layout widget', () => {
      const root = processDx(
        _guiVerticalFlex([_guiTextInput('a')], { include: { in: ['debugMode'] } }),
        undefined,
        { states: { debugMode: '!!$form.debug' } },
      );

      const layout = getStaticChild(root, 0) as LayoutWidget & { include?: any };
      expect(layout.kind).toBe('layout');
      expect(layout.include).toEqual({ in: ['debugMode'] });
      expect(layout.props?.['include']).toBeUndefined();
    });

    it('exclude: { when } passes through to the layout widget', () => {
      const root = processDx(
        _guiHorizontalFlex([_guiTextInput('a')], { exclude: { when: '$form.compact === true' } }),
        undefined,
        {},
      );

      const layout = getStaticChild(root, 0) as LayoutWidget & { exclude?: any };
      expect(layout.exclude).toEqual({ when: '$form.compact === true' });
      expect(layout.props?.['exclude']).toBeUndefined();
    });
  });

  describe('conditional fields — displays (alert)', () => {
    it('include: { when } passes through to the alert widget', () => {
      const root = processDx(
        [_guiAlert({ text: 'Heads up', include: { when: '!!$form.show' } })],
        undefined,
        {},
      );

      const widget = getStaticChild(root, 0) as any;
      expect(widget.kind).toBe('display');
      expect(widget.include).toEqual({ when: '!!$form.show' });
      expect(widget.props?.['include']).toBeUndefined();
    });

    it('exclude: { from } passes through to the alert widget', () => {
      const root = processDx(
        [_guiAlert({ text: 'Hide in production', exclude: { from: ['production'] } })],
        undefined,
        { states: { production: '$form.env === "prod"' } },
      );

      const widget = getStaticChild(root, 0) as any;
      expect(widget.exclude).toEqual({ from: ['production'] });
    });
  });
});
