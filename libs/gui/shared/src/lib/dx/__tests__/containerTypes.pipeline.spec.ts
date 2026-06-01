import { type LayoutWidget } from '@golemui/core';
import { describe, expect, it } from 'vitest';
import { _guiTabs, _guiList, _guiCheckbox, _guiButton, _gslTabs, _gslLists } from '../index';
import { processDx, getStaticChild, getRawChild, resolveDynamic } from './helpers';
import { _guiTextInput } from '../index';

describe('DX Pipeline — Container Types (Phase 6.3)', () => {
  describe('Tabs', () => {
    it('expands _guiTabs into a tabs layout widget', () => {
      const result = processDx(
        _guiTabs([
          { label: 'Tab A', children: [_guiTextInput('name')] },
          { label: 'Tab B', children: [_guiCheckbox('agree')] },
        ]),
      );
      const tabsWidget = getStaticChild(result, 0) as LayoutWidget;

      expect(tabsWidget.kind).toBe('layout');
      expect(tabsWidget.type).toBe('tabs');
    });

    it('derives tab headers from record keys with slugified uids', () => {
      const result = processDx(
        _guiTabs([
          { label: 'Personal Info', children: [_guiTextInput('firstName')] },
          { label: 'Address', children: [_guiTextInput('city')] },
        ]),
      );
      const tabsWidget = getStaticChild(result, 0) as LayoutWidget & {
        props?: { tabs?: Array<{ label: string; uid: string }> };
      };
      const tabs = tabsWidget.props?.tabs;

      expect(tabs).toHaveLength(2);
      expect(tabs?.[0]).toEqual({ label: 'Personal Info', uid: 'personal-info' });
      expect(tabs?.[1]).toEqual({ label: 'Address', uid: 'address' });
    });

    it('wraps each tab content in a flex layout child', () => {
      const result = processDx(
        _guiTabs([
          { label: 'Tab A', children: [_guiTextInput('name')] },
          { label: 'Tab B', children: [_guiCheckbox('agree')] },
        ]),
      );
      const tabsWidget = getStaticChild(result, 0) as LayoutWidget;

      expect(tabsWidget.children).toHaveLength(2);
      expect(tabsWidget.children).toBeDefined();
      const children = tabsWidget.children ?? [];

      const child0 = children[0] as LayoutWidget;
      expect(child0.kind).toBe('layout');
      expect(child0.uid).toBe('tab-a');

      const child1 = children[1] as LayoutWidget;
      expect(child1.kind).toBe('layout');
      expect(child1.uid).toBe('tab-b');
    });

    it('recursively walks tab content widgets', () => {
      const result = processDx(
        _guiTabs([
          { label: 'Details', children: [_guiTextInput('firstName'), _guiTextInput('lastName')] },
        ]),
      );
      const tabsWidget = getStaticChild(result, 0) as LayoutWidget;
      expect(tabsWidget.children).toBeDefined();
      const tabChildren = tabsWidget.children ?? [];
      const tabContent = tabChildren[0] as LayoutWidget;

      expect(tabContent.children).toBeDefined();
      const contentChildren = tabContent.children ?? [];
      expect(contentChildren.length).toBeGreaterThan(0);
      const firstInput = contentChildren[0] as { path?: string };
      expect(firstInput.path).toBe('firstName');
    });

    it('defaults renderMode to all', () => {
      const result = processDx(_guiTabs([{ label: 'A', children: [_guiTextInput('x')] }]));
      const tabsWidget = getStaticChild(result, 0) as {
        props?: { renderMode?: string };
      };

      expect(tabsWidget.props?.renderMode).toBe('all');
    });

    it('accepts custom props (renderMode, defaultOpen)', () => {
      const result = processDx(
        _guiTabs(
          [
            { label: 'Tab A', children: [_guiTextInput('a')] },
            { label: 'Tab B', children: [_guiTextInput('b')] },
          ],
          { renderMode: 'activeOnly', defaultOpen: 'tab-b' },
        ),
      );
      const tabsWidget = getStaticChild(result, 0) as {
        props?: { renderMode?: string; defaultOpen?: string };
      };

      expect(tabsWidget.props?.renderMode).toBe('activeOnly');
      expect(tabsWidget.props?.defaultOpen).toBe('tab-b');
    });

    it('applies GSL selector override', () => {
      const result = processDx(_guiTabs([{ label: 'A', children: [_guiTextInput('x')] }]), [
        _gslTabs({ override: { renderMode: 'activeOnly' } }),
      ]);
      const tabsWidget = getStaticChild(result, 0) as {
        props?: { renderMode?: string };
      };

      expect(tabsWidget.props?.renderMode).toBe('activeOnly');
    });

    it('does not double-add auto-submit when submit button is inside a tab', () => {
      const result = processDx(
        _guiTabs([
          {
            label: 'Main',
            children: [
              _guiTextInput('name'),
              _guiButton({ label: 'Submit', onClick: () => 'submit' }),
            ],
          },
        ]),
      );

      const rootChildren = result.children ?? [];
      expect(rootChildren).toHaveLength(1);
    });
  });

  describe('List', () => {
    const sampleItems = [
      { template: 'Red', value: 'red' },
      { template: 'Blue', value: 'blue' },
      { template: 'Green', value: 'green' },
    ];

    it('expands _guiList into a list input with items', () => {
      const result = processDx(_guiList('colors', { items: sampleItems }));
      const w = getStaticChild(result, 0) as {
        kind?: string;
        type?: string;
        path?: string;
        props?: { items?: typeof sampleItems };
      };

      expect(w.kind).toBe('input');
      expect(w.type).toBe('list');
      expect(w.path).toBe('colors');
      expect(w.props?.items).toEqual(sampleItems);
    });

    it('auto-generates label from path', () => {
      const result = processDx(_guiList('favoriteColors', { items: sampleItems }));
      const w = getStaticChild(result, 0) as { label?: string };

      expect(w.label).toBe('Favorite Colors');
    });

    it('passes items array through to widget props', () => {
      const result = processDx(_guiList('colors', { items: sampleItems }));
      const w = getStaticChild(result, 0) as { props?: { items?: typeof sampleItems } };

      expect(w.props?.items).toEqual(sampleItems);
      expect(w.props?.items).toHaveLength(3);
    });

    it('passes custom props (height, itemHeight)', () => {
      const result = processDx(
        _guiList('colors', {
          items: sampleItems,
          height: 300,
          itemHeight: 40,
        }),
      );
      const w = getStaticChild(result, 0) as {
        props?: { height?: number; itemHeight?: number };
      };

      expect(w.props?.height).toBe(300);
      expect(w.props?.itemHeight).toBe(40);
    });

    it('applies GSL selector override', () => {
      const result = processDx(_guiList('colors', { items: sampleItems }), [
        _gslLists({ override: { hint: 'Pick favorites' } }),
      ]);
      const w = getStaticChild(result, 0) as { props?: { hint?: string } };

      expect(w.props?.hint).toBe('Pick favorites');
    });

    it('supports dynamic callback', () => {
      const result = processDx(
        _guiList('colors', () => ({
          items: [{ template: 'Dynamic', value: 'dyn' }],
        })),
      );
      const raw = getRawChild(result, 0);
      const w = resolveDynamic(raw) as {
        type?: string;
        props?: { items?: Array<{ template: string; value: string }> };
      };

      expect(w.type).toBe('list');
      expect(w.props?.items).toEqual([{ template: 'Dynamic', value: 'dyn' }]);
    });
  });
});
