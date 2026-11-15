import { type FormEvent, type LayoutWidget } from '@golemui/core';
import { type DxFormEvent } from '@golemui/dx';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import type { SanitizedHtml } from '../../shared';
import { processDx, getRawChild, getStaticChild, resolveDynamic } from './helpers';
import { _guiButton } from '../shortcuts/actions/guiActions.impl';
import { type ActionDecorator } from '../shortcuts/actions/actions.domain';
import { type DxDefinitionItem } from '../formDef.domain';
import { formDefs } from '../formDefs';
import { _guiCustomAction, _guiTextInput } from '../index';

type ActionClickHandler = NonNullable<ActionDecorator['onClick']>;
type WiredAction = { uid?: string; on?: { click?: string } };

function buildStaticAction(actionItem: DxDefinitionItem) {
  const result = formDefs.processDxFacade([actionItem], []);
  const root = result.form.form as LayoutWidget;
  return { action: getStaticChild(root, 0) as WiredAction, events: result.events };
}

function buildCallbackAction(actionItem: DxDefinitionItem) {
  const result = formDefs.processDxFacade(
    [
      // The form gets its events function only when a handler is registered while the form is
      // built. A callback action registers its handler later, when it is resolved.
      _guiTextInput('name', { onBlur: (_event: DxFormEvent) => undefined }),
      actionItem,
    ],
    [],
  );
  const root = result.form.form as LayoutWidget;
  return { action: resolveDynamic(getRawChild(root, 1)) as WiredAction, events: result.events };
}

const actionForms = [
  {
    form: 'a static button',
    hasOtherHandler: false,
    build: (onClick: ActionClickHandler) =>
      buildStaticAction(_guiButton({ label: 'Save', onClick })),
  },
  {
    form: 'a callback button',
    hasOtherHandler: true,
    build: (onClick: ActionClickHandler) =>
      buildCallbackAction(_guiButton(() => ({ label: 'Save', onClick }))),
  },
  {
    form: 'a static custom action',
    hasOtherHandler: false,
    build: (onClick: ActionClickHandler) =>
      buildStaticAction(_guiCustomAction('matButton', { label: 'Save', onClick })),
  },
  {
    form: 'a callback custom action',
    hasOtherHandler: true,
    build: (onClick: ActionClickHandler) =>
      buildCallbackAction(_guiCustomAction('matButton', () => ({ label: 'Save', onClick }))),
  },
];

