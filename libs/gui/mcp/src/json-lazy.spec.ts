import { describe, expect, it } from 'vitest';
import { buildMutationCorpus } from '../tools/testing/mutation-corpus';
import { preload, validateFormDefinitionAsync } from './json-lazy';
import { collectValidatorNeeds } from './json/schemas/lazy-validators';
import { validateFormDefinition } from './json/validate-form-definition';

describe('validateFormDefinitionAsync', () => {
  // The corpus holds every golden input and thousands of mutations of them, so this runs the
  // whole golden suite against the lazy entry too.
  it('returns the same result as validateFormDefinition for every form of the corpus', async () => {
    const mismatches: string[] = [];
    for (const [name, formDefinition] of Object.entries(buildMutationCorpus())) {
      const lazy = await validateFormDefinitionAsync({ formDefinition });
      const sync = validateFormDefinition({ formDefinition });
      if (JSON.stringify(lazy) !== JSON.stringify(sync)) mismatches.push(name);
    }
    expect(mismatches).toEqual([]);
  });

  it('loads only the validators the form needs', () => {
    const needs = collectValidatorNeeds({
      form: [
        {
          kind: 'input',
          type: 'textinput',
          path: 'name',
          validator: { type: 'string', required: true },
        },
        {
          kind: 'input',
          type: 'repeater',
          path: 'rows',
          props: {
            template: {
              kind: 'layout',
              type: 'flex',
              children: [{ kind: 'input', type: 'number', path: 'rows.items.count' }],
            },
            'template.mobile': {
              kind: 'layout',
              type: 'grid',
              children: [{ $ref: './row.form-chunk.json' }],
            },
          },
        },
        { kind: 'input', type: 'myInput', path: 'custom', validator: { type: 'integer' } },
        // Typos resolve to the built-in they are closest to, as the walk does.
        { kind: 'input', type: 'checkbx', path: 'agree' },
      ],
    });
    expect(Object.fromEntries(Object.entries(needs).map(([k, v]) => [k, [...v].sort()]))).toEqual({
      root: [''],
      chunkRef: [''],
      shallowWidget: ['checkbox', 'flex', 'grid', 'number', 'repeater', 'textinput'],
      validatorBranch: ['integer', 'string'],
      customWidget: ['input'],
    });
  });

  it('preloads without validating and ignores unknown widget types', async () => {
    await expect(preload(['textinput', 'notAWidget'])).resolves.toBeUndefined();
    await expect(preload()).resolves.toBeUndefined();
  });

  it('accepts anything as the form definition', async () => {
    for (const formDefinition of [null, undefined, 5, 'x', [], {}]) {
      expect(await validateFormDefinitionAsync({ formDefinition })).toEqual(
        validateFormDefinition({ formDefinition }),
      );
    }
  });
});
