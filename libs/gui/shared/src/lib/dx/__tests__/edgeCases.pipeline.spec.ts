import { type LayoutWidget } from '@golemui/core';
import { describe, expect, it } from 'vitest';
import { _guiTextInput } from '../index';
import { _guiButton } from '../shortcuts/actions/guiActions.impl';
import { _guiDisplay } from '../shortcuts/display/guiDisplay.impl';
import { _guiHorizontalFlex, _guiVerticalFlex } from '../shortcuts/layouts/guiFlex.impl';
import { _guiTabs } from '../shortcuts/tabs/guiTabs.impl';
import { getRawChild, getStaticChild, processDx, resolveDynamic } from './helpers';

describe('DX Pipeline — Edge Cases', () => {
  describe('Deeply nested layouts', () => {
    it('recurses through 3+ levels of nested layouts', () => {
      const root = processDx(
        _guiVerticalFlex([_guiHorizontalFlex([_guiVerticalFlex([_guiTextInput('deep')])])]),
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
        _guiTextInput('name'),
        _guiDisplay(() => 'mid'),
        _guiButton({ label: 'Go', onClick: () => undefined }),
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

  describe('Container nesting', () => {
    it('processes tabs nested inside a horizontal flex layout', () => {
      const root = processDx(
        _guiHorizontalFlex([
          _guiTabs([
            { label: 'Tab A', children: [_guiTextInput('a')] },
            { label: 'Tab B', children: [_guiTextInput('b')] },
          ]),
        ]),
      );

      const flex = getStaticChild(root, 0) as LayoutWidget;
      expect(flex.kind).toBe('layout');
      expect(flex.type).toBe('flex');

      const tabs = flex.children?.[0] as LayoutWidget;
      expect(tabs.kind).toBe('layout');
      expect(tabs.type).toBe('tabs');
    });
  });
});
