import { describe, expect, it } from 'vitest';
import { processDx, getRawChild, getStaticChild, resolveDynamic } from './helpers';
import { _guiInputs } from '../shortcuts/inputs/guiInputs.impl';
import { _guiDisplay } from '../shortcuts/display/guiDisplay.impl';
import { _gslDisplays } from '../shortcuts/display/register';
import { _gslTag } from '../shortcuts/scopes/gslTag.impl';

describe('DX Pipeline — Displays', () => {
  describe('Basic display behavior', () => {
    it('maps _guiDisplay to a function widget that resolves to renderer display', () => {
      const root = processDx(_guiDisplay(() => 'hello'));
      const rawChild = getRawChild(root, 0);

      expect(typeof rawChild).toBe('function');

      const resolved = resolveDynamic(rawChild) as {
        kind?: string;
        type?: string;
        props?: { render?: unknown };
      };

      expect(resolved.kind).toBe('display');
      expect(resolved.type).toBe('renderer');
      expect(resolved.props?.render).toBeDefined();
    });

    it('resolves render output value from display callback', () => {
      const root = processDx(_guiDisplay(() => 'world'));
      const rawChild = getRawChild(root, 0);
      const resolved = resolveDynamic(rawChild) as { props?: { render?: unknown } };

      expect(resolved.props?.render).toBe('world');
    });
  });

  describe('Always-dynamic wrapping', () => {
    it('keeps display output as a function widget even without GSL overrides', () => {
      const root = processDx(_guiDisplay(() => 'static-content'));
      const rawChild = getRawChild(root, 0);

      expect(typeof rawChild).toBe('function');
    });
  });

  describe('Auto-wrapping plain functions', () => {
    it('auto-wraps plain function defs as display widgets in pipeline', () => {
      const root = processDx([() => 'hello', _guiInputs({ a: 'string' })]);
      const first = getRawChild(root, 0);
      const second = getStaticChild(root, 1) as { kind?: string; path?: string };

      expect(typeof first).toBe('function');
      expect(second.kind).toBe('input');
      expect(second.path).toBe('a');
    });
  });

  describe('GSL tag matching — Phase 2 safety baseline', () => {
    it('processes tagged display with matching _gslTag + _gslDisplays selector', () => {
      const defs = [
        _guiDisplay(() => 'tagged', ['highlight']),
        _guiInputs({ a: 'string' }),
      ];
      const selectors = [
        _gslTag('highlight', _gslDisplays({ decorator: { customProp: 'matched' } as any })),
      ];

      const root = processDx(defs, selectors);
      const rawChild = getRawChild(root, 0);
      expect(typeof rawChild).toBe('function');

      const resolved = resolveDynamic(rawChild) as {
        kind?: string;
        type?: string;
        props?: { render?: unknown };
      };

      expect(resolved.kind).toBe('display');
      expect(resolved.type).toBe('renderer');
      expect(resolved.props?.render).toBe('tagged');
    });

    it('processes untagged display even when tag-scoped selector exists', () => {
      const defs = [
        _guiDisplay(() => 'untagged'),
        _guiInputs({ a: 'string' }),
      ];
      const selectors = [
        _gslTag('highlight', _gslDisplays({ decorator: { customProp: 'matched' } as any })),
      ];

      const root = processDx(defs, selectors);
      const rawChild = getRawChild(root, 0);
      expect(typeof rawChild).toBe('function');

      const resolved = resolveDynamic(rawChild) as {
        kind?: string;
        type?: string;
        props?: { render?: unknown };
      };

      expect(resolved.kind).toBe('display');
      expect(resolved.type).toBe('renderer');
      expect(resolved.props?.render).toBe('untagged');
    });
  });
});
