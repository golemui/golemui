import { describe, expect, it } from 'vitest';
import { processDx, getRawChild, resolveDynamic } from './helpers';
import { _guiButton } from '../shortcuts/actions/guiActions.impl';
import { formDefs } from '../dx.service';
import { _guiTextInput } from '../index';

describe('DX Pipeline — Actions', () => {
  describe('Basic action expansion', () => {
    it('maps explicit onClick button with click event wiring', () => {
      const myFn = () => null;
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
        [_guiButton({ label: 'Go', onClick: () => null })],
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