describe('DX Pipeline — Actions', () => {
  describe('Basic action expansion', () => {
    it('maps explicit onClick button with click event wiring', () => {
      const root = processDx([
        _guiTextInput('name'),
        _guiButton({ label: 'Save', onClick: () => undefined }),
      ]);

      const saveButton = root.children?.find(
        (child) => typeof child !== 'function' && (child as { kind?: string }).kind === 'action',
      ) as { kind?: string; type?: string; label?: string; on?: { click?: string } };

      expect(saveButton.kind).toBe('action');
      expect(saveButton.type).toBe('button');
      expect(saveButton.label).toBe('Save');
      expect(typeof saveButton.on?.click).toBe('string');
    });

    it('maps button without onClick and does not wire click event', () => {
      const root = processDx([_guiTextInput('name'), _guiButton({ label: 'Cancel' })]);

      const cancelButton = root.children?.find(
        (child) => typeof child !== 'function' && (child as { label?: string }).label === 'Cancel',
      ) as { kind?: string; type?: string; on?: { click?: string } };

      expect(cancelButton.kind).toBe('action');
      expect(cancelButton.type).toBe('button');
      expect(cancelButton.on?.click).toBeUndefined();
    });

    it('wires multiple buttons with unique uids and unique click event names', () => {
      const root = processDx([
        _guiTextInput('name'),
        _guiButton({ label: 'A', onClick: () => undefined }),
        _guiButton({ label: 'B', onClick: () => undefined }),
      ]);

      const actions = (root.children ?? []).filter(
        (child) => typeof child !== 'function' && (child as { kind?: string }).kind === 'action',
      ) as Array<{ uid?: string; on?: { click?: string } }>;

      expect(actions.length).toBe(2);
      expect(actions[0].uid).toBeDefined();
      expect(actions[1].uid).toBeDefined();
      expect(actions[0].uid).not.toBe(actions[1].uid);
      expect(actions[0].on?.click).toBeDefined();
      expect(actions[1].on?.click).toBeDefined();
      expect(actions[0].on?.click).not.toBe(actions[1].on?.click);
    });
  });

  describe('Dynamic (callback) actions', () => {
    it('keeps callback action dynamic and wires on.click after resolving', () => {
      const defs = [
        _guiTextInput('name'),
        _guiButton((p: any) => ({
          label: p?.$form?.dirty ? 'Save*' : 'Save',
          onClick: () => undefined,
        })),
      ];
      const root = processDx(defs);

      const rawAction = getRawChild(root, 1);
      expect(typeof rawAction).toBe('function');

      const dirty = resolveDynamic(rawAction, { $form: { dirty: true } }) as {
        label?: string;
        on?: { click?: string };
      };
      const clean = resolveDynamic(rawAction) as {
        label?: string;
        on?: { click?: string };
      };

      expect(dirty.label).toBe('Save*');
      expect(clean.label).toBe('Save');
      expect(typeof dirty.on?.click).toBe('string');
      expect(typeof clean.on?.click).toBe('string');
    });
  });

  describe('Return type handling', () => {
    it('includes events in DxResult when at least one onClick callback exists', () => {
      const result = formDefs.processDxFacade(
        [_guiButton({ label: 'Go', onClick: () => undefined })],
        [],
      );

      expect(result.form).toBeDefined();
      expect(result.events).toBeDefined();
      expect(typeof result.events).toBe('function');
    });

    it('omits events from DxResult when no onClick callback is wired', () => {
      const result = formDefs.processDxFacade([_guiTextInput('name')], []);

      expect(result.form).toBeDefined();
      expect(result.events).toBeUndefined();
    });

    it('includes dependencies in DxResult when formConfig provides them', () => {
      const mockParse = (md: string) => `<p>${md}</p>` as SanitizedHtml;
      const result = formDefs.processDxFacade([_guiTextInput('name')], [], {
        dependencies: { markdown: { parse: mockParse } },
      });

      expect(result.dependencies).toBeDefined();
      expect(result.dependencies!.markdown!.parse).toBe(mockParse);
    });

    it('omits dependencies from DxResult when formConfig has none', () => {
      const result = formDefs.processDxFacade([_guiTextInput('name')], []);

      expect(result.dependencies).toBeUndefined();
    });
  });

  describe.each(actionForms)('onClick handler of $form', ({ build, hasOtherHandler }) => {
    let warnSpy: MockInstance<typeof console.warn>;

    beforeEach(() => {
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('does not call a handler that reads the data while the form is built', () => {
      const onClick = vi.fn((data: { name: string }) => data.name);

      expect(() => build(onClick)).not.toThrow();
      expect(onClick).not.toHaveBeenCalled();
    });

    it('calls a handler with one parameter only on click, with the form data and the event', () => {
      const onClick = vi.fn((_data: unknown) => undefined);
      const { action, events } = build(onClick);
      expect(onClick).not.toHaveBeenCalled();

      const clickEvent: FormEvent = {
        name: action.on?.click ?? '',
        data: { name: 'Ada' },
        detail: 'clicked',
        row: { index: 1, indexes: [1], path: 'people.1' },
        callback: vi.fn(),
      };
      events?.(clickEvent);

      expect(onClick).toHaveBeenCalledTimes(1);
      const [receivedData, receivedEvent] = onClick.mock.calls[0] as unknown as [
        unknown,
        DxFormEvent,
      ];
      expect(receivedData).toBe(clickEvent.data);
      expect(receivedEvent.name).toBe(clickEvent.name);
      expect(receivedEvent.data).toBe(clickEvent.data);
      expect(receivedEvent.detail).toBe(clickEvent.detail);
      expect(receivedEvent.row).toEqual(clickEvent.row);
      expect(typeof receivedEvent.update).toBe('function');
    });

    it('sends the host event that a handler with no parameters returns, and registers no handler', () => {
      const onClick = vi.fn(() => 'saved');
      const { action, events } = build(onClick);

      expect(action.on?.click).toBe('saved');
      // The build calls a handler with no parameters one time, to read the host event name.
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(typeof events).toBe(hasOtherHandler ? 'function' : 'undefined');

      onClick.mockClear();
      events?.({ name: 'saved', data: {}, callback: vi.fn() });
      events?.({ name: action.uid ?? '', data: {}, callback: vi.fn() });
      expect(onClick).not.toHaveBeenCalled();
    });

    it('registers a handler with one parameter that returns a string, and runs it on click', () => {
      const onClick = vi.fn((_data: unknown) => 'saved');
      const { action, events } = build(onClick);

      expect(action.on?.click).toMatch(/^event_\d+$/);
      expect(action.on?.click).toBe(action.uid);
      expect(onClick).not.toHaveBeenCalled();

      events?.({ name: action.on?.click ?? '', data: {}, callback: vi.fn() });
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('warns one time for two clicks that the string a handler returns on click is ignored', () => {
      const onClick = vi.fn((_data: unknown) => 'saved');
      const { action, events } = build(onClick);
      const clickEvent: FormEvent = { name: action.on?.click ?? '', data: {}, callback: vi.fn() };

      events?.(clickEvent);
      events?.(clickEvent);

      expect(onClick).toHaveBeenCalledTimes(2);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain('onClick');
      expect(warnSpy.mock.calls[0][0]).toContain('"saved"');
    });

    it('does not warn when a handler returns nothing on click', () => {
      const onClick = vi.fn((_data: unknown) => undefined);
      const { action, events } = build(onClick);

      events?.({ name: action.on?.click ?? '', data: {}, callback: vi.fn() });

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('builds the form when a handler with no parameters throws, and registers that handler', () => {
      const onClick = vi.fn((): void => {
        throw new Error('The service is not ready');
      });
      let action: WiredAction | undefined;

      expect(() => {
        action = build(onClick).action;
      }).not.toThrow();
      expect(action?.on?.click).toMatch(/^event_\d+$/);
      expect(action?.on?.click).toBe(action?.uid);
    });
  });
});
