import { type FormEvent, type LayoutWidget } from '@golemui/core';
import { describe, expect, it, vi } from 'vitest';
import { processDx, getStaticChild, getRawChild, resolveDynamic } from './helpers';
import { _guiSelect } from '../shortcuts/select/guiSelect.impl';
import { _guiDropdown } from '../shortcuts/dropdown/guiDropdown.impl';
import { _guiTabs } from '../shortcuts/tabs/guiTabs.impl';
import { _guiButton } from '../shortcuts/actions/guiActions.impl';
import { formDefs } from '../formDefs';
import { _guiTextInput, _guiNumberInput } from '../index';

function getRootFromFacadeResult(
  result: ReturnType<typeof formDefs.processDxFacade>,
): LayoutWidget {
  return result.form.form as LayoutWidget;
}

describe('DX Pipeline — Event Wiring', () => {
  describe('Input events — onLoad', () => {
    it('wires onLoad callback on a select to on.load with generated event name', () => {
      const loadFn = vi.fn((_event: FormEvent) => undefined);
      const root = processDx([_guiSelect('country', { options: [], onLoad: loadFn })]);

      const select = getStaticChild(root, 0) as any;
      expect(select.kind).toBe('input');
      expect(select.type).toBe('select');
      expect(typeof select.on?.load).toBe('string');
      expect(select.on.load).toMatch(/^event_\d+$/);
    });

    it('wires a zero-arg handler returning a string to on.load (host-managed dispatch)', () => {
      const root = processDx([_guiSelect('country', { options: [], onLoad: () => 'myLoadEvent' })]);

      const select = getStaticChild(root, 0) as any;
      expect(select.on?.load).toBe('myLoadEvent');
    });

    it('registers onLoad callback in event registry and dispatches FormEvent with update', () => {
      const loadFn = vi.fn((_event: FormEvent) => undefined);
      const result = formDefs.processDxFacade(
        [_guiSelect('country', { options: [], onLoad: loadFn })],
        [],
        {},
      );

      expect(result.events).toBeDefined();

      const root = getRootFromFacadeResult(result);
      const select = (root.children ?? []).find(
        (c) => typeof c !== 'function' && (c as any).type === 'select',
      ) as any;

      const mockEvent: FormEvent = {
        name: select.on.load,
        data: { country: 'US' },
        callback: vi.fn(),
      };
      result.events!(mockEvent);

      expect(loadFn).toHaveBeenCalledTimes(1);
      const receivedEvent = loadFn.mock.calls[0][0];
      expect(receivedEvent.name).toBe(mockEvent.name);
      expect(receivedEvent.data).toBe(mockEvent.data);
      expect(typeof receivedEvent.update).toBe('function');
    });
  });

  describe('Input events — onChange', () => {
    it('wires onChange callback on a select to on.change', () => {
      const changeFn = vi.fn((_event: FormEvent) => undefined);
      const root = processDx([_guiSelect('country', { options: [], onChange: changeFn })]);

      const select = getStaticChild(root, 0) as any;
      expect(typeof select.on?.change).toBe('string');
      expect(select.on.change).toMatch(/^event_\d+$/);
    });

    it('wires a zero-arg handler returning a string to on.change (host-managed dispatch)', () => {
      const root = processDx([
        _guiSelect('country', { options: [], onChange: () => 'myChangeEvent' }),
      ]);

      const select = getStaticChild(root, 0) as any;
      expect(select.on?.change).toBe('myChangeEvent');
    });

    it('registers onChange callback and dispatches FormEvent with update', () => {
      const changeFn = vi.fn((_event: FormEvent) => undefined);
      const result = formDefs.processDxFacade(
        [_guiSelect('country', { options: [], onChange: changeFn })],
        [],
        {},
      );

      const root = getRootFromFacadeResult(result);
      const select = (root.children ?? []).find(
        (c) => typeof c !== 'function' && (c as any).type === 'select',
      ) as any;

      const mockEvent: FormEvent = {
        name: select.on.change,
        data: { country: 'FR' },
        detail: 'FR',
        callback: vi.fn(),
      };
      result.events!(mockEvent);

      expect(changeFn).toHaveBeenCalledTimes(1);
      const receivedEvent = changeFn.mock.calls[0][0];
      expect(receivedEvent.name).toBe(mockEvent.name);
      expect(receivedEvent.data).toBe(mockEvent.data);
      expect(receivedEvent.detail).toBe(mockEvent.detail);
      expect(typeof receivedEvent.update).toBe('function');
    });
  });

  describe('Input events — onFilter', () => {
    it('wires onFilter callback on a dropdown to on.filter', () => {
      const filterFn = vi.fn((_event: FormEvent) => undefined);
      const root = processDx([_guiDropdown('product', { items: [], onFilter: filterFn })]);

      const dropdown = getStaticChild(root, 0) as any;
      expect(typeof dropdown.on?.filter).toBe('string');
      expect(dropdown.on.filter).toMatch(/^event_\d+$/);
    });

    it('wires a zero-arg handler returning a string to on.filter (host-managed dispatch)', () => {
      const root = processDx([
        _guiDropdown('product', { items: [], onFilter: () => 'searchProduct' }),
      ]);

      const dropdown = getStaticChild(root, 0) as any;
      expect(dropdown.on?.filter).toBe('searchProduct');
    });
  });

  describe('Multiple events on a single widget', () => {
    it('wires onLoad and onChange on the same select with unique event names', () => {
      const loadFn = vi.fn((_event: FormEvent) => undefined);
      const changeFn = vi.fn((_event: FormEvent) => undefined);
      const root = processDx([
        _guiSelect('country', { options: [], onLoad: loadFn, onChange: changeFn }),
      ]);

      const select = getStaticChild(root, 0) as any;
      expect(typeof select.on?.load).toBe('string');
      expect(typeof select.on?.change).toBe('string');
      expect(select.on.load).not.toBe(select.on.change);
    });

    it('wires onLoad, onChange, and onFilter on a dropdown', () => {
      const loadFn = vi.fn((_event: FormEvent) => undefined);
      const changeFn = vi.fn((_event: FormEvent) => undefined);
      const filterFn = vi.fn((_event: FormEvent) => undefined);
      const root = processDx([
        _guiDropdown('product', {
          items: [],
          onLoad: loadFn,
          onChange: changeFn,
          onFilter: filterFn,
        }),
      ]);

      const dropdown = getStaticChild(root, 0) as any;
      expect(typeof dropdown.on?.load).toBe('string');
      expect(typeof dropdown.on?.change).toBe('string');
      expect(typeof dropdown.on?.filter).toBe('string');

      const names = [dropdown.on.load, dropdown.on.change, dropdown.on.filter];
      expect(new Set(names).size).toBe(3);
    });
  });

  describe('Layout events — onChange', () => {
    it('wires onChange callback on tabs to on.change', () => {
      const changeFn = vi.fn((_event: FormEvent) => undefined);
      const root = processDx([
        _guiTabs(
          [
            { label: 'Tab A', children: [_guiTextInput('name')] },
            { label: 'Tab B', children: [_guiNumberInput('age')] },
          ],
          { onChange: changeFn },
        ),
      ]);

      const tabs = getStaticChild(root, 0) as any;
      expect(tabs.kind).toBe('layout');
      expect(tabs.type).toBe('tabs');
      expect(typeof tabs.on?.change).toBe('string');
      expect(tabs.on.change).toMatch(/^event_\d+$/);
    });

    it('registers tabs onChange callback and dispatches FormEvent with update', () => {
      const changeFn = vi.fn((_event: FormEvent) => undefined);
      const result = formDefs.processDxFacade(
        [
          _guiTabs(
            [
              { label: 'Tab A', children: [_guiTextInput('name')] },
              { label: 'Tab B', children: [_guiNumberInput('age')] },
            ],
            { onChange: changeFn },
          ),
        ],
        [],
        {},
      );

      const root = getRootFromFacadeResult(result);
      const tabs = (root.children ?? []).find(
        (c) => typeof c !== 'function' && (c as any).type === 'tabs',
      ) as any;

      const mockEvent: FormEvent = {
        name: tabs.on.change,
        data: {},
        detail: 1,
        callback: vi.fn(),
      };
      result.events!(mockEvent);

      expect(changeFn).toHaveBeenCalledTimes(1);
      const receivedEvent = changeFn.mock.calls[0][0];
      expect(receivedEvent.name).toBe(mockEvent.name);
      expect(receivedEvent.data).toBe(mockEvent.data);
      expect(receivedEvent.detail).toBe(mockEvent.detail);
      expect(typeof receivedEvent.update).toBe('function');
    });
  });

  describe('Event properties do not leak into widget props', () => {
    it('does not include onLoad/onChange/onFilter in select props', () => {
      const root = processDx([
        _guiSelect('country', {
          options: [],
          onLoad: vi.fn(),
          onChange: vi.fn(),
          onFilter: vi.fn(),
        }),
      ]);

      const select = getStaticChild(root, 0) as any;
      expect(select.props?.onLoad).toBeUndefined();
      expect(select.props?.onChange).toBeUndefined();
      expect(select.props?.onFilter).toBeUndefined();
      expect(select.props?.on).toBeUndefined();
    });

    it('does not include onChange in tabs props', () => {
      const root = processDx([
        _guiTabs([{ label: 'Tab A', children: [_guiTextInput('name')] }], { onChange: vi.fn() }),
      ]);

      const tabs = getStaticChild(root, 0) as any;
      expect(tabs.props?.onChange).toBeUndefined();
      expect(tabs.props?.on).toBeUndefined();
    });
  });

  describe('Coexistence with action onClick', () => {
    it('input events and action onClick use the same event counter', () => {
      const result = formDefs.processDxFacade(
        [
          _guiSelect('country', { options: [], onLoad: vi.fn() }),
          _guiButton({ label: 'Go', onClick: vi.fn() }),
        ],
        [],
        {},
      );

      const root = getRootFromFacadeResult(result);
      const select = (root.children ?? []).find(
        (c) => typeof c !== 'function' && (c as any).type === 'select',
      ) as any;
      const button = (root.children ?? []).find(
        (c) => typeof c !== 'function' && (c as any).kind === 'action',
      ) as any;

      // Both should have event-based names (no collisions)
      expect(select.on?.load).toBeDefined();
      expect(button.on?.click).toBeDefined();
      expect(select.on.load).not.toBe(button.on.click);
    });

    it('action onClick still passes event.data to callback (backward compat)', () => {
      const clickFn = vi.fn();
      const result = formDefs.processDxFacade([_guiButton({ label: 'Go', onClick: clickFn })], []);

      const root = getRootFromFacadeResult(result);
      const button = (root.children ?? []).find(
        (c) => typeof c !== 'function' && (c as any).kind === 'action',
      ) as any;

      result.events!({ name: button.on.click, data: { x: 1 }, callback: vi.fn() });
      expect(clickFn).toHaveBeenCalledWith({ x: 1 });
    });

    it('onClick returning string lands as on.click for host-managed dispatch', () => {
      const result = formDefs.processDxFacade(
        [_guiButton({ label: 'Click me', onClick: () => 'evClick' })],
        [],
        {},
      );

      const root = getRootFromFacadeResult(result);
      const button = (root.children ?? []).find(
        (c) => typeof c !== 'function' && (c as any).kind === 'action',
      ) as any;

      // The DX layer probes the function and uses the returned string as on.click,
      // exactly the shape host applications listen for via formEvent.
      expect(button.on?.click).toBe('evClick');
      // No internal event registry entry — host manages dispatch.
      const clickFn = vi.fn();
      result.events?.({ name: 'evClick', data: {}, callback: clickFn });
      expect(clickFn).not.toHaveBeenCalled();
    });
  });

  describe('Input events — onBlur', () => {
    it('wires onBlur callback to on.blur with generated event name', () => {
      const blurFn = vi.fn((_event: FormEvent) => undefined);
      const root = processDx([_guiTextInput('email', { onBlur: blurFn })]);

      const input = getStaticChild(root, 0) as any;
      expect(input.kind).toBe('input');
      expect(typeof input.on?.blur).toBe('string');
      expect(input.on.blur).toMatch(/^event_\d+$/);
    });

    it('wires a zero-arg handler returning a string to on.blur (host-managed dispatch)', () => {
      const root = processDx([_guiTextInput('email', { onBlur: () => 'myBlurEvent' })]);

      const input = getStaticChild(root, 0) as any;
      expect(input.on?.blur).toBe('myBlurEvent');
    });

    it('registers an imperative handler that reads the event without invoking it at build time', () => {
      const blurFn = vi.fn((event: any) => event.update({ path: 'email' }));
      const root = processDx([_guiTextInput('email', { onBlur: blurFn })]);

      const input = getStaticChild(root, 0) as any;
      // Handler declares the `event` param, so it is registered (generated name), not probed.
      expect(input.on?.blur).toMatch(/^event_\d+$/);
      expect(blurFn).not.toHaveBeenCalled();
    });
  });

  describe('DX update wrapper — event.update({ path, prop: value })', () => {
    it('translates DX-friendly update shape to OVERRIDE_WIDGET_PROP dispatch', () => {
      const changeFn = vi.fn((_event: FormEvent) => undefined);
      const result = formDefs.processDxFacade(
        [
          _guiSelect('country', { options: [], onChange: changeFn }),
          _guiSelect('subregion', { options: [] }),
        ],
        [],
        {},
      );

      const root = getRootFromFacadeResult(result);
      const countrySelect = (root.children ?? []).find(
        (c) => typeof c !== 'function' && (c as any).path === 'country',
      ) as any;

      const rawCallback = vi.fn();
      const mockEvent: FormEvent = {
        name: countrySelect.on.change,
        data: { country: 'FR' },
        callback: rawCallback,
      };
      result.events!(mockEvent);

      // The handler receives a wrapped event
      const wrappedEvent = changeFn.mock.calls[0][0];

      // Simulate what the demo does: event.update({ path: 'subregion', options: [...] })
      const newOptions = [{ label: 'Ile-de-France', value: 'IDF' }];
      wrappedEvent.update({ path: 'subregion', options: newOptions });

      // The raw callback should receive an OVERRIDE_WIDGET_PROP action
      expect(rawCallback).toHaveBeenCalledWith({
        type: 'OVERRIDE_WIDGET_PROP',
        payload: { path: 'subregion', prop: 'options', value: newOptions },
      });
    });

    it('translates multiple props in a single update call', () => {
      const loadFn = vi.fn((_event: FormEvent) => undefined);
      const result = formDefs.processDxFacade(
        [_guiSelect('tz', { options: [], onLoad: loadFn })],
        [],
        {},
      );

      const root = getRootFromFacadeResult(result);
      const select = (root.children ?? []).find(
        (c) => typeof c !== 'function' && (c as any).path === 'tz',
      ) as any;

      const rawCallback = vi.fn();
      result.events!({ name: select.on.load, data: {}, callback: rawCallback });

      const wrappedEvent = loadFn.mock.calls[0][0];
      wrappedEvent.update({ path: 'tz', options: ['UTC'], label: 'Timezone' });

      expect(rawCallback).toHaveBeenCalledTimes(2);
      expect(rawCallback).toHaveBeenCalledWith({
        type: 'OVERRIDE_WIDGET_PROP',
        payload: { path: 'tz', prop: 'options', value: ['UTC'] },
      });
      expect(rawCallback).toHaveBeenCalledWith({
        type: 'OVERRIDE_WIDGET_PROP',
        payload: { path: 'tz', prop: 'label', value: 'Timezone' },
      });
    });

    it('passes through raw OVERRIDE_WIDGET_PROP actions unchanged via callback (backward compat)', () => {
      const changeFn = vi.fn((_event: FormEvent) => undefined);
      const result = formDefs.processDxFacade(
        [_guiSelect('country', { options: [], onChange: changeFn })],
        [],
        {},
      );

      const root = getRootFromFacadeResult(result);
      const select = (root.children ?? []).find(
        (c) => typeof c !== 'function' && (c as any).path === 'country',
      ) as any;

      const rawCallback = vi.fn();
      result.events!({ name: select.on.change, data: {}, callback: rawCallback });

      const wrappedEvent = changeFn.mock.calls[0][0];
      const rawAction = {
        type: 'OVERRIDE_WIDGET_PROP',
        payload: { path: 'country', prop: 'options', value: ['US'] },
      };
      wrappedEvent.callback(rawAction);

      expect(rawCallback).toHaveBeenCalledWith(rawAction);
    });
  });

  describe('Dynamic (callback) widgets with events', () => {
    it('wires onLoad on a dynamic select at runtime', () => {
      const loadFn = vi.fn((_event: FormEvent) => undefined);
      const root = processDx([
        _guiSelect('country', (p: any) => ({
          options: p?.$form?.ready ? ['US'] : [],
          onLoad: loadFn,
        })),
      ]);

      const rawWidget = getRawChild(root, 0);
      expect(typeof rawWidget).toBe('function');

      const resolved = resolveDynamic(rawWidget, { $form: { ready: true } }) as any;
      expect(resolved.kind).toBe('input');
      expect(resolved.type).toBe('select');
      expect(typeof resolved.on?.load).toBe('string');
    });
  });
});
