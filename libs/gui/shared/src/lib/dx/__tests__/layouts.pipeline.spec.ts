import { type LayoutWidget } from '@golemui/core';
import { describe, expect, it } from 'vitest';
import { GuiItemTypes, type ValidGuiShortcut } from '@golemui/dx';
import { processDx, getStaticChild, getRawChild, resolveDynamic } from './helpers';
import { _guiHorizontalFlex, _guiVerticalFlex, _guiFlex } from '../shortcuts/layouts/guiFlex.impl';
import { _gslLayoutByUid } from '../shortcuts/layouts/register';
import { _guiTextInput, _guiNumberInput } from '../index';

describe('DX Pipeline — Layouts', () => {
  describe('Basic layout structure', () => {
    it('maps _guiHorizontalFlex to a horizontal flex layout', () => {
      const root = processDx(_guiHorizontalFlex([_guiTextInput('a')]));
      const layout = getStaticChild(root, 0) as LayoutWidget;

      expect(layout.kind).toBe('layout');
      expect(layout.type).toBe('flex');
      expect((layout.props as { direction?: string }).direction).toBe('row');
    });

    it('maps _guiVerticalFlex to a vertical layout', () => {
      const root = processDx(_guiVerticalFlex([_guiTextInput('a')]));
      const layout = getStaticChild(root, 0) as LayoutWidget;

      expect(layout.kind).toBe('layout');
      expect((layout.props as { direction?: string }).direction).toBe('column');
    });

    it('maps _guiFlex direction prop to layout direction', () => {
      const root = processDx(_guiFlex([_guiTextInput('a')], { direction: 'row' }));
      const layout = getStaticChild(root, 0) as LayoutWidget;

      expect(layout.kind).toBe('layout');
      expect(layout.type).toBe('flex');
      expect((layout.props as { direction?: string }).direction).toBe('row');
    });
  });

  describe('Children recursion', () => {
    it('recursively maps children inside layout', () => {
      const root = processDx(_guiHorizontalFlex([_guiTextInput('a'), _guiNumberInput('b')]));
      const innerLayout = getStaticChild(root, 0) as LayoutWidget;
      const first = innerLayout.children?.[0] as { kind?: string; path?: string };
      const second = innerLayout.children?.[1] as { kind?: string; path?: string };

      expect(innerLayout.children?.length).toBe(2);
      expect(first.kind).toBe('input');
      expect(second.kind).toBe('input');
      expect(first.path).toBe('a');
      expect(second.path).toBe('b');
    });

    it('supports nested layouts and preserves hierarchy', () => {
      const root = processDx(_guiVerticalFlex([_guiHorizontalFlex([_guiTextInput('a')])]));
      const outer = getStaticChild(root, 0) as LayoutWidget;
      const inner = outer.children?.[0] as LayoutWidget;
      const leaf = inner.children?.[0] as { kind?: string; path?: string };

      expect((outer.props as { direction?: string }).direction).toBe('column');
      expect(inner.kind).toBe('layout');
      expect((inner.props as { direction?: string }).direction).toBe('row');
      expect(leaf.kind).toBe('input');
      expect(leaf.path).toBe('a');
    });
  });

  describe('Dynamic layouts', () => {
    it('keeps callback layout dynamic and attaches mapped children after resolving', () => {
      const dynamicLayout: ValidGuiShortcut = {
        type: 'ITEMS',
        itemType: GuiItemTypes.LAYOUTS,
        items: [
          {
            def: (params: any) => ({
              direction: params?.$form?.x ? 'row' : 'column',
            }),
            children: [_guiTextInput('a')],
          },
        ],
        tags: [],
      };

      const root = processDx(dynamicLayout);
      const rawChild = getRawChild(root, 0);
      expect(typeof rawChild).toBe('function');

      const horizontal = resolveDynamic(rawChild, { $form: { x: true } }) as LayoutWidget;
      const vertical = resolveDynamic(rawChild) as LayoutWidget;

      expect((horizontal.props as { direction?: string }).direction).toBe('row');
      expect((vertical.props as { direction?: string }).direction).toBe('column');
      expect(horizontal.children?.length).toBeGreaterThan(0);
      expect(vertical.children?.length).toBeGreaterThan(0);
    });
  });

  describe('GSL overrides', () => {
    it('applies _gslLayoutByUid decorator override on matching layout uid', () => {
      const layoutWithId: ValidGuiShortcut = {
        type: 'ITEMS',
        itemType: GuiItemTypes.LAYOUTS,
        items: [
          {
            def: { uid: '#myLayout', direction: 'column' },
            children: [_guiTextInput('a')],
          },
        ],
        tags: [],
      };

      const root = processDx(layoutWithId, [
        _gslLayoutByUid('#myLayout', {
          override: { direction: 'row' },
        }),
      ]);
      const layout = getStaticChild(root, 0) as LayoutWidget;

      expect(layout.uid).toBe('#myLayout');
      expect((layout.props as { direction?: string }).direction).toBe('row');
    });
  });
});
