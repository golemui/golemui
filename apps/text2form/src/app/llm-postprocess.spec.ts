import { describe, expect, it, vi } from 'vitest';

import {
  flatToGolemForm,
  parseLlmResponse,
  type GolemWidget,
  type LlmElement,
  type LlmFlatOutput,
} from './llm-postprocess';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const textinput = (uid: string, path: string, label?: string): LlmElement => ({
  uid,
  kind: 'input',
  type: 'textinput',
  path,
  ...(label ? { label } : {}),
});

const button = (uid: string, label: string): LlmElement => ({
  uid,
  kind: 'action',
  type: 'button',
  label,
});

const flex = (uid: string, children: string[]): LlmFlatOutput['elements'][string] => ({
  uid,
  kind: 'layout',
  type: 'flex',
  children,
});

// ---------------------------------------------------------------------------
// flatToGolemForm
// ---------------------------------------------------------------------------

describe('flatToGolemForm', () => {
  describe('plain wrapper unwrapping', () => {
    it('unwraps a bare root flex so form contains the children directly', () => {
      const input: LlmFlatOutput = {
        root: 'root',
        elements: {
          root: flex('root', ['email', 'submit']),
          email: textinput('email', 'email', 'Email'),
          submit: button('submit', 'Sign In'),
        },
      };

      const { form } = flatToGolemForm(input);

      expect(form).toHaveLength(2);
      expect(form[0]).toMatchObject({ uid: 'email', kind: 'input', type: 'textinput' });
      expect(form[1]).toMatchObject({ uid: 'submit', kind: 'action', type: 'button' });
    });

    it('keeps a flex as the root when it has props', () => {
      const input: LlmFlatOutput = {
        root: 'root',
        elements: {
          root: { ...flex('root', ['email']), props: { gap: 2 } },
          email: textinput('email', 'email'),
        },
      };

      const { form } = flatToGolemForm(input);

      expect(form).toHaveLength(1);
      expect(form[0].type).toBe('flex');
    });

    it('keeps a flex as the root when it has a size', () => {
      const input: LlmFlatOutput = {
        root: 'root',
        elements: {
          root: { ...flex('root', ['email']), size: 6 },
          email: textinput('email', 'email'),
        },
      };

      const { form } = flatToGolemForm(input);

      expect(form[0].type).toBe('flex');
    });

    it('keeps a non-flex root as is', () => {
      const input: LlmFlatOutput = {
        root: 'field',
        elements: { field: textinput('field', 'name', 'Name') },
      };

      const { form } = flatToGolemForm(input);

      expect(form).toHaveLength(1);
      expect(form[0]).toMatchObject({ uid: 'field', type: 'textinput' });
    });
  });

  describe('nested resolution', () => {
    it('resolves deeply nested flexs', () => {
      const input: LlmFlatOutput = {
        root: 'outer',
        elements: {
          outer: flex('outer', ['inner']),
          inner: flex('inner', ['field']),
          field: textinput('field', 'name'),
        },
      };

      const { form } = flatToGolemForm(input);
      // outer is a plain wrapper -> unwrapped, inner becomes form[0]
      const inner = form[0] as GolemWidget & { children: GolemWidget[] };
      expect(inner.type).toBe('flex');
      expect(inner.children).toHaveLength(1);
      expect(inner.children[0]).toMatchObject({ uid: 'field', type: 'textinput' });
    });

    it('preserves all widget fields during resolution', () => {
      const input: LlmFlatOutput = {
        root: 'root',
        elements: {
          root: flex('root', ['field']),
          field: {
            uid: 'field',
            kind: 'input',
            type: 'textinput',
            path: 'user.email',
            label: 'Email',
            disabled: true,
            props: { placeholder: 'you@example.com', hint: 'Work email' },
          },
        },
      };

      const { form } = flatToGolemForm(input);
      expect(form[0]).toMatchObject({
        uid: 'field',
        path: 'user.email',
        label: 'Email',
        disabled: true,
        props: { placeholder: 'you@example.com', hint: 'Work email' },
      });
    });

    it('drops the children field on non-layout widgets even if present', () => {
      const input: LlmFlatOutput = {
        root: 'root',
        elements: {
          root: flex('root', ['btn']),
          btn: { uid: 'btn', kind: 'action', type: 'button', label: 'Go', children: ['orphan'] },
        },
      };

      const { form } = flatToGolemForm(input);
      expect((form[0] as GolemWidget & { children?: unknown }).children).toBeUndefined();
    });

    it('handles a layout widget with no children array', () => {
      const input: LlmFlatOutput = {
        root: 'root',
        elements: {
          root: { uid: 'root', kind: 'layout', type: 'flex' } as LlmFlatOutput['elements'][string],
        },
      };

      // Should not throw, plain wrapper with no children unwraps to empty form
      const { form } = flatToGolemForm(input);
      expect(form).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('returns empty form when root uid does not exist', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      const { form } = flatToGolemForm({ root: 'missing', elements: {} });

      expect(form).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"missing"'));
      consoleSpy.mockRestore();
    });

    it('skips a child uid that does not exist in elements', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      const input: LlmFlatOutput = {
        root: 'root',
        elements: {
          root: flex('root', ['exists', 'ghost']),
          exists: textinput('exists', 'name'),
        },
      };

      const { form } = flatToGolemForm(input);
      expect(form).toHaveLength(1);
      expect(form[0]).toMatchObject({ uid: 'exists' });
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"ghost"'));
      consoleSpy.mockRestore();
    });

    it('breaks cycles and warns', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      const input: LlmFlatOutput = {
        root: 'a',
        elements: {
          a: flex('a', ['b']),
          b: flex('b', ['a']), // cycle: b -> a
        },
      };

      // Should not throw or hang
      const { form } = flatToGolemForm(input);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Cycle'));
      consoleSpy.mockRestore();

      // b is kept (it's a valid layout), but its child 'a' is skipped
      const bWidget = form[0] as GolemWidget & { children: GolemWidget[] };
      expect(bWidget.type).toBe('flex');
      expect(bWidget.children).toHaveLength(0);
    });

    it('allows diamond references (same uid reachable via two paths)', () => {
      // a -> [b, c], b -> [d], c -> [d]  — d appears in two branches
      const input: LlmFlatOutput = {
        root: 'a',
        elements: {
          a: flex('a', ['b', 'c']),
          b: flex('b', ['d']),
          c: flex('c', ['d']),
          d: textinput('d', 'shared'),
        },
      };

      const { form } = flatToGolemForm(input);
      // a is a plain wrapper -> unwrapped -> form = [b, c]
      const b = form[0] as GolemWidget & { children: GolemWidget[] };
      const c = form[1] as GolemWidget & { children: GolemWidget[] };
      // Both branches can resolve d independently
      expect(b.children[0]).toMatchObject({ uid: 'd' });
      expect(c.children[0]).toMatchObject({ uid: 'd' });
    });
  });

  describe('include / exclude / on fields', () => {
    it('preserves include condition on a widget', () => {
      const input: LlmFlatOutput = {
        root: 'root',
        elements: {
          root: flex('root', ['code']),
          code: {
            uid: 'code',
            kind: 'input',
            type: 'textinput',
            path: 'adminCode',
            include: { when: "$form.role === 'admin'" },
          },
        },
      };

      const { form } = flatToGolemForm(input);
      expect(form[0]).toMatchObject({ include: { when: "$form.role === 'admin'" } });
    });

    it('preserves on event handlers', () => {
      const input: LlmFlatOutput = {
        root: 'root',
        elements: {
          root: flex('root', ['btn']),
          btn: {
            uid: 'btn',
            kind: 'action',
            type: 'button',
            label: 'Submit',
            on: { click: 'submit' },
          },
        },
      };

      const { form } = flatToGolemForm(input);
      expect(form[0]).toMatchObject({ on: { click: 'submit' } });
    });
  });
});

// ---------------------------------------------------------------------------
// parseLlmResponse
// ---------------------------------------------------------------------------

describe('parseLlmResponse', () => {
  it('parses a JSON string and returns the resolved form', () => {
    const llmOutput: LlmFlatOutput = {
      root: 'root',
      elements: {
        root: flex('root', ['name']),
        name: textinput('name', 'name', 'Name'),
      },
    };

    const { form } = parseLlmResponse(JSON.stringify(llmOutput));
    expect(form).toHaveLength(1);
    expect(form[0]).toMatchObject({ uid: 'name', type: 'textinput' });
  });

  it('throws on malformed JSON', () => {
    expect(() => parseLlmResponse('not json')).toThrow();
  });
});
