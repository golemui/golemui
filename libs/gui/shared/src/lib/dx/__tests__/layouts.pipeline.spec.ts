import { LayoutWidget } from '@golemui/core';
import { describe, expect, it } from 'vitest';
import { GuiItemTypes, ValidGuiShortcut } from '../core/dx.domain';
import {
  processDx,
  getStaticChild,
  getRawChild,
  resolveDynamic,
} from './helpers';
import { _guiInputs } from '../shortcuts/inputs/guiInputs.impl';
import {
  _guiHorizontalStack,
  _guiVerticalStack,
  _guiStack,
} from '../shortcuts/layouts/guiStack.impl';
import { _gslLayoutById } from '../shortcuts/layouts/register';

describe('DX Pipeline — Layouts', () => {
  describe('Basic layout structure', () => {
    it('maps _guiHorizontalStack to a horizontal flex layout', () => {
      const root = processDx(_guiHorizontalStack(_guiInputs({ a: 'string' })));
      const layout = getStaticChild(root, 0) as LayoutWidget;

      expect(layout.kind).toBe('layout');
      expect(layout.type).toBe('flex');
      expect((layout.props as { direction?: string }).direction).toBe('row');
    });

    it('maps _guiVerticalStack to a vertical layout', () => {
      const root = processDx(_guiVerticalStack([_guiInputs({ a: 'string' })]));
      const layout = getStaticChild(root, 0) as LayoutWidget;

      expect(layout.kind).toBe('layout');
      expect((layout.props as { direction?: string }).direction).toBe('column');
    });

    it('maps _guiStack direction to layout direction', () => {
      const root = processDx(_guiStack('row', [_guiInputs({ a: 'string' })]));
      const layout = getStaticChild(root, 0) as LayoutWidget;

      expect(layout.kind).toBe('layout');
      expect(layout.type).toBe('flex');
      expect((layout.props as { direction?: string }).direction).toBe('row');
    });
  });

  describe('Children recursion', () => {
    it('recursively maps children inside layout', () => {
      const root = processDx(_guiHorizontalStack(_guiInputs({ a: 'string', b: 'number' })));
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
      const root = processDx(
        _guiVerticalStack([_guiHorizontalStack(_guiInputs({ a: 'string' }))]),
      );
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
            children: [_guiInputs({ a: 'string' })],
          },
        ],
        tags: [],
      };

      const root = processDx(dynamicLayout);
      const rawChild = getRawChild(root, 0);
      expect(typeof rawChild).toBe('function');

      const horizontal = resolveDynamic(rawChild, { $form: { x: true } }) as LayoutWidget;
      const vertical = resolveDynamic(rawChild, {}) as LayoutWidget;

      expect((horizontal.props as { direction?: string }).direction).toBe('row');
      expect((vertical.props as { direction?: string }).direction).toBe('column');
      expect(horizontal.children?.length).toBeGreaterThan(0);
      expect(vertical.children?.length).toBeGreaterThan(0);
    });
  });

  describe('GSL overrides', () => {
    it('applies _gslLayoutById decorator override on matching layout uid', () => {
      const layoutWithId: ValidGuiShortcut = {
        type: 'ITEMS',
        itemType: GuiItemTypes.LAYOUTS,
        items: [
          {
            def: { uid: '#myLayout', direction: 'column' },
            children: [_guiInputs({ a: 'string' })],
          },
        ],
        tags: [],
      };

      const root = processDx(layoutWithId, [_gslLayoutById('#myLayout', {
        decorator: { direction: 'row' },
      })]);
      const layout = getStaticChild(root, 0) as LayoutWidget;

      expect(layout.uid).toBe('#myLayout');
      expect((layout.props as { direction?: string }).direction).toBe('row');
    });
  });
});
