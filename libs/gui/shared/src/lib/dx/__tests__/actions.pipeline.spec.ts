import { type LayoutWidget } from '@golemui/core';
import { describe, expect, it, vi } from 'vitest';
import { formDefs } from '../dx.service';
import { _guiTextInput } from '../index';
import { _guiButton, _guiSubmitButton } from '../shortcuts/actions/guiActions.impl';
import { getRawChild, processDx, resolveDynamic } from './helpers';

function getRootFromFacadeResult(
  result: ReturnType<typeof formDefs.processDxFacade>,
): LayoutWidget {
  return result.form.form as LayoutWidget;
}

describe('DX Pipeline — Actions', () => {
  describe('Basic action expansion', () => {
    it('maps explicit onClick button with click event wiring', () => {
      const myFn = () => undefined;
      const root = processDx([_guiTextInput('name'), _guiButton({ label: 'Save', onClick: myFn })]);

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

  describe('Submit button handling', () => {
    it('_guiSubmitButton wires uid and on.click: submit', () => {
      const result = formDefs.processDxFacade([_guiSubmitButton({ label: 'Go' })], [], {});
      const root = getRootFromFacadeResult(result);
      const submit = root.children?.find(
        (child) => typeof child !== 'function' && (child as { kind?: string }).kind === 'action',
      ) as { uid?: string; on?: { click?: string } };

      expect(submit.uid).toBe('#submit');
      expect(submit.on?.click).toBe('submit');
    });

    it('plain _guiButton with uid #submit does NOT get submit wiring', () => {
      const result = formDefs.processDxFacade([_guiButton({ uid: '#submit', label: 'Send' })], []);
      const root = getRootFromFacadeResult(result);
      const btn = root.children?.find(
        (child) => typeof child !== 'function' && (child as { kind?: string }).kind === 'action',
      ) as { uid?: string; on?: { click?: string } };

      expect(btn.on?.click).not.toBe('submit');
    });

    it('registers root onSubmit callback into form events when _guiSubmitButton is present', () => {
      const submitFn = vi.fn();
      const result = formDefs.processDxFacade(
        [_guiTextInput('name'), _guiSubmitButton({ label: 'Go' })],
        [],
        { onSubmit: submitFn },
      );

      expect(result.events).toBeDefined();
      expect(typeof result.events).toBe('function');

      result.events!({ name: 'submit', data: { ok: true }, callback: vi.fn() });
      expect(submitFn).toHaveBeenCalledWith({ ok: true });
    });

    it('uses explicit onClick callback instead of root onSubmit', () => {
      const myFn = vi.fn();
      const submitFn = vi.fn();
      const result = formDefs.processDxFacade(
        [_guiTextInput('name'), _guiButton({ label: 'Custom', onClick: myFn })],
        [],
        { onSubmit: submitFn },
      );

      expect(result.events).toBeDefined();
      const root = result.form.form as LayoutWidget;
      const customButton = root.children?.find(
        (child) => typeof child !== 'function' && (child as { label?: string }).label === 'Custom',
      ) as { on?: { click?: string } };

      expect(typeof customButton.on?.click).toBe('string');
      result.events!({ name: customButton.on?.click ?? '', data: { a: 1 }, callback: vi.fn() });

      expect(myFn).toHaveBeenCalledWith({ a: 1 });
      expect(submitFn).not.toHaveBeenCalled();
    });
  });

  describe('Return-value dispatch', () => {
    it('onClick returning a registered event name dispatches to its handler', () => {
      const submitFn = vi.fn();
      const result = formDefs.processDxFacade(
        [
          _guiTextInput('x'),
          _guiSubmitButton({ label: 'S' }),
          _guiButton({ label: 'Trigger', onClick: () => 'submit' }),
        ],
        [],
        { onSubmit: submitFn },
      );
      const root = result.form.form as LayoutWidget;
      const triggerBtn = root.children?.find(
        (c) => typeof c !== 'function' && (c as any).label === 'Trigger',
      ) as any;

      result.events!({ name: triggerBtn.on.click, data: { x: 1 }, callback: vi.fn() });
      expect(submitFn).toHaveBeenCalledWith({ x: 1 });
    });

    it('onClick returning an unregistered name is a no-op', () => {
      const result = formDefs.processDxFacade(
        [_guiButton({ label: 'Go', onClick: () => 'ghost' })],
        [],
      );
      const root = result.form.form as LayoutWidget;
      const btn = root.children?.find(
        (c) => typeof c !== 'function' && (c as any).label === 'Go',
      ) as any;
      const cb = vi.fn();

      expect(result.events).toBeDefined();
      result.events?.({ name: btn.on.click, data: {}, callback: cb });
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe('No auto-submit', () => {
    it('does not inject a submit button when none is declared', () => {
      const result = formDefs.processDxFacade([_guiTextInput('name')], []);
      const root = getRootFromFacadeResult(result);
      const hasSubmit = (root.children ?? []).some(
        (child) => typeof child !== 'function' && (child as { uid?: string }).uid === '#submit',
      );

      expect(hasSubmit).toBe(false);
    });
  });

  describe('Dynamic (callback) actions', () => {
    it('keeps callback action dynamic and wires on.click after resolving', () => {
      const myFn = () => undefined;
      const defs = [
        _guiTextInput('name'),
        _guiButton((p: any) => ({
          label: p?.$form?.dirty ? 'Save*' : 'Save',
          onClick: myFn,
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
      const mockParse = (md: string) => `<p>${md}</p>`;
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
});
