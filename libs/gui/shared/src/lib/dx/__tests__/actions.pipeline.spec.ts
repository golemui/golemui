import { LayoutWidget } from '@golemui/core';
import { describe, expect, it, vi } from 'vitest';
import { processDx, getRawChild, resolveDynamic } from './helpers';
import { _guiButton } from '../shortcuts/actions/guiActions.impl';
import { formDefs } from '../dx.service';
import { _guiTextInput } from '../index';

function getRootFromFacadeResult(result: ReturnType<typeof formDefs.processDxFacade>): LayoutWidget {
  return result.form.form as LayoutWidget;
}

describe('DX Pipeline — Actions', () => {
  describe('Basic action expansion', () => {
    it('maps explicit onClick button with click event wiring', () => {
      const myFn = () => null;
      const root = processDx([
        _guiTextInput('name'),
        _guiButton({ label: 'Save', onClick: myFn }),
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
      const root = processDx([
        _guiTextInput('name'),
        _guiButton({ label: 'Cancel' }),
      ]);

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
        _guiButton({ label: 'A', onClick: () => null }),
        _guiButton({ label: 'B', onClick: () => null }),
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
    it("promotes onClick: 'submit' action to #submit with submit event", () => {
      const result = formDefs.processDxFacade(
        [_guiButton({ label: 'Go', onClick: 'submit' })],
        [],
        { suppressAutomaticSubmit: true },
      );
      const root = getRootFromFacadeResult(result);
      const submit = root.children?.find(
        (child) => typeof child !== 'function' && (child as { kind?: string }).kind === 'action',
      ) as { uid?: string; on?: { click?: string } };

      expect(submit.uid).toBe('#submit');
      expect(submit.on?.click).toBe('submit');
    });

    it("treats uid '#submit' action as submit and wires submit event", () => {
      const result = formDefs.processDxFacade(
        [_guiButton({ uid: '#submit', label: 'Send' })],
        [],
        { suppressAutomaticSubmit: true },
      );
      const root = getRootFromFacadeResult(result);
      const submit = root.children?.find(
        (child) => typeof child !== 'function' && (child as { uid?: string }).uid === '#submit',
      ) as { on?: { click?: string } };

      expect(submit.on?.click).toBe('submit');
    });

    it('registers root onSubmit callback into form events when submit action is present', () => {
      const submitFn = vi.fn();
      const result = formDefs.processDxFacade(
        [_guiTextInput('name'), _guiButton({ label: 'Go', onClick: 'submit' })],
        [],
        { onSubmit: submitFn, suppressAutomaticSubmit: true },
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
        { onSubmit: submitFn, suppressAutomaticSubmit: true },
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

  describe('Auto-submit injection', () => {
    it('adds auto-submit when no submit button exists', () => {
      const result = formDefs.processDxFacade([_guiTextInput('name')], []);
      const root = getRootFromFacadeResult(result);
      const lastChild = root.children?.[root.children.length - 1] as {
        uid?: string;
        kind?: string;
      };

      expect(lastChild.uid).toBe('#submit');
      expect(lastChild.kind).toBe('action');
    });

    it('does not inject auto-submit when suppressAutomaticSubmit is true', () => {
      const result = formDefs.processDxFacade(
        [_guiTextInput('name')],
        [],
        { suppressAutomaticSubmit: true },
      );
      const root = getRootFromFacadeResult(result);
      const hasSubmit = (root.children ?? []).some(
        (child) => typeof child !== 'function' && (child as { uid?: string }).uid === '#submit',
      );

      expect(hasSubmit).toBe(false);
    });

    it('throws when multiple submit buttons are present', () => {
      expect(() => {
        formDefs.processDxFacade(
          [_guiButton({ onClick: 'submit' }), _guiButton({ onClick: 'submit' })],
          [],
        );
      }).toThrow(/submit/i);
    });
  });

  describe('Dynamic (callback) actions', () => {
    it('keeps callback action dynamic and wires on.click after resolving', () => {
      const myFn = () => null;
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
      const clean = resolveDynamic(rawAction, {}) as {
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
        [_guiButton({ label: 'Go', onClick: () => null })],
        [],
      );

      expect(result.form).toBeDefined();
      expect(result.events).toBeDefined();
      expect(typeof result.events).toBe('function');
    });

    it('omits events from DxResult when no onClick callback is wired', () => {
      const result = formDefs.processDxFacade(
        [_guiTextInput('name')],
        [],
        { suppressAutomaticSubmit: true },
      );

      expect(result.form).toBeDefined();
      expect(result.events).toBeUndefined();
    });

    it('includes dependencies in DxResult when formConfig provides them', () => {
      const mockParse = (md: string) => `<p>${md}</p>`;
      const result = formDefs.processDxFacade(
        [_guiTextInput('name')],
        [],
        { dependencies: { markdown: { parse: mockParse } } },
      );

      expect(result.dependencies).toBeDefined();
      expect(result.dependencies!.markdown!.parse).toBe(mockParse);
    });

    it('omits dependencies from DxResult when formConfig has none', () => {
      const result = formDefs.processDxFacade(
        [_guiTextInput('name')],
        [],
        { suppressAutomaticSubmit: true },
      );

      expect(result.dependencies).toBeUndefined();
    });
  });
});
