import { describe, expect, it } from 'vitest';
import {
  processDx,
  getStaticChild,
  getRawChild,
  resolveDynamic,
} from './helpers';
import { _guiTextInput } from '../shortcuts/inputs/guiTextInput.impl';
import { _gslInputs } from '../shortcuts/inputs/register';
import { _guiNumberInput, _guiBooleanInput } from '../index';

describe('DX Pipeline — Inputs', () => {
  describe('Basic shortcut expansion', () => {
    it("expands 'string' into a text input with path", () => {
      const result = processDx(_guiTextInput('name'));
      const input = getStaticChild(result, 0) as {
        kind?: string;
        type?: string;
        path?: string;
      };

      expect(input.kind).toBe('input');
      expect(input.type).toBe('textinput');
      expect(input.path).toBe('name');
    });

    it("expands 'number' into a number input with path", () => {
      const result = processDx(_guiNumberInput('age'));
      const input = getStaticChild(result, 0) as { type?: string; path?: string };

      expect(input.type).toBe('number');
      expect(input.path).toBe('age');
    });

    it("expands 'boolean' into a toggle input with path", () => {
      const result = processDx(_guiBooleanInput('active'));
      const input = getStaticChild(result, 0) as { type?: string; path?: string };

      expect(input.type).toBe('toggle');
      expect(input.path).toBe('active');
    });

    it('preserves placeholder from _guiTextInput props', () => {
      const result = processDx(
        _guiTextInput('email', { placeholder: 'you@...' }),
      );
      const input = getStaticChild(result, 0) as {
        props?: { placeholder?: string };
      };

      expect(input.props?.placeholder).toBe('you@...');
    });

    it('expands multiple fields into multiple child widgets with matching paths', () => {
      const result = processDx([_guiTextInput('first'), _guiTextInput('last')]);
      const first = getStaticChild(result, 0) as { path?: string };
      const last = getStaticChild(result, 1) as { path?: string };

      expect(result.children?.length).toBe(2);
      expect(first.path).toBe('first');
      expect(last.path).toBe('last');
    });
  });

  describe('Sensible defaults', () => {
    it('auto-generates label from key (camelCase to Title Case)', () => {
      const result = processDx(_guiTextInput('firstName'));
      const input = getStaticChild(result, 0) as { label?: string };

      expect(input.label).toBe('First Name');
    });

    it('auto-generates placeholder from key', () => {
      const result = processDx(_guiTextInput('firstName'));
      const input = getStaticChild(result, 0) as {
        props?: { placeholder?: string };
      };

      expect(input.props?.placeholder).toBeDefined();
      expect(input.props?.placeholder).not.toBe('');
    });

    it('keeps explicit label set via _guiTextInput', () => {
      const result = processDx(
        _guiTextInput('name', { label: 'Your Name' }),
      );
      const input = getStaticChild(result, 0) as { label?: string };

      expect(input.label).toBe('Your Name');
    });

    it('suppresses automatic labels through GSL config', () => {
      const result = processDx(
        _guiTextInput('name'),
        _gslInputs({ suppressAutomaticLabels: true }),
      );
      const input = getStaticChild(result, 0) as { label?: string };

      expect(input.label).toBeUndefined();
    });
  });

  describe('Dynamic (callback) inputs', () => {
    it('keeps _guiTextInput callback inputs as function widgets and resolves by runtime params', () => {
      const result = processDx(
        _guiTextInput('msg', (p) => ({
          label: p.errors?.length ? 'Fix!' : 'Msg',
        })),
      );

      const rawChild = getRawChild(result, 0);
      expect(typeof rawChild).toBe('function');

      const withErrors = resolveDynamic(rawChild, { errors: ['x'] }) as { label?: string };
      const withoutErrors = resolveDynamic(rawChild, {}) as { label?: string };

      expect(withErrors.label).toBe('Fix!');
      expect(withoutErrors.label).toBe('Msg');
    });
  });

  describe('Validators', () => {
    it('keeps explicit validator settings from _guiTextInput props', () => {
      const result = processDx(
        _guiTextInput('email', {
          validator: {
            pattern: '^[^@]+@[^@]+$',
          },
        }),
      );
      const input = getStaticChild(result, 0) as {
        validator?: { pattern?: string };
      };

      expect(input.validator?.pattern).toBe('^[^@]+@[^@]+$');
    });
  });

  describe('GSL selector overrides', () => {
    it('applies static GSL decorator override to placeholder', () => {
      const result = processDx(
        _guiTextInput('name'),
        [_gslInputs({ override: { placeholder: 'Override' } })],
      );
      const input = getStaticChild(result, 0) as {
        props?: { placeholder?: string };
      };

      expect(input.props?.placeholder).toBe('Override');
    });
  });
});
