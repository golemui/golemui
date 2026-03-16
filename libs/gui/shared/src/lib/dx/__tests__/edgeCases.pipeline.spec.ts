import { LayoutWidget } from '@golemui/core';
import { describe, expect, it } from 'vitest';
import { processDx, getStaticChild, getRawChild, resolveDynamic } from './helpers';
import { _guiInputs } from '../shortcuts/inputs/guiInputs.impl';
import { _guiDisplay } from '../shortcuts/display/guiDisplay.impl';
import { _guiButton } from '../shortcuts/actions/guiActions.impl';
import {
  _guiHorizontalStack,
  _guiVerticalStack,
} from '../shortcuts/layouts/guiStack.impl';
import { _guiTabs } from '../shortcuts/tabs/guiTabs.impl';
import { formDefs } from '../dx.service';

describe('DX Pipeline — Edge Cases', () => {
  describe('Deeply nested layouts', () => {
    it('recurses through 3+ levels of nested layouts', () => {
      const root = processDx(
        _guiVerticalStack([
          _guiHorizontalStack(
            _guiVerticalStack([_guiInputs({ deep: 'string' })]),
          ),
        ]),
      );

      const level1 = getStaticChild(root, 0) as LayoutWidget;
      const level2 = level1.children?.[0] as LayoutWidget;
      const level3 = level2.children?.[0] as LayoutWidget;
      const leaf = level3.children?.[0] as { kind?: string; path?: string };

      expect(level1.kind).toBe('layout');
      expect(level2.kind).toBe('layout');
      expect(level3.kind).toBe('layout');
      expect(leaf.kind).toBe('input');
      expect(leaf.path).toBe('deep');
    });
  });

  describe('Mixed static and dynamic children', () => {
    it('preserves order of static inputs, dynamic display, and static button', () => {
      const root = processDx([
        _guiInputs({ name: 'string' }),
        _guiDisplay(() => 'mid'),
        _guiButton({ label: 'Go', onClick: () => null }),
      ]);

      // child 0: static input
      const input = getStaticChild(root, 0) as { kind?: string; path?: string };
      expect(input.kind).toBe('input');
      expect(input.path).toBe('name');

      // child 1: dynamic display
      const rawDisplay = getRawChild(root, 1);
      expect(typeof rawDisplay).toBe('function');
      const display = resolveDynamic(rawDisplay) as { kind?: string };
      expect(display.kind).toBe('display');

      // child 2: static action button
      const button = getStaticChild(root, 2) as { kind?: string; label?: string };
      expect(button.kind).toBe('action');
      expect(button.label).toBe('Go');
    });
  });

  describe('Display-only form', () => {
    it('auto-injects submit button even when form has no inputs', () => {
      const { form } = formDefs.processDxFacade([_guiDisplay(() => 'info')], []);
      const root = form.form as LayoutWidget;
      const lastChild = root.children?.[root.children.length - 1] as {
        uid?: string;
        kind?: string;
      };

      expect(lastChild.uid).toBe('#submit');
      expect(lastChild.kind).toBe('action');
    });
  });

  describe('Container nesting', () => {
    it('processes tabs nested inside a horizontal stack', () => {
      const root = processDx(
        _guiHorizontalStack(
          _guiTabs({
            'Tab A': [_guiInputs({ a: 'string' })],
            'Tab B': [_guiInputs({ b: 'string' })],
          }),
        ),
      );

      const stack = getStaticChild(root, 0) as LayoutWidget;
      expect(stack.kind).toBe('layout');
      expect(stack.type).toBe('flex');

      const tabs = stack.children?.[0] as LayoutWidget;
      expect(tabs.kind).toBe('layout');
      expect(tabs.type).toBe('tabs');
    });
  });
});
